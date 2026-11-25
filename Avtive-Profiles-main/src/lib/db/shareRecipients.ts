import { ShareRecipientAssociation } from '@/types/sharing';
import { getMongoDb, COLLECTIONS } from './client';
import { lazyEnsureIndexes } from './indexes';
import { getUserConnections } from './connections';

export const DEFAULT_EVENT_LABELS = [
  'Colleagues',
  'Clients',
  'Business Contacts',
  'Networking Event',
  'Expo 2027'
];

/**
 * Fetches real saved contacts/connections and company colleagues for the signed-in owner.
 * Never returns fabricated or placeholder contacts.
 */
export async function getShareRecipientsForUser(
  userId: string,
  searchQuery?: string
): Promise<{
  recipients: ShareRecipientAssociation[];
  availableLabels: string[];
}> {
  if (!userId) {
    return { recipients: [], availableLabels: [...DEFAULT_EVENT_LABELS] };
  }

  await lazyEnsureIndexes();
  const db = await getMongoDb();

  const connections = await getUserConnections(userId);
  const recipientMap = new Map<string, ShareRecipientAssociation>();
  const labelsSet = new Set<string>(DEFAULT_EVENT_LABELS);

  // Collect related profile IDs and user IDs to enrich real company/designation/avatar data
  const profileIdsToLookup = new Set<string>();
  const userIdsToLookup = new Set<string>();

  for (const conn of connections) {
    if (conn.fromUserId === userId) {
      if (conn.toProfileId) profileIdsToLookup.add(conn.toProfileId);
      if (conn.toUserId && conn.toUserId !== userId) userIdsToLookup.add(conn.toUserId);
    } else if (conn.toUserId === userId) {
      if (conn.fromUserId && !conn.fromUserId.startsWith('visitor-')) {
        userIdsToLookup.add(conn.fromUserId);
      }
    }
  }

  // Also look up company colleagues via user's memberships
  const memberships = await db
    .collection(COLLECTIONS.COMPANY_MEMBERS)
    .find({ userId, status: { $ne: 'REMOVED' } })
    .toArray();
  const companyIds = memberships.map((m) => String(m.companyId)).filter(Boolean);

  const companyColleagues =
    companyIds.length > 0
      ? await db
          .collection(COLLECTIONS.COMPANY_MEMBERS)
          .find({
            companyId: { $in: companyIds },
            status: { $ne: 'REMOVED' },
            userId: { $ne: userId }
          })
          .toArray()
      : [];

  for (const colMember of companyColleagues) {
    if (colMember.userId) userIdsToLookup.add(String(colMember.userId));
    if (colMember.profileId) profileIdsToLookup.add(String(colMember.profileId));
  }

  // Lookup profiles in one batch query
  const profilesById = new Map<string, any>();
  const profilesByUserId = new Map<string, any>();

  if (profileIdsToLookup.size > 0 || userIdsToLookup.size > 0) {
    const profileDocs = await db
      .collection(COLLECTIONS.PROFILES)
      .find({
        $or: [
          ...(profileIdsToLookup.size > 0 ? [{ id: { $in: Array.from(profileIdsToLookup) } }] : []),
          ...(userIdsToLookup.size > 0 ? [{ userId: { $in: Array.from(userIdsToLookup) } }] : [])
        ]
      })
      .toArray();

    for (const p of profileDocs) {
      profilesById.set(String(p.id || p._id), p);
      if (p.slug) profilesById.set(String(p.slug), p);
      if (p.userId) profilesByUserId.set(String(p.userId), p);
    }
  }

  // Assemble connection recipients
  for (const conn of connections) {
    const isOutgoing = conn.fromUserId === userId;
    if (isOutgoing) {
      const targetProfile = profilesById.get(conn.toProfileId) || (conn.toUserId ? profilesByUserId.get(conn.toUserId) : null);
      const recId = `conn-${conn.toProfileId || conn.toUserId || conn.id}`;
      const name = targetProfile?.name || targetProfile?.profileName;
      if (!name) continue;

      const labelList = ['Business Contacts'];
      recipientMap.set(recId, {
        id: recId,
        name: String(name),
        email: targetProfile?.email || undefined,
        company: targetProfile?.company || targetProfile?.companyName || undefined,
        designation: targetProfile?.designation || targetProfile?.professionalTitle || undefined,
        avatar: targetProfile?.avatar || undefined,
        source: 'connection',
        labels: labelList
      });
    } else {
      // Incoming connection (either signed-in user or visitor contact exchange)
      const counterpartProfile = conn.fromUserId ? profilesByUserId.get(conn.fromUserId) : null;
      const name = counterpartProfile?.name || conn.fromUserName;
      if (!name) continue;

      const recId = `conn-in-${conn.fromUserId || conn.id}`;
      recipientMap.set(recId, {
        id: recId,
        name: String(name),
        email: counterpartProfile?.email || (conn.fromUserEmail !== 'visitor@avtive.app' ? conn.fromUserEmail : undefined),
        company: counterpartProfile?.company || undefined,
        designation: counterpartProfile?.designation || undefined,
        avatar: counterpartProfile?.avatar || undefined,
        source: 'connection',
        labels: ['Business Contacts']
      });
    }
  }

  // Assemble company colleague recipients
  for (const member of companyColleagues) {
    const memberProfile =
      (member.profileId && profilesById.get(String(member.profileId))) ||
      (member.userId && profilesByUserId.get(String(member.userId)));

    const name = memberProfile?.name || member.name || member.email;
    if (!name) continue;

    const recId = `colleague-${member.userId || member.id || member._id}`;
    if (!recipientMap.has(recId)) {
      recipientMap.set(recId, {
        id: recId,
        name: String(name),
        email: member.email || memberProfile?.email || undefined,
        company: memberProfile?.company || undefined,
        designation: member.title || memberProfile?.designation || undefined,
        avatar: memberProfile?.avatar || undefined,
        source: 'colleague',
        labels: ['Colleagues']
      });
    }
  }

  // Also include previously associated recipients/labels from user's share history
  const pastLinks = await db
    .collection(COLLECTIONS.SHARE_LINKS)
    .find({ ownerUserId: userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  for (const link of pastLinks) {
    if (link.eventLabel) {
      labelsSet.add(String(link.eventLabel));
    }
    if (Array.isArray(link.recipients)) {
      for (const r of link.recipients) {
        if (r?.id && r?.name && !recipientMap.has(r.id) && r.source !== 'manual') {
          recipientMap.set(r.id, r);
        }
      }
    }
  }

  let results = Array.from(recipientMap.values());

  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    results = results.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.company && r.company.toLowerCase().includes(q)) ||
        (r.designation && r.designation.toLowerCase().includes(q)) ||
        (r.email && r.email.toLowerCase().includes(q)) ||
        (r.labels && r.labels.some((l) => l.toLowerCase().includes(q)))
    );
  }

  return {
    recipients: results,
    availableLabels: Array.from(labelsSet)
  };
}
