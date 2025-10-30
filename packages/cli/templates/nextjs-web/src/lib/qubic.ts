import { createQubicClient } from "@nouslabs/sdk";

export function createClient() {
  return createQubicClient({
    liveUrl: process.env.NEXT_PUBLIC_QUBIC_LIVE_URL,
    queryUrl: process.env.NEXT_PUBLIC_QUBIC_QUERY_URL,
  });
}
