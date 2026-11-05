/* Harold: a hand-drawn line that draws itself on a web page.
   Named for Harold and the Purple Crayon, where the line makes the world.
   Made by Kate Tyson with Claude, Nov 2026, from the front page of nomadfarm (the bed photos site).

   Put this one line on any page, just before </body>:

     <script src="harold.js"></script>

   Settings go on that same tag, all optional:

     data-mode="scroll"        scroll  : the line draws down the page as you scroll, and undraws when you scroll back (default)
                               cursor  : the line trails behind your mouse
                               both    : both at once
     data-color="charcoal"     charcoal (default), crayon (Harold's purple), or any CSS color, like "#c0392b" or "teal"
     data-width="3"            how thick the line is, in pixels
     data-layer="under"        under : the line goes behind your words and pictures (default)
                               over  : the line goes on top of everything
     data-reveal="no"          yes : each looped picture fades in as the line reaches it
     data-trail="fade"         cursor mode only. fade : the line catches up with itself when you stop (default)
                                                 keep : everything you draw stays until you leave the page

   Which things get a loop: every picture (<img>, <video>) bigger than a thumbnail.
   To choose them yourself, add data-harold to the ones you want, and Harold loops only those:
     <img src="me.jpg" data-harold>      <section data-harold>...</section>
   To leave one out: <img src="logo.png" data-harold-skip>
*/
(function () {
  "use strict";
  const tag = document.currentScript;
  const opt = (k, d) => (tag && tag.dataset[k]) || d;
  const COLORS = { charcoal: "#1f1d1b", crayon: "#6a3fa6", purple: "#6a3fa6", pencil: "#55524d" };
  const mode = opt("mode", "scroll");
  const colorName = opt("color", "charcoal");
  const color = COLORS[colorName] || colorName;
  const isCrayon = colorName === "crayon" || colorName === "purple";
  const width = parseFloat(opt("width", isCrayon ? "4" : "3"));
  const layer = opt("layer", "under");
  const reveal = opt("reveal", "no") === "yes";
  const trail = opt("trail", "fade");
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const NS = "http://www.w3.org/2000/svg";

  /* ---------- a seeded wobble, so the line is the same every visit ---------- */
  function seeded(str) {
    let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
    return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; };
  }

  /* ---------- the paper: one SVG laid over the whole page ---------- */
  function makeSvg(id, z) {
    const svg = document.createElementNS(NS, "svg");
    svg.id = id;
    svg.setAttribute("aria-hidden", "true");
    Object.assign(svg.style, { position: "absolute", top: "0", left: "0", overflow: "visible", pointerEvents: "none", zIndex: z });
    // a little roughness on the edges, so it reads as charcoal or wax, not a vector
    svg.innerHTML = `<defs><filter id="${id}-rough" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="${isCrayon ? 0.9 : 0.6}" numOctaves="2" seed="7"/>
        <feDisplacementMap in="SourceGraphic" scale="${isCrayon ? 2.6 : 1.6}"/></filter></defs>
      <g filter="url(#${id}-rough)" fill="none" stroke="${color}" stroke-linecap="round" stroke-linejoin="round"></g>`;
    document.body.appendChild(svg);
    return svg;
  }
  const strokes = (g) => {
    const main = document.createElementNS(NS, "path"), grain = document.createElementNS(NS, "path");
    main.setAttribute("stroke-width", width); main.setAttribute("opacity", isCrayon ? .85 : .9);
    grain.setAttribute("stroke-width", Math.max(1, width * .43)); grain.setAttribute("opacity", isCrayon ? .45 : .35);
    g.append(main, grain);
    return [main, grain];
  };
  const toD = (pts, jitter) => "M" + pts.map(p => (p[0] + jitter()).toFixed(1) + " " + (p[1] + jitter() + (jitter.dy || 0)).toFixed(1)).join(" L");

  /* ======================= scroll mode ======================= */
  function scrollMode() {
    const svg = makeSvg("harold-line", layer === "over" ? "2147483000" : "-1");
    const g = svg.querySelector("g");
    const [main, grain] = strokes(g);
    const tip = document.createElementNS(NS, "circle");
    tip.setAttribute("r", width * 1.1); tip.setAttribute("fill", color);
    svg.appendChild(tip);
    let PTS = [], CUM = [], MAXY = [], TOTAL = 0, ITEMS = [], shown = 0;

    function targets() {
      const chosen = [...document.querySelectorAll("[data-harold]")];
      const list = chosen.length ? chosen : [...document.querySelectorAll("img, video, picture, svg:not(#harold-line):not(#harold-cursor)")]
        .filter(e => !e.closest("picture") || e.tagName === "PICTURE");
      return list
        .filter(e => !e.closest("[data-harold-skip]") && !e.closest("svg#harold-line"))
        .filter(e => { if (e.tagName === "svg" && e.closest("svg") !== e) return false; return true; })
        .filter(e => { const s = getComputedStyle(e); return s.position !== "fixed" && s.display !== "none" && s.visibility !== "hidden"; })
        .map(e => { const r = e.getBoundingClientRect(); return { e, x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; })
        .filter(t => chosen.length ? t.w > 0 && t.h > 0 : t.w >= 80 && t.h >= 80)
        .sort((a, b) => a.y - b.y || a.x - b.x)
        .slice(0, 80);
    }

    function build() {
      svg.setAttribute("height", 0); svg.setAttribute("width", 0);
      const W = document.documentElement.clientWidth;
      const H = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      const vh = innerHeight / 100;
      const r = seeded("harold" + location.pathname);
      PTS = []; ITEMS = [];

      // the hand: a slow drift plus a tiny tremble
      const ph = [r() * 6.3, r() * 6.3, r() * 6.3];
      const wob = t => Math.sin(t / 97 + ph[0]) * 2.2 + Math.sin(t / 31 + ph[1]) * 1 + Math.sin(t / 7.3 + ph[2]) * .35;
      let travelled = 0;
      const clampX = x => Math.min(W - 10, Math.max(10, x));
      function push(x, y) {
        const p = PTS[PTS.length - 1];
        if (p) travelled += Math.hypot(x - p[0], y - p[1]);
        PTS.push([x + wob(travelled), y + wob(travelled + 500) * .6]);
      }
      // an S-curve from where the line is to (x1, y1); long stretches meander through a loose midpoint
      function lineTo(x1, y1, sway = 0, wander = true) {
        const [x0, y0] = PTS[PTS.length - 1];
        if (wander && Math.hypot(x1 - x0, y1 - y0) > 240) {
          const mx = clampX((x0 + x1) / 2 + (r() - .5) * W * .35);
          const my = (y0 + y1) / 2 + (r() - .5) * Math.abs(y1 - y0) * .2;
          lineTo(mx, my, sway * .5 + (r() - .5) * 120, false);
          lineTo(x1, y1, (r() - .5) * 120, false);
          return;
        }
        const dy = y1 - y0, dx = x1 - x0;
        const c1 = [x0 + dx * .3 + sway, y0 + dy * .45], c2 = [x1 - dx * .3 - sway, y1 - dy * .45];
        const n = Math.max(4, Math.ceil(Math.hypot(dx, dy) / 6));
        for (let i = 1; i <= n; i++) {
          const t = i / n, u = 1 - t;
          push(clampX(u*u*u*x0 + 3*u*u*t*c1[0] + 3*u*t*t*c2[0] + t*t*t*x1), u*u*u*y0 + 3*u*u*t*c1[1] + 3*u*t*t*c2[1] + t*t*t*y1);
        }
      }
      // round a box, the way you'd frame something by hand: a little more than once, a little wider each time
      function loopAround(cx, cy, hw, hh, clockwise, turns) {
        const steps = Math.ceil((hw + hh) * 4 * turns / 6);
        const sq = (v, e) => Math.sign(v) * Math.pow(Math.abs(v), e);
        lineTo(cx, cy - hh, (clockwise ? 1 : -1) * hw * .6);
        for (let i = 1; i <= steps; i++) {
          const t = i / steps * turns, a = -Math.PI / 2 + (clockwise ? 1 : -1) * t * Math.PI * 2;
          const grow = 1 + .035 * t;
          push(cx + sq(Math.cos(a), .25) * hw * grow, cy + sq(Math.sin(a), .25) * hh * grow);
        }
      }

      const T = targets();
      const firstY = T.length ? T[0].y : H * .3;
      const y0 = Math.max(24, Math.min(firstY - 140, 55 * vh));
      PTS.push([W * .42, y0]); push(W * .42, y0);

      T.forEach((t, i) => {
        const pad = Math.max(14, Math.min(26, Math.min(t.w, t.h) * .08));
        const cx = t.x + t.w / 2, cy = t.y + t.h / 2;
        const hw = Math.min(t.w / 2 + pad, cx - 6, W - cx - 6), hh = t.h / 2 + pad;
        if (hw < 20) return;
        const left = i % 2 === 0;
        lineTo(cx, cy - hh - 20, (left ? 1 : -1) * hw * .3);
        const at = PTS.length - 1;
        // one and a half times round, so the line leaves from the bottom instead of crossing the picture
        loopAround(cx, cy, hw, hh, left, 1.5 + (r() - .5) * .06);
        ITEMS.push({ e: t.e, at });
      });
      lineTo(W * (.3 + r() * .4), H - Math.min(60, 8 * vh), (r() - .5) * 160);

      CUM = [0]; MAXY = [PTS[0][1]];
      for (let i = 1; i < PTS.length; i++) {
        CUM.push(CUM[i - 1] + Math.hypot(PTS[i][0] - PTS[i - 1][0], PTS[i][1] - PTS[i - 1][1]));
        MAXY.push(Math.max(MAXY[i - 1], PTS[i][1]));
      }
      TOTAL = CUM[CUM.length - 1];
      const gr = seeded("grain"), j = () => (gr() - .5) * 2.4; j.dy = 1.1;
      main.setAttribute("d", toD(PTS, () => 0));
      grain.setAttribute("d", toD(PTS, j));
      [main, grain].forEach(p => p.style.strokeDasharray = `${TOTAL + 2} ${TOTAL + 2}`);
      svg.setAttribute("width", W); svg.setAttribute("height", H);
      ITEMS.forEach(it => {
        it.len = CUM[it.at];
        if (reveal) it.e.style.transition = (it.e.style.transition ? it.e.style.transition + ", " : "") + "opacity .6s ease";
      });
      if (calm) shown = TOTAL;
      shown = Math.min(shown, TOTAL);
    }

    // how far the line should be drawn: up to a point a little past the middle of the screen
    function target() {
      const doc = document.documentElement;
      if (calm || scrollY + innerHeight >= doc.scrollHeight - 4) return TOTAL;
      const y = scrollY + innerHeight * .62;
      let lo = 0, hi = MAXY.length - 1;
      while (lo < hi) { const m = (lo + hi) >> 1; if (MAXY[m] < y) lo = m + 1; else hi = m; }
      return CUM[lo];
    }
    function frame() {
      if (PTS.length) {
        const want = target();
        shown += (want - shown) * .12;
        if (Math.abs(want - shown) < .5) shown = want;
        [main, grain].forEach(p => p.style.strokeDashoffset = TOTAL + 2 - shown);
        let lo = 0, hi = CUM.length - 1;
        while (lo < hi) { const m = (lo + hi) >> 1; if (CUM[m] < shown) lo = m + 1; else hi = m; }
        const p = PTS[lo]; tip.setAttribute("cx", p[0]); tip.setAttribute("cy", p[1]);
        tip.style.opacity = shown >= TOTAL - 1 || shown < 1 ? 0 : 1;
        if (reveal) ITEMS.forEach(it => it.e.style.opacity = shown >= it.len - 2 ? 1 : 0);
      }
      requestAnimationFrame(frame);
    }

    // redraw when the page changes shape (pictures loading, the window resizing, fonts arriving)
    let timer = 0, lastW = 0, lastH = 0;
    const later = () => { clearTimeout(timer); timer = setTimeout(() => {
      const W = document.documentElement.clientWidth, H = document.body.scrollHeight;
      if (W === lastW && Math.abs(H - lastH) < 2) return; lastW = W; lastH = H; build(); }, 150); };
    addEventListener("resize", later);
    addEventListener("load", later);
    if (window.ResizeObserver) new ResizeObserver(later).observe(document.body);
    document.querySelectorAll("img").forEach(im => im.complete || im.addEventListener("load", later));
    document.fonts && document.fonts.ready.then(later);
    build(); lastW = document.documentElement.clientWidth; lastH = document.body.scrollHeight;
    requestAnimationFrame(frame);
    return { redraw: () => { lastW = 0; later(); } };
  }

  /* ======================= cursor mode ======================= */
  function cursorMode() {
    if (calm || !matchMedia("(pointer: fine)").matches) return;   // phones and tablets: nothing to follow
    const svg = makeSvg("harold-cursor", "2147483001");
    svg.style.position = "fixed"; svg.style.width = "100vw"; svg.style.height = "100vh";
    const g = svg.querySelector("g");
    const r = seeded("cursor" + location.pathname);
    const ph = [r() * 6.3, r() * 6.3];
    // points are kept in page coordinates, so what you draw stays where you drew it when you scroll
    let pts = [], travelled = 0, idle = 0, drawn = [];
    const MAX = 1400;   // how long the trail is, in pixels
    addEventListener("pointermove", e => {
      if (e.pointerType !== "mouse") return;
      const x = e.clientX + scrollX, y = e.clientY + scrollY;
      const p = pts[pts.length - 1];
      if (p && Math.hypot(x - p.x, y - p.y) < 3) return;
      // fill in fast moves so the curve stays smooth
      const n = p ? Math.min(30, Math.ceil(Math.hypot(x - p.x, y - p.y) / 6)) : 1;
      for (let i = 1; i <= n; i++) {
        const qx = p ? p.x + (x - p.x) * i / n : x, qy = p ? p.y + (y - p.y) * i / n : y;
        const last = pts[pts.length - 1];
        const d = last ? Math.hypot(qx - last.x, qy - last.y) : 0;
        travelled += d;
        pts.push({ x: qx, y: qy, w: Math.sin(travelled / 41 + ph[0]) * 1.3 + Math.sin(travelled / 9 + ph[1]) * .4, len: travelled });
      }
      idle = 0;
    });
    document.addEventListener("pointerleave", () => { if (trail !== "keep") pts = []; });
    let main, grain;
    function frame() {
      idle++;
      if (trail !== "keep") {
        // the tail catches up: faster the longer the mouse rests
        const keep = idle > 20 ? Math.max(0, MAX - (idle - 20) * 28) : MAX;
        while (pts.length && travelled - pts[0].len > keep) pts.shift();
        if (idle > 20 && keep === 0) pts = [];
      }
      if (!main) [main, grain] = strokes(g);
      if (pts.length > 1) {
        const sx = scrollX, sy = scrollY;
        const line = pts.map(p => [p.x - sx + p.w, p.y - sy + p.w * .6]);
        main.setAttribute("d", toD(line, () => 0));
        const gr = seeded("g"), j = () => (gr() - .5) * 2.2; j.dy = 1;
        grain.setAttribute("d", toD(line, j));
      } else { main.setAttribute("d", ""); grain.setAttribute("d", ""); }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function start() {
    const api = {};
    if (mode === "scroll" || mode === "both") Object.assign(api, scrollMode());
    if (mode === "cursor" || mode === "both") cursorMode();
    window.Harold = api;
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
