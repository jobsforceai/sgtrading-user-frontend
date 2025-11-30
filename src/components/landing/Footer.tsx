import { Linkedin, Send, Facebook, Gamepad2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-24 py-16 w-full overflow-hidden bg-black">
      {/* grid + soft glow */}
      <div className="pointer-events-none absolute inset-0 bg-footer-grid opacity-20" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.45),transparent_70%)]" />

      {/* huge SGXTrader word in background */}
      <div className="pointer-events-none absolute inset-x-[-4vw] -bottom-20 z-0 flex justify-center">
        <span className="footer-brand-text select-none text-[15vw] leading-none opacity-[0.4]">
          SGXTrader
        </span>
      </div>

      {/* top row: logo + nav + socials */}
      <div className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 pt-7 md:px-10">
        {/* logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-900 ring-1 ring-emerald-500/50">
            <Image src="/bull.png" alt="Logo" width={40} height={40} />
          </div>
          <span className="text-xs font-semibold tracking-[0.3em] text-emerald-300">
            SGXTrader
          </span>
        </div>

        {/* nav */}
        <nav className="hidden items-center gap-8 text-[11px] text-slate-200 md:flex">
          {['Bots', 'Markets', 'Trade', 'Token', 'Contact'].map(
            (item) => {
              const href =
                item === 'Bots' ? '/bots' :
                item === 'Markets' ? '/trade' :
                item === 'Trade' ? '/trade' :
                item === 'Token' ? '/#portfolio' :
                item === 'Contact' ? '/#contact' : '/';

              return (
                <Link key={item} href={href} className="transition-colors hover:text-white">
                  {item}
                </Link>
              );
            }
          )}
        </nav>

        {/* socials */}
        <div className="flex items-center gap-3 text-slate-300">
          <IconCircle>
            <Send className="h-3.5 w-3.5" />
          </IconCircle>
          <IconCircle>
            <Linkedin className="h-3.5 w-3.5" />
          </IconCircle>
          <IconCircle>
            <Facebook className="h-3.5 w-3.5" />
          </IconCircle>
          <IconCircle>
            <Gamepad2 className="h-3.5 w-3.5" />
          </IconCircle>
        </div>
      </div>

      {/* bottom row: copyright + font note */}
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 pb-8 pt-4 text-[11px] text-slate-500 md:flex-row md:px-10">
        <p>© {year} SGXTrader. All rights reserved.</p>

      </div>
    </footer>
  );
}

function IconCircle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-slate-100 ring-1 ring-white/10 transition hover:bg-white/10">
      {children}
    </div>
  );
}
