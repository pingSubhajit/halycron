const clampInt = (value: number, {min, max}: {min: number; max: number}) => {
	if (!Number.isFinite(value)) return min
	return Math.max(min, Math.min(max, Math.trunc(value)))
}

const getEnvInt = (key: string, fallback: number) => {
	const raw = process.env[key]
	if (!raw) return fallback
	const parsed = Number.parseInt(raw, 10)
	return Number.isFinite(parsed) ? parsed : fallback
}

/**
 * How long a login should remain valid without activity.
 *
 * This defaults to 30 days (instead of the previously hard-coded 7 days).
 * You can override with `HALYCRON_SESSION_TTL_DAYS`.
 */
export const SESSION_TTL_DAYS = clampInt(getEnvInt('HALYCRON_SESSION_TTL_DAYS', 30), {min: 1, max: 365})
export const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000

/**
 * Sliding-session refresh threshold.
 *
 * If the session expires within this many days, we extend the expiry to `now + SESSION_TTL_MS`.
 * You can override with `HALYCRON_SESSION_REFRESH_THRESHOLD_DAYS`.
 */
export const SESSION_REFRESH_THRESHOLD_DAYS = clampInt(
	getEnvInt('HALYCRON_SESSION_REFRESH_THRESHOLD_DAYS', 7),
	{min: 0, max: 365}
)
export const SESSION_REFRESH_THRESHOLD_MS = SESSION_REFRESH_THRESHOLD_DAYS * 24 * 60 * 60 * 1000

export const getNewSessionExpiresAt = (nowMs: number = Date.now()) => new Date(nowMs + SESSION_TTL_MS)

export const shouldRefreshSession = (expiresAt: Date, nowMs: number = Date.now()) => {
	if (SESSION_REFRESH_THRESHOLD_MS <= 0) return false
	return expiresAt.getTime() - nowMs <= SESSION_REFRESH_THRESHOLD_MS
}

