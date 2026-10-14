import { createPublicClient, http, parseAbi, parseAbiItem, decodeEventLog } from 'viem';
import { base } from 'viem/chains';
import fs from 'fs';

const client = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
});

const UMIA_MARKET_CORE = '0x55975E430Cc54C63dff03B1E6d27Be574Ce229F6';
const UMIA_HUB = '0x120dbCDd58Bb787309573e29159fE6D37A1983F6';
const CONDITIONAL_ORACLE = '0x114C446Ce246b6C5c432Eb001fBeB17864Fc1d34';
const GOVERNANCE_EXECUTOR = '0x0Ba8b80Cc8B7E9804860f4D67b2E8051d1FD7E01';
const UMIA_MARKET_STAKE = '0x1819093Ec7376384A659e1c4976CDbc52F5564b9';

const IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';

async function audit() {
  console.log('=== CHECK 1: Chain ID & Contract Verification ===');
  const chainId = await client.getChainId();
  console.log('Chain ID:', chainId);

  // Check bytecode and proxy implementation for UmiaMarketCore and UmiaHub
  const [coreCode, hubCode, oracleCode, executorCode, stakeCode] = await Promise.all([
    client.getCode({ address: UMIA_MARKET_CORE }),
    client.getCode({ address: UMIA_HUB }),
    client.getCode({ address: CONDITIONAL_ORACLE }),
    client.getCode({ address: GOVERNANCE_EXECUTOR }),
    client.getCode({ address: UMIA_MARKET_STAKE }),
  ]);
  console.log('Bytecode lengths:', {
    core: coreCode?.length,
    hub: hubCode?.length,
    oracle: oracleCode?.length,
    executor: executorCode?.length,
    stake: stakeCode?.length,
  });

  const [coreImplStorage, hubImplStorage] = await Promise.all([
    client.getStorageAt({ address: UMIA_MARKET_CORE, slot: IMPLEMENTATION_SLOT }),
    client.getStorageAt({ address: UMIA_HUB, slot: IMPLEMENTATION_SLOT }),
  ]);
  console.log('UmiaMarketCore Implementation Address:', '0x' + coreImplStorage?.slice(26));
  console.log('UmiaHub Implementation Address:', '0x' + hubImplStorage?.slice(26));

  console.log('\n=== CHECK 2: Market Creation and Settlement Receipts ===');
  const marketTxs = [
    { id: 1, create: '0x3b6a293b939938a9d975eb7761e2867bee6ebbcbeafeef1a2405584376967d47', settle: '0xb8fb9fe6b129d618d8732ad010abc94a45e21e67436feaedeee4b851fcf6b2cd' },
    { id: 2, create: '0x485bd25dc639f0e077a75e9f3dc5cdbc2c510918c279c414053c577265ce055f', settle: '0xd03dfcee6e19a8c289669afd939eebdc8836d9123f9db8ca1bfb851d0c0d1af4' },
    { id: 3, create: '0x9b34c91af841dab9d395bf5e116f140674fcbb8a2ab072a2b32ca3159905a60d', settle: '0xeb8c8177aa082327482a7431ffc1d31e52d2b10340acfe5d7ad13f9f1f09cb00' },
  ];

  for (const m of marketTxs) {
    const cReceipt = await client.getTransactionReceipt({ hash: m.create as `0x${string}` });
    const sReceipt = await client.getTransactionReceipt({ hash: m.settle as `0x${string}` });
    console.log(`Market #${m.id}:`);
    console.log(`  Creation: Status=${cReceipt.status}, Block=${cReceipt.blockNumber}, To=${cReceipt.to}, Logs=${cReceipt.logs.length}`);
    console.log(`  Settle:   Status=${sReceipt.status}, Block=${sReceipt.blockNumber}, To=${sReceipt.to}, Logs=${sReceipt.logs.length}`);
  }

  console.log('\n=== CHECK 3: Settlement Premium Recomputation ===');
  // Raw values from Market 3 settlement log
  const sReceipt3 = await client.getTransactionReceipt({ hash: marketTxs[2].settle as `0x${string}` });
  const marketSettledAbi = parseAbiItem('event MarketSettled(uint256 indexed marketId, uint256 winningProposalId, uint256 winningTWAP, uint256 priceDeltaBps)');
  for (const log of sReceipt3.logs) {
    if (log.address.toLowerCase() === UMIA_MARKET_CORE.toLowerCase()) {
      try {
        const decoded = decodeEventLog({
          abi: [marketSettledAbi],
          data: log.data,
          topics: log.topics,
        });
        console.log('Decoded MarketSettled event for Market 3:', decoded.args);
      } catch {}
    }
  }

  // Query contract state for proposals 5, 6, 7, 8
  const coreAbi = parseAbi([
    'function winningProposalByMarketId(uint256 marketId) external view returns ((uint256 proposalId, uint256 price))',
    'function getProposalTWAP(uint256 proposalId) external view returns (uint256 twapX112)',
    'function cpmmStates(uint256 proposalId) external view returns (uint256 reserve0, uint256 reserve1)',
    'function marketSettlementState(uint256 marketId) external view returns (uint256 realVenture, uint256 realMoney, uint256 lpTokenId, uint256 ventureRemoved, uint256 moneyRemoved, uint128 liquidityRemoved)',
  ]);
  const hubAbi = parseAbi([
    'function winningMarketThresholdBps() external view returns (uint16)',
    'function decisionMarketExecutionDelay() external view returns (uint32)',
  ]);

  const [winnerM3, twap5, twap6, twap7, twap8, threshBps, execDelay, settlState3] = await Promise.all([
    client.readContract({ address: UMIA_MARKET_CORE, abi: coreAbi, functionName: 'winningProposalByMarketId', args: [3n] }),
    client.readContract({ address: UMIA_MARKET_CORE, abi: coreAbi, functionName: 'getProposalTWAP', args: [5n] }),
    client.readContract({ address: UMIA_MARKET_CORE, abi: coreAbi, functionName: 'getProposalTWAP', args: [6n] }),
    client.readContract({ address: UMIA_MARKET_CORE, abi: coreAbi, functionName: 'getProposalTWAP', args: [7n] }),
    client.readContract({ address: UMIA_MARKET_CORE, abi: coreAbi, functionName: 'getProposalTWAP', args: [8n] }),
    client.readContract({ address: UMIA_HUB, abi: hubAbi, functionName: 'winningMarketThresholdBps' }),
    client.readContract({ address: UMIA_HUB, abi: hubAbi, functionName: 'decisionMarketExecutionDelay' }),
    client.readContract({ address: UMIA_MARKET_CORE, abi: coreAbi, functionName: 'marketSettlementState', args: [3n] }),
  ]);

  console.log('Hub winningMarketThresholdBps:', threshBps);
  console.log('Hub decisionMarketExecutionDelay:', execDelay);
  console.log('Stored winning proposal for Market 3:', winnerM3);
  console.log('TWAPs:', {
    proposal5: twap5.toString(),
    proposal6: twap6.toString(),
    proposal7: twap7.toString(),
    proposal8: twap8.toString(),
  });
  console.log('Settlement state for Market 3:', {
    realVenture: settlState3[0].toString(),
    realMoney: settlState3[1].toString(),
    lpTokenId: settlState3[2].toString(),
    ventureRemoved: settlState3[3].toString(),
    moneyRemoved: settlState3[4].toString(),
    liquidityRemoved: settlState3[5].toString(),
  });

  // Recomputing:
  const diff = twap6 - twap5;
  const deltaBps = (diff * 10000n) / twap5;
  console.log('Manual recomputation of deltaBps: (diff * 10000 / twap5) =', deltaBps.toString(), 'bps');
  console.log(`Percentage premium: +${Number(deltaBps) / 100}%`);

  console.log('\n=== CHECK 4: Historical Swaps Dataset Audit ===');
  const localSwaps = JSON.parse(fs.readFileSync('src/data/market3-swaps.json', 'utf8'));
  console.log('Local swaps count:', localSwaps.length);
  const firstSwap = localSwaps[0];
  const lastSwap = localSwaps[localSwaps.length - 1];
  console.log('First swap block:', firstSwap.blockNumber, 'tx:', firstSwap.txHash);
  console.log('Last swap block:', lastSwap.blockNumber, 'tx:', lastSwap.txHash);

  // Check for duplicates
  const seen = new Set<string>();
  let dupes = 0;
  for (const s of localSwaps) {
    const key = `${s.txHash}-${s.logIndex}`;
    if (seen.has(key)) dupes++;
    seen.add(key);
  }
  console.log('Duplicate swaps count:', dupes);

  // Check min and max prices
  let minP = Infinity, maxP = -Infinity;
  for (const s of localSwaps) {
    minP = Math.min(minP, s.priceBefore, s.priceAfter);
    maxP = Math.max(maxP, s.priceBefore, s.priceAfter);
  }
  console.log('Local swaps price range: min =', minP, 'max =', maxP);

  console.log('\n=== CHECK 5: Execution Transaction Deep Inspection ===');
  const execTxHash = '0xc2496ef7e5383b6522b0dc22159b12974aad8c204c52be40fa44db19daf23811';
  const execReceipt = await client.getTransactionReceipt({ hash: execTxHash });
  console.log(`Execution Tx Status: ${execReceipt.status}, Block: ${execReceipt.blockNumber}, Logs: ${execReceipt.logs.length}`);

  // Trace ERC20 Transfer events in execution tx
  const transferEventAbi = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');
  for (const log of execReceipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: [transferEventAbi],
        data: log.data,
        topics: log.topics,
      });
      console.log(`Transfer: Token=${log.address}, From=${decoded.args.from}, To=${decoded.args.to}, Value=${decoded.args.value.toString()}`);
    } catch {}
  }
}

audit().catch(console.error);
