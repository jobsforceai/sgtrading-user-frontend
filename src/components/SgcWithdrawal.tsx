'use client';

import { createSgcWithdrawalCode } from '@/actions/sgc';
import { useActionState, useEffect, useRef, useTransition, useState } from 'react';
import { ArrowRight, Copy } from 'lucide-react';

export default function SgcWithdrawal({ onWithdrawalSuccess }: { onWithdrawalSuccess: () => void }) {
  const [state, formAction] = useActionState(createSgcWithdrawalCode, undefined);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  useEffect(() => {
    if (state?.data?.code) {
      onWithdrawalSuccess();
      setGeneratedCode(state.data.code);
      formRef.current?.reset();
    }
    if (state?.error) {
        setGeneratedCode(null);
    }
  }, [state, onWithdrawalSuccess]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setGeneratedCode(null);
    startTransition(() => {
      formAction(formData);
    });
  };

  const copyToClipboard = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      alert('Code copied to clipboard!');
    }
  };

  return (
    <div className="text-center">
      <p className="mt-1 text-sm text-gray-400">
        Enter the amount in USD to generate a withdrawal code.
      </p>
      <form onSubmit={handleSubmit} ref={formRef} className="mt-4 space-y-4">
        <div className="relative">
          <input
            type="number"
            name="amountUsd"
            id="amountUsd"
            className="block w-full bg-gray-800 border-gray-600 rounded-full shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm text-white pl-4 pr-16 py-3"
            placeholder="e.g., 100"
            required
            disabled={isPending}
            step="0.01"
          />
          <button
            type="submit"
            className="absolute inset-y-0 right-0 flex items-center justify-center w-14 h-full text-white bg-emerald-600 rounded-full hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
            disabled={isPending}
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {state?.error && (
          <p className="text-sm text-red-500">{state.error}</p>
        )}

        {generatedCode && (
           <div className="text-sm text-green-500 p-3 bg-green-900/20 rounded-lg">
                <strong>Withdrawal Code Generated:</strong>
                <div className="flex items-center justify-center mt-2 bg-gray-900 p-2 rounded-md">
                    <code className="font-mono text-lg">{generatedCode}</code>
                    <button type="button" onClick={copyToClipboard} className="ml-4 text-gray-400 hover:text-white">
                        <Copy className="w-5 h-5" />
                    </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">This code can be redeemed on SGChain.</p>
           </div>
        )}
      </form>
    </div>
  );
}