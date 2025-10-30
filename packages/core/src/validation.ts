// Zod validation schemas for Qubic contract types and API requests
// Provides runtime validation and type inference

import { z } from "zod";

// ===== Basic Qubic Types =====

/**
 * Qubic identity validation (60 uppercase A-Z characters)
 */
export const QubicIdentitySchema = z
  .string()
  .length(60)
  .regex(/^[A-Z]+$/, "Identity must contain only uppercase letters A-Z")
  .describe("Qubic identity address");

/**
 * Qubic identity or empty (for optional identities)
 */
export const QubicIdentityOrEmptySchema = z
  .string()
  .max(60)
  .regex(/^[A-Z]*$/, "Identity must contain only uppercase letters A-Z or be empty")
  .describe("Optional Qubic identity address");

/**
 * Asset schema validation
 */
export const AssetSchema = z.object({
  issuer: QubicIdentitySchema,
  name: z
    .string()
    .max(8)
    .describe("Asset name (max 8 characters)"),
  numberOfDecimalPlaces: z
    .number()
    .int()
    .min(0)
    .max(255)
    .describe("Number of decimal places (uint8)"),
  unitOfMeasurement: z
    .array(z.number().int().min(0).max(255))
    .length(7)
    .describe("Unit of measurement (7 uint8 values)"),
});

/**
 * Positive uint8 (0-255)
 */
export const Uint8Schema = z.number().int().min(0).max(255);

/**
 * Signed int8 (-128 to 127)
 */
export const Sint8Schema = z.number().int().min(-128).max(127);

/**
 * Positive uint16 (0-65535)
 */
export const Uint16Schema = z.number().int().min(0).max(65535);

/**
 * Signed int16 (-32768 to 32767)
 */
export const Sint16Schema = z.number().int().min(-32768).max(32767);

/**
 * Positive uint32 (0 to 2^32-1)
 */
export const Uint32Schema = z.number().int().min(0).max(4294967295);

/**
 * Signed int32 (-2^31 to 2^31-1)
 */
export const Sint32Schema = z.number().int().min(-2147483648).max(2147483647);

/**
 * Positive uint64 as bigint
 */
export const Uint64Schema = z.bigint().min(0n);

/**
 * Signed int64 as bigint
 */
export const Sint64Schema = z.bigint();

/**
 * Non-negative amount (for QUBIC transfers)
 */
export const AmountSchema = Uint64Schema.describe("Amount in QUBIC (qu)");

/**
 * Tick number validation
 */
export const TickNumberSchema = z
  .number()
  .int()
  .positive()
  .describe("Tick number");

/**
 * Epoch number validation
 */
export const EpochNumberSchema = z
  .number()
  .int()
  .nonnegative()
  .describe("Epoch number");

/**
 * Contract index validation (1-17+)
 */
export const ContractIndexSchema = z
  .number()
  .int()
  .min(1)
  .max(255)
  .describe("Smart contract index");

/**
 * Input type validation
 */
export const InputTypeSchema = z
  .number()
  .int()
  .min(0)
  .max(255)
  .describe("Contract input type");

// ===== QUtil Contract Schemas =====

/**
 * QUtil SendToManyV1 input validation
 */
export const QUtilSendToManyV1InputSchema = z.object({
  destinations: z
    .array(QubicIdentityOrEmptySchema)
    .length(25)
    .describe("Array of 25 destination identities"),
  amounts: z
    .array(Sint64Schema)
    .length(25)
    .describe("Array of 25 amounts (sint64)"),
});

/**
 * QUtil SendToManyV1 output validation
 */
export const QUtilSendToManyV1OutputSchema = z.object({
  returnCode: Sint32Schema.describe("Return code (0 = success)"),
});

/**
 * QUtil BurnQubic input validation
 */
export const QUtilBurnQubicInputSchema = z.object({
  amount: Sint64Schema.min(0n).describe("Amount to burn"),
});

/**
 * QUtil BurnQubic output validation
 */
export const QUtilBurnQubicOutputSchema = z.object({
  amount: Sint64Schema.describe("Amount burned (or -1 on error)"),
});

/**
 * QUtil CreatePoll input validation
 */
export const QUtilCreatePollInputSchema = z.object({
  pollName: QubicIdentitySchema,
  pollType: Uint64Schema.describe("Poll type (1=QUBIC, 2=ASSET)"),
  minAmount: Uint64Schema.describe("Minimum amount for eligibility"),
  githubLink: z
    .array(Uint8Schema)
    .length(256)
    .describe("GitHub link (256 bytes)"),
  allowedAssets: z
    .array(AssetSchema)
    .length(16)
    .describe("Allowed assets (16 max)"),
  numAssets: Uint64Schema.max(16n).describe("Number of assets"),
});

/**
 * QUtil CreatePoll output validation
 */
export const QUtilCreatePollOutputSchema = z.object({
  pollId: Uint64Schema.describe("Created poll ID"),
});

/**
 * QUtil Vote input validation
 */
export const QUtilVoteInputSchema = z.object({
  pollId: Uint64Schema,
  address: QubicIdentitySchema,
  amount: Uint64Schema,
  chosenOption: Uint64Schema.max(63n).describe("Chosen option (0-63)"),
});

/**
 * QUtil Vote output validation
 */
export const QUtilVoteOutputSchema = z.object({
  success: z.boolean().describe("Vote success status"),
});

/**
 * QUtil GetCurrentResult output validation
 */
export const QUtilGetCurrentResultOutputSchema = z.object({
  result: z
    .array(Uint64Schema)
    .length(64)
    .describe("Voting power per option"),
  voterCount: z
    .array(Uint64Schema)
    .length(64)
    .describe("Number of voters per option"),
  isActive: Uint64Schema.describe("Poll active status"),
});

// ===== API Request/Response Schemas =====

/**
 * Smart contract query request validation
 */
export const QuerySmartContractRequestSchema = z.object({
  contractIndex: ContractIndexSchema,
  inputType: InputTypeSchema,
  inputSize: z.number().int().positive().describe("Input size in bytes"),
  requestData: z.string().describe("Request data (base64 or hex)"),
});

/**
 * Smart contract query response validation
 */
export const QuerySmartContractResponseSchema = z.object({
  responseData: z.string().describe("Response data (base64 or hex)"),
});

/**
 * Balance information validation
 */
export const BalanceSchema = z.object({
  id: QubicIdentitySchema,
  balance: z.string().describe("Balance amount"),
  validForTick: TickNumberSchema,
  latestIncomingTransferTick: TickNumberSchema,
  latestOutgoingTransferTick: TickNumberSchema,
  incomingAmount: z.string(),
  outgoingAmount: z.string(),
  numberOfIncomingTransfers: z.number().int().nonnegative(),
  numberOfOutgoingTransfers: z.number().int().nonnegative(),
});

/**
 * Transaction validation
 */
export const TransactionSchema = z.object({
  hash: z.string().optional(),
  txId: z.string().optional(),
  sourceId: z.string().optional(),
  source: z.string().optional(),
  destId: z.string().optional(),
  destination: z.string().optional(),
  amount: z.string(),
  tickNumber: TickNumberSchema,
  timestamp: z.string().optional(),
  inputType: z.number().int(),
  inputSize: z.number().int(),
  inputHex: z.string().optional(),
  inputData: z.string().optional(),
  signatureHex: z.string().optional(),
  signature: z.string().optional(),
  moneyFlew: z.boolean().optional(),
});

/**
 * Tick info validation
 */
export const TickInfoSchema = z.object({
  tick: TickNumberSchema,
  duration: z.number().int().positive(),
  epoch: EpochNumberSchema,
  initialTick: TickNumberSchema,
});

/**
 * Broadcast transaction request validation
 */
export const BroadcastTransactionRequestSchema = z.object({
  encodedTransaction: z.string().min(1).describe("Encoded transaction data"),
});

/**
 * Broadcast transaction response validation
 */
export const BroadcastTransactionResponseSchema = z.object({
  peersBroadcasted: z.number().int().nonnegative(),
  encodedTransaction: z.string(),
  transactionId: z.string(),
});

/**
 * Pagination request validation
 */
export const PaginationRequestSchema = z.object({
  offset: z.number().int().nonnegative().optional().default(0),
  size: z.number().int().positive().max(1000).optional().default(20),
});

/**
 * Range filter validation
 */
export const RangeSchema = z.object({
  gt: z.string().optional(),
  gte: z.string().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
});

// ===== Client Configuration Schemas =====

/**
 * Client configuration validation
 */
export const ClientConfigSchema = z.object({
  baseUrl: z.string().url().optional(),
  headers: z.record(z.string()).optional(),
  timeout: z.number().int().positive().optional().default(30000),
  fetchFn: z.function().optional(),
});

/**
 * QubicLive client config validation
 */
export const QubicLiveClientConfigSchema = ClientConfigSchema.extend({
  baseUrl: z.string().url().optional().default("https://rpc.qubic.org"),
});

/**
 * Query client config validation
 */
export const QueryClientConfigSchema = ClientConfigSchema.extend({
  baseUrl: z.string().url().optional().default("https://api.qubic.org"),
});

// ===== Validation Helper Functions =====

/**
 * Validate Qubic identity
 */
export function validateIdentity(identity: unknown): identity is string {
  return QubicIdentitySchema.safeParse(identity).success;
}

/**
 * Validate and parse identity (throws on invalid)
 */
export function parseIdentity(identity: unknown): string {
  return QubicIdentitySchema.parse(identity);
}

/**
 * Validate Asset
 */
export function validateAsset(asset: unknown): boolean {
  return AssetSchema.safeParse(asset).success;
}

/**
 * Validate and parse Asset (throws on invalid)
 */
export function parseAsset(asset: unknown) {
  return AssetSchema.parse(asset);
}

/**
 * Validate amount
 */
export function validateAmount(amount: unknown): amount is bigint {
  return AmountSchema.safeParse(amount).success;
}

/**
 * Validate contract index
 */
export function validateContractIndex(index: unknown): index is number {
  return ContractIndexSchema.safeParse(index).success;
}

/**
 * Validate smart contract query request
 */
export function validateQueryRequest(request: unknown): boolean {
  return QuerySmartContractRequestSchema.safeParse(request).success;
}

/**
 * Parse and validate smart contract query request (throws on invalid)
 */
export function parseQueryRequest(request: unknown) {
  return QuerySmartContractRequestSchema.parse(request);
}

/**
 * Validate QUtil SendToManyV1 input
 */
export function validateSendToManyV1Input(input: unknown): boolean {
  return QUtilSendToManyV1InputSchema.safeParse(input).success;
}

/**
 * Parse and validate QUtil SendToManyV1 input (throws on invalid)
 */
export function parseSendToManyV1Input(input: unknown) {
  return QUtilSendToManyV1InputSchema.parse(input);
}

/**
 * Validate QUtil Vote input
 */
export function validateVoteInput(input: unknown): boolean {
  return QUtilVoteInputSchema.safeParse(input).success;
}

/**
 * Parse and validate QUtil Vote input (throws on invalid)
 */
export function parseVoteInput(input: unknown) {
  return QUtilVoteInputSchema.parse(input);
}

/**
 * Validate transaction
 */
export function validateTransaction(tx: unknown): boolean {
  return TransactionSchema.safeParse(tx).success;
}

/**
 * Create custom validation error message
 */
export function getValidationErrors(schema: z.ZodSchema, data: unknown): string[] {
  const result = schema.safeParse(data);
  if (result.success) {
    return [];
  }
  return result.error.errors.map(
    (err) => `${err.path.join(".")}: ${err.message}`,
  );
}

/**
 * Safe parse with custom error handling
 */
export function safeParse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.errors.map((err) => `${err.path.join(".")}: ${err.message}`),
  };
}

// ===== Type Exports (inferred from schemas) =====

export type QubicIdentityType = z.infer<typeof QubicIdentitySchema>;
export type AssetType = z.infer<typeof AssetSchema>;
export type QUtilSendToManyV1InputType = z.infer<typeof QUtilSendToManyV1InputSchema>;
export type QUtilSendToManyV1OutputType = z.infer<typeof QUtilSendToManyV1OutputSchema>;
export type QUtilBurnQubicInputType = z.infer<typeof QUtilBurnQubicInputSchema>;
export type QUtilBurnQubicOutputType = z.infer<typeof QUtilBurnQubicOutputSchema>;
export type QUtilVoteInputType = z.infer<typeof QUtilVoteInputSchema>;
export type QUtilVoteOutputType = z.infer<typeof QUtilVoteOutputSchema>;
export type QuerySmartContractRequestType = z.infer<typeof QuerySmartContractRequestSchema>;
export type QuerySmartContractResponseType = z.infer<typeof QuerySmartContractResponseSchema>;
export type BalanceType = z.infer<typeof BalanceSchema>;
export type TransactionType = z.infer<typeof TransactionSchema>;
export type TickInfoType = z.infer<typeof TickInfoSchema>;
export type ClientConfigType = z.infer<typeof ClientConfigSchema>;
