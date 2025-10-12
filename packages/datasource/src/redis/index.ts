import { Redis, type RedisOptions } from "ioredis";

type Option = {
  max: number;
  port: number;
  host: string;
} & RedisOptions;

export function createRedis(url: string, options: RedisOptions): Redis;
export function createRedis(options: Option): Redis;
export function createRedis(option: string | Option, others?: RedisOptions) {
  if (typeof option === "object") {
    const { max, host, port, ...options } = option;
    return new Redis({
      sentinels: Array.from({ length: max }).map((_, index) => ({
        host: host,
        port: port + index,
      })),
      ...options,
    });
  }

  // @ts-expect-error don't check type here
  return new Redis(option, others);
}
