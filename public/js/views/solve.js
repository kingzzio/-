// Solve: snap or type any homework problem → step-by-step whiteboard walkthrough + a "your turn" problem.
import { state, save } from "../store.js";
import { esc, toast, post, readImage, aiAvailable } from "../ui.js";
import { icon } from "../icons.js";
import { openCheat } from "./cheats.js";

export default function solve(root) {
  const pre = JSON.parse(sessionStorage.getItem("brainboro:solve") || "null");
  sessionStorage.removeItem("brainboro:solve");
  let image = null;
  let close = null;
  root.innerHTML = `
    <h1 class="page-title">Solve</h1>
    <p class="lead">Snap any homework problem. Boro breaks it down step by step on the whiteboard, then gives you one to try yourself.</p>
    <label class="card center" id="drop" style="cursor:pointer;padding:26px 16px;border-style:dashed;border-width:2px">
      <input type="file" accept="image/*" capture="environment" id="file" hidden>
      <div id="shot"><div class="big-ic" style="background:var(--brand-soft);color:var(--brand)">${icon("camera", 32)}</div><strong>Take a photo of the problem</strong><p class="small muted" style="margin:4px 0 0">or upload a screenshot</p></div>
    </label>
    <div class="divider">or type it</div>
    <label class="field"><span>Problem</span><textarea id="txt" rows="3" maxlength="2000" placeholder="e.g. Solve 3(x − 4) = 2x + 5">${esc(pre?.problem || "")}</textarea></label>
    <button class="btn big glow" id="go">${icon("spark", 20)} Solve it</button>
    <p class="tiny muted center">Boro teaches the steps so you can do the next one yourself. For essays it helps you plan, but you do the writing.</p>`;

  root.querySelector("#file").onchange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      image = await readImage(f);
      root.querySelector("#shot").innerHTML = `<img src="${image.preview}" alt="Your problem" style="max-height:220px;border-radius:14px;margin:0 auto">`;
    } catch (err) {
      toast(err.message, { emoji: "⚠️" });
    }
  };

  root.querySelector("#go").onclick = async () => {
    const problem = root.querySelector("#txt").value.trim();
    if (!problem && !image) return toast("Snap a photo or type the problem first.", { emoji: "✍️" });
    if (!(await aiAvailable())) return toast("AI isn't switched on for this site yet.", { emoji: "🔌" });
    const btn = root.querySelector("#go");
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner" style="width:20px;height:20px;margin:0;border-width:3px"></span> Boro is working it out…`;
    try {
      const data = await (await post("api/solve", { problem, image: image && { mediaType: image.mediaType, data: image.data }, course: pre?.course, grade: state.profile.grade })).json();
      state.stats.cheatCodes++;
      save();
      close = openCheat({ id: "", trick: data.title || "Solve", q: problem || "Your problem", image: image?.preview, choices: [], a: -1, answer: data.answer, tryNext: data.try_next, steps: data.steps });
    } catch (err) {
      if (err.premium) {
        toast(err.message, { emoji: "👑", ms: 4000 });
        location.hash = "#/premium";
      } else toast(err.message, { emoji: "⚠️" });
    } finally {
      btn.disabled = false;
      btn.innerHTML = `${icon("spark", 20)} Solve it`;
    }
  };
  return () => close?.();
}
