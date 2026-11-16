// Settings: sounds, haptics, text size, easier-to-read font, reduced motion, theme, read-aloud,
// push notifications, and backing up or resetting progress.
import { state, save, resetAll } from "../store.js";
import { toast } from "../ui.js";
import { icon } from "../icons.js";
import { applySettings, sfx } from "../fx.js";
import { enablePush, pushSupported } from "../appconfig.js";

export default function settingsView(root) {
  const s = state.settings;
  const toggle = (key, label, sub) => `<label class="row set-row"><span class="grow"><strong>${label}</strong><small>${sub}</small></span><input type="checkbox" class="switch" data-k="${key}" ${s[key] ? "checked" : ""}></label>`;
  root.innerHTML = `
    <a class="back" href="#/me">${icon("back", 18)} Me</a>
    <h1 class="page-title">⚙️ Settings</h1>
    <section class="section"><div class="section-head"><h2>Feel</h2></div><div class="list">
      ${toggle("sound", "Sounds", "Dings for right answers, level-ups and coins")}
      ${toggle("haptics", "Vibration", "A little buzz on answers (phones)")}
      ${toggle("readAloud", "Read questions aloud", "Show a 🔊 button on every question")}
    </div></section>
    <section class="section"><div class="section-head"><h2>Look</h2></div><div class="list">
      <div class="row set-row"><span class="grow"><strong>Theme</strong><small>Light, dark, or match your phone</small></span><span class="seg">${[["", "Auto"], ["light", "Light"], ["dark", "Dark"]].map(([v, l]) => `<button class="${(state.theme || "") === v ? "on" : ""}" data-theme-v="${v}">${l}</button>`).join("")}</span></div>
      <div class="row set-row"><span class="grow"><strong>Text size</strong><small>Make everything bigger or smaller</small></span><span class="seg">${[["s", "A"], ["m", "A"], ["l", "A"], ["xl", "A"]].map(([v, l], i) => `<button class="${s.textSize === v ? "on" : ""}" data-size="${v}" style="font-size:${12 + i * 3}px">${l}</button>`).join("")}</span></div>
      ${toggle("readable", "Easier-to-read text", "More spacing between letters and lines (helps with dyslexia)")}
      ${toggle("reduceMotion", "Reduce motion", "Fewer animations and no confetti")}
    </div></section>
    <section class="section"><div class="section-head"><h2>Notifications</h2></div><div class="list">
      <div class="row set-row"><span class="grow"><strong>Push notifications</strong><small>${state.settings.push ? "On ✅ You'll get reminders and announcements" : pushSupported() ? "Streak reminders, new features, events" : "Add BrainBoro to your Home Screen first (iPhone), then turn this on"}</small></span>${state.settings.push ? "" : `<button class="btn small" id="push">Turn on</button>`}</div>
    </div></section>
    <section class="section"><div class="section-head"><h2>Your data</h2></div><div class="list">
      <button class="row" id="exp"><span class="grow"><strong>Back up my progress</strong><small>Download a file with everything (XP, cards, decks, stats)</small></span></button>
      <label class="row" style="cursor:pointer"><input type="file" accept="application/json" id="imp" hidden><span class="grow"><strong>Restore from a backup</strong><small>Load a backup file</small></span></label>
      <button class="row" id="reset"><span class="grow"><strong style="color:var(--bad)">Reset everything on this device</strong><small>Can't be undone</small></span></button>
    </div></section>`;
  root.querySelectorAll("[data-k]").forEach((el) => (el.onchange = () => {
    s[el.dataset.k] = el.checked;
    save();
    applySettings();
    if (el.dataset.k === "sound" && el.checked) sfx.right();
  }));
  root.querySelectorAll("[data-size]").forEach((b) => (b.onclick = () => {
    s.textSize = b.dataset.size;
    save();
    applySettings();
    settingsView(root);
  }));
  root.querySelectorAll("[data-theme-v]").forEach((b) => (b.onclick = () => {
    state.theme = b.dataset.themeV;
    save();
    dispatchEvent(new Event("brainboro:theme"));
    settingsView(root);
  }));
  root.querySelector("#push")?.addEventListener("click", async () => {
    try {
      await enablePush();
      toast("Notifications on!", { emoji: "🔔" });
      settingsView(root);
    } catch (err) {
      toast(err.message, { emoji: "🔕", ms: 5000 });
    }
  });
  root.querySelector("#exp").onclick = () => {
    const { account, ...rest } = state;
    void account;
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([JSON.stringify(rest)], { type: "application/json" })), download: `brainboro-backup-${new Date().toISOString().slice(0, 10)}.json` });
    a.click();
  };
  root.querySelector("#imp").onchange = async (e) => {
    try {
      const data = JSON.parse(await e.target.files[0].text());
      if (typeof data.xp !== "number" || !data.profile) throw new Error("That isn't a BrainBoro backup.");
      if (!confirm(`Restore this backup (${data.xp} XP)? It replaces the progress on this device.`)) return;
      Object.assign(state, data, { account: state.account });
      save();
      toast("Backup restored", { emoji: "✅" });
      location.hash = "#/";
    } catch (err) {
      toast(err.message, { emoji: "⚠️" });
    }
  };
  root.querySelector("#reset").onclick = () => {
    if (!confirm("Reset ALL progress on this device? This can't be undone.")) return;
    resetAll();
    location.hash = "#/";
    location.reload();
  };
}
