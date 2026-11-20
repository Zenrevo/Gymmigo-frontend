/** Mirrors the server's admin password rules (app/services/admin_security.py password_problems). */
export function passwordChecks(password: string, username?: string) {
  return [
    { label: '12+ characters', ok: password.length >= 12 },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', ok: /[a-z]/.test(password) },
    { label: 'Number', ok: /\d/.test(password) },
    { label: 'Symbol', ok: /[^A-Za-z0-9]/.test(password) },
    { label: 'Not your username', ok: !username || !password || !password.toLowerCase().includes(username.toLowerCase()) },
  ];
}
