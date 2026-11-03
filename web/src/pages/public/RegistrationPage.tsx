
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';

import {
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Copy,
  Mail,
  MoveRight,
  ShieldCheck,
  X,
} from 'lucide-react';

import { api, getApiError } from '../../lib/api';
import { sendEmailNotification } from '../../lib/web3forms';

import PublicLayout from '../../layouts/PublicLayout';
import PageIntro from '../../components/forms/PageIntro';
import FormField from '../../components/forms/FormField';
import Consent from '../../components/forms/Consent';
import NoticeBox, { type Notice } from '../../components/NoticeBox';

import { EVENT_DATE } from '../../config/event';

// =====================================================
// TYPES
// =====================================================

interface RegistrationForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  affiliation: string;
  occupation: string;
  interest: string;
  source: string;
}

interface RegistrationSuccess {
  reference: string;
  name: string;
  email: string;
}

// =====================================================
// CONSTANTS
// =====================================================

const INITIAL_FORM: RegistrationForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  affiliation: '',
  occupation: '',
  interest: '',
  source: '',
};

// =====================================================
// EMAIL NOTIFICATION
// =====================================================

async function sendAdminNotification(
  form: RegistrationForm,
  reference: string,
): Promise<void> {
  await sendEmailNotification({
    subject: 'New AGN 2027 Participant Registration',

    name: `${form.firstName} ${form.lastName}`,

    email: form.email,

    phone: form.phone,

    reference,

    message: `
NEW AGN 2027 PARTICIPANT REGISTRATION

PARTICIPANT DETAILS
--------------------------------

Name: ${form.firstName} ${form.lastName}
Email: ${form.email}
Phone: ${form.phone}

AFFILIATION
--------------------------------

Organisation: ${form.affiliation || 'Not provided'}
Occupation: ${form.occupation || 'Not provided'}

INTERESTS
--------------------------------

Interest: ${form.interest || 'Not provided'}
Source: ${form.source || 'Not provided'}

REGISTRATION DETAILS
--------------------------------

Reference: ${reference}
Event: AGN 2027
Theme: From Block to Breakthrough
Date: ${EVENT_DATE}

Activation Global Network
    `.trim(),
  });
}

// =====================================================
// COMPONENT
// =====================================================

export default function RegistrationPage() {
  const [form, setForm] =
    useState<RegistrationForm>(INITIAL_FORM);

  const [consent, setConsent] = useState(false);

  const [busy, setBusy] = useState(false);

  const [notice, setNotice] = useState<Notice | null>(null);

  const [registration, setRegistration] =
    useState<RegistrationSuccess | null>(null);

  const [copied, setCopied] = useState(false);

  // =====================================================
  // FORM UPDATE
  // =====================================================

  const update = (
    key: keyof RegistrationForm,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  // =====================================================
  // COPY REGISTRATION REFERENCE
  // =====================================================

  const copyReference = async () => {
    if (!registration?.reference) return;

    try {
      await navigator.clipboard.writeText(
        registration.reference,
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2200);
    } catch {
      setNotice({
        kind: 'error',
        text: 'Unable to copy your reference. Please copy it manually.',
      });
    }
  };

  // =====================================================
  // CLOSE SUCCESS MODAL
  // =====================================================

  const closeSuccessModal = () => {
    setRegistration(null);
    setCopied(false);
  };

  // =====================================================
  // SUBMIT REGISTRATION
  // =====================================================

  const submit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (busy) return;

    if (!consent) {
      setNotice({
        kind: 'error',
        text: 'Please accept the privacy notice before submitting your registration.',
      });

      return;
    }

    setBusy(true);
    setNotice(null);

    try {
      // 1. Save registration through our NestJS backend.

      const response = await api.post('/registrations', {
        ...form,
        consentToPrivacy: consent,
      });

      const savedRegistration =
        response.data?.registration ?? response.data;

      const reference = savedRegistration?.reference;

      if (!reference) {
        throw new Error(
          'We could not retrieve your registration reference. Please contact the AGN team before submitting again.',
        );
      }

      // 2. Store successful registration details.

      const successfulRegistration: RegistrationSuccess = {
        reference,
        name: `${form.firstName} ${form.lastName}`,
        email: form.email,
      };

      // 3. Open the success modal immediately.
      // Email delivery must not delay or invalidate registration.

      setRegistration(successfulRegistration);

      // 4. Send administrator notification separately.
      // A notification failure must never undo registration.

      void sendAdminNotification(form, reference).catch(
        (emailError) => {
          console.error(
            'AGN administrator notification failed:',
            emailError,
          );
        },
      );

      // 5. Clear the form after successful registration.

      setForm(INITIAL_FORM);
      setConsent(false);

    } catch (error) {
      setNotice({
        kind: 'error',
        text: getApiError(
          error,
          'We could not submit your registration. Please review your details and try again.',
        ),
      });
    } finally {
      setBusy(false);
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <PublicLayout>
      <main className="form-page">
        <div className="container form-page-grid">

          {/* =============================================
              LEFT INFORMATION PANEL
          ============================================== */}

          <aside className="form-aside form-aside-orange">
            <span className="aside-kicker">
              AGN 2027 / PARTICIPANT
            </span>

            <div className="aside-shape">
              <span>01</span>
              <span>AGN</span>
              <span>2027</span>
            </div>

            <div className="aside-bottom">
              <span>FROM BLOCK TO BREAKTHROUGH</span>

              <p>
                Your next step can begin with one decision.
              </p>

              <div className="aside-meta">
                <CalendarDays size={15} />
                {EVENT_DATE}
              </div>
            </div>
          </aside>

          {/* =============================================
              REGISTRATION FORM
          ============================================== */}

          <section className="form-main">
            <PageIntro
              eyebrow="YOUR PLACE IN THE ROOM"
              title={
                <>
                  Take your seat.
                  <br />
                  <span>Start here.</span>
                </>
              }
              subtitle="Tell us a little about yourself to register your interest in the AGN 2027 Lagos Activation Global Conference."
            />

            <NoticeBox notice={notice} />

            <form
              onSubmit={submit}
              className="application-form"
            >

              {/* PERSONAL INFORMATION */}

              <div className="form-section-label">
                <span>01</span>

                <div>
                  <strong>About you</strong>
                  <small>
                    How should we reach you?
                  </small>
                </div>
              </div>

              <div className="form-fields two-col">

                <FormField
                  label="First name"
                  name="firstName"
                  value={form.firstName}
                  onChange={(value) =>
                    update('firstName', value)
                  }
                  required
                  placeholder="Your first name"
                />

                <FormField
                  label="Last name"
                  name="lastName"
                  value={form.lastName}
                  onChange={(value) =>
                    update('lastName', value)
                  }
                  required
                  placeholder="Your last name"
                />

                <FormField
                  label="Email address"
                  name="email"
                  value={form.email}
                  onChange={(value) =>
                    update('email', value)
                  }
                  required
                  type="email"
                  placeholder="you@example.com"
                />

                <FormField
                  label="Phone number"
                  name="phone"
                  value={form.phone}
                  onChange={(value) =>
                    update('phone', value)
                  }
                  required
                  type="tel"
                  placeholder="e.g. 080..."
                />

                <FormField
                  label="School, organisation or business"
                  name="affiliation"
                  value={form.affiliation}
                  onChange={(value) =>
                    update('affiliation', value)
                  }
                  placeholder="Where you study or work"
                />

                <FormField
                  label="What best describes you?"
                  name="occupation"
                  value={form.occupation}
                  onChange={(value) =>
                    update('occupation', value)
                  }
                  options={[
                    'Student',
                    'Young professional',
                    'Entrepreneur / business owner',
                    'Founder',
                    'Job seeker',
                    'Community leader',
                    'Other',
                  ]}
                />

              </div>

              {/* INTERESTS */}

              <div className="form-section-label form-section-spaced">
                <span>02</span>

                <div>
                  <strong>Your interests</strong>

                  <small>
                    Help us understand what brings you here.
                  </small>
                </div>
              </div>

              <div className="form-fields two-col">

                <FormField
                  label="What are you most interested in?"
                  name="interest"
                  value={form.interest}
                  onChange={(value) =>
                    update('interest', value)
                  }
                  options={[
                    'Personal growth and mindset',
                    'Leadership',
                    'Business and entrepreneurship',
                    'Networking and collaboration',
                    'Career development',
                    'All of the above',
                  ]}
                  full
                />

                <FormField
                  label="How did you hear about AGN?"
                  name="source"
                  value={form.source}
                  onChange={(value) =>
                    update('source', value)
                  }
                  options={[
                    'WhatsApp',
                    'Instagram / social media',
                    'Friend or colleague',
                    'School or organisation',
                    'Email',
                    'Other',
                  ]}
                  full
                />

              </div>

              {/* PRIVACY CONSENT */}

              <Consent
                checked={consent}
                setChecked={setConsent}
                text={
                  <>
                    I have read the{' '}
                    <Link
                      className="inline-policy-link"
                      to="/privacy"
                    >
                      privacy notice
                    </Link>{' '}
                    and agree that AGN may use these details
                    to process my event registration.
                  </>
                }
              />

              {/* SUBMIT BUTTON */}

              <button
                disabled={busy}
                className="button button-dark button-submit disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
              >
                {busy
                  ? 'Submitting registration…'
                  : 'Submit registration'}

                {busy ? (
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                    aria-hidden="true"
                  />
                ) : (
                  <ArrowUpRight size={18} />
                )}
              </button>

              <p className="form-smallprint">
                Your information will be handled in accordance
                with the AGN privacy notice. Please keep your
                registration reference after submission.
              </p>

            </form>
          </section>
        </div>
      </main>

      {/* =================================================
          PROFESSIONAL REGISTRATION SUCCESS MODAL
      ================================================== */}

      {registration && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/55 px-3 py-5 backdrop-blur-sm sm:px-6 sm:py-8"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeSuccessModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="registration-success-title"
            className="relative my-auto w-full max-w-[510px] overflow-hidden rounded-2xl border border-black/5 bg-white shadow-2xl sm:rounded-3xl"
          >

            {/* BRAND ACCENT */}

            <div className="h-1 w-full bg-[#D9A441]" />

            {/* CLOSE BUTTON */}

            <button
              type="button"
              onClick={closeSuccessModal}
              aria-label="Close confirmation"
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-900 sm:right-5 sm:top-5"
            >
              <X size={18} />
            </button>

            <div className="px-5 pb-7 pt-9 sm:px-9 sm:pb-9 sm:pt-11">

              {/* SUCCESS ICON */}

              <div className="flex justify-center">
                <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#D9A441]/10 ring-8 ring-[#D9A441]/5 sm:h-20 sm:w-20">
                  <CheckCircle2
                    size={42}
                    strokeWidth={1.6}
                    className="text-[#B8862B]"
                  />
                </div>
              </div>

              {/* SUCCESS HEADING */}

              <div className="mt-6 text-center">
                <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-green-700">
                  <Check size={13} />
                  Registration confirmed
                </span>

                <h2
                  id="registration-success-title"
                  className="mt-5 text-[27px] font-bold leading-tight tracking-tight text-[#172033] sm:text-4xl"
                >
                  You're on the list!
                </h2>

                <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-gray-500">
                  Hello {registration.name}, your registration
                  for AGN 2027 has been successfully received.
                  We're delighted to have you join us.
                </p>
              </div>

              {/* REFERENCE */}

              <div className="mt-7 rounded-2xl border border-[#D9A441]/40 bg-[#D9A441]/5 px-4 py-5 text-center sm:px-5">

                <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-gray-500">
                  Your registration reference
                </p>

                <div className="mt-3 flex min-w-0 items-center justify-center gap-2">

                  <span className="break-all text-base font-bold tracking-wide text-[#172033] sm:text-xl">
                    {registration.reference}
                  </span>

                  <button
                    type="button"
                    onClick={copyReference}
                    aria-label="Copy registration reference"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:border-[#D9A441] hover:text-[#172033]"
                  >
                    {copied ? (
                      <CheckCircle2
                        size={17}
                        className="text-green-600"
                      />
                    ) : (
                      <Copy size={17} />
                    )}
                  </button>

                </div>

                <p className="mt-3 text-xs text-gray-500">
                  {copied
                    ? 'Reference copied successfully.'
                    : 'Save this reference for future correspondence.'}
                </p>

              </div>

              {/* EVENT DETAILS */}

              <div className="mt-5 space-y-4 rounded-2xl bg-gray-50 p-4 sm:p-5">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#B8862B] shadow-sm">
                    <CalendarDays size={19} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      AGN 2027
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {EVENT_DATE}
                    </p>
                  </div>

                </div>

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#B8862B] shadow-sm">
                    <Mail size={19} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      Registered email
                    </p>

                    <p className="mt-1 break-all text-xs text-gray-500">
                      {registration.email}
                    </p>
                  </div>

                </div>

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#B8862B] shadow-sm">
                    <ShieldCheck size={19} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Registration status
                    </p>

                    <p className="mt-1 text-xs font-medium text-green-700">
                      Successfully received
                    </p>
                  </div>

                </div>

              </div>

              {/* NEXT STEPS */}

              <div className="mt-6">

                <h3 className="text-sm font-bold text-[#172033]">
                  What happens next?
                </h3>

                <div className="mt-4 space-y-3">

                  {[
                    'Keep your registration reference safe.',
                    'Watch your inbox for important conference updates.',
                    'Stay connected with Activation Global Network for announcements.',
                  ].map((item, index) => (
                    <div
                      key={item}
                      className="flex items-start gap-3"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D9A441]/15 text-[11px] font-bold text-[#172033]">
                        {index + 1}
                      </span>

                      <p className="text-xs leading-6 text-gray-600 sm:text-sm">
                        {item}
                      </p>
                    </div>
                  ))}

                </div>
              </div>

              {/* CONFIRMATION MESSAGE */}

              <div className="mt-6 rounded-xl border border-green-100 bg-green-50 px-4 py-3.5">
                <p className="text-xs leading-6 text-green-800">
                  Your registration has been recorded successfully.
                  Thank you for taking this step towards your next
                  breakthrough.
                </p>
              </div>

              {/* ACTION */}

              <Link
                to="/"
                onClick={() => setRegistration(null)}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#172033] px-5 py-4 text-sm font-semibold text-white transition duration-200 hover:bg-[#263754] focus:outline-none focus:ring-4 focus:ring-[#172033]/15"
              >
                Explore AGN
                <MoveRight size={17} />
              </Link>

              {/* FOOTER */}

              <div className="mt-6 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Activation Global Network
                </p>

                <p className="mt-1 text-[9px] font-medium tracking-[0.17em] text-[#B8862B]">
                  FROM BLOCK TO BREAKTHROUGH
                </p>
              </div>

            </div>
          </div>
        </div>
      )}

    </PublicLayout>
  );
}

