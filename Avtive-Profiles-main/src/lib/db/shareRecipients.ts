import crypto from 'node:crypto';
import {
  ContactTagLinkRecord,
  ContactTagRecord,
  ContactTagSummary,
  ShareRecipientAssociation
} from '@/types/sharing';
import { getMongoDb, COLLECTIONS } from './client';
import { lazyEnsureIndexes } from './indexes';
import { getUserConnections } from './connections';

export const DEFAULT_EVENT_LABELS = [
  'Networking Event',
  'Conference',
  'Meeting',
  'Expo 2027'
];

export function normalizeContactTagName(raw: string): { name: string; normalizedName: string } {
  const collapsed = String(raw || '').trim().replace(/\s+/g, ' ');
  if (!collapsed) {
    return { name: '', normalizedName: '' };
  }
  const truncated = collapsed.slice(0, 40).trim();
  return {
    name: truncated,
    normalizedName: truncated.toLowerCase()
  };
}

function dedupeTagList(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const { name, normalizedName } = normalizeContactTagName(raw);
    if (!name || seen.has(normalizedName)) continue;
    seen.add(normalizedName);
    out.push(name);
  }
  return out;
}

/**
 * Ensures an owner-scoped ContactTagRecord exists in MongoDB without modifying any external user's profile.
 */
export async function createContactTagForOwner(
  ownerUserId: string,
  rawName: string
): Promise<ContactTagRecord> {
  if (!ownerUserId) {
    throw new Error('Authentication required to create a contact tag.');
  }
  const { name, normalizedName } = normalizeContactTagName(rawName);
  if (!name) {
    throw new Error('Tag name cannot be empty.');
  }

  await lazyEnsureIndexes();
  const db = await getMongoDb();
  const col = db.collection(COLLECTIONS.CONTACT_TAGS);

  const existing = await col.findOne({ ownerUserId, normalizedName });
  if (existing) {
    return {
      id: String(existing.id || existing._id),
      ownerUserId: String(existing.ownerUserId),
      name: String(existing.name),
      normalizedName: String(existing.normalizedName),
      createdAt: String(existing.createdAt || new Date().toISOString()),
      updatedAt: String(existing.updatedAt || existing.createdAt || new Date().toISOString())
    };
  }

  const now = new Date().toISOString();
  const doc: ContactTagRecord = {
    id: `tag-${crypto.randomUUID()}`,
    ownerUserId,
    name,
    normalizedName,
    createdAt: now,
    updatedAt: now
  };
  await col.insertOne({ ...doc });
  return doc;
}

/**
 * Deletes an owner-scoped contact tag and removes its assignments from the owner's contacts.
 */
export async function deleteContactTagForOwner(
  ownerUserId: string,
  tagIdentifier: string
): Promise<boolean> {
  if (!ownerUserId) {
    throw new Error('Authentication required to delete a contact tag.');
  }
  const raw = String(tagIdentifier || '').trim();
  if (!raw) return false;

  await lazyEnsureIndexes();
  const db = await getMongoDb();
  const tagsCol = db.collection(COLLECTIONS.CONTACT_TAGS);
  const linksCol = db.collection(COLLECTIONS.CONTACT_TAG_LINKS);

  const { normalizedName } = normalizeContactTagName(raw);
  const found = await tagsCol.findOne({
    ownerUserId,
    $or: [{ id: raw }, { normalizedName }]
  });

  const targetNormalized = found ? String(found.normalizedName) : normalizedName;
  if (found) {
    await tagsCol.deleteOne({ ownerUserId, id: String(found.id || found._id) });
  }

  const linkDocs = await linksCol.find({ ownerUserId }).toArray();
  const now = new Date().toISOString();
  for (const linkDoc of linkDocs) {
    const existingTags: string[] = Array.isArray(linkDoc.tags) ? linkDoc.tags.map(String) : [];
    const filtered = existingTags.filter((t) => normalizeContactTagName(t).normalizedName !== targetNormalized);
    if (filtered.length !== existingTags.length) {
      await linksCol.updateOne(
        { ownerUserId, recipientId: String(linkDoc.recipientId) },
        { $set: { tags: filtered, updatedAt: now } }
      );
    }
  }

  return Boolean(found);
}

/**
 * Assigns or removes owner-scoped contact tags on one or more saved contacts cleanly in MongoDB.
 * Never mutates any other user's profile or user record.
 */
export async function updateRecipientTagsForOwner(
  ownerUserId: string,
  options: {
    recipientIds: string[];
    addTags?: string[];
    removeTags?: string[];
    replaceTags?: string[];
  }
): Promise<{ updatedRecipientIds: string[] }> {
  if (!ownerUserId) {
    throw new Error('Authentication required to update contact tags.');
  }

  const recipientIds = Array.from(
    new Set((options.recipientIds || []).map((id) => String(id || '').trim()).filter(Boolean))
  );
  if (recipientIds.length === 0) {
    throw new Error('Select at least one contact.');
  }

  const addTags = dedupeTagList(options.addTags || []);
  const removeNormalized = new Set(
    (options.removeTags || []).map((t) => normalizeContactTagName(t).normalizedName).filter(Boolean)
  );
  const replaceTags = options.replaceTags !== undefined ? dedupeTagList(options.replaceTags) : undefined;

  await lazyEnsureIndexes();
  const db = await getMongoDb();
  const linksCol = db.collection(COLLECTIONS.CONTACT_TAG_LINKS);

  // Persist any newly added or replaced tags into the owner's CONTACT_TAGS catalog first
  const tagsToRegister = dedupeTagList([...addTags, ...(replaceTags || [])]);
  const canonicalTagMap = new Map<string, string>();
  for (const tName of tagsToRegister) {
    const created = await createContactTagForOwner(ownerUserId, tName);
    canonicalTagMap.set(created.normalizedName, created.name);
  }

  const now = new Date().toISOString();
  const updatedRecipientIds: string[] = [];

  for (const recipientId of recipientIds) {
    const existing = await linksCol.findOne({ ownerUserId, recipientId });
    const currentTags = existing && Array.isArray(existing.tags) ? existing.tags.map(String) : [];

    let nextTags: string[];
    if (replaceTags !== undefined) {
      nextTags = replaceTags.map(
        (t) => canonicalTagMap.get(normalizeContactTagName(t).normalizedName) || t
      );
    } else {
      const removed = currentTags.filter(
        (t) => !removeNormalized.has(normalizeContactTagName(t).normalizedName)
      );
      const merged = dedupeTagList([...removed, ...addTags]);
      nextTags = merged.map(
        (t) => canonicalTagMap.get(normalizeContactTagName(t).normalizedName) || t
      );
    }

    if (existing) {
      await linksCol.updateOne(
        { ownerUserId, recipientId },
        { $set: { tags: nextTags, updatedAt: now } }
      );
    } else {
      const doc: ContactTagLinkRecord = {
        id: `ctl-${crypto.randomUUID()}`,
        ownerUserId,
        recipientId,
        tags: nextTags,
        updatedAt: now
      };
      await linksCol.insertOne({ ...doc });
    }
    updatedRecipientIds.push(recipientId);
  }

  return { updatedRecipientIds };
}

/**
 * Fetches real saved contacts/connections and company colleagues for the signed-in owner,
 * enriched strictly with that owner's persisted Contact Tags (never fake defaults or event labels).
 */
export async function getShareRecipientsForUser(
  userId: string,
  searchQuery?: string
): Promise<{
  recipients: ShareRecipientAssociation[];
  contactTags: ContactTagSummary[];
  activeContactTags: string[];
  availableLabels: string[];
  eventLabels: string[];
}> {
  if (!userId) {
    return {
      recipients: [],
      contactTags: [],
      activeContactTags: [],
      availableLabels: [],
      eventLabels: []
    };
  }

  await lazyEnsureIndexes();
  const db = await getMongoDb();

  const connections = await getUserConnections(userId);
  const recipientMap = new Map<string, ShareRecipientAssociation>();

  // Load owner's persisted contact tags and per-contact tag assignments
  const [ownerTagDocs, ownerTagLinks] = await Promise.all([
    db.collection(COLLECTIONS.CONTACT_TAGS).find({ ownerUserId: userId }).toArray(),
    db.collection(COLLECTIONS.CONTACT_TAG_LINKS).find({ ownerUserId: userId }).toArray()
  ]);

  const canonicalNameByNorm = new Map<string, string>();
  for (const tDoc of ownerTagDocs) {
    if (tDoc.normalizedName && tDoc.name) {
      canonicalNameByNorm.set(String(tDoc.normalizedName), String(tDoc.name));
    }
  }

  const tagsByRecipientId = new Map<string, string[]>();
  for (const linkDoc of ownerTagLinks) {
    const recId = String(linkDoc.recipientId || '');
    if (!recId) continue;
    const rawList: string[] = Array.isArray(linkDoc.tags) ? linkDoc.tags.map(String) : [];
    const normalizedList = dedupeTagList(rawList).map(
      (name) => canonicalNameByNorm.get(normalizeContactTagName(name).normalizedName) || name
    );
    tagsByRecipientId.set(recId, normalizedList);
  }

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

  // Assemble outgoing & incoming connection recipients
  for (const conn of connections) {
    const isOutgoing = conn.fromUserId === userId;
    if (isOutgoing) {
      const targetProfile =
        profilesById.get(conn.toProfileId) || (conn.toUserId ? profilesByUserId.get(conn.toUserId) : null);
      const recId = `conn-${conn.toProfileId || conn.toUserId || conn.id}`;
      const name = targetProfile?.name || targetProfile?.profileName;
      if (!name) continue;

      const assignedTags = tagsByRecipientId.get(recId) || [];
      recipientMap.set(recId, {
        id: recId,
        name: String(name),
        email: targetProfile?.email || undefined,
        company: targetProfile?.company || targetProfile?.companyName || undefined,
        designation: targetProfile?.designation || targetProfile?.professionalTitle || undefined,
        avatar: targetProfile?.avatar || undefined,
        source: 'connection',
        tags: assignedTags,
        labels: assignedTags
      });
    } else {
      const counterpartProfile = conn.fromUserId ? profilesByUserId.get(conn.fromUserId) : null;
      const name = counterpartProfile?.name || conn.fromUserName;
      if (!name) continue;

      const recId = `conn-in-${conn.fromUserId || conn.id}`;
      const assignedTags = tagsByRecipientId.get(recId) || [];
      recipientMap.set(recId, {
        id: recId,
        name: String(name),
        email: counterpartProfile?.email || (conn.fromUserEmail !== 'visitor@avtive.app' ? conn.fromUserEmail : undefined),
        company: counterpartProfile?.company || undefined,
        designation: counterpartProfile?.designation || undefined,
        avatar: counterpartProfile?.avatar || undefined,
        source: 'connection',
        tags: assignedTags,
        labels: assignedTags
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
      const assignedTags = tagsByRecipientId.get(recId) || [];
      recipientMap.set(recId, {
        id: recId,
        name: String(name),
        email: member.email || memberProfile?.email || undefined,
        company: memberProfile?.company || undefined,
        designation: member.title || memberProfile?.designation || undefined,
        avatar: memberProfile?.avatar || undefined,
        source: 'colleague',
        tags: assignedTags,
        labels: assignedTags
      });
    }
  }

  // Historical recipients & recent Share Event Labels (kept separate from Contact Tags!)
  const pastLinks = await db
    .collection(COLLECTIONS.SHARE_LINKS)
    .find({ ownerUserId: userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  const eventLabelsSet = new Set<string>();
  for (const link of pastLinks) {
    if (link.eventLabel && String(link.eventLabel).trim()) {
      eventLabelsSet.add(String(link.eventLabel).trim());
    }
    if (Array.isArray(link.recipients)) {
      for (const r of link.recipients) {
        if (r?.id && r?.name && !recipientMap.has(r.id) && r.source !== 'manual') {
          const assignedTags = tagsByRecipientId.get(String(r.id)) || [];
          recipientMap.set(String(r.id), {
            id: String(r.id),
            name: String(r.name),
            email: r.email || undefined,
            company: r.company || undefined,
            designation: r.designation || undefined,
            avatar: r.avatar || undefined,
            source: r.source,
            tags: assignedTags,
            labels: assignedTags
          });
        }
      }
    }
  }

  const allContacts = Array.from(recipientMap.values());

  // Compute tag counts strictly from real assigned tags across owner's saved contacts
  const tagCountsByNorm = new Map<string, number>();
  const displayByNorm = new Map<string, string>(canonicalNameByNorm);
  for (const c of allContacts) {
    for (const tag of c.tags || []) {
      const { normalizedName, name } = normalizeContactTagName(tag);
      if (!normalizedName) continue;
      if (!displayByNorm.has(normalizedName)) displayByNorm.set(normalizedName, name);
      tagCountsByNorm.set(normalizedName, (tagCountsByNorm.get(normalizedName) || 0) + 1);
    }
  }

  const tagRecordByNorm = new Map<string, any>();
  for (const doc of ownerTagDocs) {
    tagRecordByNorm.set(String(doc.normalizedName), doc);
  }

  const contactTags: ContactTagSummary[] = Array.from(
    new Set([...tagRecordByNorm.keys(), ...tagCountsByNorm.keys()])
  )
    .map((norm) => {
      const rec = tagRecordByNorm.get(norm);
      return {
        id: rec ? String(rec.id || rec._id) : `tag-${norm}`,
        name: rec ? String(rec.name) : displayByNorm.get(norm) || norm,
        count: tagCountsByNorm.get(norm) || 0,
        createdAt: rec?.createdAt ? String(rec.createdAt) : new Date().toISOString()
      };
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  // Filter chips only expose tags actively assigned to >= 1 contact (no dead/unused defaults)
  const activeContactTags = contactTags.filter((t) => t.count > 0).map((t) => t.name);

  let results = allContacts;
  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    results = results.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.company && r.company.toLowerCase().includes(q)) ||
        (r.designation && r.designation.toLowerCase().includes(q)) ||
        (r.email && r.email.toLowerCase().includes(q)) ||
        (r.tags && r.tags.some((t) => t.toLowerCase().includes(q)))
    );
  }

  return {
    recipients: results,
    contactTags,
    activeContactTags,
    availableLabels: activeContactTags,
    eventLabels: Array.from(eventLabelsSet)
  };
}
