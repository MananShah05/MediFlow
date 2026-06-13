import type Redis from "ioredis";

/** Typed Redis cache helper — gracefully no-ops when redis is null (offline dev). */
export class CacheService {
  constructor(private redis: Redis | null) {}

  /**
   * Get a cached value. Returns null on miss or when Redis is unavailable.
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;
    try {
      const raw = await this.redis.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  /**
   * Set a cached value with a TTL (seconds). No-op when Redis is unavailable.
   */
  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (!this.redis) return;
    try {
      await this.redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch {
      // silent failure — cache is best-effort
    }
  }

  /**
   * Delete a single key. No-op when Redis is unavailable.
   */
  async del(key: string): Promise<void> {
    if (!this.redis) return;
    try {
      await this.redis.del(key);
    } catch {
      // silent failure
    }
  }

  /**
   * Delete all keys matching a glob pattern (e.g. "mf:patient-list:tenant-id:*").
   * Uses SCAN to avoid blocking the server.
   */
  async invalidatePattern(pattern: string): Promise<void> {
    if (!this.redis) return;
    try {
      let cursor = "0";
      do {
        const [nextCursor, keys] = await this.redis.scan(
          cursor,
          "MATCH",
          pattern,
          "COUNT",
          100
        );
        cursor = nextCursor;
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } while (cursor !== "0");
    } catch {
      // silent failure
    }
  }
}

// ── Cache key factories ──────────────────────────────────────────────
export const CacheKeys = {
  /** Patient self-service dashboard (7 DB queries collapsed) */
  patientDashboard: (userId: string) => `mf:patient-dashboard:${userId}`,

  /** Patient profile + user settings */
  patientProfile: (userId: string) => `mf:patient-profile:${userId}`,

  /** Admin patient list page */
  patientList: (tenantId: string, page: number, limit: number, search: string) =>
    `mf:patient-list:${tenantId}:${page}:${limit}:${search}`,

  /** Auth session (for refresh endpoint) */
  session: (sessionId: string) => `mf:session:${sessionId}`,
} as const;

// ── Cache TTLs (seconds) ─────────────────────────────────────────────
export const CacheTTL = {
  patientDashboard: 60,   // 60s — dashboard data
  patientProfile: 120,    // 120s — profile data
  patientList: 30,        // 30s — paginated lists
  session: 300,           // 5 min — auth session
} as const;
