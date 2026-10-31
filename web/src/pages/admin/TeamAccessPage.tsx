import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock3,
  Copy,
  MailPlus,
  RefreshCw,
  ShieldCheck,
  Users,
  UserX,
} from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import NoticeBox, { type Notice } from '../../components/NoticeBox';
import { api, getApiError } from '../../lib/api';
import './TeamAccessPage.css';

type TeamUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

type TeamInvitation = {
  id: string;
  name: string;
  email: string;
  role: string;
  expiresAt: string;
  createdAt: string;
};

type TeamUsersResponse = { users: TeamUser[]; invitations: TeamInvitation[] };

const TEAM_ROLES = [
  'EVENT_ADMIN',
  'REGISTRATION_MANAGER',
  'SPONSORSHIP_MANAGER',
  'VOLUNTEER_MANAGER',
  'CONTENT_MANAGER',
  'CHECK_IN_OFFICER',
  'REPORT_VIEWER',
  'SUPER_ADMIN',
] as const;

function formatDate(value: string | null): string {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function roleLabel(role: string): string {
  return role.toLowerCase().replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function initials(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '').join('') || 'AG';
}

function TeamField({
  label,
  value,
  onChange,
  name,
  type = 'text',
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="team-field" htmlFor={`team-${name}`}>
      <span>{label}{required && <b aria-hidden="true"> *</b>}</span>
      <input
        id={`team-${name}`}
        name={name}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete={type === 'email' ? 'email' : name === 'name' ? 'name' : 'off'}
      />
    </label>
  );
}

function TeamRoleSelect({
  value,
  onChange,
  disabled = false,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id: string;
}) {
  return (
    <select
      id={id}
      className="team-role-select"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Team member access role"
    >
      {TEAM_ROLES.map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}
    </select>
  );
}

export default function TeamAccessPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('REGISTRATION_MANAGER');
  const [busy, setBusy] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const auth = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => (await api.get('/auth/me')).data,
    retry: false,
  });

  const usersQuery = useQuery<TeamUsersResponse>({
    queryKey: ['admin', 'users'],
    queryFn: async () => (await api.get('/admin/users')).data,
    enabled: auth.isSuccess && auth.data?.role === 'SUPER_ADMIN',
    retry: false,
  });

  useEffect(() => {
    if (auth.isError) navigate('/admin/login', { replace: true });
  }, [auth.isError, navigate]);

  const users = usersQuery.data?.users ?? [];
  const invitations = usersQuery.data?.invitations ?? [];
  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter((user) => user.isActive).length,
    inactive: users.filter((user) => !user.isActive).length,
    pending: invitations.length,
  }), [users, invitations]);

  const submitInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setNotice(null);
    setInviteUrl('');
    setCopied(false);

    try {
      const response = await api.post('/admin/users/invitations', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
      });
      setInviteUrl(String(response.data.inviteUrl ?? ''));
      setNotice({
        kind: 'success',
        text: `Invitation created for ${email.trim()}. Copy and share the link privately.`,
      });
      setName('');
      setEmail('');
      await usersQuery.refetch();
    } catch (error) {
      setNotice({ kind: 'error', text: getApiError(error, 'The invitation could not be created.') });
    } finally {
      setBusy(false);
    }
  };

  const updateActive = async (user: TeamUser) => {
    setWorkingId(user.id);
    setNotice(null);
    try {
      await api.patch(`/admin/users/${user.id}/active`, { isActive: !user.isActive });
      setNotice({
        kind: 'success',
        text: `${user.name}'s account has been ${user.isActive ? 'deactivated' : 'activated'}.`,
      });
      await usersQuery.refetch();
    } catch (error) {
      setNotice({ kind: 'error', text: getApiError(error, 'The account status could not be changed.') });
    } finally {
      setWorkingId(null);
    }
  };

  const updateRole = async (user: TeamUser, nextRole: string) => {
    if (user.role === nextRole) return;
    setWorkingId(user.id);
    setNotice(null);
    try {
      await api.patch(`/admin/users/${user.id}/role`, { role: nextRole });
      setNotice({ kind: 'success', text: `${user.name}'s role has been updated.` });
      await usersQuery.refetch();
    } catch (error) {
      setNotice({ kind: 'error', text: getApiError(error, 'The account role could not be changed.') });
    } finally {
      setWorkingId(null);
    }
  };

  const copyInvite = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
    } catch {
      setNotice({
        kind: 'info',
        text: 'Clipboard access was blocked. Select the invitation link and copy it manually.',
      });
    }
  };

  if (auth.isLoading) {
    return <AdminLayout><div className="admin-loading"><span className="loading-spinner" /><p>Verifying your session…</p></div></AdminLayout>;
  }
  if (auth.isError) return null;

  if (auth.data?.role !== 'SUPER_ADMIN') {
    return (
      <AdminLayout>
        <div className="team-page">
          <NoticeBox notice={{ kind: 'error', text: 'Only a Super Admin can manage team access.' }} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <main className="team-page">
        <header className="team-page-heading team-enter">
          <div className="team-page-heading-copy">
            <span className="team-eyebrow"><span /> ADMINISTRATION / ACCESS CONTROL</span>
            <h1>Team <em>access.</em></h1>
            <p>Invite the people behind AGN and give each person only the permissions needed for their responsibilities.</p>
          </div>
          <button
            className="team-refresh-button"
            type="button"
            onClick={() => void usersQuery.refetch()}
            disabled={usersQuery.isFetching}
          >
            <RefreshCw size={16} className={usersQuery.isFetching ? 'team-spin' : ''} />
            {usersQuery.isFetching ? 'Refreshing' : 'Refresh'}
          </button>
        </header>

        <NoticeBox notice={notice} />

        <section className="team-stats-grid" aria-label="Team access summary">
          <article className="team-stat-card team-enter" style={{ animationDelay: '60ms' }}>
            <span className="team-stat-icon"><Users size={19} /></span>
            <span className="team-stat-label">Team accounts</span>
            <strong>{usersQuery.isLoading ? '—' : stats.total}</strong>
            <small>All registered staff accounts</small>
          </article>
          <article className="team-stat-card team-enter" style={{ animationDelay: '120ms' }}>
            <span className="team-stat-icon team-stat-icon-green"><ShieldCheck size={19} /></span>
            <span className="team-stat-label">Active accounts</span>
            <strong>{usersQuery.isLoading ? '—' : stats.active}</strong>
            <small>Currently able to sign in</small>
          </article>
          <article className="team-stat-card team-enter" style={{ animationDelay: '180ms' }}>
            <span className="team-stat-icon team-stat-icon-muted"><UserX size={19} /></span>
            <span className="team-stat-label">Inactive accounts</span>
            <strong>{usersQuery.isLoading ? '—' : stats.inactive}</strong>
            <small>Access currently disabled</small>
          </article>
          <article className="team-stat-card team-enter" style={{ animationDelay: '240ms' }}>
            <span className="team-stat-icon team-stat-icon-gold"><MailPlus size={19} /></span>
            <span className="team-stat-label">Pending invitations</span>
            <strong>{usersQuery.isLoading ? '—' : stats.pending}</strong>
            <small>Awaiting account activation</small>
          </article>
        </section>

        {usersQuery.isError && (
          <NoticeBox notice={{ kind: 'error', text: getApiError(usersQuery.error, 'Team accounts could not be loaded.') }} />
        )}

        <div className="team-main-grid">
          <section className="team-panel team-invite-panel team-enter" aria-labelledby="team-invite-title">
            <div className="team-panel-heading">
              <div className="team-panel-heading-icon"><MailPlus size={19} /></div>
              <div>
                <span className="team-panel-kicker">ADD TO THE WORKSPACE</span>
                <h2 id="team-invite-title">Invite a team member</h2>
                <p>Create an individual, single-use account setup link.</p>
              </div>
            </div>

            <form onSubmit={submitInvite} className="team-invite-form">
              <TeamField label="Full name" name="name" value={name} onChange={setName} required placeholder="Team member's name" />
              <TeamField label="Work email" name="email" type="email" value={email} onChange={setEmail} required placeholder="person@organisation.com" />
              <label className="team-field" htmlFor="team-role-new">
                <span>Access role <b aria-hidden="true">*</b></span>
                <TeamRoleSelect id="team-role-new" value={role} onChange={setRole} />
              </label>

              <div className="team-permission-note">
                <ShieldCheck size={17} />
                <p><strong>Give the minimum access needed.</strong> Department managers should only receive permissions required for their work. Reserve Super Admin for trusted platform owners.</p>
              </div>

              <button className="team-primary-button" type="submit" disabled={busy}>
                {busy ? 'Creating invitation…' : 'Create secure invitation'}
                <ArrowUpRight size={17} />
              </button>

              {inviteUrl && (
                <div className="team-invite-link" aria-live="polite">
                  <div><span>ONE-TIME INVITATION LINK</span><small>Share this privately with the invited person.</small></div>
                  <input readOnly value={inviteUrl} aria-label="Invitation link" onFocus={(event) => event.currentTarget.select()} />
                  <button type="button" onClick={() => void copyInvite()}>
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copied' : 'Copy link'}
                  </button>
                </div>
              )}
            </form>
          </section>

          <aside className="team-panel team-guidance-panel team-enter" style={{ animationDelay: '100ms' }}>
            <div className="team-panel-heading">
              <div className="team-panel-heading-icon team-panel-heading-icon-dark"><ShieldCheck size={19} /></div>
              <div>
                <span className="team-panel-kicker">KEEP ACCESS CONTROLLED</span>
                <h2>Access principles</h2>
                <p>A few rules that protect the AGN workspace.</p>
              </div>
            </div>
            <div className="team-guidance-list">
              <article><span>01</span><div><strong>One person, one account</strong><p>Individual sign-ins make it possible to audit important actions.</p></div></article>
              <article><span>02</span><div><strong>Least privilege</strong><p>Give people access only to the records and tools needed for their role.</p></div></article>
              <article><span>03</span><div><strong>Invite privately</strong><p>Invitation links are single-use and expire after 48 hours. Never post them publicly.</p></div></article>
              <article><span>04</span><div><strong>Review access regularly</strong><p>Deactivate accounts promptly when a team member no longer needs access.</p></div></article>
            </div>
          </aside>
        </div>

        <section className="team-panel team-accounts-panel team-enter" aria-labelledby="team-accounts-title">
          <div className="team-accounts-heading">
            <div>
              <span className="team-panel-kicker">PEOPLE WITH WORKSPACE ACCESS</span>
              <h2 id="team-accounts-title">Team accounts</h2>
              <p>Review account status and update access roles.</p>
            </div>
            <span className="team-count-pill">{usersQuery.isLoading ? 'Loading…' : `${stats.total} ${stats.total === 1 ? 'account' : 'accounts'}`}</span>
          </div>

          {usersQuery.isLoading ? (
            <div className="team-loading"><span className="loading-spinner" /><p>Loading team accounts…</p></div>
          ) : users.length ? (
            <div className="team-account-list">
              {users.map((user, index) => (
                <article className="team-account-card" key={user.id} style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}>
                  <span className="team-user-avatar">{initials(user.name)}</span>
                  <div className="team-user-identity">
                    <strong>{user.name}</strong>
                    <a href={`mailto:${user.email}`}>{user.email}</a>
                  </div>
                  <div className="team-account-role">
                    <label htmlFor={`team-role-${user.id}`}>ACCESS ROLE</label>
                    <TeamRoleSelect
                      id={`team-role-${user.id}`}
                      value={user.role}
                      disabled={workingId === user.id}
                      onChange={(nextRole) => void updateRole(user, nextRole)}
                    />
                  </div>
                  <span className={`team-status ${user.isActive ? 'is-active' : 'is-inactive'}`}>
                    <i />{user.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <div className="team-last-login"><span>LAST LOGIN</span><strong>{formatDate(user.lastLoginAt)}</strong></div>
                  <button
                    className={`team-account-action ${user.isActive ? 'is-deactivate' : 'is-activate'}`}
                    type="button"
                    disabled={workingId === user.id}
                    onClick={() => void updateActive(user)}
                  >
                    {workingId === user.id ? 'Saving…' : user.isActive ? 'Deactivate' : 'Activate'}
                    <ArrowRight size={15} />
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="team-empty-state"><Users size={24} /><strong>No team accounts found</strong><p>Invited team members will appear here after they activate their accounts.</p></div>
          )}
        </section>

        <section className="team-panel team-invitations-panel team-enter" aria-labelledby="pending-invitations-title">
          <div className="team-accounts-heading">
            <div>
              <span className="team-panel-kicker">ACCOUNT SETUP</span>
              <h2 id="pending-invitations-title">Pending invitations</h2>
              <p>Invitations that have not yet been accepted.</p>
            </div>
            <span className="team-count-pill">{invitations.length} pending</span>
          </div>
          {invitations.length ? (
            <div className="team-invitation-list">
              {invitations.map((invitation) => (
                <article className="team-invitation-row" key={invitation.id}>
                  <span className="team-invitation-icon"><Clock3 size={17} /></span>
                  <div className="team-invitation-identity"><strong>{invitation.name}</strong><a href={`mailto:${invitation.email}`}>{invitation.email}</a></div>
                  <span className="team-invitation-role">{roleLabel(invitation.role)}</span>
                  <time dateTime={invitation.expiresAt}>Expires {formatDate(invitation.expiresAt)}</time>
                </article>
              ))}
            </div>
          ) : (
            <p className="team-no-invitations">There are no pending invitations at the moment.</p>
          )}
        </section>

        <p className="team-security-footnote"><ShieldCheck size={15} /> Changes to roles and account status are enforced by the API and should be recorded in the administrative audit log.</p>
      </main>
    </AdminLayout>
  );
}
