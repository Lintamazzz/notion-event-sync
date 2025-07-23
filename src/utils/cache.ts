import { Redis } from "@upstash/redis";
import "dotenv/config";

function getRedis(): Redis {
	const { KV_REST_API_URL, KV_REST_API_TOKEN } = process.env;

	if (!KV_REST_API_URL) {
		throw new Error("Missing environment variable: KV_REST_API_URL");
	}
	if (!KV_REST_API_TOKEN) {
		throw new Error("Missing environment variable: KV_REST_API_TOKEN");
	}

	return new Redis({
		url: KV_REST_API_URL,
		token: KV_REST_API_TOKEN,
	});
}

const redis = getRedis();

export const cache = {
	async get(key: string): Promise<string | null> {
		return await redis.get(key);
	},

	async setex(key: string, value: string, options: SetOptions = {}): Promise<string | null> {
		return await redis.set(key, value, options);
	},

	async tryLock(key: string, ttlInSeconds = 30): Promise<boolean> {
		const lockVal = Date.now().toString();
		const result = await redis.set(key, lockVal, {
			nx: true,
			ex: ttlInSeconds,
		});
		return result === "OK";
	},

	async unLock(key: string): Promise<number> {
		return await redis.del(key);
	},
};

type SetOptions = { ex: number } | { px: number } | { exat: number } | { pxat: number } | {};
