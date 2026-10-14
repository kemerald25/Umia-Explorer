import { createPublicClient, http, parseAbiItem, formatUnits } from 'viem';
import { base } from 'viem/chains';
import fs from 'fs';
import path from 'path';

const client = createPublicClient({
  chain: base,
  transport: http('https://api.mainnet.umia.finance/api/v1/rpc/8453'),
});

const MARKET_CORE = '0x55975E430Cc54C63dff03B1E6d27Be574Ce229F6';

const swapEvent = parseAbiItem(
  'event Swap(uint256 indexed proposalId, address indexed trader, bool zeroForOne, uint256 amountIn, uint256 amountOut, uint256 priceBeforeX96, uint256 priceAfterX96, uint256 priceImpactBps, uint256 protocolFee)'
);

// Q96 to float: priceX96 / (2^96) * 10^12 (USDC 6 decimals, UMIA 18 decimals)
function q96ToPrice(priceX96: bigint): number {
  const Q96 = 2n ** 96n;
  const scaled = (priceX96 * 1000000000000n * 1000000n) / Q96;
  return Number(scaled) / 1000000;
}

async function main() {
  console.log('Fetching Market 3 swaps with native blockTimestamp...');
  const allLogs: any[] = [];
  for (let b = 51430134n; b <= 51516867n; b += 20000n) {
    const end = b + 20000n > 51516867n ? 51516867n : b + 20000n;
    const logs = await client.getLogs({
      address: MARKET_CORE,
      event: swapEvent,
      fromBlock: b,
      toBlock: end,
    });
    allLogs.push(...logs);
  }

  console.log(`Fetched ${allLogs.length} logs.`);

  const proposalTitles: Record<number, string> = {
    5: 'no-op',
    6: 'Full deployment: 50/50 on Aave & Steakhouse',
    7: 'Full deployment: Aave & Gauntlet + Steakhouse',
    8: 'Half deployment: Aave & Steakhouse',
  };

  const records = allLogs.map((log: any) => {
    // blockTimestamp in raw log or calculate from block number (Base is 2s per block)
    // Anchor: block 51430134 is 2026-09-17T12:53:34Z (ts: 1789649614)
    let ts = 1789649614 + Number(log.blockNumber - 51430134n) * 2;
    if (log.blockTimestamp) {
      ts = typeof log.blockTimestamp === 'string' ? parseInt(log.blockTimestamp, 16) : Number(log.blockTimestamp);
    }
    const pId = Number(log.args.proposalId);
    const priceBefore = q96ToPrice(log.args.priceBeforeX96);
    const priceAfter = q96ToPrice(log.args.priceAfterX96);
    
    const isSell = log.args.zeroForOne; // true: sell UMIA for USDC, false: buy UMIA with USDC
    const volumeUsdc = isSell 
      ? Number(formatUnits(log.args.amountOut, 6))
      : Number(formatUnits(log.args.amountIn, 6));

    return {
      blockNumber: Number(log.blockNumber),
      timestamp: ts,
      isoTime: new Date(ts * 1000).toISOString(),
      txHash: log.transactionHash,
      logIndex: log.logIndex,
      proposalId: pId,
      proposalTitle: proposalTitles[pId] || `Proposal ${pId}`,
      trader: log.args.trader,
      zeroForOne: log.args.zeroForOne,
      type: isSell ? 'SELL_UMIA' : 'BUY_UMIA',
      amountIn: log.args.amountIn.toString(),
      amountOut: log.args.amountOut.toString(),
      priceBefore,
      priceAfter,
      priceImpactBps: Number(log.args.priceImpactBps),
      volumeUsdc,
    };
  });

  // Sort chronologically
  records.sort((a, b) => a.timestamp - b.timestamp || a.logIndex - b.logIndex);

  const outDir = path.resolve(process.cwd(), 'src/data');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(outDir, 'market3-swaps.json'),
    JSON.stringify(records, null, 2)
  );

  console.log(`Saved ${records.length} formatted swaps to src/data/market3-swaps.json!`);
}

main();
