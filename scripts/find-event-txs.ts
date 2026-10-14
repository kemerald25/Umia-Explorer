import { createPublicClient, http, parseAbiItem } from 'viem';
import { base } from 'viem/chains';

const client = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
});

const MARKET_CORE = '0x55975E430Cc54C63dff03B1E6d27Be574Ce229F6';
const GOV_EXECUTOR = '0x0Ba8b80Cc8B7E9804860f4D67b2E8051d1FD7E01';

const marketCreatedEvent = parseAbiItem(
  'event MarketCreated(uint256 indexed marketId, uint256 indexed ventureId, string title, uint256 createdAt, uint256 tradingStart, uint256 tradingEnd, uint256[] proposalIds)'
);
const marketSettledEvent = parseAbiItem(
  'event MarketSettled(uint256 indexed marketId, uint256 winningProposalId, uint256 winningPriceX112, uint256 noOpPriceX112, uint256 priceDeltaBps)'
);
const winningExecutedEvent = parseAbiItem(
  'event WinningProposalExecuted(uint256 indexed marketId, uint256 indexed proposalId)'
);
const govPlanExecutedEvent = parseAbiItem(
  'event GovernancePlanExecuted(address indexed venture, uint256 indexed marketId, uint256 indexed proposalId, bytes32 planHash)'
);

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

async function main() {
  console.log('Finding market events...');

  // Market 1 & 2 were around 2026-08-25T12:00:00Z (ts: 1787668800)
  // Market 3 created around 2026-09-17T12:00:00Z (ts: 1789646400)
  // Market 3 settled around 2026-09-19T13:00:00Z (ts: 1789822800)

  const m1Block = await findBlockForTimestamp(1787668800); // 2026-08-25 ~12:00 UTC
  console.log('Market 1/2 estimated block:', m1Block);

  const m3CreatedBlock = await findBlockForTimestamp(1789646400); // 2026-09-17 ~12:00 UTC
  console.log('Market 3 created estimated block:', m3CreatedBlock);

  const m3SettledBlock = await findBlockForTimestamp(1789822800); // 2026-09-19 ~13:00 UTC
  console.log('Market 3 settled estimated block:', m3SettledBlock);

  // Scan 2000 blocks around m1Block for MarketCreated
  const m1Logs = await client.getLogs({
    address: MARKET_CORE,
    event: marketCreatedEvent,
    fromBlock: m1Block - 1000n,
    toBlock: m1Block + 5000n,
  });
  console.log(`Found ${m1Logs.length} MarketCreated logs in m1 window:`);
  for (const l of m1Logs) {
    console.log(`  MarketCreated: marketId=${l.args.marketId}, title="${l.args.title}", tx=${l.transactionHash}, block=${l.blockNumber}`);
  }

  // Scan 4000 blocks around m3CreatedBlock
  const m3CreatedLogs = await client.getLogs({
    address: MARKET_CORE,
    event: marketCreatedEvent,
    fromBlock: m3CreatedBlock - 2000n,
    toBlock: m3CreatedBlock + 3000n,
  });
  console.log(`Found ${m3CreatedLogs.length} MarketCreated logs in m3 window:`);
  for (const l of m3CreatedLogs) {
    console.log(`  MarketCreated: marketId=${l.args.marketId}, title="${l.args.title}", tx=${l.transactionHash}, block=${l.blockNumber}`);
  }

  // Scan 6000 blocks around m3SettledBlock for MarketSettled and WinningProposalExecuted
  const m3SettledLogs = await client.getLogs({
    address: MARKET_CORE,
    event: marketSettledEvent,
    fromBlock: m3SettledBlock - 1000n,
    toBlock: m3SettledBlock + 10000n,
  });
  console.log(`Found ${m3SettledLogs.length} MarketSettled logs in m3 window:`);
  for (const l of m3SettledLogs) {
    console.log(`  MarketSettled: marketId=${l.args.marketId}, winningPid=${l.args.winningProposalId}, priceDeltaBps=${l.args.priceDeltaBps}, tx=${l.transactionHash}, block=${l.blockNumber}`);
  }

  const m3ExecutedLogs = await client.getLogs({
    address: MARKET_CORE,
    event: winningExecutedEvent,
    fromBlock: m3SettledBlock - 1000n,
    toBlock: m3SettledBlock + 30000n,
  });
  console.log(`Found ${m3ExecutedLogs.length} WinningProposalExecuted logs in m3 window:`);
  for (const l of m3ExecutedLogs) {
    console.log(`  WinningProposalExecuted: marketId=${l.args.marketId}, winningPid=${l.args.proposalId}, tx=${l.transactionHash}, block=${l.blockNumber}`);
  }
}

main();
