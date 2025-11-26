'use client';

import { requestOtp, login } from '@/actions/auth';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { useState, useActionState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import OtpInput from '@/components/ui/OtpInput';
import ErrorMessage from '@/components/ui/ErrorMessage';

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setTokens } = useAuthStore();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');

  const [requestOtpState, requestOtpFormAction] = useActionState(requestOtp, undefined);
  const [loginState, loginFormAction] = useActionState(login, undefined);

  const otpSent = requestOtpState?.data ? true : false;
  const hasError = loginState?.error ? true : false;

  useEffect(() => {
    if (loginState?.data) {
      setUser(loginState.data.user);
      setTokens(loginState.data.tokens);
      router.push('/trade');
    }
  }, [loginState, setUser, setTokens, router]);

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
          <h1 className="text-3xl font-bold text-center text-white mb-4">Login</h1>
          {!otpSent ? (
            <form action={requestOtpFormAction} className="space-y-6">
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
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {requestOtpState?.error && (
                <ErrorMessage message={requestOtpState.error} />
              )}
              <div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  Request OTP
                </button>
              </div>
            </form>
          ) : (
            <form action={loginFormAction} className="space-y-6">
              <input type="hidden" name="email" value={email} />
              <input type="hidden" name="otp" value={otp} />
              <div>
                <label
                  htmlFor="otp"
                  className="block text-sm font-medium text-gray-300"
                >
                  One-Time Passcode
                </label>
                <div className="mt-2">
                  <OtpInput onChange={setOtp} hasError={hasError} />
                </div>
              </div>
              {loginState?.error && (
                <ErrorMessage message={loginState.error} />
              )}
              <div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  Login
                </button>
              </div>
            </form>
          )}
           <div className="text-sm text-center text-gray-400">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-medium text-emerald-500 hover:underline">
                Register
              </Link>
            </div>
        </div>
      </div>
    </div>
  );
}
