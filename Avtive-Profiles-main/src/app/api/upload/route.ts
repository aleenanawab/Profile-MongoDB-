import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { uploadToCloudinary } from '@/lib/storage';
import { 
  getProfileByIdOrSlug, 
  updateProfile, 
  getCompanyById, 
  getCompanyMemberByUser, 
  updateCompany 
} from '@/lib/db';

const ALLOWED_MIME_PREFIXES = ['image/jpeg', 'image/png', 'image/webp'];
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
    // 1. Authentication check - strictly server-enforced
    const session = await getSession();
    const userId = session?.id || session?.userId;
    if (!session || !userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication is required to upload assets.' },
        { status: 401 }
      );
    }

    let buffer: Buffer | null = null;
    let mimeType = 'image/jpeg';
    let originalName: string | undefined;
    let requestedBucket = 'profiles';
    let profileId: string | undefined;
    let companyId: string | undefined;
    let field: string | undefined;

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const jsonBody = await request.json().catch(() => ({}));
      const rawData = jsonBody.file || jsonBody.image || jsonBody.dataUrl || jsonBody.avatar || jsonBody.cover;
      const jBucket = jsonBody.bucket || jsonBody.category || jsonBody.type;
      if (jBucket === 'links' || jBucket === 'link' || jBucket === 'social') {
        requestedBucket = 'links';
      } else if (jBucket === 'avatars' || jBucket === 'avatar') {
        requestedBucket = 'avatars';
      }

      profileId = jsonBody.profileId;
      companyId = jsonBody.companyId;
      field = jsonBody.field;

      if (!rawData || typeof rawData !== 'string') {
        return NextResponse.json(
          { error: 'No image data provided.' },
          { status: 400 }
        );
      }

      // If already a remote CDN URL, do not re-upload unless requested
      if (rawData.startsWith('http://') || rawData.startsWith('https://')) {
        return NextResponse.json({ success: true, url: rawData, storage: 'remote' });
      }

      if (rawData.startsWith('data:')) {
        const matches = rawData.match(/^data:([a-zA-Z0-9/+.-]+);base64,(.+)$/);
        if (matches && matches[2]) {
          mimeType = matches[1] || 'image/jpeg';
          buffer = Buffer.from(matches[2], 'base64');
        } else {
          return NextResponse.json(
            { error: 'Invalid data URI image payload.' },
            { status: 400 }
          );
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
        return NextResponse.json(
          { error: 'Invalid form data. Please upload a valid image file.' },
          { status: 400 }
        );
      }

      const formBucket = (formData.get('bucket') || formData.get('category') || formData.get('type')) as string | null;
      if (formBucket === 'links' || formBucket === 'link' || formBucket === 'social') {
        requestedBucket = 'links';
      } else if (formBucket === 'avatars' || formBucket === 'avatar') {
        requestedBucket = 'avatars';
      }

      profileId = (formData.get('profileId') as string) || undefined;
      companyId = (formData.get('companyId') as string) || undefined;
      field = (formData.get('field') as string) || undefined;

      const file = (formData.get('file') || formData.get('image') || formData.get('avatar')) as File | string | null;

      if (!file) {
        return NextResponse.json(
          { error: 'No file provided.' },
          { status: 400 }
        );
      }

      if (typeof file === 'string') {
        if (file.startsWith('http://') || file.startsWith('https://')) {
          return NextResponse.json({ success: true, url: file, storage: 'remote' });
        }
        return NextResponse.json(
          { error: 'Invalid image format.' },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'File size exceeds the 5MB limit. Please select a smaller photo.' },
          { status: 400 }
        );
      }

      mimeType = file.type || 'image/jpeg';
      originalName = file.name;

      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
    }

    if (!buffer || buffer.length === 0) {
      return NextResponse.json(
        { error: 'Empty file received.' },
        { status: 400 }
      );
    }

    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit.' },
        { status: 400 }
      );
    }

    // Validate MIME type
    const isAllowedType = ALLOWED_MIME_PREFIXES.some(prefix => mimeType.toLowerCase().startsWith(prefix));
    const isAllowedExt = originalName ? ALLOWED_EXTENSIONS.some(ext => originalName!.toLowerCase().endsWith(ext)) : true;
    if (!isAllowedType && !isAllowedExt) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG, and WebP images are permitted.' },
        { status: 400 }
      );
    }

    // 2. Ownership & Authorization checks
    if (profileId) {
      const existingProfile = await getProfileByIdOrSlug(profileId);
      if (existingProfile && existingProfile.userId && existingProfile.userId !== userId) {
        // If not the owner, check if caller is an admin/owner of the profile's company
        let hasAccess = false;
        if (existingProfile.companyId) {
          const compMember = await getCompanyMemberByUser(existingProfile.companyId, userId);
          if (compMember && (compMember.role === 'OWNER' || compMember.role === 'ADMIN')) {
            hasAccess = true;
          }
        }
        if (!hasAccess) {
          return NextResponse.json(
            { error: 'Forbidden: You do not have permission to modify this profile.' },
            { status: 403 }
          );
        }
      }
    }

    if (companyId) {
      const company = await getCompanyById(companyId);
      if (company && company.ownerUserId !== userId) {
        const compMember = await getCompanyMemberByUser(companyId, userId);
        if (!compMember || (compMember.role !== 'OWNER' && compMember.role !== 'ADMIN')) {
          return NextResponse.json(
            { error: 'Forbidden: You do not have admin permissions for this company.' },
            { status: 403 }
          );
        }
      }
    }

    // 3. Upload strictly to Cloudinary (No fallback to local disk or data URLs)
    const ext = getExtension(mimeType, originalName);
    const filename = `${requestedBucket}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;

    const uploadResult = await uploadToCloudinary(buffer, filename, mimeType, requestedBucket);

    if (!uploadResult.success || !uploadResult.url) {
      return NextResponse.json(
        { error: uploadResult.error || 'Failed to upload image to Cloudinary storage.' },
        { status: 400 }
      );
    }

    // 4. If target field was supplied with profileId or companyId, persist to MongoDB immediately
    if (profileId && field && (field === 'avatar' || field === 'coverImage')) {
      await updateProfile(
        profileId,
        {
          [field]: uploadResult.url,
          [`${field}PublicId`]: uploadResult.publicId
        },
        userId,
        session.email
      ).catch(err => {
        console.error('Failed to update profile image in MongoDB:', err);
      });
    }

    if (companyId && field && (field === 'logo' || field === 'cover')) {
      const compUpdate: Record<string, string | undefined> = {};
      if (field === 'logo') {
        compUpdate.logoUrl = uploadResult.url;
        compUpdate.logoPublicId = uploadResult.publicId;
      } else {
        compUpdate.coverUrl = uploadResult.url;
        compUpdate.coverPublicId = uploadResult.publicId;
      }
      await updateCompany(companyId, compUpdate, userId).catch(err => {
        console.error('Failed to update company image in MongoDB:', err);
      });
    }

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      filename: uploadResult.filename || filename,
      bucket: uploadResult.bucket || requestedBucket,
      storage: 'cloudinary',
      size: uploadResult.size || buffer.length,
      mimeType: uploadResult.mimeType || mimeType
    });

  } catch (error: any) {
    console.error('Upload Route Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Server error during upload.' },
      { status: 500 }
    );
  }
}
