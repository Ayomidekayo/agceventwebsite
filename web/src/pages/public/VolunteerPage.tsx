import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
HeartHandshake,
Users,
ArrowUpRight,
Check,
CheckCircle2,
X,
ExternalLink,
Copy,
BadgeCheck,
} from 'lucide-react';

import { api, getApiError } from '../../lib/api';
import { sendEmailNotification } from '../../lib/web3forms';

import PublicLayout from '../../layouts/PublicLayout';
import PageIntro from '../../components/forms/PageIntro';
import FormField from '../../components/forms/FormField';
import Consent from '../../components/forms/Consent';
import NoticeBox, { type Notice } from '../../components/NoticeBox';

const WEBSITE_URL = 'https://activationglobalconference.vercel.app';

const INITIAL_FORM = {
fullName: '',
email: '',
phone: '',
location: '',
occupation: '',
department: '',
experience: '',
availability: '',
motivation: '',
};

type VolunteerForm = typeof INITIAL_FORM;

type SuccessDetails = {
name: string;
email: string;
reference: string;
};

export default function VolunteerPage() {
const [form, setForm] = useState<VolunteerForm>(INITIAL_FORM);
const [consent, setConsent] = useState(false);
const [busy, setBusy] = useState(false);
const [notice, setNotice] = useState<Notice | null>(null);
const [success, setSuccess] = useState<SuccessDetails | null>(null);
const [copied, setCopied] = useState(false);

const update = (key: keyof VolunteerForm, value: string) => {
setForm((current) => ({
...current,
[key]: value,
}));
};

// Lock background scrolling while the success popup is open.
useEffect(() => {
if (!success) return;


const previousOverflow = document.body.style.overflow;

document.body.style.overflow = 'hidden';

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    setSuccess(null);
  }
};

window.addEventListener('keydown', handleKeyDown);

return () => {
  document.body.style.overflow = previousOverflow;
  window.removeEventListener('keydown', handleKeyDown);
};


}, [success]);

/**

* Notify the AGN administrator after the backend
* successfully saves the volunteer application.
  */
  const sendAdminNotification = async (
  details: VolunteerForm,
  reference: string,
  ) => {
  const message = `
  AGN 2027 — NEW VOLUNTEER APPLICATION

A new volunteer application has been successfully received.

VOLUNTEER DETAILS
────────────────────────────────
Full name: ${details.fullName}
Email: ${details.email}
Phone: ${details.phone}
Location: ${details.location || 'Not provided'}
Current role: ${details.occupation || 'Not provided'}

VOLUNTEER PREFERENCES
────────────────────────────────
Preferred team: ${details.department}
Availability: ${details.availability || 'Not specified'}

SKILLS AND EXPERIENCE
────────────────────────────────
${details.experience || 'Not provided'}

MOTIVATION
────────────────────────────────
${details.motivation}

APPLICATION REFERENCE
────────────────────────────────
${reference || 'Not provided'}

CONFERENCE INFORMATION
────────────────────────────────
AGN 2027
Theme: From Block to Breakthrough
Date: 27 February 2027
Time: 9:00 AM

OFFICIAL WEBSITE
${WEBSITE_URL}

Please review this application through the AGN administration
dashboard and follow up with the applicant regarding next steps.

ACTIVATION GLOBAL NETWORK
AGN 2027 VOLUNTEER TEAM
`.trim();


return sendEmailNotification({
  subject: `AGN 2027 | New Volunteer Application - ${details.fullName}`,
  name: details.fullName,
  email: details.email,
  message,
  phone: details.phone,
  location: details.location || 'Not provided',
  occupation: details.occupation || 'Not provided',
  department: details.department,
  availability: details.availability || 'Not specified',
  experience: details.experience || 'Not provided',
  motivation: details.motivation,
  reference: reference || 'Not provided',
  website: WEBSITE_URL,
});


};

const submit = async (event: FormEvent<HTMLFormElement>) => {
event.preventDefault();


if (busy) return;

if (!consent) {
  setNotice({
    kind: 'error',
    text: 'Please provide your consent before submitting your application.',
  });
  return;
}

setBusy(true);
setNotice(null);

const submittedForm = { ...form };

try {
  // 1. Save the application in the AGN backend.
  const response = await api.post('/volunteers', {
    ...submittedForm,
    consentToPrivacy: consent,
  });

  const savedApplication =
    response.data?.application ?? response.data?.volunteer ?? response.data;

  const reference =
    savedApplication?.reference ??
    response.data?.reference ??
    '';

  // 2. Notify the AGN administrator.
  // Notification failure does not undo a saved application.
  try {
    await sendAdminNotification(submittedForm, reference);
  } catch (emailError) {
    console.error(
      'AGN volunteer notification failed:',
      emailError,
    );
  }

  // 3. Reset the form.
  setForm({ ...INITIAL_FORM });
  setConsent(false);

  // 4. Display the professional success popup.
  setSuccess({
    name: submittedForm.fullName,
    email: submittedForm.email,
    reference,
  });
} catch (error) {
  setNotice({
    kind: 'error',
    text: getApiError(
      error,
      'We could not submit your application. Please try again.',
    ),
  });
} finally {
  setBusy(false);
}


};

const copyReference = async () => {
if (!success?.reference) return;

try {
  await navigator.clipboard.writeText(success.reference);
  setCopied(true);

  window.setTimeout(() => {
    setCopied(false);
  }, 2000);
} catch {
  setNotice({
    kind: 'error',
    text: 'Unable to copy the reference. Please select and copy it manually.',
  });
}


};

return ( <PublicLayout> <main className="form-page"> <div className="container form-page-grid">


      {/* VOLUNTEER SIDEBAR */}
      <div className="form-aside form-aside-dark">
        <span className="aside-kicker">
          AGN 2027 / VOLUNTEER
        </span>

        <div className="volunteer-aside-graphic">
          <div className="graphic-ring" />
          <div className="graphic-ring graphic-ring-two" />

          <HeartHandshake size={76} strokeWidth={1.1} />

          <span>
            SHOW UP
            <br />
            WITH PURPOSE
          </span>
        </div>

        <div className="aside-bottom">
          <span>YOUR SKILLS. OUR SHARED FUTURE.</span>

          <p>
            Make the experience possible from behind the scenes.
          </p>

          <div className="aside-meta">
            <Users size={15} />
            Volunteer applications
          </div>
        </div>
      </div>

      {/* VOLUNTEER APPLICATION FORM */}
      <div className="form-main">
        <PageIntro
          eyebrow="BE PART OF THE BUILD"
          title={
            <>
              Bring your energy.
              <br />
              <span>Make an impact.</span>
            </>
          }
          subtitle="Tell us where your strengths are and how you would like to contribute to the conference."
        />

        <NoticeBox notice={notice} />

        <form onSubmit={submit} className="application-form">

          <div className="form-section-label">
            <span>01</span>

            <div>
              <strong>Your details</strong>
              <small>
                How the team can contact you.
              </small>
            </div>
          </div>

          <div className="form-fields two-col">

            <FormField
              label="Full name"
              name="fullName"
              value={form.fullName}
              onChange={(value) => update('fullName', value)}
              required
              placeholder="Your full name"
            />

            <FormField
              label="Email address"
              name="email"
              value={form.email}
              onChange={(value) => update('email', value)}
              required
              type="email"
              placeholder="you@example.com"
            />

            <FormField
              label="Phone number"
              name="phone"
              value={form.phone}
              onChange={(value) => update('phone', value)}
              required
              type="tel"
              placeholder="Your phone number"
            />

            <FormField
              label="Location"
              name="location"
              value={form.location}
              onChange={(value) => update('location', value)}
              placeholder="City / state"
            />

            <FormField
              label="Current role"
              name="occupation"
              value={form.occupation}
              onChange={(value) => update('occupation', value)}
              options={[
                'Student',
                'Professional',
                'Entrepreneur',
                'Job seeker',
                'Other',
              ]}
            />

            <FormField
              label="Preferred team"
              name="department"
              value={form.department}
              onChange={(value) => update('department', value)}
              required
              options={[
                'Registration & guest services',
                'Ushering & protocol',
                'Logistics & operations',
                'Marketing & publicity',
                'Media & photography',
                'Technical support',
                'Sponsorship & partnerships',
                'Programme support',
                'Community engagement',
                'Open to placement',
              ]}
            />

            <FormField
              label="Relevant skills or experience"
              name="experience"
              value={form.experience}
              onChange={(value) => update('experience', value)}
              placeholder="Skills, tools or previous volunteering"
              full
            />

            <FormField
              label="Availability"
              name="availability"
              value={form.availability}
              onChange={(value) => update('availability', value)}
              options={[
                'Planning and event day',
                'Event day only',
                'Planning period only',
                'Flexible / discuss with me',
              ]}
              full
            />

            <FormField
              label="Why would you like to volunteer with AGN?"
              name="motivation"
              value={form.motivation}
              onChange={(value) => update('motivation', value)}
              type="textarea"
              required
              placeholder="Tell us a little about your motivation…"
              full
            />
          </div>

          <Consent
            checked={consent}
            setChecked={setConsent}
            text={
              <>
                I consent to AGN using my information to review
                this application and contact me about volunteering.
                Please read the{' '}
                <Link
                  className="inline-policy-link"
                  to="/privacy"
                >
                  privacy notice
                </Link>
                .
              </>
            }
          />

          <button
            disabled={busy}
            className="button button-dark button-submit"
            type="submit"
          >
            {busy
              ? 'Submitting application…'
              : 'Submit volunteer application'}

            <ArrowUpRight size={18} />
          </button>

          <p className="form-smallprint">
            Applications are reviewed by the volunteer team.
            Submission does not guarantee a volunteer placement.
          </p>
        </form>
      </div>
    </div>

    {/* PROFESSIONAL VOLUNTEER SUCCESS POPUP */}
    {success && (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm sm:p-6"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            setSuccess(null);
          }
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="volunteer-success-title"
          aria-describedby="volunteer-success-description"
          className="relative my-auto w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
        >
          {/* NAVY HEADER */}
          <div className="relative overflow-hidden bg-[#101B35] px-6 pb-12 pt-9 text-center sm:px-10">

            <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full border border-white/10" />

            <div className="absolute -bottom-28 -left-10 h-48 w-48 rounded-full border border-[#E9B949]/20" />

            <button
              type="button"
              onClick={() => setSuccess(null)}
              aria-label="Close notification"
              className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white/10"
            >
              <X size={19} />
            </button>

            <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-[#E9B949]/40 bg-[#E9B949]/15">
              <CheckCircle2
                size={43}
                className="text-[#F2C45F]"
                strokeWidth={1.7}
              />

              <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border-4 border-[#101B35] bg-emerald-400">
                <Check size={13} className="text-white" />
              </span>
            </div>

            <span className="relative inline-block rounded-full border border-[#E9B949]/30 bg-[#E9B949]/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#F2C45F]">
              AGN 2027 · Volunteer Team
            </span>

            <h2
              id="volunteer-success-title"
              className="relative mt-5 text-2xl font-bold tracking-tight text-white sm:text-3xl"
            >
              Thank you, {success.name.split(' ')[0]}!
            </h2>

            <p className="relative mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-300">
              Your volunteer application has been successfully received.
            </p>
          </div>

          {/* POPUP BODY */}
          <div className="px-6 pb-7 pt-7 sm:px-9 sm:pb-9">

            <div className="text-center">
              <p
                id="volunteer-success-description"
                className="text-sm leading-6 text-slate-600"
              >
                Thank you for choosing to contribute your time,
                skills and energy to AGN 2027. Our volunteer team
                will review your application and contact you
                regarding possible next steps.
              </p>
            </div>

            {/* APPLICATION REFERENCE */}
            {success.reference && (
              <div className="mt-7 rounded-2xl border border-[#E9B949]/40 bg-[#FFFBF0] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                      Your application reference
                    </p>

                    <p className="mt-2 break-all font-mono text-base font-bold tracking-wide text-[#101B35]">
                      {success.reference}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={copyReference}
                    className="flex shrink-0 items-center gap-2 rounded-xl border border-[#E9B949]/50 bg-white px-3 py-2 text-xs font-semibold text-[#101B35] transition hover:bg-[#FFF5D9]"
                  >
                    {copied ? (
                      <>
                        <Check size={15} />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy size={15} />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* APPLICANT DETAILS */}
            <div className="mt-5 flex items-start gap-3 rounded-xl bg-slate-50 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#101B35]/5">
                <BadgeCheck
                  size={20}
                  className="text-[#B68A2D]"
                />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#101B35]">
                  Application submitted with
                </p>

                <p className="mt-1 break-all text-xs leading-5 text-slate-500">
                  {success.email}
                </p>
              </div>
            </div>

            {/* EVENT DETAILS */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-100 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Conference
                </p>

                <p className="mt-1 text-sm font-bold text-[#101B35]">
                  AGN 2027
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Event date
                </p>

                <p className="mt-1 text-sm font-bold text-[#101B35]">
                  27 February 2027
                </p>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="mt-7 flex flex-col gap-3">
              <a
                href={WEBSITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#101B35] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1C2D50]"
              >
                Visit AGN 2027 Website
                <ExternalLink size={16} />
              </a>

              <button
                type="button"
                onClick={() => setSuccess(null)}
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-[#E9B949] hover:bg-[#FFFBF0] hover:text-[#101B35]"
              >
                Continue browsing
                <ArrowUpRight size={16} />
              </button>
            </div>

            <p className="mt-6 text-center text-[10px] font-medium uppercase tracking-[0.15em] text-slate-400">
              Activation Global Network · From Block to Breakthrough
            </p>
          </div>

          {/* GOLD BRAND ACCENT */}
          <div className="h-1.5 bg-gradient-to-r from-[#B68A2D] via-[#F2C45F] to-[#B68A2D]" />
        </div>
      </div>
    )}
  </main>
</PublicLayout>


);
}
