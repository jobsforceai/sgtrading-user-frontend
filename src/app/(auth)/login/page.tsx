'use client';

import { requestOtp, login } from '@/actions/auth';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { useState, useActionState, useEffect } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setTokens } = useAuthStore();
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState('');

  const [requestOtpState, requestOtpFormAction] = useActionState(requestOtp, undefined);
  const [loginState, loginFormAction] = useActionState(login, undefined);

  useEffect(() => {
    if (requestOtpState?.data && !otpSent) {
      setOtpSent(true);
    }
  }, [requestOtpState, otpSent]);

  useEffect(() => {
    if (loginState?.data) {
      setUser(loginState.data.user);
      setTokens(loginState.data.tokens);
      router.push('/dashboard');
    }
  }, [loginState, setUser, setTokens, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-900">Login</h1>
        {!otpSent ? (
          <form action={requestOtpFormAction} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {requestOtpState?.error && (
              <p className="text-sm text-red-500">{requestOtpState.error}</p>
            )}
            <div>
              <button
                type="submit"
                className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Request OTP
              </button>
            </div>
          </form>
        ) : (
          <form action={loginFormAction} className="space-y-6">
            <input type="hidden" name="email" value={email} />
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-gray-700"
              >
                OTP
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                required
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            {loginState?.error && (
              <p className="text-sm text-red-500">{loginState.error}</p>
            )}
            <div>
              <button
                type="submit"
                className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
