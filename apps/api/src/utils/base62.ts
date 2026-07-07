const BASE62_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Encodes a numeric ID into a Base62 string.
 */
export function encodeBase62(num: number): string {
  if (num < 0 || !Number.isInteger(num)) {
    throw new Error('Input must be a non-negative integer');
  }
  if (num === 0) {
    return BASE62_CHARS[0];
  }
  let result = '';
  let temp = num;
  while (temp > 0) {
    result = BASE62_CHARS[temp % 62] + result;
    temp = Math.floor(temp / 62);
  }
  return result;
}

/**
 * Decodes a Base62 string back into a numeric ID.
 */
export function decodeBase62(str: string): number {
  if (!str) {
    throw new Error('Input string cannot be empty');
  }
  let result = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const index = BASE62_CHARS.indexOf(char);
    if (index === -1) {
      throw new Error(`Invalid Base62 character: ${char}`);
    }
    result = result * 62 + index;
  }
  return result;
}
