'use client';

import { redeemSgcCode } from '@/actions/sgc';
import { useActionState, useEffect, useRef, useTransition } from 'react';
import { ArrowRight } from 'lucide-react';

export default function SgcRedemption({ onRedemptionSuccess }: { onRedemptionSuccess: () => void }) {
  const [state, formAction] = useActionState(redeemSgcCode, undefined);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.data) {
      onRedemptionSuccess();
      formRef.current?.reset();
    }
  }, [state, onRedemptionSuccess]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <div className="text-center">
      <p className="mt-1 text-sm text-gray-400">
        Enter a code from SGChain to deposit funds into your live balance.
      </p>
      <form onSubmit={handleSubmit} ref={formRef} className="mt-4 space-y-4">
        <div className="relative">
          <input
            type="text"
            name="code"
            id="sgc-code"
            className="block w-full bg-gray-800 border-gray-600 rounded-full shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm text-white pl-4 pr-16 py-3"
            placeholder="SGT-XXXX-YYYY"
            required
            disabled={isPending}
          />
          <button
            type="submit"
            className="absolute inset-y-0 right-0 flex items-center justify-center w-14 h-full text-white bg-emerald-600 rounded-full hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
            disabled={isPending}
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Codes expire in 10 minutes.
        </p>

        {state?.error && (
          <p className="text-sm text-red-500">{state.error}</p>
        )}

        {state?.data && (
           <p className="text-sm text-green-500">
            <strong>Success!</strong><br />
            Credited: <strong>${(state.data.amountUsd as number).toFixed(2)} USD</strong><br />
            (from {state.data.originalSgcAmount} SGC)
          </p>
        )}
      </form>
      <p className="mt-4 text-xs text-gray-500">
        Get your code? Go to{' '}
        <a
          href={process.env.NEXT_PUBLIC_SGCHAIN_SITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-400 hover:underline"
        >
          SGChain
        </a>
      </p>
    </div>
  );
}
