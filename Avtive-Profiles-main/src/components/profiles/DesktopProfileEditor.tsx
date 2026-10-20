'use client';

import React from 'react';
import { DesktopProfileSidebar } from './DesktopProfileSidebar';
import { DesktopProfileContent } from './DesktopProfileContent';

export function DesktopProfileEditor() {
  return (
    <div className="w-full h-[calc(100vh-56px)] flex flex-row overflow-hidden bg-[#080D1A]">
      <DesktopProfileSidebar />
      <DesktopProfileContent />
    </div>
  );
}
