/**
 * React Query hooks for easy smart contract queries
 * Wraps the contracts-easy.ts functions with React Query
 * @module react/query/contracts-easy
 */

import {
  useQuery,
  type UseQueryOptions,
  type QueryKey,
} from "@tanstack/react-query";
import { useQubic } from "../providers";
import {
  qx,
  qutil,
  quottery,
  qearn,
  qswap,
  qvault,
  ccf,
} from "../../utils/contracts-easy";

// ===== Query Keys =====

export const easyContractQueryKeys = {
  all: ["easy-contract"] as const,

  // QX Exchange
  qx: () => [...easyContractQueryKeys.all, "qx"] as const,
  qxFees: () => [...easyContractQueryKeys.qx(), "fees"] as const,
  qxAssetAskOrders: (
    issuer: string,
    assetName: string | bigint,
    offset?: string | bigint,
  ) =>
    [
      ...easyContractQueryKeys.qx(),
      "asset-ask-orders",
      issuer,
      String(assetName),
      String(offset ?? 0),
    ] as const,
  qxAssetBidOrders: (
    issuer: string,
    assetName: string | bigint,
    offset?: string | bigint,
  ) =>
    [
      ...easyContractQueryKeys.qx(),
      "asset-bid-orders",
      issuer,
      String(assetName),
      String(offset ?? 0),
    ] as const,
  qxEntityAskOrders: (entity: string, offset?: string | bigint) =>
    [
      ...easyContractQueryKeys.qx(),
      "entity-ask-orders",
      entity,
      String(offset ?? 0),
    ] as const,
  qxEntityBidOrders: (entity: string, offset?: string | bigint) =>
    [
      ...easyContractQueryKeys.qx(),
      "entity-bid-orders",
      entity,
      String(offset ?? 0),
    ] as const,

  // Qutil
  qutil: () => [...easyContractQueryKeys.all, "qutil"] as const,
  qutilSendToManyV1Fee: () =>
    [...easyContractQueryKeys.qutil(), "send-to-many-v1-fee"] as const,
  qutilTotalAssetShares: (issuer: string, assetName: string | bigint) =>
    [
      ...easyContractQueryKeys.qutil(),
      "total-asset-shares",
      issuer,
      String(assetName),
    ] as const,
  qutilCurrentResult: () =>
    [...easyContractQueryKeys.qutil(), "current-result"] as const,
  qutilPollsByCreator: (creator: string) =>
    [...easyContractQueryKeys.qutil(), "polls-by-creator", creator] as const,
  qutilCurrentPollId: () =>
    [...easyContractQueryKeys.qutil(), "current-poll-id"] as const,
  qutilPollInfo: (pollId: number) =>
    [...easyContractQueryKeys.qutil(), "poll-info", pollId] as const,

  // Quottery
  quottery: () => [...easyContractQueryKeys.all, "quottery"] as const,
  quotteryBasicInfo: () =>
    [...easyContractQueryKeys.quottery(), "basic-info"] as const,
  quotteryBetInfo: (betId: number) =>
    [...easyContractQueryKeys.quottery(), "bet-info", betId] as const,
  quotteryBetOptionDetail: (betId: number, optionId: number) =>
    [
      ...easyContractQueryKeys.quottery(),
      "bet-option-detail",
      betId,
      optionId,
    ] as const,
  quotteryActiveBet: () =>
    [...easyContractQueryKeys.quottery(), "active-bet"] as const,
  quotteryBetByCreator: (creator: string) =>
    [...easyContractQueryKeys.quottery(), "bet-by-creator", creator] as const,

  // Qearn
  qearn: () => [...easyContractQueryKeys.all, "qearn"] as const,
  qearnLockInfoPerEpoch: (epoch: number) =>
    [...easyContractQueryKeys.qearn(), "lock-info-per-epoch", epoch] as const,
  qearnUserLockedInfo: (user: string) =>
    [...easyContractQueryKeys.qearn(), "user-locked-info", user] as const,
  qearnStateOfRound: (epoch: number) =>
    [...easyContractQueryKeys.qearn(), "state-of-round", epoch] as const,
  qearnUserLockStatus: (user: string, epoch: number) =>
    [
      ...easyContractQueryKeys.qearn(),
      "user-lock-status",
      user,
      epoch,
    ] as const,
  qearnEndedStatus: (epoch: number) =>
    [...easyContractQueryKeys.qearn(), "ended-status", epoch] as const,
  qearnStatsPerEpoch: (epoch: number) =>
    [...easyContractQueryKeys.qearn(), "stats-per-epoch", epoch] as const,
  qearnBurnedAndBoostedStats: () =>
    [...easyContractQueryKeys.qearn(), "burned-and-boosted-stats"] as const,
  qearnBurnedAndBoostedStatsPerEpoch: (epoch: number) =>
    [
      ...easyContractQueryKeys.qearn(),
      "burned-and-boosted-stats-per-epoch",
      epoch,
    ] as const,

  // Qswap
  qswap: () => [...easyContractQueryKeys.all, "qswap"] as const,
  qswapFees: () => [...easyContractQueryKeys.qswap(), "fees"] as const,
  qswapPoolBasicState: (issuer: string, assetName: string | bigint) =>
    [
      ...easyContractQueryKeys.qswap(),
      "pool-basic-state",
      issuer,
      String(assetName),
    ] as const,
  qswapLiquidityOf: (
    issuer: string,
    assetName: string | bigint,
    provider: string,
  ) =>
    [
      ...easyContractQueryKeys.qswap(),
      "liquidity-of",
      issuer,
      String(assetName),
      provider,
    ] as const,
  qswapQuoteExactQuInput: (
    issuer: string,
    assetName: string | bigint,
    quAmount: string | bigint,
  ) =>
    [
      ...easyContractQueryKeys.qswap(),
      "quote-exact-qu-input",
      issuer,
      String(assetName),
      String(quAmount),
    ] as const,
  qswapQuoteExactQuOutput: (
    issuer: string,
    assetName: string | bigint,
    quAmount: string | bigint,
  ) =>
    [
      ...easyContractQueryKeys.qswap(),
      "quote-exact-qu-output",
      issuer,
      String(assetName),
      String(quAmount),
    ] as const,
  qswapQuoteExactAssetInput: (
    issuer: string,
    assetName: string | bigint,
    assetAmount: string | bigint,
  ) =>
    [
      ...easyContractQueryKeys.qswap(),
      "quote-exact-asset-input",
      issuer,
      String(assetName),
      String(assetAmount),
    ] as const,
  qswapQuoteExactAssetOutput: (
    issuer: string,
    assetName: string | bigint,
    assetAmount: string | bigint,
  ) =>
    [
      ...easyContractQueryKeys.qswap(),
      "quote-exact-asset-output",
      issuer,
      String(assetName),
      String(assetAmount),
    ] as const,
  qswapTeamInfo: () => [...easyContractQueryKeys.qswap(), "team-info"] as const,

  // Qvault
  qvault: () => [...easyContractQueryKeys.all, "qvault"] as const,
  qvaultData: (identity: string) =>
    [...easyContractQueryKeys.qvault(), "data", identity] as const,

  // CCF
  ccf: () => [...easyContractQueryKeys.all, "ccf"] as const,
  ccfProposalIndices: () =>
    [...easyContractQueryKeys.ccf(), "proposal-indices"] as const,
  ccfProposal: (proposalIndex: number) =>
    [...easyContractQueryKeys.ccf(), "proposal", proposalIndex] as const,
  ccfVote: (proposalIndex: number) =>
    [...easyContractQueryKeys.ccf(), "vote", proposalIndex] as const,
  ccfVotingResults: (proposalIndex: number) =>
    [...easyContractQueryKeys.ccf(), "voting-results", proposalIndex] as const,
  ccfLatestTransfers: () =>
    [...easyContractQueryKeys.ccf(), "latest-transfers"] as const,
  ccfProposalFee: () =>
    [...easyContractQueryKeys.ccf(), "proposal-fee"] as const,
} as const;

// ===== QX Hooks =====

export function useQXFees(
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof qx.getFees>>,
      Error,
      Awaited<ReturnType<typeof qx.getFees>>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { live } = useQubic();
  return useQuery({
    queryKey: easyContractQueryKeys.qxFees(),
    queryFn: () => qx.getFees(live),
    staleTime: 60000, // 1 minute
    ...options,
  });
}

export function useQXAssetAskOrders(
  issuer: string,
  assetName: bigint | number,
  offset: bigint | number = 0,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof qx.getAssetAskOrders>>,
      Error,
      Awaited<ReturnType<typeof qx.getAssetAskOrders>>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { live } = useQubic();
  return useQuery({
    queryKey: easyContractQueryKeys.qxAssetAskOrders(
      issuer,
      String(assetName),
      String(offset),
    ),
    queryFn: () => qx.getAssetAskOrders(live, issuer, assetName, offset),
    enabled: !!issuer && options?.enabled !== false,
    staleTime: 5000, // 5 seconds
    ...options,
  });
}

export function useQXAssetBidOrders(
  issuer: string,
  assetName: bigint | number,
  offset: bigint | number = 0,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof qx.getAssetBidOrders>>,
      Error,
      Awaited<ReturnType<typeof qx.getAssetBidOrders>>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { live } = useQubic();
  return useQuery({
    queryKey: easyContractQueryKeys.qxAssetBidOrders(
      issuer,
      String(assetName),
      String(offset),
    ),
    queryFn: () => qx.getAssetBidOrders(live, issuer, assetName, offset),
    enabled: !!issuer && options?.enabled !== false,
    staleTime: 5000, // 5 seconds
    ...options,
  });
}

export function useQXEntityAskOrders(
  entity: string,
  offset: bigint | number = 0,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof qx.getEntityAskOrders>>,
      Error,
      Awaited<ReturnType<typeof qx.getEntityAskOrders>>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { live } = useQubic();
  return useQuery({
    queryKey: easyContractQueryKeys.qxEntityAskOrders(entity, String(offset)),
    queryFn: () => qx.getEntityAskOrders(live, entity, offset),
    enabled: !!entity && options?.enabled !== false,
    staleTime: 5000, // 5 seconds
    ...options,
  });
}

export function useQXEntityBidOrders(
  entity: string,
  offset: bigint | number = 0,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof qx.getEntityBidOrders>>,
      Error,
      Awaited<ReturnType<typeof qx.getEntityBidOrders>>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { live } = useQubic();
  return useQuery({
    queryKey: easyContractQueryKeys.qxEntityBidOrders(entity, String(offset)),
    queryFn: () => qx.getEntityBidOrders(live, entity, offset),
    enabled: !!entity && options?.enabled !== false,
    staleTime: 5000, // 5 seconds
    ...options,
  });
}

// ===== Qutil Hooks =====

export function useQutilSendToManyV1Fee(
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof qutil.getSendToManyV1Fee>>,
      Error,
      Awaited<ReturnType<typeof qutil.getSendToManyV1Fee>>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { live } = useQubic();
  return useQuery({
    queryKey: easyContractQueryKeys.qutilSendToManyV1Fee(),
    queryFn: () => qutil.getSendToManyV1Fee(live),
    staleTime: 60000, // 1 minute
    ...options,
  });
}

export function useQutilTotalAssetShares(
  issuer: string,
  assetName: bigint | number,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof qutil.getTotalNumberOfAssetShares>>,
      Error,
      Awaited<ReturnType<typeof qutil.getTotalNumberOfAssetShares>>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { live } = useQubic();
  return useQuery({
    queryKey: easyContractQueryKeys.qutilTotalAssetShares(
      issuer,
      String(assetName),
    ),
    queryFn: () =>
      qutil.getTotalNumberOfAssetShares(live, { issuer, assetName }),
    enabled: !!issuer && options?.enabled !== false,
    staleTime: 10000, // 10 seconds
    ...options,
  });
}

export function useQutilCurrentResult(
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof qutil.getCurrentResult>>,
      Error,
      Awaited<ReturnType<typeof qutil.getCurrentResult>>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { live } = useQubic();
  return useQuery({
    queryKey: easyContractQueryKeys.qutilCurrentResult(),
    queryFn: () => qutil.getCurrentResult(live, 0),
    staleTime: 5000, // 5 seconds
    ...options,
  });
}

export function useQutilPollsByCreator(
  creator: string,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof qutil.getPollsByCreator>>,
      Error,
      Awaited<ReturnType<typeof qutil.getPollsByCreator>>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { live } = useQubic();
  return useQuery({
    queryKey: easyContractQueryKeys.qutilPollsByCreator(creator),
    queryFn: () => qutil.getPollsByCreator(live, creator),
    enabled: !!creator && options?.enabled !== false,
    staleTime: 10000, // 10 seconds
    ...options,
  });
}

export function useQutilCurrentPollId(
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof qutil.getCurrentPollId>>,
      Error,
      Awaited<ReturnType<typeof qutil.getCurrentPollId>>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { live } = useQubic();
  return useQuery({
    queryKey: easyContractQueryKeys.qutilCurrentPollId(),
    queryFn: () => qutil.getCurrentPollId(live),
    staleTime: 5000, // 5 seconds
    ...options,
  });
}

export function useQutilPollInfo(
  pollId: number,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof qutil.getPollInfo>>,
      Error,
      Awaited<ReturnType<typeof qutil.getPollInfo>>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { live } = useQubic();
  return useQuery({
    queryKey: easyContractQueryKeys.qutilPollInfo(pollId),
    queryFn: () => qutil.getPollInfo(live, pollId),
    enabled: pollId > 0 && options?.enabled !== false,
    staleTime: Infinity, // Historical data
    ...options,
  });
}

// ===== Quottery Hooks =====

export function useQuotteryBasicInfo(
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof quottery.basicInfo>>,
      Error,
      Awaited<ReturnType<typeof quottery.basicInfo>>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { live } = useQubic();
  return useQuery({
    queryKey: easyContractQueryKeys.quotteryBasicInfo(),
    queryFn: () => quottery.basicInfo(live),
    staleTime: 10000, // 10 seconds
    ...options,
  });
}

export function useQuotteryBetInfo(
  betId: number,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof quottery.getBetInfo>>,
      Error,
      Awaited<ReturnType<typeof quottery.getBetInfo>>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { live } = useQubic();
  return useQuery({
    queryKey: easyContractQueryKeys.quotteryBetInfo(betId),
    queryFn: () => quottery.getBetInfo(live, betId),
    enabled: betId > 0 && options?.enabled !== false,
    staleTime: 5000, // 5 seconds
    ...options,
  });
}

export function useQuotteryBetOptionDetail(
  betId: number,
  optionId: number,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof quottery.getBetOptionDetail>>,
      Error,
      Awaited<ReturnType<typeof quottery.getBetOptionDetail>>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { live } = useQubic();
  return useQuery({
    queryKey: easyContractQueryKeys.quotteryBetOptionDetail(betId, optionId),
    queryFn: () => quottery.getBetOptionDetail(live, betId, optionId),
    enabled: betId > 0 && optionId >= 0 && options?.enabled !== false,
    staleTime: 5000, // 5 seconds
    ...options,
  });
}

export function useQuotteryActiveBet(
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof quottery.getActiveBet>>,
      Error,
      Awaited<ReturnType<typeof quottery.getActiveBet>>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { live } = useQubic();
  return useQuery({
    queryKey: easyContractQueryKeys.quotteryActiveBet(),
    queryFn: () => quottery.getActiveBet(live),
    staleTime: 5000, // 5 seconds
    ...options,
  });
}

export function useQuotteryBetByCreator(
  creator: string,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof quottery.getBetByCreator>>,
      Error,
      Awaited<ReturnType<typeof quottery.getBetByCreator>>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { live } = useQubic();
  return useQuery({
    queryKey: easyContractQueryKeys.quotteryBetByCreator(creator),
    queryFn: () => quottery.getBetByCreator(live, creator),
    enabled: !!creator && options?.enabled !== false,
    staleTime: 10000, // 10 seconds
    ...options,
  });
}

// ===== Qearn Hooks =====

export function useQearnLockInfoPerEpoch(
  epoch: number,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof qearn.getLockInfoPerEpoch>>,
      Error,
      Awaited<ReturnType<typeof qearn.getLockInfoPerEpoch>>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { live } = useQubic();
  return useQuery({
    queryKey: easyContractQueryKeys.qearnLockInfoPerEpoch(epoch),
    queryFn: () => qearn.getLockInfoPerEpoch(live, epoch),
    enabled: epoch > 0 && options?.enabled !== false,
    staleTime: Infinity, // Historical data
    ...options,
  });
}

export function useQearnUserLockedInfo(
  user: string,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof qearn.getUserLockedInfo>>,
      Error,
      Awaited<ReturnType<typeof qearn.getUserLockedInfo>>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { live } = useQubic();
  return useQuery({
    queryKey: easyContractQueryKeys.qearnUserLockedInfo(user),
    queryFn: () => qearn.getUserLockedInfo(live, user, 0),
    enabled: !!user && options?.enabled !== false,
    staleTime: 5000, // 5 seconds
    ...options,
  });
}

export function useQearnStateOfRound(
  epoch: number,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof qearn.getStateOfRound>>,
      Error,
      Awaited<ReturnType<typeof qearn.getStateOfRound>>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { live } = useQubic();
  return useQuery({
    queryKey: easyContractQueryKeys.qearnStateOfRound(epoch),
    queryFn: () => qearn.getStateOfRound(live, epoch),
    enabled: epoch > 0 && options?.enabled !== false,
    staleTime: 5000, // 5 seconds
    ...options,
  });
}

export function useQearnUserLockStatus(
  user: string,
  epoch: number,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof qearn.getUserLockStatus>>,
      Error,
      Awaited<ReturnType<typeof qearn.getUserLockStatus>>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { live } = useQubic();
  return useQuery({
    queryKey: easyContractQueryKeys.qearnUserLockStatus(user, epoch),
    queryFn: () => qearn.getUserLockStatus(live, user),
    enabled: !!user && epoch > 0 && options?.enabled !== false,
    staleTime: 5000, // 5 seconds
    ...options,
  });
}

export function useQearnEndedStatus(
  epoch: number,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof qearn.getEndedStatus>>,
      Error,
      Awaited<ReturnType<typeof qearn.getEndedStatus>>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { live } = useQubic();
  return useQuery({
    queryKey: easyContractQueryKeys.qearnEndedStatus(epoch),
    queryFn: () => qearn.getEndedStatus(live, ""),
    enabled: epoch > 0 && options?.enabled !== false,
    staleTime: Infinity, // Historical data
    ...options,
  });
}

export function useQearnStatsPerEpoch(
  epoch: number,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof qearn.getStatsPerEpoch>>,
      Error,
      Awaited<ReturnType<typeof qearn.getStatsPerEpoch>>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { live } = useQubic();
  return useQuery({
    queryKey: easyContractQueryKeys.qearnStatsPerEpoch(epoch),
    queryFn: () => qearn.getStatsPerEpoch(live, epoch),
    enabled: epoch > 0 && options?.enabled !== false,
    staleTime: Infinity, // Historical data
    ...options,
  });
}

export function useQearnBurnedAndBoostedStats(
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof qearn.getBurnedAndBoostedStats>>,
      Error,
      Awaited<ReturnType<typeof qearn.getBurnedAndBoostedStats>>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { live } = useQubic();
  return useQuery({
    queryKey: easyContractQueryKeys.qearnBurnedAndBoostedStats(),
    queryFn: () => qearn.getBurnedAndBoostedStats(live),
    staleTime: 10000, // 10 seconds
    ...options,
  });
}

export function useQearnBurnedAndBoostedStatsPerEpoch(
  epoch: number,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof qearn.getBurnedAndBoostedStatsPerEpoch>>,
      Error,
      Awaited<ReturnType<typeof qearn.getBurnedAndBoostedStatsPerEpoch>>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { live } = useQubic();
  return useQuery({
    queryKey: easyContractQueryKeys.qearnBurnedAndBoostedStatsPerEpoch(epoch),
    queryFn: () => qearn.getBurnedAndBoostedStatsPerEpoch(live, epoch),
    enabled: epoch > 0 && options?.enabled !== false,
    staleTime: Infinity, // Historical data
    ...options,
  });
}

// ===== Qswap Hooks =====

export function useQswapFees(
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof qswap.getFees>>,
      Error,
      Awaited<ReturnType<typeof qswap.getFees>>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { live } = useQubic();
  return useQuery({
    queryKey: easyContractQueryKeys.qswapFees(),
    queryFn: () => qswap.getFees(live),
    staleTime: 60000, // 1 minute
    ...options,
  });
}

export function useQswapPoolBasicState(
  issuer: string,
  assetName: bigint | number,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof qswap.getPoolBasicState>>,
      Error,
      Awaited<ReturnType<typeof qswap.getPoolBasicState>>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { live } = useQubic();
  return useQuery({
    queryKey: easyContractQueryKeys.qswapPoolBasicState(
      issuer,
      String(assetName),
    ),
    queryFn: () => qswap.getPoolBasicState(live, issuer, assetName),
    enabled: !!issuer && options?.enabled !== false,
    staleTime: 5000, // 5 seconds
    ...options,
  });
}

export function useQswapLiquidityOf(
  issuer: string,
  assetName: bigint | number,
  provider: string,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof qswap.getLiquidityOf>>,
      Error,
      Awaited<ReturnType<typeof qswap.getLiquidityOf>>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { live } = useQubic();
  return useQuery({
    queryKey: easyContractQueryKeys.qswapLiquidityOf(
      issuer,
      String(assetName),
      provider,
    ),
    queryFn: () => qswap.getLiquidityOf(live, issuer, assetName, provider),
    enabled: !!issuer && !!provider && options?.enabled !== false,
    staleTime: 5000, // 5 seconds
    ...options,
  });
}

export function useQswapQuoteExactQuInput(
  issuer: string,
  assetName: bigint | number,
  quAmount: bigint | number,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof qswap.quoteExactQuInput>>,
      Error,
      Awaited<ReturnType<typeof qswap.quoteExactQuInput>>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { live } = useQubic();
  return useQuery({
    queryKey: easyContractQueryKeys.qswapQuoteExactQuInput(
      issuer,
      String(assetName),
      String(quAmount),
    ),
    queryFn: () => qswap.quoteExactQuInput(live, issuer, assetName, quAmount),
    enabled: !!issuer && options?.enabled !== false,
    staleTime: 2000, // 2 seconds (price data)
    ...options,
  });
}

export function useQswapQuoteExactQuOutput(
  issuer: string,
  assetName: bigint | number,
  quAmount: bigint | number,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof qswap.quoteExactQuOutput>>,
      Error,
      Awaited<ReturnType<typeof qswap.quoteExactQuOutput>>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { live } = useQubic();
  return useQuery({
    queryKey: easyContractQueryKeys.qswapQuoteExactQuOutput(
      issuer,
      String(assetName),
      String(quAmount),
    ),
    queryFn: () => qswap.quoteExactQuOutput(live, issuer, assetName, quAmount),
    enabled: !!issuer && options?.enabled !== false,
    staleTime: 2000, // 2 seconds (price data)
    ...options,
  });
}

export function useQswapQuoteExactAssetInput(
  issuer: string,
  assetName: bigint | number,
  assetAmount: bigint | number,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof qswap.quoteExactAssetInput>>,
      Error,
      Awaited<ReturnType<typeof qswap.quoteExactAssetInput>>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { live } = useQubic();
  return useQuery({
    queryKey: easyContractQueryKeys.qswapQuoteExactAssetInput(
      issuer,
      String(assetName),
      String(assetAmount),
    ),
    queryFn: () =>
      qswap.quoteExactAssetInput(live, issuer, assetName, assetAmount),
    enabled: !!issuer && options?.enabled !== false,
    staleTime: 2000, // 2 seconds (price data)
    ...options,
  });
}

export function useQswapQuoteExactAssetOutput(
  issuer: string,
  assetName: bigint | number,
  assetAmount: bigint | number,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof qswap.quoteExactAssetOutput>>,
      Error,
      Awaited<ReturnType<typeof qswap.quoteExactAssetOutput>>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { live } = useQubic();
  return useQuery({
    queryKey: easyContractQueryKeys.qswapQuoteExactAssetOutput(
      issuer,
      String(assetName),
      String(assetAmount),
    ),
    queryFn: () =>
      qswap.quoteExactAssetOutput(live, issuer, assetName, assetAmount),
    enabled: !!issuer && options?.enabled !== false,
    staleTime: 2000, // 2 seconds (price data)
    ...options,
  });
}

export function useQswapTeamInfo(
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof qswap.getTeamInfo>>,
      Error,
      Awaited<ReturnType<typeof qswap.getTeamInfo>>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { live } = useQubic();
  return useQuery({
    queryKey: easyContractQueryKeys.qswapTeamInfo(),
    queryFn: () => qswap.getTeamInfo(live),
    staleTime: 60000, // 1 minute
    ...options,
  });
}

// ===== Qvault Hooks =====

export function useQvaultData(
  identity: string,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof qvault.getData>>,
      Error,
      Awaited<ReturnType<typeof qvault.getData>>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { live } = useQubic();
  return useQuery({
    queryKey: easyContractQueryKeys.qvaultData(identity),
    queryFn: () => qvault.getData(live),
    enabled: !!identity && options?.enabled !== false,
    staleTime: 5000, // 5 seconds
    ...options,
  });
}

// ===== CCF Hooks =====

export function useCCFProposalIndices(
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof ccf.getProposalIndices>>,
      Error,
      Awaited<ReturnType<typeof ccf.getProposalIndices>>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { live } = useQubic();
  return useQuery({
    queryKey: easyContractQueryKeys.ccfProposalIndices(),
    queryFn: () =>
      ccf.getProposalIndices(live, {
        activeProposals: true,
        prevProposalIndex: 0,
      }),
    staleTime: 10000, // 10 seconds
    ...options,
  });
}

export function useCCFProposal(
  proposalIndex: number,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof ccf.getProposal>>,
      Error,
      Awaited<ReturnType<typeof ccf.getProposal>>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { live } = useQubic();
  return useQuery({
    queryKey: easyContractQueryKeys.ccfProposal(proposalIndex),
    queryFn: () => ccf.getProposal(live, proposalIndex),
    enabled: proposalIndex >= 0 && options?.enabled !== false,
    staleTime: Infinity, // Historical data
    ...options,
  });
}

export function useCCFVote(
  proposalIndex: number,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof ccf.getVote>>,
      Error,
      Awaited<ReturnType<typeof ccf.getVote>>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { live } = useQubic();
  return useQuery({
    queryKey: easyContractQueryKeys.ccfVote(proposalIndex),
    queryFn: () => ccf.getVote(live, proposalIndex),
    enabled: proposalIndex >= 0 && options?.enabled !== false,
    staleTime: Infinity, // Historical data
    ...options,
  });
}

export function useCCFVotingResults(
  proposalIndex: number,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof ccf.getVotingResults>>,
      Error,
      Awaited<ReturnType<typeof ccf.getVotingResults>>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { live } = useQubic();
  return useQuery({
    queryKey: easyContractQueryKeys.ccfVotingResults(proposalIndex),
    queryFn: () => ccf.getVotingResults(live, proposalIndex),
    enabled: proposalIndex >= 0 && options?.enabled !== false,
    staleTime: 5000, // 5 seconds
    ...options,
  });
}

export function useCCFLatestTransfers(
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof ccf.getLatestTransfers>>,
      Error,
      Awaited<ReturnType<typeof ccf.getLatestTransfers>>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { live } = useQubic();
  return useQuery({
    queryKey: easyContractQueryKeys.ccfLatestTransfers(),
    queryFn: () => ccf.getLatestTransfers(live),
    staleTime: 5000, // 5 seconds
    ...options,
  });
}

export function useCCFProposalFee(
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof ccf.getProposalFee>>,
      Error,
      Awaited<ReturnType<typeof ccf.getProposalFee>>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) {
  const { live } = useQubic();
  return useQuery({
    queryKey: easyContractQueryKeys.ccfProposalFee(),
    queryFn: () => ccf.getProposalFee(live),
    staleTime: 60000, // 1 minute
    ...options,
  });
}
