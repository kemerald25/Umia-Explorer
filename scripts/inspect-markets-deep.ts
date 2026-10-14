import { createPublicClient, http, parseAbi } from 'viem';
import { base } from 'viem/chains';

const client = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
});

const MARKET_CORE = '0x55975E430Cc54C63dff03B1E6d27Be574Ce229F6';

const marketCoreAbi = parseAbi([
  'function marketCounter() external view returns (uint256)',
  'function proposalCounter() external view returns (uint256)',
  'function marketInfo(uint256 marketId) external view returns (uint256 id, uint256 ventureId, uint256 tradingStart, uint256 tradingEnd)',
  'function marketProposalIds(uint256 marketId) external view returns (uint256[] memory proposalIds)',
  'function proposalInfo(uint256 proposalId) external view returns (uint256 id, string memory title, bool isNoOp, uint256 virtualVentureId, uint256 virtualMoneyId)',
  'function proposalExecutionPayload(uint256 proposalId) external view returns (bytes memory)',
  'function winningProposalByMarketId(uint256 marketId) external view returns ((uint256 id, string title, bool isNoOp, uint256 virtualVentureId, uint256 virtualMoneyId, uint256 winningPriceX112))',
  'function getMarketStatus(uint256 marketId) external view returns (uint8)',
  'function marketSettled(uint256 marketId) external view returns (bool)',
  'function marketExecuted(uint256 marketId) external view returns (bool)',
  'function cpmmStates(uint256 proposalId) external view returns (uint256 reserve0, uint256 reserve1)',
  'function getProposalTWAP(uint256 proposalId) external view returns (uint256 twapX112)',
  'function getPriceX96(uint256 proposalId, bool zeroForOne) external view returns (uint256 priceX96)',
  'function marketSettlementState(uint256 marketId) external view returns (uint256 realVenture, uint256 realMoney, uint256 lpTokenId, uint256 ventureRemoved, uint256 moneyRemoved, uint128 liquidityRemoved)',
  'function proposalToMarket(uint256 proposalId) external view returns (uint256)',
]);

async function main() {
  const marketCount = await client.readContract({
    address: MARKET_CORE,
    abi: marketCoreAbi,
    functionName: 'marketCounter',
  });
  console.log(`Found ${marketCount} markets:`);

  for (let m = 1; m <= Number(marketCount); m++) {
    console.log(`\n================ MARKET #${m} ================`);
    const info = await client.readContract({
      address: MARKET_CORE,
      abi: marketCoreAbi,
      functionName: 'marketInfo',
      args: [BigInt(m)],
    });
    console.log('Market Info:', {
      id: info[0].toString(),
      ventureId: info[1].toString(),
      tradingStart: new Date(Number(info[2]) * 1000).toISOString(),
      tradingEnd: new Date(Number(info[3]) * 1000).toISOString(),
    });

    const settled = await client.readContract({
      address: MARKET_CORE,
      abi: marketCoreAbi,
      functionName: 'marketSettled',
      args: [BigInt(m)],
    });
    const executed = await client.readContract({
      address: MARKET_CORE,
      abi: marketCoreAbi,
      functionName: 'marketExecuted',
      args: [BigInt(m)],
    });
    console.log('Status: settled =', settled, ', executed =', executed);

    const proposalIds = await client.readContract({
      address: MARKET_CORE,
      abi: marketCoreAbi,
      functionName: 'marketProposalIds',
      args: [BigInt(m)],
    });
    console.log('Proposals in Market:', proposalIds.map(p => p.toString()));

    try {
      const winner = await client.readContract({
        address: MARKET_CORE,
        abi: marketCoreAbi,
        functionName: 'winningProposalByMarketId',
        args: [BigInt(m)],
      });
      console.log('Winning proposal:', {
        id: winner.id.toString(),
        title: winner.title,
        isNoOp: winner.isNoOp,
        winningPriceX112: winner.winningPriceX112.toString(),
        floatTWAP: Number(winner.winningPriceX112) / (2 ** 112),
      });
    } catch (e: any) {
      console.log('Winning proposal read failed:', e.shortMessage || e.message);
    }

    try {
      const settleState = await client.readContract({
        address: MARKET_CORE,
        abi: marketCoreAbi,
        functionName: 'marketSettlementState',
        args: [BigInt(m)],
      });
      console.log('Settlement state:', {
        realVenture: settleState[0].toString(),
        realMoney: settleState[1].toString(),
        lpTokenId: settleState[2].toString(),
        ventureRemoved: settleState[3].toString(),
        moneyRemoved: settleState[4].toString(),
        liquidityRemoved: settleState[5].toString(),
      });
    } catch (e: any) {
      console.log('Settlement state error:', e.message);
    }

    for (const pid of proposalIds) {
      const pInfo = await client.readContract({
        address: MARKET_CORE,
        abi: marketCoreAbi,
        functionName: 'proposalInfo',
        args: [pid],
      });
      let twap: any = 'N/A';
      try {
        const t = await client.readContract({
          address: MARKET_CORE,
          abi: marketCoreAbi,
          functionName: 'getProposalTWAP',
          args: [pid],
        });
        twap = `${t.toString()} (${Number(t) / (2 ** 112)})`;
      } catch (e: any) {
        twap = e.shortMessage || 'error';
      }

      let reserves: any = 'N/A';
      try {
        const r = await client.readContract({
          address: MARKET_CORE,
          abi: marketCoreAbi,
          functionName: 'cpmmStates',
          args: [pid],
        });
        reserves = {
          reserve0_venture: r[0].toString(),
          reserve1_money: r[1].toString(),
          spotPrice: Number(r[1]) / (Number(r[0]) || 1),
        };
      } catch (e: any) {}

      console.log(`  Proposal ${pid.toString()}: "${pInfo[1]}" (isNoOp: ${pInfo[2]}) | TWAP: ${twap} | Reserves:`, reserves);
    }
  }
}

main();
