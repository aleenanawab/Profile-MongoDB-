export {
  DEFAULT_SHARING_SETTINGS,
  DEFAULT_SECTION_VISIBILITY,
  DEFAULT_SECTION_ORDER
} from '@/types/profile';

export { slugify, isUuidString } from '../validation';

export {
  COLLECTIONS,
  getMongoUri,
  getMongoDbName,
  getMongoClientPromise,
  getMongoClient,
  getMongoDb
} from './client';

export { ensureIndexes, lazyEnsureIndexes } from './indexes';

export {
  getUserByEmail,
  getUserById,
  getUserByEmailOrUsername,
  getUserByGoogleSub,
  linkUserGoogleSub,
  createUser,
  completeUserOnboarding
} from './users';

export {
  createPasswordResetToken,
  verifyPasswordResetToken,
  resetUserPassword,
  verifyRecoveryCode,
  resetPasswordWithRecoveryCode
} from './passwordReset';

export {
  createProfileForUser,
  getProfileByIdOrSlug,
  getProfileByUserId,
  getProfilesByUserId,
  getAllProfiles,
  updateProfile,
  duplicateProfile,
  deleteProfile,
  sanitizeProfileForPublic,
  setProfileResponseCookies,
  mapSupabaseProfileToProfileData
} from './profiles';

export {
  createCompany,
  getCompanyById,
  getCompanyBySlug,
  getCompanyByOwnerUserId,
  getUserCompanyMemberships,
  updateCompany,
  deleteCompany,
  syncCompanyToProfile
} from './companies';

export {
  getCompanyMembers,
  getCompanyMemberById,
  getCompanyMemberByUser,
  addCompanyMember,
  updateCompanyMember,
  removeCompanyMember,
  acceptCompanyInvite,
  hashInviteToken
} from './members';

export {
  createConnection,
  checkIsConnected,
  getUserConnections
} from './connections';
