/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar, NavTab } from './components/Navbar';
import { Footer } from './components/Footer';
import { MarketDirectory } from './components/MarketDirectory';
import { MarketDetail } from './components/MarketDetail';
import { TerminalList } from './components/TerminalList';
import { SettlementList } from './components/SettlementList';
import { SettlementBreakdown } from './components/SettlementBreakdown';
import { Methodology } from './components/Methodology';
import { LiveVerifierModal } from './components/LiveVerifierModal';
import { ContractService } from './services/contractService';
import { Market, SwapObservation } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('directory');
  const [selectedMarketId, setSelectedMarketId] = useState<number>(3);
  const [isVerifierOpen, setIsVerifierOpen] = useState<boolean>(false);

  const [markets, setMarkets] = useState<Market[]>([]);
  const [swaps, setSwaps] = useState<SwapObservation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = ContractService.getMarkets();
      const marketSwaps = ContractService.getMarketSwaps(selectedMarketId);
      setMarkets(data);
      setSwaps(marketSwaps);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' UTC');
    } catch (err: any) {
      setError(err?.message || 'Failed to load Umia decision markets data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMarketId]);

  // Scroll to top instantly on every navigation/tab transition
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [activeTab]);

  const selectedMarket = markets.find((m) => m.id === selectedMarketId) || markets[0];

  // Dynamic SEO title & social meta updates on tab and market transitions
  useEffect(() => {
    const titles: Record<NavTab, string> = {
      'directory': 'Umia Decision Market Explorer | Futarchy on Base',
      'terminal-list': 'Trading Terminals & Candlestick Charts | Umia Explorer',
      'terminal-detail': selectedMarket
        ? `Market #${selectedMarket.id}: ${selectedMarket.ventureName} | Umia Explorer`
        : 'Trading Terminal | Umia Explorer',
      'settlement-list': 'Settlement Audits & Invariant Proofs | Umia Explorer',
      'settlement-detail': selectedMarket
        ? `Settlement Proof Market #${selectedMarket.id} | Umia Explorer`
        : 'Settlement Audit | Umia Explorer',
      'methodology': 'Protocol Methodology & Futarchy Guide | Umia Explorer',
    };
    const title = titles[activeTab] || 'Umia Decision Market Explorer | Futarchy on Base';
    document.title = title;

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);

    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', title);
  }, [activeTab, selectedMarket]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500/20 selection:text-emerald-300 overflow-x-hidden">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenVerifier={() => setIsVerifierOpen(true)}
        selectedMarketId={selectedMarketId}
        markets={markets}
        onSelectMarket={(id) => {
          setSelectedMarketId(id);
          // If on list, transition to detail
          if (activeTab === 'terminal-list') setActiveTab('terminal-detail');
          if (activeTab === 'settlement-list') setActiveTab('settlement-detail');
        }}
      />

      <main className="flex-1 pt-24 sm:pt-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Tab 1: Markets Directory */}
            {activeTab === 'directory' && (
              <MarketDirectory
                markets={markets}
                onSelectMarket={(id) => {
                  setSelectedMarketId(id);
                }}
                onNavigateTab={(tab) => {
                  if (tab === 'detail') setActiveTab('terminal-detail');
                  else if (tab === 'settlement') setActiveTab('settlement-detail');
                  else if (tab === 'methodology') setActiveTab('methodology');
                }}
                isLoading={isLoading}
                error={error}
                onRetry={loadData}
                lastUpdated={lastUpdated}
              />
            )}

            {/* Tab 2A: Trading Terminals Hub (List of all market charts) */}
            {activeTab === 'terminal-list' && (
              <TerminalList
                markets={markets}
                onSelectTerminal={(id) => {
                  setSelectedMarketId(id);
                  setActiveTab('terminal-detail');
                }}
              />
            )}

            {/* Tab 2B: Individual Trading Terminal Detail (DEXScreener chart & outcomes) */}
            {activeTab === 'terminal-detail' && selectedMarket && (
              <MarketDetail
                market={selectedMarket}
                swaps={swaps}
                onBack={() => setActiveTab('terminal-list')}
                onNavigateSettlement={() => setActiveTab('settlement-detail')}
                onOpenVerifier={() => setIsVerifierOpen(true)}
              />
            )}

            {/* Tab 3A: Settlement Audits Hub (List of all settled markets) */}
            {activeTab === 'settlement-list' && (
              <SettlementList
                markets={markets}
                onSelectSettlement={(id) => {
                  setSelectedMarketId(id);
                  setActiveTab('settlement-detail');
                }}
                onOpenVerifier={() => setIsVerifierOpen(true)}
              />
            )}

            {/* Tab 3B: Individual Settlement Audit Detail (Step-by-step mathematical proof) */}
            {activeTab === 'settlement-detail' && selectedMarket && (
              <SettlementBreakdown
                market={selectedMarket}
                onBack={() => setActiveTab('settlement-list')}
                onOpenVerifier={() => setIsVerifierOpen(true)}
                onSelectMarket={(id) => setSelectedMarketId(id)}
                allMarkets={markets}
              />
            )}

            {/* Tab 4: How It Works / Protocol Methodology */}
            {activeTab === 'methodology' && <Methodology />}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />

      <LiveVerifierModal
        isOpen={isVerifierOpen}
        onClose={() => setIsVerifierOpen(false)}
        marketId={selectedMarketId}
      />
    </div>
  );
}
