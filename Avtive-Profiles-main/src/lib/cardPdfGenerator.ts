import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { ProfileData } from '@/types/profile';

export async function generateCardPdf(profile: ProfileData, isDark = false): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  // Color Palette based on Dark / Light mode
  const bgFill = isDark ? [14, 21, 38] : [255, 255, 255];
  const cardBg = isDark ? [18, 27, 49] : [248, 250, 252];
  const cardBorder = isDark ? [45, 60, 90] : [226, 232, 240];
  const primaryText = isDark ? [255, 255, 255] : [15, 23, 42];
  const secondaryText = isDark ? [148, 163, 184] : [100, 116, 139];
  const accentColor = isDark ? [6, 182, 212] : [14, 116, 144]; // Cyan / Deep Teal
  const accentLight = isDark ? [8, 145, 178] : [194, 65, 12]; // Accent

  // Set Background
  doc.setFillColor(bgFill[0], bgFill[1], bgFill[2]);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  let currentY = 18;

  // Header Bar
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text('AVTIVE', margin, currentY);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(secondaryText[0], secondaryText[1], secondaryText[2]);
  doc.text('DIGITAL IDENTITY STANDARD  •  OFFICIAL PASS', margin + 24, currentY);

  currentY += 4;
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.setLineWidth(0.4);
  doc.line(margin, currentY, margin + contentWidth, currentY);

  currentY += 8;

  // ──────────────────────────────────────────────────────────────────────────
  // 1. FRONT CARD (CR80 standard aspect ratio ~ 86mm x 54mm)
  // ──────────────────────────────────────────────────────────────────────────
  const cardW = 86;
  const cardH = 54;
  const frontX = margin;
  const frontY = currentY;

  // Card Outer Shadow / Border & Background
  doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(frontX, frontY, cardW, cardH, 3, 3, 'FD');

  // Accent Rim at top of card
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.roundedRect(frontX, frontY, cardW, 2, 1, 1, 'F');

  // Front Header: AVTIVE symbol & SAAS PASS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text('AVTIVE', frontX + 5, frontY + 7);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(secondaryText[0], secondaryText[1], secondaryText[2]);
  doc.text('SAAS PASS', frontX + cardW - 20, frontY + 7);

  // Front Middle: Name & Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryText[0], primaryText[1], primaryText[2]);
  const safeName = profile.name || 'Professional User';
  doc.text(safeName.substring(0, 24), frontX + 5, frontY + 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(accentLight[0], accentLight[1], accentLight[2]);
  const designation = profile.profession || profile.designation || 'Professional';
  doc.text(designation.substring(0, 32), frontX + 5, frontY + 27);

  // Company and Location
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(secondaryText[0], secondaryText[1], secondaryText[2]);
  const company = profile.company || profile.companyInfo?.name || 'Avtive Network';
  doc.text(company.substring(0, 30), frontX + 5, frontY + 36);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  const location = profile.location || 'Global';
  doc.text(location.substring(0, 30), frontX + 5, frontY + 41);

  // Card Bottom Right Badge
  doc.setFontSize(6);
  doc.setFont('courier', 'bold');
  doc.setTextColor(secondaryText[0], secondaryText[1], secondaryText[2]);
  doc.text('VERIFIED ID', frontX + cardW - 22, frontY + cardH - 5);

  // ──────────────────────────────────────────────────────────────────────────
  // 2. BACK CARD (WITH REAL QR CODE)
  // ──────────────────────────────────────────────────────────────────────────
  const backX = margin + cardW + 8;
  const backY = currentY;

  doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.roundedRect(backX, backY, cardW, cardH, 3, 3, 'FD');

  // Back Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text('AVTIVE DIGITAL IDENTITY', backX + 5, backY + 7);

  // Generate QR Code image data
  const profileUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/profile/${encodeURIComponent(profile.slug || profile.id)}`
    : `https://www.avtive.app/profile/${profile.slug || profile.id}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(profileUrl, {
      width: 140,
      margin: 0,
      color: {
        dark: isDark ? '#FFFFFF' : '#0F172A',
        light: isDark ? '#121B31' : '#FFFFFF'
      }
    });

    const qrSize = 28;
    const qrX = backX + (cardW - qrSize) / 2;
    const qrY = backY + 11;
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
  } catch (err) {
    console.error('Error generating QR code for PDF:', err);
  }

  // QR Instruction
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(primaryText[0], primaryText[1], primaryText[2]);
  doc.text('Scan to View Verified Profile', backX + cardW / 2, backY + 44, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(secondaryText[0], secondaryText[1], secondaryText[2]);
  doc.text(profileUrl.substring(0, 42), backX + cardW / 2, backY + 48, { align: 'center' });

  currentY += cardH + 10;

  // ──────────────────────────────────────────────────────────────────────────
  // 3. SAVED PROFILE SUMMARY & DETAILS SECTION
  // ──────────────────────────────────────────────────────────────────────────
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, currentY, margin + contentWidth, currentY);

  currentY += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryText[0], primaryText[1], primaryText[2]);
  doc.text('Profile Specifications & Credentials', margin, currentY);

  currentY += 6;

  // Bio Section
  if (profile.shortBio || profile.bio || profile.about) {
    const bioText = profile.shortBio || profile.bio || profile.about || '';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(secondaryText[0], secondaryText[1], secondaryText[2]);
    doc.text('ABOUT & BIO', margin, currentY);
    currentY += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(primaryText[0], primaryText[1], primaryText[2]);
    const splitBio = doc.splitTextToSize(bioText, contentWidth);
    doc.text(splitBio, margin, currentY);
    currentY += splitBio.length * 4.2 + 4;
  }

  // Contact Channels Grid
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(secondaryText[0], secondaryText[1], secondaryText[2]);
  doc.text('VERIFIED CONTACT CHANNELS', margin, currentY);
  currentY += 4;

  const contacts = [
    { label: 'Email', val: profile.email },
    { label: 'Phone', val: profile.phone },
    { label: 'WhatsApp', val: profile.whatsapp },
    { label: 'Website', val: profile.website },
    { label: 'Location', val: profile.location }
  ].filter(c => Boolean(c.val));

  doc.setFontSize(8);
  const colWidth = contentWidth / 2;
  contacts.forEach((contact, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = margin + col * colWidth;
    const y = currentY + row * 5;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(secondaryText[0], secondaryText[1], secondaryText[2]);
    doc.text(`${contact.label}: `, x, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(primaryText[0], primaryText[1], primaryText[2]);
    doc.text(String(contact.val).substring(0, 36), x + 20, y);
  });

  currentY += Math.ceil(contacts.length / 2) * 5 + 6;

  // Skills & Expertise
  if (Array.isArray(profile.skills) && profile.skills.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(secondaryText[0], secondaryText[1], secondaryText[2]);
    doc.text('CORE SKILLS & EXPERTISE', margin, currentY);
    currentY += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(primaryText[0], primaryText[1], primaryText[2]);
    const skillsText = profile.skills.join('  •  ');
    const splitSkills = doc.splitTextToSize(skillsText, contentWidth);
    doc.text(splitSkills, margin, currentY);
    currentY += splitSkills.length * 4 + 6;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 4. CUSTOM FIELDS
  // ──────────────────────────────────────────────────────────────────────────
  const customFields = Array.isArray(profile.customFields)
    ? profile.customFields.filter(f => f && (f.label || f.value) && f.visible !== false)
    : [];

  if (customFields.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(secondaryText[0], secondaryText[1], secondaryText[2]);
    doc.text('CUSTOM FIELDS & ATTRIBUTES', margin, currentY);
    currentY += 4;

    customFields.forEach((field) => {
      if (currentY > pageHeight - 25) return; // prevent page overflow

      const label = field.label || 'Attribute';
      const val = field.value || (field as any).content || 'N/A';

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text(`${label}: `, margin, currentY);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(primaryText[0], primaryText[1], primaryText[2]);
      const splitVal = doc.splitTextToSize(val, contentWidth - 30);
      doc.text(splitVal, margin + 28, currentY);

      currentY += splitVal.length * 4.2 + 2;
    });

    currentY += 4;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // FOOTER
  // ──────────────────────────────────────────────────────────────────────────
  const footerY = pageHeight - 12;
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 4, margin + contentWidth, footerY - 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(secondaryText[0], secondaryText[1], secondaryText[2]);
  doc.text(
    `Generated by Avtive Digital Identity Standard  •  ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}  •  All Rights Reserved`,
    margin,
    footerY
  );

  doc.setFont('courier', 'bold');
  doc.text('CONFIDENTIAL & VERIFIED', margin + contentWidth - 35, footerY);

  // Trigger download
  const filename = `${profile.slug || profile.id || 'digital-identity'}-card.pdf`;
  doc.save(filename);
}
