/**
 * Format a room code with a dash for better readability
 * ABC123 -> ABC-123
 */
export function formatRoomCode(code: string): string {
  if (code.length !== 6) {
    return code;
  }
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

/**
 * Remove dash from formatted room code
 * ABC-123 -> ABC123
 */
export function unformatRoomCode(code: string): string {
  return code.replace(/-/g, '').toUpperCase();
}

/**
 * Validate room code format
 */
export function isValidRoomCode(code: string): boolean {
  const cleaned = unformatRoomCode(code);
  return /^[A-Z0-9]{6}$/.test(cleaned);
}

/**
 * Generate a random room code (client-side only for display purposes)
 * Note: Real codes are generated server-side
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
