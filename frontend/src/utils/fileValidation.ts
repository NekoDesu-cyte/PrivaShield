export const validateFile = (file: File) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_SIZE_MB = 15;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, errorType: 'INVALID_TYPE' as const };
  }

  if (file.size > MAX_SIZE_BYTES) {
    return { valid: false, errorType: 'LIMIT_SIZE' as const };
  }

  return { valid: true, errorType: null };
};