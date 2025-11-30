import env from "@backend/env";
import { RedisClient } from "bun";
import logger from "./logger";

const patternRegex = /\*|\?|\[/;
const client = new RedisClient(env.REDIS_URL);

logger.info("Connecting to Redis...");
await client.connect();
logger.info("Connected to Redis");

export default {
	async get<T>(key: string): Promise<T | null> {
		const value = await client.get(key);
		return value ? (JSON.parse(value) as T) : null;
	},
	async set(key: string, value: unknown, ttl?: number) {
		await client.set(key, JSON.stringify(value));
		if (ttl) {
			await client.expire(key, ttl);
		}
	},
	async expire(key: string, ttl: number) {
		await client.expire(key, ttl);
	},
	async del(...keys: string[]) {
		const directKeys: string[] = [];
		const patternKeys: string[] = [];

		for (const key of keys) {
			if (patternRegex.test(key)) {
				patternKeys.push(key);
			} else {
				directKeys.push(key);
			}
		}

		if (directKeys.length) await client.del(...directKeys);
		for (const pattern of patternKeys) {
			await this.delByPattern(pattern);
		}
	},
	async delByPattern(pattern: string) {
		if (!patternRegex.test(pattern)) {
			throw new Error("Invalid pattern.");
		}

		const keysToDelete: string[] = [];
		let cursor = "0";
		let deletedCount = 0;

		try {
			do {
				const [nextCursor, keys] = await client.send("SCAN", [
					cursor,
					"MATCH",
					pattern,
					"COUNT",
					"100"
				]);

				if (keys.length > 0) {
					keysToDelete.push(...keys);
				}
				cursor = nextCursor as string;
			} while (cursor !== "0");

			if (keysToDelete.length) {
				deletedCount += await client.del(...keysToDelete);
			}
		} catch (error) {
			logger.error({ error }, "An error occurred while deleting Redis keys.");
		}

		return deletedCount;
	}
};
