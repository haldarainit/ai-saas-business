"use client";
import { useEffect, useState } from "react";

export default function WatchEmail({ params }: { params: { id: string } }) {
  const { id } = params;
  const [events, setEvents] = useState<any[]>([]);
  const [snapshot, setSnapshot] = useState<any | null>(null);

  useEffect(() => {
    const es = new EventSource(`/api/email/events/${id}`);
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === "snapshot") {
          setSnapshot(data.tracking);
        } else {
          setEvents((prev) => [data, ...prev].slice(0, 200));
        }
      } catch (_) {}
    };
    es.onerror = () => {
      es.close();
    };
    return () => es.close();
  }, [id]);

  return (
    <div className="container mx-auto px-6 py-10 space-y-6">
      <h1 className="text-2xl font-semibold">Live Email Tracking</h1>
      <div className="rounded-lg border p-4">
        <div className="text-sm text-muted-foreground">Tracking ID</div>
        <div className="font-mono text-sm">{id}</div>
      </div>

      {snapshot && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Recipient</div>
            <div>{snapshot.recipientEmail}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Subject</div>
            <div className="truncate" title={snapshot.emailSubject}>
              {snapshot.emailSubject || "—"}
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Status</div>
            <div className="capitalize">{snapshot.status}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Opens</div>
            <div>{snapshot.totalOpens || 0}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Clicks</div>
            <div>{snapshot.totalClicks || 0}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Sent At</div>
            <div>
              {snapshot.sentAt
                ? new Date(snapshot.sentAt).toLocaleString()
                : "—"}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border p-4">
        <div className="font-medium mb-3">Recent Events</div>
        <ul className="space-y-2 text-sm">
          {events.length === 0 && (
            <li className="text-muted-foreground">No events yet. Waiting…</li>
          )}
          {events.map((e, idx) => (
            <li
              key={idx}
              className="flex items-center justify-between border rounded p-2"
            >
              <span className="capitalize">{e.type}</span>
              <span className="text-muted-foreground">
                {new Date().toLocaleTimeString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
