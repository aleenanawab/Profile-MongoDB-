export {
  DUMMY_BCRYPT_HASH,
  hashPassword,
  verifyPassword
} from './passwords';

export {
  SESSION_COOKIE_NAME,
  RETURNING_USER_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
  setReturningUserCookie,
  createSessionToken,
  verifySessionToken,
  getSession,
  setSessionCookie,
  clearSessionCookie
} from './session';

export { sanitizeReturnUrl, resolveReturnUrlForExistingUser } from '../utils';

export {
  isUserOnboarded,
  hasRealSavedProfileData,
  getProfileLandingDestination
} from './userStatus';
