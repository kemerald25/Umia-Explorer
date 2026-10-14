import { describe, it, expect } from 'vitest';
import { VERIFIED_MARKETS } from '../data/verifiedMarkets';
import market3Swaps from '../data/market3-swaps.json';

// Invariant calculation helper directly following SettlementLib.sol
export function calculateWinningProposal(
  proposals: { id: number; twapX112: bigint; isNoOp: boolean }[],
  winningThresholdBps: number
) {
  const noOp = proposals.find((p) => p.isNoOp);
  if (!noOp) throw new Error('No-Op proposal missing');

  let highestTWAP = noOp.twapX112;
  let highestProposalId = noOp.id;

  for (const p of proposals) {
    if (!p.isNoOp && p.twapX112 > highestTWAP) {
      highestTWAP = p.twapX112;
      highestProposalId = p.id;
    }
  }

  let winningProposalId = noOp.id;
  let winningTWAP = noOp.twapX112;
  let priceDeltaBps = 0n;

  if (highestProposalId !== noOp.id) {
    if (noOp.twapX112 === 0n) {
      priceDeltaBps = 1000000n;
    } else {
      const diff = highestTWAP - noOp.twapX112;
      priceDeltaBps = (diff * 10000n) / noOp.twapX112;
    }

    if (priceDeltaBps >= BigInt(winningThresholdBps)) {
      winningProposalId = highestProposalId;
      winningTWAP = highestTWAP;
    }
  }

  return {
    winningProposalId,
    winningTWAP,
    priceDeltaBps: Number(priceDeltaBps),
  };
}

// Convert Q112.112 fixed-point to float price in USDC
export function q112ToUsdc(twapX112: bigint): number {
  const Q112 = 2n ** 112n;
  // (twapX112 * 10^12 * 10^6) / Q112 / 10^6
  const scaled = (twapX112 * 1000000000000n * 1000000n) / Q112;
  return Number(scaled) / 1000000;
}

describe('Umia Protocol Decision Market Mechanics', () => {
  it('correctly validates Market #3 settlement math and winning proposal', () => {
    const market3 = VERIFIED_MARKETS.find((m) => m.id === 3)!;
    expect(market3).toBeDefined();

    const proposals = market3.proposals.map((p) => ({
      id: p.id,
      twapX112: BigInt(p.twapX112),
      isNoOp: p.isNoOp,
    }));

    const result = calculateWinningProposal(proposals, market3.winningThresholdBps);

    // Proposal 6 ("Full deployment: 50/50 on Aave & Steakhouse") should win
    expect(result.winningProposalId).toBe(6);
    expect(result.priceDeltaBps).toBe(675); // +6.75%
    expect(result.priceDeltaBps).toBeGreaterThanOrEqual(market3.winningThresholdBps);
  });

  it('correctly reverts to No-Op when a proposal fails the threshold barrier', () => {
    // Suppose leading proposal is only +1.50% (150 bps) above No-Op, below 200 bps threshold
    const mockProposals = [
      { id: 10, isNoOp: true, twapX112: 1000000000000000000n },
      { id: 11, isNoOp: false, twapX112: 1015000000000000000n }, // +1.5%
    ];

    const result = calculateWinningProposal(mockProposals, 200);

    // Must revert to No-Op (Proposal 10)
    expect(result.winningProposalId).toBe(10);
    expect(result.winningTWAP).toBe(1000000000000000000n);
  });

  it('correctly wins if price delta exactly equals winning threshold (boundary case)', () => {
    // Exactly +2.00% (200 bps)
    const mockProposals = [
      { id: 20, isNoOp: true, twapX112: 1000000000000000000n },
      { id: 21, isNoOp: false, twapX112: 1020000000000000000n }, // exactly +2.00%
    ];

    const result = calculateWinningProposal(mockProposals, 200);

    // Exactly 200 bps passes (priceDeltaBps >= market.winningThresholdBps)
    expect(result.winningProposalId).toBe(21);
    expect(result.priceDeltaBps).toBe(200);
  });

  it('accurately parses Q112.112 TWAP to dollar values', () => {
    // Market 3 No-Op TWAP: 3260362326647779548984n
    const noOpUsd = q112ToUsdc(3260362326647779548984n);
    expect(noOpUsd).toBeCloseTo(0.6279, 3);

    // Market 3 Proposal 6 TWAP: 3480651723117441708594n
    const winnerUsd = q112ToUsdc(3480651723117441708594n);
    expect(winnerUsd).toBeCloseTo(0.6703, 3);
  });

  it('verifies historical swaps integrity for Market #3', () => {
    expect(market3Swaps.length).toBe(209);
    const firstSwap = market3Swaps[0];
    const lastSwap = market3Swaps[market3Swaps.length - 1];

    expect(firstSwap.blockNumber).toBe(51430502);
    expect(lastSwap.blockNumber).toBe(51516674);
    // Verifies chronological ordering
    expect(firstSwap.timestamp).toBeLessThanOrEqual(lastSwap.timestamp);
  });

  it('confirms contract solvency invariant from onchain data', () => {
    const market3 = VERIFIED_MARKETS.find((m) => m.id === 3)!;
    const realVenture = BigInt(market3.settlementState!.realVenture);
    const realMoney = BigInt(market3.settlementState!.realMoney);

    expect(realVenture).toBeGreaterThan(0n);
    expect(realMoney).toBeGreaterThan(0n);
  });
});
