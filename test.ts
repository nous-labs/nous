import { qx, QubicLiveClient } from "@nvlabs/qts";

const client = new QubicLiveClient();

const entity = "CODEDBUUDDYHECBVSUONSSWTOJRCLZSWHFHZIUWVFGNWVCKIWJCSDSWGQAAI";
const [{ orders: asks }, { orders: bids }] = await Promise.all([
  qx.getEntityAskOrders(client, entity),
  qx.getEntityBidOrders(client, entity),
]);
console.table({ asks, bids });
