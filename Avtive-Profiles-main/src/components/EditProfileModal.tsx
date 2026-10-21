'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  User, 
  Briefcase, 
  Building2, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  Plus,
  Trash2,
  AlertCircle,
  GripVertical,
  ArrowUp,
  ArrowDown,
  MessageSquare,
  Send,
  Calendar,
  Link as LinkIcon
} from 'lucide-react';
import { ProfileData, UserRole, DirectContactItem } from '../types/profile';
import { LinkedInIcon, TwitterXIcon, GithubIcon, InstagramIcon, FacebookIcon } from './BrandIcons';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfileData;
  userRole?: UserRole;
  onSave: (updatedProfile: ProfileData) => void;
}

export function EditProfileModal({
  isOpen,
  onClose,
  profile,
  userRole = 'owner',
  onSave
}: EditProfileModalProps) {
  const [formData, setFormData] = useState<ProfileData>({ ...profile });
  const [activeTab, setActiveTab] = useState<'contact' | 'general' | 'services' | 'socials'>('contact');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Drag & Drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Add Custom Contact state
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactType, setNewContactType] = useState<'linkedin' | 'phone' | 'email' | 'whatsapp' | 'telegram' | 'booking' | 'custom'>('linkedin');
  const [newContactLabel, setNewContactLabel] = useState('');
  const [newContactValue, setNewContactValue] = useState('');

  useEffect(() => {
    setFormData({
      ...profile,
      contactOrder: profile.contactOrder || ['whatsapp', 'phone', 'email', 'linkedin', 'website', 'location'],
      customContacts: profile.customContacts || []
    });
    setErrorMessage(null);
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: formData.id || formData.slug,
          updatedData: formData,
          userRole: userRole
        })
      });

      const isJson = response.headers.get('content-type')?.includes('application/json');
      const result = isJson ? await response.json().catch(() => ({})) : null;

      if (!response.ok) {
        setErrorMessage(
          response.status === 413
            ? 'Profile data is too large. Please select a photo under 4.5MB.'
            : (result?.error || `Unable to update profile (${response.status}).`)
        );
        setIsSaving(false);
        return;
      }

      onSave(formData);
      setIsSaving(false);
      onClose();
    } catch (err) {
      console.error(err);
      onSave(formData);
      setIsSaving(false);
      onClose();
    }
  };

  // Direct Contact Reordering via Up/Down
  const handleMoveContact = (index: number, direction: 'up' | 'down') => {
    const currentOrder = [...(formData.contactOrder || ['whatsapp', 'phone', 'email', 'linkedin', 'website', 'location'])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentOrder.length) return;

    const temp = currentOrder[index];
    currentOrder[index] = currentOrder[targetIndex];
    currentOrder[targetIndex] = temp;

    setFormData({ ...formData, contactOrder: currentOrder });
  };

  // Drag & Drop Handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const currentOrder = [...(formData.contactOrder || ['whatsapp', 'phone', 'email', 'linkedin', 'website', 'location'])];
    const itemToMove = currentOrder.splice(draggedIndex, 1)[0];
    currentOrder.splice(dropIndex, 0, itemToMove);

    setFormData({ ...formData, contactOrder: currentOrder });
    setDraggedIndex(null);
  };

  // Add Contact Option
  const handleAddCustomContact = () => {
    if (!newContactValue.trim()) return;

    const id = `contact-${Date.now()}`;
    const defaultLabels: Record<string, string> = {
      linkedin: 'LinkedIn',
      telegram: 'Telegram',
      booking: 'Schedule Call',
      phone: 'Alternate Mobile',
      email: 'Work Email',
      whatsapp: 'Secondary WhatsApp',
      custom: 'Link'
    };

    const label = newContactLabel.trim() || defaultLabels[newContactType] || 'Contact';

    const newContact: DirectContactItem = {
      id,
      type: newContactType as any,
      label,
      value: newContactValue.trim()
    };

    const updatedCustom = [...(formData.customContacts || []), newContact];
    const updatedOrder = [...(formData.contactOrder || ['whatsapp', 'phone', 'email', 'linkedin', 'website', 'location']), id];

    setFormData({
      ...formData,
      customContacts: updatedCustom,
      contactOrder: updatedOrder
    });

    setNewContactLabel('');
    setNewContactValue('');
    setShowAddContact(false);
  };

  const handleRemoveContact = (key: string) => {
    const updatedOrder = (formData.contactOrder || []).filter(k => k !== key);
    const updatedCustom = (formData.customContacts || []).filter(c => c.id !== key);

    const updatedForm = {
      ...formData,
      contactOrder: updatedOrder,
      customContacts: updatedCustom
    };

    if (key === 'whatsapp') updatedForm.whatsapp = '';
    if (key === 'phone') updatedForm.phone = '';
    if (key === 'email') updatedForm.email = '';
    if (key === 'website') updatedForm.website = '';

    setFormData(updatedForm);
  };

  // Services Helpers
  const handleAddService = () => {
    setFormData({
      ...formData,
      services: [...(formData.services || []), { id: `srv-${Date.now()}`, title: 'New Service' }]
    });
  };

  const handleRemoveService = (index: number) => {
    const updated = [...(formData.services || [])];
    updated.splice(index, 1);
    setFormData({ ...formData, services: updated });
  };

  const handleUpdateService = (index: number, title: string) => {
    const updated = [...(formData.services || [])];
    updated[index] = { ...updated[index], title };
    setFormData({ ...formData, services: updated });
  };

  // Social Link Helpers
  const handleUpdateSocial = (index: number, url: string) => {
    const updated = [...formData.socials];
    updated[index] = { ...updated[index], url };
    setFormData({ ...formData, socials: updated });
  };

  const getContactMeta = (key: string) => {
    if (key === 'whatsapp') return { label: 'WhatsApp', value: formData.whatsapp || 'Not configured', icon: <MessageSquare className="w-4 h-4 text-[#25D366]" />, isCustom: false };
    if (key === 'phone') return { label: 'Mobile / Phone', value: formData.phone || 'Not configured', icon: <Phone className="w-4 h-4 text-[#0284C7]" />, isCustom: false };
    if (key === 'email') return { label: 'Email Address', value: formData.email || 'Not configured', icon: <Mail className="w-4 h-4 text-[#EA4335]" />, isCustom: false };
    if (key === 'website') return { label: 'Website URL', value: formData.website || 'Not configured', icon: <Globe className="w-4 h-4 text-[#2563EB]" />, isCustom: false };
    if (key === 'location') return { label: 'Location / Address', value: formData.officeAddress || formData.location || 'Not configured', icon: <MapPin className="w-4 h-4 text-[#EF4444]" />, isCustom: false };

    if (key === 'linkedin' || key === 'instagram' || key === 'twitter' || key === 'github' || key === 'facebook') {
      const safeSocials = Array.isArray(formData.socials) ? formData.socials : [];
      const soc = safeSocials.find(s => s.platform === key);
      let icon = <LinkedInIcon className="w-4 h-4 text-[#0A66C2]" />;
      let label = 'LinkedIn Profile';
      if (key === 'instagram') { icon = <InstagramIcon className="w-4 h-4 text-[#E4405F]" />; label = 'Instagram'; }
      if (key === 'twitter') { icon = <TwitterXIcon className="w-4 h-4 text-slate-900 dark:text-white" />; label = 'X / Twitter'; }
      if (key === 'github') { icon = <GithubIcon className="w-4 h-4 text-[#24292F] dark:text-white" />; label = 'GitHub'; }
      if (key === 'facebook') { icon = <FacebookIcon className="w-4 h-4 text-[#1877F2]" />; label = 'Facebook'; }

      return { label, value: soc?.handle || soc?.url || 'Configured', icon, isCustom: false };
    }

    // Custom contact
    const custom = formData.customContacts?.find(c => c.id === key);
    if (custom) {
      let icon = <LinkIcon className="w-4 h-4 text-[#6366F1]" />;
      if (custom.type === 'telegram') icon = <Send className="w-4 h-4 text-[#229ED9]" />;
      if (custom.type === 'booking') icon = <Calendar className="w-4 h-4 text-[#10B981]" />;
      return { label: custom.label, value: custom.value, icon, isCustom: true };
    }

    return { label: key, value: '', icon: <Phone className="w-4 h-4" />, isCustom: false };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 text-left">
      <div className="relative w-full max-w-xl max-h-[90dvh] overflow-y-auto rounded-[32px] bg-white dark:bg-[#121216] border border-slate-200 dark:border-white/10 shadow-2xl p-6 sm:p-7 space-y-5 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Edit Profile Information
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white font-mono">
                {formData.type.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
              Manage identity, photo, drag-and-drop contacts, company details & services
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Permission Error Banner */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F8FAFC] dark:bg-[#18181B] border border-slate-200 dark:border-white/10 text-xs font-bold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'contact'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'text-[#475569] dark:text-[#94A3B8] hover:text-slate-900'
            }`}
          >
            Direct Contacts (Drag & Drop)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'general'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'text-[#475569] dark:text-[#94A3B8] hover:text-slate-900'
            }`}
          >
            Identity & Photo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'services'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'text-[#475569] dark:text-[#94A3B8] hover:text-slate-900'
            }`}
          >
            Services
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('socials')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'socials'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'text-[#475569] dark:text-[#94A3B8] hover:text-slate-900'
            }`}
          >
            Social Handles
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* TAB 1: DIRECT CONTACTS WITH DRAG AND DROP & ADD CONTACT OPTION */}
          {activeTab === 'contact' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Header with Add Contact Option Button */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                    Direct Contact Channels
                  </h3>
                  <p className="text-[11px] text-[#94A3B8]">
                    Drag & drop to reorder or click the arrow controls
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddContact(!showAddContact)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-xs hover:opacity-90 transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Contact Option</span>
                </button>
              </div>

              {/* Add New Contact Form Panel */}
              {showAddContact && (
                <div className="p-4 rounded-2xl bg-[#F1F5F9] dark:bg-[#18181B] border border-slate-300 dark:border-white/15 space-y-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Add New Contact Channel
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddContact(false)}
                      className="text-[#94A3B8] hover:text-slate-900 dark:hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-[#475569] dark:text-[#94A3B8] mb-1">
                        Channel Type
                      </label>
                      <select
                        value={newContactType}
                        onChange={(e) => setNewContactType(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#121216] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                      >
                        <option value="linkedin">LinkedIn Profile</option>
                        <option value="telegram">Telegram</option>
                        <option value="phone">Alternate Mobile</option>
                        <option value="email">Work Email</option>
                        <option value="whatsapp">Secondary WhatsApp</option>
                        <option value="custom">Custom Link / Web</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#475569] dark:text-[#94A3B8] mb-1">
                        Custom Label
                      </label>
                      <input
                        type="text"
                        value={newContactLabel}
                        onChange={(e) => setNewContactLabel(e.target.value)}
                        placeholder="e.g. LinkedIn / Office"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#121216] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#475569] dark:text-[#94A3B8] mb-1">
                        Number / URL / Handle *
                      </label>
                      <input
                        type="text"
                        value={newContactValue}
                        onChange={(e) => setNewContactValue(e.target.value)}
                        placeholder="e.g. linkedin.com/in/... or +92..."
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#121216] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddContact(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#475569] dark:text-[#94A3B8]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddCustomContact}
                      className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 text-xs font-bold shadow-xs active:scale-95"
                    >
                      Insert Contact
                    </button>
                  </div>
                </div>
              )}

              {/* Drag-and-Drop Contact List */}
              <div className="space-y-2 p-2 rounded-2xl bg-[#F8FAFC] dark:bg-[#18181B] border border-slate-200 dark:border-white/10">
                {(formData.contactOrder || ['whatsapp', 'phone', 'email', 'linkedin', 'website', 'location']).map((key, idx) => {
                  const item = getContactMeta(key);
                  const isDragging = draggedIndex === idx;

                  return (
                    <div
                      key={key}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={(e) => handleDrop(e, idx)}
                      className={`flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-[#18181B] border transition-all shadow-2xs cursor-grab active:cursor-grabbing ${
                        isDragging
                          ? 'border-slate-500 opacity-40 scale-[0.98]'
                          : 'border-slate-200 dark:border-white/10 hover:border-slate-300'
                      }`}
                    >
                      {/* Left: Drag Handle + Icon + Label & Value */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-[#94A3B8] cursor-grab">
                          <GripVertical className="w-4 h-4" />
                        </div>

                        <div className="w-8 h-8 rounded-xl bg-[#F8FAFC] dark:bg-[#121216] flex items-center justify-center shrink-0 border border-slate-200 dark:border-white/10">
                          {item.icon}
                        </div>

                        <div className="min-w-0 text-left">
                          <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider font-mono">
                            {item.label}
                          </p>
                          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                            {item.value}
                          </p>
                        </div>
                      </div>

                      {/* Right: Up / Down / Remove Controls */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveContact(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1.5 rounded-lg text-[#475569] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#0F172A] disabled:opacity-20"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveContact(idx, 'down')}
                          disabled={idx === (formData.contactOrder?.length || 5) - 1}
                          className="p-1.5 rounded-lg text-[#475569] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#0F172A] disabled:opacity-20"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveContact(key)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          title="Remove Contact Option"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Inline Quick Fields */}
              <div className="pt-2 border-t border-[#E2E8F0] dark:border-white/10 space-y-3">
                <span className="text-[11px] font-bold text-[#475569] dark:text-[#94A3B8] block">
                  Core Contact Values
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-900 dark:text-white mb-1">
                      WhatsApp Number
                    </label>
                    <input
                      type="text"
                      value={formData.whatsapp || ''}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      placeholder="+92 300 1234567"
                      className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-[#18181B] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-900 dark:text-white mb-1">
                      Mobile Phone
                    </label>
                    <input
                      type="text"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+92 300 1234567"
                      className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-[#18181B] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-900 dark:text-white mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@avtive.app"
                      className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-[#18181B] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-900 dark:text-white mb-1">
                      Website URL
                    </label>
                    <input
                      type="text"
                      value={formData.website || ''}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://www.avtive.app"
                      className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-[#18181B] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: IDENTITY, COMPANY & PHOTO */}
          {activeTab === 'general' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAFC] dark:bg-[#18181B] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-400 dark:focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">
                    Designation / Title
                  </label>
                  <input
                    type="text"
                    value={formData.designation || ''}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAFC] dark:bg-[#18181B] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-400 dark:focus:border-white/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={formData.company || ''}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value, companyName: e.target.value })}
                    placeholder="e.g. Avtive"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAFC] dark:bg-[#18181B] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-400 dark:focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAFC] dark:bg-[#18181B] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-400 dark:focus:border-white/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">
                  Profile Photo (PFP) Image URL / Path
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-slate-300 dark:border-white/20">
                    <img src={formData.avatar} alt="PFP" className="w-full h-full object-cover" />
                  </div>
                  <input
                    type="text"
                    value={formData.avatar}
                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-[#F8FAFC] dark:bg-[#18181B] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-400 dark:focus:border-white/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">
                  Short Bio
                </label>
                <input
                  type="text"
                  value={formData.shortBio || ''}
                  onChange={(e) => setFormData({ ...formData, shortBio: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAFC] dark:bg-[#18181B] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-400 dark:focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">
                  Full Bio / About Narrative
                </label>
                <textarea
                  rows={3}
                  value={formData.fullBio || ''}
                  onChange={(e) => setFormData({ ...formData, fullBio: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAFC] dark:bg-[#18181B] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-400 dark:focus:border-white/30"
                />
              </div>
            </div>
          )}

          {/* TAB 3: SERVICES */}
          {activeTab === 'services' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Services List
                </span>
                <button
                  type="button"
                  onClick={handleAddService}
                  className="flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-white hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Service</span>
                </button>
              </div>

              <div className="space-y-2">
                {formData.services?.map((service, idx) => (
                  <div key={service.id || idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={service.title}
                      onChange={(e) => handleUpdateService(idx, e.target.value)}
                      className="flex-1 px-3.5 py-2 rounded-xl bg-[#F8FAFC] dark:bg-[#18181B] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveService(idx)}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SOCIALS */}
          {activeTab === 'socials' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Social Profile Handles & URLs
              </span>

              <div className="space-y-2.5">
                {formData.socials.map((soc, idx) => (
                  <div key={idx} className="space-y-1">
                    <label className="block text-[11px] font-bold text-[#475569] dark:text-[#94A3B8] capitalize">
                      {soc.platform}
                    </label>
                    <input
                      type="text"
                      value={soc.url}
                      onChange={(e) => handleUpdateSocial(idx, e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAFC] dark:bg-[#18181B] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#475569] dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
