export const COOKIE_NAME = "careos_session";

export const SHIFT_HOURS = {
  DAY: { start: 7, end: 15 },      // 07:00 - 15:00
  EVENING: { start: 15, end: 23 },  // 15:00 - 23:00
  NIGHT: { start: 23, end: 7 },     // 23:00 - 07:00
};

export const SECURITY = {
  MAX_PASSWORD_AGE_DAYS: 90,
  PASSWORD_HISTORY_LIMIT: 5,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 15,
  SESSION_IDLE_TIMEOUT_MINUTES: 15,
  MFA_SETUP_GRACE_PERIOD_DAYS: 3,
};
