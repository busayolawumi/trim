import "server-only";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, KEY_LENGTH);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

// Hash of a random, unknown password. Checking against it makes a login for an email with no
// account take as long as a wrong password, so response times don't reveal which emails exist.
const DUMMY_HASH =
  "4895bb4f9348ee4fae2fb9abe6c2a567:2bfd7322f11aef025e8ec50e4247b37b1a004336aafa85fa741184774288c4c7c1228a486f79f6bcb352315b7196847bc771197ddb4a7837b8398a1fdaa996be";

/** Spends the same time as verifyPassword, for when there's no account to check against. */
export async function fakeVerifyPassword(password: string) {
  await verifyPassword(password, DUMMY_HASH);
}

export async function verifyPassword(password: string, stored: string) {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scryptAsync(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(expected, actual);
}
