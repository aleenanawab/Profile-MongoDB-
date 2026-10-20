import { ProfileData, normalizeProfileType } from '../types/profile';

/**
 * Formats and generates a standard vCard (VCF) 3.0 string from profile data.
 */
export function generateVCardString(profile: ProfileData): string {
  const isTeam = normalizeProfileType(profile.type) === 'team';
  const nameParts = profile.name.trim().split(' ');
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
  const firstName = nameParts[0] || profile.name;

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    isTeam
      ? `FN:${profile.name}`
      : `N:${lastName};${firstName};;;`,
    `FN:${profile.name}`,
    profile.designation ? `TITLE:${profile.designation}` : '',
    profile.company ? `ORG:${profile.company}` : isTeam ? `ORG:${profile.name}` : '',
    profile.phone ? `TEL;TYPE=CELL,VOICE:${profile.phone}` : '',
    profile.email ? `EMAIL;TYPE=INTERNET,WORK:${profile.email}` : '',
    profile.website ? `URL:${profile.website}` : '',
    profile.location ? `ADR;TYPE=WORK:;;${profile.location};;;;` : '',
    profile.shortBio ? `NOTE:${profile.shortBio.replace(/\n/g, ' ')}` : '',
    'END:VCARD'
  ];

  return lines.filter(Boolean).join('\r\n');
}

/**
 * Triggers a client-side .vcf file download to save contact directly into user's address book.
 */
export function downloadVCard(profile: ProfileData): void {
  if (typeof window === 'undefined') return;

  const vcardData = generateVCardString(profile);
  const blob = new Blob([vcardData], { type: 'text/vcard;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  
  const sanitizedName = profile.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const filename = `${sanitizedName}_contact.vcf`;

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
