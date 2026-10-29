'use client';

import React from 'react';
import { ArrowRight, Pencil, Plus, X, FolderGit2, ExternalLink } from 'lucide-react';
import { ProfileData, ProjectItem } from '@/types/profile';
import { ThemeConfig, getThemeConfig } from '@/components/ui/themeStyles';
import { FormLabel, FormInput, FormTextarea, SectionSaveBar } from '@/components/ui/formControls';

interface PortfolioSectionProps {
  profile: ProfileData;
  onSelectProject?: (project: ProjectItem) => void;
  theme?: ThemeConfig;
  canEdit?: boolean;
  isEditing?: boolean;
  onUpdateField?: (field: keyof ProfileData, value: any) => void;
  onSavePartial?: (partialData: Partial<ProfileData>) => Promise<ProfileData>;
  onSelectSection?: (sectionKey: string, fieldKey?: string) => void;
}

export function PortfolioSection({ 
  profile, 
  onSelectProject, 
  theme = getThemeConfig(profile.theme || 'elegant'),
  canEdit = false,
  isEditing = false,
  onUpdateField,
  onSavePartial,
  onSelectSection
}: PortfolioSectionProps) {
  const [projectsDraft, setProjectsDraft] = React.useState<ProjectItem[]>(profile.projects || []);
  const [snapshot, setSnapshot] = React.useState<ProjectItem[]>(profile.projects || []);
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>();

  React.useEffect(() => {
    const next = profile.projects || [];
    setProjectsDraft(next);
    setSnapshot(next);
  }, [profile.id, profile.projects]);

  const isDirty = JSON.stringify(projectsDraft) !== JSON.stringify(snapshot);

  const handleSave = async () => {
    setSaveStatus('saving');
    setErrorMessage(undefined);
    try {
      const payload: Partial<ProfileData> = {
        projects: projectsDraft,
      };
      if (onSavePartial) {
        await onSavePartial(payload);
      }
      onUpdateField?.('projects', projectsDraft);
      setSnapshot(projectsDraft);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err: any) {
      setSaveStatus('error');
      setErrorMessage(err?.message || 'Failed to save projects');
    }
  };

  const handleCancel = () => {
    setProjectsDraft(snapshot);
    setSaveStatus('idle');
    setErrorMessage(undefined);
  };

  const hasProjects = projectsDraft.length > 0;

  if (!hasProjects && !canEdit && !isEditing) {
    return null;
  }

  const handleAddProject = () => {
    const newProject: ProjectItem = {
      id: `proj-${Date.now()}`,
      title: '',
      description: '',
      tags: [],
      link: ''
    };
    const next = [newProject, ...projectsDraft];
    setProjectsDraft(next);
    onUpdateField?.('projects', next);
  };

  const handleUpdateProject = (id: string, updates: Partial<ProjectItem>) => {
    const next = projectsDraft.map((p) => (p.id === id ? { ...p, ...updates } : p));
    setProjectsDraft(next);
    onUpdateField?.('projects', next);
  };

  const handleRemoveProject = (id: string) => {
    const next = projectsDraft.filter((p) => p.id !== id);
    setProjectsDraft(next);
    onUpdateField?.('projects', next);
  };

  return (
    <section className={`relative group/port px-4 sm:px-6 md:px-8 py-5 space-y-3.5 text-left ${theme.cardBg} border-b ${theme.divider} transition-colors ${
      canEdit && !isEditing && onSelectSection ? 'hover:bg-accent/5 transition-all' : ''
    }`}>
      <div className="flex items-center justify-between">
        <div 
          className={`flex items-center gap-2 ${canEdit && !isEditing && onSelectSection ? 'cursor-pointer' : ''}`}
          onClick={() => canEdit && !isEditing && onSelectSection?.('projects')}
        >
          <h2 className={`text-sm font-bold tracking-tight ${theme.textPrimary}`}>
            Projects
          </h2>
          {canEdit && !isEditing && onSelectSection && (
            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
              Click to edit
            </span>
          )}
        </div>

        {isEditing ? (
          <button
            type="button"
            onClick={handleAddProject}
            className={`flex items-center gap-1 text-[11px] font-bold ${theme.accentText} hover:underline cursor-pointer`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Project</span>
          </button>
        ) : hasProjects ? (
          <span 
            onClick={(e) => {
              if (canEdit && onSelectSection) {
                e.stopPropagation();
                onSelectSection('projects');
              }
            }}
            className={`text-xs ${theme.accentText} font-medium flex items-center gap-1 hover:underline cursor-pointer`}
          >
            {canEdit ? 'Manage' : 'View All'} <ArrowRight className="w-3.5 h-3.5" />
          </span>
        ) : null}
      </div>

      {/* Visual Project Cards */}
      {hasProjects ? (
        <div className="space-y-4">
          {projectsDraft.map((project) => (
            <div
              key={project.id}
              onClick={() => {
                if (!isEditing && onSelectProject) {
                  onSelectProject(project);
                }
              }}
              className={`group/card relative rounded-2xl overflow-hidden ${theme.cardBg} border ${theme.cardBorder} ${
                isEditing ? '' : 'cursor-pointer ' + theme.hoverBorder
              } transition-all shadow-2xs hover:shadow-md`}
            >
              {isEditing ? (
                /* Editable Project Item */
                <div className="p-4 sm:p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <FormLabel required>Project Title</FormLabel>
                        <FormInput
                          value={project.title || ''}
                          onChange={(val) => handleUpdateProject(project.id, { title: val })}
                          placeholder="e.g. AI Workflow Platform"
                        />
                      </div>
                      <div>
                        <FormLabel>Category / Domain</FormLabel>
                        <FormInput
                          value={project.category || ''}
                          onChange={(val) => handleUpdateProject(project.id, { category: val })}
                          placeholder="e.g. Full Stack · Open Source"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveProject(project.id)}
                      className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer shrink-0 mt-6"
                      title="Remove project"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <FormLabel>Project Description</FormLabel>
                    <FormTextarea
                      rows={2}
                      value={project.description || ''}
                      onChange={(val) => handleUpdateProject(project.id, { description: val })}
                      placeholder="Brief description of project features and outcome..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <FormLabel>Live URL / Repository</FormLabel>
                      <FormInput
                        type="url"
                        value={project.link || (project as any).url || ''}
                        onChange={(val) => handleUpdateProject(project.id, { link: val, url: val } as any)}
                        placeholder="https://github.com/... or https://..."
                      />
                    </div>
                    <div>
                      <FormLabel>Contributors</FormLabel>
                      <FormInput
                        value={project.contributors || ''}
                        onChange={(val) => handleUpdateProject(project.id, { contributors: val })}
                        placeholder="e.g. John Doe, Jane Smith"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <FormLabel>Start Date</FormLabel>
                      <FormInput
                        value={project.startDate || ''}
                        onChange={(val) => handleUpdateProject(project.id, { startDate: val })}
                        placeholder="e.g. Jan 2023"
                      />
                    </div>
                    <div>
                      <FormLabel>End Date</FormLabel>
                      <FormInput
                        value={project.endDate || ''}
                        onChange={(val) => handleUpdateProject(project.id, { endDate: val })}
                        placeholder="e.g. Jun 2023 / Ongoing"
                      />
                    </div>
                  </div>

                  <div>
                    <FormLabel>Skills & Technologies (comma separated)</FormLabel>
                    <FormInput
                      value={Array.isArray(project.skills) ? project.skills.join(', ') : (Array.isArray(project.tags) ? project.tags.join(', ') : '')}
                      onChange={(val) => {
                        const parsed = val.split(',').map((t) => t.trim()).filter(Boolean);
                        handleUpdateProject(project.id, { skills: parsed, tags: parsed });
                      }}
                      placeholder="React, Next.js, TypeScript, MongoDB"
                    />
                  </div>
                </div>
              ) : (
                /* View Project Item */
                <>
                  {(project.image || project.coverImage) && (
                    <div className={`relative h-52 sm:h-60 w-full overflow-hidden ${theme.coverFallback}`}>
                      <img
                        src={project.image || project.coverImage}
                        alt={project.title}
                        className={`w-full h-full object-cover ${project.imagePosition || 'object-center'} group-hover:scale-[1.02] transition-transform duration-300`}
                      />
                      
                      {project.category && (
                        <div className="absolute top-3 left-3">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${theme.btnPrimary} backdrop-blur-md shadow-xs`}>
                            {project.category}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-4 sm:p-5 space-y-2.5">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        {!project.image && !project.coverImage && project.category && (
                          <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold ${theme.badgeBg} ${theme.badgeText} font-mono`}>
                            {project.category}
                          </span>
                        )}
                        {(project.startDate || project.endDate) && (
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${theme.badgeBg} ${theme.badgeText} border ${theme.subCardBorder} shrink-0 font-mono ml-auto`}>
                            {project.startDate} {project.endDate ? `- ${project.endDate}` : ''}
                          </span>
                        )}
                      </div>

                      <h3 className={`text-base font-bold ${theme.textPrimary} group-hover:${theme.accentText} transition-colors`}>
                        {project.title}
                      </h3>
                      {project.description && (
                        <p className={`text-xs ${theme.textSecondary} leading-relaxed mt-1`}>
                          {project.description}
                        </p>
                      )}
                      {project.contributors && (
                        <p className={`text-[11px] ${theme.textMuted} mt-1`}>
                          Contributors: {project.contributors}
                        </p>
                      )}
                    </div>

                    {((Array.isArray(project.skills) && project.skills.length > 0) || (Array.isArray(project.tags) && project.tags.length > 0)) && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {((project.skills && project.skills.length > 0) ? project.skills : (project.tags || [])).map((tag, idx) => (
                          <span
                            key={idx}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${theme.badgeBg} ${theme.badgeText} border ${theme.subCardBorder}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className={`pt-2 border-t ${theme.divider} flex items-center justify-between text-xs font-bold ${theme.textPrimary}`}>
                      <span>View Project</span>
                      <ArrowRight className={`w-3.5 h-3.5 group-hover:translate-x-1 transition-transform ${theme.accentText}`} />
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className={`p-4 rounded-2xl ${theme.cardBg} border ${theme.cardBorder} text-center space-y-2`}>
          <p className={`text-xs ${theme.textMuted}`}>
            No projects added yet.
          </p>
          {isEditing && (
            <button
              type="button"
              onClick={handleAddProject}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed ${theme.cardBorder} text-xs font-bold ${theme.accentText} hover:opacity-80 cursor-pointer`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add your first project</span>
            </button>
          )}
        </div>
      )}

      {isEditing && (
        <SectionSaveBar
          onSave={handleSave}
          onCancel={handleCancel}
          isSaving={saveStatus === 'saving'}
          isSaved={saveStatus === 'saved'}
          isDirty={isDirty}
          errorMessage={errorMessage}
          saveLabel="Save Projects"
          cancelLabel="Cancel"
          className="pt-1"
        />
      )}
    </section>
  );
}
