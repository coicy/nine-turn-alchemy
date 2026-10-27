(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory;
  else root.AlchemyTelemetry = factory({
    endpoint: "https://nine-turn-alchemy-playtest-data.breezy-fairy-5227.chatgpt.site",
    storage: (() => { try { return root.localStorage; } catch { return null; } })(),
    fetch: root.fetch.bind(root),
    uuid: () => root.crypto.randomUUID(),
    now: () => Date.now(),
    status: text => { const el = document.getElementById("telemetryStatus"); if (el) el.textContent = text; },
  });
})(typeof window === "object" ? window : globalThis, function createTelemetry(options) {
  const KEY = "nine-turn-alchemy-playtest-v1";
  const VERSION = "mvp-telemetry-1";
  let data = { history: [], queue: [], credential: null };
  try {
    const saved = JSON.parse(options.storage?.getItem(KEY) || "null");
    if (saved && Array.isArray(saved.history) && Array.isArray(saved.queue)) data = saved;
  } catch {}
  let enabled = false, runId = null, ended = false, sequence = 0, startedAt = 0;
  let busy = false, persistent = !!options.storage;
  function status(text) { options.status?.(text); }
  function save() {
    try { options.storage?.setItem(KEY, JSON.stringify(data)); }
    catch { persistent = false; }
  }
  function record(type, state, extra = {}) {
    if (!enabled || !runId || ended) return;
    const event = { id: options.uuid(), runId, sequence: sequence++, type, state: JSON.parse(JSON.stringify(state)), elapsedMs: options.now() - startedAt, ...extra };
    data.history.push(event);
    data.queue.push(event);
    if (data.history.length > 3000) data.history.shift();
    if (data.queue.length > 3000) { data.queue.shift(); status("暂存已满，最早记录被移除，请导出"); }
    save();
    status((persistent ? "匿名记录待上传：" : "仅内存暂存：") + data.queue.length + " 条");
  }
  function begin(state) {
    runId = options.uuid(); ended = false; sequence = 0; startedAt = options.now();
    record("run_start", state);
    record("pill_start", state);
    void flush();
  }
  function finish(state, result) {
    if (!enabled || !runId || ended) return;
    record("run_end", state, { result });
    ended = true;
    void flush();
  }
  async function flush() {
    if (!enabled || busy || !data.queue.length) return;
    busy = true;
    try {
      if (!data.credential) {
        const response = await options.fetch(options.endpoint + "/api/session", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ version: VERSION, agreed: true, policyVersion: "2026-10-27-v1" }),
        });
        if (!response.ok) throw new Error("session_failed");
        const result = await response.json();
        if (!result.token || !result.sessionId) throw new Error("invalid_session");
        if (!enabled) return;
        data.credential = result; save();
      }
      const response = await options.fetch(options.endpoint + "/api/events", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + data.credential.token },
        body: JSON.stringify({ events: data.queue.slice(0, 25) }), keepalive: true,
      });
      if (response.status === 401) { data.credential = null; save(); throw new Error("expired_session"); }
      if (!response.ok) throw new Error("upload_failed");
      const result = await response.json();
      if (!Array.isArray(result.accepted) || !result.accepted.length) throw new Error("not_accepted");
      const accepted = new Set(result.accepted);
      data.queue = data.queue.filter(event => !accepted.has(event.id)); save();
      if (enabled) status(data.queue.length ? "待继续上传：" + data.queue.length + " 条" : "匿名记录已上传");
    } catch {
      if (enabled) status("上传未完成，已" + (persistent ? "在本机暂存" : "在内存暂存") + "，将自动重试");
    } finally { busy = false; }
  }
  function setEnabled(value) {
    enabled = !!value;
    data.enabled = enabled;
    if (!enabled) { data.queue = []; data.credential = null; save(); status("匿名上传已关闭"); }
    else { save(); status("匿名记录已开启"); }
  }
  function exportData() { return { schemaVersion: 1, gameVersion: VERSION, policyVersion: "2026-10-27-v1", exportedAt: new Date(options.now()).toISOString(), events: data.history }; }
  function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(exportData(), null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url; link.download = "nine-turn-alchemy-playtest-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  if (typeof document !== "undefined") {
    for (const id of ["telemetryEnabled", "introTelemetryEnabled"]) {
      const element = document.getElementById(id); if (element) element.checked = data.enabled === true;
    }
  }
  return { setEnabled, begin, record, finish, flush, exportData, download };
});
