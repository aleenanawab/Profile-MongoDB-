'use client';

import React, { useState } from 'react';
import { usePortfolioTheme } from '@/context/ThemeContext';
import { Code2, Server, Cloud, Cpu, Check, Terminal, Sparkles } from 'lucide-react';

interface SkillGroup {
  category: string;
  icon: React.ElementType;
  skills: { name: string; level: string; experience: string }[];
}

const SKILL_GROUPS: SkillGroup[] = [
  {
    category: 'Frontend & Architecture',
    icon: Code2,
    skills: [
      { name: 'Next.js 16 (App Router)', level: 'Advanced', experience: '5 yrs' },
      { name: 'React 19 & Server Actions', level: 'Mastery', experience: '7 yrs' },
      { name: 'TypeScript', level: 'Mastery', experience: '6 yrs' },
      { name: 'Tailwind CSS v4', level: 'Advanced', experience: '5 yrs' },
      { name: 'Framer Motion', level: 'Advanced', experience: '4 yrs' },
      { name: 'Turbopack & Webpack', level: 'Proficient', experience: '4 yrs' }
    ]
  },
  {
    category: 'Backend & Distributed Systems',
    icon: Server,
    skills: [
      { name: 'Node.js & Express', level: 'Mastery', experience: '7 yrs' },
      { name: 'Rust (Async/Tokio)', level: 'Proficient', experience: '3 yrs' },
      { name: 'PostgreSQL & BigQuery', level: 'Advanced', experience: '6 yrs' },
      { name: 'Redis Cache & PubSub', level: 'Advanced', experience: '5 yrs' },
      { name: 'REST & gRPC APIs', level: 'Mastery', experience: '6 yrs' },
      { name: 'Prisma & SQLX', level: 'Advanced', experience: '4 yrs' }
    ]
  },
  {
    category: 'Cloud, DevOps & Security',
    icon: Cloud,
    skills: [
      { name: 'Docker Containers', level: 'Advanced', experience: '5 yrs' },
      { name: 'Kubernetes Orchestration', level: 'Proficient', experience: '3 yrs' },
      { name: 'Vercel & Cloudflare Workers', level: 'Advanced', experience: '4 yrs' },
      { name: 'CI/CD Pipelines (GitHub Actions)', level: 'Advanced', experience: '5 yrs' },
      { name: 'JWT & OAuth2 Security', level: 'Mastery', experience: '6 yrs' }
    ]
  },
  {
    category: 'Design Systems & UX Strategy',
    icon: Cpu,
    skills: [
      { name: 'Design Systems & Tokens', level: 'Mastery', experience: '6 yrs' },
      { name: 'Figma Component Libraries', level: 'Advanced', experience: '5 yrs' },
      { name: 'WCAG AA Accessibility (a11y)', level: 'Mastery', experience: '5 yrs' },
      { name: 'Responsive Micro-interactions', level: 'Advanced', experience: '5 yrs' }
    ]
  }
];

export function Skills() {
  const { theme } = usePortfolioTheme();
  const [activeTab, setActiveTab] = useState<number>(0);

  return (
    <section id="skills" className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto border-t border-[var(--border-color)]">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-border)]">
          {theme === 'cyber' ? (
            <>
              <Terminal className="w-3.5 h-3.5" />
              <span>sys.inspect --stack</span>
            </>
          ) : theme === 'luxe' ? (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Capabilities & Mastery</span>
            </>
          ) : (
            <span>Technical Proficiencies</span>
          )}
        </div>

        <h2 className="text-2xl sm:text-4xl font-extrabold font-heading text-[var(--text-primary)] tracking-tight">
          Engineering & Design Stack
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-body">
          Specialized expertise across modern frontend ecosystems, resilient distributed backends, and enterprise-grade design systems.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
        {SKILL_GROUPS.map((group, idx) => {
          const Icon = group.icon;
          const isSelected = activeTab === idx;
          return (
            <button
              key={group.category}
              onClick={() => setActiveTab(idx)}
              style={{
                borderRadius: theme === 'luxe' ? '9999px' : 'var(--radius-btn)'
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all duration-300 select-none ${
                isSelected
                  ? 'bg-[var(--accent)] text-white shadow-sm scale-[1.02]'
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{group.category}</span>
            </button>
          );
        })}
      </div>

      {/* Active Skills Grid */}
      <div 
        style={{
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--card-shadow)'
        }}
        className="p-6 sm:p-8 bg-[var(--bg-card)] border border-[var(--border-color)] transition-all duration-300"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SKILL_GROUPS[activeTab].skills.map((skill) => (
            <div
              key={skill.name}
              style={{
                borderRadius: theme === 'luxe' ? '18px' : 'var(--radius-md)'
              }}
              className="p-3.5 sm:p-4 bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:border-[var(--border-hover)] transition-all duration-300 flex items-center justify-between group"
            >
              <div className="space-y-1 min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)] font-body truncate">
                    {skill.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] font-mono">
                  <span className="text-[var(--accent)] font-semibold">{skill.level}</span>
                  <span>•</span>
                  <span>{skill.experience}</span>
                </div>
              </div>

              <div 
                style={{
                  borderRadius: theme === 'luxe' ? '9999px' : 'var(--radius-sm)'
                }}
                className="w-7 h-7 rounded-md bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center shrink-0 border border-[var(--accent-border)]"
              >
                <Check className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
