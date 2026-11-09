import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
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

type PaymentState = 'VERIFYING' | 'SUCCESSFUL' | 'FAILED' | 'PENDING';

const stateContent = {
  VERIFYING: {
    title: 'Verifying your payment',
    description:
      'Please wait while we securely verify your transaction.',
  },
  SUCCESSFUL: {
    title: 'Payment confirmed',
    description:
      'Thank you for supporting AGN 2027. Your payment has been verified by our payment service.',
  },
  FAILED: {
    title: 'Payment not confirmed',
    description:
      'We could not confirm this transaction as a successful payment.',
  },
  PENDING: {
    title: 'Payment awaiting confirmation',
    description:
      'Your transaction has not yet been confirmed. Please check again shortly.',
  },
} satisfies Record<PaymentState, { title: string; description: string }>;

const statusIcon = {
  VERIFYING: LoaderCircle,
  SUCCESSFUL: CheckCircle2,
  FAILED: XCircle,
  PENDING: Clock3,
} satisfies Record<PaymentState, typeof LoaderCircle>;

export default function PaymentCallbackPage() {
  const [searchParams] = useSearchParams();
  const shouldReduceMotion = useReducedMotion();

  const reference =
    searchParams.get('reference') ??
    searchParams.get('trxref') ??
    '';

  const [status, setStatus] = useState<PaymentState>('VERIFYING');
  const [error, setError] = useState('');

  // Prevent duplicate automatic verification and overlapping manual retries.
  const automaticVerificationStarted = useRef(false);
  const requestInFlight = useRef(false);

  const verify = useCallback(async () => {
    if (requestInFlight.current) return;

    if (!reference) {
      setStatus('FAILED');
      setError('The payment reference is missing.');
      return;
    }

    requestInFlight.current = true;
    setStatus('VERIFYING');
    setError('');

    try {
      const result = await verifyPayment(reference);
      const normalizedStatus = String(result?.status ?? '').toLowerCase();

      if (result?.success && normalizedStatus === 'successful') {
        setStatus('SUCCESSFUL');
        return;
      }

      if (
        ['pending', 'processing', 'abandoned'].includes(normalizedStatus)
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
    } finally {
      requestInFlight.current = false;
    }
  }, [reference]);

  useEffect(() => {
    if (automaticVerificationStarted.current) return;

    automaticVerificationStarted.current = true;
    void verify();
  }, [verify]);

  const StatusIcon = statusIcon[status];
  const canRetry = status === 'FAILED' || status === 'PENDING';

  const transition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.48, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <PublicLayout>
      <main className="agn-payment-page relative flex min-h-[75vh] items-center justify-center overflow-hidden bg-[#F7F8FA] px-4 py-12 sm:px-6 sm:py-16">
        {/* Quiet ambient detail: decorative only, never blocks interaction. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-28 top-16 h-64 w-64 rounded-full bg-[#E9B949]/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-[#101B35]/[0.06] blur-3xl"
        />

        <motion.section
          initial={shouldReduceMotion ? false : { opacity: 0, y: 28, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={transition}
          className="relative w-full max-w-xl overflow-hidden rounded-[1.75rem] border border-slate-200/90 bg-white shadow-[0_24px_80px_-32px_rgba(16,27,53,0.28)]"
        >
          <div className="relative overflow-hidden bg-[#101B35] px-6 py-9 text-center text-white sm:px-10 sm:py-11">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full border border-white/[0.07]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-36 -left-16 h-64 w-64 rounded-full border border-[#E9B949]/15"
            />

            <motion.span
              initial={shouldReduceMotion ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...transition, delay: shouldReduceMotion ? 0 : 0.08 }}
              className="relative text-[10px] font-bold uppercase tracking-[0.24em] text-[#F2C45F] sm:text-xs"
            >
              AGN 2027 · Payment centre
            </motion.span>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={status}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 14, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8, scale: 0.96 }}
                transition={transition}
                className="relative"
              >
                <div
                  className={[
                    'mx-auto mt-7 flex h-20 w-20 items-center justify-center rounded-full border sm:h-[5.5rem] sm:w-[5.5rem]',
                    status === 'SUCCESSFUL'
                      ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-400'
                      : status === 'FAILED'
                        ? 'border-red-400/30 bg-red-400/10 text-red-400'
                        : status === 'PENDING'
                          ? 'border-amber-400/30 bg-amber-400/10 text-amber-300'
                          : 'border-[#E9B949]/30 bg-[#E9B949]/10 text-[#F2C45F]',
                  ].join(' ')}
                >
                  <StatusIcon
                    size={status === 'VERIFYING' ? 40 : 44}
                    strokeWidth={1.7}
                    className={status === 'VERIFYING' ? 'animate-spin' : ''}
                    aria-hidden="true"
                  />
                </div>

                <h1 className="mt-6 text-2xl font-bold tracking-tight sm:text-[2rem]">
                  {stateContent[status].title}
                </h1>

                <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-300 sm:text-[15px]">
                  {stateContent[status].description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="p-6 sm:p-9">
            {reference && (
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...transition, delay: shouldReduceMotion ? 0 : 0.12 }}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Transaction reference
                </p>
                <p className="mt-2 break-all font-mono text-sm font-semibold leading-6 text-[#101B35]">
                  {reference}
                </p>
              </motion.div>
            )}

            <AnimatePresence initial={false}>
              {error && (
                <motion.div
                  key="verification-error"
                  role="alert"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6 }}
                  transition={transition}
                  className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait" initial={false}>
              {status === 'VERIFYING' && (
                <motion.p
                  key="verifying-note"
                  initial={shouldReduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-6 text-center text-xs leading-5 text-slate-400"
                >
                  Do not close this page while verification is in progress.
                </motion.p>
              )}

              {status === 'SUCCESSFUL' && (
                <motion.div
                  key="success-note"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={transition}
                  className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800"
                >
                  <ShieldCheck size={20} className="mt-0.5 shrink-0" />
                  <p>
                    Your payment has been confirmed by the AGN payment
                    verification service.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {canRetry && (
              <motion.button
                type="button"
                onClick={() => void verify()}
                whileHover={shouldReduceMotion ? undefined : { y: -2 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
                transition={{ duration: 0.2 }}
                className="mt-6 flex min-h-12 w-full items-center justify-center rounded-xl bg-[#101B35] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#101B35]/10 transition-colors hover:bg-[#1C2D50] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E9B949]/35"
              >
                {status === 'PENDING' ? 'Retry verification' : 'Check payment again'}
              </motion.button>
            )}

            <Link
              to="/"
              className="mt-5 flex min-h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-slate-500 transition-colors hover:text-[#101B35] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E9B949]/30"
            >
              <ArrowLeft size={16} />
              Return to AGN website
            </Link>
          </div>

          <div className="h-1.5 bg-gradient-to-r from-[#B68A2D] via-[#F2C45F] to-[#B68A2D]" />
        </motion.section>
      </main>
    </PublicLayout>
  );
}
