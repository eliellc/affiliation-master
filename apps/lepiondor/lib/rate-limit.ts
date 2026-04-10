import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function redis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export async function limitOrThrow(
  identifier: string,
  limit = 60,
  windowSeconds = 60
): Promise<void> {
  const r = redis();
  if (!r) return;
  const rl = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
  });
  const res = await rl.limit(identifier);
  if (!res.success) {
    throw new Error("RATE_LIMIT");
  }
}
