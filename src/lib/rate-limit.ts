/**
 * Limiteur de tentatives en mémoire (fenêtre glissante simple).
 * Suffisant pour une instance unique ; à remplacer par Redis ou équivalent en cas de déploiement multi-instances.
 */
const attempts = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, max: number, windowMs: number): { allowed: boolean; retryAfterMin: number } {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || entry.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMin: 0 };
  }

  entry.count += 1;
  if (entry.count > max) {
    return { allowed: false, retryAfterMin: Math.ceil((entry.resetAt - now) / 60_000) };
  }
  return { allowed: true, retryAfterMin: 0 };
}

export function resetRateLimit(key: string): void {
  attempts.delete(key);
}
