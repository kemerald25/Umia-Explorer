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

async function main() {
  console.log('Finding events on Base...');
  // Current block is ~3229cee (32,677,102).
  // Market #1 was late August 2026. Base produces 1 block per 2 seconds.
  // 30 days is ~1,296,000 blocks.
  // Let's get current block:
  const latestBlock = await client.getBlockNumber();
  console.log('Latest block:', latestBlock);

  // We can scan from block ~18,000,000 or let's find the deployment block of MARKET_CORE
  // Or query in ranges of 100,000 or 50,000 blocks.
  // Actually, public RPCs limit getLogs range (e.g. 10,000 or 50,000 blocks).
  // Let's test a getLogs call.
  try {
    const fromBlock = latestBlock - 50000n;
    const logs = await client.getLogs({
      address: MARKET_CORE,
      event: marketSettledEvent,
      fromBlock,
      toBlock: latestBlock,
    });
    console.log(`Logs in last 50,000 blocks: ${logs.length}`);
  } catch (e: any) {
    console.log('Test log query:', e.message);
  }
}

main();
