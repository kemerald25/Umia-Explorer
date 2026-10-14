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

async function main() {
  console.log('Querying targeted blocks...');
  // M1 & M2: around 50436340n - 50437000n
  const m1Created = await client.getLogs({
    address: MARKET_CORE,
    event: marketCreatedEvent,
    fromBlock: 50436000n,
    toBlock: 50437000n,
  });
  console.log('M1/M2 Created Logs:', m1Created.length);
  for (const l of m1Created) {
    console.log(`Market #${l.args.marketId} "${l.args.title}" created in tx ${l.transactionHash} block ${l.blockNumber}`);
  }

  // M1/M2 settled (1 hour after tradingStart ~ 1800 blocks later): around 50438000n - 50440000n
  const m1Settled = await client.getLogs({
    address: MARKET_CORE,
    event: marketSettledEvent,
    fromBlock: 50437500n,
    toBlock: 50440000n,
  });
  console.log('M1/M2 Settled Logs:', m1Settled.length);
  for (const l of m1Settled) {
    console.log(`Market #${l.args.marketId} settled in tx ${l.transactionHash} block ${l.blockNumber}, winner: ${l.args.winningProposalId}`);
  }

  // M3 created: around 51430000n - 51431000n
  const m3Created = await client.getLogs({
    address: MARKET_CORE,
    event: marketCreatedEvent,
    fromBlock: 51430000n,
    toBlock: 51431000n,
  });
  console.log('M3 Created Logs:', m3Created.length);
  for (const l of m3Created) {
    console.log(`Market #${l.args.marketId} "${l.args.title}" created in tx ${l.transactionHash} block ${l.blockNumber}`);
  }

  // M3 settled: around 51516000n - 51518000n
  const m3Settled = await client.getLogs({
    address: MARKET_CORE,
    event: marketSettledEvent,
    fromBlock: 51516000n,
    toBlock: 51518000n,
  });
  console.log('M3 Settled Logs:', m3Settled.length);
  for (const l of m3Settled) {
    console.log(`Market #${l.args.marketId} settled in tx ${l.transactionHash} block ${l.blockNumber}, winner: ${l.args.winningProposalId}, deltaBps: ${l.args.priceDeltaBps}`);
  }

  // M3 execution: around 51516000n - 51525000n
  const m3Exec = await client.getLogs({
    address: MARKET_CORE,
    event: winningExecutedEvent,
    fromBlock: 51516000n,
    toBlock: 51525000n,
  });
  console.log('M3 Executed Logs:', m3Exec.length);
  for (const l of m3Exec) {
    console.log(`Market #${l.args.marketId} executed in tx ${l.transactionHash} block ${l.blockNumber}`);
  }
}

main();
