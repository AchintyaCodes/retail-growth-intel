"use client";

import { useState } from "react";
import Footer from "./components/Footer";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Cell, PieChart, Pie, Legend, ReferenceLine
} from "recharts";
import { ShoppingBag, TrendingUp, Users, BarChart3, Cpu, Download } from "lucide-react";
import rawData from "./data.json";

const data = rawData as any;

const TABS = ["KPIs", "Segments", "Products", "Model", "Export"] as const;
type Tab = typeof TABS[number];

const SEG_COLORS: Record<string, string> = {
  Champions: "#16a34a",
  Loyal: "#15803d",
  "Potential Loyal": "#2563eb",
  Promising: "#7c3aed",
  "At Risk": "#d97706",
  Hibernating: "#dc2626",
  Lost: "#9ca3af",
  Other: "#d1d5db",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-zinc-100 bg-white px-3 py-2 shadow-md text-xs">
      <p className="font-medium text-zinc-700 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || "#3f3f46" }}>
          {p.name}: <span className="font-semibold">{typeof p.value === "number" ? p.value.toLocaleString("en", { maximumFractionDigits: 2 }) : p.value}</span>
        </p>
      ))}
    </div>
  );
};

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-zinc-400">{sub}</p>}
    </div>
  );
}

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      {sub && <p className="mt-0.5 text-sm text-zinc-500">{sub}</p>}
    </div>
  );
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("KPIs");
  const { summary, monthly_revenue, basket_size, repeat_rate, top_products, countries, segments, rfm_scatter, model } = data;

  const revData = monthly_revenue.filter((_: any, i: number) => i % 2 === 0 || i === monthly_revenue.length - 1);
  const basketData = basket_size.filter((_: any, i: number) => i % 2 === 0 || i === basket_size.length - 1);

  const segPie = segments.map((s: any) => ({
    name: s.segment,
    value: s.customers,
    fill: SEG_COLORS[s.segment] || "#d1d5db",
  }));

  const scatterBySeg = (seg: string) =>
    (rfm_scatter as any[]).filter(r => r.segment === seg).slice(0, 80);

  const segList = [...new Set((rfm_scatter as any[]).map(r => r.segment as string))];

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
              <ShoppingBag size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-zinc-900">Retail Growth Intelligence</h1>
              <p className="text-xs text-zinc-400">UCI Online Retail II · {summary.date_range[0]} – {summary.date_range[1]}</p>
            </div>
          </div>
          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-500">Portfolio · public dataset</span>
        </div>
        <div className="mx-auto max-w-7xl px-6 flex gap-1 overflow-x-auto">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t ? "border-violet-600 text-violet-600" : "border-transparent text-zinc-500 hover:text-zinc-700"}`}>
              {t}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">

        {tab === "KPIs" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold text-zinc-900">Revenue, Basket & Repeat Rate</h2>
              <p className="mt-1 text-sm text-zinc-500">793K clean transactions after removing cancellations, returns and missing IDs</p>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="Total Revenue" value={`£${(summary.total_revenue / 1e6).toFixed(1)}M`} sub="Dec 2009 – Dec 2011" />
              <Stat label="Unique Customers" value={summary.n_customers.toLocaleString()} />
              <Stat label="Total Orders" value={summary.n_orders.toLocaleString()} />
              <Stat label="Avg Basket Value" value={`£${summary.avg_basket.toFixed(2)}`} />
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <h3 className="mb-4 text-sm font-semibold text-zinc-700">Monthly Revenue (£)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={revData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" height={40} />
                  <YAxis tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} tickFormatter={v => `£${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} formatter={(v: any) => [`£${Number(v).toLocaleString()}`, "Revenue"]} />
                  <Area type="monotone" dataKey="revenue" stroke="#7c3aed" fill="url(#revGrad)" strokeWidth={2} dot={false} name="Revenue £" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-zinc-200 bg-white p-6">
                <h3 className="mb-4 text-sm font-semibold text-zinc-700">Average Basket Value (£)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={basketData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#71717a" }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" height={35} />
                    <YAxis tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} unit="£" />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="avg_basket_value" stroke="#2563eb" strokeWidth={2} dot={false} name="Avg basket £" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-6">
                <h3 className="mb-4 text-sm font-semibold text-zinc-700">Repeat Purchase Rate (%)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={(repeat_rate as any[]).filter((_: any, i: number) => i % 2 === 0)}>
                    <defs>
                      <linearGradient id="rrGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#71717a" }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" height={35} />
                    <YAxis tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} unit="%" />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={Number(((repeat_rate as any[]).reduce((s: number, r: any) => s + r.repeat_rate, 0) / repeat_rate.length).toFixed(1))} stroke="#9ca3af" strokeDasharray="3 3" />
                    <Area type="monotone" dataKey="repeat_rate" stroke="#16a34a" fill="url(#rrGrad)" strokeWidth={2} dot={false} name="Repeat rate %" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {tab === "Segments" && (
          <div className="space-y-8">
            <SectionTitle title="RFM Customer Segmentation" sub="Quartile scoring → 7 named segments. R=recency, F=frequency, M=monetary value." />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Champions", color: "#16a34a" },
                { label: "Loyal", color: "#2563eb" },
                { label: "At Risk", color: "#d97706" },
                { label: "Hibernating + Lost", color: "#dc2626" },
              ].map(({ label, color }) => {
                const segs = label === "Hibernating + Lost"
                  ? segments.filter((s: any) => ["Hibernating", "Lost"].includes(s.segment))
                  : segments.filter((s: any) => s.segment === label);
                const total = segs.reduce((acc: number, s: any) => acc + s.customers, 0);
                const rev = segs.reduce((acc: number, s: any) => acc + s.total_revenue, 0);
                return (
                  <div key={label} className="rounded-xl border border-zinc-200 bg-white p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                      <p className="text-xs font-medium text-zinc-500">{label}</p>
                    </div>
                    <p className="text-xl font-semibold text-zinc-900">{total.toLocaleString()}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">£{(rev / 1000).toFixed(0)}k revenue</p>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-zinc-200 bg-white p-6">
                <h3 className="mb-4 text-sm font-semibold text-zinc-700">Customers by segment</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={segPie} cx="50%" cy="50%" innerRadius={60} outerRadius={110} dataKey="value" nameKey="name" paddingAngle={2}>
                      {segPie.map((s: any, i: number) => <Cell key={i} fill={s.fill} />)}
                    </Pie>
                    <Tooltip formatter={(v: any, name: any) => [v.toLocaleString(), name]} />
                    <Legend iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-6">
                <h3 className="mb-4 text-sm font-semibold text-zinc-700">Revenue share by segment</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={[...segments].sort((a: any, b: any) => b.revenue_share_pct - a.revenue_share_pct)} layout="vertical" barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} unit="%" />
                    <YAxis type="category" dataKey="segment" tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} width={90} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="revenue_share_pct" name="Revenue %" radius={[0, 4, 4, 0]}>
                      {([...segments].sort((a: any, b: any) => b.revenue_share_pct - a.revenue_share_pct)).map((s: any, i: number) => (
                        <Cell key={i} fill={SEG_COLORS[s.segment] || "#d1d5db"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <h3 className="mb-4 text-sm font-semibold text-zinc-700">RFM scatter — recency vs frequency (sample)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                  <XAxis dataKey="recency" name="Recency (days)" type="number" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false}
                    label={{ value: "Recency (days)", position: "insideBottom", offset: -5, fontSize: 11, fill: "#a1a1aa" }} />
                  <YAxis dataKey="frequency" name="Frequency" type="number" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false}
                    label={{ value: "Frequency", angle: -90, position: "insideLeft", fontSize: 11, fill: "#a1a1aa" }} />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-lg border border-zinc-100 bg-white px-3 py-2 shadow-md text-xs">
                        <p className="font-semibold" style={{ color: SEG_COLORS[d.segment] }}>{d.segment}</p>
                        <p>Recency: {d.recency}d · Freq: {d.frequency} · £{d.monetary?.toFixed(0)}</p>
                      </div>
                    );
                  }} />
                  {segList.map(seg => (
                    <Scatter key={seg} name={seg} data={scatterBySeg(seg)} fill={SEG_COLORS[seg] || "#d1d5db"} fillOpacity={0.6} />
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50">
                    {["Segment", "Customers", "Avg Recency", "Avg Frequency", "Avg Spend", "Rev Share"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(segments as any[]).map((s: any) => (
                    <tr key={s.segment} className="border-b border-zinc-50 hover:bg-zinc-50">
                      <td className="px-5 py-3.5">
                        <span className="inline-block h-2 w-2 rounded-full mr-2" style={{ background: SEG_COLORS[s.segment] || "#d1d5db" }} />
                        <span className="font-medium text-zinc-900">{s.segment}</span>
                      </td>
                      <td className="px-5 py-3.5 tabular-nums text-zinc-600">{s.customers.toLocaleString()}</td>
                      <td className="px-5 py-3.5 tabular-nums text-zinc-600">{s.avg_recency_days}d</td>
                      <td className="px-5 py-3.5 tabular-nums text-zinc-600">{s.avg_frequency}</td>
                      <td className="px-5 py-3.5 tabular-nums text-zinc-600">£{s.avg_monetary.toFixed(0)}</td>
                      <td className="px-5 py-3.5 tabular-nums text-zinc-600">{s.revenue_share_pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "Products" && (
          <div className="space-y-8">
            <SectionTitle title="Top Products & Markets" />
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <h3 className="mb-4 text-sm font-semibold text-zinc-700">Top 12 products by revenue</h3>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={[...top_products].sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 12)} layout="vertical" barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} tickFormatter={v => `£${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="description" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} width={160}
                    tickFormatter={(v: string) => v.length > 22 ? v.slice(0, 22) + "…" : v} />
                  <Tooltip content={<CustomTooltip />} formatter={(v: any) => [`£${Number(v).toLocaleString()}`, "Revenue"]} />
                  <Bar dataKey="revenue" name="Revenue £" fill="#7c3aed" fillOpacity={0.8} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <h3 className="mb-4 text-sm font-semibold text-zinc-700">Top 10 markets by revenue</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={[...countries].sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 10)} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                  <XAxis dataKey="country" tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" height={45} />
                  <YAxis tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} tickFormatter={v => `£${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} formatter={(v: any) => [`£${Number(v).toLocaleString()}`, "Revenue"]} />
                  <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} name="Revenue £" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === "Model" && (
          <div className="space-y-8">
            <SectionTitle title="30-Day Repurchase Propensity Model" sub="Trained on Jan–Jun 2011, evaluated on Jul 2011 (held-out). XGBoost classifier." />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-zinc-200 bg-white p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">AUC-ROC</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900">{model.auc_roc}</p>
                <p className="mt-0.5 text-xs text-zinc-400">0.5=random, 1.0=perfect</p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Avg Precision (AUC-PR)</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900">{model.avg_precision}</p>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-blue-400">Precision@500</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-blue-700">{(model.precision_at_500 * 100).toFixed(1)}%</p>
                <p className="mt-0.5 text-xs text-blue-400">Baseline: {(model.baseline_rate * 100).toFixed(1)}%</p>
              </div>
              <div className="rounded-xl border border-violet-100 bg-violet-50 p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-violet-400">Lift@500</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-violet-700">{model.lift_at_500}×</p>
                <p className="mt-0.5 text-xs text-violet-400">vs. random selection</p>
              </div>
            </div>
            <div className="rounded-xl border border-green-100 bg-green-50 p-5">
              <p className="text-sm font-medium text-green-800">
                Targeting the top 500 customers by propensity score yields <span className="font-bold">{(model.precision_at_500 * 100).toFixed(1)}% precision</span> —
                <span className="font-bold"> {model.lift_at_500}× the baseline</span> repeat rate of {(model.baseline_rate * 100).toFixed(1)}%.
                Contacting those 500 customers yields approximately <span className="font-bold">{Math.round(500 * model.precision_at_500)} repurchases</span>.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-zinc-200 bg-white p-6">
                <h3 className="mb-4 text-sm font-semibold text-zinc-700">Precision@K — value of targeting</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={model.precision_k_curve}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                    <XAxis dataKey="k" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
                    <Tooltip formatter={(v: any) => [`${(v * 100).toFixed(1)}%`, "Precision"]} />
                    <ReferenceLine y={model.baseline_rate} stroke="#9ca3af" strokeDasharray="3 3" label={{ value: `Baseline ${(model.baseline_rate * 100).toFixed(1)}%`, position: "right", fontSize: 10, fill: "#9ca3af" }} />
                    <Line type="monotone" dataKey="precision" stroke="#7c3aed" strokeWidth={2} dot={false} name="Precision@K" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-6">
                <h3 className="mb-4 text-sm font-semibold text-zinc-700">Feature importance</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={[...model.feature_importance].sort((a: any, b: any) => a.importance - b.importance)} layout="vertical" barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="feature" tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} width={85} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="importance" fill="#7c3aed" fillOpacity={0.75} radius={[0, 4, 4, 0]} name="Importance" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {tab === "Export" && (
          <div className="space-y-6 max-w-2xl">
            <SectionTitle title="Power BI Data Export" sub="Download pre-computed CSV tables and import into Power BI Desktop." />
            <div className="space-y-3">
              {([
                { label: "RFM customers", key: "rfm_scatter", desc: "Customer-level RFM scores and segments (sample)" },
                { label: "Segment summary", key: "segments", desc: "Per-segment KPIs: count, avg recency/frequency/monetary, revenue share" },
                { label: "Monthly revenue", key: "monthly_revenue", desc: "Revenue and order count by month" },
                { label: "Basket size", key: "basket_size", desc: "Avg items, avg SKUs, avg basket value by month" },
                { label: "Repeat rate", key: "repeat_rate", desc: "Repeat purchase rate by month" },
                { label: "Top products", key: "top_products", desc: "Top 15 products by revenue" },
                { label: "Markets", key: "countries", desc: "Revenue, customers and orders by country" },
              ] as { label: string; key: string; desc: string }[]).map(({ label, key, desc }) => {
                const tableData = (data as any)[key];
                const csvContent = Array.isArray(tableData) && tableData.length > 0
                  ? [Object.keys(tableData[0]).join(","), ...tableData.map((r: any) => Object.values(r).join(","))].join("\n")
                  : "";
                return (
                  <div key={key} className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{label}</p>
                      <p className="text-xs text-zinc-400">{desc}</p>
                    </div>
                    <a href={`data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`} download={`${key}.csv`}
                      className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">
                      <Download size={13} /> Download CSV
                    </a>
                  </div>
                );
              })}
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-600 space-y-2">
              <p className="font-medium text-zinc-800">Power BI setup</p>
              <ol className="list-decimal list-inside space-y-1 text-xs text-zinc-500">
                <li>Download CSV files above</li>
                <li>Power BI Desktop → Get Data → Text/CSV → import each file</li>
                <li>Connect tables via <code className="font-mono bg-zinc-200 px-1 rounded">month</code> and <code className="font-mono bg-zinc-200 px-1 rounded">segment</code></li>
                <li>See <code className="font-mono bg-zinc-200 px-1 rounded">powerbi/dax_measures.md</code> in the repo for paste-ready DAX measures</li>
              </ol>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
