// src/pages/academy/AcademyAnalysis.jsx
import React, { useEffect, useState } from "react";
import { api } from "../../api";
import LoadingSkeleton from "../../components/LoadingSkeleton.jsx";
import { TrendingUp, Wallet, PieChart, BarChart2, Users, Calendar } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function AcademyAnalysis({ session }) {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [finance, setFinance] = useState({ type: "income", amount: "", category: "", date: "", note: "" });
  const [financeList, setFinanceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function loadAll() {
    try {
      setLoading(true);
      setError(null);
      if (!session?.academyId) {
        throw new Error("Academy not linked to your account.");
      }
      const analytics = await api(`/api/academies/${session.academyId}/analytics`);
      setData(analytics);
      const fin = await api(`/api/academies/${session.academyId}/finance`);
      setFinanceList(fin);
    } catch (e) {
      console.error("Failed to load analytics/finance", e);
      setError(e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session?.academyId) {
      loadAll();
    } else {
      setLoading(false);
    }
  }, [session?.academyId]);

  async function addFinance(e) {
    e.preventDefault();
    try {
      setSaving(true);
      const created = await api(`/api/academies/${session.academyId}/finance`, {
        method: "POST",
        body: JSON.stringify(finance)
      });
      setFinanceList([created, ...financeList]);
      setFinance({ type: "income", amount: "", category: "", date: "", note: "" });
      // refresh KPIs
      const analytics = await api(`/api/academies/${session.academyId}/analytics`);
      setData(analytics);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSkeleton lines={6} />;

  // Simple inline bars without external chart libs
  const Bar = ({ value, max=100 }) => (
    <div className="w-full bg-white/10 rounded-full h-2">
      <div className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500" style={{ width: `${Math.min(100, (value/max)*100)}%` }} />
    </div>
  );

  const pos = (data?.playersByPosition || []).filter(Boolean);
  const status = data?.matchesByStatus || [];
  const ages = (data?.playersByAge || []).filter(Boolean);
  const requestStatus = data?.playerRequests?.byStatus || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{t("academyAnalytics.title")}</h1>
            <p className="text-white/70">{t("academyAnalytics.description")}</p>
          </div>
          <button onClick={loadAll} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm">{t("academyAnalytics.refresh")}</button>
        </div>
        {error && (
          <div className="mt-3 p-3 rounded-xl bg-red-600/20 border border-red-600/40 text-red-200 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl p-4 bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-white/80">Players</span>
            <Users />
          </div>
          <div className="text-3xl font-extrabold mt-2">{data?.playerCount ?? 0}</div>
        </div>
        <div className="rounded-2xl p-4 bg-gradient-to-br from-emerald-600 to-green-700 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-white/80">Matches</span>
            <Calendar />
          </div>
          <div className="text-3xl font-extrabold mt-2">{data?.matchCount ?? 0}</div>
        </div>
        <div className="rounded-2xl p-4 bg-gradient-to-br from-amber-600 to-orange-700 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-white/80">Income</span>
            <TrendingUp />
          </div>
          <div className="text-3xl font-extrabold mt-2">EGP {Math.round(data?.finance?.income || 0)}</div>
        </div>
        <div className="rounded-2xl p-4 bg-gradient-to-br from-rose-600 to-pink-700 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-white/80">Balance</span>
            <Wallet />
          </div>
          <div className="text-3xl font-extrabold mt-2">EGP {Math.round(data?.finance?.balance || 0)}</div>
        </div>
      </div>

      {/* Players */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Players</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl p-6 bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <PieChart /><h2 className="font-semibold">Players by Position</h2>
          </div>
          <div className="space-y-3">
            {pos.length === 0 && <div className="text-white/60">No players yet.</div>}
            {pos.map((p) => (
              <div key={p._id || 'unknown'}>
                <div className="flex justify-between text-sm">
                  <span>{p._id || "Unknown"}</span><span>{p.count}</span>
                </div>
                <Bar value={p.count} max={Math.max(1, ...pos.map(x => x.count))} />
              </div>
            ))}
          </div>
        </div>

        {/* Players by Age */}
        <div className="rounded-2xl p-6 bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 /><h2 className="font-semibold">Players by Age</h2>
          </div>
          <div className="space-y-3">
            {ages.length === 0 && <div className="text-white/60">No players yet.</div>}
            {ages.map((a) => (
              <div key={a._id || 'unknown'}>
                <div className="flex justify-between text-sm">
                  <span>{a._id || "Unknown"}</span><span>{a.count}</span>
                </div>
                <Bar value={a.count} max={Math.max(1, ...ages.map(x => x.count))} />
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>

      {/* Matches & Player Requests */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Matches & Requests</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl p-6 bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 /><h2 className="font-semibold">Matches Status</h2>
          </div>
          <div className="space-y-3">
            {status.length === 0 && <div className="text-white/60">No matches yet.</div>}
            {status.map((s) => (
              <div key={s._id}>
                <div className="flex justify-between text-sm">
                  <span className="capitalize">{s._id}</span><span>{s.count}</span>
                </div>
                <Bar value={s.count} max={Math.max(1, ...status.map(x => x.count))} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl p-6 bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <PieChart /><h2 className="font-semibold">Player Requests</h2>
          </div>
          <div className="space-y-3">
            {(!requestStatus || requestStatus.length === 0) && <div className="text-white/60">No requests yet.</div>}
            {requestStatus.map((s) => (
              <div key={s._id}>
                <div className="flex justify-between text-sm">
                  <span className="capitalize">{s._id}</span><span>{s.count}</span>
                </div>
                <Bar value={s.count} max={Math.max(1, ...requestStatus.map(x => x.count))} />
              </div>
            ))}
          </div>
          <div className="mt-4 text-sm text-white/80">Total: {data?.playerRequests?.total || 0}</div>
        </div>
      </div>
      </div>

      {/* Finance */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Finance</h2>
      <div className="rounded-2xl p-6 bg-white/5 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2"><Wallet /><h2 className="font-semibold">Finance</h2></div>
        </div>
        <form onSubmit={addFinance} className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <select className="bg-brand-800 border border-white/10 rounded-xl px-3 py-2" value={finance.type} onChange={e=>setFinance({ ...finance, type: e.target.value })}>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <input className="bg-brand-800 border border-white/10 rounded-xl px-3 py-2" type="number" step="0.01" placeholder="Amount (EGP)" value={finance.amount} onChange={e=>setFinance({ ...finance, amount: Number(e.target.value) })} required />
          <input className="bg-brand-800 border border-white/10 rounded-xl px-3 py-2" placeholder="Category" value={finance.category} onChange={e=>setFinance({ ...finance, category: e.target.value })} />
          <input className="bg-brand-800 border border-white/10 rounded-xl px-3 py-2" type="date" value={finance.date} onChange={e=>setFinance({ ...finance, date: e.target.value })} />
          <input className="bg-brand-800 border border-white/10 rounded-xl px-3 py-2 md:col-span-2" placeholder="Note" value={finance.note} onChange={e=>setFinance({ ...finance, note: e.target.value })} />
          <button disabled={saving} className="bg-purple-600 hover:bg-purple-700 rounded-xl px-3 py-2 font-semibold">{saving ? "Saving..." : "Add Entry"}</button>
        </form>

        <div className="mt-4 grid gap-2">
          {financeList.length === 0 && <div className="text-white/60">No entries yet.</div>}
          {financeList.map((f) => (
            <div key={f._id} className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2">
              <div className="flex items-center gap-3">
                <span className={"px-2 py-0.5 rounded-full text-xs " + (f.type === "income" ? "bg-green-600/30 text-green-200" : "bg-red-600/30 text-red-200")}>{f.type}</span>
                <span className="font-semibold">EGP {f.amount}</span>
                <span className="text-white/70">{f.category}</span>
                <span className="text-white/50 text-sm">{new Date(f.date).toLocaleDateString()}</span>
              </div>
              <div className="text-white/70">{f.note}</div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
