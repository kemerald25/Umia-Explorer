import { createPublicClient, http, parseAbiItem } from 'viem';
import { base } from 'viem/chains';

const client = createPublicClient({
  chain: base,
  transport: http('https://api.mainnet.umia.finance/api/v1/rpc/8453'),
});

const MARKET_CORE = '0x55975E430Cc54C63dff03B1E6d27Be574Ce229F6';

const swapEvent = parseAbiItem(
  'event Swap(uint256 indexed proposalId, address indexed trader, bool zeroForOne, uint256 amountIn, uint256 amountOut, uint256 priceBeforeX96, uint256 priceAfterX96, uint256 priceImpactBps, uint256 protocolFee)'
);

async function main() {
  console.log('Querying swaps for Market 3...');
  // Blocks 51430134 to 51516867 is ~86,733 blocks.
  // In the blog, it mentions: "51 traders... 42 of 51 made a single trade... total ~70-90 swaps".
  // Let's query in chunks of 15,000 blocks:
  const allSwaps: any[] = [];
  for (let b = 51430134n; b <= 51516867n; b += 15000n) {
    const end = b + 15000n > 51516867n ? 51516867n : b + 15000n;
    console.log(`Scanning swaps ${b} -> ${end}...`);
    const logs = await client.getLogs({
      address: MARKET_CORE,
      event: swapEvent,
      fromBlock: b,
      toBlock: end,
    });
    console.log(`  Found ${logs.length} swaps`);
    allSwaps.push(...logs);
  }
  console.log(`Total swaps found across Market 3: ${allSwaps.length}`);
}

main();
