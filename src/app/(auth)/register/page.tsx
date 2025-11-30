'use client';

import { register } from '@/actions/auth';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ErrorMessage from '@/components/ui/ErrorMessage';

export default function RegisterPage() {
  const router = useRouter();
  const { setUser, setTokens } = useAuthStore();
  const [state, formAction] = useActionState(register, undefined);

  useEffect(() => {
    if (state && !state.error && state.user && state.tokens) {
      setUser(state.user);
      setTokens(state.tokens);
      router.push('/trade');
    }
  }, [state, router, setUser, setTokens]);

  return (
    <div className="relative min-h-screen bg-black flex items-center justify-center p-4">
      <div className="absolute inset-0 z-0">
        <div className="pointer-events-none absolute inset-x-0 -top-20 z-0 h-[400px] rounded-[40px] bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.55),_transparent_70%)] blur-3xl" />
      </div>
      <div className="relative z-10 w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center bg-black/50 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden">
        <div className="hidden md:flex flex-col items-center justify-center p-8">
          <Image src="/auth-bg.png" alt="Abstract background" width={500} height={500} className="object-contain" />
        </div>
        <div className="p-8 space-y-6">
          <h1 className="text-3xl font-bold text-center text-white">Create an Account</h1>
          <form action={formAction} className="space-y-6">
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-300"
              >
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                className="w-full px-3 py-2 mt-1 bg-gray-900 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm text-white"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-3 py-2 mt-1 bg-gray-900 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm text-white"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="w-full px-3 py-2 mt-1 bg-gray-900 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm text-white"
              />
            </div>
            {state?.error && (
              <ErrorMessage message={state.error} />
            )}
            <div>
              <button
                type="submit"
                className="w-full px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                Register
              </button>
            </div>
            <div className="text-sm text-center text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-emerald-500 hover:underline">
                Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
