"use client";
import { useEffect, useState } from "react";

type Totals = {
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  openRate: number;
  clickRate: number;
  totalOpenEvents: number;
  totalClickEvents: number;
};

export default function EmailAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/email-analytics", { cache: "no-store" });
        const data = await res.json();
        if (!data.success)
          throw new Error(data.error || "Failed to load analytics");
        setTotals(data.totals);
        setRecent(data.recent || []);
      } catch (e: any) {
        setError(e.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  return (
    <div className="container mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">Email Analytics</h1>

      {loading && <div>Loading analytics…</div>}
      {error && <div className="text-red-600">{error}</div>}

      {totals && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Sent</div>
            <div className="text-2xl font-bold">{totals.totalSent}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Opened</div>
            <div className="text-2xl font-bold">
              {totals.totalOpened}{" "}
              <span className="text-sm font-normal">({totals.openRate}%)</span>
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Clicked</div>
            <div className="text-2xl font-bold">
              {totals.totalClicked}{" "}
              <span className="text-sm font-normal">({totals.clickRate}%)</span>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="p-3">Recipient</th>
              <th className="p-3">Subject</th>
              <th className="p-3">First Open</th>
              <th className="p-3">Opens</th>
              <th className="p-3">Clicks</th>
              <th className="p-3">Status</th>
              <th className="p-3">Live</th>
              <th className="p-3">Sent At</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((r) => (
              <tr key={r._id} className="border-b last:border-0">
                <td className="p-3">{r.recipientEmail}</td>
                <td
                  className="p-3 truncate max-w-[300px]"
                  title={r.emailSubject}
                >
                  {r.emailSubject || "—"}
                </td>
                <td className="p-3">
                  {r.firstOpenedAt
                    ? new Date(r.firstOpenedAt).toLocaleString()
                    : "—"}
                </td>
                <td className="p-3">{r.totalOpens || 0}</td>
                <td className="p-3">{r.totalClicks || 0}</td>
                <td className="p-3 capitalize">{r.status}</td>
                <td className="p-3">
                  <a
                    className="underline text-blue-600"
                    href={`/email-analytics/watch/${r._id}`}
                  >
                    Watch
                  </a>
                </td>
                <td className="p-3">
                  {r.sentAt ? new Date(r.sentAt).toLocaleString() : "—"}
                </td>
              </tr>
            ))}
            {recent.length === 0 && !loading && (
              <tr>
                <td
                  className="p-4 text-center text-muted-foreground"
                  colSpan={7}
                >
                  No tracked emails yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
