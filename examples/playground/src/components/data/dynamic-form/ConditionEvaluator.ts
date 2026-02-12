export function evaluateCondition(
  condition: string | undefined,
  values: Record<string, unknown>,
): boolean {
  if (!condition) {
    return true;
  }
  const match = /(\w+)\s*===\s*['"](.+)['"]/.exec(condition);
  if (!match) {
    return true;
  }
  const key = match[1];
  const expected = match[2];
  return String(values[key] ?? '') === expected;
}
