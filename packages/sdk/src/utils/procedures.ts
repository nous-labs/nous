import type { QubicLiveClient } from "../clients/qubic-live-client";
import { SmartContractQuery } from "./smart-contract";

export interface ProcedureCall {
  contractIndex: number;
  procedureIndex: number;
  payloadHex: string;
  payloadBase64: string;
  inputSize: number;
}

/**
 * Builder used to create type-safe payloads for contract procedures (state-changing transactions).
 *
 * It reuses the SmartContractQuery encoding helpers but never performs RPC calls.
 */
export class ProcedureBuilder extends SmartContractQuery {
  constructor(contractIndex: number, procedureIndex: number) {
    super(contractIndex, procedureIndex);
  }

  /**
   * Procedures are executed via transactions, not queries. Guard against accidental execution.
   */
  override async execute(_client: QubicLiveClient): Promise<never> {
    throw new Error(
      "ProcedureBuilder cannot execute queries. Sign and broadcast the payload instead.",
    );
  }

  /**
   * Produce a serialised ProcedureCall describing this payload.
   */
  toProcedureCall(): ProcedureCall {
    return {
      contractIndex: this.contractIndex,
      procedureIndex: this.inputType,
      payloadHex: this.toHex(),
      payloadBase64: this.toBase64(),
      inputSize: this.getInputSize(),
    };
  }
}

export function createProcedure(
  contractIndex: number,
  procedureIndex: number,
): ProcedureBuilder {
  return new ProcedureBuilder(contractIndex, procedureIndex);
}

export type ProcedureEncoder<TParams> = (
  builder: ProcedureBuilder,
  params: TParams,
) => void;

export interface DefinedProcedure<TParams> {
  contractIndex: number;
  procedureIndex: number;
  build(params: TParams): ProcedureCall;
  encode(params: TParams): string;
}

export function defineProcedure<TParams>(options: {
  contractIndex: number;
  procedureIndex: number;
  encode: ProcedureEncoder<TParams>;
}): DefinedProcedure<TParams> {
  const { contractIndex, procedureIndex, encode } = options;
  return {
    contractIndex,
    procedureIndex,
    build(params: TParams) {
      const builder = createProcedure(contractIndex, procedureIndex);
      encode(builder, params);
      return builder.toProcedureCall();
    },
    encode(params: TParams) {
      const call = this.build(params);
      return call.payloadHex;
    },
  };
}

export interface ProcedureTransactionOverrides {
  from: string;
  to: string;
  amount: string;
  payloadEncoding?: "hex" | "base64";
  extra?: Record<string, unknown>;
}

export function procedureCallToTransaction(
  call: ProcedureCall,
  overrides: ProcedureTransactionOverrides,
) {
  const payload =
    overrides.payloadEncoding === "base64"
      ? call.payloadBase64
      : call.payloadHex;
  return {
    from: overrides.from,
    to: overrides.to,
    amount: overrides.amount,
    inputType: call.procedureIndex,
    payload,
    ...overrides.extra,
  };
}
