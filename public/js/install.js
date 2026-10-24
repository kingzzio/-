// "Get the app": installs BrainBoro to the home screen (free, no app store).
import { icon } from "./icons.js";

let deferred = null;
addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferred = e;
});
addEventListener("appinstalled", () => (deferred = null));

export const isInstalled = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

export function installCard() {
  if (isInstalled()) return "";
  return `<button class="card banner install-card" data-install style="width:100%;text-align:left"><img src="icons/icon-192.png" alt="" width="42" height="42" style="border-radius:12px;flex:none"><span class="grow"><strong>Get the BrainBoro app</strong><small>Add it to your home screen: free, full screen, works offline</small></span><span class="chev">${icon("chevron")}</span></button>`;
}

export function wireInstall(root) {
  root.querySelectorAll("[data-install]").forEach((b) => (b.onclick = install));
}

async function install() {
  if (deferred) {
    deferred.prompt();
    await deferred.userChoice.catch(() => {});
    deferred = null;
    return;
  }
  const ios = isIOS();
  const wrap = document.createElement("div");
  wrap.className = "sheet-wrap";
  wrap.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><div class="sheet-grab"></div>
    <div class="center"><img src="icons/icon-192.png" alt="" width="72" height="72" style="border-radius:20px;margin:6px auto 10px"><h2>Install BrainBoro</h2></div>
    <ol class="bullets" style="font-size:1rem;line-height:1.6">
      ${ios
        ? `<li>Open this page in <strong>Safari</strong>.</li><li>Tap the <strong>Share</strong> button <span style="font-size:1.1em">⬆️</span> at the bottom.</li><li>Scroll down and tap <strong>Add to Home Screen</strong>.</li><li>Tap <strong>Add</strong>. BrainBoro is now on your home screen like an app.</li>`
        : `<li>Open the browser menu <strong>⋮</strong> (top right in Chrome).</li><li>Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li><li>Tap <strong>Install</strong>. BrainBoro opens full screen like any app, and you can share homework photos straight to it.</li>`}
    </ol>
    <button class="btn big" id="ok">Got it</button></div>`;
  document.body.appendChild(wrap);
  const close = () => wrap.remove();
  wrap.querySelector("#ok").onclick = close;
  wrap.onclick = (e) => e.target === wrap && close();
}
