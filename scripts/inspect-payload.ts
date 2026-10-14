import { createPublicClient, http, parseAbi } from 'viem';
import { base } from 'viem/chains';

const client = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
});

const MARKET_CORE = '0x55975E430Cc54C63dff03B1E6d27Be574Ce229F6';

const abi = parseAbi([
  'function proposalExecutionPayload(uint256 proposalId) external view returns (bytes memory)',
  'function winningProposalByMarketId(uint256 marketId) external view returns ((uint256 proposalId, uint256 price))',
]);

async function main() {
  for (let m = 1; m <= 3; m++) {
    const winner = await client.readContract({
      address: MARKET_CORE,
      abi,
      functionName: 'winningProposalByMarketId',
      args: [BigInt(m)],
    });
    console.log(`Market ${m} winner:`, winner);

    const payload = await client.readContract({
      address: MARKET_CORE,
      abi,
      functionName: 'proposalExecutionPayload',
      args: [winner.proposalId],
    });
    console.log(`Market ${m} winning proposal ${winner.proposalId} payload length:`, payload.length, 'hex:', payload);
  }
}

main();
