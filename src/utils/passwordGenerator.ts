// Strong cryptographic password generator and strength evaluator for subscription credentials

export interface PasswordGeneratorOptions {
  length?: number;
  includeUppercase?: boolean;
  includeLowercase?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
  avoidAmbiguous?: boolean; // Avoid 0, O, l, 1, I
}

const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz';
const NUMBER_CHARS = '0123456789';
const SYMBOL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const AMBIGUOUS_CHARS = /[0O1lI]/g;

export function generateStrongPassword(options: PasswordGeneratorOptions = {}): string {
  const {
    length = 16,
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
    avoidAmbiguous = false
  } = options;

  let pool = '';
  const requiredChars: string[] = [];

  const getFiltered = (chars: string) =>
    avoidAmbiguous ? chars.replace(AMBIGUOUS_CHARS, '') : chars;

  if (includeUppercase) {
    const chars = getFiltered(UPPERCASE_CHARS);
    pool += chars;
    if (chars.length > 0) requiredChars.push(getRandomChar(chars));
  }
  if (includeLowercase) {
    const chars = getFiltered(LOWERCASE_CHARS);
    pool += chars;
    if (chars.length > 0) requiredChars.push(getRandomChar(chars));
  }
  if (includeNumbers) {
    const chars = getFiltered(NUMBER_CHARS);
    pool += chars;
    if (chars.length > 0) requiredChars.push(getRandomChar(chars));
  }
  if (includeSymbols) {
    const chars = getFiltered(SYMBOL_CHARS);
    pool += chars;
    if (chars.length > 0) requiredChars.push(getRandomChar(chars));
  }

  if (pool.length === 0) {
    pool = LOWERCASE_CHARS + NUMBER_CHARS;
  }

  const result: string[] = [...requiredChars];
  const targetLength = Math.max(8, Math.min(64, length));

  while (result.length < targetLength) {
    result.push(getRandomChar(pool));
  }

  // Shuffle using Fisher-Yates with crypto random values
  for (let i = result.length - 1; i > 0; i--) {
    const j = getRandomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result.join('');
}

function getRandomChar(str: string): string {
  return str.charAt(getRandomInt(str.length));
}

function getRandomInt(max: number): number {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] % max;
  }
  return Math.floor(Math.random() * max);
}

export interface PasswordStrength {
  score: number; // 0 to 100
  label: 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Very Strong';
  color: string;
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, label: 'Weak', color: '#ef4444' };
  }

  let score = 0;

  // Length points
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 20;
  if (password.length >= 16) score += 15;

  // Variety points
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 10;
  if (/[^a-zA-Z0-9]/.test(password)) score += 15;

  score = Math.min(100, Math.max(0, score));

  if (score < 40) {
    return { score, label: 'Weak', color: '#ef4444' };
  } else if (score < 60) {
    return { score, label: 'Fair', color: '#f59e0b' };
  } else if (score < 80) {
    return { score, label: 'Good', color: '#3b82f6' };
  } else if (score < 95) {
    return { score, label: 'Strong', color: '#10b981' };
  } else {
    return { score, label: 'Very Strong', color: '#059669' };
  }
}
