import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  Clock3,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
  Landmark,
  Mail,
  Phone,
  CalendarDays,
  Hash,
  LoaderCircle,
} from 'lucide-react';

import AdminLayout from '../../layouts/AdminLayout';
import { api, getApiError } from '../../lib/api';
import NoticeBox, { type Notice } from '../../components/NoticeBox';

type TransferStatus = 'PENDING' | 'SUCCESSFUL' | 'FAILED';

type Transfer = {
  id: string;
  reference: string;
  amount: string | number;
  currency: string;
  status: TransferStatus;
  purpose: string;
  payerName: string;
  payerEmail: string;
  payerPhone?: string | null;
  enquiryId?: string | null;
  commitmentId?: string | null;
  metadata?: {
    transferSenderName?: string;
    transferReference?: string;
    transferDate?: string;
    rejectionReason?: string;
  } | null;
  createdAt: string;
  paidAt?: string | null;
};

type TransferResponse = {
  items: Transfer[];
  total: number;
  page: number;
  limit: number;
  pageCount: number;
};

const formatAmount = (amount: string | number, currency: string) => {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) return `${currency} ${amount}`;

  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency || 'NGN',
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch {
    return `${currency || 'NGN'} ${numericAmount.toLocaleString('en-NG')}`;
  }
};

const formatDate = (date?: string | null) => {
  if (!date) return '—';

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '—';

  return parsed.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const statusLabel = (status: TransferStatus) => {
  if (status === 'SUCCESSFUL') return 'Verified';
  if (status === 'FAILED') return 'Rejected';
  return 'Pending verification';
};

const statusClass = (status: TransferStatus) => {
  if (status === 'SUCCESSFUL') return 'status-confirmed';
  if (status === 'FAILED') return 'status-rejected';
  return 'status-pending';
};

export default function AdminSponsorshipPaymentsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | TransferStatus>('');
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const transfers = useQuery<TransferResponse>({
    queryKey: ['admin', 'bank-transfers', search, status, page],
    queryFn: async () => {
      const response = await api.get('/admin/payments/transfers', {
        params: {
          search: search.trim() || undefined,
          status: status || undefined,
          page,
          limit: 25,
        },
      });

      const result = response.data?.data ?? response.data;

      return {
        items: Array.isArray(result?.items) ? result.items : [],
        total: Number(result?.total ?? 0),
        page: Number(result?.page ?? page),
        limit: Number(result?.limit ?? 25),
        pageCount: Math.max(1, Number(result?.pageCount ?? 1)),
      };
    },
    retry: false,
    placeholderData: (previousData) => previousData,
  });

  const rows = transfers.data?.items ?? [];
  const pageCount = Math.max(1, transfers.data?.pageCount ?? 1);

  const updateTransfer = async (
    transfer: Transfer,
    action: 'verify' | 'reject',
  ) => {
    if (savingId) return;

    if (action === 'verify') {
      const confirmed = window.confirm(
        `Have you independently checked the AGN bank account and confirmed receipt of ${formatAmount(
          transfer.amount,
          transfer.currency,
        )}? Only verify after the funds are visible in the authorised AGN account.`,
      );

      if (!confirmed) return;
    }

    let reason = '';

    if (action === 'reject') {
      reason =
        window.prompt('Enter the reason for rejecting this transfer:')?.trim() ??
        '';

      if (!reason) {
        setNotice({
          kind: 'error',
          text: 'A rejection reason is required.',
        });
        return;
      }
    }

    setSavingId(transfer.id);
    setNotice(null);

    try {
      if (action === 'verify') {
        await api.patch(
          `/admin/payments/transfers/${encodeURIComponent(transfer.id)}/verify`,
        );

        setNotice({
          kind: 'success',
          text: `Transfer ${transfer.reference} has been verified.`,
        });
      } else {
        await api.patch(
          `/admin/payments/transfers/${encodeURIComponent(transfer.id)}/reject`,
          { reason },
        );

        setNotice({
          kind: 'success',
          text: `Transfer ${transfer.reference} has been rejected.`,
        });
      }

      await transfers.refetch();
    } catch (error) {
      setNotice({
        kind: 'error',
        text: getApiError(
          error,
          'The payment could not be updated. Please try again.',
        ),
      });
    } finally {
      setSavingId(null);
    }
  };

  const pendingCount = rows.filter((item) => item.status === 'PENDING').length;
  const verifiedCount = rows.filter(
    (item) => item.status === 'SUCCESSFUL',
  ).length;
  const rejectedCount = rows.filter((item) => item.status === 'FAILED').length;

  const renderActions = (transfer: Transfer) => {
    const busy = savingId === transfer.id;

    if (transfer.status !== 'PENDING') {
      return (
        <span className="text-xs font-medium text-slate-400">
          No action required
        </span>
      );
    }

    return (
      <div className="flex min-w-36 flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={Boolean(savingId)}
          onClick={() => void updateTransfer(transfer, 'verify')}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? (
            <LoaderCircle size={14} className="animate-spin" />
          ) : (
            <CheckCircle2 size={14} />
          )}
          {busy ? 'Processing…' : 'Verify'}
        </button>

        <button
          type="button"
          disabled={Boolean(savingId)}
          onClick={() => void updateTransfer(transfer, 'reject')}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <XCircle size={14} />
          Reject
        </button>
      </div>
    );
  };

  const renderStatus = (transfer: Transfer) => (
    <span className={`status-pill ${statusClass(transfer.status)}`}>
      {statusLabel(transfer.status)}
    </span>
  );

  return (
    <AdminLayout>
      <div className="dashboard-heading module-page-heading">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" />
            AGN FINANCE
          </div>
          <h1>Sponsorship payments</h1>
          <p>
            Review bank transfer submissions and confirm funds received by
            Activation Global Network.
          </p>
        </div>

        <button
          type="button"
          className="button button-dark button-small"
          onClick={() => void transfers.refetch()}
          disabled={transfers.isFetching}
        >
          <RefreshCw
            size={15}
            className={transfers.isFetching ? 'animate-spin' : ''}
          />
          {transfers.isFetching ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <NoticeBox notice={notice} />

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="dashboard-panel p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-slate-500">Pending on this page</span>
            <Clock3 className="shrink-0 text-amber-600" size={20} />
          </div>
          <strong className="mt-3 block text-3xl text-slate-900">
            {pendingCount}
          </strong>
        </div>

        <div className="dashboard-panel p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-slate-500">Verified on this page</span>
            <CheckCircle2 className="shrink-0 text-emerald-600" size={20} />
          </div>
          <strong className="mt-3 block text-3xl text-slate-900">
            {verifiedCount}
          </strong>
        </div>

        <div className="dashboard-panel p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-slate-500">Rejected on this page</span>
            <XCircle className="shrink-0 text-red-600" size={20} />
          </div>
          <strong className="mt-3 block text-3xl text-slate-900">
            {rejectedCount}
          </strong>
        </div>
      </div>

      <section className="dashboard-panel records-panel mt-6 min-w-0">
        <div className="records-toolbar flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <div className="search-field w-full sm:max-w-md">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search reference, sponsor or email…"
              aria-label="Search bank transfers"
            />
          </div>

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as '' | TransferStatus);
              setPage(1);
            }}
            className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm sm:w-auto"
            aria-label="Filter transfer status"
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending verification</option>
            <option value="SUCCESSFUL">Verified</option>
            <option value="FAILED">Rejected</option>
          </select>
        </div>

        {transfers.isLoading ? (
          <div className="admin-loading">
            <span className="loading-spinner" />
            <p>Loading bank transfers…</p>
          </div>
        ) : transfers.isError ? (
          <div className="empty-state">
            <p>
              {getApiError(transfers.error, 'Unable to load bank transfers.')}
            </p>
            <button type="button" onClick={() => void transfers.refetch()}>
              Try again
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="empty-state">
            <div>
              <ShieldCheck size={22} />
            </div>
            <strong>No bank transfers found</strong>
            <p>
              Submitted bank transfer details will appear here when sponsors
              complete their submissions.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile layout: readable cards instead of a horizontally scrolling table. */}
            <div className="space-y-3 p-3 sm:p-4 lg:hidden">
              {rows.map((transfer) => {
                const metadata = transfer.metadata ?? {};

                return (
                  <article
                    key={transfer.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="break-words font-semibold text-slate-900">
                          {transfer.payerName || 'Sponsor'}
                        </h3>
                        <p className="mt-1 break-all text-xs text-slate-500">
                          {transfer.payerEmail}
                        </p>
                      </div>
                      {renderStatus(transfer)}
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 border-y border-slate-100 py-3">
                      <span className="text-xs text-slate-500">Amount</span>
                      <strong className="text-lg text-slate-900">
                        {formatAmount(transfer.amount, transfer.currency)}
                      </strong>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                      <div className="flex min-w-0 items-start gap-2">
                        <Landmark size={15} className="mt-0.5 shrink-0 text-slate-400" />
                        <div className="min-w-0">
                          <p className="text-xs text-slate-500">Sender name</p>
                          <p className="break-words font-medium text-slate-800">
                            {metadata.transferSenderName || '—'}
                          </p>
                        </div>
                      </div>

                      <div className="flex min-w-0 items-start gap-2">
                        <Hash size={15} className="mt-0.5 shrink-0 text-slate-400" />
                        <div className="min-w-0">
                          <p className="text-xs text-slate-500">Bank reference</p>
                          <p className="break-all font-medium text-slate-800">
                            {metadata.transferReference || 'Not provided'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <CalendarDays size={15} className="mt-0.5 shrink-0 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-500">Transfer date</p>
                          <p className="font-medium text-slate-800">
                            {formatDate(metadata.transferDate)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <CalendarDays size={15} className="mt-0.5 shrink-0 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-500">Submitted</p>
                          <p className="font-medium text-slate-800">
                            {formatDate(transfer.createdAt)}
                          </p>
                        </div>
                      </div>

                      {transfer.payerPhone && (
                        <div className="flex min-w-0 items-start gap-2">
                          <Phone size={15} className="mt-0.5 shrink-0 text-slate-400" />
                          <p className="break-all text-xs text-slate-600">
                            {transfer.payerPhone}
                          </p>
                        </div>
                      )}

                      <div className="flex min-w-0 items-start gap-2">
                        <Mail size={15} className="mt-0.5 shrink-0 text-slate-400" />
                        <p className="break-all text-xs text-slate-600">
                          {transfer.reference}
                        </p>
                      </div>
                    </div>

                    {metadata.rejectionReason && (
                      <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs leading-5 text-red-700">
                        Rejection reason: {metadata.rejectionReason}
                      </p>
                    )}

                    <div className="mt-4 border-t border-slate-100 pt-3">
                      {renderActions(transfer)}
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Desktop layout */}
            <div className="records-table-wrap hidden lg:block">
              <table className="records-table">
                <thead>
                  <tr>
                    <th>Sponsor</th>
                    <th>Amount</th>
                    <th>Transfer details</th>
                    <th>Payment reference</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((transfer) => {
                    const metadata = transfer.metadata ?? {};

                    return (
                      <tr key={transfer.id}>
                        <td>
                          <strong>{transfer.payerName || '—'}</strong>
                          <br />
                          <span className="text-xs text-slate-500">
                            {transfer.payerEmail}
                          </span>
                          {transfer.payerPhone && (
                            <>
                              <br />
                              <span className="text-xs text-slate-500">
                                {transfer.payerPhone}
                              </span>
                            </>
                          )}
                        </td>

                        <td>
                          <strong>
                            {formatAmount(transfer.amount, transfer.currency)}
                          </strong>
                        </td>

                        <td>
                          <strong>{metadata.transferSenderName || '—'}</strong>
                          <br />
                          <span className="text-xs text-slate-500">
                            {metadata.transferReference || 'No bank reference'}
                          </span>
                          <br />
                          <span className="text-xs text-slate-500">
                            Transfer date: {formatDate(metadata.transferDate)}
                          </span>
                          {metadata.rejectionReason && (
                            <p className="mt-2 max-w-xs text-xs text-red-600">
                              Reason: {metadata.rejectionReason}
                            </p>
                          )}
                        </td>

                        <td>
                          <span className="font-mono text-xs">
                            {transfer.reference}
                          </span>
                        </td>

                        <td>{formatDate(transfer.createdAt)}</td>

                        <td>{renderStatus(transfer)}</td>

                        <td>{renderActions(transfer)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {transfers.data && transfers.data.total > 0 && (
          <div className="records-pagination flex-col gap-3 sm:flex-row">
            <span>
              {transfers.data.total.toLocaleString()} transfers
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={page <= 1 || transfers.isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </button>

              <span>
                Page {page} of {pageCount}
              </span>

              <button
                type="button"
                disabled={page >= pageCount || transfers.isFetching}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </AdminLayout>
  );
}
