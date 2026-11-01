// "Check the AI": runs a tiny real request against each AI key and says in plain English what's wrong.
import { esc } from "../ui.js";
import { icon } from "../icons.js";

const NAMES = { anthropic: "Claude", gemini: "Google Gemini", groq: "Groq", openrouter: "OpenRouter" };

export default function aicheck(root) {
  const run = async () => {
    root.innerHTML = `
      <a class="back" href="#/me">${icon("back", 18)} Me</a>
      <h1 class="page-title">Check the AI</h1>
      <p class="lead">Sends "What is 2 + 2?" to each AI key on this site and shows what happened.</p>
      <div id="out"><div class="empty"><div class="spinner"></div><p class="muted small">Asking the AI…</p></div></div>`;
    const out = root.querySelector("#out");
    let data;
    try {
      const res = await fetch("api/status?test=1", { cache: "no-store" });
      data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
    } catch (err) {
      out.innerHTML = `<div class="card warn"><strong>Couldn't reach the server.</strong><p class="small">${esc(err.message)}</p></div>`;
      return;
    }
    const looks = data.lookalikes?.length
      ? `<div class="card warn"><strong>Wrong variable name?</strong><p class="small">Found <code>${data.lookalikes.map(esc).join("</code>, <code>")}</code>, but BrainBoro only reads <code>GEMINI_API_KEY</code>, <code>GROQ_API_KEY</code>, <code>OPENROUTER_API_KEY</code> or <code>ANTHROPIC_API_KEY</code>. Rename it in Vercel → Settings → Environment Variables, then Redeploy.</p></div>`
      : "";
    if (!data.results.length) {
      out.innerHTML = `${looks}<div class="card warn"><strong>No AI key found on the server.</strong>
        <ol class="small" style="margin:8px 0 0;padding-left:20px;line-height:1.6">
          <li>Vercel → your project → <strong>Settings → Environment Variables</strong>.</li>
          <li>Name must be exactly <code>GEMINI_API_KEY</code>. Value = only the key (starts with <code>AIza</code>).</li>
          <li>Make sure <strong>Production</strong> is checked under Environments.</li>
          <li><strong>Deployments → ⋯ on the top one → Redeploy.</strong> Keys only work after a redeploy.</li>
          <li>Come back here and tap <strong>Check again</strong>.</li>
        </ol></div>
        <button class="btn" id="again" style="margin-top:12px">Check again</button>`;
    } else {
      const allOk = data.results.every((r) => r.ok);
      out.innerHTML = `${looks}
        <div class="card banner"><span class="tile-ic" style="--accent:${data.results.some((r) => r.ok) ? "#12a150" : "#e5294f"}">${icon("spark")}</span><span class="grow"><strong>${data.results.some((r) => r.ok) ? (allOk ? "The AI works ✅" : "The AI works (one key has a problem)") : "The AI isn't working ❌"}</strong><small>Tried in this order: ${data.results.map((r) => esc(NAMES[r.name] || r.name)).join(" → ")}</small></span></div>
        <div class="list">${data.results.map((r) => `
          <div class="card">
            <strong>${r.ok ? "✅" : "❌"} ${esc(NAMES[r.name] || r.name)}</strong> <span class="muted small">${esc(r.model)}</span>
            ${r.ok ? `<p class="small">Answered "${esc(r.reply)}" in ${(r.ms / 1000).toFixed(1)}s.</p>` : `<p><strong>Fix:</strong> ${esc(r.hint)}</p><details class="small"><summary>Details${r.status ? ` (error ${r.status})` : ""}</summary><code style="word-break:break-word">${esc(r.detail)}</code></details>`}
          </div>`).join("")}</div>
        <button class="btn" id="again" style="margin-top:12px">Check again</button>`;
    }
    root.querySelector("#again").onclick = run;
  };
  run();
}
