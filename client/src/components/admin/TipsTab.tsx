import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { defaultTipsDates, tipsDay, tipsInputSchema } from "@shared/adminTips";

const money = (cents: number) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

export function TipsTab() {
  const [dates, setDates] = useState(() => defaultTipsDates());
  const [filter, setFilter] = useState(() => ({ ...defaultTipsDates(), page: 1 }));
  const [message, setMessage] = useState("");
  const [exporting, setExporting] = useState(false);
  const report = trpc.tips.report.useQuery(filter);
  const utils = trpc.useUtils();
  const datesChanged = dates.from !== filter.from || dates.to !== filter.to;

  async function download() {
    if (exporting || datesChanged || report.isFetching || !report.data) return; setExporting(true); setMessage("");
    try {
      const result = await utils.client.tips.export.query(filter);
      const url = URL.createObjectURL(new Blob([result.csv], { type: "text/csv;charset=utf-8" }));
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = result.filename;
      document.body.append(anchor); anchor.click(); anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to export tips. Please retry."); }
    finally { setExporting(false); }
  }

  return <section className="space-y-6">
    <div><h1 className="text-2xl font-bold">Tips</h1>
      <p className="text-sm text-muted-foreground mt-2">Recorded tips on paid, non-cancelled orders. Dates use order creation in America/Toronto, including both selected dates. Amounts are from this store&apos;s CAD checkout records; this is not a payout or refund reconciliation.</p>
      <p className="text-sm text-muted-foreground mt-1">Unpaid, failed and refunded orders are excluded. Refunds not reflected in the recorded payment status are not deducted.</p></div>
    <form className="flex flex-wrap items-end gap-3" onSubmit={event => {
      event.preventDefault();
      const parsed = tipsInputSchema.safeParse({ ...dates, page: 1 });
      if (!parsed.success) { setMessage(parsed.error.issues[0]?.message ?? "Check the date range."); return; }
      setMessage(""); setFilter(parsed.data);
    }}>
      <label className="text-sm">From<input aria-label="From date" className="block rounded border bg-background p-2" type="date" disabled={exporting} min="2000-01-01" max="2099-12-31" required value={dates.from} onChange={event => setDates(value => ({ ...value, from: event.target.value }))} /></label>
      <label className="text-sm">Through<input aria-label="Through date" className="block rounded border bg-background p-2" type="date" disabled={exporting} min="2000-01-01" max="2099-12-31" required value={dates.to} onChange={event => setDates(value => ({ ...value, to: event.target.value }))} /></label>
      <Button type="submit" disabled={report.isFetching || exporting}>Apply dates</Button>
      <Button type="button" variant="outline" disabled={report.isFetching || exporting || datesChanged || !report.data} onClick={() => void download()}>{exporting ? "Exporting..." : "Export CSV"}</Button>
    </form>
    <p className="text-xs text-muted-foreground">Up to 366 days per report. CSV includes every matching tipped order, up to 10,000; larger exports require a shorter range.</p>
    {message ? <p role="alert" className="text-destructive">{message}</p> : null}
    {report.error ? <div role="alert"><p>Unable to load tips: {report.error.message}</p><Button onClick={() => void report.refetch()} disabled={report.isFetching}>Retry</Button></div> : null}
    {report.isFetching ? <p role="status">Loading tips...</p> : null}
    {report.data && !report.isFetching && !report.error ? <>
      <p className="text-sm">{filter.from} through {filter.to} · CAD</p>
      <div className="grid gap-3 sm:grid-cols-3">{[
        ["Recorded tips", money(report.data.totalTipCents)], ["Tipped orders", report.data.tippedOrders], ["Average per tipped order", money(report.data.averageTipCents)],
      ].map(([label, value]) => <div key={label} className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-bold">{value}</p></div>)}</div>
      {report.data.tippedOrders === 0 ? <p>No paid tipped orders in this date range.</p> : <>
        <h2 className="text-lg font-semibold">By order-created date</h2>
        <div className="max-h-72 overflow-auto"><table className="w-full text-sm"><thead><tr><th className="text-left p-2" scope="col">Date (Toronto)</th><th className="text-right p-2" scope="col">Tipped orders</th><th className="text-right p-2" scope="col">Tips (CAD)</th></tr></thead><tbody>{report.data.daily.map(day => <tr key={day.date}><td className="p-2">{day.date}</td><td className="p-2 text-right">{day.orders}</td><td className="p-2 text-right">{money(day.tipCents)}</td></tr>)}</tbody></table></div>
        <h2 className="text-lg font-semibold">Tipped orders</h2>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr><th className="text-left p-2" scope="col">Order</th><th className="text-left p-2" scope="col">Created (Toronto)</th><th className="text-right p-2" scope="col">Tip (CAD)</th></tr></thead><tbody>{report.data.rows.map(order => <tr key={order.id}><td className="p-2">{order.orderNumber}</td><td className="p-2">{tipsDay(new Date(order.createdAt))}</td><td className="p-2 text-right">{money(order.tipCents)}</td></tr>)}</tbody></table></div>
        <div className="flex flex-wrap items-center gap-3"><Button variant="outline" disabled={filter.page <= 1 || exporting} onClick={() => setFilter(value => ({ ...value, page: value.page - 1 }))}>Previous</Button><span>Page {report.data.page} of {report.data.pageCount}</span><Button variant="outline" disabled={filter.page >= report.data.pageCount || exporting} onClick={() => setFilter(value => ({ ...value, page: value.page + 1 }))}>Next</Button></div>
      </>}
    </> : null}
  </section>;
}
