// Easy-to-use smart contract query functions with automatic serialization/deserialization

import type { QubicLiveClient } from "../clients/qubic-live-client";
import {
  createQuery,
  parseResponse,
  QUBIC_CONTRACTS,
} from "./smart-contract";

/**
 * QX (Decentralized Exchange) Contract Functions
 * Based on src/contracts/Qx.h REGISTER_USER_FUNCTION indices
 */
export const qx = {
  /**
   * Fees() -> { assetIssuanceFee: uint32, transferFee: uint32, tradeFee: uint32 }
   * inputType = 1
   */
  async getFees(client: QubicLiveClient) {
    const query = createQuery(QUBIC_CONTRACTS.QX, 1);
    const response = await query.execute(client);
    const p = parseResponse(response.responseData);
    return {
      assetIssuanceFee: p.readInt32(),
      transferFee: p.readInt32(),
      tradeFee: p.readInt32(),
    };
  },

  /**
   * AssetAskOrders(issuer, assetName, offset) -> Order[256]
   * inputType = 2
   */
  async getAssetAskOrders(
    client: QubicLiveClient,
    issuer: string,
    assetName: bigint | number,
    offset: bigint | number = 0,
  ) {
    const q = createQuery(QUBIC_CONTRACTS.QX, 2)
      .addIdentity(issuer)
      .addInt64(assetName)
      .addInt64(offset);

    const r = await q.execute(client);
    const p = parseResponse(r.responseData);
    const orders: Array<{
      entity: string;
      price: bigint;
      numberOfShares: bigint;
    }> = [];
    for (let i = 0; i < 256; i++) {
      const entity = p.readIdentity();
      const price = p.readInt64();
      const numberOfShares = p.readInt64();
      if (entity) orders.push({ entity, price, numberOfShares });
    }
    return { orders };
  },

  /**
   * AssetBidOrders(issuer, assetName, offset) -> Order[256]
   * inputType = 3
   */
  async getAssetBidOrders(
    client: QubicLiveClient,
    issuer: string,
    assetName: bigint | number,
    offset: bigint | number = 0,
  ) {
    const q = createQuery(QUBIC_CONTRACTS.QX, 3)
      .addIdentity(issuer)
      .addInt64(assetName)
      .addInt64(offset);

    const r = await q.execute(client);
    const p = parseResponse(r.responseData);
    const orders: Array<{
      entity: string;
      price: bigint;
      numberOfShares: bigint;
    }> = [];
    for (let i = 0; i < 256; i++) {
      const entity = p.readIdentity();
      const price = p.readInt64();
      const numberOfShares = p.readInt64();
      if (entity) orders.push({ entity, price, numberOfShares });
    }
    return { orders };
  },

  /**
   * EntityAskOrders(entity, offset) -> Order[256]
   * inputType = 4
   */
  async getEntityAskOrders(
    client: QubicLiveClient,
    entity: string,
    offset: bigint | number = 0,
  ) {
    const q = createQuery(QUBIC_CONTRACTS.QX, 4)
      .addIdentity(entity)
      .addInt64(offset);

    const r = await q.execute(client);
    const p = parseResponse(r.responseData);
    const orders: Array<{
      issuer: string;
      assetName: bigint;
      price: bigint;
      numberOfShares: bigint;
    }> = [];
    for (let i = 0; i < 256; i++) {
      const issuer = p.readIdentity();
      const assetName2 = p.readInt64();
      const price = p.readInt64();
      const numberOfShares = p.readInt64();
      if (issuer)
        orders.push({ issuer, assetName: assetName2, price, numberOfShares });
    }
    return { orders };
  },

  /**
   * EntityBidOrders(entity, offset) -> Order[256]
   * inputType = 5
   */
  async getEntityBidOrders(
    client: QubicLiveClient,
    entity: string,
    offset: bigint | number = 0,
  ) {
    const q = createQuery(QUBIC_CONTRACTS.QX, 5)
      .addIdentity(entity)
      .addInt64(offset);

    const r = await q.execute(client);
    const p = parseResponse(r.responseData);
    const orders: Array<{
      issuer: string;
      assetName: bigint;
      price: bigint;
      numberOfShares: bigint;
    }> = [];
    for (let i = 0; i < 256; i++) {
      const issuer = p.readIdentity();
      const assetName2 = p.readInt64();
      const price = p.readInt64();
      const numberOfShares = p.readInt64();
      if (issuer)
        orders.push({ issuer, assetName: assetName2, price, numberOfShares });
    }
    return { orders };
  },
};

/**
 * QUTIL (Utility Functions) Contract
 * Based on src/contracts/QUtil.h REGISTER_USER_FUNCTION indices
 */
export const qutil = {
  /** GetSendToManyV1Fee() -> { fee: sint64 }, inputType = 1 */
  async getSendToManyV1Fee(client: QubicLiveClient) {
    const q = createQuery(QUBIC_CONTRACTS.QUTIL, 1);
    const r = await q.execute(client);
    const p = parseResponse(r.responseData);
    return { fee: p.readInt64() };
  },

  /** GetTotalNumberOfAssetShares(asset) -> sint64, inputType = 2 */
  async getTotalNumberOfAssetShares(
    client: QubicLiveClient,
    params: { issuer: string; assetName: bigint | number },
  ) {
    const q = createQuery(QUBIC_CONTRACTS.QUTIL, 2)
      .addIdentity(params.issuer)
      .addInt64(params.assetName);
    const r = await q.execute(client);
    const p = parseResponse(r.responseData);
    return { totalShares: p.readInt64() };
  },

  /** GetCurrentResult(poll_id) -> arrays + status, inputType = 3 */
  async getCurrentResult(client: QubicLiveClient, pollId: bigint | number) {
    const q = createQuery(QUBIC_CONTRACTS.QUTIL, 3).addInt64(pollId);
    const r = await q.execute(client);
    const p = parseResponse(r.responseData);
    const result: bigint[] = [];
    const voterCount: bigint[] = [];
    for (let i = 0; i < 64; i++) result.push(p.readInt64());
    for (let i = 0; i < 64; i++) voterCount.push(p.readInt64());
    const isActive = p.readInt64();
    return { result, voterCount, isActive };
  },

  /** GetPollsByCreator(creator) -> poll_ids[64], count, inputType = 4 */
  async getPollsByCreator(client: QubicLiveClient, creator: string) {
    const q = createQuery(QUBIC_CONTRACTS.QUTIL, 4).addIdentity(creator);
    const r = await q.execute(client);
    const p = parseResponse(r.responseData);
    const pollIds: bigint[] = [];
    for (let i = 0; i < 64; i++) pollIds.push(p.readInt64());
    const count = p.readInt64();
    return { count: Number(count), pollIds };
  },

  /** GetCurrentPollId() -> current_poll_id, active_poll_ids[64], active_count, inputType = 5 */
  async getCurrentPollId(client: QubicLiveClient) {
    const q = createQuery(QUBIC_CONTRACTS.QUTIL, 5);
    const r = await q.execute(client);
    const p = parseResponse(r.responseData);
    const currentPollId = p.readInt64();
    const activePollIds: bigint[] = [];
    for (let i = 0; i < 64; i++) activePollIds.push(p.readInt64());
    const activeCount = p.readInt64();
    return { currentPollId, activePollIds, activeCount };
  },

  /** GetPollInfo(poll_id) -> found + poll struct + link, inputType = 6 */
  async getPollInfo(client: QubicLiveClient, pollId: bigint | number) {
    const q = createQuery(QUBIC_CONTRACTS.QUTIL, 6).addInt64(pollId);
    const r = await q.execute(client);
    const p = parseResponse(r.responseData);

    const found = p.readInt64();
    const poll = {
      pollName: p.readIdentity(),
      pollType: p.readInt64(),
      minAmount: p.readInt64(),
      isActive: p.readInt64(),
      creator: p.readIdentity(),
      allowedAssets: [] as Array<{ issuer: string; assetName: bigint }>,
      numAssets: 0n as bigint,
    };
    for (let i = 0; i < 16; i++) {
      const issuer = p.readIdentity();
      const assetName = p.readInt64();
      poll.allowedAssets.push({ issuer, assetName });
    }
    poll.numAssets = p.readInt64();
    const pollLink = p.readString(256).trim();
    return { found: found !== 0n, poll, pollLink };
  },
};

/**
 * QUOTTERY (Betting Platform) Contract
 * Based on src/contracts/Quottery.h REGISTER_USER_FUNCTION indices
 */
export const quottery = {
  /** basicInfo() -> many fields, inputType = 1 */
  async basicInfo(client: QubicLiveClient) {
    const q = createQuery(QUBIC_CONTRACTS.QUOTTERY, 1);
    const r = await q.execute(client);
    const p = parseResponse(r.responseData);
    return {
      feePerSlotPerHour: p.readInt64(),
      gameOperatorFee: p.readInt64(),
      shareholderFee: p.readInt64(),
      minBetSlotAmount: p.readInt64(),
      burnFee: p.readInt64(),
      nIssuedBet: p.readInt32(),
      moneyFlow: p.readInt64(),
      moneyFlowThroughIssueBet: p.readInt64(),
      moneyFlowThroughJoinBet: p.readInt64(),
      moneyFlowThroughFinalizeBet: p.readInt64(),
      earnedAmountForShareHolder: p.readInt64(),
      paidAmountForShareHolder: p.readInt64(),
      earnedAmountForBetWinner: p.readInt64(),
      distributedAmount: p.readInt64(),
      burnedAmount: p.readInt64(),
      gameOperator: p.readIdentity(),
    };
  },

  /** getBetInfo(betId) -> detailed metadata, inputType = 2 */
  async getBetInfo(client: QubicLiveClient, betId: number) {
    const q = createQuery(QUBIC_CONTRACTS.QUOTTERY, 2).addInt32(betId);
    const r = await q.execute(client);
    const p = parseResponse(r.responseData);
    const out = {
      betId: p.readInt32(),
      nOption: p.readInt32(),
      creator: p.readIdentity(),
      betDesc: p.readIdentity(),
      optionDesc: [] as string[],
      oracleProviderId: [] as string[],
      oracleFees: [] as number[],
      openDate: p.readInt32(),
      closeDate: p.readInt32(),
      endDate: p.readInt32(),
      minBetAmount: p.readInt64(),
      maxBetSlotPerOption: p.readInt32(),
      currentBetState: [] as number[],
      betResultWonOption: [] as number[],
      betResultOPId: [] as number[],
    };
    for (let i = 0; i < 8; i++) out.optionDesc.push(p.readIdentity());
    for (let i = 0; i < 8; i++) out.oracleProviderId.push(p.readIdentity());
    for (let i = 0; i < 8; i++) out.oracleFees.push(p.readInt32());
    for (let i = 0; i < 8; i++) out.currentBetState.push(p.readInt32());
    for (let i = 0; i < 8; i++) out.betResultWonOption.push(p.readByte());
    for (let i = 0; i < 8; i++) out.betResultOPId.push(p.readByte());
    return out;
  },

  /** getBetOptionDetail(betId, betOption) -> bettor[1024], inputType = 3 */
  async getBetOptionDetail(
    client: QubicLiveClient,
    betId: number,
    betOption: number,
  ) {
    const q = createQuery(QUBIC_CONTRACTS.QUOTTERY, 3)
      .addInt32(betId)
      .addInt32(betOption);
    const r = await q.execute(client);
    const p = parseResponse(r.responseData);
    const bettors: string[] = [];
    for (let i = 0; i < 1024; i++) {
      const id = p.readIdentity();
      if (id) bettors.push(id);
    }
    return { bettors };
  },

  /** getActiveBet() -> count + activeBetId[1024], inputType = 4 */
  async getActiveBet(client: QubicLiveClient) {
    const q = createQuery(QUBIC_CONTRACTS.QUOTTERY, 4);
    const r = await q.execute(client);
    const p = parseResponse(r.responseData);
    const count = p.readInt32();
    const ids: number[] = [];
    for (let i = 0; i < 1024; i++) ids.push(p.readInt32());
    return { count, activeBetId: ids.slice(0, count) };
  },

  /** getBetByCreator(creator) -> count + betId[1024], inputType = 5 */
  async getBetByCreator(client: QubicLiveClient, creator: string) {
    const q = createQuery(QUBIC_CONTRACTS.QUOTTERY, 5).addIdentity(creator);
    const r = await q.execute(client);
    const p = parseResponse(r.responseData);
    const count = p.readInt32();
    const ids: number[] = [];
    for (let i = 0; i < 1024; i++) ids.push(p.readInt32());
    return { count, betId: ids.slice(0, count) };
  },
};

// RANDOM contract exposes only a procedure (RevealAndCommit) and no user functions.
// Left intentionally without easy query wrappers.

/**
 * QEARN (Earning/Staking Platform) Contract
 * Based on src/contracts/Qearn.h REGISTER_USER_FUNCTION indices
 */
export const qearn = {
  /** getLockInfoPerEpoch(epoch) -> five uint64 fields, inputType = 1 */
  async getLockInfoPerEpoch(client: QubicLiveClient, epoch: number) {
    const q = createQuery(QUBIC_CONTRACTS.QEARN, 1).addInt32(epoch);
    const r = await q.execute(client);
    const p = parseResponse(r.responseData);
    return {
      lockedAmount: p.readInt64(),
      bonusAmount: p.readInt64(),
      currentLockedAmount: p.readInt64(),
      currentBonusAmount: p.readInt64(),
      yield: p.readInt64(),
    };
  },

  /** getUserLockedInfo(user, epoch) -> lockedAmount, inputType = 2 */
  async getUserLockedInfo(
    client: QubicLiveClient,
    user: string,
    epoch: number,
  ) {
    const q = createQuery(QUBIC_CONTRACTS.QEARN, 2)
      .addIdentity(user)
      .addInt32(epoch);
    const r = await q.execute(client);
    const p = parseResponse(r.responseData);
    return { lockedAmount: p.readInt64() };
  },

  /** getStateOfRound(epoch) -> state(uint32), inputType = 3 */
  async getStateOfRound(client: QubicLiveClient, epoch: number) {
    const q = createQuery(QUBIC_CONTRACTS.QEARN, 3).addInt32(epoch);
    const r = await q.execute(client);
    const p = parseResponse(r.responseData);
    return { state: p.readInt32() };
  },

  /** getUserLockStatus(user) -> status(uint64 bitset), inputType = 4 */
  async getUserLockStatus(client: QubicLiveClient, user: string) {
    const q = createQuery(QUBIC_CONTRACTS.QEARN, 4).addIdentity(user);
    const r = await q.execute(client);
    const p = parseResponse(r.responseData);
    return { status: p.readInt64() };
  },

  /** getEndedStatus(user) -> four uint64 fields, inputType = 5 */
  async getEndedStatus(client: QubicLiveClient, user: string) {
    const q = createQuery(QUBIC_CONTRACTS.QEARN, 5).addIdentity(user);
    const r = await q.execute(client);
    const p = parseResponse(r.responseData);
    return {
      fullyUnlockedAmount: p.readInt64(),
      fullyRewardedAmount: p.readInt64(),
      earlyUnlockedAmount: p.readInt64(),
      earlyRewardedAmount: p.readInt64(),
    };
  },

  /** getStatsPerEpoch(epoch) -> four uint64 fields, inputType = 6 */
  async getStatsPerEpoch(client: QubicLiveClient, epoch: number) {
    const q = createQuery(QUBIC_CONTRACTS.QEARN, 6).addInt32(epoch);
    const r = await q.execute(client);
    const p = parseResponse(r.responseData);
    return {
      earlyUnlockedAmount: p.readInt64(),
      earlyUnlockedPercent: p.readInt64(),
      totalLockedAmount: p.readInt64(),
      averageAPY: p.readInt64(),
    };
  },

  /** getBurnedAndBoostedStats() -> six uint64 fields, inputType = 7 */
  async getBurnedAndBoostedStats(client: QubicLiveClient) {
    const q = createQuery(QUBIC_CONTRACTS.QEARN, 7);
    const r = await q.execute(client);
    const p = parseResponse(r.responseData);
    return {
      burnedAmount: p.readInt64(),
      averageBurnedPercent: p.readInt64(),
      boostedAmount: p.readInt64(),
      averageBoostedPercent: p.readInt64(),
      rewardedAmount: p.readInt64(),
      averageRewardedPercent: p.readInt64(),
    };
  },

  /** getBurnedAndBoostedStatsPerEpoch(epoch) -> six uint64 fields, inputType = 8 */
  async getBurnedAndBoostedStatsPerEpoch(
    client: QubicLiveClient,
    epoch: number,
  ) {
    const q = createQuery(QUBIC_CONTRACTS.QEARN, 8).addInt32(epoch);
    const r = await q.execute(client);
    const p = parseResponse(r.responseData);
    return {
      burnedAmount: p.readInt64(),
      burnedPercent: p.readInt64(),
      boostedAmount: p.readInt64(),
      boostedPercent: p.readInt64(),
      rewardedAmount: p.readInt64(),
      rewardedPercent: p.readInt64(),
    };
  },
};

/**
 * QSWAP (Token Swap) Contract
 * Based on src/contracts/Qswap.h REGISTER_USER_FUNCTION indices
 */
export const qswap = {
  /** Fees() -> fee fields, inputType = 1 */
  async getFees(client: QubicLiveClient) {
    const q = createQuery(QUBIC_CONTRACTS.QSWAP, 1);
    const r = await q.execute(client);
    const p = parseResponse(r.responseData);
    return {
      assetIssuanceFee: p.readInt32(),
      poolCreationFee: p.readInt32(),
      transferFee: p.readInt32(),
      swapFee: p.readInt32(),
      protocolFee: p.readInt32(),
      teamFee: p.readInt32(),
    };
  },

  /** GetPoolBasicState(assetIssuer, assetName) -> state, inputType = 2 */
  async getPoolBasicState(
    client: QubicLiveClient,
    assetIssuer: string,
    assetName: bigint | number,
  ) {
    const q = createQuery(QUBIC_CONTRACTS.QSWAP, 2)
      .addIdentity(assetIssuer)
      .addInt64(assetName);
    const r = await q.execute(client);
    const p = parseResponse(r.responseData);
    return {
      poolExists: p.readInt64(),
      reservedQuAmount: p.readInt64(),
      reservedAssetAmount: p.readInt64(),
      totalLiquidity: p.readInt64(),
    };
  },

  /** GetLiquidityOf(assetIssuer, assetName, account) -> liquidity, inputType = 3 */
  async getLiquidityOf(
    client: QubicLiveClient,
    assetIssuer: string,
    assetName: bigint | number,
    account: string,
  ) {
    const q = createQuery(QUBIC_CONTRACTS.QSWAP, 3)
      .addIdentity(assetIssuer)
      .addInt64(assetName)
      .addIdentity(account);
    const r = await q.execute(client);
    const p = parseResponse(r.responseData);
    return { liquidity: p.readInt64() };
  },

  /** QuoteExactQuInput(assetIssuer, assetName, quAmountIn) -> assetAmountOut, inputType = 4 */
  async quoteExactQuInput(
    client: QubicLiveClient,
    assetIssuer: string,
    assetName: bigint | number,
    quAmountIn: bigint | number,
  ) {
    const q = createQuery(QUBIC_CONTRACTS.QSWAP, 4)
      .addIdentity(assetIssuer)
      .addInt64(assetName)
      .addInt64(quAmountIn);
    const r = await q.execute(client);
    const p = parseResponse(r.responseData);
    return { assetAmountOut: p.readInt64() };
  },

  /** QuoteExactQuOutput(assetIssuer, assetName, quAmountOut) -> assetAmountIn, inputType = 5 */
  async quoteExactQuOutput(
    client: QubicLiveClient,
    assetIssuer: string,
    assetName: bigint | number,
    quAmountOut: bigint | number,
  ) {
    const q = createQuery(QUBIC_CONTRACTS.QSWAP, 5)
      .addIdentity(assetIssuer)
      .addInt64(assetName)
      .addInt64(quAmountOut);
    const r = await q.execute(client);
    const p = parseResponse(r.responseData);
    return { assetAmountIn: p.readInt64() };
  },

  /** QuoteExactAssetInput(assetIssuer, assetName, assetAmountIn) -> quAmountOut, inputType = 6 */
  async quoteExactAssetInput(
    client: QubicLiveClient,
    assetIssuer: string,
    assetName: bigint | number,
    assetAmountIn: bigint | number,
  ) {
    const q = createQuery(QUBIC_CONTRACTS.QSWAP, 6)
      .addIdentity(assetIssuer)
      .addInt64(assetName)
      .addInt64(assetAmountIn);
    const r = await q.execute(client);
    const p = parseResponse(r.responseData);
    return { quAmountOut: p.readInt64() };
  },

  /** QuoteExactAssetOutput(assetIssuer, assetName, assetAmountOut) -> quAmountIn, inputType = 7 */
  async quoteExactAssetOutput(
    client: QubicLiveClient,
    assetIssuer: string,
    assetName: bigint | number,
    assetAmountOut: bigint | number,
  ) {
    const q = createQuery(QUBIC_CONTRACTS.QSWAP, 7)
      .addIdentity(assetIssuer)
      .addInt64(assetName)
      .addInt64(assetAmountOut);
    const r = await q.execute(client);
    const p = parseResponse(r.responseData);
    return { quAmountIn: p.readInt64() };
  },

  /** TeamInfo() -> teamFee(uint32), teamId(id), inputType = 8 */
  async getTeamInfo(client: QubicLiveClient) {
    const q = createQuery(QUBIC_CONTRACTS.QSWAP, 8);
    const r = await q.execute(client);
    const p = parseResponse(r.responseData);
    return { teamFee: p.readInt32(), teamId: p.readIdentity() };
  },
};

/**
 * QVAULT (Vault) Contract
 * Based on src/contracts/QVAULT.h REGISTER_USER_FUNCTION indices
 */
export const qvault = {
  /** getData() -> contract state summary, inputType = 1 */
  async getData(client: QubicLiveClient) {
    const q = createQuery(QUBIC_CONTRACTS.QVAULT, 1);
    const r = await q.execute(client);
    const p = parseResponse(r.responseData);
    const numberOfBannedAddress = p.readInt64();
    const shareholderDividend = p.readInt32();
    const QCAPHolderPermille = p.readInt32();
    const reinvestingPermille = p.readInt32();
    const devPermille = p.readInt32();
    const readId = () => p.readIdentity();
    return {
      numberOfBannedAddress,
      shareholderDividend,
      QCAPHolderPermille,
      reinvestingPermille,
      devPermille,
      authAddress1: readId(),
      authAddress2: readId(),
      authAddress3: readId(),
      reinvestingAddress: readId(),
      adminAddress: readId(),
      newAuthAddress1: readId(),
      newAuthAddress2: readId(),
      newAuthAddress3: readId(),
      newReinvestingAddress1: readId(),
      newReinvestingAddress2: readId(),
      newReinvestingAddress3: readId(),
      newAdminAddress1: readId(),
      newAdminAddress2: readId(),
      newAdminAddress3: readId(),
      bannedAddress1: readId(),
      bannedAddress2: readId(),
      bannedAddress3: readId(),
      unbannedAddress1: readId(),
      unbannedAddress2: readId(),
      unbannedAddress3: readId(),
    };
  },
};

/**
 * CCF (Computor Controlled Fund) Contract
 * Based on src/contracts/ComputorControlledFund.h REGISTER_USER_FUNCTION indices
 */
export const ccf = {
  /** GetProposalIndices(active, prevIndex) -> { numOfIndices, indices[] }, inputType = 1 */
  async getProposalIndices(
    client: QubicLiveClient,
    params: { activeProposals: boolean; prevProposalIndex: number },
  ) {
    const q = createQuery(QUBIC_CONTRACTS.CCF, 1)
      .addByte(params.activeProposals ? 1 : 0)
      .addInt32(params.prevProposalIndex);
    const r = await q.execute(client);
    const p = parseResponse(r.responseData);
    const numOfIndices = p.readInt16();
    const indices: number[] = [];
    for (let i = 0; i < 64; i++) indices.push(p.readInt16());
    return { numOfIndices, indices: indices.slice(0, numOfIndices) };
  },

  /** GetProposal(index) -> proposal data, inputType = 2 */
  async getProposal(client: QubicLiveClient, index: number) {
    const q = createQuery(QUBIC_CONTRACTS.CCF, 2).addInt16(index);
    const r = await q.execute(client);
    return { raw: r.responseData, parser: parseResponse(r.responseData) };
  },

  /** GetVote(index) -> vote data, inputType = 3 */
  async getVote(client: QubicLiveClient, index: number) {
    const q = createQuery(QUBIC_CONTRACTS.CCF, 3).addInt16(index);
    const r = await q.execute(client);
    return { raw: r.responseData, parser: parseResponse(r.responseData) };
  },

  /** GetVotingResults(index) -> results, inputType = 4 */
  async getVotingResults(client: QubicLiveClient, index: number) {
    const q = createQuery(QUBIC_CONTRACTS.CCF, 4).addInt16(index);
    const r = await q.execute(client);
    return { raw: r.responseData, parser: parseResponse(r.responseData) };
  },

  /** GetLatestTransfers() -> latest transfers, inputType = 5 */
  async getLatestTransfers(client: QubicLiveClient) {
    const q = createQuery(QUBIC_CONTRACTS.CCF, 5);
    const r = await q.execute(client);
    return { raw: r.responseData, parser: parseResponse(r.responseData) };
  },

  /** GetProposalFee() -> fee(uint32), inputType = 6 */
  async getProposalFee(client: QubicLiveClient) {
    const q = createQuery(QUBIC_CONTRACTS.CCF, 6);
    const r = await q.execute(client);
    const p = parseResponse(r.responseData);
    return { proposalFee: p.readInt32() };
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
  parseFn?: (parser: ReturnType<typeof parseResponse>) => T,
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
  inputType: number,
) {
  const query = createQuery(contractIndex, inputType);
  const response = await query.execute(client);
  return {
    raw: response.responseData,
    parser: parseResponse(response.responseData),
    response,
  };
}
