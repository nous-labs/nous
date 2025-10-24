// Easy smart contract querying examples
// This shows the simplified API for querying Qubic smart contracts

import { QubicLiveClient } from "../src/clients/qubic-live-client.ts";
import { qx, qutil, quottery, random, qearn, qswap, qvault, ccf, query, simpleQuery } from "../src/utils/contracts-easy.ts";

const client = new QubicLiveClient();

// ===== QX Exchange Examples =====

async function qxExamples() {
  console.log("\n=== QX Exchange ===");

  // Get entity info - super simple!
  const entity = await qx.getEntity(client, 1);
  console.log("Entity:", entity);

  // Get order book
  const orderBook = await qx.getOrderBook(client, 0, 0, 10);
  console.log("Order book:", orderBook.raw);

  // Get fees
  const fees = await qx.getFees(client);
  console.log("Fees:", fees);
}

// ===== QUTIL Examples =====

async function qutilExamples() {
  console.log("\n=== QUTIL ===");

  // Send to multiple addresses
  const result = await qutil.sendToMany(client, [
    { address: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", amount: 1000n },
    { address: "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB", amount: 2000n },
  ]);
  console.log("Send to many result:", result);

  // Get contract info
  const info = await qutil.getContractInfo(client);
  console.log("Contract info:", info);
}

// ===== QUOTTERY Betting Examples =====

async function quotteryExamples() {
  console.log("\n=== QUOTTERY ===");

  // Get active bet
  const bet = await quottery.getActiveBet(client, 1);
  console.log("Active bet:", bet);

  // Get bet list
  const bets = await quottery.getBetList(client, 0, 10);
  console.log("Bet list:", bets.raw);

  // Get user bets
  const userBets = await quottery.getUserBets(client, "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC");
  console.log("User bets:", userBets.raw);
}

// ===== RANDOM Examples =====

async function randomExamples() {
  console.log("\n=== RANDOM ===");

  // Get random number
  const randomNum = await random.getRandomNumber(client);
  console.log("Random number:", randomNum);

  // Get random number with seed
  const randomWithSeed = await random.getRandomNumber(client, 12345);
  console.log("Random with seed:", randomWithSeed);

  // Get random bytes
  const randomBytes = await random.getRandomBytes(client, 32);
  console.log("Random bytes:", randomBytes.bytes);
}

// ===== QEARN Staking Examples =====

async function qearnExamples() {
  console.log("\n=== QEARN ===");

  // Get staking info
  const stakingInfo = await qearn.getStakingInfo(client, "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD");
  console.log("Staking info:", stakingInfo);

  // Get total staked
  const totalStaked = await qearn.getTotalStaked(client);
  console.log("Total staked:", totalStaked);

  // Get rewards for tick range
  const rewards = await qearn.getRewards(client, 15000000, 15100000);
  console.log("Rewards:", rewards.raw);
}

// ===== QSWAP Examples =====

async function qswapExamples() {
  console.log("\n=== QSWAP ===");

  // Get pair info
  const pairInfo = await qswap.getPairInfo(client, 1);
  console.log("Pair info:", pairInfo);

  // Get swap quote
  const quote = await qswap.getQuote(client, 1000n, "QUBIC", "QX");
  console.log("Swap quote:", quote);
}

// ===== QVAULT Examples =====

async function qvaultExamples() {
  console.log("\n=== QVAULT ===");

  // Get vault balance
  const vaultBalance = await qvault.getVaultBalance(client, 1);
  console.log("Vault balance:", vaultBalance);

  // Get user vaults
  const userVaults = await qvault.getUserVaults(client, "EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE");
  console.log("User vaults:", userVaults.raw);
}

// ===== CCF Examples =====

async function ccfExamples() {
  console.log("\n=== CCF ===");

  // Get fund info
  const fundInfo = await ccf.getFundInfo(client);
  console.log("Fund info:", fundInfo);

  // Get proposal
  const proposal = await ccf.getProposal(client, 1);
  console.log("Proposal:", proposal);
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

  const oldQuery = createQuery(QUBIC_CONTRACTS.QX, 1)
    .addInt32(1);

  const oldResponse = await oldQuery.execute(client);
  const oldParser = parseResponse(oldResponse.responseData);
  const oldResult = {
    entityId: oldParser.readInt32(),
    orderCount: oldParser.readInt32(),
  };
  console.log("Result:", oldResult);

  // NEW WAY - clean and simple!
  console.log("\nNEW WAY:");
  const newResult = await qx.getEntity(client, 1);
  console.log("Result:", newResult);

  console.log("\nMuch easier! 🎉");
}

// ===== Run all examples =====

async function main() {
  try {
    console.log("Starting easy contract query examples...");

    // Uncomment the examples you want to run:

    // await qxExamples();
    // await qutilExamples();
    // await quotteryExamples();
    // await randomExamples();
    // await qearnExamples();
    // await qswapExamples();
    // await qvaultExamples();
    // await ccfExamples();
    // await genericExamples();
    await comparisonExample();

    console.log("\n✅ All examples completed!");
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run if executed directly
if (import.meta.main) {
  main();
}
