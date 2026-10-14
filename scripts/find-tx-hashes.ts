import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const client = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
});

const MARKET_CORE = '0x55975E430Cc54C63dff03B1E6d27Be574Ce229F6'.toLowerCase();

async function findBlockForTimestamp(targetTs: number): Promise<bigint> {
  let low = 50401540n;
  let high = await client.getBlockNumber();
  let best = low;

  while (low <= high) {
    const mid = (low + high) / 2n;
    const b = await client.getBlock({ blockNumber: mid });
    const ts = Number(b.timestamp);
    if (ts >= targetTs) {
      best = mid;
      high = mid - 1n;
    } else {
      low = mid + 1n;
    }
  }
  return best;
}

async function searchTxsAround(centerBlock: bigint, deltaBlocks = 50n) {
  const start = centerBlock - deltaBlocks;
  const end = centerBlock + deltaBlocks;
  console.log(`Scanning blocks ${start} to ${end}...`);
  for (let b = start; b <= end; b++) {
    const block = await client.getBlock({ blockNumber: b, includeTransactions: true });
    for (const tx of block.transactions) {
      if (typeof tx !== 'string' && tx.to?.toLowerCase() === MARKET_CORE) {
        console.log(`Found tx to MarketCore in block ${b}:`, {
          hash: tx.hash,
          from: tx.from,
          methodId: tx.input.slice(0, 10),
          time: new Date(Number(block.timestamp) * 1000).toISOString(),
        });
      }
    }
  }
}

async function main() {
  // Market 1: 2026-08-25T12:47:17.000Z => ts: 1787662037
  const b1 = await findBlockForTimestamp(1787662037);
  console.log('M1 target block:', b1);
  await searchTxsAround(b1, 20n);

  // Market 2: 2026-08-25T13:00:41.000Z => ts: 1787662841
  const b2 = await findBlockForTimestamp(1787662841);
  console.log('M2 target block:', b2);
  await searchTxsAround(b2, 20n);

  // Market 3: 2026-09-17T13:00:00.000Z => ts: 1789650000
  // Note: Market 3 creation could have been earlier than tradingStart!
  // Let's check around 1789650000 and earlier
  const b3 = await findBlockForTimestamp(1789650000);
  console.log('M3 start block:', b3);
  await searchTxsAround(b3, 50n);

  // Market 3 settlement: tradingEnd was 2026-09-19T13:00:00.000Z => ts: 1789822800
  const b3End = await findBlockForTimestamp(1789822800);
  console.log('M3 end block:', b3End);
  await searchTxsAround(b3End, 50n);
}

main();
