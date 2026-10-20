'use client';

import React from 'react';
import { 
  Phone, 
  Mail, 
  MessageSquare, 
  MapPin, 
  Globe, 
  ArrowUpRight,
  Send,
  Calendar,
  Link as LinkIcon,
  Plus,
  Trash2
} from 'lucide-react';
import { ProfileData, SocialLink } from '../types/profile';
import { LinkedInIcon, TwitterXIcon, GithubIcon, InstagramIcon, FacebookIcon, BehanceIcon } from './BrandIcons';
import { ThemeConfig, getThemeConfig } from './themeStyles';

interface DirectContactSectionProps {
  profile: ProfileData;
  isEditing?: boolean;
  onUpdateField?: (field: keyof ProfileData, value: any) => void;
  theme?: ThemeConfig;
}

export function DirectContactSection({ 
  profile, 
  isEditing = false, 
  onUpdateField,
  theme = getThemeConfig(profile.theme || 'elegant')
}: DirectContactSectionProps) {
  const contactOrder = profile.contactOrder || ['whatsapp', 'phone', 'email', 'website', 'location'];
  const unifiedIconBg = theme.badgeBg;
  const unifiedIconColor = theme.accentText;

  if (isEditing) {
    // In edit mode: Render clean inline editable contact fields directly inside the card in the single theme color
    return (
      <div className="pt-4 space-y-2.5 text-left">
        <div className="flex items-center justify-between">
          <p className={`text-[11px] font-bold uppercase tracking-wider font-mono ${theme.accentText}`}>
            Direct Contact Channels (Edit In-Place)
          </p>
        </div>

        <div className="space-y-2">
          {/* WhatsApp */}
          <div className={`flex items-center gap-2.5 p-2.5 rounded-2xl ${theme.cardBg} border ${theme.cardBorder}`}>
            <div className={`w-8 h-8 rounded-xl ${unifiedIconBg} flex items-center justify-center shrink-0`}>
              <MessageSquare className={`w-4 h-4 ${theme.accentText}`} />
            </div>
            <div className="flex-1 min-w-0">
              <label className={`block text-[10px] font-bold ${theme.textMuted} uppercase font-mono`}>
                WhatsApp
              </label>
              <input
                type="text"
                value={profile.whatsapp || ''}
                onChange={(e) => onUpdateField?.('whatsapp', e.target.value)}
                placeholder="+92 312 0000000"
                className={`w-full bg-transparent text-xs font-semibold ${theme.textPrimary} focus:outline-none border-b border-dashed ${theme.divider}`}
              />
            </div>
          </div>

          {/* Mobile Phone */}
          <div className={`flex items-center gap-2.5 p-2.5 rounded-2xl ${theme.cardBg} border ${theme.cardBorder}`}>
            <div className={`w-8 h-8 rounded-xl ${unifiedIconBg} flex items-center justify-center shrink-0`}>
              <Phone className={`w-4 h-4 ${theme.accentText}`} />
            </div>
            <div className="flex-1 min-w-0">
              <label className={`block text-[10px] font-bold ${theme.textMuted} uppercase font-mono`}>
                Mobile Phone
              </label>
              <input
                type="text"
                value={profile.phone || ''}
                onChange={(e) => onUpdateField?.('phone', e.target.value)}
                placeholder="+92 300 0000000"
                className={`w-full bg-transparent text-xs font-semibold ${theme.textPrimary} focus:outline-none border-b border-dashed ${theme.divider}`}
              />
            </div>
          </div>

          {/* Email */}
          <div className={`flex items-center gap-2.5 p-2.5 rounded-2xl ${theme.cardBg} border ${theme.cardBorder}`}>
            <div className={`w-8 h-8 rounded-xl ${unifiedIconBg} flex items-center justify-center shrink-0`}>
              <Mail className={`w-4 h-4 ${theme.accentText}`} />
            </div>
            <div className="flex-1 min-w-0">
              <label className={`block text-[10px] font-bold ${theme.textMuted} uppercase font-mono`}>
                Email Address
              </label>
              <input
                type="email"
                value={profile.email || ''}
                onChange={(e) => onUpdateField?.('email', e.target.value)}
                placeholder="name@avtive.app"
                className={`w-full bg-transparent text-xs font-semibold ${theme.textPrimary} focus:outline-none border-b border-dashed ${theme.divider}`}
              />
            </div>
          </div>

          {/* Website */}
          <div className={`flex items-center gap-2.5 p-2.5 rounded-2xl ${theme.cardBg} border ${theme.cardBorder}`}>
            <div className={`w-8 h-8 rounded-xl ${unifiedIconBg} flex items-center justify-center shrink-0`}>
              <Globe className={`w-4 h-4 ${theme.accentText}`} />
            </div>
            <div className="flex-1 min-w-0">
              <label className={`block text-[10px] font-bold ${theme.textMuted} uppercase font-mono`}>
                Website / Link
              </label>
              <input
                type="url"
                value={profile.website || ''}
                onChange={(e) => onUpdateField?.('website', e.target.value)}
                placeholder="https://www.avtive.app"
                className={`w-full bg-transparent text-xs font-semibold ${theme.textPrimary} focus:outline-none border-b border-dashed ${theme.divider}`}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normal Read View: Styled strictly in the single theme color
  const contactMap: Record<string, {
    label: string;
    value: string;
    href: string;
    target?: string;
    iconBg: string;
    iconColor: string;
    icon: React.ReactNode;
  } | null> = {
    whatsapp: profile.whatsapp ? {
      label: 'WhatsApp',
      value: profile.whatsapp,
      href: `https://wa.me/${profile.whatsapp.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(profile.name)}`,
      target: '_blank',
      iconBg: unifiedIconBg,
      iconColor: unifiedIconColor,
      icon: <MessageSquare className={`w-4 h-4 ${theme.accentText}`} />
    } : null,

    phone: profile.phone ? {
      label: 'Mobile',
      value: profile.phone,
      href: `tel:${profile.phone.replace(/[^0-9+]/g, '')}`,
      iconBg: unifiedIconBg,
      iconColor: unifiedIconColor,
      icon: <Phone className={`w-4 h-4 ${theme.accentText}`} />
    } : null,

    email: profile.email ? {
      label: 'Email',
      value: profile.email,
      href: `mailto:${profile.email}`,
      iconBg: unifiedIconBg,
      iconColor: unifiedIconColor,
      icon: <Mail className={`w-4 h-4 ${theme.accentText}`} />
    } : null,

    website: profile.website ? {
      label: 'Website',
      value: profile.website.replace(/^https?:\/\//, ''),
      href: profile.website.startsWith('http') ? profile.website : `https://${profile.website}`,
      target: '_blank',
      iconBg: unifiedIconBg,
      iconColor: unifiedIconColor,
      icon: <Globe className={`w-4 h-4 ${theme.accentText}`} />
    } : null,

    location: (profile.location || profile.officeAddress) ? {
      label: 'Location',
      value: profile.officeAddress || profile.location,
      href: profile.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(profile.officeAddress || profile.location)}`,
      target: '_blank',
      iconBg: unifiedIconBg,
      iconColor: unifiedIconColor,
      icon: <MapPin className={`w-4 h-4 ${theme.accentText}`} />
    } : null,
  };

  // Add social platforms into the direct contact channels with unified theme color
  if (profile.socials && profile.socials.length > 0) {
    profile.socials.forEach((soc) => {
      if (soc.url) {
        let icon = <LinkedInIcon className={`w-4 h-4 ${theme.accentText}`} />;
        let label = soc.label || 'LinkedIn';

        if (soc.platform === 'instagram') {
          icon = <InstagramIcon className={`w-4 h-4 ${theme.accentText}`} />;
          label = soc.label || 'Instagram';
        } else if (soc.platform === 'twitter') {
          icon = <TwitterXIcon className={`w-4 h-4 ${theme.accentText}`} />;
          label = soc.label || 'X / Twitter';
        } else if (soc.platform === 'github') {
          icon = <GithubIcon className={`w-4 h-4 ${theme.accentText}`} />;
          label = soc.label || 'GitHub';
        } else if (soc.platform === 'facebook') {
          icon = <FacebookIcon className={`w-4 h-4 ${theme.accentText}`} />;
          label = soc.label || 'Facebook';
        } else if (soc.platform === 'behance') {
          icon = <BehanceIcon className={`w-4 h-4 ${theme.accentText}`} />;
          label = soc.label || 'Behance';
        }

        contactMap[soc.platform] = {
          label,
          value: soc.handle || soc.url.replace(/^https?:\/\/(www\.)?/, ''),
          href: soc.url.startsWith('http') ? soc.url : `https://${soc.url}`,
          target: '_blank',
          iconBg: unifiedIconBg,
          iconColor: unifiedIconColor,
          icon
        };
      }
    });
  }

  // Filter items in custom saved order
  const activeItems = contactOrder
    .map(key => contactMap[key])
    .filter((item): item is NonNullable<typeof item> => item !== null && item !== undefined);

  if (activeItems.length === 0) return null;

  return (
    <div className="pt-4 space-y-2">
      <div className="space-y-1.5">
        {activeItems.map((item, idx) => (
          <a
            key={idx}
            href={item.href}
            target={item.target}
            rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}
            className={`flex items-center justify-between p-3 rounded-2xl ${theme.cardBg} hover:opacity-90 border ${theme.cardBorder} ${theme.hoverBorder} transition-all group shadow-2xs hover:shadow-xs active:scale-[0.99]`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-8 h-8 rounded-xl ${item.iconBg} flex items-center justify-center shrink-0 border ${theme.cardBorder} shadow-2xs`}>
                {item.icon}
              </div>
              <div className="min-w-0 text-left">
                <p className={`text-[10px] font-bold ${theme.textMuted} uppercase tracking-wider font-mono`}>
                  {item.label}
                </p>
                <p className={`text-xs font-semibold ${theme.textPrimary} truncate`}>
                  {item.value}
                </p>
              </div>
            </div>

            <ArrowUpRight className={`w-4 h-4 ${theme.textMuted} group-hover:${theme.accentText} group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 ml-2`} />
          </a>
        ))}
      </div>
    </div>
  );
}
