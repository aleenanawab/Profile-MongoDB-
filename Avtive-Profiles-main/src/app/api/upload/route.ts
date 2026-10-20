import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { uploadToSupabaseStorage, DEFAULT_STORAGE_BUCKET } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

const ALLOWED_MIME_PREFIXES = ['image/'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function getExtension(mimeType: string, originalName?: string): string {
  if (originalName) {
    const extMatch = originalName.match(/\.([a-zA-Z0-9]+)$/);
    if (extMatch && extMatch[1]) {
      const ext = `.${extMatch[1].toLowerCase()}`;
      if (ALLOWED_EXTENSIONS.includes(ext)) return ext;
    }
  }
  if (mimeType.includes('png')) return '.png';
  if (mimeType.includes('webp')) return '.webp';

  return '.jpg';
}

export async function POST(request: NextRequest) {
  try {
    // Session is read if present, but not mandatory to avoid blocking onboarding or profile editing
    const session = await getSession().catch(() => null);

    let buffer: Buffer | null = null;
    let mimeType = 'image/jpeg';
    let originalName: string | undefined;

    const contentType = request.headers.get('content-type') || '';

    let requestedBucket = 'profiles';

    if (contentType.includes('application/json')) {
      const jsonBody = await request.json().catch(() => ({}));
      const rawData = jsonBody.file || jsonBody.image || jsonBody.dataUrl || jsonBody.avatar || jsonBody.cover;
      const jBucket = jsonBody.bucket || jsonBody.category || jsonBody.type;
      if (jBucket === 'links' || jBucket === 'link' || jBucket === 'social') {
        requestedBucket = 'links';
      }

      if (!rawData || typeof rawData !== 'string') {
        return NextResponse.json(
          { error: 'No image data provided.' },
          { status: 400 }
        );
      }

      // If already a remote URL (http/https), return it directly
      if (rawData.startsWith('http://') || rawData.startsWith('https://')) {
        return NextResponse.json({ success: true, url: rawData, storage: 'remote' });
      }

      // If base64 data URI
      if (rawData.startsWith('data:')) {
        const matches = rawData.match(/^data:([a-zA-Z0-9/+.-]+);base64,(.+)$/);
        if (matches && matches[2]) {
          mimeType = matches[1] || 'image/jpeg';
          buffer = Buffer.from(matches[2], 'base64');
        } else {
          return NextResponse.json({ success: true, url: rawData, storage: 'data-url' });
        }
      } else {
        buffer = Buffer.from(rawData, 'base64');
      }
    } else {
      // Parse multipart form data
      let formData: FormData;
      try {
        formData = await request.formData();
      } catch (formErr) {
        console.warn('FormData parse fallback:', formErr);
        return NextResponse.json(
          { error: 'Invalid form data. Please upload a valid image file.' },
          { status: 400 }
        );
      }

      const formBucket = (formData.get('bucket') || formData.get('category') || formData.get('type')) as string | null;
      if (formBucket === 'links' || formBucket === 'link' || formBucket === 'social') {
        requestedBucket = 'links';
      }

      const file = (formData.get('file') || formData.get('image') || formData.get('avatar')) as File | string | null;

      if (!file) {
        return NextResponse.json(
          { error: 'No file provided.' },
          { status: 400 }
        );
      }

      if (typeof file === 'string') {
        if (file.startsWith('data:image/') || file.startsWith('http://') || file.startsWith('https://')) {
          return NextResponse.json({ success: true, url: file, storage: 'direct' });
        }
        return NextResponse.json(
          { error: 'Invalid image format.' },
          { status: 400 }
        );
      }

      // Validate File object
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'File size exceeds the 5MB limit. Please select a smaller photo.' },
          { status: 400 }
        );
      }

      mimeType = file.type || 'image/jpeg';
      originalName = file.name;

      // Ensure it is an image type
      const isImage = ALLOWED_MIME_PREFIXES.some(prefix => mimeType.startsWith(prefix)) ||
        (originalName && ALLOWED_EXTENSIONS.some(ext => originalName!.toLowerCase().endsWith(ext)));

      if (!isImage && mimeType !== 'application/octet-stream') {
        return NextResponse.json(
          { error: 'Invalid file type. Please upload an image (JPG, PNG, WebP).' },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
    }

    if (!buffer || buffer.length === 0) {
      return NextResponse.json(
        { error: 'Empty file received.' },
        { status: 400 }
      );
    }

    // Determine safe file extension and unique filename
    const ext = getExtension(mimeType, originalName);
    const filename = `${requestedBucket}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;

    // ──────────────────────────────────────────────────────────────────────────
    // 1. PRIMARY STORAGE: Upload directly to Supabase Storage Bucket (profiles / links)
    // ──────────────────────────────────────────────────────────────────────────
    const supabaseResult = await uploadToSupabaseStorage(buffer, filename, mimeType, requestedBucket);

    if (supabaseResult.success && supabaseResult.url) {
      return NextResponse.json({
        success: true,
        url: supabaseResult.url,
        filename,
        bucket: supabaseResult.bucket || requestedBucket,
        storage: 'supabase',
        size: buffer.length,
        mimeType
      });
    }

    console.warn('Supabase storage upload fallback:', supabaseResult.error);

    // ──────────────────────────────────────────────────────────────────────────
    // 2. SECONDARY FALLBACK: Local disk storage (if Supabase key is missing / dev)
    // ──────────────────────────────────────────────────────────────────────────
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, filename);
      await fs.promises.writeFile(filePath, buffer);

      const publicUrl = `/uploads/${filename}`;
      return NextResponse.json({
        success: true,
        url: publicUrl,
        filename,
        storage: 'local',
        size: buffer.length,
        mimeType
      });
    } catch (fsError) {
      // ──────────────────────────────────────────────────────────────────────────
      // 3. TERTIARY FALLBACK: Base64 Data URL so the user is never stuck
      // ──────────────────────────────────────────────────────────────────────────
      const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
      return NextResponse.json({
        success: true,
        url: dataUrl,
        filename,
        storage: 'data-url',
        size: buffer.length,
        mimeType
      });
    }
  } catch (error: any) {
    console.error('File Upload API Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upload image. Please try again.' },
      { status: 400 }
    );
  }
}


