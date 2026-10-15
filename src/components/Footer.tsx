import React from 'react';
import { ExternalLink } from 'lucide-react';
import { UmiaLogo } from './UmiaLogo';
import { UMIA_MARKET_CORE, UMIA_HUB } from '../services/contractService';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 mt-20 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="max-w-md">
            <div className="flex items-center gap-2 mb-1.5">
              <UmiaLogo variant="white" className="w-10 h-10" />
              <span className="font-semibold text-slate-200">Umia Decision Market Explorer</span>
            </div>
            <p className="mt-1 text-slate-400 leading-relaxed">
              An independent, read-only open-source educational dashboard for exploring, verifying, and auditing futarchy decision markets on Base. Not affiliated with or endorsed by Umia Finance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-slate-400">
            <a
              href={`https://basescan.org/address/${UMIA_MARKET_CORE}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-200 transition-colors inline-flex items-center gap-1.5"
            >
              <span>UmiaMarketCore Contract</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={`https://basescan.org/address/${UMIA_HUB}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-200 transition-colors inline-flex items-center gap-1.5"
            >
              <span>UmiaHub Contract</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://github.com/umiafinance/protocol"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-200 transition-colors inline-flex items-center gap-1.5"
            >
              <span>GitHub Protocol Source</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://umia.finance/docs/decision-markets"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-200 transition-colors inline-flex items-center gap-1.5"
            >
              <span>Umia Documentation</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-400">
          <p>© 2026 Umia Decision Market Explorer. Network: Base Mainnet (Chain ID 8453).</p>
          <p className="font-mono text-[11px]">Strictly Read-Only · Zero Wallet Manipulation · No Execution Privileges</p>
        </div>
      </div>
    </footer>
  );
};
