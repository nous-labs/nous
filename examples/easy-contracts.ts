// Easy smart contract querying examples
// This shows the simplified API for querying Qubic smart contracts

import { QubicLiveClient } from "../src/clients/qubic-live-client.ts";
import { qx, qutil, quottery, qearn, qswap, qvault, ccf, query, simpleQuery } from "../src/utils/contracts-easy.ts";

const client = new QubicLiveClient();

// ===== QX Exchange Examples =====

async function qxExamples() {
  console.log("\n=== QX Exchange ===");

  const issuer = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
  const trader = "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";
  const assetName = 1n;

  const fees = await qx.getFees(client);
  console.log("Fees:", fees);

  const askOrders = await qx.getAssetAskOrders(client, issuer, assetName);
  console.log("Top ask orders:", askOrders.orders.slice(0, 3));

  const bidOrders = await qx.getAssetBidOrders(client, issuer, assetName);
  console.log("Top bid orders:", bidOrders.orders.slice(0, 3));

  const entityAsks = await qx.getEntityAskOrders(client, trader);
  console.log("Entity ask orders:", entityAsks.orders.slice(0, 3));

  const entityBids = await qx.getEntityBidOrders(client, trader);
  console.log("Entity bid orders:", entityBids.orders.slice(0, 3));
}

// ===== QUTIL Examples =====

async function qutilExamples() {
  console.log("\n=== QUTIL ===");

  const sendFee = await qutil.getSendToManyV1Fee(client);
  console.log("SendToMany fee:", sendFee.fee);

  const totalShares = await qutil.getTotalNumberOfAssetShares(client, {
    issuer: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    assetName: 1n,
  });
  console.log("Total shares for asset:", totalShares.totalShares);

  const polls = await qutil.getPollsByCreator(client, "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC");
  console.log("Poll IDs by creator:", polls);

  const currentPolls = await qutil.getCurrentPollId(client);
  console.log("Current poll index:", currentPolls.currentPollId);

  const firstPollInfo = await qutil.getPollInfo(client, 0n);
  console.log("Poll #0 info (might be empty):", firstPollInfo);
}

// ===== QUOTTERY Betting Examples =====

async function quotteryExamples() {
  console.log("\n=== QUOTTERY ===");

  const stats = await quottery.basicInfo(client);
  console.log("Contract stats:", stats);

  const betInfo = await quottery.getBetInfo(client, 1);
  console.log("Bet #1 info:", betInfo);

  const optionDetail = await quottery.getBetOptionDetail(client, 1, 0);
  console.log("Bet #1 option 0 bettors (first 5):", optionDetail.bettors.slice(0, 5));

  const active = await quottery.getActiveBet(client);
  console.log("Active bets count:", active.count);

  const byCreator = await quottery.getBetByCreator(client, "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD");
  console.log("Creator bet IDs (first 5):", byCreator.betId.slice(0, 5));
}

// ===== QEARN Staking Examples =====

async function qearnExamples() {
  console.log("\n=== QEARN ===");

  const epochStats = await qearn.getLockInfoPerEpoch(client, 170);
  console.log("Epoch 170 lock info:", epochStats);

  const user = "EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE";
  const userLocked = await qearn.getUserLockedInfo(client, user, 170);
  console.log("User locked amount at epoch 170:", userLocked.lockedAmount);

  const roundState = await qearn.getStateOfRound(client, 170);
  console.log("Round state:", roundState.state);

  const userStatus = await qearn.getUserLockStatus(client, user);
  console.log("User lock bitmap:", userStatus.status.toString());

  const endedStatus = await qearn.getEndedStatus(client, user);
  console.log("Ended status:", endedStatus);

  const statsPerEpoch = await qearn.getStatsPerEpoch(client, 170);
  console.log("Stats per epoch:", statsPerEpoch);

  const burnedBoosted = await qearn.getBurnedAndBoostedStats(client);
  console.log("Burned/boosted stats:", burnedBoosted);

  const burnedBoostedEpoch = await qearn.getBurnedAndBoostedStatsPerEpoch(client, 170);
  console.log("Burned/boosted stats for epoch 170:", burnedBoostedEpoch);
}

// ===== QSWAP Examples =====

async function qswapExamples() {
  console.log("\n=== QSWAP ===");

  const fees = await qswap.getFees(client);
  console.log("Fees:", fees);

  const poolState = await qswap.getPoolBasicState(
    client,
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    1n,
  );
  console.log("Pool state:", poolState);

  const liquidity = await qswap.getLiquidityOf(
    client,
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    1n,
    "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
  );
  console.log("Liquidity:", liquidity);

  const quToAsset = await qswap.quoteExactQuInput(
    client,
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    1n,
    1000n,
  );
  console.log("Exact qu -> asset:", quToAsset);

  const assetToQu = await qswap.quoteExactAssetInput(
    client,
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    1n,
    1000n,
  );
  console.log("Exact asset -> qu:", assetToQu);

  const teamInfo = await qswap.getTeamInfo(client);
  console.log("Team info:", teamInfo);
}

// ===== QVAULT Examples =====

async function qvaultExamples() {
  console.log("\n=== QVAULT ===");

  const vaultData = await qvault.getData(client);
  console.log("Vault data:", vaultData);
}

// ===== CCF Examples =====

async function ccfExamples() {
  console.log("\n=== CCF ===");

  const indices = await ccf.getProposalIndices(client, {
    activeProposals: true,
    prevProposalIndex: -1,
  });
  console.log("Active proposal indices:", indices);

  if (indices.indices.length > 0) {
    const index = indices.indices[0]!;
    const proposal = await ccf.getProposal(client, index);
    console.log(`Proposal #${index} (raw):`, proposal.raw);

    const vote = await ccf.getVote(client, index);
    console.log(`Vote data for #${index}:`, vote.raw);

    const results = await ccf.getVotingResults(client, index);
    console.log(`Results for #${index}:`, results.raw);
  }

  const latestTransfers = await ccf.getLatestTransfers(client);
  console.log("Latest transfers payload:", latestTransfers.raw);

  const proposalFee = await ccf.getProposalFee(client);
  console.log("Proposal fee:", proposalFee.proposalFee);
}

// ===== Generic Query Examples =====

async function genericExamples() {
  console.log("\n=== Generic Queries ===");

  // Custom query with builder
  const customResult = await query(
    client,
    1, // QX
    1, // Input type
    (q) => {
      q.addInt32(123).addInt64(456n);
    },
    (parser) => ({
      value1: parser.readInt32(),
      value2: parser.readInt64(),
    })
  );
  console.log("Custom query:", customResult);

  // Simple query - no parameters
  const simpleResult = await simpleQuery(client, 1, 0);
  console.log("Simple query:", simpleResult.raw);
}

// ===== Comparison: Old vs New Way =====

async function comparisonExample() {
  console.log("\n=== Old Way vs New Way ===");

  // OLD WAY - lots of boilerplate
  console.log("\nOLD WAY:");
  const { createQuery, parseResponse, QUBIC_CONTRACTS } = await import("../src/utils/smart-contract.ts");

  const oldQuery = createQuery(QUBIC_CONTRACTS.QX, 1);

  const oldResponse = await oldQuery.execute(client);
  const oldParser = parseResponse(oldResponse.responseData);
  const oldResult = {
    assetIssuanceFee: oldParser.readInt32(),
    transferFee: oldParser.readInt32(),
    tradeFee: oldParser.readInt32(),
  };
  console.log("Result:", oldResult);

  // NEW WAY - clean and simple!
  console.log("\nNEW WAY:");
  const newResult = await qx.getFees(client);
  console.log("Result:", newResult);

  console.log("\nMuch easier! ðŸŽ‰");
}

// ===== Run all examples =====

async function main() {
  try {
    console.log("Starting easy contract query examples...");

    // Uncomment the examples you want to run:

    // await qxExamples();
    // await qutilExamples();
    // await quotteryExamples();
    // await qearnExamples();
    // await qswapExamples();
    // await qvaultExamples();
    // await ccfExamples();
    // await genericExamples();
    await comparisonExample();

    console.log("\nAll examples completed!");
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run if executed directly
if (import.meta.main) {
  main();
}

