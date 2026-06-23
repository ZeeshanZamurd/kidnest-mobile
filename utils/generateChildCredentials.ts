/** Auto-generated credentials — children use profile selection, not separate login. */
export function generateChildCredentials(displayName: string): { email: string; password: string } {
  const slug =
    displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 16) || 'child';
  const unique = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const email = `${slug}.${unique}@kidnest.child`;

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return { email, password };
}
