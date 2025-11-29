import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import CandlestickGraph from './CandlestickGraph';




export function Hero() {
  return (
    <section className="relative mx-auto flex w-full min-h-screen h-[110vh] flex-col items-center justify-center px-6 md:px-10 text-center overflow-visible">
      {/* Radial glow behind hero text (larger on md so it can overflow) */}
      <div className="pointer-events-none absolute top-0 left-1/2 z-0 h-[420px] md:h-[520px] w-full md:w-full -translate-x-1/2 -translate-y-12 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.25),transparent_60%)]" />

      {/* Gradient vignette on sides like original */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[35%] bg-linear-to-r from-black via-black/70 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[35%] bg-linear-to-l from-black via-black/70 to-transparent" />

      {/* Animated SVG graph at the bottom */}
      <div className="pointer-events-none opacity-70 absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 h-[180px] md:h-[300px] w-full md:w-full">
        <CandlestickGraph />
      </div>

      <div className="relative z-10 max-w-3xl">
        {/* Label pill */}
        <div className="mb-7 inline-flex items-center gap-2 rounded-full bg-black/10 px-4 py-2 text-[11px] font-medium text-emerald-200 border-r border-l border-emerald-600 backdrop-blur"
          style={{
            background: 'linear-gradient(to right, rgba(16, 185, 129, 0.4) 0%, transparent 30%, transparent 70%, rgba(16, 185, 129, 0.4) 100%)'
          }}>
          Trading Bots
        </div>

        {/* Main heading */}
        <h1 className="mb-5 text-4xl font-semibold leading-tight tracking-tight text-slate-50 sm:text-5xl md:text-6xl">
          The Fastest and Secure
          <br className="hidden sm:block" />
          AI Trading Assistant.
        </h1>

        {/* Sub text */}
        <p className="mb-9 text-xs text-slate-200 sm:text-sm">
          Trade faster and smarter with our secure AI bots. Maximize your
          investments with real-time insights and automation.
        </p>

        {/* CTA buttons */}
        <div className="flex items-center justify-center gap-4">
          <Link href="/register">
            <button className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-7 py-3 text-xs font-semibold text-slate-950 shadow-btn-glow transition hover:bg-emerald-400">
              Try Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </Link>

          {/* <button className="text-xs font-medium text-slate-300 hover:text-white">
            Learn more
          </button> */}
        </div>
      </div>
    </section>
  );
}