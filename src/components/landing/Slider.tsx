'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Cpu,
  Layers,
  LineChart,
  ShieldCheck,
  Zap,
  Bot,
} from 'lucide-react';

type Slide = {
  tag: string;
  title: string;
  bullets: string[];
  cta: string;
  cards: {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
};

const slides: Slide[] = [
  {
    tag: 'Trading Bots',
    title: 'Trading Bots For Any Market Condition',
    bullets: [
      'Run pre-built bot strategies with just a few clicks.',
      'Automate trades across all your favourite exchanges.',
      'Try the future of trading automation with AI copilots.',
    ],
    cta: 'Learn More',
    cards: [
      {
        title: 'Cody – Strategy Assistant',
        description:
          'Write trading strategies in plain English, convert them to executable code and deploy instantly.',
        icon: Cpu,
      },
      {
        title: 'Accumulator',
        description:
          'Accumulate crypto automatically while your bot optimizes the best entry prices.',
        icon: Layers,
      },
      {
        title: 'Smart Order',
        description:
          'Route orders across markets to minimize slippage and maximize your fills.',
        icon: LineChart,
      },
    ],
  },
  {
    tag: 'Secure Smart Terminal',
    title: 'Trade Smart, Stay In Control',
    bullets: [
      'Unified terminal for spot, futures and options in one clean workspace.',
      'Institutional-grade security with API key isolation and whitelisting.',
      'Real-time risk metrics so you always know your exposure.',
    ],
    cta: 'Explore Terminal',
    cards: [
      {
        title: 'API Key Vault',
        description:
          'Manage exchange connections with hardware-grade encryption and granular permissions.',
        icon: ShieldCheck,
      },
      {
        title: 'Smart Alerts',
        description:
          'Price, volume and funding alerts delivered exactly where your team works.',
        icon: Zap,
      },
      {
        title: 'One-Click Hedging',
        description:
          'Instantly hedge positions across derivatives venues from a single ticket.',
        icon: LineChart,
      },
    ],
  },
  {
    tag: 'Portfolio Intelligence',
    title: 'See Your Entire Crypto Stack',
    bullets: [
      'Aggregate balances across wallets, exchanges and custodians.',
      'Performance analytics by asset, strategy and time frame.',
      'Tax-friendly exports for reporting and compliance.',
    ],
    cta: 'View Analytics',
    cards: [
      {
        title: 'Unified Dashboard',
        description:
          'All your holdings, P&L and open positions in one real-time view.',
        icon: Bot,
      },
      {
        title: 'Strategy Breakdown',
        description:
          'Attribute performance to bots, discretionary trades and long-term bags.',
        icon: Layers,
      },
      {
        title: 'Export & Share',
        description:
          'Generate branded reports for investors, clients or internal teams.',
        icon: Zap,
      },
    ],
  },
];

export function BotsSliderSection() {
  const [index, setIndex] = useState(0);

  const next = () => setIndex((prev) => (prev + 1) % slides.length);
  const prev = () => setIndex((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <section className="relative mx-auto w-full overflow-x-hidden md:h-screen md:flex md:items-center">
      <div className="max-w-6xl mx-auto py-8">

        
        {/* ───── CARD TRACK: only cards live here ───── */}
        <div className="relative z-10 w-full">
          <div
            className="flex w-full gap-6 md:gap-20 transition-transform duration-500 ease-[cubic-bezier(0.33,0.01,0,1)]"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {slides.map((slide) => (
              <SlideCard key={slide.title} slide={slide} />
            ))}
          </div>
        </div>

        {/* ───── CONTROLS ROW: separate from cards ───── */}
        <div className="relative z-20 mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-2 md:px-4">
          {/* arrows */}
          <div className="flex items-center gap-4">
            <button
              onClick={prev}
              aria-label="Previous slide"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/5 text-slate-200 ring-1 ring-emerald-500/30 transition hover:bg-emerald-500/15"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              onClick={next}
              aria-label="Next slide"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-[0_0_40px_rgba(16,185,129,0.9)] transition hover:bg-emerald-400"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>

          {/* loader / progress bar */}
          <div className="relative h-1 w-full sm:w-40 overflow-hidden rounded-full bg-emerald-500/10">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-500 transition-all duration-500"
              style={{ width: `${((index + 1) / slides.length) * 100}%` }}
            />
          </div>
        </div>

      </div>
    </section>
  );
}

/* ───── Single CARD (one of the three big boxes) ───── */

type SlideCardProps = {
  slide: Slide;
};

function SlideCard({ slide }: SlideCardProps) {
  return (
    <article className="flex w-full flex-shrink-0 flex-col gap-10 rounded-[32px] border border-emerald-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.4),_rgba(2,6,23,1)_65%)] px-6 py-10 shadow-[0_0_80px_rgba(16,185,129,0.35)] backdrop-blur-2xl md:flex-row md:items-center md:px-14 md:py-14">
      {/* LEFT: main copy */}
      <div className="w-full md:w-1/2">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-[11px] font-medium text-emerald-200 ring-1 ring-emerald-400/40">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.9)]" />
          <span>{slide.tag}</span>
        </div>

        <h2 className="mb-5 text-3xl font-semibold leading-tight tracking-tight text-slate-50 sm:text-[34px]">
          {slide.title}
        </h2>

        <ul className="space-y-3 text-xs text-slate-300 sm:text-[13px]">
          {slide.bullets.map((b) => (
            <li key={b} className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-2 w-2 flex-shrink-0 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.9)]" />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <button className="mt-8 inline-flex items-center rounded-full bg-emerald-500 px-7 py-3 text-xs font-semibold text-slate-950 shadow-[0_0_40px_rgba(16,185,129,0.8)] transition hover:bg-emerald-400">
          {slide.cta}
          <ArrowRight className="ml-2 h-4 w-4" />
        </button>
      </div>

      {/* RIGHT: stacked mini-cards inside this big card */}
      <div className="relative w-full md:w-1/2">
        <div className="relative space-y-4">
          {slide.cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className={[
                  'flex items-start gap-4 rounded-[22px] border border-emerald-500/25 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.25),_rgba(6,95,70,0.35)_40%,_rgba(15,23,42,0.95)_100%)] px-5 py-4 backdrop-blur-xl md:px-6 md:py-5',
                  i === 1 ? 'md:ml-6' : '',
                  i === 2 ? 'md:ml-12' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/50">
                  <Icon className="h-5 w-5 text-emerald-100" />
                </div>
                <div>
                  <h3 className="mb-1 text-[13px] font-semibold text-slate-50">
                    {card.title}
                  </h3>
                  <p className="text-[11px] leading-relaxed text-slate-300/80">
                    {card.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}
