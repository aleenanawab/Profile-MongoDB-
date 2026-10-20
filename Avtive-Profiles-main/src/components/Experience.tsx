'use client';

import React from 'react';
import { usePortfolioTheme } from '@/context/ThemeContext';
import { Briefcase, GraduationCap, Calendar, MapPin, Terminal, Sparkles } from 'lucide-react';

interface TimelineItem {
  type: 'work' | 'education';
  role: string;
  organization: string;
  period: string;
  location: string;
  description: string;
  highlights: string[];
}

const TIMELINE_DATA: TimelineItem[] = [
  {
    type: 'work',
    role: 'Principal Frontend Architect',
    organization: 'Horizon Cloud Platform',
    period: '2023 — Present',
    location: 'San Francisco, CA (Remote)',
    description: 'Directing the web architecture, Core Web Vitals performance, and multi-tenant design systems for over 2M active monthly users.',
    highlights: [
      'Led migration to Next.js App Router and Turbopack, boosting build throughput by 4.2x.',
      'Authored zero-runtime CSS tokens powering 40+ unified product surfaces.',
      'Achieved 99.8% Core Web Vitals pass rate across all enterprise customer dashboards.'
    ]
  },
  {
    type: 'work',
    role: 'Lead Full-Stack Engineer',
    organization: 'Synthetix Distributed Labs',
    period: '2021 — 2023',
    location: 'Austin, TX',
    description: 'Spearheaded distributed microservices and real-time streaming interfaces using Node.js, Rust, and PostgreSQL.',
    highlights: [
      'Architected high-throughput message bus processing 1.4M events/sec.',
      'Designed end-to-end telemetry system and automated failure recovery protocols.',
      'Mentored 12 mid-level and junior engineers across systems and UI engineering.'
    ]
  },
  {
    type: 'work',
    role: 'Senior Product Engineer',
    organization: 'Nexus Interactive Systems',
    period: '2019 — 2021',
    location: 'New York, NY',
    description: 'Engineered responsive web applications, design systems, and customer-facing authentication workflows.',
    highlights: [
      'Built custom component library adopted across 6 client product lines.',
      'Implemented tokenized authentication and granular role-based access controls.'
    ]
  },
  {
    type: 'education',
    role: 'B.S. in Computer Science (Honors)',
    organization: 'National University of Science & Technology',
    period: '2015 — 2019',
    location: 'Islamabad, PK',
    description: 'Specialization in Distributed Systems, Human-Computer Interaction (HCI), and Software Architecture.',
    highlights: [
      'Dean’s Honor List for Academic Excellence.',
      'President of Open Source Software & Systems Society.'
    ]
  }
];

export function Experience() {
  const { theme } = usePortfolioTheme();

  return (
    <section id="experience" className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto border-t border-[var(--border-color)]">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-border)]">
          {theme === 'cyber' ? (
            <>
              <Terminal className="w-3.5 h-3.5" />
              <span>history --career</span>
            </>
          ) : theme === 'luxe' ? (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Professional Trajectory</span>
            </>
          ) : (
            <span>Career & Academic Journey</span>
          )}
        </div>

        <h2 className="text-2xl sm:text-4xl font-extrabold font-heading text-[var(--text-primary)] tracking-tight">
          Experience & Education
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-body">
          A progression of high-impact engineering leadership roles, technical milestones, and academic rigor.
        </p>
      </div>

      {/* Timeline List */}
      <div className="space-y-6 sm:space-y-8">
        {TIMELINE_DATA.map((item, idx) => {
          const isWork = item.type === 'work';
          return (
            <div
              key={item.role + item.period}
              style={{
                borderRadius: 'var(--radius-card)',
                boxShadow: 'var(--card-shadow)'
              }}
              className="p-6 sm:p-8 bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--border-hover)] transition-all duration-300 relative group"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-3.5">
                  <div 
                    style={{
                      borderRadius: theme === 'luxe' ? '9999px' : 'var(--radius-md)'
                    }}
                    className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center shrink-0 border border-[var(--accent-border)] mt-0.5"
                  >
                    {isWork ? <Briefcase className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-bold font-heading text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                      {item.role}
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-[var(--accent)] font-body">
                      {item.organization}
                    </p>
                  </div>
                </div>

                {/* Period & Location Pills */}
                <div className="flex sm:flex-col sm:items-end gap-2 text-xs font-mono text-[var(--text-muted)] shrink-0">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>{item.period}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <span>{item.location}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-body leading-relaxed mb-4">
                {item.description}
              </p>

              {/* Highlights Bullets */}
              <div className="space-y-1.5 pt-1 border-t border-[var(--border-color)]/60">
                {item.highlights.map((bullet, bIdx) => (
                  <div key={bIdx} className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                    <span className="text-[var(--accent)] font-mono font-bold">›</span>
                    <span className="leading-relaxed">{bullet}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
