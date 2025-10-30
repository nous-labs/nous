import { identityBytesToString } from '@nouslabs/sdk';
import { getCrypto } from './crypto';

const SEED_ALPHABET = 'abcdefghijklmnopqrstuvwxyz';
const SEED_LENGTH = 55;

function normalizeSeed(seed: string): string {
  return seed.trim().toLowerCase();
}

function seedToBytes(seed: string): Uint8Array {
  const normalized = normalizeSeed(seed);
  if (normalized.length !== SEED_LENGTH) {
    throw new Error(
      `Seeds must be exactly ${SEED_LENGTH} lowercase letters (a-z).`,
    );
  }
  const bytes = new Uint8Array(SEED_LENGTH);
  for (let i = 0; i < SEED_LENGTH; i++) {
    const char = normalized.charAt(i);
    if (!char) {
      throw new Error('Seed contains invalid length.');
    }
    const idx = SEED_ALPHABET.indexOf(char);
    if (idx === -1) {
      throw new Error('Seeds must contain only lowercase characters a-z.');
    }
    bytes[i] = idx;
  }
  return bytes;
}

export interface SeedIdentityResult {
  identity: string;
  privateKey: Uint8Array;
  publicKey: Uint8Array;
}

export async function deriveSeedIdentity(seed: string): Promise<SeedIdentityResult> {
  const normalized = normalizeSeed(seed);
  const seedBytes = seedToBytes(normalized);
  const crypto = await getCrypto();
  const privateKey = crypto.k12(seedBytes, 32);
  const publicKey = crypto.generatePublicKey(privateKey);
  const identity = identityBytesToString(publicKey).toUpperCase();
  return { identity, privateKey, publicKey };
}
