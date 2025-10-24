// Easy-to-use smart contract query functions with automatic serialization/deserialization

import type { QubicLiveClient } from "../clients/qubic-live-client.ts";
import { createQuery, parseResponse, QUBIC_CONTRACTS } from "./smart-contract.ts";

/**
 * QX (Decentralized Exchange) Contract Functions
 */
export const qx = {
  /**
   * Get entity information from QX
   */
  async getEntity(client: QubicLiveClient, entityId: number) {
    const query = createQuery(QUBIC_CONTRACTS.QX, 1)
      .addInt32(entityId);

    const response = await query.execute(client);
    const parser = parseResponse(response.responseData);

    return {
      entityId: parser.readInt32(),
      orderCount: parser.readInt32(),
      // Add more fields based on actual QX contract spec
    };
  },

  /**
   * Get asset order book
   */
  async getOrderBook(client: QubicLiveClient, assetPairId: number, offset = 0, count = 10) {
    const query = createQuery(QUBIC_CONTRACTS.QX, 5)
      .addInt32(assetPairId)
      .addInt32(offset)
      .addInt32(count);

    const response = await query.execute(client);
    return {
      raw: response.responseData,
      parser: parseResponse(response.responseData),
    };
  },

  /**
   * Get fees information
   */
  async getFees(client: QubicLiveClient) {
    const query = createQuery(QUBIC_CONTRACTS.QX, 2);
    const response = await query.execute(client);
    const parser = parseResponse(response.responseData);

    return {
      assetIssuanceFee: parser.readInt64(),
      transferFee: parser.readInt64(),
      tradeFee: parser.readInt64(),
    };
  },
};

/**
 * QUTIL (Utility Functions) Contract
 */
export const qutil = {
  /**
   * Send tokens to multiple addresses in one transaction
   */
  async sendToMany(
    client: QubicLiveClient,
    transfers: Array<{ address: string; amount: bigint }>
  ) {
    const query = createQuery(QUBIC_CONTRACTS.QUTIL, 1)
      .addInt32(transfers.length);

    for (const transfer of transfers) {
      query.addIdentity(transfer.address).addInt64(transfer.amount);
    }

    const response = await query.execute(client);
    return {
      success: true,
      raw: response.responseData,
    };
  },

  /**
   * Get contract info
   */
  async getContractInfo(client: QubicLiveClient) {
    const query = createQuery(QUBIC_CONTRACTS.QUTIL, 0);
    const response = await query.execute(client);
    const parser = parseResponse(response.responseData);

    return {
      contractIndex: parser.readInt32(),
      contractName: parser.readString(64),
    };
  },
};

/**
 * QUOTTERY (Betting Platform) Contract
 */
export const quottery = {
  /**
   * Get active bet information
   */
  async getActiveBet(client: QubicLiveClient, betId: number) {
    const query = createQuery(QUBIC_CONTRACTS.QUOTTERY, 1)
      .addInt32(betId);

    const response = await query.execute(client);
    const parser = parseResponse(response.responseData);

    return {
      betId: parser.readInt32(),
      creator: parser.readIdentity(),
      amount: parser.readInt64(),
      active: parser.readByte() === 1,
    };
  },

  /**
   * Get bet list
   */
  async getBetList(client: QubicLiveClient, offset = 0, count = 10) {
    const query = createQuery(QUBIC_CONTRACTS.QUOTTERY, 2)
      .addInt32(offset)
      .addInt32(count);

    const response = await query.execute(client);
    return {
      raw: response.responseData,
      parser: parseResponse(response.responseData),
    };
  },

  /**
   * Get user bets
   */
  async getUserBets(client: QubicLiveClient, userIdentity: string) {
    const query = createQuery(QUBIC_CONTRACTS.QUOTTERY, 3)
      .addIdentity(userIdentity);

    const response = await query.execute(client);
    return {
      raw: response.responseData,
      parser: parseResponse(response.responseData),
    };
  },
};

/**
 * RANDOM (Random Number Generator) Contract
 */
export const random = {
  /**
   * Get random number
   */
  async getRandomNumber(client: QubicLiveClient, seed?: number) {
    const query = createQuery(QUBIC_CONTRACTS.RANDOM, 1);
    if (seed !== undefined) {
      query.addInt32(seed);
    }

    const response = await query.execute(client);
    const parser = parseResponse(response.responseData);

    return {
      randomNumber: parser.readInt64(),
      tick: parser.readInt32(),
    };
  },

  /**
   * Get random bytes
   */
  async getRandomBytes(client: QubicLiveClient, byteCount: number) {
    const query = createQuery(QUBIC_CONTRACTS.RANDOM, 2)
      .addInt32(byteCount);

    const response = await query.execute(client);
    const parser = parseResponse(response.responseData);

    return {
      bytes: parser.readHex(byteCount),
      raw: response.responseData,
    };
  },
};

/**
 * QEARN (Earning/Staking Platform) Contract
 */
export const qearn = {
  /**
   * Get staking info for an identity
   */
  async getStakingInfo(client: QubicLiveClient, identity: string) {
    const query = createQuery(QUBIC_CONTRACTS.QEARN, 1)
      .addIdentity(identity);

    const response = await query.execute(client);
    const parser = parseResponse(response.responseData);

    return {
      stakedAmount: parser.readInt64(),
      earnedAmount: parser.readInt64(),
      lockUntilTick: parser.readInt32(),
    };
  },

  /**
   * Get total staked amount
   */
  async getTotalStaked(client: QubicLiveClient) {
    const query = createQuery(QUBIC_CONTRACTS.QEARN, 2);
    const response = await query.execute(client);
    const parser = parseResponse(response.responseData);

    return {
      totalStaked: parser.readInt64(),
      totalStakers: parser.readInt32(),
    };
  },

  /**
   * Get rewards for tick range
   */
  async getRewards(client: QubicLiveClient, startTick: number, endTick: number) {
    const query = createQuery(QUBIC_CONTRACTS.QEARN, 3)
      .addInt32(startTick)
      .addInt32(endTick);

    const response = await query.execute(client);
    return {
      raw: response.responseData,
      parser: parseResponse(response.responseData),
    };
  },
};

/**
 * QSWAP (Token Swap) Contract
 */
export const qswap = {
  /**
   * Get swap pair info
   */
  async getPairInfo(client: QubicLiveClient, pairId: number) {
    const query = createQuery(QUBIC_CONTRACTS.QSWAP, 1)
      .addInt32(pairId);

    const response = await query.execute(client);
    const parser = parseResponse(response.responseData);

    return {
      pairId: parser.readInt32(),
      token0: parser.readString(8),
      token1: parser.readString(8),
      reserve0: parser.readInt64(),
      reserve1: parser.readInt64(),
    };
  },

  /**
   * Get swap quote
   */
  async getQuote(client: QubicLiveClient, amountIn: bigint, tokenIn: string, tokenOut: string) {
    const query = createQuery(QUBIC_CONTRACTS.QSWAP, 2)
      .addInt64(amountIn)
      .addString(tokenIn, 8)
      .addString(tokenOut, 8);

    const response = await query.execute(client);
    const parser = parseResponse(response.responseData);

    return {
      amountOut: parser.readInt64(),
      priceImpact: parser.readInt32(),
    };
  },
};

/**
 * QVAULT (Vault) Contract
 */
export const qvault = {
  /**
   * Get vault balance
   */
  async getVaultBalance(client: QubicLiveClient, vaultId: number) {
    const query = createQuery(QUBIC_CONTRACTS.QVAULT, 1)
      .addInt32(vaultId);

    const response = await query.execute(client);
    const parser = parseResponse(response.responseData);

    return {
      vaultId: parser.readInt32(),
      balance: parser.readInt64(),
      owner: parser.readIdentity(),
    };
  },

  /**
   * Get user vaults
   */
  async getUserVaults(client: QubicLiveClient, userIdentity: string) {
    const query = createQuery(QUBIC_CONTRACTS.QVAULT, 2)
      .addIdentity(userIdentity);

    const response = await query.execute(client);
    return {
      raw: response.responseData,
      parser: parseResponse(response.responseData),
    };
  },
};

/**
 * CCF (Computor Controlled Fund) Contract
 */
export const ccf = {
  /**
   * Get fund info
   */
  async getFundInfo(client: QubicLiveClient) {
    const query = createQuery(QUBIC_CONTRACTS.CCF, 1);
    const response = await query.execute(client);
    const parser = parseResponse(response.responseData);

    return {
      totalFunds: parser.readInt64(),
      activeProposals: parser.readInt32(),
      executedProposals: parser.readInt32(),
    };
  },

  /**
   * Get proposal
   */
  async getProposal(client: QubicLiveClient, proposalId: number) {
    const query = createQuery(QUBIC_CONTRACTS.CCF, 2)
      .addInt32(proposalId);

    const response = await query.execute(client);
    const parser = parseResponse(response.responseData);

    return {
      proposalId: parser.readInt32(),
      amount: parser.readInt64(),
      status: parser.readByte(),
      votesFor: parser.readInt32(),
      votesAgainst: parser.readInt32(),
    };
  },
};

/**
 * Generic contract query with auto-build
 * Use this for contracts not yet supported or custom queries
 */
export async function query<T = any>(
  client: QubicLiveClient,
  contractIndex: number,
  inputType: number,
  buildFn: (query: ReturnType<typeof createQuery>) => void,
  parseFn?: (parser: ReturnType<typeof parseResponse>) => T
) {
  const q = createQuery(contractIndex, inputType);
  buildFn(q);

  const response = await q.execute(client);

  if (parseFn) {
    return parseFn(parseResponse(response.responseData));
  }

  return {
    raw: response.responseData,
    parser: parseResponse(response.responseData),
  };
}

/**
 * Simple query - just provide contract index, input type, and get raw response
 */
export async function simpleQuery(
  client: QubicLiveClient,
  contractIndex: number,
  inputType: number
) {
  const query = createQuery(contractIndex, inputType);
  const response = await query.execute(client);
  return {
    raw: response.responseData,
    parser: parseResponse(response.responseData),
    response,
  };
}
