'use client';

import React, { useState } from 'react';
import { usePortfolioTheme } from '@/context/ThemeContext';
import { Mail, Send, MessageSquare, Check, Terminal, Sparkles, Copy } from 'lucide-react';
import { GithubIcon, LinkedInIcon } from './BrandIcons';

export function ContactSection() {
  const { theme } = usePortfolioTheme();
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSent, setIsSent] = useState(false);

  const emailAddress = 'contact@aleenanawab.com';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(emailAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.message) return;
    setIsSent(true);
    setTimeout(() => {
      setIsSent(false);
      setFormData({ name: '', email: '', message: '' });
    }, 4000);
  };

  return (
    <section id="contact" className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto border-t border-[var(--border-color)]">
      <div 
        style={{
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--card-shadow)'
        }}
        className="p-8 sm:p-12 lg:p-16 bg-[var(--bg-card)] border border-[var(--border-color)] relative overflow-hidden"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
          
          {/* Left Column */}
          <div className="space-y-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-border)]">
              {theme === 'cyber' ? (
                <>
                  <Terminal className="w-3.5 h-3.5" />
                  <span>net.socket // connect</span>
                </>
              ) : theme === 'luxe' ? (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Initiate Inquiry</span>
                </>
              ) : (
                <span>Let&apos;s Connect</span>
              )}
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold font-heading text-[var(--text-primary)] tracking-tight">
              Have a project or architectural vision?
            </h2>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-body leading-relaxed max-w-md">
              Whether you need senior architecture leadership, performance optimization for a high-scale Next.js platform, or custom systems engineering, I&apos;m open for select advisory and engineering roles.
            </p>

            {/* Quick Email Pill */}
            <div className="p-3.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center justify-between gap-3 max-w-md">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-mono font-bold text-[var(--text-muted)]">Direct Email</p>
                  <p className="text-xs font-bold text-[var(--text-primary)] truncate">{emailAddress}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyEmail}
                style={{
                  borderRadius: theme === 'luxe' ? '9999px' : 'var(--radius-btn)'
                }}
                className="px-3 py-1.5 text-xs font-bold bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-all shrink-0 flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Social Channels */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-colors"
                title="GitHub"
              >
                <GithubIcon className="w-4 h-4" />
              </a>

              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-colors"
                title="LinkedIn"
              >
                <LinkedInIcon className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Right Column: Direct Message Box */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold font-mono text-[var(--text-secondary)] mb-1.5 uppercase">
                Your Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Elena Rostova"
                style={{
                  borderRadius: 'var(--radius-btn)'
                }}
                className="w-full px-3.5 py-2.5 text-xs bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-[var(--accent)] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold font-mono text-[var(--text-secondary)] mb-1.5 uppercase">
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="elena@company.com"
                style={{
                  borderRadius: 'var(--radius-btn)'
                }}
                className="w-full px-3.5 py-2.5 text-xs bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-[var(--accent)] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold font-mono text-[var(--text-secondary)] mb-1.5 uppercase">
                Project Overview / Inquiry
              </label>
              <textarea
                rows={4}
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Tell me about your timeline, tech stack, or objectives..."
                style={{
                  borderRadius: 'var(--radius-btn)'
                }}
                className="w-full px-3.5 py-2.5 text-xs bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-[var(--accent)] transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSent}
              style={{
                borderRadius: 'var(--radius-btn)'
              }}
              className="w-full py-3 px-5 text-xs font-bold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {isSent ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Message Dispatched Successfully!</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </section>
  );
}
