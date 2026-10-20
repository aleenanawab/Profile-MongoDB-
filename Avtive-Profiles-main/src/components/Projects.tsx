'use client';

import React, { useState } from 'react';
import { ProjectCard, ProjectData } from './ProjectCard';
import { usePortfolioTheme } from '@/context/ThemeContext';
import { Layers, Terminal, Sparkles, FolderGit2 } from 'lucide-react';

const SAMPLE_PROJECTS: ProjectData[] = [
  {
    id: 'avtive-profiles',
    title: 'Avtive Workspaces & Digital Identity',
    category: 'Full-Stack / Next.js',
    description: 'A multi-workspace professional profile management platform supporting dynamic theme switching, server-side security projection, and vCard/NFC pass generation.',
    tags: ['Next.js 16', 'TypeScript', 'Tailwind CSS', 'Turbopack'],
    metrics: '99.9% Uptime • Zero Data Leaks',
    demoUrl: 'https://avtive.app',
    repoUrl: 'https://github.com/aleenanawab/Avtive-Profiles',
    image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=800&auto=format&fit=crop',
    featured: true
  },
  {
    id: 'synthetix-engine',
    title: 'Synthetix Cloud Consensus & Cache',
    category: 'Systems / Distributed',
    description: 'Ultra-low-latency in-memory cache and state replication engine designed for high-throughput microservice clusters with sub-millisecond p99 latencies.',
    tags: ['Rust', 'gRPC', 'Raft Consensus', 'Docker'],
    metrics: '1.4M Ops/sec • <2ms p99',
    demoUrl: 'https://synthetix-demo.dev',
    repoUrl: 'https://github.com/synthetix-engine',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=800&auto=format&fit=crop',
    featured: true
  },
  {
    id: 'velvet-design-system',
    title: 'Velvet UI & Motion Architecture',
    category: 'Design Systems',
    description: 'Enterprise design system and tokenized component kit featuring accessible color spaces, WCAG AA compliance, and fluid micro-interactions.',
    tags: ['Figma Tokens', 'Radix Primitives', 'Motion', 'Storybook'],
    metrics: '60+ Components • 100% Accessible',
    demoUrl: 'https://velvet-ui.design',
    repoUrl: 'https://github.com/velvet-design-system',
    image: 'https://images.unsplash.com/photo-1545235617-9465d2a55698?q=80&w=800&auto=format&fit=crop',
    featured: true
  },
  {
    id: 'chronos-analytics',
    title: 'Chronos Real-Time Telemetry',
    category: 'Data / AI Platform',
    description: 'Streaming analytics and anomaly detection dashboard parsing gigabytes of event logs in real time with automated predictive alerts.',
    tags: ['Python', 'Apache Arrow', 'Next.js', 'ClickHouse'],
    metrics: '50k Events/s • Live Pipeline',
    demoUrl: 'https://chronos-telemetry.io',
    repoUrl: 'https://github.com/chronos-analytics',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop',
    featured: true
  }
];

export function Projects() {
  const { theme } = usePortfolioTheme();
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const categories = ['all', 'Full-Stack / Next.js', 'Systems / Distributed', 'Design Systems', 'Data / AI Platform'];

  const filteredProjects = activeFilter === 'all'
    ? SAMPLE_PROJECTS
    : SAMPLE_PROJECTS.filter((p) => p.category === activeFilter);

  return (
    <section id="projects" className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-12 gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-border)]">
            {theme === 'cyber' ? (
              <>
                <Terminal className="w-3.5 h-3.5" />
                <span>ls ./projects -l</span>
              </>
            ) : theme === 'luxe' ? (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Portfolio Curation</span>
              </>
            ) : (
              <>
                <FolderGit2 className="w-3.5 h-3.5" />
                <span>Featured Works</span>
              </>
            )}
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold font-heading text-[var(--text-primary)] tracking-tight">
            Selected Works & Deployments
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-body max-w-xl">
            A curated index of production-ready web platforms, distributed systems, and open-source architecture experiments.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              style={{
                borderRadius: theme === 'luxe' ? '9999px' : 'var(--radius-btn)'
              }}
              className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${
                activeFilter === cat
                  ? 'bg-[var(--accent)] text-white font-bold shadow-xs'
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
              }`}
            >
              {cat === 'all' ? 'All Works' : cat.split('/')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {filteredProjects.map((project, index) => (
          <ProjectCard key={project.id} project={project} index={index} />
        ))}
      </div>
    </section>
  );
}
