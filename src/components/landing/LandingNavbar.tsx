 'use client';
 
 import Link from 'next/link';
 import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
 
 export function LandingNavbar() {
   return (
     <header className="absolute -translate-x-1/2 left-1/2 z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-6 pt-6 md:px-10">
       {/* Left – Logo */}
       <div className="w-40">
         <div className="flex items-center gap-3">
           <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/40">
             <div className="h-6 w-6 rounded-xl bg-emerald-400 shadow-btn-glow" />
           </div>
           <span className="text-xs font-semibold tracking-[0.3em] text-emerald-200">
             360Trader
           </span>
         </div>
       </div>
 
       {/* Center – pill navbar with glowing green border */}
       <div className="relative hidden items-center justify-center md:flex">
         {/* Fading border wrapper */}
         <div className="relative rounded-full p-px backdrop-blur-2xl"
              style={{
                background: 'linear-gradient(to right, rgba(16, 185, 129, 0.4) 0%, transparent 30%, transparent 70%, rgba(16, 185, 129, 0.4) 100%)'
              }}>
           <nav className="flex items-center gap-6 rounded-full bg-black/40 p-1 text-xs text-slate-100">
             {/* Left circular icon */}
             <Link href="/" aria-label="Home" className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-900 text-slate-950 shadow-btn-glow">
               <Image src="/bull.png" alt="Logo" width={40} height={40} />
             </Link>
 
             {['Bots', 'Markets', 'Trade', 'Token', 'FAQ'].map(
               (item) => {
                 const href =
                   item === 'Bots'
                     ? '/bots'
                     : item === 'Markets'
                     ? '/trade'
                     : item === 'Trade'
                     ? '/trade'
                     : item === 'Token'
                     ? '/#portfolio'
                     : item === 'FAQ'
                     ? '/#faq'
                     : '/trade';
 
                 return (
                   <Link
                     key={item}
                     href={href}
                     aria-label={item}
                     className={`text-[11px] font-medium transition-colors ${
                       item === 'Trade' ? 'text-white' : 'text-slate-400 hover:text-slate-100'
                     }`}
                   >
                     {item}
                   </Link>
                 );
               },
             )}
 
             {/* Right arrow circle */}
             <Link
               href="/register"
               aria-label="Sign up"
               className="ml-1 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-btn-glow"
             >
               <ArrowRight className="h-4 w-4" />
             </Link>
           </nav>
         </div>
       </div>
 
       {/* Right – Sign in */}
       <div className="w-40 flex justify-end">
         <Link
           href="/login"
           className="hidden text-xs font-medium text-slate-300 hover:text-white md:inline-block"
         >
           Sign in
         </Link>
       </div>
     </header>
   );
 }
 