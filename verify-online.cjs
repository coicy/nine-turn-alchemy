// Creates a clearly marked QA record; exclude run IDs beginning with qa- from player analysis.
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const endpoint = "https://nine-turn-alchemy-playtest-data.breezy-fairy-5227.chatgpt.site";
const headers = { Origin: "https://coicy.github.io", "Content-Type": "application/json" };
async function post(route, body, token) {
  const response = await fetch(endpoint + route, {
    method: "POST", headers: { ...headers, ...(token ? { Authorization: "Bearer " + token } : {}) },
    body: JSON.stringify(body), signal: AbortSignal.timeout(15000),
  });
  assert.equal(response.status, 200, route + " failed: HTTP " + response.status);
  return response.json();
}
(async () => {
  const health = await fetch(endpoint + "/health", { signal: AbortSignal.timeout(15000) });
  assert.equal(health.status, 200);
  assert.equal((await health.json()).ok, true);
  const session = await post("/api/session", { version: "mvp-telemetry-1", agreed: true, policyVersion: "2026-10-27-v1" });
  const event = { id: randomUUID(), runId: "qa-" + randomUUID(), sequence: 0, type: "interrupted", elapsedMs: 0,
    state: { attempt: 1, turn: 1, quality: 0, value: 24, risk: 0.12, delivered: 0, runes: [], shield: false } };
  const result = await post("/api/events", { events: [event] }, session.token);
  assert.ok(result.accepted.includes(event.id));
  const duplicate = await post("/api/events", { events: [event] }, session.token);
  assert.ok(duplicate.accepted.includes(event.id));
  console.log(JSON.stringify({ health: "ok", accepted: true, duplicateAcknowledged: true, runId: event.runId, eventId: event.id }));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
