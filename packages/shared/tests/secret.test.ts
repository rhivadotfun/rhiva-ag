import crypto from "crypto";
import { beforeAll, describe, expect, test } from "bun:test";

import { Secret } from "../src/secret";

describe("secret", () => {
  let secret: Secret;

  beforeAll(() => {
    const key = crypto.randomBytes(32).toString("hex");
    secret = new Secret(key, { ivLength: 12, algorithm: "aes-256-gcm" });
  });

  test("encrypt and decrypt pass", () => {
    const message = "I Love computers";
    const payload = secret.encrypt(message);
    const data = secret.decrypt(payload);
    expect(data).toBe(message);
  });

  test("json encrypt and decrypt pass", () => {
    const message = { name: "caleb", age: 20 };
    const payload = secret.encrypt(message);
    const data = secret.decrypt<{ name: string; age: number }>(payload);
    expect(data).toContainAllKeys(["name", "age"]);
    expect(data.name).toBe(message.name);
    expect(data.age).toBe(message.age);
  });
});
