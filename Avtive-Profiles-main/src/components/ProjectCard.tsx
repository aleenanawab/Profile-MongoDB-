'use client';

import React from 'react';
import { ExternalLink, ArrowUpRight, Sparkles, Terminal } from 'lucide-react';
import { GithubIcon } from './BrandIcons';
import { usePortfolioTheme } from '@/context/ThemeContext';

export interface ProjectData {
  id: string;
  title: string;
  category: string;
  description: string;
  tags: string[];
  metrics?: string;
  demoUrl?: string;
  repoUrl?: string;
  image?: string;
  featured?: boolean;
}

interface ProjectCardProps {
  project: ProjectData;
  index: number;
}

export function ProjectCard({ project, index }: ProjectCardProps) {
  const { theme } = usePortfolioTheme();

  return (
    <div
      style={{
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--card-shadow)'
      }}
      className="group relative flex flex-col justify-between overflow-hidden bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--border-hover)] transition-all duration-300 hover:-translate-y-1"
    >
      {/* Ambient hover glow for Cyber/Luxe */}
      <div 
        className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          boxShadow: 'var(--glow)'
        }}
      />

      {/* Card Header & Preview Image */}
      <div>
        {project.image && (
          <div className="relative aspect-video w-full overflow-hidden bg-[var(--bg-elevated)] border-b border-[var(--border-color)]">
            <img
              src={project.image}
              alt={project.title}
              className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            />
            {/* Category Pill */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono tracking-wider uppercase bg-[var(--bg-card)]/90 backdrop-blur-md border border-[var(--border-color)] text-[var(--accent)] shadow-sm">
              {theme === 'cyber' && <Terminal className="w-3 h-3 text-[var(--accent)]" />}
              {theme === 'luxe' && <Sparkles className="w-3 h-3 text-[var(--accent)]" />}
              <span>{project.category}</span>
            </div>

            {project.metrics && (
              <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-black/60 backdrop-blur-md text-white border border-white/10">
                {project.metrics}
              </div>
            )}
          </div>
        )}

        {/* Text Content */}
        <div className="p-5 sm:p-6 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg sm:text-xl font-bold font-heading text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors leading-snug">
              {project.title}
            </h3>
            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Visit demo for ${project.title}`}
                className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors p-1"
              >
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            )}
          </div>

          <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-body leading-relaxed line-clamp-3">
            {project.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 pt-2">
            {project.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  borderRadius: theme === 'luxe' ? '9999px' : 'var(--radius-sm)'
                }}
                className={`text-[11px] px-2.5 py-0.5 font-medium transition-colors ${
                  theme === 'cyber'
                    ? 'font-mono bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-border)]'
                    : theme === 'luxe'
                    ? 'bg-[var(--accent-soft)] text-[var(--text-primary)] border border-[var(--border-color)]'
                    : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-color)]'
                }`}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="p-5 sm:p-6 pt-0 flex items-center justify-between border-t border-[var(--border-color)]/60 mt-4">
        <span className="text-[11px] font-mono text-[var(--text-muted)]">
          {theme === 'cyber' ? `sys.project.0${index + 1}` : `Project 0${index + 1}`}
        </span>

        <div className="flex items-center gap-2">
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1.5 rounded-md transition-colors"
              title="View Source Code"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Code</span>
            </a>
          )}

          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                borderRadius: 'var(--radius-btn)'
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition-all shadow-xs"
            >
              <span>Live Demo</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
