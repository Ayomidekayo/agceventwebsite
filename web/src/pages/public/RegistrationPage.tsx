import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { api, getApiError } from '../../lib/api';
import PublicLayout from '../../layouts/PublicLayout';
import PageIntro from '../../components/forms/PageIntro';
import FormField from '../../components/forms/FormField';
import Consent from '../../components/forms/Consent';
import NoticeBox, { type Notice } from '../../components/NoticeBox';

import { EVENT_DATE } from '../../config/event';

import {
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Mail,
  MoveRight,
  ShieldCheck,
} from 'lucide-react';

const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';

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

async function sendAdminNotification(
  form: RegistrationForm,
  reference: string,
) {
  const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;

  if (!accessKey) {
    console.warn('Web3Forms access key is not configured.');
    return;
  }

  const formData = new FormData();

  formData.append('access_key', accessKey);
  formData.append('subject', 'New AGN 2027 Participant Registration');
  formData.append('from_name', 'AGN 2027 Registration System');

  formData.append(
    'name',
    `${form.firstName} ${form.lastName}`,
  );

  formData.append('email', form.email);
  formData.append('phone', form.phone);
  formData.append('reference', reference);

  formData.append(
    'message',
    `
NEW AGN 2027 REGISTRATION

PARTICIPANT DETAILS

Name: ${form.firstName} ${form.lastName}
Email: ${form.email}
Phone: ${form.phone}

AFFILIATION

Organisation: ${form.affiliation || 'Not provided'}
Occupation: ${form.occupation || 'Not provided'}

INTERESTS

Interest: ${form.interest || 'Not provided'}
Source: ${form.source || 'Not provided'}

REGISTRATION REFERENCE
${reference}

Event: AGN 2027
Theme: From Block to Breakthrough
Date: ${EVENT_DATE}
    `.trim(),
  );

  const response = await fetch(WEB3FORMS_ENDPOINT, {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error('Web3Forms notification delivery failed.');
  }
}

export default function RegistrationPage() {
  const [form, setForm] = useState<RegistrationForm>(INITIAL_FORM);

  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  const [notice, setNotice] = useState<Notice | null>(null);

  const [registration, setRegistration] =
    useState<RegistrationSuccess | null>(null);

  const update = (
    key: keyof RegistrationForm,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

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
      // STEP 1: Save registration in our backend.
      const response = await api.post('/registrations', {
        ...form,
        consentToPrivacy: consent,
      });

      const savedRegistration =
        response.data?.registration ?? response.data;

      const reference = savedRegistration?.reference;

      if (!reference) {
        throw new Error(
          'Your registration was submitted, but we could not retrieve its reference. Please contact the AGN team.',
        );
      }

      // STEP 2: Show success independently of email delivery.
      setRegistration({
        reference,
        name: `${form.firstName} ${form.lastName}`,
        email: form.email,
      });

      // STEP 3: Notify administrators through Web3Forms.
      // An email failure must never undo a successful registration.
      try {
        await sendAdminNotification(form, reference);
      } catch (emailError) {
        console.error(
          'AGN registration notification could not be delivered:',
          emailError,
        );
      }

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
  // SUCCESS SCREEN
  // =====================================================

  if (registration) {
    return (
      <PublicLayout>
        <main className="form-page">
          <div className="container">
            <div
              className="mx-auto w-full max-w-2xl py-12 sm:py-20"
              aria-live="polite"
            >
              <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl">

                {/* Success header */}
                <div className="bg-[#101D35] px-6 py-12 text-center text-white sm:px-12">

                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/10 ring-8 ring-white/5">
                    <CheckCircle2
                      size={42}
                      className="text-[#D9A441]"
                      strokeWidth={1.7}
                    />
                  </div>

                  <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#D9A441]">
                    AGN 2027 / REGISTRATION CONFIRMED
                  </span>

                  <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
                    You're officially
                    <br />
                    <span className="text-[#D9A441]">
                      on the list!
                    </span>
                  </h1>

                  <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-white/75 sm:text-base">
                    Thank you for taking this step. Your registration
                    for AGN 2027 has been received successfully.
                    We look forward to having you with us.
                  </p>
                </div>

                {/* Confirmation details */}
                <div className="space-y-7 p-6 sm:p-10">

                  <div>
                    <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                      Your registration reference
                    </p>

                    <div className="mt-3 flex items-center justify-center gap-3 rounded-xl border border-dashed border-[#D9A441] bg-[#D9A441]/5 px-4 py-5">
                      <span className="break-all text-lg font-bold tracking-wider text-[#101D35] sm:text-2xl">
                        {registration.reference}
                      </span>

                      <ClipboardCheck
                        size={21}
                        className="shrink-0 text-[#D9A441]"
                      />
                    </div>

                    <p className="mt-3 text-center text-xs leading-6 text-gray-500">
                      Keep this reference safe. You may need it
                      for future conference correspondence.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-5 sm:p-6">

                    <h2 className="font-bold text-[#101D35]">
                      Your conference details
                    </h2>

                    <div className="mt-5 space-y-4">

                      <div className="flex items-start gap-3">
                        <CalendarDays
                          size={19}
                          className="mt-0.5 shrink-0 text-[#D9A441]"
                        />

                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            AGN 2027
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            {EVENT_DATE}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Mail
                          size={19}
                          className="mt-0.5 shrink-0 text-[#D9A441]"
                        />

                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            Registration email
                          </p>

                          <p className="mt-1 break-all text-sm text-gray-500">
                            {registration.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <ShieldCheck
                          size={19}
                          className="mt-0.5 shrink-0 text-[#D9A441]"
                        />

                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            Registration status
                          </p>

                          <p className="mt-1 text-sm text-green-700">
                            Successfully received
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Next steps */}
                  <div>
                    <h2 className="font-bold text-[#101D35]">
                      What happens next?
                    </h2>

                    <div className="mt-4 space-y-4">

                      {[
                        'Keep your registration reference for future correspondence.',
                        'Watch your inbox for important conference updates.',
                        'Stay connected with Activation Global Network for announcements.',
                      ].map((item, index) => (
                        <div
                          key={item}
                          className="flex items-start gap-3"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D9A441]/15 text-xs font-bold text-[#101D35]">
                            {index + 1}
                          </span>

                          <p className="text-sm leading-6 text-gray-600">
                            {item}
                          </p>
                        </div>
                      ))}

                    </div>
                  </div>

                  <div className="rounded-xl border border-green-100 bg-green-50 p-4">
                    <div className="flex items-start gap-3">
                      <Check
                        size={19}
                        className="mt-0.5 shrink-0 text-green-700"
                      />

                      <p className="text-sm leading-6 text-green-800">
                        Your registration has been recorded.
                        Thank you for being part of the AGN 2027
                        journey.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-2 sm:flex-row">

                    <Link
                      to="/"
                      className="button button-dark flex flex-1 items-center justify-center gap-2"
                    >
                      Return to homepage
                      <ArrowUpRight size={17} />
                    </Link>

                    <Link
                      to="/"
                      className="button flex flex-1 items-center justify-center gap-2 border border-gray-200"
                    >
                      Explore AGN
                      <MoveRight size={17} />
                    </Link>

                  </div>

                  <p className="text-center text-xs leading-6 text-gray-400">
                    Activation Global Network
                    <br />
                    FROM BLOCK TO BREAKTHROUGH
                  </p>

                </div>
              </div>
            </div>
          </div>
        </main>
      </PublicLayout>
    );
  }

  // =====================================================
  // REGISTRATION FORM
  // =====================================================

  return (
    <PublicLayout>
      <main className="form-page">
        <div className="container form-page-grid">

          <div className="form-aside form-aside-orange">
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
          </div>

          <div className="form-main">

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

              <div className="form-section-label">
                <span>01</span>

                <div>
                  <strong>About you</strong>
                  <small>How should we reach you?</small>
                </div>
              </div>

              <div className="form-fields two-col">

                <FormField
                  label="First name"
                  name="firstName"
                  value={form.firstName}
                  onChange={(v) => update('firstName', v)}
                  required
                  placeholder="Your first name"
                />

                <FormField
                  label="Last name"
                  name="lastName"
                  value={form.lastName}
                  onChange={(v) => update('lastName', v)}
                  required
                  placeholder="Your last name"
                />

                <FormField
                  label="Email address"
                  name="email"
                  value={form.email}
                  onChange={(v) => update('email', v)}
                  required
                  type="email"
                  placeholder="you@example.com"
                />

                <FormField
                  label="Phone number"
                  name="phone"
                  value={form.phone}
                  onChange={(v) => update('phone', v)}
                  required
                  type="tel"
                  placeholder="e.g. 080..."
                />

                <FormField
                  label="School, organisation or business"
                  name="affiliation"
                  value={form.affiliation}
                  onChange={(v) => update('affiliation', v)}
                  placeholder="Where you study or work"
                />

                <FormField
                  label="What best describes you?"
                  name="occupation"
                  value={form.occupation}
                  onChange={(v) => update('occupation', v)}
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
                  onChange={(v) => update('interest', v)}
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
                  onChange={(v) => update('source', v)}
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

              <button
                disabled={busy}
                className="button button-dark button-submit"
                type="submit"
              >
                {busy
                  ? 'Submitting registration…'
                  : 'Submit registration'}

                <ArrowUpRight size={18} />
              </button>

              <p className="form-smallprint">
                Your information will be handled in accordance
                with the AGN privacy notice. Please keep your
                registration reference after submission.
              </p>

            </form>
          </div>
        </div>
      </main>
    </PublicLayout>
  );
}