// Basic usage examples for Qubic TypeScript SDK

import {
  createQubicClient,
  QubicLiveClient,
  QueryClient,
  createQuery,
  parseResponse,
  QUBIC_CONTRACTS,
} from "../index.ts";

// Example 1: Using the unified client
async function unifiedClientExample() {
  console.log("\n=== Example 1: Unified Client ===");

  const qubic = createQubicClient();

  // Get current tick
  const tickInfo = await qubic.live.getTickInfo();
  console.log("Current tick:", tickInfo.tickInfo.tick);
  console.log("Epoch:", tickInfo.tickInfo.epoch);

  // Get last processed tick in archive
  const lastProcessed = await qubic.query.getLastProcessedTick();
  console.log("Last processed tick:", lastProcessed.tickNumber);
}

// Example 2: Get balance for an identity
async function getBalanceExample() {
  console.log("\n=== Example 2: Get Balance ===");

  const client = new QubicLiveClient();

  // Replace with actual identity
  const identity =
    "BZVMIJXDWZQJWTFVEBPCJVFZDHXICRCLUVDUPKQGIJAFLEZCMMLUQHTXEXWA";

  try {
    const response = await client.getBalance(identity);
    console.log("Balance:", response.balance.balance);
    console.log("Valid for tick:", response.balance.validForTick);
    console.log(
      "Incoming transfers:",
      response.balance.numberOfIncomingTransfers,
    );
    console.log(
      "Outgoing transfers:",
      response.balance.numberOfOutgoingTransfers,
    );
  } catch (error) {
    console.error("Error fetching balance:", error);
  }
}

// Example 3: Query a smart contract
async function smartContractExample() {
  console.log("\n=== Example 3: Smart Contract Query ===");

  const client = new QubicLiveClient();

  // Build a query for QX contract (example)
  const query = createQuery(QUBIC_CONTRACTS.QX, 1).addInt32(0).addInt64(1000n);

  try {
    const response = await query.execute(client);
    console.log("Contract response received");

    // Parse the response
    const parser = parseResponse(response.responseData);
    console.log("Response data length:", parser.remainingBytes(), "bytes");

    // Read response based on contract specification
    // const value = parser.readInt64();
    // console.log('Response value:', value);
  } catch (error) {
    console.error("Error querying contract:", error);
  }
}

// Example 4: Get transactions for an identity
async function getTransactionsExample() {
  console.log("\n=== Example 4: Get Transactions ===");

  const query = new QueryClient();

  // Replace with actual identity
  const identity =
    "BZVMIJXDWZQJWTFVEBPCJVFZDHXICRCLUVDUPKQGIJAFLEZCMMLUQHTXEXWA";

  try {
    const result = await query.getTransactionsForIdentityPaginated(
      identity,
      0, // offset
      10, // page size
    );

    console.log("Total hits:", result.hits.total);
    console.log("Transactions returned:", result.transactions.length);

    result.transactions.forEach((tx, i) => {
      console.log(`\nTransaction ${i + 1}:`);
      console.log("  Hash:", tx.hash);
      console.log("  From:", tx.source);
      console.log("  To:", tx.destination);
      console.log("  Amount:", tx.amount);
      console.log("  Tick:", tx.tickNumber);
      console.log("  Money Flew:", tx.moneyFlew);
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
  }
}

// Example 5: Get transactions in a tick range
async function getTransactionsInRangeExample() {
  console.log("\n=== Example 5: Get Transactions in Tick Range ===");

  const query = new QueryClient();

  // Replace with actual identity
  const identity =
    "BZVMIJXDWZQJWTFVEBPCJVFZDHXICRCLUVDUPKQGIJAFLEZCMMLUQHTXEXWA";

  try {
    const result = await query.getTransactionsForIdentityInRange(
      identity,
      15000000, // start tick
      15100000, // end tick
      { offset: 0, size: 20 },
    );

    console.log("Transactions in range:", result.transactions.length);
    console.log("Total matches:", result.hits.total);
  } catch (error) {
    console.error("Error fetching transactions:", error);
  }
}

// Example 6: Get asset information
async function getAssetsExample() {
  console.log("\n=== Example 6: Get Assets ===");

  const client = new QubicLiveClient();

  // Replace with actual identity
  const identity =
    "BZVMIJXDWZQJWTFVEBPCJVFZDHXICRCLUVDUPKQGIJAFLEZCMMLUQHTXEXWA";

  try {
    // Get issued assets
    const issued = await client.getIssuedAssets(identity);
    console.log("Issued assets:", issued.issuedAssets.length);

    // Get owned assets
    const owned = await client.getOwnedAssets(identity);
    console.log("Owned assets:", owned.ownedAssets.length);

    // Get possessed assets
    const possessed = await client.getPossessedAssets(identity);
    console.log("Possessed assets:", possessed.possessedAssets.length);
  } catch (error) {
    console.error("Error fetching assets:", error);
  }
}

// Example 7: Get tick data
async function getTickDataExample() {
  console.log("\n=== Example 7: Get Tick Data ===");

  const query = new QueryClient();

  try {
    const tickNumber = 15000000;
    const tickData = await query.getTickData(tickNumber);

    console.log("Tick:", tickData.tickData.tickNumber);
    console.log("Epoch:", tickData.tickData.epoch);
    console.log("Timestamp:", tickData.tickData.timestamp);
    console.log(
      "Transaction hashes:",
      tickData.tickData.transactionHashes?.length || 0,
    );
  } catch (error) {
    console.error("Error fetching tick data:", error);
  }
}

// Example 8: Get computors for epoch
async function getComputorsExample() {
  console.log("\n=== Example 8: Get Computors ===");

  const query = new QueryClient();

  try {
    const epoch = 100;
    const result = await query.getComputorsListForEpoch(epoch);

    console.log("Computors lists:", result.computorsLists.length);

    if (result.computorsLists.length > 0) {
      const list = result.computorsLists[0];
      if (list) {
        console.log("Epoch:", list.epoch);
        console.log("Number of computors:", list.identities.length);
      }
    }
  } catch (error) {
    console.error("Error fetching computors:", error);
  }
}

// Example 9: Monitor tick updates
async function monitorTicksExample() {
  console.log("\n=== Example 9: Monitor Ticks ===");

  const client = new QubicLiveClient();
  let lastTick = 0;
  let count = 0;

  console.log("Monitoring ticks for 30 seconds...");

  const interval = setInterval(async () => {
    try {
      const { tickInfo } = await client.getTickInfo();

      if (tickInfo.tick > lastTick) {
        console.log(
          `New tick detected: ${tickInfo.tick} (epoch: ${tickInfo.epoch})`,
        );
        lastTick = tickInfo.tick;
      }

      count++;
      if (count >= 30) {
        clearInterval(interval);
        console.log("Monitoring complete");
      }
    } catch (error) {
      console.error("Error monitoring ticks:", error);
    }
  }, 1000);
}

// Example 10: Error handling
async function errorHandlingExample() {
  console.log("\n=== Example 10: Error Handling ===");

  const client = new QubicLiveClient();

  try {
    // Try to get balance for invalid identity
    await client.getBalance("INVALID_IDENTITY");
  } catch (error: any) {
    console.log("Caught error:");
    console.log("  Message:", error.message);
    console.log("  Status:", error.status);

    if (error.status === 400) {
      console.log("  Type: Bad Request");
    } else if (error.status === 404) {
      console.log("  Type: Not Found");
    } else if (error.status === 408) {
      console.log("  Type: Timeout");
    } else if (error.status === 0) {
      console.log("  Type: Network Error");
    }
  }
}

// Run all examples
async function main() {
  console.log("=================================");
  console.log("Qubic TypeScript SDK Examples");
  console.log("=================================");

  try {
    await unifiedClientExample();
    await getBalanceExample();
    await smartContractExample();
    await getTransactionsExample();
    await getTransactionsInRangeExample();
    await getAssetsExample();
    await getTickDataExample();
    await getComputorsExample();
    await errorHandlingExample();

    // Uncomment to run the monitoring example
    // await monitorTicksExample();

    console.log("\n=================================");
    console.log("All examples completed!");
    console.log("=================================");
  } catch (error) {
    console.error("Fatal error:", error);
  }
}

// Run if executed directly
if (import.meta.main) {
  main();
}

export {
  unifiedClientExample,
  getBalanceExample,
  smartContractExample,
  getTransactionsExample,
  getTransactionsInRangeExample,
  getAssetsExample,
  getTickDataExample,
  getComputorsExample,
  monitorTicksExample,
  errorHandlingExample,
};
