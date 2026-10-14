import { createPublicClient, http, parseAbi } from 'viem';
import { base } from 'viem/chains';

const client = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
});

const MARKET_CORE = '0x55975E430Cc54C63dff03B1E6d27Be574Ce229F6';

async function main() {
  console.log('Inspecting UmiaMarketCore at', MARKET_CORE);
  
  // Check EIP-1967 implementation slot
  // 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc
  const implSlot = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
  const impl = await client.getStorageAt({
    address: MARKET_CORE,
    slot: implSlot,
  });
  console.log('Implementation address slot:', impl);

  // Let's test calling various getters
  const funcs = [
    'function marketCounter() external view returns (uint256)',
    'function proposalCounter() external view returns (uint256)',
    'function HUB() external view returns (address)',
    'function activeUnsettledMarketCount() external view returns (uint256)',
  ];

  for (const fn of funcs) {
    try {
      const res = await client.readContract({
        address: MARKET_CORE,
        abi: parseAbi([fn]),
        functionName: fn.split(' ')[1].split('(')[0],
      });
      console.log(`${fn}:`, res);
    } catch (e: any) {
      console.log(`${fn} failed:`, e.shortMessage || e.message);
    }
  }
}

main();
