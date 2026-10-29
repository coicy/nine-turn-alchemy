const fs = require("fs");
const vm = require("vm");
const assert = require("assert");
const path = require("path");
const createTelemetry = require("./telemetry.js");
const { randomUUID } = require("node:crypto");
const collector = createTelemetry({ endpoint: "https://example.test", storage: null, fetch: async () => { throw new Error("offline-test"); }, uuid: randomUUID, now: Date.now });

const elements = new Map();
function element(id) {
  if (!elements.has(id)) elements.set(id, {
    textContent: "", innerHTML: "", disabled: false, checked: true, style: {}, dataset: {},
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    addEventListener(type, fn) { this[type] = fn; },
  });
  return elements.get(id);
}
const document = { getElementById: element, addEventListener() {}, activeElement: null, body: { dataset: { screen: "opening" } } };
let rolls = [];
const math = Object.create(Math);
math.random = () => rolls.length ? rolls.shift() : 0.5;
const timers = [];
const context = { document, Math: math, clearTimeout() {}, setTimeout() {}, window: { AlchemyTelemetry: collector, setTimeout(fn) { timers.push(fn); }, setInterval() {}, addEventListener() {} } };
let source = fs.readFileSync(path.join(__dirname, "app.js"), "utf8");
source = source.replace(/\}\)\(\);\s*$/, "globalThis.testApi = { getState: () => state, resolveRefine, render, tryAddRune, tryFusion }; })();");
vm.runInNewContext(source, context);
const api = context.testApi;
const click = id => element(id).click();
const settle = (...values) => { rolls = values;if(values[0]===0)api.getState().riskResult={explode:.5}; api.resolveRefine(); };

click("startButton");
assert.equal(document.body.dataset.screen, "playing");
assert.equal(api.getState().attempt, 0);
assert.equal(element("collectButton").disabled, true);
click("newPillButton");
assert.equal(api.getState().attempt, 1);
click("collectButton");
assert.equal(api.getState().delivered, 24);
assert.equal(api.getState().pillEnded, true);
click("newPillButton");
assert.equal(api.getState().attempt, 2);
settle(0, 0.5); // explosion
assert.equal(api.getState().pillEnded, true);
assert.equal(element("pillStage").dataset.state, "explode");
assert.equal(element("pillValue").textContent, "已损失");
click("newPillButton");
settle(0, 0.5);
assert.equal(api.getState().roundEnded, true);
assert.equal(element("newPillButton").disabled, true);

click("restartButton");
click("newPillButton");
let state = api.getState();
state.pill.runes.push("赤纹", "青纹");
state.pill.value = 100;
state.pill.turn = 3;
settle(0.9, 0.7); // hold grants shield
assert.equal(state.pill.shield, true);
assert.equal(element("riskResultValue").textContent, "0%");
settle(0, 0.5); // shield converts explosion to hold
assert.equal(state.pillEnded, false);
assert.equal(state.pill.shield, true); // red rune renews shield on hold
settle(0.9, 0.95); // shield consumed, damage with blue rune
assert.equal(state.pill.value, 90);
assert.equal(state.pill.turn, 2);
assert.equal(state.pill.shield, false);
assert.equal(state.pill.quality, 0);

state.pill.turn = 99;
state.pill.value = 300;
settle(0.9, 0.01, 0.9); // big success to nine
assert.equal(state.pill.turn, 100);
assert.equal(element("eventTitle").textContent, "百转成丹");
assert.equal(element("pillStage").dataset.state, "complete");
assert.equal(element("refineButton").disabled, true);
assert.equal(element("collectButton").disabled, false);
click("collectButton");
assert.equal(state.roundEnded, true);
assert.ok(state.delivered >= 300);
assert.equal(element("newPillButton").disabled, true);
assert.ok(collector.exportData().events.some(e => e.type === "run_end" && e.result === "win"));
assert.ok(collector.exportData().events.some(e => e.type === "run_end" && e.result === "loss"));
assert.ok(collector.exportData().events.some(e => e.type === "collect" && e.before.value === 24 && e.state.delivered === 24));
click("restartButton");
click("newPillButton");
rolls = [0.9, 0.5, 0.9, 0.5];
click("refineButton");
assert.equal(api.getState().busy, true);
timers.shift()();
assert.equal(api.getState().busy, false);
assert.ok(collector.exportData().events.some(e => e.type === "refine_choice"));
assert.ok(collector.exportData().events.some(e => e.type === "refine_result" && e.before.turn === 1 && e.state.turn === 2));
console.log("MVP checks passed: collection, three-pill loss, rune effects, nine-turn cap, order victory.");


// Repeated generation reaches all six distinct runes through both fusions.
click("restartButton");
click("newPillButton");
state = api.getState();
for(let i=0;i<20;i++){rolls=[0,0];api.tryAddRune();assert.ok(state.pill.runes.length<=6);}
assert.equal(state.pill.runes.length,6);
assert.equal(new Set(state.pill.runes).size,6);
assert.ok(state.pill.runes.includes("金纹") && state.pill.runes.includes("星痕"));
const fullValue=state.pill.value;
assert.equal(api.tryAddRune(),null);
assert.equal(state.pill.value,fullValue);
api.render();
assert.ok(element("runeSummary").textContent.includes("6/6 道 · 已满"));
assert.equal(element("refineButton").disabled,false);
click("collectButton");
assert.equal(state.collected[0].runes.length,6);
console.log("PASS: six-rune capacity, fusion occupancy, full-cap rejection and collection");
