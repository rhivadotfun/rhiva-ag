import assert from "assert";
import crypto from "crypto";

export class Secret {
  private readonly key: Buffer | Uint8Array;

  constructor(
    key: string | Buffer | Uint8Array,
    private readonly options: {
      ivLength: number;
      algorithm: crypto.CipherGCMTypes;
    },
  ) {
    this.key =
      Buffer.isBuffer(key) || key instanceof Uint8Array
        ? key
        : Buffer.from(key, "hex");
    assert(this.key.length === 32, "key must be 32 bytes");
  }

  readonly encrypt = <T>(data: T) => {
    const iv = crypto.randomBytes(this.options.ivLength);

    const cipher = crypto.createCipheriv(this.options.algorithm, this.key, iv);
    const plaintext = Buffer.from(JSON.stringify(data), "utf8");

    const ciphertext = Buffer.concat([
      cipher.update(plaintext),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    const payload = Buffer.concat([iv, authTag, ciphertext]).toString("base64");
    return payload;
  };

  readonly decrypt = <T>(encrypted: string) => {
    const buffer = Buffer.from(encrypted, "base64");

    const iv = buffer.subarray(0, this.options.ivLength);
    const authTag = buffer.subarray(
      this.options.ivLength,
      this.options.ivLength + 16,
    );
    const ciphertext = buffer.subarray(this.options.ivLength + 16);

    const decipher = crypto.createDecipheriv(
      this.options.algorithm,
      this.key,
      iv,
    );
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return JSON.parse(decrypted.toString("utf8")) as T;
  };
}
