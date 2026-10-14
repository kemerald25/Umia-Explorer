import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const client = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
});

const MARKET_CORE = '0x55975E430Cc54C63dff03B1E6d27Be574Ce229F6';

async function findDeploymentBlock() {
  const latest = await client.getBlockNumber();
  console.log('Latest block:', latest);

  // Binary search for deployment block
  let low = 18000000n; // mid 2024
  let high = latest;
  let deployBlock = latest;

  while (low <= high) {
    const mid = (low + high) / 2n;
    const code = await client.getBytecode({ address: MARKET_CORE, blockNumber: mid });
    if (code && code.length > 2) {
      deployBlock = mid;
      high = mid - 1n; // look earlier
    } else {
      low = mid + 1n; // look later
    }
    console.log(`Binary search: [${low}, ${high}], mid=${mid}, hasCode=${Boolean(code && code.length > 2)}`);
  }

  console.log('Contract was deployed at or before block:', deployBlock);
  const block = await client.getBlock({ blockNumber: deployBlock });
  console.log('Block time:', new Date(Number(block.timestamp) * 1000).toISOString());
}

findDeploymentBlock();
