import { createPublicClient, http, parseAbiItem } from 'viem';
import { base } from 'viem/chains';

const client = createPublicClient({
  chain: base,
  transport: http('https://api.mainnet.umia.finance/api/v1/rpc/8453'),
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

async function scanRange(fromBlock: bigint, toBlock: bigint) {
  console.log(`Scanning range ${fromBlock} -> ${toBlock}...`);

  const createdLogs = await client.getLogs({
    address: MARKET_CORE,
    event: marketCreatedEvent,
    fromBlock,
    toBlock,
  });
  for (const l of createdLogs) {
    console.log(`\n🎉 MarketCreated: marketId=${l.args.marketId}, ventureId=${l.args.ventureId}, title="${l.args.title}"`);
    console.log(`   txHash: ${l.transactionHash}, block: ${l.blockNumber}`);
    console.log(`   proposals:`, l.args.proposalIds?.map(p => p.toString()));
  }

  const settledLogs = await client.getLogs({
    address: MARKET_CORE,
    event: marketSettledEvent,
    fromBlock,
    toBlock,
  });
  for (const l of settledLogs) {
    console.log(`\n⚖️ MarketSettled: marketId=${l.args.marketId}, winningPid=${l.args.winningProposalId}`);
    console.log(`   winningPriceX112: ${l.args.winningPriceX112}, noOpPriceX112: ${l.args.noOpPriceX112}, deltaBps: ${l.args.priceDeltaBps}`);
    console.log(`   txHash: ${l.transactionHash}, block: ${l.blockNumber}`);
  }

  const executedLogs = await client.getLogs({
    address: MARKET_CORE,
    event: winningExecutedEvent,
    fromBlock,
    toBlock,
  });
  for (const l of executedLogs) {
    console.log(`\n🚀 WinningProposalExecuted: marketId=${l.args.marketId}, pid=${l.args.proposalId}`);
    console.log(`   txHash: ${l.transactionHash}, block: ${l.blockNumber}`);
  }

  const govLogs = await client.getLogs({
    address: GOV_EXECUTOR,
    event: govPlanExecutedEvent,
    fromBlock,
    toBlock,
  });
  for (const l of govLogs) {
    console.log(`\n🏛️ GovernancePlanExecuted: venture=${l.args.venture}, marketId=${l.args.marketId}, pid=${l.args.proposalId}`);
    console.log(`   txHash: ${l.transactionHash}, block: ${l.blockNumber}`);
  }
}

async function main() {
  console.log('Querying via Umia RPC...');
  // Window 1: August 25, 2026 (Markets 1 & 2): block ~50435000 to 50442000
  await scanRange(50435000n, 50442000n);

  // Window 2: September 17, 2026 to September 20, 2026 (Market 3): block ~51425000 to 51530000
  // Break into chunks of 20,000 blocks to be safe
  for (let b = 51425000n; b <= 51530000n; b += 20000n) {
    const end = b + 20000n > 51530000n ? 51530000n : b + 20000n;
    await scanRange(b, end);
  }
}

main();
