import { describe, expect, it } from "bun:test";

import {
  createProcedure,
  defineProcedure,
  procedureCallToTransaction,
  type ProcedureTransactionOverrides,
} from "../src/utils/procedures.ts";
import { QUBIC_CONTRACTS } from "../src/utils/smart-contract.ts";
import { identityBytesToString } from "../src/utils/identity.ts";

const mockIdentity = identityBytesToString(new Uint8Array(32));

describe("procedure helpers", () => {
  it("builds raw payloads with createProcedure", () => {
    const builder = createProcedure(QUBIC_CONTRACTS.QUTIL, 42)
      .addByte(0x01)
      .addInt32(1234)
      .addIdentity(mockIdentity);

    const call = builder.toProcedureCall();
    expect(call.contractIndex).toBe(QUBIC_CONTRACTS.QUTIL);
    expect(call.procedureIndex).toBe(42);
    expect(call.payloadHex.length).toBeGreaterThan(0);
    expect(call.payloadBase64.length).toBeGreaterThan(0);
  });

  it("defines reusable procedures with type-checked params", () => {
    const incrementVote = defineProcedure<{
      pollId: bigint;
      weight: number;
    }>({
      contractIndex: QUBIC_CONTRACTS.QUTIL,
      procedureIndex: 5,
      encode: (builder, params) => {
        builder.addInt64(params.pollId).addInt32(params.weight);
      },
    });

    const call = incrementVote.build({ pollId: 1n, weight: 10 });
    expect(call.payloadHex).toMatch(/^[0-9a-f]+$/);
    expect(call.procedureIndex).toBe(5);
  });

  it("maps procedure calls into wallet-friendly transaction payloads", () => {
    const call = createProcedure(QUBIC_CONTRACTS.QX, 9)
      .addInt64(99n)
      .toProcedureCall();

    const overrides: ProcedureTransactionOverrides = {
      from: mockIdentity,
      to: mockIdentity,
      amount: "0",
    };

    const tx = procedureCallToTransaction(call, overrides);
    expect(tx.inputType).toBe(call.procedureIndex);
    expect(tx.payload).toBe(call.payloadHex);
    expect(tx.from).toBe(overrides.from);
  });
});
