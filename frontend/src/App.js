// src/App.js
import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import { startSession, sendMessage, fetchMetrics } from "./api/chat";

function App() {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]); // {role: 'user'|'ai', text: string}
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [metrics, setMetrics] = useState(null);
  const [showMetrics, setShowMetrics] = useState(true);

  const scrollRef = useRef(null);

  useEffect(() => {
    // bootstrap session on mount
    (async () => {
      try {
        const data = await startSession();
        setSessionId(data.session_id);
      } catch (e) {
        setError("Failed to start session. Is the backend running?");
      }
    })();
  }, []);

  useEffect(() => {
    // auto scroll when new messages come
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // fetch metrics periodically
    let id;
    if (showMetrics) {
      const tick = async () => {
        try {
          const m = await fetchMetrics();
          setMetrics(m);
        } catch (e) {
          // ignore metrics failures for now
        }
      };
      tick();
      id = setInterval(tick, 3000);
    }
    return () => id && clearInterval(id);
  }, [showMetrics]);

  async function handleSend() {
    if (!input.trim() || !sessionId || busy) return;
    setBusy(true);
    setError("");

    const userText = input.trim();
    setMessages((m) => [...m, { role: "user", text: userText }]);
    setInput("");

    try {
      const res = await sendMessage(sessionId, userText);
      const aiText = res.answer || "(no answer)";
      setMessages((m) => [...m, { role: "ai", text: aiText }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "ai", text: "Error: failed to generate response." },
      ]);
      setError("Request failed. Check backend/API.");
    } finally {
      setBusy(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="app">
      <div className="header">
        <h1>GigaML Support Agent Demo</h1>
        <div className="badge">
          {sessionId ? `Session: ${sessionId.slice(0, 8)}…` : "Starting…"}
        </div>
      </div>

      <div className="container">
        <div className="chat">
          <div className="messages" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="msg ai">
                <div className="bubble">
                  Hi! I’m your AI support assistant. Ask me about orders, refunds, or account issues.
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.role}`}>
                <div className="bubble">{m.text}</div>
              </div>
            ))}
          </div>

          <div className="inputBar">
            <input
              placeholder="Type your message…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!sessionId || busy}
            />
            <button onClick={handleSend} disabled={!sessionId || busy}>
              {busy ? "Sending…" : "Send"}
            </button>
          </div>
        </div>

        <div className="side">
          <div className="panel">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0 }}>Admin Metrics</h3>
              <label style={{ fontSize: 12 }}>
                <input
                  type="checkbox"
                  checked={showMetrics}
                  onChange={(e) => setShowMetrics(e.target.checked)}
                  style={{ marginRight: 6 }}
                />
                Auto-refresh
              </label>
            </div>
            <div className="kv" style={{ marginTop: 10 }}>
              <div>Active Sessions</div>
              <div>{metrics?.active_sessions ?? "—"}</div>
              <div>Avg Response Time</div>
              <div>
                {metrics?.avg_response_time_ms
                  ? `${metrics.avg_response_time_ms} ms`
                  : "—"}
              </div>
              <div>Error Rate</div>
              <div>{metrics?.error_rate ?? "—"}</div>
            </div>
          </div>

          {error && (
            <div className="panel" style={{ borderColor: "#7f1d1d" }}>
              <div style={{ color: "#fecaca" }}>{error}</div>
            </div>
          )}

          <div className="panel">
            <h3 style={{ marginTop: 0 }}>How to Test</h3>
            <ol style={{ marginTop: 8, paddingLeft: 16 }}>
              <li>Ask: “Where is my order?”</li>
              <li>Ask: “What about refunds?”</li>
              <li>Try unrelated text to see default response</li>
            </ol>
            <p style={{ color: "var(--muted)", fontSize: 13 }}>
              The backend keeps session context in Redis and logs basic metrics.
            </p>
          </div>
        </div>
      </div>

      <div className="footer">
        <div>Demo: Multi-turn AI Support with Metrics</div>
        <div>Frontend: React + Axios | Backend: FastAPI</div>
      </div>
    </div>
  );
}

export default App;
