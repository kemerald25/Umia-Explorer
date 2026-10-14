import { createPublicClient, http, parseAbi } from 'viem';
import { base } from 'viem/chains';

const client = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
});

const HUB_ADDRESS = '0x120dbCDd58Bb787309573e29159fE6D37A1983F6';

const hubAbi = parseAbi([
  'function owner() external view returns (address)',
  'function ventureCount() external view returns (uint256)',
  'function umiaMarketCore() external view returns (address)',
  'function conditionalMarketOracle() external view returns (address)',
  'function defaultGovernanceExecutor() external view returns (address)',
  'function winningMarketThresholdBps() external view returns (uint16)',
  'function decisionMarketExecutionDelay() external view returns (uint32)',
  'function ventureById(uint256 id) external view returns ((uint256 id, address venture, string name, uint256 createdAt))',
  'function ventureTokenById(uint256 id) external view returns (address)',
  'function ventureMoneyTokenById(uint256 id) external view returns (address)',
]);

async function main() {
  console.log('Inspecting UmiaHub on Base...');
  try {
    const owner = await client.readContract({ address: HUB_ADDRESS, abi: hubAbi, functionName: 'owner' });
    console.log('Hub owner:', owner);

    const ventureCount = await client.readContract({ address: HUB_ADDRESS, abi: hubAbi, functionName: 'ventureCount' });
    console.log('Venture count:', ventureCount.toString());

    const marketCore = await client.readContract({ address: HUB_ADDRESS, abi: hubAbi, functionName: 'umiaMarketCore' });
    console.log('UmiaMarketCore according to Hub:', marketCore);

    const oracle = await client.readContract({ address: HUB_ADDRESS, abi: hubAbi, functionName: 'conditionalMarketOracle' });
    console.log('ConditionalMarketOracle according to Hub:', oracle);

    const govExec = await client.readContract({ address: HUB_ADDRESS, abi: hubAbi, functionName: 'defaultGovernanceExecutor' });
    console.log('DefaultGovernanceExecutor:', govExec);

    const thresholdBps = await client.readContract({ address: HUB_ADDRESS, abi: hubAbi, functionName: 'winningMarketThresholdBps' });
    console.log('WinningMarketThresholdBps:', thresholdBps);

    const delay = await client.readContract({ address: HUB_ADDRESS, abi: hubAbi, functionName: 'decisionMarketExecutionDelay' });
    console.log('DecisionMarketExecutionDelay:', delay);

    for (let i = 1; i <= Number(ventureCount); i++) {
      try {
        const v = await client.readContract({ address: HUB_ADDRESS, abi: hubAbi, functionName: 'ventureById', args: [BigInt(i)] });
        const token = await client.readContract({ address: HUB_ADDRESS, abi: hubAbi, functionName: 'ventureTokenById', args: [BigInt(i)] });
        const money = await client.readContract({ address: HUB_ADDRESS, abi: hubAbi, functionName: 'ventureMoneyTokenById', args: [BigInt(i)] });
        console.log(`Venture #${i}:`, v.name, 'addr:', v.venture, 'token:', token, 'money:', money);
      } catch (err: any) {
        console.log(`Error reading venture #${i}:`, err.message);
      }
    }
  } catch (err: any) {
    console.error('Error querying Hub:', err);
  }
}

main();
