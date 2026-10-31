import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { api, getApiError } from '../../lib/api';
import Brand from '../../components/Brand';
import FormField from '../../components/forms/FormField';
import NoticeBox, { type Notice } from '../../components/NoticeBox';

export default function AdminLoginPage() {
  const navigate = useNavigate(); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState<Notice | null>(null);
  const submit = async (event: FormEvent) => { event.preventDefault(); setBusy(true); setNotice(null); try { await api.post('/auth/login', { email, password }); navigate('/admin', { replace: true }); } catch (error) { setNotice({ kind: 'error', text: getApiError(error, 'Unable to sign in. Check your credentials or contact the system administrator.') }); } finally { setBusy(false); } };
  return <div className="admin-login-page"><div className="login-visual"><Link to="/" className="login-brand"><Brand inverse/></Link><div className="login-visual-content"><span className="eyebrow eyebrow-light"><span className="eyebrow-line"/> AGN 2027 / TEAM PORTAL</span><h1>Behind every<br/>breakthrough is<br/><span>a team.</span></h1><p>One secure workspace for the people making the AGN experience happen.</p><div className="login-stamp">AGN<br/><small>OPERATIONS</small></div></div><span className="login-visual-foot">FROM BLOCK TO BREAKTHROUGH · LAGOS</span></div><div className="login-form-side"><Link to="/" className="login-back">← Back to public website</Link><div className="login-box"><div className="login-icon"><ShieldCheck size={24}/></div><span className="eyebrow">AUTHORISED PERSONNEL</span><h2>Welcome back.</h2><p>Sign in with your AGN team account to access the event dashboard.</p><NoticeBox notice={notice}/><form onSubmit={submit} className="application-form login-form"><FormField label="Work email" name="email" value={email} onChange={setEmail} required type="email" placeholder="you@agn.org"/><FormField label="Password" name="password" value={password} onChange={setPassword} required type="password" placeholder="Enter your password"/><button disabled={busy} type="submit" className="button button-dark button-submit">{busy?'Signing in…':'Sign in securely'} <ArrowRight size={18}/></button></form><div className="login-security"><ShieldCheck size={16}/><span>Access is restricted to authorised AGN team members. Permissions are enforced by the backend.</span></div></div><span className="login-copyright">© {new Date().getFullYear()} Activation Global Network</span></div></div>;
}
