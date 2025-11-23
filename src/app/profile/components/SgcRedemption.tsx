'use client';

import { redeemSgcCode } from '@/actions/sgc';
import { useActionState, useEffect, useRef, useTransition } from 'react';

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
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-lg font-medium text-gray-900">Redeem SGC Code</h2>
      <p className="mt-1 text-sm text-gray-500">
        Enter a code from SGChain to deposit funds into your live balance.
      </p>
      <form onSubmit={handleSubmit} ref={formRef} className="mt-4 space-y-4">
        <div>
          <label htmlFor="sgc-code" className="sr-only">
            SGC Redemption Code
          </label>
          <input
            type="text"
            name="code"
            id="sgc-code"
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Enter SGC Code (e.g., SGT-XXXX-YYYY)"
            required
            disabled={isPending}
          />
           <p className="mt-2 text-xs text-gray-500">
            Codes expire in 10 minutes.
          </p>
        </div>

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

        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          disabled={isPending}
        >
          {isPending ? 'Redeeming...' : 'Redeem Code'}
        </button>
      </form>
    </div>
  );
}

