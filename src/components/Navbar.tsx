import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Menu, X, Layers, BarChart3, Calculator, HelpCircle, ChevronRight } from 'lucide-react';
import { UmiaLogo } from './UmiaLogo';
import { Market } from '../types';

export type NavTab = 'directory' | 'terminal-list' | 'terminal-detail' | 'settlement-list' | 'settlement-detail' | 'methodology';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onOpenVerifier: () => void;
  selectedMarketId: number;
  markets: Market[];
  onSelectMarket: (id: number) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenVerifier,
  selectedMarketId,
  markets,
  onSelectMarket,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isTerminalActive = activeTab === 'terminal-list' || activeTab === 'terminal-detail';
  const isSettlementActive = activeTab === 'settlement-list' || activeTab === 'settlement-detail';

  const handleTabClick = (tab: NavTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const navItems = [
    {
      id: 'directory' as NavTab,
      label: 'Markets Directory',
      icon: Layers,
      isActive: activeTab === 'directory',
      iconColor: '',
    },
    {
      id: 'terminal-list' as NavTab,
      label: 'Trading Terminals',
      icon: BarChart3,
      isActive: isTerminalActive,
      iconColor: 'text-emerald-400',
    },
    {
      id: 'settlement-list' as NavTab,
      label: 'Settlement Audits',
      icon: Calculator,
      isActive: isSettlementActive,
      iconColor: 'text-sky-400',
    },
    {
      id: 'methodology' as NavTab,
      label: 'How It Works',
      icon: HelpCircle,
      isActive: activeTab === 'methodology',
      iconColor: 'text-amber-400',
    },
  ];

  return (
    <header className="fixed top-3 sm:top-4 inset-x-0 z-40 px-3 sm:px-6 lg:px-8 pointer-events-none">
      <div className="max-w-7xl mx-auto pointer-events-auto">
        <div className="bg-slate-900/75 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 rounded-2xl sm:rounded-3xl ring-1 ring-white/5 transition-all duration-200 overflow-hidden">
          <div className="px-4 sm:px-6">
            <div className="flex items-center justify-between gap-4 h-16">
          {/* Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => handleTabClick('directory')}
              className="text-left group cursor-pointer focus:outline-none flex items-center gap-2.5"
            >
              <div className="relative flex items-center justify-center group-hover:scale-105 transition-transform">
                <UmiaLogo className="w-10 h-10" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-slate-100 group-hover:text-emerald-400 transition-colors whitespace-nowrap">
                  Umia Explorer
                </span>
                <span className="text-[10px] text-slate-400 font-mono -mt-0.5">
                  Futarchy on Base
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links with Magnetic Sliding Pill */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap z-10 ${
                    item.isActive ? 'text-slate-100 font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.isActive && (
                    <motion.div
                      layoutId="navbar-active-pill"
                      className="absolute inset-0 bg-slate-800 border border-slate-700/80 rounded-lg shadow-sm -z-10"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}
                  <Icon className={`w-3.5 h-3.5 ${item.iconColor || ''}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 bg-slate-900/60 border border-slate-800 rounded-lg font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Base (8453)</span>
            </div>

            <button
              onClick={onOpenVerifier}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-sm hover:shadow"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verify Onchain</span>
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={onOpenVerifier}
              className="p-2 text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-lg"
              title="Verify Onchain"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-lg focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-slate-200" /> : <Menu className="w-5 h-5 text-slate-200" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer / Slide-down Menu with Framer Motion */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden border-t border-white/10 bg-slate-950/95 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-3 shadow-2xl overflow-hidden"
          >
            <div className="text-xs font-mono text-slate-400 px-2 py-1 flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span>Navigation Menu</span>
              <span className="flex items-center gap-1 text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Base Mainnet (8453)
              </span>
            </div>

            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-xs font-medium transition-colors ${
                      item.isActive
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-900/60 text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${item.iconColor || 'text-emerald-400'}`} />
                      <div>
                        <div className="font-semibold">{item.label}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  onOpenVerifier();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-emerald-400 text-slate-950 flex items-center justify-center gap-2 shadow-sm cursor-pointer hover:bg-emerald-300 transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Verify Live Contract on Base</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
