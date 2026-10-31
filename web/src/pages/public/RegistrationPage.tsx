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
import { ArrowUpRight, CalendarDays } from 'lucide-react';

export default function RegistrationPage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', affiliation: '', occupation: '', interest: '', source: '' });
  const [consent, setConsent] = useState(false); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState<Notice | null>(null);
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setNotice(null);
    try {
      const response = await api.post('/registrations', { ...form, consentToPrivacy: consent });
      setNotice({ kind: 'success', text: `Registration received. Your reference is ${response.data?.reference ?? response.data?.registration?.reference ?? 'being processed'}. Keep this reference for your records. Email confirmations will be enabled before launch.` });
      setForm({ firstName: '', lastName: '', email: '', phone: '', affiliation: '', occupation: '', interest: '', source: '' }); setConsent(false);
    } catch (error) { setNotice({ kind: 'error', text: getApiError(error, 'We could not submit your registration. Please review your details and try again.') }); }
    finally { setBusy(false); }
  };
  return <PublicLayout><main className="form-page"><div className="container form-page-grid"><div className="form-aside form-aside-orange"><span className="aside-kicker">AGN 2027 / PARTICIPANT</span><div className="aside-shape"><span>01</span><span>AGN</span><span>2027</span></div><div className="aside-bottom"><span>FROM BLOCK TO BREAKTHROUGH</span><p>Your next step can begin with one decision.</p><div className="aside-meta"><CalendarDays size={15} /> {EVENT_DATE}</div></div></div><div className="form-main"><PageIntro eyebrow="YOUR PLACE IN THE ROOM" title={<>Take your seat.<br /><span>Start here.</span></>} subtitle="Tell us a little about yourself to register your interest in the AGN 2027 Lagos Activation Global Conference."/><NoticeBox notice={notice} /><form onSubmit={submit} className="application-form"><div className="form-section-label"><span>01</span><div><strong>About you</strong><small>How should we reach you?</small></div></div><div className="form-fields two-col"><FormField label="First name" name="firstName" value={form.firstName} onChange={(v) => update('firstName', v)} required placeholder="Your first name"/><FormField label="Last name" name="lastName" value={form.lastName} onChange={(v) => update('lastName', v)} required placeholder="Your last name"/><FormField label="Email address" name="email" value={form.email} onChange={(v) => update('email', v)} required type="email" placeholder="you@example.com"/><FormField label="Phone number" name="phone" value={form.phone} onChange={(v) => update('phone', v)} required type="tel" placeholder="e.g. 080..."/><FormField label="School, organisation or business" name="affiliation" value={form.affiliation} onChange={(v) => update('affiliation', v)} placeholder="Where you study or work"/><FormField label="What best describes you?" name="occupation" value={form.occupation} onChange={(v) => update('occupation', v)} options={['Student', 'Young professional', 'Entrepreneur / business owner', 'Founder', 'Job seeker', 'Community leader', 'Other']}/></div><div className="form-section-label form-section-spaced"><span>02</span><div><strong>Your interests</strong><small>Help us understand what brings you here.</small></div></div><div className="form-fields two-col"><FormField label="What are you most interested in?" name="interest" value={form.interest} onChange={(v) => update('interest', v)} options={['Personal growth and mindset', 'Leadership', 'Business and entrepreneurship', 'Networking and collaboration', 'Career development', 'All of the above']} full/><FormField label="How did you hear about AGN?" name="source" value={form.source} onChange={(v) => update('source', v)} options={['WhatsApp', 'Instagram / social media', 'Friend or colleague', 'School or organisation', 'Email', 'Other']} full/></div><Consent checked={consent} setChecked={setConsent} text={<>I have read the <Link className="inline-policy-link" to="/privacy">privacy notice</Link> and agree that AGN may use these details to process my event registration.</>}/><button disabled={busy} className="button button-dark button-submit" type="submit">{busy ? 'Submitting registration…' : 'Submit registration'} <ArrowUpRight size={18}/></button><p className="form-smallprint">Keep your registration reference for your records. AGN will use your details to coordinate conference-related information in line with its approved privacy notice.</p></form></div></div></main></PublicLayout>;
}
