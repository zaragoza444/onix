"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  dispatchOutbound,
  fetchReceiverConfig,
  ingestPayload,
  listReceivedMessages,
  listSentMessages,
  type ApiTransfer,
  type ReceiverConfig,
} from "@/lib/api";

export function ApiHub() {
  const [config, setConfig] = useState<ReceiverConfig | null>(null);
  const [received, setReceived] = useState<ApiTransfer[]>([]);
  const [sent, setSent] = useState<ApiTransfer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [sendUrl, setSendUrl] = useState("https://httpbin.org/post");
  const [sendMethod, setSendMethod] = useState("POST");
  const [sendBody, setSendBody] = useState('{"hello": "shiva"}');
  const [sendHeaders, setSendHeaders] = useState("{}");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [cfg, inMsgs, outMsgs] = await Promise.all([
        fetchReceiverConfig(),
        listReceivedMessages(15),
        listSentMessages(15),
      ]);
      setConfig(cfg);
      setReceived(inMsgs.items);
      setSent(outMsgs.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load API hub");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onTestIngest(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await ingestPayload({ test: true, at: new Date().toISOString() }, "test");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ingest failed");
    }
  }

  async function onSend(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      await dispatchOutbound(sendUrl, sendMethod, sendBody, sendHeaders);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
  }

  if (loading) {
    return <p className="muted">Loading API receiver & sender…</p>;
  }

  return (
    <div className="api-hub" id="api-hub">
      {error && <p className="auth-error">{error}</p>}

      {config && (
        <section className="card" style={{ marginBottom: "1rem" }}>
          <h2>API Receiver (production)</h2>
          <p className="muted" style={{ marginBottom: "0.75rem" }}>
            Environment: <strong>{config.environment}</strong> — external
            systems POST to your hook URL.
          </p>
          <label className="api-field">
            Webhook URL
            <div className="copy-row">
              <code>{config.hook_url}</code>
              <button type="button" className="btn-secondary" onClick={() => copy(config.hook_url)}>
                Copy
              </button>
            </div>
          </label>
          <label className="api-field">
            Authenticated ingest (Bearer JWT)
            <div className="copy-row">
              <code>{config.ingest_url}</code>
              <button type="button" className="btn-secondary" onClick={() => copy(config.ingest_url)}>
                Copy
              </button>
            </div>
          </label>
          <p className="muted" style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>
            Optional header: <code>{config.webhook_secret_header}</code>
          </p>
          <form onSubmit={onTestIngest} style={{ marginTop: "1rem" }}>
            <button type="submit" className="btn-secondary">
              Test ingest (authenticated)
            </button>
          </form>
        </section>
      )}

      <section className="card" style={{ marginBottom: "1rem" }}>
        <h2>API Sender (production)</h2>
        <form onSubmit={onSend} className="auth-form" style={{ padding: 0 }}>
          <label>
            Target URL
            <input value={sendUrl} onChange={(e) => setSendUrl(e.target.value)} required />
          </label>
          <label>
            Method
            <select value={sendMethod} onChange={(e) => setSendMethod(e.target.value)}>
              {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label>
            Headers (JSON)
            <textarea rows={2} value={sendHeaders} onChange={(e) => setSendHeaders(e.target.value)} />
          </label>
          <label>
            Body (JSON or text)
            <textarea rows={3} value={sendBody} onChange={(e) => setSendBody(e.target.value)} />
          </label>
          <button type="submit" className="btn-primary" disabled={sending}>
            {sending ? "Sending…" : "Dispatch request"}
          </button>
        </form>
      </section>

      <div className="grid-2">
        <TransferList title="Received" items={received} />
        <TransferList title="Sent" items={sent} />
      </div>
    </div>
  );
}

function TransferList({ title, items }: { title: string; items: ApiTransfer[] }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      {items.length === 0 ? (
        <p className="muted">No messages yet.</p>
      ) : (
        <ul className="transfer-list">
          {items.map((t) => (
            <li key={t.id}>
              <span className={`badge badge-${t.status}`}>{t.status}</span>
              <span className="transfer-meta">
                {t.method} · {t.environment} ·{" "}
                {new Date(t.created_at).toLocaleString()}
              </span>
              <code className="transfer-url">{t.url || "(ingest)"}</code>
              {t.response_status != null && (
                <span className="muted"> → HTTP {t.response_status}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
