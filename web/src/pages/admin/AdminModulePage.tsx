import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Search } from 'lucide-react';
import { api, getApiError } from '../../lib/api';
import AdminLayout from '../../layouts/AdminLayout';
import NoticeBox, { type Notice } from '../../components/NoticeBox';

type AdminModule = 'registrations' | 'sponsorship' | 'volunteers';
type AdminModulePageProps = { title: string; description: string; module: AdminModule };

export default function AdminModulePage({ title, description, module }: AdminModulePageProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [statusDrafts, setStatusDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<Notice | null>(null);
  const auth = useQuery({ queryKey:['auth','me'], queryFn:async()=> (await api.get('/auth/me')).data, retry:false });
  const records = useQuery<{items: Record<string,unknown>[]; total: number}>({ queryKey:['admin',module,debouncedSearchTerm,page], queryFn:async()=> (await api.get(`/admin/${module}`,{params:{search:debouncedSearchTerm,limit:25,page}})).data, enabled:auth.isSuccess, retry:false });
  useEffect(()=>{if(auth.isError)navigate('/admin/login',{replace:true});},[auth.isError,navigate]);
  useEffect(()=>{const timer=window.setTimeout(()=>{setPage(1);setDebouncedSearchTerm(searchTerm.trim());},250);return()=>window.clearTimeout(timer);},[searchTerm]);
  const pageCount=Math.max(1,Math.ceil((records.data?.total??0)/25));
  const rows = records.data?.items ?? [];
  const statusOptions = module === 'registrations'
    ? ['PENDING','CONFIRMED','CANCELLED','CHECKED_IN']
    : module === 'volunteers'
      ? ['PENDING','UNDER_REVIEW','SHORTLISTED','ACCEPTED','WAITLISTED','REJECTED']
      : ['NEW','CONTACTED','IN_DISCUSSION','PROPOSAL_SENT','CONFIRMED','DECLINED','ON_HOLD'];
  const columns = module === 'registrations'
    ? ['reference','firstName','lastName','email','phone','status','createdAt']
    : module === 'volunteers'
      ? ['reference','fullName','email','phone','department','status','createdAt']
      : ['reference','name','organisation','email','supportType','supportLevel','status','createdAt'];
  const saveStatus = async (row: Record<string,unknown>) => {
    const id = String(row.id ?? '');
    const status = statusDrafts[id];
    if (!id || !status || status === String(row.status)) return;
    setSavingId(id); setActionNotice(null);
    try {
      await api.patch(`/admin/${module}/${id}/status`, { status });
      setActionNotice({ kind:'success', text:`Record ${String(row.reference ?? '')} updated to ${status.replaceAll('_',' ').toLowerCase()}.` });
      setStatusDrafts((current)=>{ const next={...current}; delete next[id]; return next; });
      await records.refetch();
    } catch (error) {
      setActionNotice({ kind:'error', text:getApiError(error,'The status could not be updated. Please try again.') });
    } finally { setSavingId(null); }
  };
  if (auth.isLoading) return <div className="admin-loading"><span className="loading-spinner"/><p>Verifying your session…</p></div>;
  if (auth.isError) return null;
  return <AdminLayout><div className="dashboard-heading module-page-heading"><div><div className="eyebrow"><span className="eyebrow-line"/> AGN WORKSTREAM</div><h1>{title}</h1><p>{description}</p></div><button className="button button-dark button-small" onClick={()=>void records.refetch()}>Refresh <ArrowRight size={16}/></button></div>{records.error&&<NoticeBox notice={{kind:'info',text:`Live records are not available yet. ${getApiError(records.error,'Connect the API to load records.')}`}}/>}<NoticeBox notice={actionNotice}/><section className="dashboard-panel records-panel"><div className="records-toolbar"><div className="search-field"><Search size={17}/><input aria-label={`Search ${title.toLowerCase()}`} value={searchTerm} onChange={(event)=>setSearchTerm(event.target.value)} placeholder="Search by name, email or reference…"/></div><div className="record-count">{records.data?`${records.data.total} record${records.data.total===1?'':'s'}`:'Waiting for API'}</div></div>{records.isLoading?<div className="admin-loading"><span className="loading-spinner"/><p>Loading records…</p></div>:rows.length? <div className="records-table-wrap"><table className="records-table"><thead><tr>{columns.map(key=><th key={key}>{key==='createdAt'?'Submitted':key==='supportLevel'?'Support level':key.replace(/([A-Z])/g,' $1')}</th>)}<th>Update status</th></tr></thead><tbody>{rows.map((row,index)=>{const id=String(row.id??index); const current=String(row.status??''); const draft=statusDrafts[id]??current; return <tr key={id}>{columns.map((key)=>{const value=row[key]; return <td key={key}>{key==='status'?<span className={`status-pill status-${String(value).toLowerCase().replaceAll('_','-')}`}>{String(value).replaceAll('_',' ').toLowerCase()}</span>:key==='createdAt'&&value?new Date(String(value)).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'}):value==null||value===''?'—':String(value)}</td>})}<td><div className="status-editor"><select aria-label={`Status for ${String(row.reference??id)}`} value={draft} onChange={(event)=>setStatusDrafts((currentDrafts)=>({...currentDrafts,[id]:event.target.value}))}>{statusOptions.map(option=><option key={option} value={option}>{option.replaceAll('_',' ')}</option>)}</select><button disabled={savingId===id||draft===current} onClick={()=>void saveStatus(row)}>{savingId===id?'Saving…':'Save'}</button></div></td></tr>})}</tbody></table></div>:<div className="empty-state"><div><Search size={22}/></div><strong>{searchTerm?'No matching records':'No records available'}</strong><p>{searchTerm?'Try another name, email address or reference.':'Submitted records will appear here when the API is configured and event submissions begin.'}</p></div>}{records.data&&records.data.total>0&&<div className="records-pagination"><span>Showing {(page-1)*25+1}–{Math.min(page*25,records.data.total)} of {records.data.total.toLocaleString()}</span><div><button type="button" disabled={page<=1||records.isFetching} onClick={()=>setPage(current=>Math.max(1,current-1))}>Previous</button><span>Page {page} of {pageCount}</span><button type="button" disabled={page>=pageCount||records.isFetching} onClick={()=>setPage(current=>Math.min(pageCount,current+1))}>Next</button></div></div>}</section></AdminLayout>;
}
