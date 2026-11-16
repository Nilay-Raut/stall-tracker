export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

/**
 * A recovery PIN is only 6 digits, so refuse the ones people guess first:
 * all the same digit, straight runs, and a few well-known patterns.
 */
export function isWeakPin(pin: string): boolean {
  if (/^(\d)\1{5}$/.test(pin)) return true; // 000000, 111111 ...

  const digits = [...pin].map(Number);
  const steps = digits.slice(1).map((d, i) => (d - digits[i] + 10) % 10);
  if (steps.every((s) => s === 1) || steps.every((s) => s === 9)) return true; // 123456, 654321, 890123

  return ["121212", "112233", "123123", "147258", "159753", "696969", "007007"].includes(pin);
}
