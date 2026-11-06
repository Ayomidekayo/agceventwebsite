import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
ArrowLeft,
CheckCircle2,
Clock3,
LoaderCircle,
ShieldCheck,
XCircle,
} from 'lucide-react';

import PublicLayout from '../../layouts/PublicLayout';
import { getApiError } from '../../lib/api';
import { verifyPayment } from '../../lib/payment';

type PaymentState =
| 'VERIFYING'
| 'SUCCESSFUL'
| 'FAILED'
| 'PENDING';

export default function PaymentCallbackPage() {
const [searchParams] = useSearchParams();

const reference =
searchParams.get('reference') ??
searchParams.get('trxref') ??
'';

const [status, setStatus] = useState<PaymentState>('VERIFYING');
const [error, setError] = useState('');

const verificationStarted = useRef(false);

const verify = useCallback(async () => {
if (!reference) {
setStatus('FAILED');
setError('The payment reference is missing.');
return;
}


setStatus('VERIFYING');
setError('');

try {
  const result = await verifyPayment(reference);

  if (result.success && result.status === 'SUCCESSFUL') {
    setStatus('SUCCESSFUL');
    return;
  }

  if (
    ['pending', 'processing', 'abandoned'].includes(
      result.status.toLowerCase(),
    )
  ) {
    setStatus('PENDING');
    return;
  }

  setStatus('FAILED');
} catch (requestError) {
  setStatus('PENDING');

  setError(
    getApiError(
      requestError,
      'We could not confirm your payment at this time.',
    ),
  );
}


}, [reference]);

useEffect(() => {
if (verificationStarted.current) return;


verificationStarted.current = true;
void verify();


}, [verify]);

return ( <PublicLayout> <main className="flex min-h-[75vh] items-center justify-center bg-[#F7F8FA] px-5 py-16"> <section className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl"> <div className="bg-[#101B35] px-7 py-10 text-center text-white sm:px-10"> <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#F2C45F]">
AGN 2027 · Payment centre </span>

        {status === 'VERIFYING' && (
          <div className="mx-auto mt-7 flex h-20 w-20 items-center justify-center rounded-full border border-[#E9B949]/30 bg-[#E9B949]/10">
            <LoaderCircle
              size={42}
              className="animate-spin text-[#F2C45F]"
            />
          </div>
        )}

        {status === 'SUCCESSFUL' && (
          <div className="mx-auto mt-7 flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10">
            <CheckCircle2 size={45} className="text-emerald-400" />
          </div>
        )}

        {status === 'FAILED' && (
          <div className="mx-auto mt-7 flex h-20 w-20 items-center justify-center rounded-full border border-red-400/30 bg-red-400/10">
            <XCircle size={45} className="text-red-400" />
          </div>
        )}

        {status === 'PENDING' && (
          <div className="mx-auto mt-7 flex h-20 w-20 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/10">
            <Clock3 size={42} className="text-amber-300" />
          </div>
        )}

        <h1 className="mt-6 text-2xl font-bold sm:text-3xl">
          {status === 'VERIFYING' && 'Verifying your payment'}
          {status === 'SUCCESSFUL' && 'Payment confirmed'}
          {status === 'FAILED' && 'Payment not confirmed'}
          {status === 'PENDING' && 'Payment awaiting confirmation'}
        </h1>

        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-300">
          {status === 'VERIFYING' &&
            'Please wait while we securely verify your transaction.'}

          {status === 'SUCCESSFUL' &&
            'Thank you for supporting AGN 2027. Your payment has been verified by our payment service.'}

          {status === 'FAILED' &&
            'We could not confirm this transaction as a successful payment.'}

          {status === 'PENDING' &&
            'Your transaction has not yet been confirmed. Please check again shortly.'}
        </p>
      </div>

      <div className="p-7 sm:p-9">
        {reference && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Transaction reference
            </p>

            <p className="mt-2 break-all font-mono text-sm font-bold text-[#101B35]">
              {reference}
            </p>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800"
          >
            {error}
          </div>
        )}

        {status === 'VERIFYING' && (
          <p className="mt-6 text-center text-xs leading-5 text-slate-400">
            Do not close this page while verification is in progress.
          </p>
        )}

        {status === 'SUCCESSFUL' && (
          <div className="mt-6 flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
            <ShieldCheck size={20} className="mt-0.5 shrink-0" />

            <p>
              Your payment has been confirmed by the AGN payment
              verification service.
            </p>
          </div>
        )}

        {status === 'FAILED' && (
          <button
            type="button"
            onClick={() => void verify()}
            className="mt-6 flex min-h-12 w-full items-center justify-center rounded-xl bg-[#101B35] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1C2D50]"
          >
            Check payment again
          </button>
        )}

        {status === 'PENDING' && (
          <button
            type="button"
            onClick={() => void verify()}
            className="mt-6 flex min-h-12 w-full items-center justify-center rounded-xl bg-[#101B35] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1C2D50]"
          >
            Retry verification
          </button>
        )}

        <Link
          to="/"
          className="mt-5 flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#101B35]"
        >
          <ArrowLeft size={16} />
          Return to AGN website
        </Link>
      </div>

      <div className="h-1.5 bg-gradient-to-r from-[#B68A2D] via-[#F2C45F] to-[#B68A2D]" />
    </section>
  </main>
</PublicLayout>


);
}
