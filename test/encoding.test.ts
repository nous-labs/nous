import { describe, expect, test } from "bun:test";
import {
  hexToBase64,
  base64ToHex,
  bytesToBase64,
  base64ToBytes,
  bytesToHex,
  hexToBytes,
  stringToHex,
  hexToString,
  padHex,
  encodeInt64LE,
  decodeInt64LE,
  encodeInt32LE,
  decodeInt32LE,
  encodeInt16LE,
  decodeInt16LE,
  encodeByte,
  decodeByte,
  zeros,
  concatHex,
  sliceHex,
  getHexByteLength,
  isValidHex,
  isValidBase64,
} from "../src/utils/encoding.ts";

describe("Encoding helpers", () => {
  test("hex/base64 roundtrip", () => {
    const samples = ["", "00", "ff", "deadbeef", "cafebabec001d00d"];
    for (const hex of samples) {
      const encoded = hexToBase64(hex);
      const decoded = base64ToHex(encoded);
      expect(decoded).toBe(hex.toLowerCase());
    }
  });

  test("byte/base64 roundtrip", () => {
    const bytes = new Uint8Array([0, 255, 128, 1, 2, 3]);
    const base64 = bytesToBase64(bytes);
    const roundtrip = base64ToBytes(base64);
    expect(roundtrip).toEqual(bytes);
  });

  test("string hex conversion", () => {
    const text = "Qubic ❤️";
    const hex = stringToHex(text);
    const roundtrip = hexToString(hex);
    expect(roundtrip).toBe(text);
  });

  test("padding and concatenation", () => {
    const padded = padHex("ff", 4);
    expect(padded).toBe("000000ff");

    const combined = concatHex("aa", "bb", "cc");
    expect(combined).toBe("aabbcc");
  });

  test("slicing respects byte boundaries", () => {
    const hex = "00112233445566";
    expect(sliceHex(hex, 0, 2)).toBe("0011");
    expect(sliceHex(hex, 2, 4)).toBe("2233");
    expect(sliceHex(hex, 3)).toBe("33445566");
  });

  test("length helpers", () => {
    expect(getHexByteLength("")).toBe(0);
    expect(getHexByteLength("0")).toBe(1);
    expect(getHexByteLength("deadbeef")).toBe(4);
  });

  test("zeros helper", () => {
    expect(zeros(4)).toBe("00000000");
  });

  test("byte encode/decode", () => {
    for (let i = 0; i < 256; i++) {
      const encoded = encodeByte(i);
      expect(encoded).toHaveLength(2);
      expect(parseInt(encoded, 16)).toBe(i);
      expect(decodeByte(encoded)).toBe(i);
    }
  });

  test("integer encoding roundtrips", () => {
    const int16 = encodeInt16LE(0x1234);
    expect(decodeInt16LE(int16)).toBe(0x1234);

    const int32 = encodeInt32LE(0xabcdef);
    expect(decodeInt32LE(int32)).toBe(0xabcdef);

    const int64 = encodeInt64LE(0x1234567890abcdefn);
    expect(decodeInt64LE(int64)).toBe(0x1234567890abcdefn);
  });

  test("validation helpers", () => {
    expect(isValidHex("deadbeef")).toBe(true);
    expect(isValidHex("xyz")).toBe(false);

    expect(isValidBase64("3q2+7w==")).toBe(true);
    expect(isValidBase64("$$$")).toBe(false);
  });

  test("compatibility between bytes and hex helpers", () => {
    const bytes = new Uint8Array(32).map((_, i) => i);
    const hex = bytesToHex(bytes);
    const roundtrip = hexToBytes(hex);
    expect(roundtrip).toEqual(bytes);
  });
});
