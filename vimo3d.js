/* Vimo 3D: de V-mascotte van Vanerum als klein 3D-figuurtje.
   Gebruik:  import { createVimo } from "./vimo3d.js";
             const v = createVimo(element, { lines: [...], onTap: () => ({move, text}) });
   v.play(beweging, tekst) · v.say(tekst) · v.sequence([{move, text}], klaar) · v.stop()
   Bewegingen: hoi, wijzen, springen, knieen, balans, draaien, denken (en kubus als er een kubus is). */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const RAD = Math.PI / 180;
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const DEFAULT_LINES = ["Hoi! Ik ben Vimo!", "Bewegen maakt je hoofd fris!", "Kom je mee springen?", "Tik nog eens op mij!", "Ik ben de V van Vanerum!", "Wie kan het hoogst springen?"];
let STYLE_DONE = false;
function addStyle() {
  if (STYLE_DONE) return; STYLE_DONE = true;
  const st = document.createElement("style");
  st.textContent = `.vimo3d{position:relative;touch-action:manipulation}.vimo3d canvas{display:block;width:100%;height:100%;outline:none}
.vimo3d-bubble{position:absolute;left:0;top:0;z-index:3;background:#fff;color:#1e1e1e;border:2px solid #1e1e1e;border-radius:.7em;padding:.4em .75em;font-family:"Neue Montreal",Arial,sans-serif;font-weight:700;letter-spacing:.03em;line-height:1.2;pointer-events:none;max-width:16em;width:max-content;white-space:normal;box-shadow:0 2px 0 rgba(30,30,30,.08)}
.vimo3d-bubble[hidden]{display:none!important}
.vimo3d-bubble::after{content:"";position:absolute;width:.6em;height:.6em;background:#fff;border-right:2px solid #1e1e1e;border-bottom:2px solid #1e1e1e}
.vimo3d-bubble.up::after{left:var(--tx,50%);bottom:-.36em;transform:translateX(-50%) rotate(45deg)}
.vimo3d-bubble.left::after{right:-.36em;top:1em;transform:rotate(-45deg)}
.vimo3d-bubble.right::after{left:-.36em;top:1em;transform:rotate(135deg)}`;
  document.head.appendChild(st);
}

/* ---------- gedeelde bouwstenen ---------- */
const std = (c, r = .45) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: 0 });
function blobTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d"), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, "rgba(30,30,30,.32)"); r.addColorStop(1, "rgba(30,30,30,0)"); g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

function buildVimo() {
  const M = { geel: std(0xfbb900, .38), donker: std(0x2e3033, .42), wit: std(0xffffff, .55), ink: std(0x1e1e1e, .5),
    hull: new THREE.MeshBasicMaterial({ color: 0x1e1e1e, side: THREE.BackSide }), blos: std(0xf2a6b8, .7), tong: std(0xef7f9c, .6) };
  const SPH = new THREE.SphereGeometry(1, 28, 18);
  const mesh = (g, m, parent) => { const o = new THREE.Mesh(g, m); if (parent) parent.add(o); return o; };
  const P = (x, y) => new THREE.Vector2(x / 100, -y / 100), D = .36;
  const prism = (pts, mat, parent) => {
    const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([x, y]) => P(x, y))), { depth: D, bevelEnabled: true, bevelThickness: .022, bevelSize: .016, bevelSegments: 3, curveSegments: 1 });
    g.translate(0, 0, -D / 2); return mesh(g, mat, parent);
  };
  const char = new THREE.Group(); char.scale.setScalar(.8);
  const legs = new THREE.Group(); char.add(legs);
  const body = new THREE.Group(); char.add(body);
  const squash = new THREE.Group(); body.add(squash);
  prism([[-124, -175], [-83, -175], [0.8, -3.3], [36, 0], [-36, 0]], M.geel, squash);
  prism([[83, -175], [124, -175], [36, 0], [0.8, -3.3]], M.donker, squash);
  const face = new THREE.Group(); face.position.z = D / 2 + .024; squash.add(face);
  const ell = (parent, mat, x, y, z, sx, sy, sz) => { const m = mesh(SPH, mat, parent); m.position.set(x, y, z); m.scale.set(sx, sy, sz); return m; };
  [-1, 1].forEach(s => { const b = mesh(new THREE.CircleGeometry(1, 24), M.blos, face); b.position.set(s * .31, .27, .004); b.scale.set(.07, .04, 1); });
  const eyes = [-.426, .426].map(ex => {
    const g = new THREE.Group(); g.position.set(ex, .54, 0); face.add(g);
    const ring = ell(g, M.ink, 0, 0, 0, .14, .178, .025), w = ell(g, M.wit, 0, 0, .006, .115, .15, .035);
    const p = ell(g, M.ink, 0, 0, .03, .065, .095, .022), s = ell(g, M.wit, 0, 0, .05, .024, .024, .012);
    const hg = new THREE.Group(); hg.position.y = -.03; g.add(hg);
    mesh(new THREE.TorusGeometry(.1, .032, 8, 28, Math.PI), M.wit, hg);
    mesh(new THREE.TorusGeometry(.1, .018, 8, 28, Math.PI), M.ink, hg).position.z = .02;
    return { ring, w, p, s, hg };
  });
  const mouth = {};
  mouth.smile = new THREE.Group(); face.add(mouth.smile); mouth.smile.position.set(0, .16, 0); mouth.smile.rotation.z = Math.PI;
  mesh(new THREE.TorusGeometry(.11, .032, 8, 28, Math.PI), M.wit, mouth.smile);
  mesh(new THREE.TorusGeometry(.11, .018, 8, 28, Math.PI), M.ink, mouth.smile).position.z = .02;
  mouth.open = new THREE.Group(); face.add(mouth.open); mouth.open.position.set(0, .17, 0);
  mesh(new THREE.CircleGeometry(.145, 28, Math.PI, Math.PI), M.wit, mouth.open);
  mesh(new THREE.CircleGeometry(.12, 28, Math.PI, Math.PI), M.ink, mouth.open).position.z = .006;
  const tg = mesh(new THREE.CircleGeometry(1, 20), M.tong, mouth.open); tg.position.set(0, -.08, .012); tg.scale.set(.05, .028, 1);
  mouth.o = new THREE.Group(); face.add(mouth.o); mouth.o.position.set(0, .12, 0);
  ell(mouth.o, M.wit, 0, 0, 0, .072, .092, .02); ell(mouth.o, M.ink, 0, 0, .012, .05, .07, .02);
  const hose = (parent, r) => ({ w: mesh(new THREE.BufferGeometry(), M.wit, parent), b: mesh(new THREE.BufferGeometry(), M.hull, parent), r });
  const setHose = (H, a, j, e) => {
    const c = new THREE.Vector3(2 * j.x - (a.x + e.x) / 2, 2 * j.y - (a.y + e.y) / 2, 2 * j.z - (a.z + e.z) / 2);
    const curve = new THREE.QuadraticBezierCurve3(a, c, e);
    H.w.geometry.dispose(); H.b.geometry.dispose();
    H.w.geometry = new THREE.TubeGeometry(curve, 16, H.r, 8); H.b.geometry = new THREE.TubeGeometry(curve, 16, H.r * 1.55, 8);
  };
  const armL = hose(body, .026), armR = hose(body, .026), legL = hose(legs, .028), legR = hose(legs, .028);
  const glove = side => {
    const g = new THREE.Group(); body.add(g);
    mesh(SPH, M.wit, g).scale.setScalar(.1); mesh(SPH, M.hull, g).scale.setScalar(.125);
    const t = mesh(SPH, M.wit, g); t.scale.setScalar(.045); t.position.set(side * .075, .06, .03);
    const th = mesh(SPH, M.hull, g); th.scale.setScalar(.06); th.position.copy(t.position);
    return g;
  };
  const gloveL = glove(-1), gloveR = glove(1);
  const shoe = () => { const g = new THREE.Group(); legs.add(g); mesh(SPH, M.wit, g).scale.set(.17, .09, .22); mesh(SPH, M.hull, g).scale.set(.195, .11, .245); return g; };
  const shoeL = shoe(), shoeR = shoe();
  const limb = (root, a1, a2, L1, L2) => {
    const j = [root[0] + Math.sin(a1 * RAD) * L1, root[1] + Math.cos(a1 * RAD) * L1];
    return { a: root, j, e: [j[0] + Math.sin((a1 + a2) * RAD) * L2, j[1] + Math.cos((a1 + a2) * RAD) * L2] };
  };
  const V3 = (p, dy = 0, z = 0) => new THREE.Vector3(p[0] / 100, -(p[1] + dy) / 100, z);
  function draw(p, eyeOpen, X, Y) {
    const ll = limb([-17, 0], p.lL1, p.lL2, 34, 34), rl = limb([17, 0], p.rL1, p.rL2, 34, 34);
    const hipY = -9 - Math.max(ll.e[1], rl.e[1]) - p.lift;
    char.position.set(X, Y, 0); char.rotation.y = (p.spin || 0) * RAD;
    setHose(legL, V3(ll.a, hipY), V3(ll.j, hipY, .02), V3(ll.e, hipY, .04));
    setHose(legR, V3(rl.a, hipY), V3(rl.j, hipY, .02), V3(rl.e, hipY, .04));
    shoeL.position.copy(V3([ll.e[0] - 8, ll.e[1]], hipY, .1)); shoeR.position.copy(V3([rl.e[0] + 8, rl.e[1]], hipY, .1));
    body.position.set(0, -hipY / 100, 0); body.rotation.z = -p.rot * RAD; squash.scale.y = p.sq;
    const shY = -62 * p.sq;
    const al = limb([-64, shY], p.lA1, p.lA2, 30, 30), ar = limb([64, shY], p.rA1, p.rA2, 30, 30);
    setHose(armL, V3(al.a), V3(al.j, 0, .04), V3(al.e, 0, .08)); setHose(armR, V3(ar.a), V3(ar.j, 0, .04), V3(ar.e, 0, .08));
    gloveL.position.copy(V3(al.e, 0, .08)); gloveR.position.copy(V3(ar.e, 0, .08));
    const happy = p.happy > .5;
    for (const E of eyes) {
      E.ring.visible = E.w.visible = E.p.visible = !happy; E.s.visible = !happy && eyeOpen > .5; E.hg.visible = happy;
      E.ring.scale.y = .178 * eyeOpen; E.w.scale.y = .15 * eyeOpen; E.p.scale.y = .095 * eyeOpen;
      E.p.position.set(p.look * .04, p.lookY * .03 + .01, .03); E.s.position.set(p.look * .04 - .025, p.lookY * .03 + .045, .05);
    }
    mouth.smile.visible = p.mouth === "smile"; mouth.open.visible = p.mouth === "open"; mouth.o.visible = p.mouth === "o";
    return hipY;
  }
  return { char, body, squash, gloveL, gloveR, shoeL, shoeR, draw };
}

/* ---------- bewegingen (zelfde systeem als de 2D-versie) ---------- */
const NUM = ["x", "g", "lift", "rot", "sq", "spin", "lA1", "lA2", "rA1", "rA2", "lL1", "lL2", "rL1", "rL2", "look", "lookY"];
const DISC = ["mouth", "happy", "say"];
const BASE = { x: 320, g: 395, lift: 0, rot: 0, sq: 1, spin: 0, lA1: -25, lA2: 15, rA1: 25, rA2: -15, lL1: -9, lL2: 0, rL1: 9, rL2: 0, look: 0, lookY: 0, mouth: "smile", happy: 0, say: "" };
const CROUCH = { lL1: -45, lL2: 50, rL1: 45, rL2: -50, sq: .9 }, STAND = { lL1: -9, lL2: 0, rL1: 9, rL2: 0, sq: 1 };
const AIR = { lL1: -20, lL2: 28, rL1: 20, rL2: -28, sq: 1.06 }, UP = { lA1: -148, lA2: -8, rA1: 148, rA2: 8 };
const CHEER = { lA1: -128, lA2: -38, rA1: 128, rA2: 38 }, DOWN = { lA1: -25, lA2: 15, rA1: 25, rA2: -15 }, BACK = { lA1: -40, lA2: 0, rA1: 40, rA2: 0 };
const A = (...o) => Object.assign({}, ...o);
function buildMoves(onCube) {
  const M = {
    idle: { loop: true, frames: [[1500, { sq: 1.025, rot: -2, lA1: -21, rA1: 29, look: -.35 }], [1500, { sq: 1, rot: 2, lA1: -29, rA1: 21, look: .35 }]] },
    praten: { frames: [[320, { rA1: 72, rA2: -58, rot: 3, look: .3, mouth: "open" }], [380, { mouth: "smile", rot: -2 }], [380, { mouth: "open", rot: 2 }], [380, { mouth: "smile", rot: -1 }], [380, { mouth: "open", rot: 1 }], [2600, { mouth: "smile", rot: 0 }], [420, A(DOWN, { look: 0 })]] },
    denken: { loop: true, frames: [[450, { rA1: -10, rA2: -100, lookY: -1, look: .5, mouth: "o" }], [800, { rot: -3, look: .2 }], [800, { rot: 2, look: .7 }]] },
    hoi: { frames: [[380, { rA1: 145, rA2: 28, mouth: "open", happy: 1, look: .3, say: "Hoi! Ik ben Vimo!" }], [260, { rA2: -22, rot: 2 }], [260, { rA2: 28, rot: -1 }], [260, { rA2: -22, rot: 2 }], [260, { rA2: 28, rot: -1 }], [260, { rA2: -22, rot: 2 }], [260, { rA2: 28, rot: 0 }], [900, {}], [400, A(DOWN, { mouth: "smile", happy: 0, look: 0, say: "" })]] },
    wijzen: { frames: [[420, { rA1: 93, rA2: -3, rot: 5, look: 1, lookY: .2, mouth: "open", say: "Kijk eens!" }], [1800, { lA1: -35 }], [420, A(DOWN, { rot: 0, look: 0, lookY: 0, mouth: "smile", say: "" })]] },
    springen: { rep: 2, frames: [[260, A(CROUCH, BACK, { say: "Spring mee!" })], [320, A(AIR, UP, { lift: 90, mouth: "open", happy: 1 }), "out"], [320, A(STAND, { lift: 0 }), "in"], [180, A(CROUCH, { sq: .93 })], [320, A(STAND, CHEER, { say: "Joepie!" })], [380, {}]], end: [[400, A(DOWN, { mouth: "smile", happy: 0, say: "" })]] },
    knieen: { rep: 3, frames: [[560, { lA1: -90, lA2: 0, rA1: 90, rA2: 0, lL1: -74, lL2: 68, rL1: 74, rL2: -68, sq: .95, mouth: "o", say: "{n}!" }], [560, A(STAND, { mouth: "smile" })]], end: [[450, A(CHEER, { happy: 1, mouth: "open", say: "Goed zo!" })], [900, {}], [400, A(DOWN, { happy: 0, mouth: "smile", say: "" })]] },
    balans: { frames: [[500, { rL1: 62, rL2: -95, lL1: -2, lA1: -96, lA2: 8, rA1: 96, rA2: -8, mouth: "o", say: "Kun jij dit ook?" }], [700, { rot: 6, look: -.4 }], [700, { rot: -6, look: .4 }], [700, { rot: 4, mouth: "smile" }], [500, { rot: 0, look: 0 }], [400, A(STAND, DOWN, { say: "" })]] },
    draaien: { frames: [[300, A({ lift: 14 }, UP, { mouth: "open", happy: 1, say: "Draaien maar!" })], [900, { spin: 360 }, "lin"], [320, A({ lift: 0 }, DOWN, { mouth: "smile", happy: 0, say: "" })]] }
  };
  if (onCube) {
    const mid = { x: (320 + onCube.x) / 2, g: (395 + onCube.g) / 2 };
    M.kubus = { frames: [
      [340, A(CROUCH, BACK, { look: 1, say: "Hup, erop!" })], [380, A(AIR, UP, mid, { lift: 120, mouth: "open" }), "out"], [380, A(STAND, onCube, { lift: 0 }), "in"],
      [180, A(CROUCH, { sq: .92 })], [380, A(STAND, CHEER, { look: 0, happy: 1, say: "Ik sta op de kubus!" })], [1300, {}],
      [320, A(CROUCH, BACK, { happy: 0, mouth: "smile", look: -1, say: "" })], [380, A(AIR, UP, mid, { lift: 120, mouth: "open" }), "out"],
      [380, A(STAND, { x: 320, g: 395, lift: 0 }), "in"], [180, A(CROUCH, { sq: .92 })], [350, A(STAND, DOWN, { look: 0, mouth: "smile" })]] };
  }
  const build = (frames, st) => { let prev = A(st); return frames.map(([d, p, e]) => { prev = A(prev, p); return { d, p: prev, e: e || "io" }; }); };
  for (const k in M) { const m = M[k]; m.abs = build(m.frames, BASE); m.rep = m.rep || 1; if (m.end) m.endAbs = build(m.end, m.abs[m.abs.length - 1].p); }
  return M;
}
const EASE = { io: t => .5 - .5 * Math.cos(Math.PI * t), lin: t => t, out: t => Math.sin(t * Math.PI / 2), in: t => 1 - Math.cos(t * Math.PI / 2) };

/* ---------- createVimo ----------
   opties: cube: {glb: ArrayBuffer} | false · lines: [tekst] · onTap(): {move, text} | null · autoTalk: ms · fontSize: css · fit: "solo" | "stage" */
export function createVimo(el, o = {}) {
  addStyle();
  el.classList.add("vimo3d");
  if (getComputedStyle(el).position === "static") el.style.position = "relative";
  const stage = o.fit === "stage" || !!o.cube;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  el.appendChild(renderer.domElement);
  renderer.domElement.setAttribute("role", "img"); renderer.domElement.setAttribute("aria-label", "Vimo, de mascotte van Vanerum. Tik op hem en hij zegt iets.");
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .55;
  const sun = new THREE.DirectionalLight(0xffffff, 2.2); sun.position.set(4, 8, 6); scene.add(sun, new THREE.AmbientLight(0xffffff, .35));
  const blob = blobTexture();
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.6, .9), new THREE.MeshBasicMaterial({ map: blob, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = .002; scene.add(shadow);
  const V = buildVimo(); scene.add(V.char);
  const homeX = stage ? -1.4 : 0, CUBE_X = 1.42, CUBE_K = 2.4, CUBE_TOP = .4014 * CUBE_K;
  let onCube = null;
  if (o.cube && o.cube.glb) {
    onCube = { x: 320 + (CUBE_X - homeX) * 100, g: 395 - CUBE_TOP * 100 };
    new GLTFLoader().parse(o.cube.glb, "", g => {
      const m = g.scene; m.scale.setScalar(CUBE_K); m.rotation.y = -Math.PI / 2; m.position.set(CUBE_X, CUBE_TOP / 2, -.05); scene.add(m);
      const sh = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.5), new THREE.MeshBasicMaterial({ map: blob, transparent: true, depthWrite: false }));
      sh.rotation.x = -Math.PI / 2; sh.position.set(CUBE_X + .08, .001, 0); scene.add(sh); dirty = true;
    }, e => console.error(e));
  }
  const MOVES = buildMoves(onCube);
  const camera = new THREE.PerspectiveCamera(28, 1, .1, 100);
  const target = stage ? new THREE.Vector3(0, 1.4, 0) : new THREE.Vector3(0, 1.25, 0);
  function frameCam() {
    const w = el.clientWidth || 1, h = el.clientHeight || 1; camera.aspect = w / h;
    const needH = stage ? 4.2 : 3.0, needW = stage ? 6.2 : 2.6;
    const vfov = 28 * RAD, hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
    const d = Math.max(needH / 2 / Math.tan(vfov / 2), needW / 2 / Math.tan(hfov / 2));
    camera.position.set(0, target.y + d * Math.sin(.12), d * Math.cos(.12)); camera.lookAt(target); camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  new ResizeObserver(() => { frameCam(); dirty = true; }).observe(el); frameCam();

  const bubble = document.createElement("div"); bubble.className = "vimo3d-bubble"; bubble.hidden = true;
  if (o.fontSize) bubble.style.fontSize = o.fontSize;
  el.appendChild(bubble);

  let cur = A(BASE), from, seg, segStart, move, name, list, repN, phase, override = "", queue = [], onDone = null;
  let nextBlink = 0, blinkEnd = 0, raf = 0, visible = true, dirty = true;
  function startSeg(i, now) { seg = i; segStart = now; from = A(cur); for (const k of DISC) cur[k] = list[i].p[k]; }
  function start(n, text, now = performance.now()) {
    if (!MOVES[n]) n = "hoi";
    move = MOVES[n]; name = n; cur.spin = cur.spin % 360; repN = 1; phase = "main"; list = move.abs; override = text || ""; startSeg(0, now); wake();
  }
  function finished(now) {
    if (queue.length) { const q = queue.shift(); start(q.move, q.text, now); return; }
    start("idle", "", now); const cb = onDone; onDone = null; if (cb) cb();
  }
  function step(now) {
    const s = list[seg], t = Math.min(1, (now - segStart) / s.d), e = EASE[s.e](t);
    for (const k of NUM) { let v = from[k] + (s.p[k] - from[k]) * e; if (REDUCED && name === "idle" && (k === "sq" || k === "rot")) v = BASE[k]; cur[k] = v; }
    if (t >= 1) {
      if (seg + 1 < list.length) startSeg(seg + 1, now);
      else if (move.loop) startSeg(0, now);
      else if (phase === "main" && repN < move.rep) { repN++; startSeg(0, now); }
      else if (phase === "main" && move.endAbs) { phase = "end"; list = move.endAbs; startSeg(0, now); }
      else finished(now);
    }
    if (now > nextBlink) { blinkEnd = now + 150; nextBlink = now + 2500 + Math.random() * 3000; }
  }
  const _v = new THREE.Vector3();
  const corners = [[-1.24, 1.75], [1.24, 1.75], [-.36, 0], [.36, 0]].map(([x, y]) => new THREE.Vector3(x, y, .2));
  function placeBubble() {
    const txt = (name !== "idle" && override) ? override : (name === "denken" ? "Even denken…" : (cur.say || "").replace("{n}", repN));
    if (!txt) { bubble.hidden = true; return; }
    bubble.hidden = false; if (bubble.textContent !== txt) bubble.textContent = txt;
    const W = el.clientWidth, H = el.clientHeight, bw = bubble.offsetWidth, bh = bubble.offsetHeight, gap = 10, m = 4;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    const add = v => { v.project(camera); const sx = (v.x + 1) / 2 * W, sy = (1 - v.y) / 2 * H; x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy); };
    for (const c of corners) { _v.copy(c); _v.y *= V.squash.scale.y; V.body.localToWorld(_v); add(_v); }
    for (const g of [V.gloveL, V.gloveR, V.shoeL, V.shoeR]) { g.getWorldPosition(_v); add(_v); }
    const cx = (x0 + x1) / 2; let bx, by, cls;
    const roomUp = o.bubbleOverflow ? -bh * .9 : m;
    if (o.bubbleAlign === "side") { cls = "left"; bx = x0 - gap - bw; by = Math.max(0, Math.min(H - bh, y0 + (y1 - y0) * .12)); }
    else if (o.bubbleAlign) { cls = "up"; by = Math.min(y0 - gap - bh, H * .15 - bh); bx = o.bubbleAlign === "right" ? W - bw : 0; }
    else if (y0 - gap - bh >= roomUp) { cls = "up"; by = y0 - gap - bh; bx = Math.min(W - bw - m, Math.max(m, cx - bw / 2)); }
    else if (x0 - gap - bw >= m) { cls = "left"; bx = x0 - gap - bw; by = Math.max(m, y0 + H * .04); }
    else if (x1 + gap + bw <= W - m) { cls = "right"; bx = x1 + gap; by = Math.max(m, y0 + H * .04); }
    else { cls = "up"; bx = Math.min(W - bw - m, Math.max(m, cx - bw / 2)); by = roomUp; }
    bubble.className = "vimo3d-bubble " + cls;
    if (cls === "up") bubble.style.setProperty("--tx", Math.min(bw - 16, Math.max(16, cx - bx)) + "px");
    bubble.style.transform = `translate(${bx.toFixed(1)}px,${by.toFixed(1)}px)`;
  }
  function frame(now) {
    raf = 0;
    step(now);
    const X = homeX + (cur.x - 320) / 100, Y = (395 - cur.g) / 100;
    V.draw(cur, now < blinkEnd ? .12 : 1, X, Y);
    shadow.position.x = X; const k = Math.max(.35, 1 - cur.lift / 220); shadow.scale.set(k, k, 1); shadow.material.opacity = k;
    shadow.position.y = Y + .002;
    renderer.render(scene, camera); placeBubble();
    if (visible) raf = requestAnimationFrame(frame);
  }
  function wake() { if (!raf && visible) raf = requestAnimationFrame(frame); }
  new IntersectionObserver(es => { visible = es[0].isIntersecting && !document.hidden; wake(); }).observe(el);
  document.addEventListener("visibilitychange", () => { visible = !document.hidden; wake(); });

  /* tik op Vimo: hij zegt iets */
  const lines = o.lines || DEFAULT_LINES, tapMoves = ["hoi", "springen", "draaien", "wijzen", "balans"];
  let li = 0, mi = 0, down = null;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function hitVimo(e) {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    ray.setFromCamera(ndc, camera); return ray.intersectObject(V.char, true).length > 0;
  }
  function talk() {
    const custom = o.onTap && o.onTap();
    if (custom) { start(custom.move || tapMoves[mi++ % tapMoves.length], custom.text); return; }
    start(tapMoves[mi++ % tapMoves.length], lines[li++ % lines.length]);
  }
  renderer.domElement.addEventListener("pointerdown", e => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  renderer.domElement.addEventListener("pointerup", e => {
    if (!down) return; const d = down; down = null;
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 8 || performance.now() - d.t > 600) return;
    if (o.tapAnywhere || hitVimo(e)) { e.stopPropagation(); queue = []; onDone = null; talk(); }
  });
  renderer.domElement.style.cursor = "pointer";
  if (o.autoTalk) setInterval(() => { if (visible && name === "idle") talk(); }, o.autoTalk);

  start("idle");
  return {
    play: (n, text) => { queue = []; onDone = null; start(n, text); },
    say: (text, mv) => { queue = []; onDone = null; start(mv || "praten", text); },
    sequence: (steps, done) => { queue = steps.slice(); onDone = done || null; finished(performance.now()); },
    stop: () => { queue = []; onDone = null; start("idle"); },
    talk, moves: Object.keys(MOVES).filter(k => !["idle", "denken", "praten"].includes(k)),
    current: () => name
  };
}
