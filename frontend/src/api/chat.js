// src/api/chat.js
import api from "./client";

export async function startSession() {
  const res = await api.post("/chat/start");
  return res.data; // { session_id }
}

export async function sendMessage(sessionId, message) {
  const res = await api.post("/chat/message", {
    session_id: sessionId,
    message,
  });
  return res.data; // { answer }
}

export async function fetchMetrics() {
  const res = await api.get("/admin/metrics");
  return res.data; // { active_sessions, avg_response_time_ms, error_rate }
}
