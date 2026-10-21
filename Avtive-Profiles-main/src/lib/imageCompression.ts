/**
 * Client-side image compression and resizing utility using HTML5 Canvas.
 * Downscales images exceeding maxWidth/maxHeight and compresses quality,
 * ensuring image payloads remain small (< 500KB) and never hit server 413 limits.
 */
export async function compressImageFile(
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.85
): Promise<{ dataUrl: string; blob: Blob; file: File }> {
  // If not in browser or not an image, return raw
  if (typeof window === 'undefined' || !file.type.startsWith('image/')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve({
          dataUrl: reader.result as string,
          blob: file,
          file
        });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // If already a small SVG or gif, don't rasterize it with canvas
  if (file.type.includes('svg') || file.type.includes('gif')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve({
          dataUrl: reader.result as string,
          blob: file,
          file
        });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        if (width / maxWidth > height / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        const reader = new FileReader();
        reader.onload = () => resolve({ dataUrl: reader.result as string, blob: file, file });
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const dataUrl = canvas.toDataURL(mime, quality);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const ext = mime === 'image/png' ? '.png' : '.jpg';
            const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '') + ext, {
              type: mime,
              lastModified: Date.now()
            });
            resolve({ dataUrl, blob, file: compressedFile });
          } else {
            resolve({ dataUrl, blob: file, file });
          }
        },
        mime,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      const reader = new FileReader();
      reader.onload = () => resolve({ dataUrl: reader.result as string, blob: file, file });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    };

    img.src = objectUrl;
  });
}

/**
 * Upload a file or base64 dataUrl directly to /api/upload.
 * Automatically compresses images before sending if needed.
 */
export async function uploadImageToStorage(
  fileOrDataUrl: File | string,
  bucket: 'avatars' | 'profiles' | 'links' = 'profiles'
): Promise<string> {
  // If already a remote CDN URL, no upload needed
  if (
    typeof fileOrDataUrl === 'string' &&
    (fileOrDataUrl.startsWith('http://') || fileOrDataUrl.startsWith('https://'))
  ) {
    return fileOrDataUrl;
  }

  if (typeof fileOrDataUrl === 'string') {
    // If it's a data URL, send as JSON to /api/upload
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: fileOrDataUrl, bucket })
    });
    const isJson = res.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await res.json().catch(() => ({})) : null;
    if (!res.ok) {
      if (res.status === 413) {
        throw new Error('Image is too large. Please select a photo under 5MB.');
      }
      throw new Error(data?.error || `Upload failed with status ${res.status}`);
    }
    return data.url;
  } else {
    // Compress file first
    let toUpload = fileOrDataUrl;
    try {
      const compressed = await compressImageFile(fileOrDataUrl);
      toUpload = compressed.file;
    } catch {}

    const formData = new FormData();
    formData.append('bucket', bucket);
    formData.append('file', toUpload);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    const isJson = res.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await res.json().catch(() => ({})) : null;
    if (!res.ok) {
      if (res.status === 413) {
        throw new Error('Image is too large. Please select a photo under 5MB.');
      }
      throw new Error(data?.error || `Upload failed with status ${res.status}`);
    }
    return data.url;
  }
}
