'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import SGCInput from '@/components/SGCInput';
import SGCButton from '@/components/SGCButton';
import SGCCard from '@/components/SGCCard';
import { requestOtp, loginWithOtp } from '@/services/auth.service';
import useAuthStore from '@/stores/auth.store';
import Cookies from 'js-cookie';
import AnimateGSAP from '@/components/AnimateGSAP';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';
import SGCOtpInput from '@/components/SGCOtpInput';

const LoginPage: React.FC = () => {
  const router = useRouter();
  const { setToken } = useAuthStore();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await requestOtp(email);
      setStep('otp'); // Move to the next step on the same page
    } catch (err: any) {
      setError(err.response?.data?.error || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginWithOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { accessToken } = await loginWithOtp(email, otp);
      setToken(accessToken);
      Cookies.set('sgchain_access_token', accessToken, { expires: 1 });
      router.push('/dashboard');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'An unexpected error occurred.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center bg-linear-to-b from-white to-slate-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

          {/* Illustration Column */}
          <AnimateGSAP className="hidden md:flex flex-col items-start gap-6 pl-6">
            <div data-gsap className="mt-6 w-full">
              <Image src="/login.png" alt="illustration" width={400} height={360} className="object-contain" />
            </div>
          </AnimateGSAP>

          {/* Form Column */}
          <AnimateGSAP className="flex justify-center">
            <SGCCard title="Login" className="w-full max-w-md">
              <form onSubmit={step === 'email' ? handleRequestOtp : handleLoginWithOtp} className="space-y-6">
                <div data-gsap>
                  <SGCInput
                    label="Email"
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@company.com"
                    disabled={step === 'otp'}
                  />
                </div>

                {step === 'otp' && (
                  <div data-gsap className="space-y-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">One-Time Passcode</label>
                    <SGCOtpInput
                      length={6}
                      value={otp}
                      onChange={setOtp}
                      disabled={loading}
                    />
                  </div>
                )}
                
                {error && <p className="text-red-500 text-xs italic">{error}</p>}

                <div data-gsap>
                  <SGCButton type="submit" disabled={loading} className="w-full">
                    {step === 'email' 
                      ? (loading ? 'Sending OTP...' : 'Request OTP')
                      : (loading ? 'Logging In...' : 'Login')
                    }
                  </SGCButton>
                </div>

                <div className="text-xs text-slate-400 mt-2">By continuing you agree to our <a className="underline" href="/terms">Terms</a> and <a className="underline" href="/privacy">Privacy Policy</a>.</div>
                <div className="mt-4 text-sm text-slate-500">Don't have an account? <Link href="/register" className="underline font-medium">Register</Link></div>
              </form>
            </SGCCard>
          </AnimateGSAP>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
