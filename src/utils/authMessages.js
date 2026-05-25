const roleLabels = {
  client: 'client',
  host: 'host',
  admin: 'admin',
};

export const getAuthErrorMessage = (error, role = 'client') => {
  const rawMessage = typeof error === 'string' ? error : error?.message;
  const message = rawMessage?.trim();
  const lowerMessage = (message || '').toLowerCase();
  const roleLabel = roleLabels[role] || 'account';

  if (!message) {
    return `We could not sign in to this ${roleLabel} account. Please try again.`;
  }

  if (lowerMessage.includes('failed to fetch') || lowerMessage.includes('network')) {
    return 'The server could not be reached. Please check that the backend is running and try again.';
  }

  if (lowerMessage.includes('pending')) {
    return role === 'host'
      ? 'Your host account is still waiting for admin approval.'
      : 'This account is still waiting for approval.';
  }

  if (lowerMessage.includes('rejected')) {
    return role === 'host'
      ? 'This host account was rejected by the admin.'
      : 'This account was rejected by the admin.';
  }

  if (lowerMessage.includes('blocked')) {
    return 'This account has been blocked by the admin.';
  }

  if (lowerMessage.includes('verification') || lowerMessage.includes('code') || lowerMessage.includes('challenge')) {
    return 'The verification code is incorrect or expired. Please check the code and try again.';
  }

  if (
    lowerMessage.includes('not found') ||
    lowerMessage.includes('invalid') ||
    lowerMessage.includes('credential') ||
    lowerMessage.includes('password')
  ) {
    return `The ${roleLabel} email or password is incorrect. Please check your details and try again.`;
  }

  return message;
};
