export const AUTH_SESSION_DURATION_MS =60 * 60* 1000;
const SESSION_EXPIRES_AT_KEY = 'authSessionExpiresAt';

export const startAuthSession = () => {
  const expiresAt = Date.now() + AUTH_SESSION_DURATION_MS;
  localStorage.setItem(SESSION_EXPIRES_AT_KEY, String(expiresAt));
  return expiresAt;
};

export const getAuthSessionTimeRemaining = () => {
  const expiresAt = Number(localStorage.getItem(SESSION_EXPIRES_AT_KEY));
 
  if (!expiresAt) {
    return null;
  }

  return expiresAt - Date.now();
};

export const hasActiveLogin = () =>
  Boolean(localStorage.getItem('user') || localStorage.getItem('host') || localStorage.getItem('admin'));

export const clearAuthSession = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('host');
  localStorage.removeItem('admin');
  localStorage.removeItem('loggedIn');
  localStorage.removeItem('redirectAfterLogin');
  localStorage.removeItem(SESSION_EXPIRES_AT_KEY);
};
