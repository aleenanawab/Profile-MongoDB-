import crypto from 'crypto';
import { ShareTemplateRecord } from '@/types/sharing';
import { getMongoDb, COLLECTIONS } from './client';
import { lazyEnsureIndexes } from './indexes';
import { BUILT_IN_TEMPLATES, SHAREABLE_FIELD_MAP } from '@/lib/sharing/presets';
import { normalizeSectionKey } from '@/lib/sections';

function mapDocToTemplate(doc: any): ShareTemplateRecord {
  return {
    id: String(doc.id || doc._id),
    ownerUserId: String(doc.ownerUserId),
    name: String(doc.name || 'Custom Template'),
    description: String(doc.description || ''),
    isBuiltIn: false,
    presetKey: doc.presetKey || undefined,
    selectedFields: Array.isArray(doc.selectedFields) ? doc.selectedFields : [],
    selectedSections: Array.isArray(doc.selectedSections) ? doc.selectedSections : [],
    lostAndFoundMode: Boolean(doc.lostAndFoundMode),
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt || new Date().toISOString()),
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : String(doc.updatedAt || new Date().toISOString())
  };
}

function deriveSectionsFromFields(fields: string[]): string[] {
  const sections = new Set<string>();
  for (const field of fields) {
    if (field.startsWith('custom-field-') || field === 'customFields') {
      sections.add('customFields');
    } else {
      const def = SHAREABLE_FIELD_MAP[field];
      if (def?.canonicalSection) {
        sections.add(normalizeSectionKey(def.canonicalSection));
      }
    }
  }
  return Array.from(sections);
}

export async function listShareTemplatesForOwner(
  ownerUserId: string
): Promise<ShareTemplateRecord[]> {
  if (!ownerUserId) return [...BUILT_IN_TEMPLATES];
  await lazyEnsureIndexes();
  const db = await getMongoDb();

  const docs = await db
    .collection(COLLECTIONS.SHARE_TEMPLATES)
    .find({ ownerUserId })
    .sort({ updatedAt: -1 })
    .limit(50)
    .toArray();

  const customTemplates = docs.map(mapDocToTemplate);
  return [...BUILT_IN_TEMPLATES, ...customTemplates];
}

export async function createShareTemplateForOwner(
  ownerUserId: string,
  data: {
    name: string;
    description?: string;
    selectedFields: string[];
    lostAndFoundMode?: boolean;
  }
): Promise<{ success: boolean; template?: ShareTemplateRecord; error?: string; status: number }> {
  if (!ownerUserId) {
    return { success: false, error: 'Unauthorized', status: 401 };
  }

  const name = data.name?.trim();
  if (!name) {
    return { success: false, error: 'Template name is required.', status: 400 };
  }

  const cleanFields = Array.isArray(data.selectedFields)
    ? Array.from(new Set(data.selectedFields.filter((f) => typeof f === 'string' && f.trim())))
    : [];

  if (cleanFields.length === 0) {
    return { success: false, error: 'Select at least one field for this template.', status: 400 };
  }

  await lazyEnsureIndexes();
  const db = await getMongoDb();
  const col = db.collection(COLLECTIONS.SHARE_TEMPLATES);

  const id = `tpl-${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  const doc: ShareTemplateRecord & { _id: string } = {
    _id: id,
    id,
    ownerUserId,
    name: name.slice(0, 80),
    description: (data.description || '').trim().slice(0, 240) || `Custom sharing preset (${cleanFields.length} items)`,
    isBuiltIn: false,
    selectedFields: cleanFields,
    selectedSections: deriveSectionsFromFields(cleanFields),
    lostAndFoundMode: Boolean(data.lostAndFoundMode),
    createdAt: now,
    updatedAt: now
  };

  await col.insertOne(doc as any);
  return { success: true, template: mapDocToTemplate(doc), status: 201 };
}

export async function updateShareTemplateForOwner(
  templateId: string,
  ownerUserId: string,
  patch: {
    name?: string;
    description?: string;
    selectedFields?: string[];
    lostAndFoundMode?: boolean;
  }
): Promise<{ success: boolean; template?: ShareTemplateRecord; error?: string; status: number }> {
  if (!ownerUserId) {
    return { success: false, error: 'Unauthorized', status: 401 };
  }
  if (BUILT_IN_TEMPLATES.some((b) => b.id === templateId)) {
    return { success: false, error: 'Built-in templates cannot be edited directly. Duplicate to customize.', status: 400 };
  }

  await lazyEnsureIndexes();
  const db = await getMongoDb();
  const col = db.collection(COLLECTIONS.SHARE_TEMPLATES);

  const existing = await col.findOne({ id: templateId });
  if (!existing) {
    return { success: false, error: 'Template not found.', status: 404 };
  }
  if (String(existing.ownerUserId) !== ownerUserId) {
    return { success: false, error: 'Forbidden: You do not own this template.', status: 403 };
  }

  const $set: Record<string, any> = { updatedAt: new Date().toISOString() };
  if (typeof patch.name === 'string' && patch.name.trim()) {
    $set.name = patch.name.trim().slice(0, 80);
  }
  if (typeof patch.description === 'string') {
    $set.description = patch.description.trim().slice(0, 240);
  }
  if (Array.isArray(patch.selectedFields)) {
    const cleanFields = Array.from(new Set(patch.selectedFields.filter((f) => typeof f === 'string' && f.trim())));
    $set.selectedFields = cleanFields;
    $set.selectedSections = deriveSectionsFromFields(cleanFields);
  }
  if (typeof patch.lostAndFoundMode === 'boolean') {
    $set.lostAndFoundMode = patch.lostAndFoundMode;
  }

  const updated = await col.findOneAndUpdate(
    { id: templateId, ownerUserId },
    { $set },
    { returnDocument: 'after' }
  );

  if (!updated) {
    return { success: false, error: 'Failed to update template.', status: 500 };
  }

  return { success: true, template: mapDocToTemplate(updated), status: 200 };
}

export async function duplicateShareTemplateForOwner(
  templateId: string,
  ownerUserId: string
): Promise<{ success: boolean; template?: ShareTemplateRecord; error?: string; status: number }> {
  if (!ownerUserId) {
    return { success: false, error: 'Unauthorized', status: 401 };
  }

  const builtIn = BUILT_IN_TEMPLATES.find((b) => b.id === templateId);
  if (builtIn) {
    return createShareTemplateForOwner(ownerUserId, {
      name: `${builtIn.name} Copy`,
      description: builtIn.description,
      selectedFields: builtIn.selectedFields,
      lostAndFoundMode: builtIn.lostAndFoundMode
    });
  }

  await lazyEnsureIndexes();
  const db = await getMongoDb();
  const existing = await db.collection(COLLECTIONS.SHARE_TEMPLATES).findOne({ id: templateId });
  if (!existing) {
    return { success: false, error: 'Template not found.', status: 404 };
  }
  if (String(existing.ownerUserId) !== ownerUserId) {
    return { success: false, error: 'Forbidden: You do not own this template.', status: 403 };
  }

  return createShareTemplateForOwner(ownerUserId, {
    name: `${existing.name} Copy`,
    description: existing.description,
    selectedFields: Array.isArray(existing.selectedFields) ? existing.selectedFields : [],
    lostAndFoundMode: Boolean(existing.lostAndFoundMode)
  });
}

export async function deleteShareTemplateForOwner(
  templateId: string,
  ownerUserId: string
): Promise<{ success: boolean; error?: string; status: number }> {
  if (!ownerUserId) {
    return { success: false, error: 'Unauthorized', status: 401 };
  }
  if (BUILT_IN_TEMPLATES.some((b) => b.id === templateId)) {
    return { success: false, error: 'Built-in templates cannot be deleted.', status: 400 };
  }

  await lazyEnsureIndexes();
  const db = await getMongoDb();
  const col = db.collection(COLLECTIONS.SHARE_TEMPLATES);

  const existing = await col.findOne({ id: templateId });
  if (!existing) {
    return { success: false, error: 'Template not found.', status: 404 };
  }
  if (String(existing.ownerUserId) !== ownerUserId) {
    return { success: false, error: 'Forbidden: You do not own this template.', status: 403 };
  }

  await col.deleteOne({ id: templateId, ownerUserId });
  return { success: true, status: 200 };
}
