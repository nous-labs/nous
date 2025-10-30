import { k12 } from "@noble/hashes/sha3-addons";

const IDENTITY_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const BASE = BigInt(IDENTITY_ALPHABET.length);
const PUBLIC_KEY_LENGTH = 32;
const IDENTITY_BODY_LENGTH = 56; // 14 characters per 64-bit limb
const IDENTITY_CHECKSUM_LENGTH = 4;
const IDENTITY_TOTAL_LENGTH = IDENTITY_BODY_LENGTH + IDENTITY_CHECKSUM_LENGTH;

const identityRegex = /^[A-Z]+$/;

function charToValue(char: string): number {
  const code = char.charCodeAt(0);
  const value = code - 65;
  if (value < 0 || value >= IDENTITY_ALPHABET.length) {
    throw new Error(`Invalid Qubic identity character "${char}"`);
  }
  return value;
}

function encodeChecksum(bytes: Uint8Array): string {
  const digest = k12(bytes, { dkLen: 32 });
  const b0 = digest.at(0);
  const b1 = digest.at(1);
  const b2 = digest.at(2);
  if (b0 === undefined || b1 === undefined || b2 === undefined) {
    throw new Error("Failed to compute identity checksum");
  }
  let checksumValue = ((b2 << 16) | (b1 << 8) | b0) & 0x3ffff;

  let checksum = "";
  for (let i = 0; i < IDENTITY_CHECKSUM_LENGTH; i++) {
    const digit = checksumValue % IDENTITY_ALPHABET.length;
    checksum += IDENTITY_ALPHABET[digit];
    checksumValue = Math.floor(checksumValue / IDENTITY_ALPHABET.length);
  }

  return checksum;
}

/**
 * Convert a 60-character human-readable identity into raw 32-byte public key
 * format, validating checksum along the way.
 */
export function identityToBytes(identity: string): Uint8Array {
  const normalized = identity.trim().toUpperCase();

  if (normalized.length !== IDENTITY_TOTAL_LENGTH) {
    throw new Error(
      `Qubic identities must be ${IDENTITY_TOTAL_LENGTH} characters`,
    );
  }

  if (!identityRegex.test(normalized)) {
    throw new Error("Qubic identities may only contain uppercase letters A-Z");
  }

  const body = normalized.slice(0, IDENTITY_BODY_LENGTH);
  const checksum = normalized.slice(IDENTITY_BODY_LENGTH);

  const bytes = new Uint8Array(PUBLIC_KEY_LENGTH);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  for (let chunk = 0; chunk < 4; chunk++) {
    let value = 0n;
    for (let j = 13; j >= 0; j--) {
      const idx = chunk * 14 + j;
      const char = body.charAt(idx);
      if (!char) {
        throw new Error("Identity body is shorter than expected");
      }
      value = value * BASE + BigInt(charToValue(char));
    }
    view.setBigUint64(chunk * 8, value, true);
  }

  const expectedChecksum = encodeChecksum(bytes);
  if (checksum !== expectedChecksum) {
    throw new Error("Invalid Qubic identity checksum");
  }

  return bytes;
}

/**
 * Convert a raw 32-byte public key into the 60-character identity
 * representation (including checksum).
 */
export function identityBytesToString(bytes: Uint8Array): string {
  if (bytes.length !== PUBLIC_KEY_LENGTH) {
    throw new Error("Qubic public keys must be 32 bytes");
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let body = "";

  for (let chunk = 0; chunk < 4; chunk++) {
    let value = view.getBigUint64(chunk * 8, true);
    for (let j = 0; j < 14; j++) {
      const digit = Number(value % BASE);
      body += IDENTITY_ALPHABET[digit];
      value /= BASE;
    }
  }

  return body + encodeChecksum(bytes);
}

export const IDENTITY_LENGTH = IDENTITY_TOTAL_LENGTH;
