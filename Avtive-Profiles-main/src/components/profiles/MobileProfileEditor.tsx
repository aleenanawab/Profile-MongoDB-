'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Camera, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Trash2, 
  Check, 
  Loader2, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Pencil,
  User, 
  FileText, 
  SlidersHorizontal, 
  FolderGit2, 
  GraduationCap, 
  Phone, 
  Link2, 
  Briefcase, 
  Sparkles, 
  ShieldCheck, 
  Settings, 
  UserCheck, 
  Archive,
  ArrowRight,
  Mail,
  MapPin,
  Globe,
  Tag,
  RotateCcw,
  X
} from 'lucide-react';
import { useProfileEditor } from '@/context/ProfileEditorContext';
import { 
  ProjectItem, 
  ExperienceItem, 
  EducationItem, 
  CustomFieldItem 
} from '@/types/profile';
import { LinkedInIcon, GithubIcon, TwitterIcon, WhatsAppIcon } from '@/components/BrandIcons';

export function MobileProfileEditor() {
  const router = useRouter();
  const { 
    profile, 
    setProfile, 
    updateField, 
    isSaving, 
    saveProfile, 
    showToast,
    currentIdentifier
  } = useProfileEditor();

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    profile: true,
    personalDetails: false,
    skills: false,
    projects: false,
    education: false,
    contactInfo: false,
    socialLinks: false,
    experience: false,
    enhanceProfile: false,
    limitations: false,
    accountInfo: false,
    archive: false,
    security: false,
    settings: false,
  });

  const [newSkillText, setNewSkillText] = useState('');
  const [newProject, setNewProject] = useState({ title: '', description: '', tags: '', link: '' });
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newEducation, setNewEducation] = useState({ degree: '', institution: '', period: '' });
  const [isAddingEducation, setIsAddingEducation] = useState(false);
  const [newExperience, setNewExperience] = useState({ role: '', company: '', period: '' });
  const [isAddingExperience, setIsAddingExperience] = useState(false);
  const [newCustomField, setNewCustomField] = useState({ label: '', value: '' });

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const toggleSectionExpand = (key: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Section visibility check
  const isSectionVisible = (key: string): boolean => {
    if (profile.sectionVisibility && typeof profile.sectionVisibility[key] === 'boolean') {
      return profile.sectionVisibility[key];
    }
    const sharing = profile.sharingSettings || {};
    switch (key) {
      case 'profile': return sharing.bio !== false && sharing.nameAndTitle !== false;
      case 'personalDetails': return sharing.email !== false || sharing.phone !== false;
      case 'skills': return sharing.skills !== false;
      case 'projects': return sharing.projects !== false;
      case 'education': return sharing.education !== false;
      case 'contactInfo': return sharing.contactInfo !== false;
      case 'socialLinks': return sharing.socialLinks !== false;
      case 'experience': return sharing.experience !== false;
      default: return true;
    }
  };

  // Toggle visibility of a section
  const handleToggleVisibility = (sectionKey: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const current = isSectionVisible(sectionKey);
    const nextVal = !current;

    const newVisibility = {
      ...(profile.sectionVisibility || {}),
      [sectionKey]: nextVal
    };

    const newSharing = { ...(profile.sharingSettings || {}) };
    if (sectionKey === 'profile') {
      newSharing.nameAndTitle = nextVal;
      newSharing.bio = nextVal;
      newVisibility.hero = nextVal;
      newVisibility.about = nextVal;
    } else if (sectionKey === 'personalDetails') {
      newSharing.phone = nextVal;
      newSharing.email = nextVal;
    } else if (sectionKey === 'skills') {
      newSharing.skills = nextVal;
      newVisibility.skills = nextVal;
      newVisibility.services = nextVal;
    } else if (sectionKey === 'projects') {
      newSharing.projects = nextVal;
      newVisibility.projects = nextVal;
    } else if (sectionKey === 'education') {
      newSharing.education = nextVal;
      newVisibility.education = nextVal;
    } else if (sectionKey === 'contactInfo') {
      newSharing.contactInfo = nextVal;
      newVisibility.contact = nextVal;
    } else if (sectionKey === 'socialLinks') {
      newSharing.socialLinks = nextVal;
      newVisibility.socials = nextVal;
    } else if (sectionKey === 'experience') {
      newSharing.experience = nextVal;
      newVisibility.experience = nextVal;
    }

    updateField('sectionVisibility', newVisibility);
    updateField('sharingSettings', newSharing);
    showToast(`${sectionKey} is now ${nextVal ? 'Visible' : 'Hidden'}`);
  };

  // Avatar upload
  const handleAvatarFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        updateField('avatar', reader.result as string);
        showToast('✓ Avatar updated');
      }
    };
    reader.readAsDataURL(file);
  };

  // Cover upload
  const handleCoverFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        updateField('coverImage', reader.result as string);
        showToast('✓ Cover photo updated');
      }
    };
    reader.readAsDataURL(file);
  };

  // Skills
  const handleAddSkill = (skillText?: string) => {
    const text = (skillText || newSkillText).trim();
    if (!text) return;
    const current = Array.isArray(profile.skills) ? profile.skills : [];
    const skillStrings = current.map(s => typeof s === 'string' ? s : s.name);
    if (!skillStrings.includes(text)) {
      updateField('skills', [...current, text]);
      showToast(`Added ${text}`);
    }
    setNewSkillText('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const current = Array.isArray(profile.skills) ? profile.skills : [];
    updateField('skills', current.filter(s => (typeof s === 'string' ? s : s.name) !== skillToRemove));
  };

  // Projects
  const handleSaveProject = () => {
    if (!newProject.title.trim()) return;
    const item: ProjectItem = {
      id: `proj-${Date.now()}`,
      title: newProject.title.trim(),
      description: newProject.description.trim(),
      tags: newProject.tags ? newProject.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      link: newProject.link.trim() || undefined,
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop'
    };
    const current = Array.isArray(profile.projects) ? profile.projects : [];
    updateField('projects', [item, ...current]);
    setNewProject({ title: '', description: '', tags: '', link: '' });
    setIsAddingProject(false);
    showToast('✓ Project added');
  };

  // Education
  const handleSaveEducation = () => {
    if (!newEducation.institution.trim() || !newEducation.degree.trim()) return;
    const item: EducationItem = {
      id: `edu-${Date.now()}`,
      degree: newEducation.degree.trim(),
      institution: newEducation.institution.trim(),
      period: newEducation.period.trim() || undefined
    };
    const current = Array.isArray(profile.education) ? profile.education : [];
    updateField('education', [item, ...current]);
    setNewEducation({ degree: '', institution: '', period: '' });
    setIsAddingEducation(false);
    showToast('✓ Education added');
  };

  // Social URLs
  const updateSocialUrl = (platform: string, url: string) => {
    const current = Array.isArray(profile.socialLinks) ? profile.socialLinks : [];
    const idx = current.findIndex(l => l.platform === platform);
    if (idx >= 0) {
      const copy = [...current];
      copy[idx] = { ...copy[idx], url };
      updateField('socialLinks', copy);
    } else {
      updateField('socialLinks', [...current, { platform: platform as any, url }]);
    }
  };

  const getSocialUrl = (platform: string) => {
    const current = Array.isArray(profile.socialLinks) ? profile.socialLinks : [];
    const found = current.find(l => l.platform === platform);
    return found ? found.url : '';
  };

  const allSections = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'personalDetails', label: 'Personal Details', icon: FileText },
    { key: 'skills', label: 'Skills', icon: SlidersHorizontal },
    { key: 'projects', label: 'Projects', icon: FolderGit2 },
    { key: 'education', label: 'Education', icon: GraduationCap },
    { key: 'contactInfo', label: 'Contact Info', icon: Phone },
    { key: 'socialLinks', label: 'Social Links', icon: Link2 },
    { key: 'experience', label: 'Experience', icon: Briefcase },
    { key: 'enhanceProfile', label: 'Enhance Profile', icon: Sparkles },
    { key: 'limitations', label: 'Limitations', icon: EyeOff },
    { key: 'accountInfo', label: 'Account info', icon: UserCheck },
    { key: 'archive', label: 'Archive', icon: Archive },
    { key: 'security', label: 'Security', icon: ShieldCheck },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  const visibleSections = allSections.filter(s => isSectionVisible(s.key));
  const hiddenSections = allSections.filter(s => !isSectionVisible(s.key));

  return (
    <div className="w-full min-h-screen bg-[#070D18] text-slate-100 flex flex-col items-center pb-28 font-sans select-none">
      
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* TOP HEADER: Cover Image & Avatar (Matching Image 1)                       */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <div className="w-full max-w-md relative">
        <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-slate-900">
          <img 
            src={profile.coverImage || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop'} 
            alt="Cover"
            onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop'; }}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070D18] via-[#070D18]/40 to-transparent" />
          
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer"
            title="Change Cover"
          >
            <Camera className="w-4 h-4" />
          </button>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleCoverFile(file);
            }}
          />
        </div>

        {/* Avatar + User Info (Matching Screenshot) */}
        <div className="relative -mt-14 px-4 flex items-end justify-between">
          <div className="flex items-end gap-3.5">
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-[#070D18] bg-slate-800 shadow-2xl shrink-0 group">
              <img 
                src={profile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop'} 
                alt={profile.name || 'User'} 
                onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop'; }}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAvatarFile(file);
                }}
              />
            </div>

            <div className="pb-1.5 min-w-0">
              <h2 className="text-base font-bold text-white tracking-tight truncate">
                {profile.name || 'Aleena Nawab'}
              </h2>
              <p className="text-xs text-slate-400 font-medium truncate">
                {profile.professionalTitle || profile.designation || 'Full Stack Engineer'}
              </p>
            </div>
          </div>

          <Link
            href={`/profile/${currentIdentifier}`}
            target="_blank"
            className="pb-2 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors"
            title="Preview Public Card"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* MAIN SECTIONS CONTAINER (Dark Translucent Pill Layout - Image 1)          */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <div className="w-full max-w-md px-3.5 sm:px-4 mt-4 space-y-4">
        
        {/* ── VISIBLE SECTIONS GROUP ── */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-extrabold text-white tracking-wide">
              Visible
            </h3>
            <span className="text-[11px] font-mono text-emerald-400 font-semibold">
              {visibleSections.length} Active
            </span>
          </div>

          <div className="space-y-2">
            {visibleSections.map((sec) => {
              const Icon = sec.icon;
              const isExpanded = !!expandedSections[sec.key];

              return (
                <div 
                  key={sec.key}
                  className="rounded-2xl border border-white/10 bg-[#0E1626]/90 backdrop-blur-md shadow-md overflow-hidden transition-all"
                >
                  {/* Row Header */}
                  <div 
                    onClick={() => toggleSectionExpand(sec.key)}
                    className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-white/[0.03]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className="w-4 h-4 text-slate-300 shrink-0" />
                      <span className="text-xs sm:text-sm font-bold text-white truncate">
                        {sec.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* iOS-Style Toggle Switch */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleVisibility(sec.key, e)}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer relative ${
                          isSectionVisible(sec.key) ? 'bg-cyan-500' : 'bg-slate-700'
                        }`}
                        title="Toggle Section Visibility"
                      >
                        <div 
                          className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                            isSectionVisible(sec.key) ? 'translate-x-4' : 'translate-x-0'
                          }`} 
                        />
                      </button>

                      {/* Expand/Collapse Chevron */}
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleSectionExpand(sec.key); }}
                        className="p-1 rounded-lg text-slate-400 hover:text-white"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Inline Expanded Content (Image 1 Style) */}
                  {isExpanded && (
                    <div className="px-3.5 pb-4 pt-1 border-t border-white/10 bg-[#0A101D]/80 space-y-3">
                      
                      {/* 1. Profile Details */}
                      {sec.key === 'profile' && (
                        <div className="space-y-2.5 pt-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Name</label>
                            <input
                              type="text"
                              value={profile.name || ''}
                              onChange={(e) => updateField('name', e.target.value)}
                              placeholder="Enter your name"
                              className="w-full text-xs px-3 py-2 rounded-xl bg-[#0E1626] border border-white/10 text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Bio</label>
                            <textarea
                              rows={2}
                              value={profile.bio || profile.shortBio || ''}
                              onChange={(e) => {
                                updateField('bio', e.target.value);
                                updateField('shortBio', e.target.value);
                              }}
                              placeholder="Full Stack Engineer | Product builder..."
                              className="w-full text-xs px-3 py-2 rounded-xl bg-[#0E1626] border border-white/10 text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-500 resize-none"
                            />
                          </div>
                        </div>
                      )}

                      {/* 2. Personal Details */}
                      {sec.key === 'personalDetails' && (
                        <div className="space-y-2.5 pt-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Email</label>
                            <input
                              type="email"
                              value={profile.email || ''}
                              onChange={(e) => updateField('email', e.target.value)}
                              placeholder="enter your email"
                              className="w-full text-xs px-3 py-2 rounded-xl bg-[#0E1626] border border-white/10 text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Phone Number</label>
                            <input
                              type="tel"
                              value={profile.phone || ''}
                              onChange={(e) => updateField('phone', e.target.value)}
                              placeholder="enter your phone number"
                              className="w-full text-xs px-3 py-2 rounded-xl bg-[#0E1626] border border-white/10 text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-500"
                            />
                          </div>
                        </div>
                      )}

                      {/* 3. Skills */}
                      {sec.key === 'skills' && (
                        <div className="space-y-2.5 pt-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Add Skills</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newSkillText}
                                onChange={(e) => setNewSkillText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                                placeholder="Search for your skills here"
                                className="flex-1 text-xs px-3 py-2 rounded-xl bg-[#0E1626] border border-white/10 text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-500"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddSkill()}
                                className="px-3 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Quick Chips (Matching Image 1: HTML, CSS, React, NextTs) */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {['HTML', 'CSS', 'React', 'NextTs', 'Node.js', 'Figma'].map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => handleAddSkill(s)}
                                className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors"
                              >
                                {s}
                              </button>
                            ))}
                          </div>

                          {/* Current Active Skills */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {(Array.isArray(profile.skills) ? profile.skills : []).map((s) => {
                              const name = typeof s === 'string' ? s : s.name;
                              return (
                                <span
                                  key={name}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold"
                                >
                                  <span>{name}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSkill(name)}
                                    className="text-cyan-400 hover:text-rose-400"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 4. Projects */}
                      {sec.key === 'projects' && (
                        <div className="space-y-2.5 pt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-slate-300">Featured Projects</span>
                            <button
                              type="button"
                              onClick={() => setIsAddingProject(!isAddingProject)}
                              className="text-xs font-bold text-cyan-400 hover:underline"
                            >
                              {isAddingProject ? 'Cancel' : '+ Add Project'}
                            </button>
                          </div>

                          {isAddingProject && (
                            <div className="p-3 rounded-xl bg-[#0E1626] border border-cyan-500/30 space-y-2">
                              <input
                                type="text"
                                value={newProject.title}
                                onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                                placeholder="Project title"
                                className="w-full text-xs px-3 py-1.5 rounded-lg bg-[#070D18] border border-white/10 text-white"
                              />
                              <input
                                type="text"
                                value={newProject.description}
                                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                placeholder="add your projects here"
                                className="w-full text-xs px-3 py-1.5 rounded-lg bg-[#070D18] border border-white/10 text-white"
                              />
                              <button
                                type="button"
                                onClick={handleSaveProject}
                                className="w-full py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs"
                              >
                                Save Project
                              </button>
                            </div>
                          )}

                          <div className="space-y-2">
                            {(Array.isArray(profile.projects) ? profile.projects : []).map((p) => (
                              <div key={p.id} className="p-2.5 rounded-xl bg-[#0E1626] border border-white/10 flex items-center justify-between text-xs">
                                <span className="font-bold text-white truncate">{p.title}</span>
                                <button
                                  type="button"
                                  onClick={() => updateField('projects', (profile.projects || []).filter(x => x.id !== p.id))}
                                  className="text-slate-500 hover:text-rose-400"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 5. Education */}
                      {sec.key === 'education' && (
                        <div className="space-y-2.5 pt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-slate-300">Education Details</span>
                            <button
                              type="button"
                              onClick={() => setIsAddingEducation(!isAddingEducation)}
                              className="text-xs font-bold text-cyan-400 hover:underline"
                            >
                              {isAddingEducation ? 'Cancel' : '+ Add'}
                            </button>
                          </div>

                          {isAddingEducation && (
                            <div className="p-3 rounded-xl bg-[#0E1626] border border-cyan-500/30 space-y-2">
                              <input
                                type="text"
                                value={newEducation.degree}
                                onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })}
                                placeholder="Degree (e.g. BS Computer Science)"
                                className="w-full text-xs px-3 py-1.5 rounded-lg bg-[#070D18] border border-white/10 text-white"
                              />
                              <input
                                type="text"
                                value={newEducation.institution}
                                onChange={(e) => setNewEducation({ ...newEducation, institution: e.target.value })}
                                placeholder="add your education details"
                                className="w-full text-xs px-3 py-1.5 rounded-lg bg-[#070D18] border border-white/10 text-white"
                              />
                              <button
                                type="button"
                                onClick={handleSaveEducation}
                                className="w-full py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs"
                              >
                                Save Education
                              </button>
                            </div>
                          )}

                          <div className="space-y-1.5">
                            {(Array.isArray(profile.education) ? profile.education : []).map((e) => (
                              <div key={e.id} className="p-2 rounded-xl bg-[#0E1626] border border-white/10 flex items-center justify-between text-xs">
                                <div>
                                  <p className="font-bold text-white">{e.institution}</p>
                                  <p className="text-[10px] text-slate-400">{e.degree}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => updateField('education', (profile.education || []).filter(x => x.id !== e.id))}
                                  className="text-slate-500 hover:text-rose-400"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 6. Contact Info */}
                      {sec.key === 'contactInfo' && (
                        <div className="space-y-2 pt-2">
                          <input
                            type="email"
                            value={profile.email || ''}
                            onChange={(e) => updateField('email', e.target.value)}
                            placeholder="Email address"
                            className="w-full text-xs px-3 py-2 rounded-xl bg-[#0E1626] border border-white/10 text-white"
                          />
                          <input
                            type="tel"
                            value={profile.phone || ''}
                            onChange={(e) => updateField('phone', e.target.value)}
                            placeholder="Phone number"
                            className="w-full text-xs px-3 py-2 rounded-xl bg-[#0E1626] border border-white/10 text-white"
                          />
                          <input
                            type="text"
                            value={profile.whatsapp || ''}
                            onChange={(e) => updateField('whatsapp', e.target.value)}
                            placeholder="WhatsApp number"
                            className="w-full text-xs px-3 py-2 rounded-xl bg-[#0E1626] border border-white/10 text-white"
                          />
                          <input
                            type="text"
                            value={profile.location || ''}
                            onChange={(e) => updateField('location', e.target.value)}
                            placeholder="City, Country"
                            className="w-full text-xs px-3 py-2 rounded-xl bg-[#0E1626] border border-white/10 text-white"
                          />
                        </div>
                      )}

                      {/* 7. Social Links */}
                      {sec.key === 'socialLinks' && (
                        <div className="space-y-2 pt-2">
                          {[
                            { p: 'linkedin', label: 'LinkedIn', icon: LinkedInIcon, ph: 'https://linkedin.com/in/username' },
                            { p: 'github', label: 'GitHub', icon: GithubIcon, ph: 'https://github.com/username' },
                            { p: 'twitter', label: 'Twitter', icon: TwitterIcon, ph: 'https://x.com/username' },
                            { p: 'website', label: 'Website', icon: Globe, ph: 'https://yourwebsite.com' }
                          ].map((item) => {
                            const Icon = item.icon;
                            return (
                              <div key={item.p} className="flex items-center gap-2 p-2 rounded-xl bg-[#0E1626] border border-white/10">
                                <Icon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                <input
                                  type="url"
                                  value={getSocialUrl(item.p)}
                                  onChange={(e) => updateSocialUrl(item.p, e.target.value)}
                                  placeholder={item.ph}
                                  className="w-full text-xs bg-transparent text-white focus:outline-hidden"
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* 8. Experience */}
                      {sec.key === 'experience' && (
                        <div className="space-y-2 pt-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Company</label>
                            <input
                              type="text"
                              value={profile.company || ''}
                              onChange={(e) => updateField('company', e.target.value)}
                              placeholder="e.g. Google, Meta"
                              className="w-full text-xs px-3 py-2 rounded-xl bg-[#0E1626] border border-white/10 text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Role</label>
                            <input
                              type="text"
                              value={profile.professionalTitle || profile.designation || ''}
                              onChange={(e) => updateField('professionalTitle', e.target.value)}
                              placeholder="e.g. Lead Engineer"
                              className="w-full text-xs px-3 py-2 rounded-xl bg-[#0E1626] border border-white/10 text-white"
                            />
                          </div>
                        </div>
                      )}

                      {/* 9. Enhance Profile */}
                      {sec.key === 'enhanceProfile' && (
                        <div className="space-y-2 pt-2">
                          <label className="block text-[11px] font-semibold text-slate-300">Custom Profile Details</label>
                          <input
                            type="text"
                            value={newCustomField.label}
                            onChange={(e) => setNewCustomField({ ...newCustomField, label: e.target.value })}
                            placeholder="Section title (e.g. Office Hours)"
                            className="w-full text-xs px-3 py-2 rounded-xl bg-[#0E1626] border border-white/10 text-white"
                          />
                          <input
                            type="text"
                            value={newCustomField.value}
                            onChange={(e) => setNewCustomField({ ...newCustomField, value: e.target.value })}
                            placeholder="Details or link..."
                            className="w-full text-xs px-3 py-2 rounded-xl bg-[#0E1626] border border-white/10 text-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!newCustomField.label) return;
                              const current = profile.customFields || [];
                              updateField('customFields', [...current, { id: `cf-${Date.now()}`, label: newCustomField.label, value: newCustomField.value, visible: true }]);
                              setNewCustomField({ label: '', value: '' });
                              showToast('✓ Custom field added');
                            }}
                            className="w-full py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
                          >
                            + Add Custom Field
                          </button>
                        </div>
                      )}

                      {/* 10. Limitations */}
                      {sec.key === 'limitations' && (
                        <div className="space-y-2 pt-2 text-xs">
                          {[
                            { k: 'phone' as const, l: 'Show Phone to Public Visitors' },
                            { k: 'email' as const, l: 'Show Email to Public Visitors' },
                            { k: 'bio' as const, l: 'Show Bio & Headline' },
                          ].map((item) => (
                            <div key={item.k} className="flex items-center justify-between p-2 rounded-xl bg-[#0E1626] border border-white/10">
                              <span className="text-slate-300">{item.l}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const cur = profile.sharingSettings || {};
                                  updateField('sharingSettings', { ...cur, [item.k]: cur[item.k] === false ? true : false });
                                }}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                  profile.sharingSettings?.[item.k] !== false ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}
                              >
                                {profile.sharingSettings?.[item.k] !== false ? 'Enabled' : 'Off'}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 11. Account info */}
                      {sec.key === 'accountInfo' && (
                        <div className="space-y-2 pt-2 text-xs">
                          <div className="p-2.5 rounded-xl bg-[#0E1626] border border-white/10 flex justify-between">
                            <span className="text-slate-400">Slug / Handle</span>
                            <span className="font-mono text-cyan-400 font-bold">@{profile.slug || profile.id}</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-[#0E1626] border border-white/10 flex justify-between">
                            <span className="text-slate-400">Account Type</span>
                            <span className="font-bold text-white capitalize">{profile.type || 'Individual'}</span>
                          </div>
                        </div>
                      )}

                      {/* 12. Archive */}
                      {sec.key === 'archive' && (
                        <div className="space-y-2 pt-2 text-xs">
                          <p className="text-[11px] text-slate-400">Restoring archived sections will make them visible again on your card.</p>
                          {hiddenSections.map((h) => (
                            <div key={h.key} className="flex items-center justify-between p-2 rounded-xl bg-[#0E1626] border border-white/10">
                              <span className="text-white font-semibold">{h.label}</span>
                              <button
                                type="button"
                                onClick={() => handleToggleVisibility(h.key)}
                                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Restore</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 13. Security */}
                      {sec.key === 'security' && (
                        <div className="p-3 rounded-xl bg-[#0E1626] border border-white/10 space-y-1 text-xs">
                          <p className="font-bold text-emerald-400 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>SSL Encrypted & Protected</span>
                          </p>
                          <p className="text-[11px] text-slate-400">Public profile is sanitized before rendering to visitors.</p>
                        </div>
                      )}

                      {/* 14. Settings */}
                      {sec.key === 'settings' && (
                        <div className="space-y-2 pt-2">
                          <label className="block text-[11px] font-semibold text-slate-300">Custom Profile Slug</label>
                          <input
                            type="text"
                            value={profile.slug || ''}
                            onChange={(e) => updateField('slug', e.target.value)}
                            placeholder="custom-slug"
                            className="w-full text-xs px-3 py-2 rounded-xl bg-[#0E1626] border border-white/10 text-white font-mono"
                          />
                        </div>
                      )}

                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>

        {/* ── HIDDEN SECTIONS GROUP (Matching Image 1) ── */}
        {hiddenSections.length > 0 && (
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-extrabold text-slate-400 tracking-wide">
                Hidden
              </h3>
              <span className="text-[11px] font-mono text-slate-500">
                {hiddenSections.length} Hidden
              </span>
            </div>

            <div className="space-y-2">
              {hiddenSections.map((sec) => {
                const Icon = sec.icon;
                return (
                  <div 
                    key={sec.key}
                    className="rounded-2xl border border-white/5 bg-[#0A101D]/70 p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="text-xs sm:text-sm font-bold text-slate-400 truncate">
                        {sec.label}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleToggleVisibility(sec.key, e)}
                      className="w-9 h-5 rounded-full p-0.5 bg-slate-800 transition-colors cursor-pointer relative"
                      title="Turn on visibility"
                    >
                      <div className="w-4 h-4 rounded-full bg-slate-500 shadow-md transform translate-x-0" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* FIXED BOTTOM BAR (Save & Next - Image 1)                                   */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-[#070D18]/95 backdrop-blur-xl border-t border-white/10 flex justify-center">
        <div className="w-full max-w-md flex items-center justify-between gap-3">
          
          {/* Save Button */}
          <button
            type="button"
            onClick={() => saveProfile()}
            disabled={isSaving}
            className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-sm shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98 transition-all"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save</span>
              </>
            )}
          </button>

          {/* Next Button */}
          <Link
            href={`/profile/${currentIdentifier}`}
            className="flex-1 py-3 px-5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-extrabold text-sm border border-white/10 flex items-center justify-center gap-2 transition-all active:scale-98 shadow-md"
          >
            <span>Next</span>
            <ArrowRight className="w-4 h-4 text-cyan-400" />
          </Link>

        </div>
      </div>

    </div>
  );
}
