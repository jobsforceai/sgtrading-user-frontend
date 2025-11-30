import { Settings2, Network, Wallet2, Sparkles } from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    title: 'Automation Bot',
    description:
      'No matter the market conditions, we have a bot for that. Create your own bot with AI trading assistants.',
    cta: 'Get Started',
    icon: Settings2,
  },
  {
    title: 'Multi-Exchange',
    description:
      'Trade on top-tier exchanges from one interface with unified smart order routing and advanced charting.',
    cta: 'Get Started',
    icon: Network,
  },
  {
    title: 'Crypto Portfolio Tracking',
    description:
      'All the insights you need to manage your crypto portfolio, no matter where you hold your funds.',
    cta: 'Get Started',
    icon: Wallet2,
  },
  {
    title: 'Free Access for All',
    description:
      'Ahead of major upcoming releases, you\'re invited to use the platform at no cost for a limited time.',
    cta: 'Get Started',
    icon: Sparkles,
  },
];

export function FeaturesSection() {
  return (
    <section className="relative mx-auto w-full flex flex-col items-center justify-center max-w-6xl px-6 py-16 sm:py-20 lg:py-24">
     
      {/* heading */}
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* small pill */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-[11px] font-medium text-emerald-200 ring-1 ring-emerald-400/40 backdrop-blur">
          <span className="text-base">🚀</span>
          <span>Your Crypto</span>
        </div>

        <h2 className="mb-4 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
          Power Your Crypto
        </h2>

        <p className="max-w-2xl text-xs text-slate-400 sm:text-sm">
          SGXTrader is an all-in-one crypto trading platform with a range of pro
          trading tools designed for traders of every skill level.
        </p>
      </div>

      {/* feature cards container */}
      <div className="relative z-10 mt-12 rounded-4xl border border-emerald-500/15 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.2),rgba(2,6,23,1)_70%)] px-4 py-6 shadow-[0_0_60px_rgba(16,185,129,0.25)] backdrop-blur-xl sm:px-6 sm:py-8 md:px-10 md:py-10 w-full">
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 divide-y sm:divide-y md:divide-y-0 md:divide-x divide-emerald-500/10">
          {features.map(({ title, description, cta, icon: Icon }, idx) => (
            <div key={title} className={`flex flex-col justify-between py-6 px-0 sm:px-6 ${idx === 0 ? '' : 'sm:pt-0 md:pl-8'}`}>
              <div>
                {/* icon circle */}
                <div className="mb-6 inline-flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/12 ring-1 ring-emerald-400/40">
                  <Icon className="h-5 w-5 text-emerald-300" />
                </div>

                <h3 className="mb-3 text-sm font-semibold text-slate-50 sm:text-base">
                  {title}
                </h3>

                <p className="text-xs leading-relaxed text-slate-400 sm:text-[13px]">
                  {description}
                </p>
              </div>

              <Link href="/register">
                <button className="mt-6 inline-flex items-center text-xs font-medium text-emerald-400 hover:text-emerald-300">
                  {cta}
                  <span className="ml-1 text-[13px]">→</span>
                </button>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* bottom CTA button */}
      <div className="relative z-10 mt-10 flex justify-center">
        <Link href="/register">
          <button className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-8 py-3 text-xs font-semibold text-slate-950 shadow-[0_0_40px_rgba(16,185,129,0.8)] transition hover:bg-emerald-400">
            Get Started
            <span className="ml-2 text-[13px]">→</span>
          </button>
        </Link>
      </div>
    </section>
  );
}
