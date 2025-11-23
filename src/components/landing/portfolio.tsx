import Image from 'next/image';

export function PortfolioSection() {
    return (
        <section id="portfolio" className="relative mx-auto pt-24 w-full max-w-6xl px-6 pb-32 md:px-10">

            <div className="relative z-10 flex flex-col items-center text-center">
                {/* pill */}
                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-[11px] font-medium text-emerald-200 ring-1 ring-emerald-400/40 backdrop-blur">
                    <span className="text-xs">🔥</span>
                    <span>Premium Features at a Fair Price</span>
                </div>

                <h2 className="mb-10 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
                    Get More From Your
                    <br className="hidden sm:block" />
                    <span className="sm:ml-2">Portfolio.</span>
                </h2>
            </div>

            {/* GRID AREA */}
            <div className="relative z-10 space-y-6 md:space-y-8">
                {/* TOP FULL-WIDTH CARD */}
                <article className="flex flex-col overflow-hidden rounded-[32px] border border-emerald-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.38),_rgba(2,6,23,1)_70%)] px-6 py-8 shadow-[0_0_70px_rgba(16,185,129,0.3)] backdrop-blur-2xl md:flex-row md:items-center md:px-12 md:py-10">
                    {/* left copy */}
                    <div className="w-full md:w-1/2">
                        <h3 className="mb-4 text-xl font-semibold text-slate-50 sm:text-2xl">
                            The Sgx Token
                        </h3>
                        <p className="mb-7 text-xs leading-relaxed text-slate-300 sm:text-[13px]">
                            The next generation of high-utility platform tokens is here.
                            Sgx gives traders premium access to trading bots and
                            discounted fees across the entire ecosystem.
                        </p>

                        <button className="inline-flex items-center rounded-full bg-emerald-500 px-6 py-3 text-xs font-semibold text-slate-950 shadow-[0_0_40px_rgba(16,185,129,0.8)] transition hover:bg-emerald-400">
                            Get Started
                            <span className="ml-2 text-[13px]">→</span>
                        </button>
                    </div>

                    {/* right image */}
                    <div className="mt-8 flex w-full justify-center md:mt-0 md:w-1/2">
                        <div className="relative h-40 w-40 md:h-48 md:w-48">
                            {/* glow behind token stack */}
                            <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle,_rgba(16,185,129,0.5),_transparent_70%)] blur-xl" />
                            <Image
                                src="/Sgx-token-stack.png"
                                alt="Sgx token neon stack"
                                fill
                                className="relative object-contain"
                                priority
                            />
                        </div>
                    </div>
                </article>

                {/* BOTTOM 2-COLUMN GRID */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* LEFT CARD */}
                    <article className="flex flex-col overflow-hidden md:h-134 rounded-[32px] border border-emerald-500/18 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.35),_rgba(2,6,23,1)_75%)] px-6 py-8 backdrop-blur-2xl md:px-10 md:py-9 pb-10">
                        <div className="flex-1">
                            <h3 className="mb-3 text-lg font-semibold text-slate-50 sm:text-xl">
                                All-in-one Crypto Investment Tracking
                            </h3>
                            <p className="mb-6 text-xs leading-relaxed text-slate-300 sm:text-[13px]">
                                Stay on top of your portfolio with real-time performance
                                tracking and enhanced analytics so you always know your
                                true cost and risk.
                            </p>

                            <button className="inline-flex items-center rounded-full bg-emerald-500 px-5 py-2.5 text-[11px] font-semibold text-slate-950 shadow-[0_0_30px_rgba(16,185,129,0.8)] transition hover:bg-emerald-400">
                                Get Started
                                <span className="ml-2 text-[12px]">→</span>
                            </button>
                        </div>

                        {/* angled avatar card */}
                        <div className="md:absolute md:-bottom-30 md:right-1/2 md:translate-x-1/2 flex justify-center md:justify-start">
                            <div className="relative h-40 w-40 rotate-[-10deg] md:h-100 md:w-100">
                                <Image
                                    src="/verified-trader-card.png"
                                    alt="Verified trader card"
                                    fill
                                    className="rounded-[28px] object-contain"
                                />
                            </div>
                        </div>
                    </article>

                    {/* RIGHT CARD */}
                    <article className="flex flex-col overflow-hidden md:h-134 rounded-[32px] border border-emerald-500/18 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.35),_rgba(2,6,23,1)_75%)] px-6 py-8 backdrop-blur-2xl md:px-10 md:py-9">
                        <div className="flex-1">
                            <h3 className="mb-3 text-lg font-semibold text-slate-50 sm:text-xl">
                                Smart Trading Wherever Crypto Lives
                            </h3>
                            <p className="mb-6 text-xs leading-relaxed text-slate-300 sm:text-[13px]">
                                Connect wallets, exchanges and custodians to unlock
                                allocation-aware orders, auto-rebalancing and execution
                                insights across your entire stack.
                            </p>

                            <button className="inline-flex items-center rounded-full bg-emerald-500 px-5 py-2.5 text-[11px] font-semibold text-slate-950 shadow-[0_0_30px_rgba(16,185,129,0.8)] transition hover:bg-emerald-400">
                                Get Started
                                <span className="ml-2 text-[12px]">→</span>
                            </button>
                        </div>

                        {/* angled allocations chart */}
                        <div className="md:absolute md:-bottom-30 md:right-1/2 md:translate-x-1/2 flex justify-center md:justify-start">
                            <div className="relative h-40 w-40 rotate-[10deg] md:h-100 md:w-100">
                                <Image
                                    src="/allocations-chart-card.png"
                                    alt="Current allocations donut chart"
                                    fill
                                    className="rounded-[28px] object-cover"
                                />
                            </div>
                        </div>
                    </article>
                </div>
            </div>
        </section>
    );
}
