'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useAuthUser } from '@/lib/useAuthUser';

function cls(...a) {
  return a.filter(Boolean).join(' ');
}

const STATUS_OPTIONS = [
  { label: 'Wszystkie', value: '' },
  { label: 'OK', value: 'OK' },
  { label: 'SPAM', value: 'SPAM' },
  { label: 'RATE-LIMIT', value: 'RATE-LIMIT' },
  { label: 'ERROR', value: 'ERROR' },
  { label: 'DELETED', value: 'DELETED' }, // NEW
];

export default function ContactLogsAdminPage() {
  const { user, loading } = useAuthUser();
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // масові дії
  const [cleanupDays, setCleanupDays] = useState(30);
  const [cleanupSpam, setCleanupSpam] = useState(true);
  const [cleanupRate, setCleanupRate] = useState(true);

  async function fetchPage(token, pageArg, perPageArg, qArg, statusArg) {
    const params = new URLSearchParams({ page: String(pageArg), perPage: String(perPageArg) });
    if (qArg?.trim()) params.set('q', qArg.trim());
    if (statusArg) params.set('status', statusArg);
    const res = await fetch(`/api/admin/contact-logs?${params.toString()}`, {
      headers: { Authorization: `Bearer ${await user.getIdToken()}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }

  async function load() {
    if (!user) return;
    setBusy(true);
    setError('');
    try {
      const token = await user.getIdToken();
      const data = await fetchPage(token, page, perPage, q, status);
      setRows(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      setError(e.message || 'Błąd');
      setRows([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!loading && user) load(); /* eslint-disable-next-line */
  }, [user, loading, page, perPage, status]);

  const onSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  async function handleExportCsv() {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const per = 1000;
      let p = 1;
      let all = [];
      const safetyLimit = 50;
      for (; p <= safetyLimit; p++) {
        const data = await fetchPage(token, p, per, q, status);
        const items = data.items || [];
        all = all.concat(items);
        if (items.length < per) break;
      }
      const header = [
        'id',
        'createdAt',
        'deletedAt',
        'ip',
        'name',
        'email',
        'success',
        'spam',
        'rateLimited',
        'provider',
        'providerMessageId',
        'retryAfterSec',
        'messageLen',
        'error',
        'userAgent',
        'message',
      ];
      const esc = (v) => {
        const s = String(v ?? '');
        return /["\n,]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
      };
      const lines = [header.join(',')];
      for (const r of all)
        lines.push(
          [
            r.id,
            r.createdAt,
            r.deletedAt ?? '',
            r.ip,
            r.name,
            r.email,
            r.success,
            r.spam,
            r.rateLimited,
            r.provider || '',
            r.providerMessageId || '',
            r.retryAfterSec ?? '',
            r.messageLen ?? '',
            r.error || '',
            r.userAgent || '',
            r.message || '',
          ]
            .map(esc)
            .join(','),
        );
      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contact-logs_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(`Błąd eksportu: ${e.message || e}`);
    }
  }

  async function handleSoftDelete(id) {
    if (!user) return;
    if (!confirm('Oznaczyć jako usunięte?')) return;
    try {
      const token = await user.getIdToken();
      setRows((r) =>
        r.map((x) => (x.id === id ? { ...x, deletedAt: new Date().toISOString() } : x)),
      );
      const res = await fetch(`/api/admin/contact-logs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok)
        throw new Error((await res.json().catch(() => ({})))?.error || `HTTP ${res.status}`);
      load();
    } catch (e) {
      alert(`Nie udało się: ${e.message || e}`);
      load();
    }
  }

  async function handleRestore(id) {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      setRows((r) => r.map((x) => (x.id === id ? { ...x, deletedAt: null } : x)));
      const res = await fetch(`/api/admin/contact-logs/${id}/restore`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok)
        throw new Error((await res.json().catch(() => ({})))?.error || `HTTP ${res.status}`);
      load();
    } catch (e) {
      alert(`Nie udało się: ${e.message || e}`);
      load();
    }
  }

  async function handleCleanup() {
    if (!user) return;
    if (!cleanupSpam && !cleanupRate) {
      alert('Wybierz statusy: SPAM i/lub RATE-LIMIT.');
      return;
    }
    if (
      !confirm(
        `Soft-delete ${[cleanupSpam && 'SPAM', cleanupRate && 'RATE-LIMIT'].filter(Boolean).join(' + ')} starsze niż ${cleanupDays} dni?`,
      )
    )
      return;
    try {
      const token = await user.getIdToken();
      const statuses = [];
      if (cleanupSpam) statuses.push('SPAM');
      if (cleanupRate) statuses.push('RATE-LIMIT');
      const res = await fetch('/api/admin/contact-logs/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ days: cleanupDays, statuses }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      alert(`Oznaczono jako usunięte: ${data.deleted ?? 0}`);
      load();
    } catch (e) {
      alert(`Błąd czyszczenia: ${e.message || e}`);
    }
  }

  if (loading) return <div className="p-6 text-gray-600">Ładowanie…</div>;
  if (!user)
    return (
      <div className="p-6">
        <p className="text-red-600">Brak dostępu. Zaloguj się jako administrator.</p>
        <Link href="/login" className="btn btn-primary mt-4 inline-block">
          Zaloguj się
        </Link>
      </div>
    );

  return (
    <section className="mx-auto max-w-6xl p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Logi kontaktów</h1>
        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={onSearch} className="flex items-center gap-2">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-gray-300 p-2 text-sm"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Szukaj (ip, email, treść…)"
              className="w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-brand-500"
            />
            <button type="submit" className="btn btn-secondary" disabled={busy}>
              Szukaj
            </button>
          </form>
          <button
            type="button"
            onClick={handleExportCsv}
            className="btn btn-primary"
            disabled={busy}
          >
            Eksport CSV
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border bg-white p-3">
        <div className="text-sm font-medium">Oczyść (soft-delete):</div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            checked={cleanupSpam}
            onChange={(e) => setCleanupSpam(e.target.checked)}
          />
          SPAM
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            checked={cleanupRate}
            onChange={(e) => setCleanupRate(e.target.checked)}
          />
          RATE-LIMIT
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">starsze niż</span>
          <input
            type="number"
            min={1}
            value={cleanupDays}
            onChange={(e) => setCleanupDays(Math.max(1, Number(e.target.value) || 1))}
            className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-sm"
          />
          <span className="text-sm text-gray-600">dni</span>
        </div>
        <button type="button" onClick={handleCleanup} className="btn btn-secondary" disabled={busy}>
          Oczyść
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-3 py-2">Data</th>
              <th className="px-3 py-2">IP</th>
              <th className="px-3 py-2">Imię / E-mail</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Provider</th>
              <th className="px-3 py-2">Wiadomość</th>
              <th className="px-3 py-2">UA</th>
              <th className="px-3 py-2">Deleted</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const d = new Date(r.createdAt);
              const statusLabel = r.rateLimited
                ? 'RATE-LIMIT'
                : r.spam
                  ? 'SPAM'
                  : r.success
                    ? 'OK'
                    : 'ERROR';
              const deleted = r.deletedAt ? new Date(r.deletedAt) : null;
              return (
                <tr key={r.id} className="border-t">
                  <td className="whitespace-nowrap px-3 py-2 text-gray-600">
                    {d.toLocaleString('pl-PL')}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">{r.ip}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-gray-500">{r.email}</div>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={cls(
                        'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
                        statusLabel === 'OK' &&
                          'border border-emerald-200 bg-emerald-50 text-emerald-700',
                        statusLabel === 'SPAM' &&
                          'border border-yellow-200 bg-yellow-50 text-yellow-800',
                        statusLabel === 'RATE-LIMIT' &&
                          'border border-blue-200 bg-blue-50 text-blue-700',
                        statusLabel === 'ERROR' && 'border border-red-200 bg-red-50 text-red-700',
                      )}
                    >
                      {statusLabel}
                    </span>
                    {r.retryAfterSec ? (
                      <div className="mt-0.5 text-xs text-gray-500">
                        Retry-After: {r.retryAfterSec}s
                      </div>
                    ) : null}
                    {r.error ? (
                      <div
                        className="mt-0.5 max-w-[280px] truncate text-xs text-red-600"
                        title={r.error}
                      >
                        {r.error}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">
                    <div>{r.provider || '—'}</div>
                    <div
                      className="max-w-[240px] truncate text-xs text-gray-500"
                      title={r.providerMessageId || ''}
                    >
                      {r.providerMessageId || ''}
                    </div>
                  </td>
                  <td className="max-w-[360px] px-3 py-2">
                    <div className="line-clamp-3 whitespace-pre-wrap text-gray-700">
                      {r.message}
                    </div>
                    <div className="mt-1 text-xs text-gray-400">len: {r.messageLen}</div>
                  </td>
                  <td className="max-w-[320px] px-3 py-2">
                    <div className="line-clamp-2 text-gray-500" title={r.userAgent || ''}>
                      {r.userAgent || '—'}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-gray-600">
                    {deleted ? deleted.toLocaleString('pl-PL') : '—'}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {!r.deletedAt ? (
                      <button
                        type="button"
                        onClick={() => handleSoftDelete(r.id)}
                        className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                      >
                        Usuń
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRestore(r.id)}
                        className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50"
                      >
                        Przywróć
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {!rows.length && !busy && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={9}>
                  Brak danych
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Razem: {total} · Strona {page}/{totalPages}
        </div>
        <div className="flex items-center gap-2">
          <select
            className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setPage(1);
            }}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n} / stronę
              </option>
            ))}
          </select>
          <button
            className="btn btn-secondary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || busy}
          >
            ←
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || busy}
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}
