/**
 * React Query integration for Qubic blockchain
 * @module react/query
 */

// Export all hooks
export {
  qubicQueryKeys,
  useCurrentTick,
  useTick,
  useTransactionsForIdentity,
  useBalance,
  useComputorList,
  useEntity,
  useArchivedTick,
  useBroadcastTransaction,
  useProcedureCall,
  useTickPoller,
  useBalancePoller,
} from "./hooks.ts";

// Export contract and procedure hooks
export {
  contractQueryKeys,
  useContractQuery,
  useContractQueryWithParser,
  useContractQueryBuilder,
  useProcedureBuilder,
  useExecuteProcedure,
  useSignProcedure,
  useQXQuery,
  useQearnQuery,
  useQuotteryQuery,
  useRandomQuery,
  type ContractQueryResult,
  type ProcedureExecutionParams,
} from "./contracts.ts";

// Export easy contract hooks
export {
  easyContractQueryKeys,
  // QX
  useQXFees,
  useQXAssetAskOrders,
  useQXAssetBidOrders,
  useQXEntityAskOrders,
  useQXEntityBidOrders,
  // Qutil
  useQutilSendToManyV1Fee,
  useQutilTotalAssetShares,
  useQutilCurrentResult,
  useQutilPollsByCreator,
  useQutilCurrentPollId,
  useQutilPollInfo,
  // Quottery
  useQuotteryBasicInfo,
  useQuotteryBetInfo,
  useQuotteryBetOptionDetail,
  useQuotteryActiveBet,
  useQuotteryBetByCreator,
  // Qearn
  useQearnLockInfoPerEpoch,
  useQearnUserLockedInfo,
  useQearnStateOfRound,
  useQearnUserLockStatus,
  useQearnEndedStatus,
  useQearnStatsPerEpoch,
  useQearnBurnedAndBoostedStats,
  useQearnBurnedAndBoostedStatsPerEpoch,
  // Qswap
  useQswapFees,
  useQswapPoolBasicState,
  useQswapLiquidityOf,
  useQswapQuoteExactQuInput,
  useQswapQuoteExactQuOutput,
  useQswapQuoteExactAssetInput,
  useQswapQuoteExactAssetOutput,
  useQswapTeamInfo,
  // Qvault
  useQvaultData,
  // CCF
  useCCFProposalIndices,
  useCCFProposal,
  useCCFVote,
  useCCFVotingResults,
  useCCFLatestTransfers,
  useCCFProposalFee,
} from "./contracts-easy.ts";

// Export WalletConnect transaction hooks
export {
  useWCSignTransaction,
  useWCSignAndBroadcast,
  useWCSignProcedure,
  useWCSignAndBroadcastProcedure,
  useWCRequestAccounts,
  useWCDisconnect,
  useWCSendQubic,
  useWCExecuteContract,
  useWCTransactionFlow,
  type SignTransactionParams,
  type SignAndBroadcastParams,
  type SignProcedureParams,
  type SignAndBroadcastProcedureParams,
} from "./walletconnect.ts";

export {
  QubicQueryProvider,
  QubicReactQueryProvider,
  defaultQueryClientConfig,
  type QubicQueryProviderProps,
} from "./provider.tsx";
