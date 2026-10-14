export interface Proposal {
  id: number;
  title: string;
  isNoOp: boolean;
  virtualVentureId: number;
  virtualMoneyId: number;
  spotPriceUsd: number;
  twapX112: string;
  twapUsd: number;
  reserve0: string;
  reserve1: string;
  deltaBpsVsNoOp?: number;
  executionPayloadHex?: string;
  decodedActions?: GovernanceActionItem[];
}

export interface GovernanceActionItem {
  actionType: number;
  actionName: string;
  targetAddress: string;
  targetProtocolName?: string;
  amountUsd?: number;
  description: string;
}

export interface SettlementState {
  realVenture: string;
  realMoney: string;
  lpTokenId: string;
  ventureRemoved: string;
  moneyRemoved: string;
  liquidityRemoved: string;
}

export interface Market {
  id: number;
  ventureId: number;
  ventureName: string;
  ventureAddress: string;
  tokenAddress: string;
  tokenSymbol: string;
  moneyTokenAddress: string;
  moneyTokenSymbol: string;
  moneyTokenDecimals: number;
  title: string;
  contractAddress: string;
  tradingStart: number;
  tradingEnd: number;
  winningThresholdBps: number;
  executionDelay: number;
  status: 'PENDING' | 'OPEN' | 'ENDED';
  settled: boolean;
  executed: boolean;
  proposalIds: number[];
  proposals: Proposal[];
  settlementState?: SettlementState;
  winningProposalId: number | null;
  winningPriceX112: string | null;
  winningPriceUsd: number | null;
  noOpPriceUsd: number | null;
  priceDeltaBps: number | null;
  createTxHash: string | null;
  createBlock: number | null;
  settleTxHash: string | null;
  settleBlock: number | null;
  executeTxHash: string | null;
  executeBlock: number | null;
  descriptionContext: string;
  postSettlementSummary?: string;
  executedPositions?: {
    protocol: string;
    name: string;
    symbol: string;
    address: string;
    depositedUsd: number;
    currentValueUsd: number;
    apy: number;
  }[];
}

export interface SwapObservation {
  blockNumber: number;
  timestamp: number;
  isoTime: string;
  txHash: string;
  logIndex: number;
  proposalId: number;
  proposalTitle: string;
  trader: string;
  zeroForOne: boolean;
  type: 'SELL_UMIA' | 'BUY_UMIA';
  amountIn: string;
  amountOut: string;
  priceBefore: number;
  priceAfter: number;
  priceImpactBps: number;
  volumeUsdc: number;
}
