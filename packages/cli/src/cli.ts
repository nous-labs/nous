#!/usr/bin/env node

import { Command, CommanderError } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer, { type QuestionCollection, type DistinctQuestion } from 'inquirer';
import Conf from 'conf';
import readline from 'readline';
import parseArgv from 'string-argv';
import asciichart from 'asciichart';
import { promises as fs } from 'fs';
import { existsSync, mkdirSync, readdirSync, copyFileSync } from 'fs';
import {
  createQubicClient,
  identityToBytes,
  generateSeed,
  base64ToBytes,
  IDENTITY_LENGTH,
  isValidSeed,
  QUBIC_CONTRACT_ADDRESSES,
} from '@nouslabs/sdk';
import type { Transaction } from '@nouslabs/sdk';
import { deriveSeedIdentity } from './qubic/seed';
import { buildTransferTransaction, type SignedTransactionResult } from './qubic/transaction';
import {
  randomBytes,
  pbkdf2Sync,
  createCipheriv,
  createDecipheriv,
} from 'crypto';
import { spawn, spawnSync, type SpawnOptions } from 'child_process';
import path from 'path';


type QubicClient = ReturnType<typeof createQubicClient>;

type IdentityType = 'seed' | 'vault';

interface StoredIdentity {
  label: string;
  identity: string;
  type: IdentityType;
  created: string;
  hasSeed?: boolean;
}

interface SeedRecord {
  identity: string;
  seed: string;
  label?: string;
  created: string;
  updated: string;
}

interface EncryptedSeedStore {
  version: number;
  salt: string;
  iv: string;
  tag: string;
  data: string;
  updated: string;
}

type SeedStore = Record<string, SeedRecord>;

const SEED_STORE_KEY = 'seedVault';
const PASSWORD_HINT_KEY = 'seedVaultHint';
const LEGACY_SEEDS_KEY = 'seeds';
const SEED_STORE_VERSION = 1;
const PBKDF2_ITERATIONS = 120_000;
const AES_ALGO = 'aes-256-gcm';
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_ATTEMPTS = 3;
const DEFAULT_TICK_OFFSET = 5;

const config = new Conf({
  projectName: 'nouslabs-cli',
  schema: {
    currentIdentity: { type: 'string' },
    identities: { type: 'object' },
    rpcEndpoint: { type: 'string' },
    defaultNetwork: { type: 'string' },
    [SEED_STORE_KEY]: { type: 'object' },
    [PASSWORD_HINT_KEY]: { type: 'string' },
    [LEGACY_SEEDS_KEY]: { type: 'object' },
  },
});

let persistentSeedCache: { seeds: SeedStore; password: string } | null = null;
const sessionSeeds: SeedStore = {};

class CliExit extends Error {
  code: number;
  constructor(code: number) {
    super(`CLI_EXIT_${code}`);
    this.code = code;
  }
}

function terminate(code: number): never {
  throw new CliExit(code);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneSeedStore(store: SeedStore): SeedStore {
  return Object.fromEntries(
    Object.entries(store).map(([key, value]) => [key, { ...value }]),
  );
}

function getIdentityStore(): Record<string, StoredIdentity> {
  const store = config.get('identities') as
    | Record<string, StoredIdentity>
    | undefined;
  return store ? { ...store } : {};
}

function saveIdentityStore(store: Record<string, StoredIdentity>): void {
  config.set('identities', store);
}

function formatIdentity(identity: string): string {
  if (!identity) return 'UNKNOWN';
  if (identity.length <= 20) return identity;
  return `${identity.slice(0, 10)}...${identity.slice(-10)}`;
}

function formatAmount(amount: number | bigint | string): string {
  const value = typeof amount === 'string' ? Number(amount) : Number(amount);
  return Number.isFinite(value)
    ? new Intl.NumberFormat('en-US').format(value)
    : String(amount);
}

function normalizeSeed(input: string): string {
  return input.trim().toLowerCase();
}

function getClient(): QubicClient {
  const endpoint = config.get('rpcEndpoint') as string | undefined;
  return createQubicClient(endpoint ? { liveUrl: endpoint } : undefined);
}

function deriveKey(password: string, salt: Buffer): Buffer {
  return pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 32, 'sha256');
}

function encryptSeedStore(
  password: string,
  seeds: SeedStore,
): EncryptedSeedStore {
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const key = deriveKey(password, salt);
  const cipher = createCipheriv(AES_ALGO, key, iv);
  const plaintext = Buffer.from(JSON.stringify(seeds), 'utf8');
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    version: SEED_STORE_VERSION,
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: ciphertext.toString('base64'),
    updated: nowIso(),
  };
}

function decryptSeedStore(
  password: string,
  payload: EncryptedSeedStore,
): SeedStore {
  const salt = Buffer.from(payload.salt, 'base64');
  const iv = Buffer.from(payload.iv, 'base64');
  const ciphertext = Buffer.from(payload.data, 'base64');
  const tag = Buffer.from(payload.tag, 'base64');
  const key = deriveKey(password, salt);
  const decipher = createDecipheriv(AES_ALGO, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8')) as SeedStore;
}

function getEncryptedSeedStore(): EncryptedSeedStore | undefined {
  return config.get(SEED_STORE_KEY) as EncryptedSeedStore | undefined;
}

function persistSeedStore(password: string, seeds: SeedStore): void {
  const snapshot = cloneSeedStore(seeds);
  const payload = encryptSeedStore(password, snapshot);
  config.set(SEED_STORE_KEY, payload);
  persistentSeedCache = { seeds: snapshot, password };
}

function removeSessionSeed(identity: string): void {
  delete sessionSeeds[identity];
}

function isPromptCancelled(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if ((error as any).isTtyError) {
    console.log(chalk.red('Interactive prompts are not supported in this environment.'));
    return true;
  }
  return /force closed/i.test(error.message) || /aborted/i.test(error.message);
}

async function promptOrCancel<T extends Record<string, unknown>>(
  questions: QuestionCollection<T>,
): Promise<T | null> {
  try {
    return await inquirer.prompt<T>(questions);
  } catch (error) {
    if (isPromptCancelled(error)) {
      console.log(chalk.gray('Prompt cancelled.'));
      return null;
    }
    throw error;
  }
}

async function promptForPasswordInput(message: string): Promise<string> {
  const result = await promptOrCancel<{ password: string }>([
    {
      type: 'password',
      name: 'password',
      message,
      mask: '*',
      validate: (input: string) =>
        input.trim().length > 0 || 'Password cannot be empty.',
    },
  ]);
  if (!result) {
    throw new CliExit(1);
  }
  return result.password.trim();
}


async function promptForPasswordCreation(): Promise<{
  password: string;
  hint?: string;
}> {
  while (true) {
    const answers = await promptOrCancel<{ password: string; confirm: string; hint: string }>([
      {
        type: 'password',
        name: 'password',
        message: 'Create a password to encrypt your seeds:',
        mask: '*',
        validate: (input: string) =>
          input.length >= MIN_PASSWORD_LENGTH
            ? true
            : `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
      },
      {
        type: 'password',
        name: 'confirm',
        message: 'Confirm password:',
        mask: '*',
      },
      {
        type: 'input',
        name: 'hint',
        message: 'Optional password hint (stored unencrypted):',
        filter: (input: string) => input.trim(),
      },
    ]);

    if (!answers) {
      throw new CliExit(1);
    }

    if (answers.password !== answers.confirm) {
      console.log(chalk.red('Passwords do not match. Please try again.'));
      continue;
    }

    return {
      password: answers.password,
      hint: answers.hint.length > 0 ? answers.hint : undefined,
    };
  }
}


async function unlockSeedStore(
  promptMessage?: string,
  options?: { forcePrompt?: boolean },
): Promise<{ seeds: SeedStore; password: string } | null> {
  const payload = getEncryptedSeedStore();
  if (!payload) {
    return null;
  }

  if (!options?.forcePrompt && persistentSeedCache) {
    return persistentSeedCache;
  }

  const hint = config.get(PASSWORD_HINT_KEY) as string | undefined;
  if (hint) {
    console.log(chalk.gray(`Password hint: ${hint}`));
  }

  for (let attempt = 1; attempt <= MAX_PASSWORD_ATTEMPTS; attempt += 1) {
    const password = await promptForPasswordInput(
      promptMessage ?? 'Enter seed vault password:',
    );
    try {
      const seeds = decryptSeedStore(password, payload);
      persistentSeedCache = { seeds, password };
      return persistentSeedCache;
    } catch (error) {
      console.log(chalk.red('Incorrect password.'));
      if (attempt === MAX_PASSWORD_ATTEMPTS) {
        console.log(
          chalk.yellow('Max attempts reached. Seed vault remains locked.'),
        );
      }
    }
  }

  return null;
}

async function ensureSeedVault(): Promise<{ seeds: SeedStore; password: string }> {
  const payload = getEncryptedSeedStore();
  if (payload) {
    const unlocked = await unlockSeedStore(
      'Enter seed vault password to update stored seeds:',
    );
    if (!unlocked) {
      throw new Error('Unable to unlock seed vault.');
    }
    return unlocked;
  }

  const legacySeeds = config.get(LEGACY_SEEDS_KEY) as SeedStore | undefined;
  const { password, hint } = await promptForPasswordCreation();
  const seeds = legacySeeds ? cloneSeedStore(legacySeeds) : {};
  persistSeedStore(password, seeds);
  if (hint) {
    config.set(PASSWORD_HINT_KEY, hint);
  } else {
    config.delete(PASSWORD_HINT_KEY);
  }
  if (legacySeeds) {
    config.delete(LEGACY_SEEDS_KEY);
  }
  return persistentSeedCache!;
}

async function deriveIdentityFromSeed(seed: string): Promise<string> {
  const { identity } = await deriveSeedIdentity(normalizeSeed(seed));
  return identity;
}

async function requireSeed(
  identity: string,
  options?: { promptReason?: string; allowAdHoc?: boolean },
): Promise<SeedRecord | null> {
  const normalized = identity.trim().toUpperCase();

  if (persistentSeedCache?.seeds[normalized]) {
    const record = persistentSeedCache.seeds[normalized];
    sessionSeeds[normalized] = record;
    return record;
  }

  if (sessionSeeds[normalized]) {
    return sessionSeeds[normalized];
  }

  const payload = getEncryptedSeedStore();
  if (payload) {
    const unlocked = await unlockSeedStore(options?.promptReason);
    if (!unlocked) {
      console.log(chalk.red('Seed vault is locked.'));
      return null;
    }
    const record = unlocked.seeds[normalized];
    if (record) {
      sessionSeeds[normalized] = record;
      return record;
    }
  }

  if (options?.allowAdHoc === false) {
    console.log(chalk.red('Seed is required but not available.'));
    return null;
  }

  console.log(
    chalk.yellow(
      'Seed not stored. Enter seed now (kept in memory for this session only).',
    ),
  );

  const seedAnswer = await promptOrCancel<{ seed: string }>([
    {
      type: 'password',
      name: 'seed',
      message: 'Seed (55+ lowercase letters):',
      mask: '*',
      filter: (input: string) => normalizeSeed(input),
      validate: (input: string) =>
        isValidSeed(normalizeSeed(input)) ||
        'Seed must be at least 55 lowercase letters (a-z).',
    },
  ]);

  if (!seedAnswer) {
    console.log(chalk.gray('Seed entry cancelled.'));
    return null;
  }

  const normalizedSeed = normalizeSeed(seedAnswer.seed);
  const derivedIdentity = await deriveIdentityFromSeed(normalizedSeed);
  if (derivedIdentity !== normalized) {
    console.log(chalk.red('Provided seed does not match the requested identity.'));
    return null;
  }

  const record: SeedRecord = {
    identity: normalized,
    seed: normalizedSeed,
    created: nowIso(),
    updated: nowIso(),
  };
  sessionSeeds[normalized] = record;
  return record;
}

async function confirmTransactionAuthorization(): Promise<boolean> {
  const payload = getEncryptedSeedStore();
  if (payload) {
    if (persistentSeedCache) {
      return true;
    }
    const unlocked = await unlockSeedStore(
      'Enter seed vault password to authorize this transaction:',
      { forcePrompt: true },
    );
    return Boolean(unlocked);
  }

  const answer = await promptOrCancel<{ confirm: boolean }>([
    {
      type: 'confirm',
      name: 'confirm',
      message:
        'No encrypted seed vault detected. Proceed with the transaction using the in-memory seed?',
      default: false,
    },
  ]);

  return Boolean(answer?.confirm);
}

function normaliseIdentityInput(value: string): string {
  return value.trim().toUpperCase();
}

function ensureIdentity(value: string, label: string): string {
  try {
    const normalized = normaliseIdentityInput(value);
    identityToBytes(normalized);
    return normalized;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`${label} identity is invalid: ${error.message}`);
    }
    throw new Error(`${label} identity is invalid.`);
  }
}

function parsePositiveAmount(value: string): bigint {
  let amount: bigint;
  try {
    amount = BigInt(value);
  } catch {
    throw new Error('Amount must be an integer representing whole QUBIC.');
  }
  if (amount <= 0n) {
    throw new Error('Amount must be greater than zero.');
  }
  return amount;
}

function parsePositiveInteger(value: string, label: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }
  return parsed;
}

async function resolveTickNumber(
  options: { tick?: string; tickOffset?: string },
  client: QubicClient,
): Promise<number> {
  if (options.tick) {
    const tickNumber = Number.parseInt(options.tick, 10);
    if (!Number.isFinite(tickNumber) || tickNumber <= 0) {
      throw new Error('Provided tick must be a positive integer.');
    }
    return tickNumber;
  }

  const offsetInput = options.tickOffset ?? String(DEFAULT_TICK_OFFSET);
  const offset = Number.parseInt(offsetInput, 10);
  if (!Number.isFinite(offset) || offset < 0) {
    throw new Error('Tick offset must be a non-negative integer value.');
  }
  const { tickInfo } = await client.live.getTickInfo();
  return tickInfo.tick + offset;
}

interface TransferContext {
  identityRecord: StoredIdentity;
  seedRecord: SeedRecord;
  destination: string;
  amount: bigint;
  tick: number;
  availableBalance?: bigint;
}

async function prepareTransferContext(
  client: QubicClient,
  to: string,
  amount: string,
  options: { from?: string; tick?: string; tickOffset?: string },
  requireOptions?: {
    allowAdHocSeed?: boolean;
    promptReason?: string;
    skipBalanceCheck?: boolean;
  },
): Promise<TransferContext | null> {
  const fromIdentityInput = options.from || getCurrentIdentity();
  if (!fromIdentityInput) {
    return null;
  }

  const fromIdentity = normaliseIdentityInput(fromIdentityInput);
  const identities = getIdentityStore();
  const identityRecord = identities[fromIdentity];
  if (!identityRecord) {
    console.log(chalk.red('Identity not found in local store.'));
    return null;
  }

  try {
    ensureIdentity(identityRecord.identity, 'Sender');
  } catch (error) {
    console.log(chalk.red(error instanceof Error ? error.message : String(error)));
    return null;
  }

  let destination: string;
  try {
    destination = ensureIdentity(to, 'Destination');
  } catch (error) {
    console.log(chalk.red(error instanceof Error ? error.message : String(error)));
    return null;
  }

  let amountValue: bigint;
  try {
    amountValue = parsePositiveAmount(amount);
  } catch (error) {
    console.log(chalk.red(error instanceof Error ? error.message : String(error)));
    return null;
  }

  let tickNumber: number;
  try {
    tickNumber = await resolveTickNumber(options, client);
  } catch (error) {
    console.log(chalk.red(error instanceof Error ? error.message : String(error)));
    return null;
  }

  const seedRecord = await requireSeed(identityRecord.identity, {
    allowAdHoc: requireOptions?.allowAdHocSeed,
    promptReason:
      requireOptions?.promptReason ??
      'Unlock seed vault to prepare transaction signing:',
  });

  if (!seedRecord) {
    console.log(
      chalk.yellow('Cannot proceed without unlocking the seed vault.'),
    );
    return null;
  }

  let availableBalance: bigint | undefined;
  if (!requireOptions?.skipBalanceCheck) {
    try {
      const { balance } = await client.live.getBalance(identityRecord.identity);
      availableBalance = BigInt(balance.balance);
      if (amountValue > availableBalance) {
        console.log(
          chalk.red(
            `Insufficient balance. Available: ${formatAmount(availableBalance)} QUBIC`,
          ),
        );
        return null;
      }
    } catch (error) {
      console.log(
        chalk.red(
          error instanceof Error
            ? `Unable to fetch balance: ${error.message}`
            : 'Unable to fetch balance.',
        ),
      );
      return null;
    }
  }

  return {
    identityRecord,
    seedRecord,
    destination,
    amount: amountValue,
    tick: tickNumber,
    availableBalance,
  };
}

async function waitForTransactionConfirmation(
  client: QubicClient,
  transactionId: string,
  options?: { intervalMs?: number; maxAttempts?: number },
): Promise<{
  confirmed: boolean;
  tick?: number;
  attempts: number;
  lastObservedTick?: number;
  initialTick?: number;
  error?: string;
}> {
  const intervalMs = options?.intervalMs ?? 2000;
  const maxAttempts = options?.maxAttempts ?? 30;
  const spinner = ora('Awaiting confirmation...').start();
  let lastObservedTick: number | undefined;
  let initialTick: number | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    spinner.text = `Awaiting confirmation (${attempt}/${maxAttempts})`;
    try {
      const tx = await client.query.getTransactionByHash(transactionId);
      const tickSuffix =
        typeof tx.tickNumber === 'number' ? ` at tick ${tx.tickNumber}` : '';
      spinner.succeed(`Transaction confirmed${tickSuffix}.`);
      return {
        confirmed: true,
        tick: tx.tickNumber,
        attempts: attempt,
        lastObservedTick,
        initialTick,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      try {
        const { tickInfo } = await client.live.getTickInfo();
        lastObservedTick = tickInfo.tick;
        if (initialTick === undefined) {
          initialTick = tickInfo.tick;
        }
      } catch {
        // Ignore tick info failures; we'll rely on previous observations.
      }

      if (/not found/i.test(message) || /404/.test(message)) {
        await sleep(intervalMs);
        continue;
      }
      spinner.warn(`Query failed: ${message}`);
      return {
        confirmed: false,
        attempts: attempt,
        lastObservedTick,
        initialTick,
        error: message,
      };
    }
  }

  spinner.stop();
  console.log(
    chalk.yellow(
      'Transaction not yet confirmed. The network may still be processing the broadcast.',
    ),
  );
  return {
    confirmed: false,
    attempts: maxAttempts,
    lastObservedTick,
    initialTick,
    error: 'timeout',
  };
}

async function reviewTransferDetails(
  context: TransferContext,
): Promise<boolean> {
  console.log('');
  console.log(chalk.bold('Review Transfer'));
  console.log(chalk.gray('-'.repeat(50)));
  console.log(
    chalk.blue('From:'),
    chalk.white(formatIdentity(context.identityRecord.identity)),
  );
  console.log(
    chalk.blue('To:'),
    chalk.white(formatIdentity(context.destination)),
  );
  console.log(
    chalk.blue('Amount:'),
    chalk.green(`${formatAmount(context.amount)} QUBIC`),
  );
  if (context.availableBalance !== undefined) {
    console.log(
      chalk.blue('Available:'),
      chalk.white(`${formatAmount(context.availableBalance)} QUBIC`),
    );
  }
  console.log(chalk.blue('Tick:'), chalk.white(String(context.tick)));
  console.log('');

  const confirmAnswer = await promptOrCancel<{ confirm: boolean }>([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Send this transaction?',
      default: false,
    },
  ]);

  if (!confirmAnswer?.confirm) {
    return false;
  }

  return confirmTransactionAuthorization();
}
async function persistSeedRecord(record: SeedRecord): Promise<void> {
  const vault = await ensureSeedVault();
  vault.seeds[record.identity] = record;
  persistSeedStore(vault.password, vault.seeds);
}

async function removePersistedSeed(identity: string): Promise<boolean> {
  if (!getEncryptedSeedStore()) {
    return false;
  }
  const vault = await unlockSeedStore(
    'Enter seed vault password to remove encrypted seed:',
  );
  if (!vault) {
    return false;
  }
  if (!vault.seeds[identity]) {
    return false;
  }
  delete vault.seeds[identity];
  persistSeedStore(vault.password, vault.seeds);
  return true;
}

async function handleSeedAuthentication(options: {
  setCurrent: boolean;
  header: string;
  successMessage: string;
}): Promise<{ identity: string; label: string } | null> {
  console.log('');
  console.log(chalk.bold(options.header));
  console.log(chalk.gray('-'.repeat(50)));

  const seedPrompt = await promptOrCancel<{ seed: string }>([
    {
      type: 'password',
      name: 'seed',
      message: 'Seed (55+ lowercase letters):',
      mask: '*',
      filter: (input: string) => normalizeSeed(input),
      validate: (input: string) =>
        isValidSeed(normalizeSeed(input)) ||
        'Seed must be at least 55 lowercase letters (a-z).',
    },
  ]);

  if (!seedPrompt) {
    console.log(chalk.gray('Authentication cancelled.'));
    return null;
  }

  const normalizedSeed = normalizeSeed(seedPrompt.seed);
  const identity = await deriveIdentityFromSeed(normalizedSeed);
  console.log(chalk.blue('Derived identity:'), chalk.white(identity));

  const identities = getIdentityStore();
  const existingIdentity = identities[identity];
  const defaultLabel = existingIdentity?.label ?? `Seed ${identity.slice(0, 6)}`;
  const existingSession = sessionSeeds[identity];

  const answers = await promptOrCancel<{ label: string; persist: boolean }>([
    {
      type: 'input',
      name: 'label',
      message: 'Account label:',
      default: defaultLabel,
      filter: (input: string) => input.trim(),
      validate: (input: string) =>
        input.trim().length > 0 || 'Label is required.',
    },
    {
      type: 'confirm',
      name: 'persist',
      message: 'Store the seed encrypted for future use?',
      default: existingIdentity?.hasSeed ?? false,
    },
  ]);

  if (!answers) {
    console.log(chalk.gray('Authentication cancelled.'));
    return null;
  }

  const now = nowIso();
  const createdAt =
    existingSession?.created ?? existingIdentity?.created ?? now;

  const record: SeedRecord = {
    identity,
    seed: normalizedSeed,
    label: answers.label,
    created: createdAt,
    updated: now,
  };

  sessionSeeds[identity] = record;

  if (answers.persist) {
    try {
      await persistSeedRecord(record);
    } catch (error) {
      console.log(
        chalk.red(
          'Failed to store seed securely. It will remain in memory for this session only.',
        ),
      );
      if (error instanceof Error) {
        console.log(chalk.gray(error.message));
      }
    }
  }

  identities[identity] = {
    label: answers.label,
    identity,
    type: 'seed',
    created: existingIdentity?.created ?? now,
    hasSeed: answers.persist ? true : existingIdentity?.hasSeed ?? false,
  };
  saveIdentityStore(identities);

  if (options.setCurrent) {
    config.set('currentIdentity', identity);
  }

  console.log('');
  console.log(chalk.green(options.successMessage));
  console.log(chalk.blue('Identity:'), chalk.white(identity));
  console.log(chalk.blue('Label:'), chalk.white(answers.label));
  console.log(
    chalk.blue('Stored encrypted:'),
    chalk.white(answers.persist ? 'Yes' : 'No'),
  );
  if (!answers.persist) {
    console.log(
      chalk.gray(
        'Seed kept in memory for this session. Store it encrypted to reuse without re-entering.',
      ),
    );
  } else {
    console.log(
      chalk.gray('Seed encrypted locally. Password required for signing.'),
    );
  }
  console.log('');

  return { identity, label: answers.label };
}

async function createSeedAccountFlow(options: {
  label?: string;
  store?: boolean;
  select?: boolean;
}): Promise<{ identity: string; label: string; seed: string }> {
  const seed = generateSeed(55);
  const { identity } = await deriveSeedIdentity(seed);

  const defaultLabel =
    options.label?.trim() || `Account ${identity.slice(0, 6)}`;

  const prompts: DistinctQuestion[] = [];
  if (!options.label) {
    prompts.push({
      type: 'input',
      name: 'label',
      message: 'Account label:',
      default: defaultLabel,
      filter: (input: string) => input.trim(),
      validate: (input: string) =>
        input.trim().length > 0 || 'Label is required.',
    });
  }
  if (options.store === undefined) {
    prompts.push({
      type: 'confirm',
      name: 'store',
      message: 'Store the new seed in the encrypted vault?',
      default: true,
    });
  }
  if (options.select === undefined) {
    prompts.push({
      type: 'confirm',
      name: 'select',
      message: 'Set this account as the current identity?',
      default: true,
    });
  }

  const promptAnswers =
    prompts.length > 0 ? await promptOrCancel<Record<string, any>>(prompts) : {};

  if (prompts.length > 0 && !promptAnswers) {
    console.log(chalk.gray('Account creation cancelled.'));
    throw new CliExit(1);
  }

  const answers = promptAnswers ?? {};

  const label =
    options.label?.trim() || (answers as any).label || defaultLabel;
  const persist =
    options.store ??
    (answers as any).store ??
    true;
  const setCurrent =
    options.select ??
    (answers as any).select ??
    true;

  const now = nowIso();
  const record: SeedRecord = {
    identity,
    seed,
    label,
    created: now,
    updated: now,
  };
  sessionSeeds[identity] = record;

  if (persist) {
    try {
      await persistSeedRecord(record);
      console.log(chalk.gray('Seed stored in encrypted vault.'));
    } catch (error) {
      console.log(
        chalk.red(
          'Failed to persist seed. It will remain in memory for this session only.',
        ),
      );
      if (error instanceof Error) {
        console.log(chalk.gray(error.message));
      }
    }
  } else {
    console.log(
      chalk.yellow(
        'Seed not stored. You must copy it now; the CLI will not retain it after exit.',
      ),
    );
  }

  const identities = getIdentityStore();
  identities[identity] = {
    label,
    identity,
    type: 'seed',
    created: now,
    hasSeed: persist,
  };
  saveIdentityStore(identities);

  if (setCurrent) {
    config.set('currentIdentity', identity);
  }

  console.log('');
  console.log(chalk.green('New Qubic account generated.'));
  console.log(chalk.blue('Identity:'), chalk.white(formatIdentity(identity)));
  console.log(chalk.blue('Label:'), chalk.white(label));
  console.log(chalk.blue('Seed:'), chalk.white(seed));
  console.log(
    chalk.gray(
      'Keep this seed secret. Anyone with access can control your account.',
    ),
  );
  console.log('');

  return { identity, label, seed };
}

function getCurrentIdentity(): string | null {
  const current = config.get('currentIdentity') as string | undefined;
  if (!current) {
    console.log(
      chalk.yellow(
        'No identity selected. Use "nous auth login" or "nous account select".',
      ),
    );
    return null;
  }
  return current;
}

function countStoredSeeds(): number {
  return Object.values(getIdentityStore()).filter((id) => id.hasSeed).length;
}

function isSeedLoaded(identity: string): boolean {
  return Boolean(sessionSeeds[identity]);
}
function registerCommands(program: Command): Command {
program
  .name('nous')
  .description('Command-line tools for Qubic blockchain')
  .version('0.1.0');
program.showHelpAfterError('(add --help for usage information)');
program.showSuggestionAfterError(true);

program
  .command('info')
  .description('Get current Qubic network information')
  .option('--json', 'Output as JSON')
  .action(async (options: { json?: boolean }) => {
    const spinner = ora('Fetching network info...').start();

    try {
      const qubic = getClient();
      const { tickInfo } = await qubic.live.getTickInfo();

      spinner.succeed('Network information retrieved');

      if (options.json) {
        console.log(JSON.stringify(tickInfo, null, 2));
      } else {
        console.log('');
        console.log(chalk.blue('Current Tick:'), chalk.white(tickInfo.tick));
        console.log(chalk.blue('Epoch:'), chalk.white(tickInfo.epoch));
        console.log(chalk.blue('Duration:'), chalk.white(tickInfo.duration));
      }
    } catch (error) {
      spinner.fail('Failed to fetch network info');
      console.error(
        chalk.red(error instanceof Error ? error.message : 'Unknown error'),
      );
      terminate(1);
    }
  });

program
  .command('balance [identity]')
  .description(
    'Check balance for a Qubic identity (uses current if not specified)',
  )
  .option('--json', 'Output as JSON')
  .action(async (identity?: string, options?: { json?: boolean }) => {
    const targetIdentity = identity || getCurrentIdentity();
    if (!targetIdentity) {
      terminate(1);
    }

    const spinner = ora(
      `Fetching balance for ${formatIdentity(targetIdentity)}...`,
    ).start();

    try {
      const qubic = getClient();
      const { balance } = await qubic.live.getBalance(targetIdentity);

      spinner.succeed('Balance retrieved');

      if (options?.json) {
        console.log(JSON.stringify(balance, null, 2));
      } else {
        console.log('');
        console.log(
          chalk.blue('Identity:'),
          chalk.white(formatIdentity(targetIdentity)),
        );
        console.log(
          chalk.blue('Balance:'),
          chalk.green(`${formatAmount(balance.balance)} QUBIC`),
        );
        console.log(
          chalk.blue('Valid for Tick:'),
          chalk.white(balance.validForTick),
        );
      }
    } catch (error) {
      spinner.fail('Failed to fetch balance');
      console.error(
        chalk.red(error instanceof Error ? error.message : 'Unknown error'),
      );
      terminate(1);
    }
  });

program
  .command('tx [identity]')
  .description(
    'Get recent transactions for an identity (uses current if not specified)',
  )
  .option('-l, --limit <number>', 'Number of transactions to fetch', '10')
  .option('--json', 'Output as JSON')
  .action(
    async (identity?: string, options?: { limit: string; json?: boolean }) => {
      const targetIdentity = identity || getCurrentIdentity();
      if (!targetIdentity) {
        terminate(1);
      }

      const limit = parseInt(options?.limit || '10', 10);
      const spinner = ora(`Fetching last ${limit} transactions...`).start();

      try {
        const qubic = getClient();
        const { transactions } =
          await qubic.query.getTransactionsForIdentity(targetIdentity, {
            pagination: { offset: 0, size: limit },
          });

        spinner.succeed(`Found ${transactions.length} transactions`);

        if (options?.json) {
          console.log(JSON.stringify(transactions, null, 2));
        } else {
          if (transactions.length === 0) {
            console.log(chalk.gray('\nNo transactions found.'));
            return;
          }

          console.log('');
          transactions.forEach((tx, index) => {
            const src = (tx as any).source ?? (tx as any).sourceId ?? 'UNKNOWN';
            const dst =
              (tx as any).destination ?? (tx as any).destId ?? 'UNKNOWN';
            const amount = (tx as any).amount ?? '0';
            console.log(
              chalk.blue(`${index + 1}.`),
              chalk.white(
                `${formatIdentity(String(src))} -> ${formatIdentity(String(dst))}`,
              ),
            );
            console.log(
              chalk.gray(
                `   Amount: ${formatAmount(Number(amount))} QUBIC | Tick: ${tx.tickNumber}`,
              ),
            );
          });
        }
      } catch (error) {
        spinner.fail('Failed to fetch transactions');
        console.error(
          chalk.red(error instanceof Error ? error.message : 'Unknown error'),
        );
        terminate(1);
      }
    },
  );

program
  .command('tx-hash <hash>')
  .description('Get a transaction by its hash')
  .option('--json', 'Output as JSON')
  .action(async (hash: string, options: { json?: boolean }) => {
    const spinner = ora('Fetching transaction...').start();
    try {
      const qubic = getClient();
      const tx = await qubic.query.getTransactionByHash(hash);
      spinner.succeed('Transaction retrieved');

      if (options.json) {
        console.log(JSON.stringify(tx, null, 2));
      } else {
        const src = (tx as any).source ?? (tx as any).sourceId ?? 'UNKNOWN';
        const dst =
          (tx as any).destination ?? (tx as any).destId ?? 'UNKNOWN';
        console.log('');
        console.log(chalk.blue('Hash:'), chalk.white(tx.hash ?? tx.txId ?? hash));
        console.log(
          chalk.blue('From:'),
          chalk.white(formatIdentity(String(src))),
        );
        console.log(chalk.blue('To:'), chalk.white(formatIdentity(String(dst))));
        console.log(
          chalk.blue('Amount:'),
          chalk.green(`${formatAmount(Number(tx.amount))} QUBIC`),
        );
        if ((tx as any).timestamp) {
          console.log(
            chalk.blue('Timestamp:'),
            chalk.white((tx as any).timestamp),
          );
        }
        console.log(chalk.blue('Tick:'), chalk.white(tx.tickNumber));
        console.log('');
      }
    } catch (error) {
      spinner.fail('Failed to fetch transaction');
      console.error(
        chalk.red(error instanceof Error ? error.message : 'Unknown error'),
      );
      terminate(1);
    }
  });

const send = program
  .command('send')
  .description('Secure transaction submission workflows');

send
  .command('transfer <to> <amount>')
  .description('Send QUBIC to another address')
  .option(
    '-f, --from <identity>',
    'Sender identity (uses current if not specified)',
  )
  .option('--tick <number>', 'Target tick number')
  .option(
    '--tick-offset <number>',
    'Tick offset when deriving the target tick (default: 5)',
  )
  .option(
    '--skip-review',
    'Skip interactive review (still prompts for password confirmation)',
  )
  .action(
    async (
      to: string,
      amount: string,
      options: {
        from?: string;
        tick?: string;
        tickOffset?: string;
        skipReview?: boolean;
      },
    ) => {
      const qubic = getClient();
      const context = await prepareTransferContext(
        qubic,
        to,
        amount,
        options,
        {
          promptReason:
            'Enter seed vault password to sign and broadcast this transaction:',
        },
      );

      if (!context) {
        return;
      }

      const authorized = options.skipReview
        ? await confirmTransactionAuthorization()
        : await reviewTransferDetails(context);

      if (!authorized) {
        console.log(chalk.gray('Transaction cancelled.'));
        return;
      }

      const spinner = ora('Preparing transaction...').start();
      try {
        const { tickInfo: latestTickInfo } = await qubic.live.getTickInfo();
        let effectiveTick = Math.max(
          context.tick,
          (latestTickInfo?.tick ?? context.tick) + DEFAULT_TICK_OFFSET,
        );

        let transfer: SignedTransactionResult;
        try {
          transfer = await buildTransferTransaction({
            seed: context.seedRecord.seed,
            destinationIdentity: context.destination,
            amount: context.amount,
            tick: effectiveTick,
            expectedIdentity: context.seedRecord.identity,
          });
        } catch (error) {
          spinner.fail('Failed to build transaction');
          console.error(
            chalk.red(error instanceof Error ? error.message : 'Unknown error'),
          );
          return;
        }

        spinner.text = 'Broadcasting transaction...';
        let broadcastResult;
        try {
          broadcastResult = await qubic.live.broadcast(transfer.encoded);
          spinner.succeed('Transaction broadcast successfully.');
        } catch (error) {
          spinner.fail('Failed to broadcast transaction');
          console.error(
            chalk.red(error instanceof Error ? error.message : 'Unknown error'),
          );
          return;
        }

        console.log('');
        console.log(chalk.blue('Transaction ID:'), chalk.white(broadcastResult.transactionId));
        console.log(
          chalk.blue('Peers broadcasted:'),
          chalk.white(broadcastResult.peersBroadcasted.toString()),
        );
        console.log(
          chalk.blue('From:'),
          chalk.white(formatIdentity(transfer.fromIdentity)),
        );
        console.log(
          chalk.blue('To:'),
          chalk.white(formatIdentity(transfer.toIdentity)),
        );
        console.log(
          chalk.blue('Amount:'),
          chalk.green(`${formatAmount(transfer.amount)} QUBIC`),
        );
        console.log(chalk.blue('Tick:'), chalk.white(String(transfer.tick)));
        console.log(
          chalk.gray('Encoded transaction (base64):'),
          chalk.gray(transfer.encoded),
        );
        console.log('');

        const waitAnswer = await promptOrCancel<{ waitForConfirmation: boolean }>([
          {
            type: 'confirm',
            name: 'waitForConfirmation',
            message: 'Wait for network confirmation?',
            default: true,
          },
        ]);

        if (waitAnswer?.waitForConfirmation) {
          let currentTxId = broadcastResult.transactionId;
          effectiveTick = transfer.tick;
          const safetyThreshold = 3;
          while (true) {
            const confirmation = await waitForTransactionConfirmation(qubic, currentTxId);
            if (confirmation.confirmed) {
              if (confirmation.tick !== undefined) {
                console.log(
                  chalk.green(
                    `Transaction confirmed at tick ${confirmation.tick}.`,
                  ),
                );
              }
              break;
            }

            if (confirmation.error && confirmation.error !== 'timeout') {
              console.log(chalk.red(`Confirmation check failed: ${confirmation.error}`));
              break;
            }

            const tickAdvance =
              confirmation.lastObservedTick !== undefined
                ? confirmation.lastObservedTick - effectiveTick
                : undefined;
            const safeToRetry =
              confirmation.error === 'timeout' &&
              tickAdvance !== undefined &&
              tickAdvance >= safetyThreshold;

            if (!safeToRetry) {
              if (confirmation.error === 'timeout') {
                if (confirmation.lastObservedTick !== undefined) {
                  const remaining = Math.max(
                    0,
                    safetyThreshold - Math.max(0, tickAdvance ?? 0),
                  );
                  console.log(
                    chalk.gray(
                      `Latest observed tick ${confirmation.lastObservedTick}. Waiting for ${remaining} more tick(s) before considering rebroadcast.`,
                    ),
                  );
                } else {
                  console.log(
                    chalk.gray(
                      'Awaiting additional network progress before considering rebroadcast.',
                    ),
                  );
                }
              }

              const continueAnswer = await promptOrCancel<{ continueWaiting: boolean }>([
                {
                  type: 'confirm',
                  name: 'continueWaiting',
                  message: 'Continue waiting for confirmation?',
                  default: true,
                },
              ]);

              if (!continueAnswer?.continueWaiting) {
                break;
              }

              continue;
            }

            const retryAnswer = await promptOrCancel<{ retry: boolean }>([
              {
                type: 'confirm',
                name: 'retry',
                message: `Network advanced beyond tick ${transfer.tick}. Rebroadcast transaction?`,
                default: false,
              },
            ]);

            if (!retryAnswer?.retry) {
              break;
            }

            const retrySpinner = ora('Rebroadcasting transaction...').start();
            try {
            // regenerate with higher tick to stay ahead of the ledger
            effectiveTick = Math.max(
              effectiveTick + DEFAULT_TICK_OFFSET,
              confirmation.lastObservedTick !== undefined
                ? confirmation.lastObservedTick + DEFAULT_TICK_OFFSET
                : effectiveTick + DEFAULT_TICK_OFFSET,
            );

            const regenerated = await buildTransferTransaction({
              seed: context.seedRecord.seed,
              destinationIdentity: context.destination,
              amount: context.amount,
              tick: effectiveTick,
              expectedIdentity: context.seedRecord.identity,
            });
            transfer = regenerated;

            const retryResult = await qubic.live.broadcast(transfer.encoded);
            currentTxId = retryResult.transactionId;
            retrySpinner.succeed('Transaction rebroadcasted.');
            } catch (error) {
              retrySpinner.fail('Failed to rebroadcast transaction');
              console.error(
                chalk.red(error instanceof Error ? error.message : 'Unknown error'),
              );
              const continueAnswer = await promptOrCancel<{ continueWaiting: boolean }>([
                {
                  type: 'confirm',
                  name: 'continueWaiting',
                  message: 'Continue waiting for confirmation without rebroadcasting?',
                  default: true,
                },
              ]);
              if (!continueAnswer?.continueWaiting) {
                break;
              }
            }
          }
        }
      } catch (error) {
        spinner.fail('Failed to broadcast transaction');
        console.error(
          chalk.red(error instanceof Error ? error.message : 'Unknown error'),
        );
      }
    },
  );

send
  .command('from-file <file>')
  .description('Broadcast a previously signed transaction from a file')
  .option('--json', 'Output broadcast response as JSON')
  .action(async (file: string, options: { json?: boolean }) => {
    try {
      const encoded = (await fs.readFile(file, 'utf8')).trim();
      if (!encoded) {
        console.log(chalk.red('File is empty or missing an encoded transaction.'));
        return;
      }
      const spinner = ora('Broadcasting transaction...').start();
      try {
        const qubic = getClient();
        const result = await qubic.live.broadcast(encoded);
        spinner.succeed('Transaction broadcast successfully.');
        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log('');
          console.log(
            chalk.blue('Transaction ID:'),
            chalk.white(result.transactionId),
          );
          console.log(
            chalk.blue('Peers broadcasted:'),
            chalk.white(result.peersBroadcasted.toString()),
          );
          console.log(
            chalk.gray('Encoded transaction (base64):'),
            chalk.gray(encoded),
          );
          console.log('');
        }
      } catch (error) {
        spinner.fail('Failed to broadcast transaction');
        console.error(
          chalk.red(error instanceof Error ? error.message : 'Unknown error'),
        );
      }
    } catch (error) {
      console.log(
        chalk.red(
          `Unable to read file: ${
            error instanceof Error ? error.message : String(error)
          }`,
        ),
      );
    }
  });

const transactions = program
  .command('transactions')
  .description('Advanced transaction utilities');

transactions
  .command('sign <to> <amount>')
  .description('Sign a transfer transaction without broadcasting')
  .option(
    '-f, --from <identity>',
    'Sender identity (uses current if not specified)',
  )
  .option('--tick <number>', 'Target tick number')
  .option(
    '--tick-offset <number>',
    'Tick offset when deriving the target tick (default: 5)',
  )
  .option('-o, --output <file>', 'Write the encoded transaction to a file')
  .option('--json', 'Output signed transaction details as JSON')
  .action(
    async (
      to: string,
      amount: string,
      options: {
        from?: string;
        tick?: string;
        tickOffset?: string;
        output?: string;
        json?: boolean;
      },
    ) => {
      const qubic = getClient();
      const context = await prepareTransferContext(qubic, to, amount, options, {
        promptReason: 'Unlock seed vault to prepare transaction signing:',
        skipBalanceCheck: true,
      });

      if (!context) {
        return;
      }

      const authorized = await confirmTransactionAuthorization();
      if (!authorized) {
        console.log(chalk.gray('Signing cancelled.'));
        return;
      }

      const spinner = ora('Signing transaction...').start();
      try {
        const transfer = await buildTransferTransaction({
          seed: context.seedRecord.seed,
          destinationIdentity: context.destination,
          amount: context.amount,
          tick: context.tick,
          expectedIdentity: context.seedRecord.identity,
        });

        spinner.succeed('Transaction signed.');

        if (options.output) {
          try {
            await fs.writeFile(options.output, transfer.encoded, 'utf8');
            console.log(
              chalk.gray(`Saved encoded transaction to ${options.output}`),
            );
          } catch (error) {
            console.log(
              chalk.red(
                `Failed to write file: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              ),
            );
          }
        }

        if (options.json) {
          console.log(
            JSON.stringify(
              {
                encodedTransaction: transfer.encoded,
                from: transfer.fromIdentity,
                to: transfer.toIdentity,
                amount: transfer.amount.toString(),
                tick: transfer.tick,
              },
              null,
              2,
            ),
          );
          return;
        }

        console.log('');
        console.log(
          chalk.blue('Encoded transaction (base64):'),
          chalk.gray(transfer.encoded),
        );
        console.log(
          chalk.blue('From:'),
          chalk.white(formatIdentity(transfer.fromIdentity)),
        );
        console.log(
          chalk.blue('To:'),
          chalk.white(formatIdentity(transfer.toIdentity)),
        );
        console.log(
          chalk.blue('Amount:'),
          chalk.green(`${formatAmount(transfer.amount)} QUBIC`),
        );
        console.log(chalk.blue('Tick:'), chalk.white(String(transfer.tick)));
        console.log('');
      } catch (error) {
        spinner.fail('Failed to sign transaction');
        console.error(
          chalk.red(error instanceof Error ? error.message : 'Unknown error'),
        );
      }
    },
  );

transactions
  .command('broadcast [encoded]')
  .description('Broadcast a pre-signed transaction (base64)')
  .option('-f, --file <path>', 'Read the encoded transaction from a file')
  .action(
    async (encoded: string | undefined, options: { file?: string }) => {
      let payload = encoded ?? '';

      if (options.file) {
        try {
          payload = await fs.readFile(options.file, 'utf8');
        } catch (error) {
          console.log(
            chalk.red(
              `Failed to read file: ${
                error instanceof Error ? error.message : String(error)
              }`,
            ),
          );
          return;
        }
      }

      const trimmed = payload.trim();
      if (!trimmed) {
        console.log(
          chalk.red(
            'Encoded transaction payload is required. Provide an argument or use --file.',
          ),
        );
        return;
      }

      let raw: Uint8Array;
      try {
        raw = base64ToBytes(trimmed);
      } catch (error) {
        console.log(
          chalk.red('Encoded transaction must be a valid base64 string.'),
        );
        if (error instanceof Error) {
          console.log(chalk.gray(error.message));
        }
        return;
      }

      const spinner = ora('Broadcasting transaction...').start();
      try {
        const result = await getClient().live.broadcast(trimmed);
        spinner.succeed('Transaction broadcast successfully.');

        console.log('');
        console.log(chalk.blue('Transaction ID:'), chalk.white(result.transactionId));
        console.log(
          chalk.blue('Peers broadcasted:'),
          chalk.white(result.peersBroadcasted.toString()),
        );
        console.log(
          chalk.gray(`Transaction size: ${raw.length} bytes`),
        );
        console.log('');
      } catch (error) {
        spinner.fail('Failed to broadcast transaction');
        console.error(
          chalk.red(error instanceof Error ? error.message : 'Unknown error'),
        );
      }
    },
  );

const auth = program.command('auth').description('Manage authentication');

auth
  .command('status')
  .description('Check authentication status')
  .action(() => {
    const current = config.get('currentIdentity') as string | undefined;
    const identities = getIdentityStore();

    console.log('');
    console.log(chalk.bold('Authentication Status'));
    console.log(chalk.gray('-'.repeat(50)));

    if (!current) {
      console.log(chalk.yellow('Not authenticated'));
      console.log(chalk.gray('Use "nous auth login" to authenticate'));
    } else {
      const identity = identities[current];
      if (identity) {
        console.log(chalk.blue('Current Identity:'), chalk.white(identity.label));
        console.log(
          chalk.blue('Address:'),
          chalk.white(formatIdentity(identity.identity)),
        );
        console.log(chalk.blue('Type:'), chalk.white(identity.type));
        console.log(chalk.blue('Created:'), chalk.white(identity.created));
        console.log(
          chalk.blue('Stored encrypted:'),
          chalk.white(identity.hasSeed ? 'Yes' : 'No'),
        );
        console.log(
          chalk.blue('Loaded this session:'),
          chalk.white(isSeedLoaded(identity.identity) ? 'Yes' : 'No'),
        );
      } else {
        console.log(chalk.yellow('Identity not found'));
      }
    }
    console.log('');
  });

auth
  .command('login')
  .description('Authenticate with a Qubic identity (seed only)')
  .action(async () => {
    await handleSeedAuthentication({
      setCurrent: true,
      header: 'Seed Authentication',
      successMessage: 'Seed login successful.',
    });
  });

auth
  .command('logout')
  .description('Clear current authentication')
  .action(() => {
    const current = config.get('currentIdentity') as string | undefined;
    if (current) {
      removeSessionSeed(current);
    }
    config.delete('currentIdentity');
    console.log(chalk.green('Logged out successfully'));
  });

const account = program.command('account').description('Manage Qubic accounts');

account
  .command('list')
  .description('List all saved accounts')
  .action(() => {
    const identities = getIdentityStore();
    const current = config.get('currentIdentity') as string | undefined;

    if (Object.keys(identities).length === 0) {
      console.log(chalk.yellow('\nNo accounts found'));
      console.log(
        chalk.gray(
          'Use "nous account create" or "nous account import" to add one\n',
        ),
      );
      return;
    }

    console.log('');
    console.log(chalk.bold('Saved Accounts'));
    console.log(chalk.gray('-'.repeat(70)));
    console.log('');

    Object.values(identities).forEach((identity) => {
      const isCurrent = current === identity.identity;
      const marker = isCurrent ? chalk.green('* ') : '  ';
      console.log(`${marker}${chalk.bold(identity.label)}`);
      console.log(
        `  ${chalk.gray('Address:')} ${formatIdentity(identity.identity)}`,
      );
      console.log(`  ${chalk.gray('Type:')} ${identity.type}`);
      console.log(
        `  ${chalk.gray('Stored encrypted:')} ${identity.hasSeed ? 'Yes' : 'No'}`,
      );
      console.log(
        `  ${chalk.gray('Loaded this session:')} ${isSeedLoaded(identity.identity) ? 'Yes' : 'No'}`,
      );
      console.log('');
    });
  });

account
  .command('select')
  .description('Select an account to use')
  .action(async () => {
    const identities = getIdentityStore();

    if (Object.keys(identities).length === 0) {
      console.log(chalk.yellow('No accounts available'));
      return;
    }

    const choices = Object.values(identities).map((id) => ({
      name: `${id.label} (${formatIdentity(id.identity)})`,
      value: id.identity,
    }));

    const selection = await promptOrCancel<{ selected: string }>([
      {
        type: 'list',
        name: 'selected',
        message: 'Select an account:',
        choices,
      },
    ]);

    if (!selection) {
      console.log(chalk.gray('Selection cancelled.'));
      return;
    }

    const { selected } = selection;
    config.set('currentIdentity', selected);
    const identity = identities[selected];
    console.log(chalk.green(`Selected: ${identity?.label}`));
  });

account
  .command('create')
  .description('Create a new Qubic account with a random seed')
  .option('--label <label>', 'Account label')
  .option('--no-store', 'Do not store the seed in the encrypted vault')
  .option('--no-select', 'Do not set the new account as current')
  .action(
    async (options: {
      label?: string;
      store?: boolean;
      select?: boolean;
    }) => {
      await createSeedAccountFlow({
        label: options.label,
        store: options.store,
        select: options.select,
      });
    },
  );

account
  .command('import')
  .description('Import an existing account')
  .action(async () => {
    const typeChoice = await promptOrCancel<{ type: IdentityType }>([
      {
        type: 'list',
        name: 'type',
        message: 'Account type:',
        choices: ['seed', 'vault'],
      },
    ]);

    if (!typeChoice) {
      console.log(chalk.gray('Import cancelled.'));
      return;
    }

    const { type } = typeChoice;

    if (type === 'seed') {
      await handleSeedAuthentication({
        setCurrent: true,
        header: 'Import Seed Account',
        successMessage: 'Seed account imported.',
      });
      return;
    }

    const answers = await promptOrCancel<{ label: string; identity: string }>([
      {
        type: 'input',
        name: 'label',
        message: 'Account label:',
        validate: (input: string) =>
          input.trim().length > 0 || 'Label is required.',
        filter: (input: string) => input.trim(),
      },
      {
        type: 'input',
        name: 'identity',
        message: `Qubic identity (${IDENTITY_LENGTH} uppercase letters):`,
        filter: (input: string) => input.trim().toUpperCase(),
        validate: (input: string) => {
          const normalized = input.trim().toUpperCase();
          if (normalized.length !== IDENTITY_LENGTH) {
            return `Identity must be exactly ${IDENTITY_LENGTH} uppercase letters.`;
          }
          try {
            identityToBytes(normalized);
            return true;
          } catch (error) {
            return error instanceof Error ? error.message : 'Invalid identity.';
          }
        },
      },
    ]);

    if (!answers) {
      console.log(chalk.gray('Import cancelled.'));
      return;
    }

    const normalizedIdentity = ensureIdentity(answers.identity, 'Identity');

    const identities = getIdentityStore();
    const now = nowIso();
    identities[normalizedIdentity] = {
      label: answers.label,
      identity: normalizedIdentity,
      type,
      created: now,
      hasSeed: identities[normalizedIdentity]?.hasSeed ?? false,
    };
    saveIdentityStore(identities);
    config.set('currentIdentity', normalizedIdentity);
    console.log(chalk.green(`Imported account: ${answers.label}`));
  });

account
  .command('remove')
  .description('Remove an account')
  .action(async () => {
    const identities = getIdentityStore();

    if (Object.keys(identities).length === 0) {
      console.log(chalk.yellow('No accounts to remove'));
      return;
    }

    const choices = Object.values(identities).map((id) => ({
      name: `${id.label} (${formatIdentity(id.identity)})`,
      value: id.identity,
    }));

    const removeSelection = await promptOrCancel<{ selected: string }>([
      {
        type: 'list',
        name: 'selected',
        message: 'Select account to remove:',
        choices,
      },
    ]);

    if (!removeSelection) {
      console.log(chalk.gray('Removal cancelled.'));
      return;
    }

    const confirmRemoval = await promptOrCancel<{ confirm: boolean }>([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure you want to remove this account?',
        default: false,
      },
    ]);

    if (!confirmRemoval?.confirm) {
      console.log(chalk.gray('Cancelled'));
      return;
    }

    const { selected } = removeSelection;
    const identity = identities[selected];

    let seedRemoved = false;
    if (identity?.hasSeed) {
      seedRemoved = await removePersistedSeed(selected);
      if (seedRemoved) {
        console.log(chalk.gray('Removed encrypted seed from local vault.'));
      } else {
        console.log(
          chalk.yellow(
            'Unable to remove encrypted seed (vault locked or seed not stored).',
          ),
        );
      }
    }

    removeSessionSeed(selected);
    delete identities[selected];
    saveIdentityStore(identities);

    if (config.get('currentIdentity') === selected) {
      config.delete('currentIdentity');
    }

    const label = identity?.label ?? selected;
    console.log(chalk.green(`Removed: ${label}`));
    if (identity?.hasSeed && !seedRemoved) {
      console.log(
        chalk.gray(
          'Encrypted seed may still exist. Login with the seed vault password to remove it later.',
        ),
      );
    }
  });

const creation = program
  .command('new')
  .description('Create new Qubic resources');

creation
  .command('account')
  .description('Generate a new Qubic account with optional vault storage')
  .option('--label <label>', 'Account label')
  .option('--no-store', 'Do not store the seed in the encrypted vault')
  .option('--no-select', 'Do not set the new account as current')
  .action(
    async (options: {
      label?: string;
      store?: boolean;
      select?: boolean;
    }) => {
      await createSeedAccountFlow({
        label: options.label,
        store: options.store,
        select: options.select,
      });
    },
  );

const assets = program
  .command('assets')
  .description('Query assets (issued, owned, possessed)');

assets
  .command('issued <identity>')
  .description('List assets issued by an identity')
  .option('--json', 'Output as JSON')
  .action(async (identity: string, options: { json?: boolean }) => {
    const spinner = ora('Fetching issued assets...').start();
    try {
      const qubic = getClient();
      const { issuedAssets } = await qubic.live.getIssuedAssets(identity);
      spinner.succeed(`Found ${issuedAssets.length} issued assets`);
      if (options.json) {
        console.log(JSON.stringify(issuedAssets, null, 2));
      } else {
        console.log('');
        if (issuedAssets.length === 0) {
          console.log(chalk.gray('No issued assets.'));
        } else {
          issuedAssets.forEach((asset, index) => {
            console.log(
              chalk.blue(`${index + 1}.`),
              chalk.white(
                `${asset.data.name} (${asset.data.numberOfDecimalPlaces} dp) universe #${asset.info.universeIndex}`,
              ),
            );
          });
        }
        console.log('');
      }
    } catch (error) {
      spinner.fail('Failed to fetch issued assets');
      console.error(
        chalk.red(error instanceof Error ? error.message : 'Unknown error'),
      );
      terminate(1);
    }
  });

assets
  .command('owned <identity>')
  .description('List assets owned by an identity')
  .option('--json', 'Output as JSON')
  .action(async (identity: string, options: { json?: boolean }) => {
    const spinner = ora('Fetching owned assets...').start();
    try {
      const qubic = getClient();
      const { ownedAssets } = await qubic.live.getOwnedAssets(identity);
      spinner.succeed(`Found ${ownedAssets.length} owned assets`);
      if (options.json) {
        console.log(JSON.stringify(ownedAssets, null, 2));
      } else {
        console.log('');
        if (ownedAssets.length === 0) {
          console.log(chalk.gray('No owned assets.'));
        } else {
          ownedAssets.forEach((asset, index) => {
            const name = asset.data.issuedAsset?.name ?? 'Unknown';
            console.log(
              chalk.blue(`${index + 1}.`),
              chalk.white(`${name} x ${asset.data.numberOfUnits}`),
            );
          });
        }
        console.log('');
      }
    } catch (error) {
      spinner.fail('Failed to fetch owned assets');
      console.error(
        chalk.red(error instanceof Error ? error.message : 'Unknown error'),
      );
      terminate(1);
    }
  });

assets
  .command('possessed <identity>')
  .description('List assets possessed by an identity')
  .option('--json', 'Output as JSON')
  .action(async (identity: string, options: { json?: boolean }) => {
    const spinner = ora('Fetching possessed assets...').start();
    try {
      const qubic = getClient();
      const { possessedAssets } = await qubic.live.getPossessedAssets(identity);
      spinner.succeed(`Found ${possessedAssets.length} possessed assets`);
      if (options.json) {
        console.log(JSON.stringify(possessedAssets, null, 2));
      } else {
        console.log('');
        if (possessedAssets.length === 0) {
          console.log(chalk.gray('No possessed assets.'));
        } else {
          possessedAssets.forEach((asset, index) => {
            const name = asset.data.ownedAsset?.issuedAsset?.name ?? 'Unknown';
            console.log(
              chalk.blue(`${index + 1}.`),
              chalk.white(`${name} x ${asset.data.numberOfUnits}`),
            );
          });
        }
        console.log('');
      }
    } catch (error) {
      spinner.fail('Failed to fetch possessed assets');
      console.error(
        chalk.red(error instanceof Error ? error.message : 'Unknown error'),
      );
      terminate(1);
    }
  });

const configCmd = program
  .command('config')
  .description('Manage CLI configuration');

configCmd
  .command('show')
  .description('Show current configuration')
  .action(() => {
    const hint = config.get(PASSWORD_HINT_KEY) as string | undefined;

    console.log('');
    console.log(chalk.bold('Configuration'));
    console.log(chalk.gray('-'.repeat(50)));
    console.log(chalk.blue('Config file:'), chalk.white(config.path));
    console.log('');
    console.log(
      chalk.blue('Current Identity:'),
      chalk.white((config.get('currentIdentity') as string) || 'None'),
    );
    console.log(
      chalk.blue('RPC Endpoint:'),
      chalk.white((config.get('rpcEndpoint') as string) || 'Default'),
    );
    console.log(
      chalk.blue('Network:'),
      chalk.white((config.get('defaultNetwork') as string) || 'mainnet'),
    );
    console.log(
      chalk.blue('Stored seeds (encrypted):'),
      chalk.white(countStoredSeeds()),
    );
    if (hint) {
      console.log(chalk.blue('Password hint:'), chalk.white(hint));
    }
    console.log('');
  });

configCmd
  .command('set <key> <value>')
  .description('Set a configuration value')
  .action((key: string, value: string) => {
    const validKeys = ['rpcEndpoint', 'defaultNetwork'] as const;
    if (!(validKeys as readonly string[]).includes(key)) {
      console.log(
        chalk.red(`Invalid key. Valid keys: ${Array.from(validKeys).join(', ')}`),
      );
      return;
    }
    config.set(key, value);
    console.log(chalk.green(`Set ${key} = ${value}`));
  });

configCmd
  .command('reset')
  .description('Reset configuration to defaults')
  .action(async () => {
  const answer = await promptOrCancel<{ confirm: boolean }>([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to reset all configuration?',
      default: false,
    },
  ]);

  if (answer?.confirm) {
    config.clear();
      persistentSeedCache = null;
      Object.keys(sessionSeeds).forEach((key) => delete sessionSeeds[key]);
      console.log(chalk.green('Configuration reset'));
    } else {
      console.log(chalk.gray('Cancelled'));
    }
  });

program.addHelpText(
  'after',
  `
${chalk.bold('Examples:')}
  ${chalk.gray('# Network information')}
  ${chalk.gray('$')} nous info

  ${chalk.gray('# Check balance')}
  ${chalk.gray('$')} nous balance
  ${chalk.gray('$')} nous balance BZVMIJXDWZQJWTFVEBPCJVFZDHXICRCLUVDUPKQGIJAFLEZCMMLUQHTXEXWA

  ${chalk.gray('# View transactions')}
  ${chalk.gray('$')} nous tx --limit 5
  ${chalk.gray('$')} nous tx-hash <hash>

  ${chalk.gray('# Query assets')}
  ${chalk.gray('$')} nous assets issued <identity>
  ${chalk.gray('$')} nous assets owned <identity>
  ${chalk.gray('$')} nous assets possessed <identity>

  ${chalk.gray('# Manage accounts')}
  ${chalk.gray('$')} nous account list
  ${chalk.gray('$')} nous account import
  ${chalk.gray('$')} nous account select

  ${chalk.gray('# Scaffold a web project')}
  ${chalk.gray('$')} nous scaffold web

  ${chalk.gray('# Authenticate with seed')}
  ${chalk.gray('$')} nous auth login

  ${chalk.gray('# Send QUBIC')}
  ${chalk.gray('$')} nous send transfer <to> <amount>
  ${chalk.gray('$')} nous send from-file ./signed.txt

  ${chalk.gray('# Create a new account')}
  ${chalk.gray('$')} nous new account

${chalk.bold('Configuration:')}
  ${chalk.gray('Config file:')} ${config.path}

${chalk.bold('More information:')}
  Documentation: ${chalk.cyan('https://github.com/nous-labs/sdk')}
  Issues: ${chalk.cyan('https://github.com/nous-labs/sdk/issues')}
  Website: ${chalk.cyan('https://nous-labs.com')}
`,
);

type PackageManager = 'bun' | 'pnpm' | 'npm' | 'yarn';

const PACKAGE_MANAGER_CONFIG: Record<
  PackageManager,
  {
    install: string[];
    add: (deps: string[]) => string[];
    lint: string[];
  }
> = {
  bun: {
    install: ['install'],
    add: (deps) => ['add', ...deps],
    lint: ['run', 'lint'],
  },
  pnpm: {
    install: ['install'],
    add: (deps) => ['add', ...deps],
    lint: ['run', 'lint'],
  },
  npm: {
    install: ['install'],
    add: (deps) => ['install', ...deps, '--save'],
    lint: ['run', 'lint'],
  },
  yarn: {
    install: ['install'],
    add: (deps) => ['add', ...deps],
    lint: ['lint'],
  },
};

function resolveTemplateDir(): string {
  const candidates = [
    path.resolve(__dirname, '../templates/nextjs-web'),
    path.resolve(__dirname, '../../templates/nextjs-web'),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error('Unable to locate Next.js scaffold templates.');
}

function copyTemplateDirectory(source: string, destination: string): void {
  const entries = readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      if (!existsSync(destPath)) {
        mkdirSync(destPath, { recursive: true });
      }
      copyTemplateDirectory(srcPath, destPath);
    } else if (entry.isFile()) {
      const parentDir = path.dirname(destPath);
      if (!existsSync(parentDir)) {
        mkdirSync(parentDir, { recursive: true });
      }
      copyFileSync(srcPath, destPath);
    }
  }
}

function ensureBunAvailable(): void {
  const result = spawnSync('bun', ['--version'], {
    stdio: 'ignore',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    throw new Error(
      'Bun is required for scaffolding. Install Bun from https://bun.sh and try again.',
    );
  }
}

async function runCommand(
  command: string,
  args: string[],
  options: SpawnOptions = {},
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      ...options,
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
      }
    });
  });
}

async function handleScaffoldWebCommand(options: {
  dir?: string;
  pm?: string;
  install?: boolean;
  lint?: boolean;
  force?: boolean;
}) {
  ensureBunAvailable();

  const questions: QuestionCollection[] = [];

  if (!options.dir) {
    questions.push({
      type: 'input',
      name: 'project',
      message: 'Project directory:',
      default: 'qubic-next-app',
      validate: (input: string) =>
        input && /^[a-zA-Z0-9._-]+$/.test(input)
          ? true
          : 'Use alphanumeric characters, dots, dashes, or underscores only.',
    });
  }

  if (!options.pm) {
    questions.push({
      type: 'list',
      name: 'pm',
      message: 'Package manager:',
      default: 'bun',
      choices: [
        { name: 'bun', value: 'bun' },
        { name: 'pnpm', value: 'pnpm' },
        { name: 'npm', value: 'npm' },
        { name: 'yarn', value: 'yarn' },
      ],
    });
  }

  if (options.install === undefined) {
    questions.push({
      type: 'confirm',
      name: 'install',
      message: 'Install dependencies after scaffolding?',
      default: true,
    });
  }

  if (options.lint === undefined) {
    questions.push({
      type: 'confirm',
      name: 'lint',
      message: 'Run lint after setup?',
      default: true,
    });
  }

  const promptAnswers =
    questions.length > 0 ? await promptOrCancel<Record<string, any>>(questions) : {};

  if (questions.length > 0 && !promptAnswers) {
    console.log(chalk.gray('Scaffold cancelled.'));
    return;
  }

  const answers = (promptAnswers ?? {}) as Record<string, any>;

  const projectName = (options.dir ?? answers.project) as string;
  const packageManagerInput = (options.pm ?? answers.pm ?? 'bun') as string;
  const projectDir = path.resolve(process.cwd(), projectName);

  const installDeps = options.install ?? answers.install ?? true;
  const runLint = options.lint ?? answers.lint ?? true;

  const pmKey = packageManagerInput.toLowerCase() as PackageManager;
  const pmConfig = PACKAGE_MANAGER_CONFIG[pmKey];

  if (!pmConfig) {
    throw new Error(
      `Unsupported package manager "${packageManagerInput}". Choose bun, pnpm, npm, or yarn.`,
    );
  }

  if (existsSync(projectDir) && !options.force) {
    const overwriteAnswer = await promptOrCancel<{ overwrite: boolean }>([
      {
        type: 'confirm',
        name: 'overwrite',
        message: `Directory "${projectName}" already exists. Overwrite?`,
        default: false,
      },
    ]);

    if (!overwriteAnswer?.overwrite) {
      console.log(chalk.yellow('Aborted.'));
      return;
    }
  }

  console.log('');
  const scaffoldSpinner = ora('Scaffolding Next.js project...').start();
  try {
    await runCommand('bun', ['create', 'next-app', projectName, '--ts', '--tailwind']);
    scaffoldSpinner.succeed('Project scaffold created');
  } catch (error) {
    scaffoldSpinner.fail('Failed to scaffold project');
    throw error;
  }

  const templateDir = resolveTemplateDir();
  copyTemplateDirectory(templateDir, projectDir);

  if (installDeps) {
    const installSpinner = ora(`Installing dependencies with ${pmKey}...`).start();
    try {
      await runCommand(pmKey, pmConfig.install, { cwd: projectDir });
      installSpinner.succeed('Dependencies installed');
    } catch (error) {
      installSpinner.fail('Failed to install dependencies');
      throw error;
    }
  }

  const depsSpinner = ora('Adding Nous Labs dependencies...').start();
  try {
    await runCommand(pmKey, pmConfig.add(['@nouslabs/sdk', '@nouslabs/react', '@tanstack/react-query']), {
      cwd: projectDir,
    });
    depsSpinner.succeed('Nous Labs dependencies added');
  } catch (error) {
    depsSpinner.fail('Failed to add Nous Labs dependencies');
    throw error;
  }

  if (runLint) {
    const lintSpinner = ora('Running lint to verify setup...').start();
    try {
      await runCommand(pmKey, pmConfig.lint, { cwd: projectDir });
      lintSpinner.succeed('Lint completed successfully');
    } catch (error) {
      lintSpinner.fail('Lint failed');
      throw error;
    }
  }

  console.log('');
  console.log(chalk.green('Scaffold complete! Next steps:'));
  console.log(`  ${chalk.cyan(`cd ${projectName}`)}`);
  console.log(`  ${chalk.cyan('cp env.example .env.local')}`);
  console.log(`  ${chalk.cyan(`${pmKey} run dev`)} ${chalk.gray('# start the dev server')}`);
  console.log('');
  console.log(
    chalk.gray(
      'Replace NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in .env.local before connecting wallets.',
    ),
  );
}

const monitor = program.command('monitor').description('Network monitoring utilities');

monitor
  .command('status')
  .description('Show current tick, epoch, and computor summary')
  .option('-e, --epoch <number>', 'Epoch to inspect (defaults to current)')
  .option('--json', 'Output as JSON')
  .action(async (options: { epoch?: string; json?: boolean }) => {
    const spinner = ora('Fetching network status...').start();
    try {
      const qubic = getClient();
      const { tickInfo } = await qubic.live.getTickInfo();
      const epochNumber = options.epoch
        ? parsePositiveInteger(options.epoch, 'epoch')
        : tickInfo.epoch;

      let computorData: {
        epoch: number;
        lists: { tickNumber?: number; size: number }[];
        uniqueCount: number;
      } | null = null;

      try {
        const { computorsLists } = await qubic.query.getComputorsListForEpoch(epochNumber);
        const unique = new Set<string>();
        const listSummaries = computorsLists.map((list) => {
          list.identities.forEach((id) => unique.add(id));
          return {
            tickNumber: list.tickNumber,
            size: list.identities.length,
          };
        });
        computorData = {
          epoch: epochNumber,
          lists: listSummaries,
          uniqueCount: unique.size,
        };
      } catch (error) {
        // Best-effort: skip computor summary if the query endpoint is unavailable.
        const message = error instanceof Error ? error.message : String(error);
        spinner.warn(`Computor data unavailable: ${message}`);
        spinner.start('Fetching network status...');
      }

      spinner.succeed('Network status retrieved');

      const summary = {
        timestamp: new Date().toISOString(),
        tick: tickInfo.tick,
        epoch: tickInfo.epoch,
        tickDurationMs: tickInfo.duration,
        initialTickOfEpoch: tickInfo.initialTick,
        computors: computorData,
      };

      if (options.json) {
        console.log(JSON.stringify(summary, null, 2));
        return;
      }

      console.log('');
      console.log(chalk.bold('Network Status'));
      console.log(chalk.blue('Current Tick:'), chalk.white(tickInfo.tick));
      console.log(chalk.blue('Epoch:'), chalk.white(`${tickInfo.epoch}`));
      console.log(chalk.blue('Tick duration:'), chalk.white(`${tickInfo.duration} ms`));
      console.log(
        chalk.blue('Initial tick of epoch:'),
        chalk.white(tickInfo.initialTick ?? 'unknown'),
      );

      if (computorData) {
        console.log('');
        console.log(chalk.bold('Computors'));
        console.log(chalk.blue('Lists:'), chalk.white(computorData.lists.length));
        console.log(
          chalk.blue('Unique identities:'),
          chalk.white(computorData.uniqueCount),
        );
        const sample = computorData.lists[0];
        if (sample) {
          console.log(
            chalk.blue('Sample list size:'),
            chalk.white(sample.size.toString()),
          );
        }
      } else {
        console.log('');
        console.log(chalk.gray('Computor data unavailable (query endpoint error).'));
      }
      console.log('');
    } catch (error) {
      spinner.fail('Failed to fetch network status');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      terminate(1);
    }
  });

monitor
  .command('ticks')
  .description('Stream live tick updates')
  .option('-i, --interval <ms>', 'Polling interval in milliseconds (default: 1000)', '1000')
  .option('-c, --count <number>', 'Stop after N updates')
  .option('-d, --duration <seconds>', 'Stop after N seconds')
  .option('--json', 'Output newline-delimited JSON')
  .action(
    async (options: {
      interval?: string;
      count?: string;
      duration?: string;
      json?: boolean;
    }) => {
      const intervalMs = parsePositiveInteger(options.interval ?? '1000', 'interval');
      const maxCount = options.count
        ? parsePositiveInteger(options.count, 'count')
        : undefined;
      const maxDuration = options.duration
        ? parsePositiveInteger(options.duration, 'duration')
        : undefined;

      const qubic = getClient();
      const spinner = ora('Fetching tick info...').start();

      const startTime = Date.now();
      let iteration = 0;
      let lastTick: number | undefined;
      let running = false;
      let timer: NodeJS.Timeout | undefined;

      if (!options.json) {
        console.log('');
        console.log(chalk.bold('Tick monitor (press Ctrl+C to exit)'));
      }

      const handleError = (error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        if (spinner.isSpinning) {
          spinner.fail('Failed to fetch tick info');
          console.error(chalk.red(message));
          terminate(1);
        } else {
          console.error(chalk.red(`Tick fetch error: ${message}`));
        }
      };

      const fetchTick = async () => {
        if (running) return;
        running = true;
        try {
          const { tickInfo } = await qubic.live.getTickInfo();
          if (spinner.isSpinning) {
            spinner.stop();
          }
          iteration += 1;
          if (options.json) {
            console.log(
              JSON.stringify({
                timestamp: new Date().toISOString(),
                ...tickInfo,
              }),
            );
          } else {
            const delta =
              lastTick !== undefined && Number.isFinite(lastTick)
                ? tickInfo.tick - lastTick
                : 0;
            const deltaLabel =
              delta === 0
                ? chalk.gray('+0')
                : delta > 0
                  ? chalk.green(`+${delta}`)
                  : chalk.red(`${delta}`);
            console.log(
              `${chalk.cyan(`#${tickInfo.tick}`)} ${chalk.gray(
                `(epoch ${tickInfo.epoch})`,
              )}  duration ${chalk.yellow(`${tickInfo.duration}ms`)}  delta ${deltaLabel}  ${chalk.gray(
                new Date().toLocaleTimeString(),
              )}`,
            );
          }
          lastTick = tickInfo.tick;
        } catch (error) {
          handleError(error);
        } finally {
          running = false;
          const elapsed = Date.now() - startTime;
          const stopByCount = maxCount ? iteration >= maxCount : false;
          const stopByDuration = maxDuration ? elapsed >= maxDuration * 1000 : false;
          if (stopByCount || stopByDuration) {
            if (timer) {
              clearInterval(timer);
            }
            if (!options.json) {
              console.log(chalk.gray('Tick monitor finished.'));
            }
            terminate(0);
          }
        }
      };

      await fetchTick();

      if (maxCount && iteration >= maxCount) {
        if (!options.json) {
          console.log(chalk.gray('Tick monitor finished.'));
        }
        return;
      }

      timer = setInterval(fetchTick, intervalMs);

      process.on('SIGINT', () => {
        if (timer) clearInterval(timer);
        if (!options.json) {
          console.log('\n' + chalk.gray('Tick monitor stopped.'));
        }
        terminate(0);
      });
    },
  );

type ContractDisplay = {
  primary: string;
  aliases: string[];
};

const CONTRACT_ADDRESS_MAP: Map<string, ContractDisplay> = (() => {
  const map = new Map<string, ContractDisplay>();
  const prefer = (current: string, candidate: string): boolean => {
    const isAlias = (value: string) => value.length <= 4 || /^[A-Z]{1,4}$/.test(value);
    if (!current) return true;
    if (isAlias(current) && !isAlias(candidate)) return true;
    if (!isAlias(current) && isAlias(candidate)) return false;
    if (candidate.length > current.length) return true;
    return candidate.localeCompare(current) < 0;
  };
  Object.entries(QUBIC_CONTRACT_ADDRESSES).forEach(([name, address]) => {
    const existing = map.get(address);
    if (!existing) {
      map.set(address, { primary: name, aliases: [] });
      return;
    }
    if (prefer(existing.primary, name)) {
      existing.aliases.push(existing.primary);
      existing.primary = name;
    } else {
      existing.aliases.push(name);
    }
  });
  return map;
})();

type Palette = {
  heading: (value: string) => string;
  value: (value: string) => string;
  success: (value: string) => string;
  warn: (value: string) => string;
  error: (value: string) => string;
  muted: (value: string) => string;
  bold: (value: string) => string;
};

function createPalette(enabled: boolean): Palette {
  const wrap = (fn: (value: string) => string) => (value: string) =>
    enabled ? fn(value) : value;
  return {
    heading: wrap(chalk.cyan),
    value: wrap(chalk.white),
    success: wrap(chalk.green),
    warn: wrap(chalk.yellow),
    error: wrap(chalk.red),
    muted: wrap(chalk.gray),
    bold: wrap(chalk.bold),
  };
}

function colorMs(ms: number | null, useColor: boolean = true): string {
  const wrap = (value: string, fn: (input: string) => string) =>
    useColor ? fn(value) : value;
  if (ms == null) return wrap('n/a', chalk.gray);
  if (ms < 150) return wrap(`${ms} ms`, chalk.green);
  if (ms < 500) return wrap(`${ms} ms`, chalk.yellow);
  return wrap(`${ms} ms`, chalk.red);
}

function safeFormatAmount(value: bigint | number | string): string {
  try {
    return formatAmount(value);
  } catch {
    return String(value);
  }
}

function formatTxTime(timestamp?: string): string {
  if (!timestamp) return 'n/a';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return date.toLocaleTimeString();
}

function formatContractName(address: string): string {
  const entry = CONTRACT_ADDRESS_MAP.get(address);
  if (!entry) return formatIdentity(address);
  return entry.primary;
}

function visibleLength(text: string): number {
  return text.replace(/\u001b\[[0-9;]*m/g, '').length;
}

function renderCard(
  title: string,
  bodyLines: string[],
  colors: Palette,
  enableAnsi: boolean,
): string {
  const lines = bodyLines.length > 0 ? bodyLines : [colors.muted('No data yet')];
  const plainTitle = title.toUpperCase();
  const maxBody = lines.reduce((acc, line) => Math.max(acc, visibleLength(line)), 0);
  const width = Math.min(72, Math.max(32, visibleLength(plainTitle) + 4, maxBody + 4));
  const border = enableAnsi
    ? { tl: '┏', tr: '┓', bl: '┗', br: '┛', h: '━', v: '┃' }
    : { tl: '+', tr: '+', bl: '+', br: '+', h: '-', v: '|' };
  const contentWidth = width - 2;
  const cardLines: string[] = [];
  cardLines.push(`${border.tl}${border.h.repeat(contentWidth)}${border.tr}`);
  const titlePadding = Math.max(0, contentWidth - 1 - visibleLength(plainTitle));
  cardLines.push(
    `${border.v} ${colors.bold(plainTitle)}${' '.repeat(titlePadding)}${border.v}`,
  );
  lines.forEach((text) => {
    const content = text || ' ';
    const visible = visibleLength(content);
    const padding = Math.max(0, contentWidth - 1 - visible);
    cardLines.push(`${border.v} ${content}${' '.repeat(padding)}${border.v}`);
  });
  cardLines.push(`${border.bl}${border.h.repeat(contentWidth)}${border.br}`);
  return cardLines.join('\n');
}

function buildKeyValueLines(
  rows: Array<[string, string]>,
  colors: Palette,
  labelLimit: number = 18,
): string[] {
  if (rows.length === 0) return [];
  const labelWidth = Math.min(
    labelLimit,
    rows.reduce((acc, [label]) => Math.max(acc, label.length), 0),
  );
  return rows.map(([label, value]) => {
    const padded = label.padEnd(labelWidth);
    return `${colors.bold(padded)} ${value}`;
  });
}

function pushHistory(
  queue: number[],
  value: number | bigint | null | undefined,
  limit: number,
): void {
  let numeric: number;
  if (typeof value === 'bigint') {
    numeric = Number(value);
  } else if (typeof value === 'number') {
    numeric = Number.isFinite(value) ? value : Number.NaN;
  } else {
    numeric = Number.NaN;
  }
  if (Number.isNaN(numeric)) {
    const fallback = queue.length > 0 ? queue[queue.length - 1]! : 0;
    numeric = Number.isFinite(fallback) ? fallback : 0;
  }
  queue.push(numeric);
  if (queue.length > limit) {
    queue.shift();
  }
}

function scaleSeriesForDisplay(series: number[]): {
  data: number[];
  suffix: string;
} {
  const max = series.reduce((acc, value) => Math.max(acc, Math.abs(value)), 0);
  if (max >= 1_000_000_000) {
    return { data: series.map((value) => value / 1_000_000_000), suffix: 'B' };
  }
  if (max >= 1_000_000) {
    return { data: series.map((value) => value / 1_000_000), suffix: 'M' };
  }
  if (max >= 1_000) {
    return { data: series.map((value) => value / 1_000), suffix: 'k' };
  }
  return { data: [...series], suffix: '' };
}

function tryParseAmount(value: string | number | bigint | undefined | null): bigint | null {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    return BigInt(Math.trunc(value));
  }
  if (typeof value === 'string') {
    try {
      return BigInt(value);
    } catch {
      return null;
    }
  }
  return null;
}

monitor
  .command('dashboard')
  .description('Live dashboard with network stats and endpoint health')
  .option('-i, --interval <ms>', 'Refresh interval (ms)', '1000')
  .option('--no-ansi', 'Disable ANSI colors')
  .option('--identity', 'Show current identity balance if selected')
  .option('-H, --history <count>', 'Number of samples to retain for trend graphs', '24')
  .action(
    async (options: {
      interval?: string;
      ansi?: boolean;
      identity?: boolean;
      history?: string;
    }) => {
      let interval = parsePositiveInteger(options.interval ?? '1000', 'interval');
      const enableAnsi = options.ansi !== false;
      const colors = createPalette(enableAnsi);
      const historySize = parsePositiveInteger(options.history ?? '24', 'history');
      const qubic = getClient();

      const MIN_SAFE_INTERVAL = 200;
      if (interval < MIN_SAFE_INTERVAL) {
        console.log(
          colors.warn(
            `Interval raised to ${MIN_SAFE_INTERVAL} ms to stay below the 100 req/s rate limit.`,
          ),
        );
        interval = MIN_SAFE_INTERVAL;
      }

      let running = true;
      const onSig = () => {
        running = false;
      };
      process.on('SIGINT', onSig);
      process.on('SIGTERM', onSig);

      const state: {
        tick: number | null;
        epoch: number | null;
        duration: number | null;
        rpcLatency: number | null;
        queryLatency: number | null;
        archiveTick: number | null;
        archiveLag: number | null;
        computorLists: number | null;
        uniqueComputors: number | null;
        balance: {
          identity: string;
          amount: string | number | bigint;
          validForTick: number;
        } | null;
        lastTransactionsTick: number | null;
        lastTransactions: Transaction[];
        totalVolume: bigint | null;
        sampleError: string | null;
      } = {
        tick: null,
        epoch: null,
        duration: null,
        rpcLatency: null,
        queryLatency: null,
        archiveTick: null,
        archiveLag: null,
        computorLists: null,
        uniqueComputors: null,
        balance: null,
        lastTransactionsTick: null,
        lastTransactions: [],
        totalVolume: null,
        sampleError: null,
      };

      const history = {
        rpcLatency: [] as number[],
        queryLatency: [] as number[],
        archiveLag: [] as number[],
        tickDuration: [] as number[],
        txVolume: [] as number[],
        txCount: [] as number[],
      };

      const loadTransactionsForTick = async (tickNumber: number) => {
        try {
          return await qubic.query.getTransactionsForTick(tickNumber);
        } catch {
          return null;
        }
      };

      async function sampleOnce() {
        state.sampleError = null;
        let tickNumber: number | null = null;

        try {
          const start = Date.now();
          const { tickInfo } = await qubic.live.getTickInfo();
          state.rpcLatency = Date.now() - start;
          state.tick = tickInfo.tick;
          state.epoch = tickInfo.epoch;
          state.duration = tickInfo.duration;
          tickNumber = tickInfo.tick;
        } catch (error) {
          state.rpcLatency = null;
          state.tick = null;
          state.epoch = null;
          state.duration = null;
          state.sampleError =
            state.sampleError ??
            (error instanceof Error ? error.message : String(error));
        }

        if (tickNumber != null) {
          try {
            const start = Date.now();
            const lastProcessed = await qubic.query.getLastProcessedTick();
            state.queryLatency = Date.now() - start;
            state.archiveTick = lastProcessed.tickNumber;
            state.archiveLag =
              lastProcessed.tickNumber != null
                ? tickNumber - lastProcessed.tickNumber
                : null;
          } catch (error) {
            state.queryLatency = null;
            state.archiveTick = null;
            state.archiveLag = null;
            state.sampleError =
              state.sampleError ??
              (error instanceof Error ? error.message : String(error));
          }

          try {
            if (state.epoch != null) {
              const { computorsLists } = await qubic.query.getComputorsListForEpoch(
                state.epoch,
              );
              const unique = new Set<string>();
              computorsLists.forEach((list) =>
                list.identities.forEach((id) => unique.add(id)),
              );
              state.computorLists = computorsLists.length;
              state.uniqueComputors = unique.size;
            }
          } catch (error) {
            state.computorLists = null;
            state.uniqueComputors = null;
            state.sampleError =
              state.sampleError ??
              (error instanceof Error ? error.message : String(error));
          }

          try {
            let txTick = tickNumber;
            let transactions = await loadTransactionsForTick(txTick);
            if ((!transactions || transactions.length === 0) && txTick > 0) {
              const fallback = await loadTransactionsForTick(txTick - 1);
              if (fallback && fallback.length > 0) {
                txTick -= 1;
                transactions = fallback;
              }
            }
            if (transactions) {
              state.lastTransactionsTick = txTick;
              state.lastTransactions = transactions;
              let total = 0n;
              transactions.forEach((tx) => {
                try {
                  total += BigInt(tx.amount ?? '0');
                } catch {
                  // ignore malformed amounts
                }
              });
              state.totalVolume = transactions.length > 0 ? total : null;
            } else {
              state.lastTransactionsTick = null;
              state.lastTransactions = [];
              state.totalVolume = null;
            }
          } catch (error) {
            state.lastTransactionsTick = null;
            state.lastTransactions = [];
            state.totalVolume = null;
            state.sampleError =
              state.sampleError ??
              (error instanceof Error ? error.message : String(error));
          }
        } else {
          state.archiveTick = null;
          state.archiveLag = null;
          state.computorLists = null;
          state.uniqueComputors = null;
          state.lastTransactionsTick = null;
          state.lastTransactions = [];
          state.totalVolume = null;
        }

        if (options.identity) {
          const current = getCurrentIdentity();
          if (current) {
            try {
              const { balance } = await qubic.live.getBalance(current);
              state.balance = {
                identity: current,
                amount: balance.balance,
                validForTick: balance.validForTick,
              };
            } catch (error) {
              state.balance = null;
              state.sampleError =
                state.sampleError ??
                (error instanceof Error ? error.message : String(error));
            }
          } else {
            state.balance = null;
          }
        } else {
          state.balance = null;
        }
      }

      while (running) {
        await sampleOnce();

        pushHistory(history.rpcLatency, state.rpcLatency, historySize);
        pushHistory(history.queryLatency, state.queryLatency, historySize);
        pushHistory(history.archiveLag, state.archiveLag, historySize);
        pushHistory(history.tickDuration, state.duration, historySize);
        pushHistory(history.txVolume, state.totalVolume, historySize);
        pushHistory(history.txCount, state.lastTransactions.length, historySize);

        const senderStats = new Map<string, { count: number; volume: bigint }>();
        const receiverStats = new Map<string, { count: number; volume: bigint }>();
        const contractStats = new Map<string, { name: string; address: string; count: number; volume: bigint }>();

        const recordStat = (
          map: Map<string, { count: number; volume: bigint }>,
          identity: string,
          amount: bigint | null,
        ) => {
          const entry = map.get(identity) ?? { count: 0, volume: 0n };
          entry.count += 1;
          if (amount != null) entry.volume += amount;
          map.set(identity, entry);
        };

        const recordContract = (address: string, amount: bigint | null) => {
          const entry =
            contractStats.get(address) ?? {
              name: formatContractName(address),
              address,
              count: 0,
              volume: 0n,
            };
          entry.count += 1;
          if (amount != null) entry.volume += amount;
          contractStats.set(address, entry);
        };

        if (state.lastTransactionsTick != null) {
          state.lastTransactions.forEach((tx) => {
            const from = tx.sourceId || tx.source;
            const to = tx.destId || tx.destination;
            const parsedAmount = tryParseAmount(tx.amount);
            if (from) recordStat(senderStats, from, parsedAmount);
            if (to) recordStat(receiverStats, to, parsedAmount);
            if (to && CONTRACT_ADDRESS_MAP.has(to)) recordContract(to, parsedAmount);
          });
        }

        const sortStats = (
          map: Map<string, { count: number; volume: bigint }>,
        ): Array<{ identity: string; count: number; volume: bigint }> =>
          Array.from(map.entries())
            .map(([identity, stats]) => ({ identity, ...stats }))
            .sort((a, b) => {
              if (a.volume === b.volume) return b.count - a.count;
              return b.volume > a.volume ? 1 : -1;
            })
            .slice(0, 2);

        const topSenders = sortStats(senderStats);
        const topReceivers = sortStats(receiverStats);
        const topContracts = Array.from(contractStats.values())
          .sort((a, b) => {
            if (a.volume === b.volume) return b.count - a.count;
            return b.volume > a.volume ? 1 : -1;
          })
          .slice(0, 3);

        const latencyConfig: any = { height: 3 };
        if (enableAnsi) latencyConfig.colors = [asciichart.blue, asciichart.green];
        const latencyChart =
          history.rpcLatency.length > 1 || history.queryLatency.length > 1
            ? asciichart.plot([
                [...history.rpcLatency],
                [...history.queryLatency],
              ], latencyConfig)
            : null;

        const volumeConfig: any = { height: 3 };
        if (enableAnsi) volumeConfig.colors = [asciichart.magenta];
        const volumeChart = history.txVolume.length > 1 ? (() => {
          const { data, suffix } = scaleSeriesForDisplay(history.txVolume);
          const label = suffix ? `Volume trend (${suffix})` : 'Volume trend';
          return { label, graph: asciichart.plot(data, volumeConfig) };
        })() : null;

        const networkRows: Array<[string, string]> = [
          ['Tick', state.tick != null ? colors.value(String(state.tick)) : colors.muted('n/a')],
          ['Epoch', state.epoch != null ? colors.value(String(state.epoch)) : colors.muted('n/a')],
        ];
        if (state.duration != null && state.duration > 0) {
          const tps = (1000 / state.duration).toFixed(2);
          networkRows.push([
            'Tick duration',
            `${colors.value(`${state.duration} ms`)} ${colors.muted(`(${tps} tps)`)}`,
          ]);
        } else if (state.duration != null) {
          networkRows.push(['Tick duration', colors.value(`${state.duration} ms`)]);
        } else {
          networkRows.push(['Tick duration', colors.muted('unknown')]);
        }
        if (state.archiveTick != null) {
          const lag = state.archiveLag ?? 0;
          const lagColor = lag <= 1 ? colors.success : lag <= 5 ? colors.warn : colors.error;
          networkRows.push([
            'Archive',
            `${colors.value(String(state.archiveTick))} ${colors.muted('lag')} ${lagColor(
              String(lag),
            )}`,
          ]);
        } else {
          networkRows.push(['Archive', colors.muted('offline')]);
        }
        if (state.computorLists != null && state.uniqueComputors != null) {
          networkRows.push([
            'Computors',
            colors.value(
              `${state.computorLists} lists / ${state.uniqueComputors} unique`,
            ),
          ]);
        }
        const cards: string[] = [];
        cards.push(renderCard('Network', buildKeyValueLines(networkRows, colors), colors, enableAnsi));

        const opsRows: Array<[string, string]> = [
          ['RPC latency', colorMs(state.rpcLatency, enableAnsi)],
          ['Query latency', colorMs(state.queryLatency, enableAnsi)],
        ];
        const opsLines = buildKeyValueLines(opsRows, colors);
        if (state.balance) {
          opsLines.push('');
          opsLines.push(
            `${colors.success('Identity')} ${colors.value(
              formatIdentity(state.balance.identity),
            )}`,
          );
          opsLines.push(
            colors.muted(
              `${safeFormatAmount(state.balance.amount)} Q / tick ${state.balance.validForTick}`,
            ),
          );
        }
        if (latencyChart) {
          opsLines.push('');
          opsLines.push(colors.muted('Latency trend (ms)'));
          latencyChart.split('\n').forEach((line: string) => opsLines.push(line));
        }
        cards.push(renderCard('Operations', opsLines, colors, enableAnsi));

        const latestRows: Array<[string, string]> = [];
        if (state.lastTransactionsTick != null) {
          latestRows.push(['Tick', colors.value(String(state.lastTransactionsTick))]);
          latestRows.push([
            'Transactions',
            colors.value(String(state.lastTransactions.length)),
          ]);
          latestRows.push([
            'Volume',
            state.totalVolume != null
              ? colors.value(`${safeFormatAmount(state.totalVolume)} QUBIC`)
              : colors.muted('n/a'),
          ]);
        } else {
          latestRows.push(['Status', colors.muted('Awaiting transactions...')]);
        }
        const latestLines = buildKeyValueLines(latestRows, colors);
        if (topSenders.length > 0) {
          const entry = topSenders[0]!;
          latestLines.push(
            `${colors.success('Top sender')} ${colors.value(
              formatIdentity(entry.identity),
            )} ${colors.muted(`${safeFormatAmount(entry.volume)} / ${entry.count} tx`)}`,
          );
        }
        if (topReceivers.length > 0) {
          const entry = topReceivers[0]!;
          latestLines.push(
            `${colors.warn('Top receiver')} ${colors.value(
              formatIdentity(entry.identity),
            )} ${colors.muted(`${safeFormatAmount(entry.volume)} / ${entry.count} tx`)}`,
          );
        }
        if (topContracts.length > 0) {
          const entry = topContracts[0]!;
          latestLines.push(
            `${colors.heading('Hot contract')} ${colors.value(entry.name)} ${colors.muted(
              `${safeFormatAmount(entry.volume)} / ${entry.count} calls`,
            )}`,
          );
        }
        if (volumeChart) {
          latestLines.push('');
          latestLines.push(colors.muted(volumeChart.label));
          volumeChart.graph.split('\n').forEach((line: string) => latestLines.push(line));
        }
        cards.push(renderCard('Latest Tick', latestLines, colors, enableAnsi));

        const recentTransfers = state.lastTransactions.slice(0, 4);
        const transferLines: string[] = [];
        if (recentTransfers.length === 0) {
          transferLines.push(colors.muted('No transfers captured in the latest window.'));
        } else {
          recentTransfers.forEach((tx, idx) => {
            const from = formatIdentity(tx.sourceId || tx.source || 'unknown');
            const to = formatIdentity(tx.destId || tx.destination || 'unknown');
            const amount = safeFormatAmount(tx.amount ?? '0');
            const when = formatTxTime(tx.timestamp);
            transferLines.push(
              `${colors.value(String(idx + 1).padStart(2, '0'))} ${from} ${colors.muted(
                '->',
              )} ${to} ${colors.value(amount)} ${colors.muted(`@ ${when}`)}`,
            );
          });
          if (state.lastTransactions.length > recentTransfers.length) {
            transferLines.push(
              colors.muted(
                `+${state.lastTransactions.length - recentTransfers.length} additional transfer(s)`,
              ),
            );
          }
        }
        cards.push(renderCard('Recent Transfers', transferLines, colors, enableAnsi));

        console.clear();
        if (enableAnsi) {
          console.log(
            colors.heading('┌───────────────────── NOUS :: QUANTUM HUD ─────────────────────┐'),
          );
          console.log(
            colors.heading(
              `│ ${colors.bold('MISSION')} // Network Telemetry             ${colors.muted(
                new Date().toLocaleTimeString(),
              )} │`,
            ),
          );
          console.log(
            colors.heading('└───────────────────────────────────────────────────────────────┘'),
          );
        } else {
          console.log(colors.bold('NOUS // Network Telemetry'));
          console.log(colors.muted(`Updated ${new Date().toLocaleTimeString()}`));
        }
        console.log('');
        console.log(cards.join('\n\n'));
        console.log('');
        if (state.sampleError) {
          console.log(colors.warn(`Note: ${state.sampleError}`));
          console.log('');
        }
        console.log(
          colors.muted(`Refresh interval: ${interval} ms - Press Ctrl+C to exit`),
        );

        if (!running) {
          break;
        }
        await sleep(interval);
      }

      process.off('SIGINT', onSig);
      process.off('SIGTERM', onSig);
    },
  );

monitor
  .command('latency')
  .description('Measure RPC and Query API latencies')
  .option('-n, --count <number>', 'Number of samples', '5')
  .option('-i, --interval <ms>', 'Delay between samples (ms)', '200')
  .option('--json', 'Output JSON summary')
  .action(
    async (options: { count?: string; interval?: string; json?: boolean }) => {
      const samples = parsePositiveInteger(options.count ?? '5', 'count');
      const delay = parsePositiveInteger(options.interval ?? '200', 'interval');
      const qubic = getClient();
      const rpc: number[] = [];
      const qry: number[] = [];

      for (let i = 0; i < samples; i += 1) {
        const t0 = Date.now();
        try {
          await qubic.live.getTickInfo();
          rpc.push(Date.now() - t0);
        } catch {
          rpc.push(NaN);
        }

        const t1 = Date.now();
        try {
          await qubic.query.getLastProcessedTick();
          qry.push(Date.now() - t1);
        } catch {
          qry.push(NaN);
        }

        if (i < samples - 1) await sleep(delay);
      }

      function stats(arr: number[]) {
        const ok = arr.filter((x) => Number.isFinite(x));
        const min = ok.length ? Math.min(...ok) : null;
        const max = ok.length ? Math.max(...ok) : null;
        const avg = ok.length ? Math.round(ok.reduce((a, b) => a + b, 0) / ok.length) : null;
        return { min, max, avg, samples: arr.length, errors: arr.length - ok.length };
      }

      const summary = { rpc: stats(rpc), query: stats(qry) };

      if (options.json) {
        console.log(JSON.stringify(summary, null, 2));
        return;
      }

      console.log('');
      console.log(chalk.bold('Endpoint Latency'));
      console.log('');
      console.log(
        `RPC   -> avg ${colorMs(summary.rpc.avg)}  min ${colorMs(summary.rpc.min)}  max ${colorMs(summary.rpc.max)}  (${summary.rpc.samples} samples, ${summary.rpc.errors} errors)`,
      );
      console.log(
        `Query -> avg ${colorMs(summary.query.avg)}  min ${colorMs(summary.query.min)}  max ${colorMs(summary.query.max)}  (${summary.query.samples} samples, ${summary.query.errors} errors)`,
      );
      console.log('');
    },
  );

monitor
  .command('computors')
  .description('Inspect computor lists for an epoch')
  .option('-e, --epoch <number>', 'Epoch to inspect (defaults to current)')
  .option('--list <index>', 'Display only a specific list (1-based)')
  .option('-l, --limit <number>', 'Limit identities printed per list (default: 10)', '10')
  .option('--json', 'Output raw JSON')
  .action(
    async (options: {
      epoch?: string;
      list?: string;
      limit?: string;
      json?: boolean;
    }) => {
      const spinner = ora('Fetching computor lists...').start();
      try {
        const qubic = getClient();
        const { tickInfo } = await qubic.live.getTickInfo();
        const epochNumber = options.epoch
          ? parsePositiveInteger(options.epoch, 'epoch')
          : tickInfo.epoch;

        const limit = options.limit
          ? parsePositiveInteger(options.limit, 'limit')
          : 10;

        const listIndex = options.list
          ? parsePositiveInteger(options.list, 'list')
          : undefined;

        const { computorsLists } = await qubic.query.getComputorsListForEpoch(
          epochNumber,
        );

        spinner.succeed(`Fetched computor lists for epoch ${epochNumber}`);

        const unique = new Set<string>();
        computorsLists.forEach((list) =>
          list.identities.forEach((id) => unique.add(id)),
        );

        if (options.json) {
          console.log(
            JSON.stringify(
              {
                epoch: epochNumber,
                computorsLists,
                uniqueIdentities: Array.from(unique.values()),
              },
              null,
              2,
            ),
          );
          return;
        }

        if (computorsLists.length === 0) {
          console.log('');
          console.log(chalk.gray('No computor lists were returned by the API.'));
          return;
        }

        const selectedLists =
          listIndex !== undefined
            ? computorsLists.filter((_, idx) => idx === listIndex - 1)
            : computorsLists;

        if (listIndex !== undefined && selectedLists.length === 0) {
          console.log('');
          console.log(
            chalk.red(
              `List ${listIndex} does not exist (returned ${computorsLists.length} lists).`,
            ),
          );
          terminate(1);
        }

        console.log('');
        console.log(
          chalk.bold(
            `Epoch ${epochNumber} contains ${computorsLists.length} computor list(s) (${unique.size} unique identities).`,
          ),
        );
        console.log('');

        selectedLists.forEach((list, idx) => {
          const label = listIndex !== undefined ? listIndex : idx + 1;
          console.log(chalk.blue(`List ${label}`));
          if (typeof list.tickNumber === 'number') {
            console.log(chalk.gray(`  Tick: ${list.tickNumber}`));
          }
          console.log(chalk.gray(`  Total computors: ${list.identities.length}`));
          const sample = list.identities.slice(0, limit);
          sample.forEach((identity, i) => {
            console.log(
              `  ${String(i + 1).padStart(2, '0')}. ${formatIdentity(identity)}`,
            );
          });
          if (list.identities.length > limit) {
            console.log(
              chalk.gray(
                `  ... ${list.identities.length - limit} additional identities`,
              ),
            );
          }
          console.log('');
        });
      } catch (error) {
        spinner.fail('Failed to fetch computor lists');
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        terminate(1);
      }
    },
  );

const scaffold = program.command('scaffold').description('Project scaffolding utilities');

scaffold
  .command('web')
  .description('Generate a Next.js app preconfigured for Qubic web development')
  .option('-d, --dir <directory>', 'Target directory name')
  .option('--pm <manager>', 'Package manager (bun, pnpm, npm, yarn)')
  .option('--no-install', 'Skip dependency installation')
  .option('--no-lint', 'Skip lint after setup')
  .option('-f, --force', 'Overwrite the target directory if it exists')
  .action(async (options: { dir?: string; pm?: string; install?: boolean; lint?: boolean; force?: boolean }) => {
    try {
      await handleScaffoldWebCommand(options);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(message));
      terminate(1);
    }
  });

return program;
}

async function invokeProgram(argv: string[]): Promise<void> {
  const program = registerCommands(new Command());
  program.exitOverride((err) => {
    throw err;
  });
  await program.parseAsync(argv);
}

async function runInteractiveShell(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    historySize: 100,
  });

  console.log(chalk.bold('Nous Labs CLI • Interactive Mode'));
  console.log(chalk.gray('Type a command, or "exit" to leave. Use "help" for the command list.'));
  console.log(
    chalk.gray(
      'Quick refs: info | balance | send transfer <to> <amount> | monitor dashboard | account list',
    ),
  );

  let closing = false;
  let activeResolver: ((value: string) => void) | null = null;

  const ask = () =>
    new Promise<string>((resolve) => {
      activeResolver = resolve;
      rl.question(chalk.cyan('nous> '), (answer) => {
        activeResolver = null;
        resolve(answer);
      });
    });

  rl.on('SIGINT', () => {
    if (activeResolver) {
      process.stdout.write('\n');
      const resolver = activeResolver;
      closing = true;
      activeResolver = null;
      resolver('__EXIT__');
    } else {
      closing = true;
      rl.close();
    }
  });

  rl.on('close', () => {
    closing = true;
  });

  while (!closing) {
    const line = await ask();
    if (closing) break;

    const input = line.trim();
    if (closing || input === '__EXIT__') {
      break;
    }
    if (!input) {
      continue;
    }

    if (['exit', 'quit', 'q'].includes(input.toLowerCase())) {
      break;
    }

    try {
      const args = parseArgv(input);
      const argv = ['node', 'nous', ...args];
      await invokeProgram(argv);
    } catch (error) {
      if (error instanceof CliExit) {
        if (error.code !== 0) {
          console.log(chalk.red(`Command exited with code ${error.code}`));
        }
      } else if (error instanceof CommanderError) {
        if (error.code !== 'commander.helpDisplayed') {
          console.log(chalk.red(error.message));
          console.log(chalk.gray('Hint: add --help for usage details.'));
        }
      } else if (error instanceof Error) {
        console.log(chalk.red(error.message));
      } else {
        console.log(chalk.red(String(error)));
      }
    }
  }

  rl.close();
}

async function main(): Promise<void> {
  try {
    if (process.argv.length > 2) {
      await invokeProgram(process.argv);
    } else {
      await runInteractiveShell();
    }
  } catch (error) {
    if (error instanceof CliExit) {
      process.exit(error.code);
    }
    if (error instanceof CommanderError) {
      console.error(chalk.red(error.message));
      process.exit(error.exitCode ?? 1);
    }
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
