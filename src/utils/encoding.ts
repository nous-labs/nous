// Utility functions for encoding and decoding smart contract data

/**
 * Convert hex string to base64
 * @param hex - Hex string (with or without 0x prefix)
 * @returns Base64 encoded string
 */
export function hexToBase64(hex: string): string {
  const cleanHex = hex.replace(/^0x/i, "");
  const bytes = new Uint8Array(
    cleanHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) ?? [],
  );
  return bytesToBase64(bytes);
}

/**
 * Convert base64 string to hex
 * @param base64 - Base64 encoded string
 * @returns Hex string
 */
export function base64ToHex(base64: string): string {
  const bytes = base64ToBytes(base64);
  return bytesToHex(bytes);
}

/**
 * Convert bytes to base64
 * @param bytes - Uint8Array of bytes
 * @returns Base64 encoded string
 */
export function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    // Node.js environment
    return Buffer.from(bytes).toString("base64");
  } else {
    // Browser environment
    const binary = String.fromCharCode(...bytes);
    return btoa(binary);
  }
}

/**
 * Convert base64 to bytes
 * @param base64 - Base64 encoded string
 * @returns Uint8Array of bytes
 */
export function base64ToBytes(base64: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    // Node.js environment
    return new Uint8Array(Buffer.from(base64, "base64"));
  } else {
    // Browser environment
    const binary = atob(base64);
    return new Uint8Array(binary.split("").map((c) => c.charCodeAt(0)));
  }
}

/**
 * Convert bytes to hex string
 * @param bytes - Uint8Array of bytes
 * @returns Hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Convert hex string to bytes
 * @param hex - Hex string (with or without 0x prefix)
 * @returns Uint8Array of bytes
 */
export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.replace(/^0x/i, "");
  return new Uint8Array(
    cleanHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) ?? [],
  );
}

/**
 * Convert string to hex
 * @param str - String to convert
 * @returns Hex string
 */
export function stringToHex(str: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  return bytesToHex(bytes);
}

/**
 * Convert hex to string
 * @param hex - Hex string (with or without 0x prefix)
 * @returns Decoded string
 */
export function hexToString(hex: string): string {
  const bytes = hexToBytes(hex);
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
}

/**
 * Pad hex string to specific byte length
 * @param hex - Hex string
 * @param byteLength - Desired byte length
 * @param padStart - Pad at start (true) or end (false)
 * @returns Padded hex string
 */
export function padHex(
  hex: string,
  byteLength: number,
  padStart: boolean = true,
): string {
  const cleanHex = hex.replace(/^0x/i, "");
  const targetLength = byteLength * 2;
  const padding = "0".repeat(Math.max(0, targetLength - cleanHex.length));
  return padStart ? padding + cleanHex : cleanHex + padding;
}

/**
 * Encode a number as little-endian hex
 * @param value - Number to encode
 * @param byteLength - Number of bytes (default: 8 for int64)
 * @returns Hex string in little-endian format
 */
export function encodeInt64LE(
  value: number | bigint,
  byteLength: number = 8,
): string {
  const bigIntValue = BigInt(value);
  const bytes = new Uint8Array(byteLength);
  let remaining = bigIntValue;

  for (let i = 0; i < byteLength; i++) {
    bytes[i] = Number(remaining & 0xffn);
    remaining = remaining >> 8n;
  }

  return bytesToHex(bytes);
}

/**
 * Decode a little-endian hex string to number
 * @param hex - Hex string in little-endian format
 * @returns Decoded number
 */
export function decodeInt64LE(hex: string): bigint {
  const bytes = hexToBytes(hex);
  let result = 0n;

  for (let i = bytes.length - 1; i >= 0; i--) {
    result = (result << 8n) | BigInt(bytes[i]!);
  }

  return result;
}

/**
 * Encode a 32-bit integer as little-endian hex
 * @param value - Number to encode
 * @returns Hex string in little-endian format
 */
export function encodeInt32LE(value: number): string {
  return encodeInt64LE(value, 4);
}

/**
 * Decode a little-endian 32-bit hex string to number
 * @param hex - Hex string in little-endian format
 * @returns Decoded number
 */
export function decodeInt32LE(hex: string): number {
  return Number(decodeInt64LE(hex));
}

/**
 * Encode a 16-bit integer as little-endian hex
 * @param value - Number to encode
 * @returns Hex string in little-endian format
 */
export function encodeInt16LE(value: number): string {
  return encodeInt64LE(value, 2);
}

/**
 * Decode a little-endian 16-bit hex string to number
 * @param hex - Hex string in little-endian format
 * @returns Decoded number
 */
export function decodeInt16LE(hex: string): number {
  return Number(decodeInt64LE(hex));
}

/**
 * Encode a byte as hex
 * @param value - Byte value (0-255)
 * @returns Hex string
 */
export function encodeByte(value: number): string {
  return value.toString(16).padStart(2, "0");
}

/**
 * Decode a hex byte to number
 * @param hex - Hex string (2 characters)
 * @returns Byte value
 */
export function decodeByte(hex: string): number {
  return parseInt(hex.slice(0, 2), 16);
}

/**
 * Create a buffer of zeros
 * @param byteLength - Length in bytes
 * @returns Hex string of zeros
 */
export function zeros(byteLength: number): string {
  return "0".repeat(byteLength * 2);
}

/**
 * Concatenate multiple hex strings
 * @param hexStrings - Array of hex strings
 * @returns Concatenated hex string
 */
export function concatHex(...hexStrings: string[]): string {
  return hexStrings.map((h) => h.replace(/^0x/i, "")).join("");
}

/**
 * Slice a hex string by byte positions
 * @param hex - Hex string
 * @param start - Start byte position
 * @param end - End byte position (exclusive)
 * @returns Sliced hex string
 */
export function sliceHex(hex: string, start: number, end?: number): string {
  const cleanHex = hex.replace(/^0x/i, "");
  const startChar = start * 2;
  const endChar = end !== undefined ? end * 2 : undefined;
  return cleanHex.slice(startChar, endChar);
}

/**
 * Get byte length of hex string
 * @param hex - Hex string
 * @returns Number of bytes
 */
export function getHexByteLength(hex: string): number {
  const cleanHex = hex.replace(/^0x/i, "");
  return Math.ceil(cleanHex.length / 2);
}

/**
 * Validate hex string
 * @param hex - String to validate
 * @returns True if valid hex string
 */
export function isValidHex(hex: string): boolean {
  const cleanHex = hex.replace(/^0x/i, "");
  return /^[0-9a-fA-F]*$/.test(cleanHex);
}

/**
 * Validate base64 string
 * @param base64 - String to validate
 * @returns True if valid base64 string
 */
export function isValidBase64(base64: string): boolean {
  return /^[A-Za-z0-9+/]*={0,2}$/.test(base64);
}
