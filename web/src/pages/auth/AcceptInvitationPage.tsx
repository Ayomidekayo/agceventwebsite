import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, UserRoundCheck } from 'lucide-react';
import { api, getApiError } from '../../lib/api';
import Brand from '../../components/Brand';
import FormField from '../../components/forms/FormField';
import NoticeBox, { type Notice } from '../../components/NoticeBox';

export default function AcceptInvitationPage() {
  const navigate = useNavigate();
  // Invitation tokens are carried in the URL fragment so browsers do not send them to the web server in HTTP requests.
  const [token] = useState(() => new URLSearchParams(window.location.hash.replace(/^#/, '')).get('token') ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setNotice(null);
    if (password !== confirmPassword) { setNotice({kind:'error',text:'The passwords do not match.'}); setBusy(false); return; }
    try { await api.post('/auth/accept-invitation',{token,password,confirmPassword}); navigate('/admin',{replace:true}); }
    catch (error) { setNotice({kind:'error',text:getApiError(error,'This invitation could not be accepted. Ask an administrator for a new link.')}); }
    finally { setBusy(false); }
  };
  return <div className="admin-login-page"><div className="login-visual"><Link to="/" className="login-brand"><Brand inverse/></Link><div className="login-visual-content"><span className="eyebrow eyebrow-light"><span className="eyebrow-line"/> AGN 2027 / TEAM ACCESS</span><h1>Make the work<br/>happen. <span>Together.</span></h1><p>Set up your individual team account to access the parts of the AGN workspace assigned to your role.</p><div className="login-stamp">AGN<br/><small>TEAM</small></div></div><span className="login-visual-foot">FROM BLOCK TO BREAKTHROUGH · LAGOS</span></div><div className="login-form-side"><Link to="/" className="login-back">← Back to public website</Link><div className="login-box"><div className="login-icon"><UserRoundCheck size={24}/></div><span className="eyebrow">INVITATION ACCEPTANCE</span><h2>Set your password.</h2><p>Use a strong password you do not use on another website. Your invitation is single-use and expires after 48 hours.</p>{!token&&<NoticeBox notice={{kind:'error',text:'This invitation link is missing its token. Ask the Super Admin for a new invitation.'}}/>}<NoticeBox notice={notice}/><form onSubmit={submit} className="application-form login-form"><FormField label="Password (minimum 12 characters)" name="password" value={password} onChange={setPassword} required type="password" placeholder="Create a strong password"/><FormField label="Confirm password" name="confirmPassword" value={confirmPassword} onChange={setConfirmPassword} required type="password" placeholder="Enter the password again"/><button disabled={busy||!token} type="submit" className="button button-dark button-submit">{busy?'Activating account…':'Activate team account'} <ArrowRight size={18}/></button></form><div className="login-security"><ShieldCheck size={16}/><span>Each team member has an individual account. Access is limited by role and can be revoked by the Super Admin.</span></div></div><span className="login-copyright">© {new Date().getFullYear()} Activation Global Network</span></div></div>;
}
