import { useEffect, useState } from 'react';

import type { FormEvent } from 'react';

import { Link } from 'react-router-dom';

import {

ArrowUpRight,

BadgeCheck,

ShieldCheck,

Check,

CheckCircle2,

X,

ExternalLink,

Copy,

CreditCard,
LoaderCircle,
Landmark,

} from 'lucide-react';



import { api, getApiError } from '../../lib/api';

import { sendEmailNotification } from '../../lib/web3forms';



import PublicLayout from '../../layouts/PublicLayout';

import FormField from '../../components/forms/FormField';

import Consent from '../../components/forms/Consent';

import NoticeBox, { type Notice } from '../../components/NoticeBox';
import type { BankDetails } from '../../lib/payment';



const WEBSITE_URL = 'https://activationglobalconference.vercel.app';



const INITIAL_FORM = {

sponsorType: 'Individual',

name: '',

organisation: '',

email: '',

phone: '',

supportLevel: '',

supportType: 'Financial contribution',

amount: '',

message: '',

};



type SponsorshipForm = typeof INITIAL_FORM;

type BankTransferForm = {
  transferSenderName: string;
  transferReference: string;
  transferDate: string;
};

const getLocalDateInputValue = (): string => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

type SuccessDetails = {

name: string;

reference: string;

email: string;

};



export default function SponsorshipPage() {

const [form, setForm] = useState<SponsorshipForm>(INITIAL_FORM);

const [consent, setConsent] = useState(false);

const [busy, setBusy] = useState(false);

const [notice, setNotice] = useState<Notice | null>(null);

const [success, setSuccess] = useState<SuccessDetails | null>(null);

const [copied, setCopied] = useState(false);

const [paymentChoice, setPaymentChoice] = useState(false);

const [savedEnquiry, setSavedEnquiry] = useState<{

  id: string;

  reference: string;

} | null>(null);

const [paymentAmount, setPaymentAmount] = useState('');

const [paymentBusy, setPaymentBusy] = useState(false);

const [paymentMethod, setPaymentMethod] = useState<'CHOICE' | 'BANK_TRANSFER'>('CHOICE');
const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
const [bankDetailsLoading, setBankDetailsLoading] = useState(false);
const [bankTransfer, setBankTransfer] = useState<BankTransferForm>({
  transferSenderName: '',
  transferReference: '',
  transferDate: getLocalDateInputValue(),
});
const [bankTransferBusy, setBankTransferBusy] = useState(false);



const update = (key: keyof SponsorshipForm, value: string) => {

setForm((current) => ({

...current,

[key]: value,

}));

};



// Prevent background scrolling while the success dialog is open.

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



const sendAdminNotification = async (

details: SponsorshipForm,

reference: string,

) => {

const message = `

AGN 2027 — NEW SPONSORSHIP ENQUIRY



A new sponsorship enquiry has been successfully received.



SPONSOR INFORMATION

Name: ${details.name}

Sponsor type: ${details.sponsorType}

Organisation: ${details.organisation || 'Not provided'}

Email: ${details.email}

Phone: ${details.phone}



SPONSORSHIP INTEREST

Support category: ${details.supportType}

Contribution level: ${details.supportLevel || 'Not specified'}

Indicative amount: ${details.amount || 'Not specified'}



MESSAGE FROM SPONSOR

${details.message}



ENQUIRY REFERENCE

${reference || 'Not provided'}



CONFERENCE INFORMATION

AGN 2027

Theme: From Block to Breakthrough

Date: 27 February 2027

Time: 9:00 AM



OFFICIAL WEBSITE

${WEBSITE_URL}



Please review this enquiry through the AGN administration dashboard

and follow up with the prospective sponsor.



ACTIVATION GLOBAL NETWORK

AGN 2027 PARTNERSHIPS TEAM

`.trim();





return sendEmailNotification({

  subject: `AGN 2027 | New Sponsorship Enquiry - ${details.name}`,

  name: details.name,

  email: details.email,

  message,

  phone: details.phone,

  organisation: details.organisation || 'Not provided',

  sponsor_type: details.sponsorType,

  support_type: details.supportType,

  support_level: details.supportLevel || 'Not specified',

  amount: details.amount || 'Not specified',

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

    text: 'Please provide your consent before submitting your enquiry.',

  });

  return;

}



setBusy(true);

setNotice(null);



const submittedForm = { ...form };



try {

  // Save the enquiry before offering the optional payment step.

  const response = await api.post('/sponsorship-enquiries', {

    ...submittedForm,

    consentToPrivacy: consent,

  });



  const saved = response.data?.enquiry ?? response.data;

  const enquiryId = saved?.id;

  const reference = saved?.reference ?? response.data?.reference ?? '';



  if (!enquiryId || typeof enquiryId !== 'string') {

    throw new Error(

      'The enquiry was submitted, but the server did not return its enquiry ID. Please contact AGN before attempting payment.',

    );

  }



  // Keep the existing Web3Forms enquiry notification.

  // A notification failure must not undo a saved enquiry.

  try {

    await sendAdminNotification(submittedForm, reference);

  } catch (emailError) {

    console.error('AGN sponsorship enquiry notification failed:', emailError);

  }



  setSavedEnquiry({ id: enquiryId, reference });

  setPaymentAmount(submittedForm.amount.replace(/[^0-9.]/g, ''));

  setPaymentChoice(true);

} catch (error) {

  setNotice({

    kind: 'error',

    text: getApiError(

      error,

      'We could not submit your enquiry. Please try again.',

    ),

  });

} finally {

  setBusy(false);

}



};



const choosePayLater = () => {

  if (!savedEnquiry) return;



  setPaymentChoice(false);

  setForm({ ...INITIAL_FORM });

  setConsent(false);

  setSuccess({

    name: form.name,

    email: form.email,

    reference: savedEnquiry.reference,

  });

  setSavedEnquiry(null);

  setPaymentAmount('');

};



const choosePayNow = async () => {

  if (!savedEnquiry || paymentBusy) return;



  const amount = paymentAmount.trim();



  if (!/^\d{1,12}(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) {

    setNotice({

      kind: 'error',

      text: 'Enter an exact contribution amount in naira, for example 100000. Suggested amounts such as ₦500,000+ must be replaced with an exact figure.',

    });

    return;

  }



  setPaymentBusy(true);

  setNotice(null);



  try {

    const response = await api.post('/payments/initialize', {

      purpose: 'DIRECT_SPONSORSHIP',

      enquiryId: savedEnquiry.id,

      amount,

      payerName: form.name,

      payerEmail: form.email,

      payerPhone: form.phone || undefined,

    });



    const payment = response.data?.data ?? response.data;

    const authorizationUrl = payment?.authorizationUrl;



    if (

      !payment?.success ||

      typeof authorizationUrl !== 'string' ||

      !authorizationUrl.startsWith('https://')

    ) {

      throw new Error('The payment gateway did not return a valid checkout link. Your enquiry is still saved.');

    }



    sessionStorage.setItem(

      'agn_pending_sponsorship',

      JSON.stringify({

        enquiryId: savedEnquiry.id,

        reference: savedEnquiry.reference,

        name: form.name,

        email: form.email,

        phone: form.phone,

        organisation: form.organisation,

        sponsorType: form.sponsorType,

        supportType: form.supportType,

        supportLevel: form.supportLevel,

        paymentAmount: amount,

      }),

    );



    window.location.assign(authorizationUrl);

  } catch (error) {

    setNotice({

      kind: 'error',

      text: getApiError(

        error,

        'We could not start your payment. Your sponsorship enquiry remains saved. Please try again.',

      ),

    });

  } finally {

    setPaymentBusy(false);

  }

};



const loadBankDetails = async () => {
  if (bankDetails || bankDetailsLoading) return;

  setBankDetailsLoading(true);
  setNotice(null);

  try {
    const response = await api.get('/payments/bank-details');
    const details = response.data?.data ?? response.data;

    if (
      !details?.bankName ||
      !details?.accountName ||
      !details?.accountNumber
    ) {
      throw new Error('Bank account details are currently unavailable.');
    }

    setBankDetails(details);
  } catch (error) {
    setNotice({
      kind: 'error',
      text: getApiError(error, 'Unable to load bank transfer details. Please try again.'),
    });
  } finally {
    setBankDetailsLoading(false);
  }
};

const submitBankTransfer = async () => {
  if (!savedEnquiry || bankTransferBusy) return;

  const amount = paymentAmount.trim();

  if (!/^\d{1,12}(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) {
    setNotice({
      kind: 'error',
      text: 'Enter a valid contribution amount, for example 100000.',
    });
    return;
  }

  if (
    !bankTransfer.transferSenderName.trim() ||
    !bankTransfer.transferReference.trim() ||
    !bankTransfer.transferDate
  ) {
    setNotice({
      kind: 'error',
      text: 'Please complete all bank transfer details.',
    });
    return;
  }

  setBankTransferBusy(true);
  setNotice(null);

  try {
    const response = await api.post('/payments/bank-transfer', {
      enquiryId: savedEnquiry.id,
      amount,
      payerName: form.name,
      payerEmail: form.email,
      payerPhone: form.phone || undefined,
      transferSenderName: bankTransfer.transferSenderName.trim(),
      transferReference: bankTransfer.transferReference.trim(),
      transferDate: bankTransfer.transferDate,
    });

    const result = response.data?.data ?? response.data;

    if (!result?.reference) {
      throw new Error('The server did not return a bank transfer reference.');
    }

    setPaymentChoice(false);
    setPaymentMethod('CHOICE');
    setSuccess({
      name: form.name,
      email: form.email,
      reference: result.reference,
    });
    setSavedEnquiry(null);
    setPaymentAmount('');
    setBankTransfer({
      transferSenderName: '',
      transferReference: '',
      transferDate: getLocalDateInputValue(),
    });
  } catch (error) {
    setNotice({
      kind: 'error',
      text: getApiError(
        error,
        'We could not submit your bank transfer details. Your sponsorship enquiry is still saved.',
      ),
    });
  } finally {
    setBankTransferBusy(false);
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



const levels = [

{

name: 'Friend of AGN',

amount: '₦25,000',

description: 'Participant materials and programme needs',

},

{

name: 'Breakthrough Supporter',

amount: '₦50,000',

description: 'Student participation and event delivery',

},

{

name: 'Impact Partner',

amount: '₦100,000',

description: 'Learning resources, hospitality and logistics',

},

{

name: 'Youth Development Champion',

amount: '₦250,000',

description: 'Support across multiple event needs',

},

{

name: 'Legacy Contributor',

amount: '₦500,000+',

description: 'A substantial contribution towards delivery',

},

];



return ( <PublicLayout> <main>

{/* HERO SECTION */} <section className="sponsor-hero"> <div className="container sponsor-hero-grid"> <div> <div className="eyebrow"> <span className="eyebrow-line" />

PARTNER WITH POSSIBILITY </div>





          <h1>

            Invest in the

            <br />

            <span>next breakthrough.</span>

          </h1>



          <p>

            Help put young people in a room where new perspectives,

            purposeful connections and practical ideas can open up

            new possibilities.

          </p>



          <a className="button button-dark" href="#sponsor-form">

            Start a sponsorship conversation

            <ArrowUpRight size={18} />

          </a>

        </div>



        <div className="sponsor-hero-graphic">

          <span className="sponsor-graphic-kicker">

            AGN 2027 / PARTNERSHIPS

          </span>



          <div className="sponsor-number">

            01<span>—</span>∞

          </div>



          <div className="sponsor-graphic-line" />



          <p>

            YOUR SUPPORT

            <br />

            CAN MOVE AN IDEA FORWARD.

          </p>



          <span className="sponsor-graphic-foot">

            FROM BLOCK TO BREAKTHROUGH

          </span>

        </div>

      </div>

    </section>



    {/* SUPPORT LEVELS */}

    <section className="section support-levels">

      <div className="container">

        <div className="section-heading-row">

          <div>

            <div className="eyebrow">

              <span className="eyebrow-line" />

              WAYS TO SUPPORT

            </div>



            <h2>

              Make an impact

              <br />

              <span>at any level.</span>

            </h2>

          </div>



          <p>

            These suggested individual contribution levels are a

            starting point, not a requirement. We also welcome

            conversations about corporate partnerships and in-kind

            support.

          </p>

        </div>



        <div className="levels-grid">

          {levels.map((level, index) => (

            <article

              className={`level-card ${

                index === 2 ? 'level-card-featured' : ''

              }`}

              key={level.name}

            >

              <span className="level-index">

                0{index + 1}

              </span>



              <h3>{level.name}</h3>



              <strong className="level-amount">

                {level.amount}

              </strong>



              <p>{level.description}.</p>



              <a

                href="#sponsor-form"

                onClick={() =>

                  setForm((current) => ({

                    ...current,

                    sponsorType: 'Individual',

                    supportLevel: level.name,

                    amount: level.amount,

                  }))

                }

              >

                Discuss this level

                <ArrowUpRight size={16} />

              </a>

            </article>

          ))}

        </div>



        <p className="levels-disclaimer">

          Contributions are subject to confirmation and agreed

          terms. Please verify any payment instructions with an

          authorised AGN representative before sending funds.

        </p>

      </div>

    </section>



    {/* SPONSORSHIP FORM */}

    <section className="sponsor-form-section" id="sponsor-form">

      <div className="container sponsor-form-grid">

        <div className="sponsor-form-copy">

          <div className="eyebrow eyebrow-light">

            <span className="eyebrow-line" />

            LET'S START A CONVERSATION

          </div>



          <h2>

            Support that

            <br />

            moves things <span>forward.</span>

          </h2>



          <p>

            Complete the form and the AGN partnerships team can

            follow up to understand your goals, discuss suitable

            support, and agree on next steps.

          </p>



          <div className="sponsor-benefit">

            <BadgeCheck />



            <div>

              <strong>Clear expectations</strong>

              <span>

                Support and benefits are agreed before confirmation.

              </span>

            </div>

          </div>



          <div className="sponsor-benefit">

            <ShieldCheck />



            <div>

              <strong>Responsible follow-up</strong>

              <span>

                Your enquiry is routed to the appropriate team.

              </span>

            </div>

          </div>

        </div>



        <div className="sponsor-form-card">

          <NoticeBox notice={notice} />



          <form

            className="application-form"

            onSubmit={submit}

          >

            <div className="form-section-label">

              <span>01</span>



              <div>

                <strong>Sponsor details</strong>

                <small>

                  Tell us about you or your organisation.

                </small>

              </div>

            </div>



            <div className="form-fields two-col">

              <FormField

                label="I am enquiring as"

                name="sponsorType"

                value={form.sponsorType}

                onChange={(value) => update('sponsorType', value)}

                options={[

                  'Individual',

                  'Company / organisation',

                  'Foundation / NGO',

                  'In-kind partner',

                ]}

              />



              <FormField

                label="Contact name"

                name="name"

                value={form.name}

                onChange={(value) => update('name', value)}

                required

                placeholder="Full name"

              />



              <FormField

                label="Organisation"

                name="organisation"

                value={form.organisation}

                onChange={(value) => update('organisation', value)}

                placeholder="Organisation name"

              />



              <FormField

                label="Email address"

                name="email"

                value={form.email}

                onChange={(value) => update('email', value)}

                required

                type="email"

                placeholder="you@organisation.com"

              />



              <FormField

                label="Phone number"

                name="phone"

                value={form.phone}

                onChange={(value) => update('phone', value)}

                required

                type="tel"

                placeholder="Contact number"

              />



              <FormField

                label="Support category"

                name="supportType"

                value={form.supportType}

                onChange={(value) => update('supportType', value)}

                options={[

                  'Financial contribution',

                  'In-kind support',

                  'Corporate partnership',

                  'Media / publicity partnership',

                  'Venue or equipment support',

                  'Other',

                ]}

              />



              <FormField

                label="Contribution level (if known)"

                name="supportLevel"

                value={form.supportLevel}

                onChange={(value) => update('supportLevel', value)}

                options={[

                  'Friend of AGN',

                  'Breakthrough Supporter',

                  'Impact Partner',

                  'Youth Development Champion',

                  'Legacy Contributor',

                  'Custom / to be discussed',

                ]}

              />



              <FormField

                label="Indicative amount (optional)"

                name="amount"

                value={form.amount}

                onChange={(value) => update('amount', value)}

                placeholder="e.g. ₦100,000"

              />



              <FormField

                label="Tell us how you would like to support"

                name="message"

                value={form.message}

                onChange={(value) => update('message', value)}

                type="textarea"

                required

                placeholder="Share your goals, offer or questions…"

                full

              />

            </div>



            <Consent

              checked={consent}

              setChecked={setConsent}

              text={

                <>

                  I consent to AGN using these details to respond

                  to this sponsorship enquiry. Please read the{' '}

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

              {busy ? 'Submitting enquiry…' : 'Send sponsorship enquiry'}

              <ArrowUpRight size={18} />

            </button>



            <p className="form-smallprint">

              This form records an enquiry. It does not constitute

              a confirmed sponsorship or a payment request.

            </p>

          </form>

        </div>

      </div>

    </section>



    {/* SPONSORSHIP PAYMENT CHOICE */}
{paymentChoice && savedEnquiry && (
  <div
    className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm sm:p-6"
    onMouseDown={(event) => {
      if (
        event.target === event.currentTarget &&
        !paymentBusy &&
        !bankTransferBusy
      ) {
        choosePayLater();
      }
    }}
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sponsorship-payment-choice-title"
      className="my-auto w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
    >
      <div className="bg-[#101B35] px-6 py-8 text-center sm:px-9">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#E9B949]/40 bg-[#E9B949]/15 text-[#F2C45F]">
          <CheckCircle2 size={34} />
        </div>
        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#F2C45F]">
          AGN 2027 · Partnerships
        </p>
        <h2 id="sponsorship-payment-choice-title" className="mt-3 text-2xl font-bold text-white">
          Your enquiry is received.
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Choose how you would like to make your contribution. You can also complete your payment later.
        </p>
      </div>

      <div className="space-y-4 px-6 py-7 sm:px-9">
        <div className="rounded-2xl border border-slate-200 p-4">
          <label htmlFor="sponsorship-payment-amount" className="mb-2 block text-sm font-semibold text-slate-800">
            Exact contribution amount (NGN)
          </label>
          <div className="flex items-center rounded-xl border border-slate-300 px-4 focus-within:border-[#B68A2D] focus-within:ring-2 focus-within:ring-[#E9B949]/20">
            <span className="mr-2 text-sm font-semibold text-slate-500">₦</span>
            <input
              id="sponsorship-payment-amount"
              inputMode="decimal"
              autoComplete="off"
              value={paymentAmount}
              onChange={(event) => setPaymentAmount(event.target.value)}
              placeholder="e.g. 100000"
              disabled={paymentBusy || bankTransferBusy}
              className="min-h-12 w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
            />
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Enter a precise amount. Suggested amounts such as ₦500,000+ must be replaced with an exact figure.
          </p>
        </div>

        {notice && <NoticeBox notice={notice} />}

        {paymentMethod === 'CHOICE' ? (
          <>
            <button
              type="button"
              onClick={choosePayNow}
              disabled={paymentBusy || bankTransferBusy}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#101B35] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1C2D50] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {paymentBusy ? <LoaderCircle size={17} className="animate-spin" /> : <CreditCard size={17} />}
              {paymentBusy ? 'Connecting to Paystack…' : 'Pay online with Paystack'}
              {!paymentBusy && <ArrowUpRight size={17} />}
            </button>

            <button
              type="button"
              onClick={() => {
                setPaymentMethod('BANK_TRANSFER');
                void loadBankDetails();
              }}
              disabled={paymentBusy || bankTransferBusy}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#E9B949] hover:bg-[#FFFBF0]"
            >
              <Landmark size={17} />
              Pay by bank transfer
              <ArrowUpRight size={17} />
            </button>

            <button
              type="button"
              onClick={choosePayLater}
              disabled={paymentBusy || bankTransferBusy}
              className="flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#E9B949] hover:bg-[#FFFBF0]"
            >
              Pay later — contact me first
            </button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[#101B35]">Bank transfer details</h3>
              <button
                type="button"
                onClick={() => setPaymentMethod('CHOICE')}
                className="text-xs font-semibold text-[#9A7429] hover:underline"
              >
                Back to payment options
              </button>
            </div>

            {bankDetailsLoading ? (
              <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 p-6 text-sm text-slate-600">
                <LoaderCircle size={18} className="animate-spin" />
                Loading bank details…
              </div>
            ) : bankDetails ? (
              <>
                <div className="space-y-3 rounded-2xl border border-[#E9B949]/40 bg-[#FFFBF0] p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Transfer to this account
                  </p>
                  <div>
                    <p className="text-xs text-slate-500">Bank</p>
                    <p className="font-semibold text-[#101B35]">{bankDetails.bankName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Account name</p>
                    <p className="font-semibold text-[#101B35]">{bankDetails.accountName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Account number</p>
                    <p className="break-all font-mono text-xl font-bold tracking-wider text-[#101B35]">
                      {bankDetails.accountNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Currency</p>
                    <p className="font-semibold text-[#101B35]">{bankDetails.currency || 'NGN'}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                  Your payment remains pending until an authorised AGN administrator verifies the transfer. Do not make a transfer unless the displayed account has been confirmed as an authorised AGN account.
                </div>

                <div className="space-y-3">
                  <div>
                    <label htmlFor="transfer-sender-name" className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Name on sending bank account
                    </label>
                    <input
                      id="transfer-sender-name"
                      value={bankTransfer.transferSenderName}
                      onChange={(event) => setBankTransfer((current) => ({ ...current, transferSenderName: event.target.value }))}
                      placeholder="Name used to make the transfer"
                      autoComplete="name"
                      className="min-h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-[#B68A2D] focus:ring-2 focus:ring-[#E9B949]/20"
                    />
                  </div>

                  <div>
                    <label htmlFor="transfer-reference" className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Bank transfer reference
                    </label>
                    <input
                      id="transfer-reference"
                      value={bankTransfer.transferReference}
                      onChange={(event) => setBankTransfer((current) => ({ ...current, transferReference: event.target.value }))}
                      placeholder="Transaction reference"
                      className="min-h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-[#B68A2D] focus:ring-2 focus:ring-[#E9B949]/20"
                    />
                  </div>

                  <div>
                    <label htmlFor="transfer-date" className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Transfer date
                    </label>
                    <input
                      id="transfer-date"
                      type="date"
                      value={bankTransfer.transferDate}
                      max={getLocalDateInputValue()}
                      onChange={(event) => setBankTransfer((current) => ({ ...current, transferDate: event.target.value }))}
                      className="min-h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-[#B68A2D] focus:ring-2 focus:ring-[#E9B949]/20"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={submitBankTransfer}
                  disabled={bankTransferBusy}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#101B35] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1C2D50] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {bankTransferBusy && <LoaderCircle size={17} className="animate-spin" />}
                  {bankTransferBusy ? 'Submitting transfer details…' : 'Submit transfer details'}
                </button>
              </>
            ) : (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Bank account details could not be loaded.
                <button type="button" onClick={() => void loadBankDetails()} className="ml-2 font-bold underline">
                  Try again
                </button>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-xs leading-5 text-slate-500">
          Enquiry reference: <strong>{savedEnquiry.reference || 'Pending'}</strong>.
          Your sponsorship enquiry remains saved regardless of the payment option you choose.
        </p>
      </div>

      <div className="h-1.5 bg-gradient-to-r from-[#B68A2D] via-[#F2C45F] to-[#B68A2D]" />
    </div>
  </div>
)}

{/* PROFESSIONAL SUCCESS POPUP */}

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

          aria-labelledby="sponsorship-success-title"

          aria-describedby="sponsorship-success-description"

          className="relative my-auto w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"

        >

          {/* Decorative header */}

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

              AGN 2027 · Partnerships

            </span>



            <h2

              id="sponsorship-success-title"

              className="relative mt-5 text-2xl font-bold tracking-tight text-white sm:text-3xl"

            >

              Thank you, {success.name.split(' ')[0]}!

            </h2>



            <p className="relative mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-300">

              Your sponsorship enquiry has been successfully received.

            </p>

          </div>



          {/* Popup body */}

          <div className="px-6 pb-7 pt-7 sm:px-9 sm:pb-9">

            <div className="text-center">

              <p

                id="sponsorship-success-description"

                className="text-sm leading-6 text-slate-600"

              >

                Your interest in supporting the next generation

                means a great deal to us. Our partnerships team

                will review your enquiry and follow up with you.

              </p>

            </div>



            {/* Reference card */}

            {success.reference && (

              <div className="mt-7 rounded-2xl border border-[#E9B949]/40 bg-[#FFFBF0] p-4 sm:p-5">

                <div className="flex items-center justify-between gap-3">

                  <div>

                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">

                      Your enquiry reference

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



            {/* Email information */}

            <div className="mt-5 flex items-start gap-3 rounded-xl bg-slate-50 p-4">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#101B35]/5">

                <BadgeCheck size={20} className="text-[#B68A2D]" />

              </div>



              <div className="min-w-0">

                <p className="text-sm font-semibold text-[#101B35]">

                  Your contact details

                </p>



                <p className="mt-1 break-all text-xs leading-5 text-slate-500">

                  {success.email}

                </p>

              </div>

            </div>



            {/* Conference information */}

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

                  Date

                </p>



                <p className="mt-1 text-sm font-bold text-[#101B35]">

                  27 February 2027

                </p>

              </div>

            </div>



            {/* Actions */}

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



          {/* Gold bottom accent */}

          <div className="h-1.5 bg-gradient-to-r from-[#B68A2D] via-[#F2C45F] to-[#B68A2D]" />

        </div>

      </div>

    )}

  </main>

</PublicLayout>



);

}
