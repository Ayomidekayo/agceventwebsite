import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

import { Link, useSearchParams } from 'react-router-dom';

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Copy,
  CreditCard,
  Landmark,
  LoaderCircle,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

import PublicLayout from '../../layouts/PublicLayout';

import { getApiError } from '../../lib/api';

import {
  initializePayment,
  getBankDetails,
  submitBankTransfer,
} from '../../lib/payment';

import type { BankDetails } from '../../lib/payment';

type PaymentMethod = 'PAYSTACK' | 'BANK_TRANSFER';

const amountPattern = /^\d{1,12}(\.\d{1,2})?$/;

const formatAmount = (value: string) => {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return '₦0.00';
  }

  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(amount);
};

const today = new Date().toISOString().split('T')[0];

export default function SponsorshipPaymentPage() {
  const [searchParams] = useSearchParams();

  const enquiryId = searchParams.get('enquiryId') ?? '';
  const commitmentId = searchParams.get('commitmentId') ?? '';

  const validTarget = Boolean(enquiryId || commitmentId);

  const [method, setMethod] = useState<PaymentMethod>('PAYSTACK');

  const [form, setForm] = useState({
    amount: '',
    payerName: '',
    payerEmail: '',
    payerPhone: '',
    transferSenderName: '',
    transferReference: '',
    transferDate: today,
  });

  const [bankDetails, setBankDetails] =
    useState<BankDetails | null>(null);

  const [loadingBank, setLoadingBank] = useState(false);
  const [busy, setBusy] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [submittedReference, setSubmittedReference] = useState('');

  useEffect(() => {
    if (method !== 'BANK_TRANSFER' || bankDetails) return;

    let active = true;

    const loadBankDetails = async () => {
      setLoadingBank(true);
      setError('');

      try {
        const result = await getBankDetails();

        if (active) {
          setBankDetails(result);
        }
      } catch (requestError) {
        if (active) {
          setError(
            getApiError(
              requestError,
              'Unable to load bank account details.',
            ),
          );
        }
      } finally {
        if (active) {
          setLoadingBank(false);
        }
      }
    };

    void loadBankDetails();

    return () => {
      active = false;
    };
  }, [method, bankDetails]);

  const update = (
    key: keyof typeof form,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const validateForm = () => {
    if (!validTarget) {
      return 'A valid sponsorship enquiry or commitment is required.';
    }

    if (!amountPattern.test(form.amount) || Number(form.amount) <= 0) {
      return 'Enter a valid contribution amount.';
    }

    if (!form.payerName.trim() || !form.payerEmail.trim()) {
      return 'Please provide your full name and email address.';
    }

    if (
      method === 'BANK_TRANSFER' &&
      (
        !form.transferSenderName.trim() ||
        !form.transferReference.trim() ||
        !form.transferDate
      )
    ) {
      return 'Complete all bank transfer details before submitting.';
    }

    return '';
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (busy) return;

    setError('');
    setSuccess('');

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setBusy(true);

    try {
      if (method === 'PAYSTACK') {
        const result = await initializePayment({
          purpose: commitmentId
            ? 'SPONSORSHIP_COMMITMENT'
            : 'DIRECT_SPONSORSHIP',

          enquiryId: enquiryId || undefined,
          commitmentId: commitmentId || undefined,

          amount: form.amount,
          payerName: form.payerName.trim(),
          payerEmail: form.payerEmail.trim(),
          payerPhone: form.payerPhone.trim() || undefined,
        });

        if (
          !result.authorizationUrl ||
          !result.authorizationUrl.startsWith('https://')
        ) {
          throw new Error(
            'The payment gateway did not return a valid checkout link.',
          );
        }

        window.location.assign(result.authorizationUrl);
        return;
      }

      const result = await submitBankTransfer({
        enquiryId,
        commitmentId: commitmentId || undefined,
        amount: form.amount,
        payerName: form.payerName.trim(),
        payerEmail: form.payerEmail.trim(),
        payerPhone: form.payerPhone.trim() || undefined,
        transferSenderName: form.transferSenderName.trim(),
        transferReference: form.transferReference.trim(),
        transferDate: form.transferDate,
      });

      setSubmittedReference(result.reference);

      setSuccess(
        'Your bank transfer details have been submitted successfully. Your payment is awaiting administrator verification.',
      );

    } catch (requestError) {
      setError(
        getApiError(
          requestError,
          'We could not process your payment request. Please try again.',
        ),
      );
    } finally {
      setBusy(false);
    }
  };

  const copyAccountNumber = async () => {
    if (!bankDetails?.accountNumber) return;

    try {
      await navigator.clipboard.writeText(
        bankDetails.accountNumber,
      );

      setSuccess('Account number copied.');
    } catch {
      setError('Unable to copy the account number.');
    }
  };

  if (success && submittedReference) {
    return (
      <PublicLayout>
        <main className="flex min-h-[75vh] items-center justify-center bg-[#FAF7EF] px-5 py-16">
          <section className="w-full max-w-xl rounded-3xl border border-[#E8E1D5] bg-white p-7 text-center shadow-xl sm:p-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={42} />
            </div>

            <p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-[#FF4B1F]">
              AGN 2027 · Bank transfer
            </p>

            <h1 className="mt-3 text-3xl font-bold text-[#171717]">
              Transfer submitted
            </h1>

            <p className="mt-4 text-sm leading-7 text-[#77736C]">
              Your transfer details have been received. Your
              contribution will only be recorded as received after
              verification by the AGN finance team.
            </p>

            <div className="mt-7 rounded-2xl bg-[#FAF7EF] p-5 text-left">
              <p className="text-xs font-semibold uppercase text-[#999287]">
                Payment reference
              </p>

              <p className="mt-2 break-all font-mono font-bold text-[#171717]">
                {submittedReference}
              </p>

              <p className="mt-4 text-xs text-amber-700">
                Status: Awaiting verification
              </p>
            </div>

            <Link
              to="/"
              className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-[#171717] px-7 text-sm font-bold text-white"
            >
              Return to AGN website
            </Link>
          </section>
        </main>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <main className="min-h-screen bg-[#FAF7EF]">
        <section className="border-b border-[#E8E1D5] bg-[#171717] px-5 py-14 text-white sm:py-20">
          <div className="mx-auto max-w-6xl">
            <Link
              to="/sponsorship"
              className="mb-10 inline-flex items-center gap-2 text-sm text-[#D6D0C6] hover:text-[#FFB52E]"
            >
              <ArrowLeft size={16} />
              Back to sponsorship
            </Link>

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FFB52E]">
              AGN 2027 · Secure payments
            </p>

            <h1 className="mt-5 text-4xl font-bold sm:text-6xl">
              Your support.
              <br />
              <span className="text-[#FF4B1F]">
                Their breakthrough.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-[#C8C2B8] sm:text-base">
              Complete your sponsorship contribution and help
              create opportunities and meaningful connections
              for the next generation.
            </p>
          </div>
        </section>

        <section className="px-5 py-12 sm:py-16">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_350px]">
            <div className="rounded-3xl border border-[#E8E1D5] bg-white p-6 shadow-sm sm:p-10">
              <div className="mb-8">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FF4B1F]">
                  Payment information
                </p>

                <h2 className="mt-3 text-2xl font-bold text-[#171717]">
                  Complete your contribution
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#77736C]">
                  Enter your details and select your preferred
                  payment method.
                </p>
              </div>

              {!validTarget && (
                <div className="mb-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <AlertCircle size={20} className="shrink-0" />

                  <p>
                    A valid sponsorship enquiry or commitment
                    reference is required before payment.
                  </p>
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Full name
                  </label>

                  <input
                    required
                    value={form.payerName}
                    onChange={(e) =>
                      update('payerName', e.target.value)
                    }
                    autoComplete="name"
                    className="min-h-13 w-full rounded-xl border border-[#E8E1D5] bg-[#FFFDF9] px-4 text-sm outline-none focus:border-[#FF4B1F]"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Email address
                  </label>

                  <input
                    required
                    type="email"
                    value={form.payerEmail}
                    onChange={(e) =>
                      update('payerEmail', e.target.value)
                    }
                    autoComplete="email"
                    className="min-h-13 w-full rounded-xl border border-[#E8E1D5] bg-[#FFFDF9] px-4 text-sm outline-none focus:border-[#FF4B1F]"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Phone number (optional)
                  </label>

                  <input
                    type="tel"
                    value={form.payerPhone}
                    onChange={(e) =>
                      update('payerPhone', e.target.value)
                    }
                    className="min-h-13 w-full rounded-xl border border-[#E8E1D5] bg-[#FFFDF9] px-4 text-sm outline-none focus:border-[#FF4B1F]"
                    placeholder="+234..."
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Contribution amount (NGN)
                  </label>

                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) =>
                      update('amount', e.target.value)
                    }
                    className="min-h-14 w-full rounded-xl border border-[#E8E1D5] bg-[#FFFDF9] px-4 text-lg font-bold outline-none focus:border-[#FF4B1F]"
                    placeholder="0.00"
                  />

                  <p className="mt-2 text-xs text-[#999287]">
                    {formatAmount(form.amount)}
                  </p>
                </div>

                <div>
                  <p className="mb-3 text-sm font-semibold">
                    Choose payment method
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMethod('PAYSTACK');
                        setError('');
                      }}
                      className={`rounded-2xl border p-4 text-left transition ${
                        method === 'PAYSTACK'
                          ? 'border-[#FF4B1F] bg-[#FFF5F1] ring-2 ring-[#FF4B1F]/10'
                          : 'border-[#E8E1D5] hover:border-[#FFB52E]'
                      }`}
                    >
                      <CreditCard
                        className="text-[#FF4B1F]"
                        size={23}
                      />

                      <p className="mt-3 text-sm font-bold">
                        Pay online
                      </p>

                      <p className="mt-1 text-xs text-[#77736C]">
                        Secure Paystack checkout
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMethod('BANK_TRANSFER');
                        setError('');
                      }}
                      className={`rounded-2xl border p-4 text-left transition ${
                        method === 'BANK_TRANSFER'
                          ? 'border-[#FF4B1F] bg-[#FFF5F1] ring-2 ring-[#FF4B1F]/10'
                          : 'border-[#E8E1D5] hover:border-[#FFB52E]'
                      }`}
                    >
                      <Landmark
                        className="text-[#FF4B1F]"
                        size={23}
                      />

                      <p className="mt-3 text-sm font-bold">
                        Bank transfer
                      </p>

                      <p className="mt-1 text-xs text-[#77736C]">
                        Transfer and submit details
                      </p>
                    </button>
                  </div>
                </div>

                {method === 'BANK_TRANSFER' && (
                  <div className="space-y-5 rounded-2xl border border-[#E8E1D5] bg-[#FFFDF9] p-5">
                    <h3 className="font-bold text-[#171717]">
                      Bank account details
                    </h3>

                    {loadingBank && (
                      <div className="flex items-center gap-2 text-sm text-[#77736C]">
                        <LoaderCircle
                          size={17}
                          className="animate-spin"
                        />
                        Loading account details...
                      </div>
                    )}

                    {bankDetails && (
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-[#999287]">
                            Bank
                          </p>

                          <p className="font-semibold">
                            {bankDetails.bankName}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-[#999287]">
                            Account name
                          </p>

                          <p className="font-semibold">
                            {bankDetails.accountName}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-[#999287]">
                            Account number
                          </p>

                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xl font-bold tracking-wider">
                              {bankDetails.accountNumber}
                            </p>

                            <button
                              type="button"
                              onClick={() => void copyAccountNumber()}
                              className="rounded-lg border border-[#E8E1D5] p-2"
                              aria-label="Copy account number"
                            >
                              <Copy size={17} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="border-t border-[#E8E1D5] pt-5">
                      <h3 className="font-bold">
                        Transfer information
                      </h3>

                      <div className="mt-4 space-y-4">
                        <input
                          required
                          value={form.transferSenderName}
                          onChange={(e) =>
                            update(
                              'transferSenderName',
                              e.target.value,
                            )
                          }
                          placeholder="Name on transfer"
                          className="min-h-12 w-full rounded-xl border border-[#E8E1D5] px-4 text-sm outline-none focus:border-[#FF4B1F]"
                        />

                        <input
                          required
                          value={form.transferReference}
                          onChange={(e) =>
                            update(
                              'transferReference',
                              e.target.value,
                            )
                          }
                          placeholder="Bank transaction reference"
                          className="min-h-12 w-full rounded-xl border border-[#E8E1D5] px-4 text-sm outline-none focus:border-[#FF4B1F]"
                        />

                        <div>
                          <label className="mb-2 block text-sm font-medium">
                            Transfer date
                          </label>

                          <input
                            required
                            type="date"
                            max={today}
                            value={form.transferDate}
                            onChange={(e) =>
                              update(
                                'transferDate',
                                e.target.value,
                              )
                            }
                            className="min-h-12 w-full rounded-xl border border-[#E8E1D5] px-4 text-sm outline-none focus:border-[#FF4B1F]"
                          />
                        </div>
                      </div>
                    </div>

                    <p className="text-xs leading-6 text-[#77736C]">
                      Your submission will remain pending until
                      an AGN administrator verifies the transfer.
                    </p>
                  </div>
                )}

                <div className="rounded-2xl border border-[#FFB52E]/50 bg-[#FFFAEB] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-[#77736C]">
                      Amount to pay
                    </span>

                    <span className="text-xl font-bold text-[#171717]">
                      {formatAmount(form.amount)}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!validTarget || busy || (method === 'BANK_TRANSFER' && (!bankDetails || loadingBank))}
                  className="flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#FF4B1F] px-5 py-4 text-sm font-bold text-white transition hover:bg-[#E83F16] disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {busy ? (
                    <>
                      <LoaderCircle
                        size={19}
                        className="animate-spin"
                      />
                      Processing...
                    </>
                  ) : (
                    <>
                      {method === 'PAYSTACK'
                        ? 'Continue to secure payment'
                        : 'Submit bank transfer details'}

                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                {method === 'PAYSTACK' && (
                  <p className="text-center text-xs text-[#999287]">
                    You will be redirected to Paystack's secure
                    checkout.
                  </p>
                )}
              </form>
            </div>

            <aside className="space-y-5">
              <div className="rounded-3xl bg-[#171717] p-7 text-white">
                <ShieldCheck
                  size={28}
                  className="text-[#FFB52E]"
                />

                <h3 className="mt-5 text-lg font-bold">
                  Secure payment processing
                </h3>

                <p className="mt-3 text-sm leading-7 text-[#C8C2B8]">
                  Online payments are processed through Paystack.
                  Bank transfers are manually verified by the AGN
                  finance team.
                </p>
              </div>

              <div className="rounded-3xl border border-[#E8E1D5] bg-white p-7">
                <CheckCircle2
                  size={26}
                  className="text-[#FF4B1F]"
                />

                <h3 className="mt-4 font-bold">
                  Your contribution matters
                </h3>

                <p className="mt-3 text-sm leading-7 text-[#77736C]">
                  Every contribution supports AGN's mission to
                  empower young people through purposeful
                  connections and development opportunities.
                </p>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}