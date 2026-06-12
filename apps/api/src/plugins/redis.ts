import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import Redis from "ioredis";
import { env } from "../config/env.js";

declare module "fastify" {
  interface FastifyInstance {
    redis: Redis | null;
  }
}

const redisPlugin: FastifyPluginAsync = fp(async (fastify) => {
  try {
    const redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) {
          fastify.log.warn("Redis connection failed after 3 retries — running without Redis");
          return null; // stop retrying
        }
        return Math.min(times * 200, 2000);
      },
    });

    await redis.connect();
    fastify.log.info("✅ Redis connected");
    fastify.decorate("redis", redis);

    fastify.addHook("onClose", async (instance) => {
      if (instance.redis) {
        await instance.redis.quit();
      }
    });
  } catch (err) {
    fastify.log.warn("⚠️ Redis unavailable — running without cache/session store");
    fastify.decorate("redis", null);
  }
});

export default redisPlugin;
