/** Username shown across the app instead of the email address (user_metadata.display_name). */
export const DISPLAY_NAME_MIN = 2;
export const DISPLAY_NAME_MAX = 30;

export function normalizeDisplayName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function isValidDisplayName(value: string): boolean {
  const name = normalizeDisplayName(value);
  return name.length >= DISPLAY_NAME_MIN && name.length <= DISPLAY_NAME_MAX;
}

/**
 * The name to show for a user: their chosen username, else the name a Google/Apple sign-in
 * provided, else null (callers fall back to the email address).
 */
export function displayNameFrom(metadata: Record<string, unknown> | null | undefined): string | null {
  for (const key of ["display_name", "full_name", "name"]) {
    const value = metadata?.[key];
    if (typeof value === "string" && value.trim()) return normalizeDisplayName(value);
  }
  return null;
}
