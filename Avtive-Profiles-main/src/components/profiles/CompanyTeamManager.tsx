'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Copy, 
  Check, 
  Trash2, 
  Edit3, 
  Shield, 
  ShieldCheck, 
  Crown, 
  Clock, 
  Loader2, 
  AlertCircle, 
  X,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { CompanyMemberRecord, CompanyRole } from '@/types/company';
import { ProfileData, TeamMemberItem } from '@/types/profile';

interface CompanyTeamManagerProps {
  companyIdentifier: string; // companyId or slug
  profile: ProfileData;
  onUpdateTeamMembers?: (members: TeamMemberItem[]) => void;
  showToast?: (message: string) => void;
  instanceId?: string;
}

export function CompanyTeamManager({
  companyIdentifier,
  profile,
  onUpdateTeamMembers,
  showToast,
  instanceId = 'desktop'
}: CompanyTeamManagerProps) {
  const [members, setMembers] = useState<CompanyMemberRecord[]>(() => {
    if (Array.isArray(profile.teamMembers) && profile.teamMembers.length > 0) {
      return profile.teamMembers.map((m) => ({
        id: m.id,
        companyId: profile.id,
        userId: m.profileId || null,
        email: m.email || '',
        name: m.name,
        title: m.role || '',
        department: m.department || '',
        bio: m.bio || '',
        avatarUrl: m.avatar || '',
        role: 'MEMBER' as CompanyRole,
        status: (m.status as any) || 'ACTIVE',
        inviteToken: null,
        inviteExpiresAt: null,
        invitedByUserId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(!profile.teamMembers?.length);
  const [error, setError] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<CompanyRole>('OWNER');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Add Member Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newAvatar, setNewAvatar] = useState('');
  const [newProfileUrl, setNewProfileUrl] = useState('');
  const [newRole, setNewRole] = useState<CompanyRole>('MEMBER');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [newInviteLink, setNewInviteLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Edit Member Modal State
  const [editingMember, setEditingMember] = useState<CompanyMemberRecord | null>(null);
  const [editName, setEditName] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editProfileUrl, setEditProfileUrl] = useState('');
  const [editRole, setEditRole] = useState<CompanyRole>('MEMBER');
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Remove Member Confirmation State
  const [memberToRemove, setMemberToRemove] = useState<CompanyMemberRecord | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  // Copy Link State for individual members
  const [copiedMemberId, setCopiedMemberId] = useState<string | null>(null);

  // Synchronize ACTIVE and PENDING members back to the profile editor context
  const syncToProfile = useCallback((list: CompanyMemberRecord[]) => {
    const valid = list
      .filter((m) => m.status !== 'REMOVED')
      .map((m): TeamMemberItem => ({
        id: m.id,
        name: m.name,
        role: m.title || m.role,
        department: m.department,
        avatar: m.avatarUrl || '/images/default-avatar.png',
        bio: m.bio,
        email: m.email,
        status: m.status as ('ACTIVE' | 'PENDING'),
        profileId: (m as any).profileUrl || m.userId || undefined
      }));
    onUpdateTeamMembers?.(valid);
  }, [onUpdateTeamMembers]);

  // Fetch current user and company members
  const fetchMembers = useCallback(async () => {
    if (!companyIdentifier) return;
    setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch current user session to determine role
      const meRes = await fetch('/api/company/me');
      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.role) setCurrentUserRole(meData.role);
        if (meData.currentMember?.userId) setCurrentUserId(meData.currentMember.userId);
      }

      // 2. Fetch company members
      const res = await fetch(`/api/company/${encodeURIComponent(companyIdentifier)}/members`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.members)) {
          setMembers(data.members);
          syncToProfile(data.members);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        // If not a member yet, fallback to profile.teamMembers if available
        if (res.status === 403 || res.status === 404) {
          if (Array.isArray(profile.teamMembers) && profile.teamMembers.length > 0) {
            const fallbackRecords: CompanyMemberRecord[] = profile.teamMembers.map((m) => ({
              id: m.id,
              companyId: profile.id,
              userId: m.profileId || null,
              email: m.email || '',
              name: m.name,
              title: m.role || '',
              department: m.department || '',
              bio: m.bio || '',
              avatarUrl: m.avatar || '',
              role: 'MEMBER',
              status: 'ACTIVE',
              inviteToken: null,
              inviteExpiresAt: null,
              invitedByUserId: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }));
            setMembers(fallbackRecords);
          }
        } else {
          setError(errData.error || 'Failed to load team members.');
        }
      }
    } catch (e: any) {
      console.error('Error fetching company members:', e);
      setError('Network error while loading team members.');
    } finally {
      setIsLoading(false);
    }
  }, [companyIdentifier, profile, syncToProfile]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const canManage = true;

  // Handle Add Member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setAddError('Please enter a member name (at least 2 characters).');
      return;
    }
    const trimmedEmail = newEmail.trim().toLowerCase();
    if (trimmedEmail && !trimmedEmail.includes('@')) {
      setAddError('Please enter a valid email address.');
      return;
    }
    const trimmedAvatar = newAvatar.trim();
    if (trimmedAvatar && !/^https?:\/\/.+/i.test(trimmedAvatar) && !trimmedAvatar.startsWith('data:image/')) {
      setAddError('Please enter a valid image URL (e.g. https://...).');
      return;
    }
    const trimmedProfileUrl = newProfileUrl.trim();
    if (trimmedProfileUrl && !/^(https?:\/\/|\/profile\/|[a-zA-Z0-9_\-\.]+)/i.test(trimmedProfileUrl)) {
      setAddError('Please enter a valid profile URL or slug.');
      return;
    }

    setIsAdding(true);
    setAddError(null);
    setNewInviteLink(null);

    try {
      const res = await fetch(`/api/company/${encodeURIComponent(companyIdentifier)}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail || undefined,
          name: trimmedName,
          title: newTitle.trim() || 'Team Member',
          department: newDepartment.trim() || 'General',
          profileUrl: trimmedProfileUrl || undefined,
          role: newRole,
          avatarUrl: trimmedAvatar || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || 'Failed to add team member.');
        return;
      }

      const updated = [...members, data.member];
      setMembers(updated);
      syncToProfile(updated);

      if (data.inviteLink) {
        const fullInviteUrl = typeof window !== 'undefined'
          ? `${window.location.origin}${data.inviteLink}`
          : data.inviteLink;
        setNewInviteLink(fullInviteUrl);
      }

      showToast?.(`Team member ${trimmedName} added successfully!`);
      // Reset form
      setNewEmail('');
      setNewName('');
      setNewTitle('');
      setNewDepartment('');
      setNewAvatar('');
      setNewProfileUrl('');
      setNewRole('MEMBER');
      if (!data.inviteLink) {
        setIsAddModalOpen(false);
      }
    } catch (e: any) {
      setAddError('Network error while adding team member.');
    } finally {
      setIsAdding(false);
    }
  };

  // Handle Edit Member
  const handleOpenEdit = (m: CompanyMemberRecord) => {
    setEditingMember(m);
    setEditName(m.name);
    setEditTitle(m.title);
    setEditDepartment(m.department);
    setEditAvatar(m.avatarUrl || '');
    setEditProfileUrl((m as any).profileUrl || m.userId || '');
    setEditRole(m.role);
    setEditError(null);
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    const trimmedName = editName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setEditError('Please enter a member name (at least 2 characters).');
      return;
    }
    const trimmedAvatar = editAvatar.trim();
    if (trimmedAvatar && !/^https?:\/\/.+/i.test(trimmedAvatar) && !trimmedAvatar.startsWith('data:image/')) {
      setEditError('Please enter a valid image URL.');
      return;
    }
    const trimmedProfileUrl = editProfileUrl.trim();
    if (trimmedProfileUrl && !/^(https?:\/\/|\/profile\/|[a-zA-Z0-9_\-\.]+)/i.test(trimmedProfileUrl)) {
      setEditError('Please enter a valid profile URL or slug.');
      return;
    }

    setIsUpdating(true);
    setEditError(null);

    try {
      const res = await fetch(
        `/api/company/${encodeURIComponent(companyIdentifier)}/members/${editingMember.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: trimmedName,
            title: editTitle.trim(),
            department: editDepartment.trim(),
            profileUrl: trimmedProfileUrl || undefined,
            role: editRole,
            avatarUrl: trimmedAvatar || undefined
          })
        }
      );

      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || 'Failed to update member.');
        return;
      }

      const updated = members.map((m) => (m.id === editingMember.id ? data.member : m));
      setMembers(updated);
      syncToProfile(updated);
      showToast?.(`Updated ${trimmedName}!`);
      setEditingMember(null);
    } catch (e) {
      setEditError('Network error while updating member.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Remove Member
  const handleConfirmRemove = async () => {
    if (!memberToRemove) return;

    setIsRemoving(true);
    setRemoveError(null);

    try {
      const res = await fetch(
        `/api/company/${encodeURIComponent(companyIdentifier)}/members/${memberToRemove.id}`,
        { method: 'DELETE' }
      );

      const data = await res.json();
      if (!res.ok) {
        setRemoveError(data.error || 'Failed to remove member.');
        return;
      }

      const updated = members.filter((m) => m.id !== memberToRemove.id);
      setMembers(updated);
      syncToProfile(updated);
      showToast?.(`Removed ${memberToRemove.name} from team.`);
      setMemberToRemove(null);
    } catch (e) {
      setRemoveError('Network error while removing member.');
    } finally {
      setIsRemoving(false);
    }
  };

  const copyToClipboard = async (text: string, memberId?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (memberId) {
        setCopiedMemberId(memberId);
        setTimeout(() => setCopiedMemberId(null), 2500);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
      showToast?.('Invite link copied to clipboard!');
    } catch {
      showToast?.('Unable to copy link.');
    }
  };

  return (
    <div className="w-full space-y-4 text-left">
      {/* Team Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Organization Roster
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-bold">
              {members.filter((m) => m.status === 'ACTIVE').length} Active
            </span>
            {members.some((m) => m.status === 'PENDING') && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold">
                {members.filter((m) => m.status === 'PENDING').length} Pending
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Manage company members, assign leadership roles, and invite colleagues to your digital pass.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={fetchMembers}
            disabled={isLoading}
            title="Refresh member list"
            aria-label="Refresh member list"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {canManage && (
            <button
              type="button"
              onClick={() => {
                setAddError(null);
                setNewInviteLink(null);
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button 
            type="button" 
            onClick={fetchMembers} 
            className="text-[11px] font-bold underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Member List */}
      {isLoading ? (
        <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
          <span className="text-xs">Loading team roster...</span>
        </div>
      ) : members.length === 0 ? (
        <div className="py-8 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center text-center gap-2">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            No team members added yet
          </p>
          <p className="text-[11px] text-slate-500 max-w-xs">
            Invite your colleagues to build your organization directory and showcase your team on your public profile.
          </p>
          {canManage && (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="mt-2 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer"
            >
              Invite First Member
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5">
          {members.map((member) => {
            const isOwner = member.role === 'OWNER';
            const isAdmin = member.role === 'ADMIN';
            const isPending = member.status === 'PENDING';
            const isSelf = member.userId && member.userId === currentUserId;

            // Permissions logic
            const canEditThisMember = 
              currentUserRole === 'OWNER' || 
              (currentUserRole === 'ADMIN' && !isOwner);

            const canRemoveThisMember = 
              currentUserRole === 'OWNER' || 
              (currentUserRole === 'ADMIN' && !isOwner) ||
              isSelf;

            const isLastOwner = isOwner && members.filter((m) => m.role === 'OWNER' && m.status === 'ACTIVE').length <= 1;

            return (
              <div
                key={member.id}
                className="p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-[#0E1528] border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:border-slate-300 dark:hover:border-white/20"
              >
                {/* Member Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative shrink-0">
                    <img
                      src={member.avatarUrl || '/images/default-avatar.png'}
                      alt={member.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-white/10 bg-slate-200 dark:bg-slate-800"
                    />
                    {isOwner && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[9px] shadow-xs" title="Owner">
                        <Crown className="w-2.5 h-2.5" />
                      </span>
                    )}
                    {isAdmin && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-white flex items-center justify-center text-[9px] shadow-xs" title="Admin">
                        <ShieldCheck className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {member.name}
                      </h4>
                      {isSelf && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-white/15 text-slate-700 dark:text-slate-300">
                          You
                        </span>
                      )}
                      
                      {/* Role Badge */}
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${
                        isOwner
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                          : isAdmin
                          ? 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20'
                          : 'bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-slate-300'
                      }`}>
                        {member.role}
                      </span>

                      {/* Status Badge */}
                      {isPending ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          <span>Pending Invite</span>
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Active</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{member.title || 'Team Member'}</span>
                      {member.department && (
                        <>
                          <span>&middot;</span>
                          <span>{member.department}</span>
                        </>
                      )}
                      {member.email && (
                        <>
                          <span>&middot;</span>
                          <span className="text-slate-400 truncate">{member.email}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  {/* Copy Invite Link for Pending */}
                  {isPending && canManage && (
                    <button
                      type="button"
                      onClick={() => {
                        const origin = typeof window !== 'undefined' ? window.location.origin : '';
                        const link = `${origin}/company/invite?token=invite_${member.id}`;
                        copyToClipboard(link, member.id);
                      }}
                      title="Copy invitation link"
                      className="p-1.5 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] font-semibold border border-amber-500/20 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedMemberId === member.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Edit Member */}
                  {canEditThisMember && (
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(member)}
                      title="Edit member"
                      aria-label={`Edit ${member.name}`}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Remove Member */}
                  {canRemoveThisMember && (
                    <button
                      type="button"
                      onClick={() => {
                        setRemoveError(null);
                        setMemberToRemove(member);
                      }}
                      disabled={isLastOwner}
                      title={isLastOwner ? 'Cannot remove the last owner' : 'Remove member'}
                      aria-label={`Remove ${member.name}`}
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* ADD MEMBER MODAL                                                           */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0E1528] border border-slate-200 dark:border-white/10 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Add Team Member
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setNewInviteLink(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            {newInviteLink ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                  <Check className="w-4 h-4" />
                  <span>Member invited! Share this invite link:</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs font-mono select-all truncate">
                  <span className="truncate flex-1">{newInviteLink}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(newInviteLink)}
                    className="p-1.5 rounded-md bg-cyan-600 text-white hover:bg-cyan-500 shrink-0 flex items-center gap-1 text-[11px] font-sans font-bold cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  Note: Email delivery is not configured. Please copy and send this link directly to the invited member.
                </p>
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setNewInviteLink(null);
                    }}
                    className="px-4 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddMember} className="space-y-3">
                <div>
                  <label htmlFor={`member-email-${instanceId}`} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address (optional)
                  </label>
                  <input
                    id={`member-email-${instanceId}`}
                    type="email"
                    autoComplete="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label htmlFor={`member-name-${instanceId}`} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    id={`member-name-${instanceId}`}
                    type="text"
                    required
                    autoComplete="name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor={`member-title-${instanceId}`} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Title / Designation
                    </label>
                    <input
                      id={`member-title-${instanceId}`}
                      type="text"
                      autoComplete="organization-title"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Senior Architect"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label htmlFor={`member-dept-${instanceId}`} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Department
                    </label>
                    <input
                      id={`member-dept-${instanceId}`}
                      type="text"
                      value={newDepartment}
                      onChange={(e) => setNewDepartment(e.target.value)}
                      placeholder="e.g. Engineering"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor={`member-avatar-${instanceId}`} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Photo URL (optional)
                  </label>
                  <input
                    id={`member-avatar-${instanceId}`}
                    type="url"
                    value={newAvatar}
                    onChange={(e) => setNewAvatar(e.target.value)}
                    placeholder="https://... or leave blank for default"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label htmlFor={`member-profile-url-${instanceId}`} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Profile URL or Slug (optional)
                  </label>
                  <input
                    id={`member-profile-url-${instanceId}`}
                    type="text"
                    value={newProfileUrl}
                    onChange={(e) => setNewProfileUrl(e.target.value)}
                    placeholder="e.g. /profile/jane-doe or jane-doe"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label htmlFor={`member-role-${instanceId}`} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Permissions Level
                  </label>
                  <select
                    id={`member-role-${instanceId}`}
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as CompanyRole)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="MEMBER">Member (Standard profile member)</option>
                    <option value="ADMIN" disabled={currentUserRole !== 'OWNER'}>
                      Admin (Can manage roster & company details) {currentUserRole !== 'OWNER' ? '- Owner only' : ''}
                    </option>
                    <option value="OWNER" disabled={currentUserRole !== 'OWNER'}>
                      Owner (Full company ownership) {currentUserRole !== 'OWNER' ? '- Owner only' : ''}
                    </option>
                  </select>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAdding}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                    <span>{isAdding ? 'Inviting...' : 'Send Invitation'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* EDIT MEMBER MODAL                                                          */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0E1528] border border-slate-200 dark:border-white/10 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Edit Member: {editingMember.name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateMember} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Title / Role
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Photo URL (optional)
                </label>
                <input
                  type="url"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  placeholder="https://... or leave blank for default"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Profile URL or Slug (optional)
                </label>
                <input
                  type="text"
                  value={editProfileUrl}
                  onChange={(e) => setEditProfileUrl(e.target.value)}
                  placeholder="e.g. /profile/jane-doe or jane-doe"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Role & Permissions
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as CompanyRole)}
                  disabled={currentUserRole !== 'OWNER' && editingMember.role === 'OWNER'}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                >
                  <option value="MEMBER">Member (Standard member)</option>
                  <option value="ADMIN" disabled={currentUserRole !== 'OWNER'}>
                    Admin (Can manage roster) {currentUserRole !== 'OWNER' ? '- Owner only' : ''}
                  </option>
                  <option value="OWNER" disabled={currentUserRole !== 'OWNER'}>
                    Owner (Full ownership) {currentUserRole !== 'OWNER' ? '- Owner only' : ''}
                  </option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* REMOVE MEMBER CONFIRMATION DIALOG                                          */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {memberToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#0E1528] border border-slate-200 dark:border-white/10 shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Remove Team Member?
                </h4>
                <p className="text-xs text-slate-500">
                  {memberToRemove.name} ({memberToRemove.email})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to remove this member from the organization? They will lose access to team functions and will no longer appear on your public company profile.
            </p>

            {removeError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                {removeError}
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                disabled={isRemoving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer"
              >
                {isRemoving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Remove Member</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
