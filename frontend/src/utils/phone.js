export const digitsOnly = (value) => String(value || '').replace(/\D/g, '');

export const toE164 = (rawPhone) => {
  const input = String(rawPhone || '').trim();
  if (!input) return '';

  if (input.startsWith('+')) {
    const digits = digitsOnly(input);
    return digits ? `+${digits}` : '';
  }

  const digits = digitsOnly(input);
  if (!digits) return '';

  // Default to US if user enters 10 digits
  if (digits.length === 10) return `+1${digits}`;

  // If user entered 11 digits starting with 1, treat as US
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;

  // Best-effort fallback
  return `+${digits}`;
};

