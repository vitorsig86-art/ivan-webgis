// Local synthetic contract for popup actions (embedded pages): no browser, tokens, real data or network.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const cesium = require("cesium");
const root = path.join(__dirname, "..");

function load(file) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { exports, require, URL, console });
  return exports;
}

const popup = load("src/cesium/vectorPopup.ts");
const allowed = ["https://sim.example.invalid", "https://other.example.invalid:8443/ignored/path"];

// URL policy: https only, exact origin, no credentials, no other schemes.
assert.equal(popup.allowedPageUrl("https://sim.example.invalid/plot-a?view=top", allowed), "https://sim.example.invalid/plot-a?view=top");
assert.equal(popup.allowedPageUrl(" https://other.example.invalid:8443/x ", allowed), "https://other.example.invalid:8443/x");
assert.equal(popup.allowedPageUrl("https://other.example.invalid/x", allowed), null, "port is part of the origin");
assert.equal(popup.allowedPageUrl("http://sim.example.invalid/plot-a", allowed), null, "http is refused");
assert.equal(popup.allowedPageUrl("https://sim.example.invalid.evil.invalid/", allowed), null, "suffix lookalike is refused");
assert.equal(popup.allowedPageUrl("https://user:pass@sim.example.invalid/", allowed), null, "credentials are refused");
assert.equal(popup.allowedPageUrl("javascript:alert(1)", allowed), null);
assert.equal(popup.allowedPageUrl("data:text/html,x", allowed), null);
assert.equal(popup.allowedPageUrl("/relative", allowed), null);
assert.equal(popup.allowedPageUrl(42, allowed), null);
assert.equal(popup.allowedPageUrl("https://sim.example.invalid/", []), null, "no allowlist, no action");
assert.equal(popup.allowedPageUrl("https://sim.example.invalid/", ["not a url"]), null);

// Actions come from feature properties and respect the allowlist.
const config = { title: "Talhão", titleProperty: "label", fields: [], actions: [
  { label: "Entrar na simulação 3D", urlProperty: "simulation_url" },
  { label: "Nova aba", urlProperty: "simulation_url", target: "tab", flyTo: false },
  { label: "Sem URL", urlProperty: "absent" },
  { label: "Fixa", url: "https://sim.example.invalid/fixed" },
  { label: "Fixa de fora", url: "https://elsewhere.invalid/x" },
] };
const plot = new cesium.Entity({ properties: { label: "A", simulation_url: "https://sim.example.invalid/a" } });
popup.registerVectorPopup(plot, config);
const read = popup.readVectorPopup(plot, cesium.JulianDate.now(), allowed);
assert.deepEqual(read.actions.map(a => [a.label, a.url, a.target, a.flyTo]), [
  ["Entrar na simulação 3D", "https://sim.example.invalid/a", "overlay", true],
  ["Nova aba", "https://sim.example.invalid/a", "tab", false],
  ["Fixa", "https://sim.example.invalid/fixed", "overlay", true],
]);
assert.equal(popup.readVectorPopup(plot, cesium.JulianDate.now()).actions.length, 0, "default: no allowed origins");

const foreign = new cesium.Entity({ properties: { label: "B", simulation_url: "https://elsewhere.invalid/b" } });
popup.registerVectorPopup(foreign, config);
assert.equal(popup.readVectorPopup(foreign, cesium.JulianDate.now(), allowed).actions.length, 1, "foreign feature URL hides its button; the fixed allowed URL stays");

const legacy = new cesium.Entity({ properties: { label: "C" } });
popup.registerVectorPopup(legacy, { titleProperty: "label", fields: [] });
assert.equal(popup.readVectorPopup(legacy, cesium.JulianDate.now(), allowed).actions.length, 0, "popups without actions keep working");

// The template keeps the feature inactive: no real origins or URLs.
const template = fs.readFileSync(path.join(root, "src/projects/template.ts"), "utf8");
assert.ok(!/allowedOrigins:\s*\[\s*"https:\/\/(?!your-simulation\.example\.invalid)/.test(template.replace(/\/\/.*$/gm, "")), "no real origin in the template");

console.log("embedded pages: ok");
