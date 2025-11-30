import env from "@backend/env";
import logger from "@backend/services/logger";
import redis from "@backend/services/redis";
import type { CacheOptions } from "@backend/types/caching";
import { Session } from "@backend/types/session";
import { Elysia, status } from "elysia";

const PREFIX = "cache:";

const buildCacheKey = (
	key: string | undefined,
	personalized: boolean = false,
	ctx: { session: { data: Session | null }; key?: string }
) => {
	if (!ctx.key && !key) {
		logger.warn("No cacheKey found in context.");
		return;
	}

	key = PREFIX + (ctx.key ?? key);

	if (personalized) {
		if (!ctx.session.data) {
			logger.warn("No session found in context.");
			return;
		}

		key += `:${ctx.session.data.id}`;
	}

	return key;
};

export const setCache = async <T>(key: string, value: T, ttl: number) => {
	await redis.set(PREFIX + key, JSON.stringify(value), ttl);
};

export const deleteCache = async (...keys: string[]) => {
	await redis.del(...keys.map((key) => PREFIX + key));
};

export const clearCache = async () => {
	const deletedCount = await redis.delByPattern(PREFIX + "*");
	if (deletedCount) {
		logger.info(`Cleared ${deletedCount} cache entries.`);
	}
};

export default new Elysia()
	.resolve(
		{ as: "global" },
		() => ({}) as { cacheKey?: string; session: { data: Session | null } }
	)
	.macro({
		cached(options: CacheOptions | boolean) {
			if (options === false) return;
			if (options === true) options = {};

			const { key, ttl = env.SESSION_TTL, personalized = false } = options;

			return {
				async beforeHandle({ cacheKey: rawKey, session }) {
					const cacheKey = buildCacheKey(key, personalized, {
						key: rawKey,
						session
					});
					if (!cacheKey) return;

					const cachedData = await redis.get<string>(cacheKey);

					if (cachedData) {
						logger.debug(`Cache hit for key: ${cacheKey}`);
						return status(202, cachedData);
					}
				},
				async afterResponse({ set, cacheKey: rawKey, session, responseValue }) {
					if (set.status !== 200) return;

					const cacheKey = buildCacheKey(key, personalized, {
						key: rawKey,
						session
					});
					if (!cacheKey) return;

					logger.debug(
						`Caching response for key: ${cacheKey} with TTL: ${ttl}`
					);
					await redis.set(cacheKey, responseValue, ttl);
				}
			};
		}
	});
