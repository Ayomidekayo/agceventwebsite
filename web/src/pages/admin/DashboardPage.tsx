import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ArrowUpRight, BarChart3, CalendarDays, CircleHelp, Clock3, ExternalLink, Handshake, HeartHandshake, Search, ShieldCheck, Sparkles, UserRoundCheck, Users, Zap } from 'lucide-react';
import { api, getApiError } from '../../lib/api';
import AdminLayout from '../../layouts/AdminLayout';
import NoticeBox from '../../components/NoticeBox';

type DashboardSummary = { registrations: { total: number; recent: number }; volunteers: { total: number; pending: number; accepted: number }; sponsorship: { enquiries: number; confirmed: number; receivedAmount: number | null }; recentActivity?: { id: string; label: string; type: string; createdAt: string; status: string }[]; };

function formatNaira(value: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const auth = useQuery({ queryKey: ['auth', 'me'], queryFn: async () => (await api.get('/auth/me')).data, retry: false });
  const summary = useQuery<DashboardSummary>({ queryKey: ['admin', 'summary'], queryFn: async () => (await api.get('/admin/dashboard/summary')).data, enabled: auth.isSuccess, refetchInterval: 60_000 });
  useEffect(() => { if (auth.isError) navigate('/admin/login', { replace: true }); }, [auth.isError, navigate]);
  const errorText = summary.error ? getApiError(summary.error, 'Dashboard data is unavailable.') : null;
  if (auth.isLoading) return <div className="admin-loading"><span className="loading-spinner"/><p>Verifying your session…</p></div>;
  if (auth.isError) return null;
  const data = summary.data;
  const statCards = [
    { label: 'Total registrations', value: data ? data.registrations.total.toLocaleString() : '—', change: data ? `+${data.registrations.recent} recent` : 'Live data pending', icon: Users, style: 'stat-orange' },
    { label: 'Volunteer applications', value: data ? data.volunteers.total.toLocaleString() : '—', change: data ? `${data.volunteers.pending} awaiting review` : 'Live data pending', icon: HeartHandshake, style: 'stat-violet' },
    { label: 'Sponsorship enquiries', value: data ? data.sponsorship.enquiries.toLocaleString() : '—', change: data ? `${data.sponsorship.confirmed} confirmed` : 'Live data pending', icon: Handshake, style: 'stat-blue' },
    { label: 'Funds received', value: data ? data.sponsorship.receivedAmount === null ? 'Restricted' : formatNaira(data.sponsorship.receivedAmount) : '—', change: data?.sponsorship.receivedAmount === null ? 'Finance role required' : 'Verified receipts only', icon: BarChart3, style: 'stat-green' },
  ];
  return <AdminLayout><div className="dashboard-heading"><div><div className="eyebrow"><span className="eyebrow-line"/> YOUR EVENT AT A GLANCE</div><h1>Good to have you<br/><span>back on board.</span></h1><p>Here's what is happening across your AGN conference workspace.</p></div><div className="dashboard-heading-actions"><span className="today-chip"><CalendarDays size={15}/>{new Date().toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'})}</span><button className="button button-dark button-small" onClick={()=>{void summary.refetch();}}>Refresh data <ArrowRight size={16}/></button></div></div>
    {errorText&&<NoticeBox notice={{kind:'info',text:`The dashboard layout is ready, but the API has not supplied live statistics. ${errorText}`}}/>}
    <div className="dashboard-welcome"><div><span className="welcome-kicker"><Sparkles size={14}/> ACTIVE PROJECT</span><h2>AGN 2027 — From Block to Breakthrough</h2><p>Saturday, 27 February 2027 <span/> Lagos, Nigeria</p></div><div className="welcome-progress"><span>EVENT STATUS</span><strong>Planning</strong><small><i/> Updates from connected modules appear here.</small></div></div>
    <div className="dashboard-section-head"><div><h2>Core metrics</h2><p>Numbers from your event records, updated through the API.</p></div><span className="live-status"><i/> API-linked metrics</span></div>
    <div className="stats-grid">{statCards.map((card)=><article className="stat-card" key={card.label}><div className={`stat-icon ${card.style}`}><card.icon size={20}/></div><span className="stat-label">{card.label}</span><strong className="stat-value">{summary.isLoading?'…':card.value}</strong><span className="stat-change">{card.change}</span></article>)}</div>
    <div className="dashboard-lower-grid"><section className="dashboard-panel activity-panel"><div className="panel-heading"><div><h2>Latest activity</h2><p>Recent submissions and changes</p></div><span className="panel-heading-icon"><Clock3 size={17}/></span></div>{data?.recentActivity?.length ? <div className="activity-list">{data.recentActivity.map(item=><div className="activity-row" key={item.id}><span className={`activity-avatar activity-${item.type.toLowerCase()}`}>{item.type.slice(0,1)}</span><div className="activity-copy"><strong>{item.label}</strong><span>{new Date(item.createdAt).toLocaleString('en-NG')}</span></div><span className={`status-pill status-${item.status.toLowerCase().replaceAll('_','-')}`}>{item.status.replaceAll('_',' ').toLowerCase()}</span></div>)}</div>:<div className="empty-state"><div><Search size={22}/></div><strong>{summary.isLoading?'Loading activity':'No activity to show yet'}</strong><p>New registrations, volunteer applications and sponsorship enquiries will appear here once the API is connected.</p></div>}</section><section className="dashboard-panel quick-actions-panel"><div className="panel-heading"><div><h2>Quick actions</h2><p>Go straight to a workstream</p></div><span className="panel-heading-icon"><Zap size={17}/></span></div><div className="quick-action-list"><Link to="/admin/registrations"><span className="quick-icon quick-orange"><Users size={18}/></span><span><strong>Review registrations</strong><small>View and search attendees</small></span><ArrowUpRight size={17}/></Link><Link to="/admin/sponsorship"><span className="quick-icon quick-blue"><Handshake size={18}/></span><span><strong>Review sponsorship</strong><small>Track partnership enquiries</small></span><ArrowUpRight size={17}/></Link><Link to="/admin/volunteers"><span className="quick-icon quick-violet"><UserRoundCheck size={18}/></span><span><strong>Review volunteers</strong><small>Screen and assign applicants</small></span><ArrowUpRight size={17}/></Link></div><div className="panel-footnote"><ShieldCheck size={15}/><span>Personal records are available only to users granted the corresponding permissions.</span></div></section></div>
    <div className="dashboard-bottom-note"><div><span className="note-icon"><CircleHelp size={18}/></span><div><strong>Building the right operating picture</strong><p>Metrics should distinguish registrations from attendance, sponsorship enquiries from commitments, and pledges from verified receipts.</p></div></div><Link to="/" target="_blank">View public website <ExternalLink size={15}/></Link></div>
  </AdminLayout>;
}
