import {
  bytesToBase64,
  identityToBytes,
  IDENTITY_LENGTH,
} from '@nouslabs/sdk';
import { deriveSeedIdentity } from './seed';
import { getCrypto } from './crypto';

const PUBLIC_KEY_LENGTH = 32;
const SIGNATURE_LENGTH = 64;
const TRANSACTION_SIZE = 144;
const DIGEST_LENGTH = 32;

export interface TransferTransactionParams {
  seed: string;
  destinationIdentity: string;
  amount: bigint;
  tick: number;
  expectedIdentity?: string;
}

export interface SignedTransactionResult {
  raw: Uint8Array;
  encoded: string;
  fromIdentity: string;
  toIdentity: string;
  amount: bigint;
  tick: number;
}

function normaliseIdentity(identity: string): string {
  return identity.trim().toUpperCase();
}

function assertIdentity(identity: string): void {
  const normalized = normaliseIdentity(identity);
  if (normalized.length !== IDENTITY_LENGTH) {
    throw new Error(
      `Identity must be exactly ${IDENTITY_LENGTH} uppercase characters.`,
    );
  }
  identityToBytes(normalized);
}

export async function buildTransferTransaction(
  params: TransferTransactionParams,
): Promise<SignedTransactionResult> {
  const toIdentity = normaliseIdentity(params.destinationIdentity);
  assertIdentity(toIdentity);

  const { privateKey, publicKey, identity } = await deriveSeedIdentity(
    params.seed,
  );
  const normalizedFrom = normaliseIdentity(identity);
  if (
    params.expectedIdentity &&
    normaliseIdentity(params.expectedIdentity) !== normalizedFrom
  ) {
    throw new Error(
      'Seed does not match the expected sender identity. Please verify your vault.',
    );
  }

  const amount = params.amount;
  if (amount <= 0n) {
    throw new Error('Amount must be a positive integer.');
  }

  if (!Number.isInteger(params.tick) || params.tick <= 0) {
    throw new Error('Tick must be a positive integer.');
  }

  const crypto = await getCrypto();
  const destinationPublicKey = identityToBytes(toIdentity);

  const tx = new Uint8Array(TRANSACTION_SIZE).fill(0);
  let offset = 0;

  tx.set(publicKey, offset);
  offset += PUBLIC_KEY_LENGTH;

  tx.set(destinationPublicKey, offset);
  offset += PUBLIC_KEY_LENGTH;

  const view = new DataView(tx.buffer);
  view.setBigUint64(offset, amount, true);
  offset += 8;

  view.setUint32(offset, params.tick, true);
  offset += 4;

  view.setUint16(offset, 0, true); // input size
  offset += 2;

  view.setUint16(offset, 0, true); // input type
  offset += 2;

  const message = crypto.k12(tx.slice(0, offset), DIGEST_LENGTH);
  const signature = crypto.sign(privateKey, publicKey, message);

  tx.set(signature, offset);

  const encoded = bytesToBase64(tx);

  return {
    raw: tx,
    encoded,
    fromIdentity: normalizedFrom,
    toIdentity,
    amount,
    tick: params.tick,
  };
}
