'use client';

import React from 'react';
import { Star } from 'lucide-react';
import { ProfileData } from '../types/profile';
import { getThemeConfig } from './themeStyles';

interface TestimonialsSectionProps {
  profile: ProfileData;
}

export function TestimonialsSection({ profile }: TestimonialsSectionProps) {
  if (!profile.testimonials || profile.testimonials.length === 0) {
    return null;
  }

  const theme = getThemeConfig(profile.theme || 'elegant');

  return (
    <section className={`px-6 sm:px-8 py-5 space-y-3.5 text-left ${theme.cardBg} border-b ${theme.divider} transition-colors`}>
      <h2 className={`text-xs font-bold uppercase tracking-wider ${theme.textPrimary} font-mono`}>
        Testimonials
      </h2>

      <div className="space-y-3">
        {profile.testimonials.map((item) => (
          <div
            key={item.id}
            className={`p-4 sm:p-5 rounded-2xl ${theme.cardBg} border ${theme.cardBorder} space-y-3 shadow-2xs`}
          >
            <p className={`text-xs sm:text-sm ${theme.textSecondary} leading-relaxed italic font-normal`}>
              “{item.quote}”
            </p>

            <div className={`flex items-center justify-between pt-2 border-t ${theme.divider}`}>
              <div className="flex items-center gap-3">
                <img
                  src={item.avatar}
                  alt={item.author}
                  className={`w-9 h-9 rounded-full object-cover border ${theme.cardBorder}`}
                />
                <div>
                  <h4 className={`text-xs font-bold ${theme.textPrimary}`}>
                    {item.author}
                  </h4>
                  <p className={`text-[10px] ${theme.textSecondary} font-medium`}>
                    {item.designation} • {item.company}
                  </p>
                </div>
              </div>

              {item.rating && (
                <div className={`flex items-center gap-0.5 ${theme.accentText}`}>
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-current" />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
