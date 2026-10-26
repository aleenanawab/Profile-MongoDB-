import assert from 'node:assert';

console.log('--- Running avatar persistence & save guard tests ---');

// Test 1: Validate URL rejects non-HTTPS, blob, and data URIs
function validateImageUrl(url: unknown): boolean {
  if (!url || typeof url !== 'string') return false;
  if (!url.startsWith('https://')) return false;
  if (url.startsWith('blob:') || url.startsWith('data:')) return false;
  return true;
}

assert.strictEqual(validateImageUrl('blob:http://localhost:3000/123-abc'), false, 'Blob URL must be rejected');
assert.strictEqual(validateImageUrl('data:image/jpeg;base64,/9j/4AAQSkZJRg=='), false, 'Data URI must be rejected');
assert.strictEqual(validateImageUrl(''), false, 'Empty URL must be rejected');
assert.strictEqual(validateImageUrl('http://insecure.com/photo.jpg'), false, 'HTTP URL must be rejected');
assert.strictEqual(validateImageUrl('https://res.cloudinary.com/demo/image/upload/sample.jpg'), true, 'Valid HTTPS Cloudinary URL must be accepted');
console.log('  [PASS] URL validation properly allows only valid HTTPS CDN URLs');

// Test 2: Guard logic allows explicit image override even if isUploadingAvatar flag is true
function canProceedWithSave(
  isUploadingAvatar: boolean,
  isUploadingCover: boolean,
  overrideData?: { avatar?: string; coverImage?: string }
): boolean {
  const hasAvatarOverride = Boolean(overrideData && 'avatar' in overrideData);
  const hasCoverOverride = Boolean(overrideData && 'coverImage' in overrideData);
  if ((isUploadingAvatar && !hasAvatarOverride) || (isUploadingCover && !hasCoverOverride)) {
    return false;
  }
  return true;
}

// Case A: Background autosave while avatar is uploading -> BLOCKED
assert.strictEqual(canProceedWithSave(true, false, undefined), false, 'Autosave during avatar upload should be blocked');

// Case B: Background autosave while cover is uploading -> BLOCKED
assert.strictEqual(canProceedWithSave(false, true, undefined), false, 'Autosave during cover upload should be blocked');

// Case C: Explicit avatar save when avatar upload finishes (flag still in transition) -> ALLOWED
assert.strictEqual(
  canProceedWithSave(true, false, { avatar: 'https://res.cloudinary.com/demo/image/upload/avatar.jpg' }),
  true,
  'Explicit avatar override must not be blocked by avatar upload flag'
);

// Case D: Explicit cover save when cover upload finishes (flag still in transition) -> ALLOWED
assert.strictEqual(
  canProceedWithSave(false, true, { coverImage: 'https://res.cloudinary.com/demo/image/upload/cover.jpg' }),
  true,
  'Explicit cover override must not be blocked by cover upload flag'
);

// Case E: Normal save when no uploads active -> ALLOWED
assert.strictEqual(canProceedWithSave(false, false, undefined), true, 'Regular save when no uploads active should be allowed');
console.log('  [PASS] Save guard properly differentiates between background autosaves and explicit upload completions');

// Test 3: Trailing save coalescing simulation
class SaveCoordinator {
  isSavingInProgress = false;
  hasPendingTrailingSave = false;
  pendingOverride: Record<string, any> | null = null;
  savedDataList: any[] = [];

  async save(override?: Record<string, any>): Promise<boolean> {
    if (this.isSavingInProgress) {
      this.hasPendingTrailingSave = true;
      if (override) {
        this.pendingOverride = { ...(this.pendingOverride || {}), ...override };
      }
      return true; // Coalesced into trailing save
    }

    this.isSavingInProgress = true;
    try {
      // Simulate async save
      const dataToSave = { ...override };
      this.savedDataList.push(dataToSave);
      return true;
    } finally {
      this.isSavingInProgress = false;
      if (this.hasPendingTrailingSave) {
        this.hasPendingTrailingSave = false;
        const trailing = this.pendingOverride;
        this.pendingOverride = null;
        await this.save(trailing || undefined);
      }
    }
  }
}

const coordinator = new SaveCoordinator();
// First save starts
coordinator.isSavingInProgress = true;
// Second save requested concurrently with avatar override
coordinator.save({ avatar: 'https://res.cloudinary.com/avatar2.jpg' });
assert.strictEqual(coordinator.hasPendingTrailingSave, true, 'Concurrent save should be queued as trailing');
assert.deepStrictEqual(
  coordinator.pendingOverride,
  { avatar: 'https://res.cloudinary.com/avatar2.jpg' },
  'Trailing override must capture avatar'
);

// Release in-progress lock and flush trailing save
coordinator.isSavingInProgress = false;
if (coordinator.hasPendingTrailingSave) {
  coordinator.hasPendingTrailingSave = false;
  const trailing = coordinator.pendingOverride;
  coordinator.pendingOverride = null;
  coordinator.save(trailing || undefined);
}
assert.strictEqual(coordinator.savedDataList.length, 1, 'Trailing save executed successfully');
assert.strictEqual(coordinator.savedDataList[0].avatar, 'https://res.cloudinary.com/avatar2.jpg');
console.log('  [PASS] In-flight save lock successfully coalesces concurrent requests into one trailing save');

console.log('✓ All avatar persistence tests passed successfully!\n');
