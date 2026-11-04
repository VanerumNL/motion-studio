/* Vimo 3D: de V-mascotte van Vanerum als klein 3D-figuurtje.
   Gebruik:  import { createVimo } from "./vimo3d.js";
             const v = createVimo(element, { lines: [...], onTap: () => ({move, text}) });
   v.play(beweging, tekst) · v.say(tekst) · v.sequence([{move, text}], klaar) · v.stop()
   Bewegingen: hoi, wijzen, springen, knieen, balans, draaien, praten, denken.
   Met een kubus ook: kubus (erop springen), gooien, en de houdingen "pose:<sleutel>" (zie POSES). */
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
    char.position.set(X, Y, p.z || 0); char.rotation.set(0, ((p.spin || 0) + (p.yaw || 0)) * RAD, (p.roll || 0) * RAD);
    setHose(legL, V3(ll.a, hipY), V3(ll.j, hipY, .02), V3(ll.e, hipY, .04));
    setHose(legR, V3(rl.a, hipY), V3(rl.j, hipY, .02), V3(rl.e, hipY, .04));
    shoeL.position.copy(V3([ll.e[0] - 8, ll.e[1]], hipY, .1)); shoeR.position.copy(V3([rl.e[0] + 8, rl.e[1]], hipY, .1));
    body.position.set(0, -hipY / 100, 0); body.rotation.z = -p.rot * RAD; squash.scale.y = p.sq;
    const shY = -62 * p.sq;
    const aL = p.aL || 30, al = limb([-64, shY], p.lA1, p.lA2, aL, aL), ar = limb([64, shY], p.rA1, p.rA2, aL, aL);
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

/* ---------- bewegingen ----------
   Een pose gebruikt 2D-maten (x, g: 320/395 is de vaste plek van Vimo), z is diepte in meters.
   cx, cy, cz is de plek van de kubus (cy = onderkant), hold = Vimo heeft de kubus vast. */
const CUBE_X = 1.42, CUBE_Z = -.05, CUBE_K = 2.4;
const NUM = ["x", "g", "z", "lift", "rot", "sq", "spin", "yaw", "roll", "aL", "lA1", "lA2", "rA1", "rA2", "lL1", "lL2", "rL1", "rL2", "look", "lookY", "cx", "cy", "cz"];
const DISC = ["mouth", "happy", "say", "hold", "face"];
const BASE = { x: 320, g: 395, z: 0, lift: 0, rot: 0, sq: 1, spin: 0, yaw: 0, roll: 0, aL: 30, lA1: -25, lA2: 15, rA1: 25, rA2: -15, lL1: -9, lL2: 0, rL1: 9, rL2: 0, look: 0, lookY: 0, mouth: "smile", happy: 0, say: "", cx: CUBE_X, cy: 0, cz: CUBE_Z, hold: "", face: "" };
const CROUCH = { lL1: -45, lL2: 50, rL1: 45, rL2: -50, sq: .9 }, STAND = { lL1: -9, lL2: 0, rL1: 9, rL2: 0, sq: 1, lift: 0 };
const AIR = { lL1: -20, lL2: 28, rL1: 20, rL2: -28, sq: 1.06 }, UP = { lA1: -148, lA2: -8, rA1: 148, rA2: 8 };
const CHEER = { lA1: -128, lA2: -38, rA1: 128, rA2: 38 }, DOWN = { lA1: -25, lA2: 15, rA1: 25, rA2: -15, aL: 30 }, BACK = { lA1: -40, lA2: 0, rA1: 40, rA2: 0 };
const A = (...o) => Object.assign({}, ...o);
const STATIC = {
  idle: { inPlace: true, loop: true, frames: [[1500, { sq: 1.025, rot: -2, lA1: -21, rA1: 29, look: -.35 }], [1500, { sq: 1, rot: 2, lA1: -29, rA1: 21, look: .35 }]] },
  praten: { inPlace: true, frames: [[320, { rA1: 72, rA2: -58, rot: 3, look: .3, mouth: "open" }], [380, { mouth: "smile", rot: -2 }], [380, { mouth: "open", rot: 2 }], [380, { mouth: "smile", rot: -1 }], [380, { mouth: "open", rot: 1 }], [2600, { mouth: "smile", rot: 0 }], [420, A(DOWN, { look: 0 })]] },
  denken: { inPlace: true, loop: true, frames: [[450, { rA1: -10, rA2: -100, lookY: -1, look: .5, mouth: "o" }], [800, { rot: -3, look: .2 }], [800, { rot: 2, look: .7 }]] },
  hoi: { frames: [[380, { rA1: 145, rA2: 28, mouth: "open", happy: 1, look: .3, say: "Hoi! Ik ben Vimo!" }], [260, { rA2: -22, rot: 2 }], [260, { rA2: 28, rot: -1 }], [260, { rA2: -22, rot: 2 }], [260, { rA2: 28, rot: -1 }], [260, { rA2: -22, rot: 2 }], [260, { rA2: 28, rot: 0 }], [900, {}], [400, A(DOWN, { mouth: "smile", happy: 0, look: 0, say: "" })]] },
  wijzen: { frames: [[420, { rA1: 93, rA2: -3, rot: 5, look: 1, lookY: .2, mouth: "open", say: "Kijk eens!" }], [1800, { lA1: -35 }], [420, A(DOWN, { rot: 0, look: 0, lookY: 0, mouth: "smile", say: "" })]] },
  springen: { rep: 2, frames: [[260, A(CROUCH, BACK, { say: "Spring mee!" })], [320, A(AIR, UP, { lift: 90, mouth: "open", happy: 1 }), "out"], [320, A(STAND, { lift: 0 }), "in"], [180, A(CROUCH, { sq: .93 })], [320, A(STAND, CHEER, { say: "Joepie!" })], [380, {}]], end: [[400, A(DOWN, { mouth: "smile", happy: 0, say: "" })]] },
  knieen: { rep: 3, frames: [[560, { lA1: -90, lA2: 0, rA1: 90, rA2: 0, lL1: -74, lL2: 68, rL1: 74, rL2: -68, sq: .95, mouth: "o", say: "{n}!" }], [560, A(STAND, { mouth: "smile" })]], end: [[450, A(CHEER, { happy: 1, mouth: "open", say: "Goed zo!" })], [900, {}], [400, A(DOWN, { happy: 0, mouth: "smile", say: "" })]] },
  balans: { frames: [[500, { rL1: 62, rL2: -95, lL1: -2, lA1: -96, lA2: 8, rA1: 96, rA2: -8, mouth: "o", say: "Kun jij dit ook?" }], [700, { rot: 6, look: -.4 }], [700, { rot: -6, look: .4 }], [700, { rot: 4, mouth: "smile" }], [500, { rot: 0, look: 0 }], [400, A(STAND, DOWN, { say: "" })]] },
  draaien: { frames: [[300, A({ lift: 14 }, UP, { mouth: "open", happy: 1, say: "Draaien maar!" })], [900, { spin: 360 }, "lin"], [320, A({ lift: 0 }, DOWN, { mouth: "smile", happy: 0, say: "" })]] }
};
/* de negen houdingen uit Motion Missions */
export const POSES = [
  ["ervoor-staan", "Ervoor staan"], ["boven-hoofd", "Boven je hoofd houden"], ["voor-je-houden", "Voor je houden"],
  ["liggen-op", "Liggen op"], ["ernaast-staan", "Ernaast staan"], ["erachter-staan", "Erachter staan"],
  ["staan-op", "Staan op"], ["erachter-zitten", "Erachter zitten"], ["zitten-op", "Zitten op"]];
const POSE_NAME = Object.fromEntries(POSES);
/* de zes vlakken van het echte model (zelfde als in Motion Cube Lab) */
export const FACES = { geel: { n: [0, 1, 0], name: "Geel" }, blauw: { n: [0, -1, 0], name: "Blauw" }, oranje: { n: [1, 0, 0], name: "Oranje" },
  rood: { n: [-1, 0, 0], name: "Rood" }, paars: { n: [0, 0, -1], name: "Paars" }, lichtblauw: { n: [0, 0, 1], name: "Lichtblauw" } };
const EASE = { io: t => .5 - .5 * Math.cos(Math.PI * t), lin: t => t, out: t => Math.sin(t * Math.PI / 2), in: t => 1 - Math.cos(t * Math.PI / 2) };
function compile(frames, st) { let prev = A(st); return frames.map(([d, p, e, x]) => { prev = A(prev, p); return Object.assign({ d, p: prev, e: e || "io" }, x || {}); }); }
for (const k in STATIC) { const m = STATIC[k]; m.rep = m.rep || 1; }

/* ---------- createVimo ----------
   opties: cube: {glb: ArrayBuffer} | false · lines: [tekst] · onTap(): {move, text} | null · autoTalk: ms · fontSize: css
           fit: "solo" | "stage" · tapAnywhere · bubbleAlign: "left" | "right" | "side" · bubbleOverflow · controls: true (draaien met de muis) */
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
  const homeX = stage ? -1.4 : 0;
  const X2 = wx => 320 + (wx - homeX) * 100, WX = x => homeX + (x - 320) / 100;

  /* kubus */
  const cubeG = new THREE.Group(), cubeQ = new THREE.Quaternion(), baseQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
  const HE = new THREE.Vector3(.256, .2007, .2311).multiplyScalar(CUBE_K);
  let hasCube = false, cubeShadow = null;
  if (o.cube && o.cube.glb) {
    scene.add(cubeG);
    cubeShadow = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.5), new THREE.MeshBasicMaterial({ map: blob, transparent: true, depthWrite: false }));
    cubeShadow.rotation.x = -Math.PI / 2; scene.add(cubeShadow);
    new GLTFLoader().parse(o.cube.glb, "", g => {
      const m = g.scene; m.scale.setScalar(CUBE_K); m.quaternion.copy(baseQ); cubeG.add(m); hasCube = true;
    }, e => console.error(e));
  }
  const _m = new THREE.Matrix4(), _qt = new THREE.Quaternion();
  function halfH(q) { _qt.copy(q).multiply(baseQ); _m.makeRotationFromQuaternion(_qt); const e = _m.elements; return Math.abs(e[1]) * HE.x + Math.abs(e[5]) * HE.y + Math.abs(e[9]) * HE.z; }
  const UPV = new THREE.Vector3(0, 1, 0);
  function faceQ(key) { const n = new THREE.Vector3(...FACES[key].n).applyQuaternion(baseQ); return new THREE.Quaternion().setFromUnitVectors(n, UPV); }
  function topFace(q = cubeQ) { let best = "geel", bd = -2; for (const k in FACES) { const d = new THREE.Vector3(...FACES[k].n).applyQuaternion(baseQ).applyQuaternion(q).dot(UPV); if (d > bd) { bd = d; best = k; } } return best; }
  const cubeTop = () => cur.cy + 2 * halfH(cubeQ);

  /* camera */
  const camera = new THREE.PerspectiveCamera(28, 1, .1, 100);
  const target = stage ? new THREE.Vector3(0, 1.4, 0) : new THREE.Vector3(0, 1.25, 0);
  let controls = null, camDist = 0;
  function frameCam() {
    const w = el.clientWidth || 1, h = el.clientHeight || 1; camera.aspect = w / h;
    const needH = stage ? 4.4 : 3.0, needW = stage ? 6.4 : 2.6;
    const vfov = 28 * RAD, hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
    camDist = Math.max(needH / 2 / Math.tan(vfov / 2), needW / 2 / Math.tan(hfov / 2));
    if (!controls) { camera.position.set(0, target.y + camDist * Math.sin(.12), camDist * Math.cos(.12)); camera.lookAt(target); }
    camera.updateProjectionMatrix(); renderer.setSize(w, h, false);
  }
  new ResizeObserver(() => frameCam()).observe(el); frameCam();
  if (o.controls) {
    import("three/addons/controls/OrbitControls.js").then(({ OrbitControls }) => {
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true; controls.enablePan = false; controls.minDistance = camDist * .6; controls.maxDistance = camDist * 1.6;
      controls.maxPolarAngle = Math.PI * .49; controls.autoRotateSpeed = 1.4; controls.target.copy(target); controls.update();
    });
  }
  function view(az) { const d = camDist, e = .13; camera.position.set(Math.sin(az) * d * Math.cos(e), target.y + d * Math.sin(e), Math.cos(az) * d * Math.cos(e)); camera.lookAt(target); if (controls) { controls.target.copy(target); controls.update(); } }

  const bubble = document.createElement("div"); bubble.className = "vimo3d-bubble"; bubble.hidden = true;
  if (o.fontSize) bubble.style.fontSize = o.fontSize;
  el.appendChild(bubble);

  /* ---------- afspelen ---------- */
  let cur = A(BASE), from, seg, segStart, move, name, list, repN, phase, override = "", queue = [], onDone = null;
  let nextBlink = 0, blinkEnd = 0, raf = 0, visible = true;
  let qFrom = new THREE.Quaternion(), qTo = new THREE.Quaternion(), rotSeg = false;
  const hands = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3();
  let offFrom = new THREE.Vector3(), offTo = new THREE.Vector3(), curOff = new THREE.Vector3();
  const atHome = () => Math.abs(cur.x - 320) < 3 && Math.abs(cur.g - 395) < 3 && Math.abs(cur.z) < .05 && !cur.hold && Math.abs(cur.roll) < 1;

  /* bouwstenen voor bewegingen die van de huidige plek afhangen */
  function builder() {
    const F = [], pos = { x: cur.x, g: cur.g, z: cur.z, hold: cur.hold, roll: cur.roll };
    const top = () => 395 - cubeTop() * 100;
    const PRE = { x: X2(CUBE_X - 1.35), z: .35 };
    const b = {
      F, pos,
      add(d, p, e, x) { F.push([d, p, e, x]); Object.assign(pos, p); return b; },
      walk(tx, tz) {
        const near = x => Math.abs(WX(x) - CUBE_X) < 1.3;
        if (Math.sign(pos.z - CUBE_Z) !== Math.sign(tz - CUBE_Z) && Math.abs(pos.z - tz) > .6 && (near(pos.x) || near(tx))) {
          const side = X2(CUBE_X - 1.7); b.walk(side, pos.z === tz ? pos.z : pos.z); b.walk(side, tz);
        }
        const fx = pos.x, fz = pos.z, dist = Math.hypot((tx - fx) / 100, tz - fz); if (dist < .04) return b;
        const n = Math.max(2, Math.round(dist / .4));
        for (let i = 1; i <= n; i++) {
          const f = i / n, L = i % 2;
          b.add(190, { x: fx + (tx - fx) * f, z: fz + (tz - fz) * f, lift: 7, lL1: L ? -30 : -2, lL2: L ? 12 : 0, rL1: L ? 2 : 30, rL2: L ? 0 : -12, lA1: L ? -10 : -38, rA1: L ? 38 : 10, sq: 1 }, "lin");
        }
        return b.add(200, A(STAND, { x: tx, z: tz }));
      },
      jumpUp(x, g, z) {
        b.add(300, A(CROUCH, BACK, { look: .6 }));
        b.add(360, A(AIR, UP, { x: (pos.x + x) / 2, z: (pos.z + z) / 2, g: (pos.g + g) / 2, lift: 120, mouth: "open" }), "out");
        b.add(360, A(STAND, { x, g, z, lift: 0 }), "in");
        return b.add(180, A(CROUCH, { sq: .92 })).add(260, A(STAND, DOWN, { mouth: "smile" }));
      },
      jumpDown(x, z) {
        b.add(280, A(CROUCH, BACK));
        b.add(340, A(AIR, UP, { x: (pos.x + x) / 2, z: (pos.z + z) / 2, g: (pos.g + 395) / 2, lift: 90, mouth: "open" }), "out");
        b.add(340, A(STAND, { x, z, g: 395, lift: 0 }), "in");
        return b.add(160, A(CROUCH, { sq: .93 })).add(240, A(STAND, DOWN, { mouth: "smile" }));
      },
      leave() { /* kubus terugzetten, opstaan en van de kubus af */
        if (pos.hold) b.add(520, A(STAND, DOWN, { hold: "", cx: CUBE_X, cy: 0, cz: CUBE_Z, mouth: "smile" }));
        if (Math.abs(pos.roll) > 1) b.add(420, A(STAND, DOWN, { roll: 0, x: X2(CUBE_X), g: top(), z: CUBE_Z }));
        if (pos.g < 390) b.jumpDown(PRE.x, PRE.z);
        return b;
      },
      home() { b.leave(); return b.walk(320, 0); },
      grab() { b.add(320, A(CROUCH, { lA1: -12, lA2: 4, rA1: 12, rA2: -4, aL: 34, lookY: -1, mouth: "o" })); return b.add(160, { hold: "grab" }); },
      top, PRE
    };
    return b;
  }
  function poseFrames(key, label) {
    const b = builder(), cx2 = X2(CUBE_X), say = label || (POSE_NAME[key] + "!");
    const keepHold = (key === "boven-hoofd" || key === "voor-je-houden") && b.pos.hold;
    if (!keepHold) b.leave();
    switch (key) {
      case "ervoor-staan": b.walk(cx2, 1.0).add(500, { lA1: -150, lA2: -14, rA1: 40, rA2: -30, mouth: "open", say }); break;
      case "erachter-staan": b.walk(cx2, -1.08).add(500, { lA1: -140, lA2: -20, rA1: 140, rA2: 20, mouth: "open", say }); break;
      case "ernaast-staan": b.walk(X2(CUBE_X - 1.5), 0).add(500, { rA1: 92, rA2: -6, aL: 38, rot: 4, look: 1, say }); break;
      case "staan-op": b.walk(b.PRE.x, b.PRE.z).jumpUp(cx2, b.top(), CUBE_Z).add(500, A(CHEER, { happy: 1, mouth: "open", say })); break;
      case "zitten-op": {
        const Y = cubeTop() - .616 + .02;
        b.walk(b.PRE.x, b.PRE.z).jumpUp(cx2, 395 - Y * 100, .5).add(500, { lA1: -112, lA2: -20, rA1: 112, rA2: 20, happy: 1, mouth: "open", say }); break;
      }
      case "liggen-op": {
        b.walk(b.PRE.x, b.PRE.z).jumpUp(cx2, b.top(), CUBE_Z);
        const r = 63.3 * RAD, ex = -.64, ey = 1.316, wx = ex * Math.cos(r) - ey * Math.sin(r), wy = ex * Math.sin(r) + ey * Math.cos(r);
        const legs = { lL1: 100, lL2: 35, rL1: 128, rL2: -30 };
        const depth = (() => { const L = (a1, a2) => Math.cos(a1 * RAD) * 34 + Math.cos((a1 + a2) * RAD) * 34; return Math.max(L(100, 35), L(128, -30)); })();
        b.add(560, A(legs, { roll: 63.3, lift: 68 - depth, x: X2(CUBE_X - wx), g: 395 - (cubeTop() - wy + .03) * 100, lA1: 150, lA2: 20, rA1: 60, rA2: 60, happy: 1, mouth: "open", say }));
        break;
      }
      case "erachter-zitten": b.walk(cx2, -.86).add(500, { lift: -6, lA1: -4, lA2: 0, rA1: 4, rA2: 0, aL: 8, look: .2, say }); break;
      case "boven-hoofd":
        if (!keepHold) b.walk(cx2, -1.04).grab();
        b.add(560, A(STAND, { lA1: -150, lA2: -8, rA1: 150, rA2: 8, aL: 64, hold: "head", mouth: "o", lookY: -1, say })); break;
      case "voor-je-houden":
        if (!keepHold) b.walk(cx2, -1.0).grab();
        b.add(560, A(STAND, { lA1: -14, lA2: 6, rA1: 14, rA2: -6, aL: 34, hold: "front", happy: 1, mouth: "smile", lookY: 0, say })); break;
    }
    return b.add(900, {}).F;
  }
  function throwFrames(text) {
    const b = builder(), faces = Object.keys(FACES).filter(k => k !== topFace()), F = faces[Math.floor(Math.random() * faces.length)];
    if (b.pos.hold !== "head") { b.leave(); b.walk(X2(CUBE_X), -1.04).grab(); b.add(520, A(STAND, { lA1: -150, lA2: -8, rA1: 150, rA2: 8, aL: 64, hold: "head", mouth: "o", say: "Hup!" })); }
    b.add(320, { lA1: -165, lA2: 0, rA1: 165, rA2: 0, sq: .94, lift: -6 });
    b.add(950, A(CHEER, { hold: "", cx: CUBE_X, cy: 0, cz: CUBE_Z, face: F, aL: 30, sq: 1.04, lift: 0, lookY: .4, mouth: "open", say: "" }), "lin", { arc: 1.05, spin: 2 });
    b.add(260, { sq: 1 }, "io", { arc: .16 });
    b.add(500, A(STAND, CHEER, { happy: 1, mouth: "open", say: text || (FACES[F].name + " ligt boven!") }));
    return b.add(1400, {}).F;
  }
  function kubusFrames() {
    const b = builder(); b.leave(); if (Math.abs(b.pos.x - 320) > 3 || Math.abs(b.pos.z) > .05) b.walk(320, 0);
    b.jumpUp(X2(CUBE_X), b.top(), CUBE_Z).add(380, A(CHEER, { happy: 1, mouth: "open", say: "Ik sta op de kubus!" })).add(1300, {});
    b.add(10, { happy: 0, say: "" }).jumpDown(320, 0);
    return b.F;
  }

  function startSeg(i, now) {
    seg = i; segStart = now; from = A(cur);
    const s = list[i];
    for (const k of DISC) cur[k] = s.p[k];
    rotSeg = false;
    if (hasCube && (s.spin || (s.p.face && s.p.face !== topFace()))) { qFrom.copy(cubeQ); qTo.copy(s.p.face ? faceQ(s.p.face) : cubeQ); rotSeg = true; }
    if (cur.hold) {
      if (!from.hold || cur.hold === "grab") { V.char.updateMatrixWorld(true); offFrom.copy(cubeG.position).sub(handsMid()); }
      else offFrom.copy(curOff);
      if (cur.hold === "head") offTo.set(0, halfH(cubeQ) + .06, -.04);
      else if (cur.hold === "front") offTo.set(0, -.02, .7);
      else offTo.copy(offFrom);
    }
  }
  function handsMid() { V.gloveL.getWorldPosition(_a); V.gloveR.getWorldPosition(_b); return hands.copy(_a).add(_b).multiplyScalar(.5); }
  function start(n, text, now = performance.now()) {
    let frames = null, st = BASE, loop = false, rep = 1, end = null, stay = false;
    if (n.startsWith("pose:")) { if (!hasCube) n = "hoi"; else { frames = poseFrames(n.slice(5), text); st = cur; stay = true; text = ""; } }
    if (n === "gooien") { if (!hasCube) n = "springen"; else { frames = throwFrames(text); st = cur; stay = true; text = ""; } }
    if (n === "kubus") { if (!hasCube) n = "springen"; else { frames = kubusFrames(); st = cur; } }
    if (n === "__home") { frames = builder().home().F; st = cur; }
    if (n === "__stay") { frames = [[1500, { sq: cur.sq * 1.02 }], [1500, { sq: cur.sq }]]; st = cur; loop = true; }
    if (!frames) {
      const m = STATIC[n] || STATIC.hoi; if (!STATIC[n]) n = "hoi";
      if (!m.inPlace && !atHome()) { queue.unshift({ move: n, text }); return start("__home", "", now); }
      frames = m.frames; loop = !!m.loop; rep = m.rep; end = m.end;
      st = m.inPlace ? A(BASE, { x: cur.x, g: cur.g, z: cur.z, cx: cur.cx, cy: cur.cy, cz: cur.cz, roll: cur.roll, hold: cur.hold, lift: cur.lift }) : BASE;
      if (m.inPlace && (cur.hold || Math.abs(cur.roll) > 1 || cur.g < 390)) { stay = true; frames = [[1200, { mouth: "open" }], [400, { mouth: "smile" }], [1600, {}]]; st = cur; }
    }
    const abs = compile(frames, st);
    move = { abs, loop, rep, endAbs: end ? compile(end, abs[abs.length - 1].p) : null, stay };
    name = n; cur.spin = cur.spin % 360; repN = 1; phase = "main"; list = abs; override = text || ""; startSeg(0, now); wake();
  }
  function finished(now) {
    if (queue.length) { const q = queue.shift(); start(q.move, q.text, now); return; }
    const stay = move.stay;
    start(stay ? "__stay" : "idle", "", now); const cb = onDone; onDone = null; if (cb) cb();
  }
  function step(now) {
    const s = list[seg], t = Math.min(1, (now - segStart) / s.d), e = EASE[s.e](t);
    for (const k of NUM) { if (cur.hold && (k === "cx" || k === "cy" || k === "cz")) continue; let v = from[k] + (s.p[k] - from[k]) * e; if (REDUCED && name === "idle" && (k === "sq" || k === "rot")) v = BASE[k]; cur[k] = v; }
    if (rotSeg) { cubeQ.slerpQuaternions(qFrom, qTo, e); if (s.spin) cubeQ.premultiply(_qt.setFromAxisAngle(_a.set(1, 0, .35).normalize(), s.spin * Math.PI * 2 * e)); }
    const arc = s.arc ? s.arc * Math.sin(Math.PI * t) : 0;
    if (t >= 1) {
      if (rotSeg) cubeQ.copy(qTo);
      if (seg + 1 < list.length) startSeg(seg + 1, now);
      else if (move.loop) startSeg(0, now);
      else if (phase === "main" && repN < move.rep) { repN++; startSeg(0, now); }
      else if (phase === "main" && move.endAbs) { phase = "end"; list = move.endAbs; startSeg(0, now); }
      else finished(now);
    }
    if (now > nextBlink) { blinkEnd = now + 150; nextBlink = now + 2500 + Math.random() * 3000; }
    return { arc, e };
  }
  const corners = [[-1.24, 1.75], [1.24, 1.75], [-.36, 0], [.36, 0]].map(([x, y]) => new THREE.Vector3(x, y, .2));
  const _v = new THREE.Vector3();
  function placeBubble() {
    const txt = (name !== "idle" && name !== "__stay" && override) ? override : (name === "denken" ? "Even denken…" : (cur.say || "").replace("{n}", repN));
    if (!txt) { bubble.hidden = true; return; }
    bubble.hidden = false; if (bubble.textContent !== txt) bubble.textContent = txt;
    const W = el.clientWidth, H = el.clientHeight, bw = bubble.offsetWidth, bh = bubble.offsetHeight, gap = 10, m = 4;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    const add = v => { v.project(camera); const sx = (v.x + 1) / 2 * W, sy = (1 - v.y) / 2 * H; x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy); };
    for (const c of corners) { _v.copy(c); _v.y *= V.squash.scale.y; V.body.localToWorld(_v); add(_v); }
    for (const g of [V.gloveL, V.gloveR, V.shoeL, V.shoeR]) { g.getWorldPosition(_v); add(_v); }
    if (cur.hold) { _v.copy(cubeG.position); _v.y += halfH(cubeQ); add(_v); }
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
    const s = list[seg], tt = Math.min(1, (now - segStart) / s.d), e = EASE[s.e](tt), arc = s.arc ? s.arc * Math.sin(Math.PI * tt) : 0;
    const X = WX(cur.x), Y = (395 - cur.g) / 100;
    V.draw(cur, now < blinkEnd ? .12 : 1, X, Y);
    const k = Math.max(.35, 1 - cur.lift / 220); shadow.scale.set(k, k, 1); shadow.material.opacity = k;
    shadow.position.set(X, Y + .002, cur.z);
    if (hasCube) {
      const hh = halfH(cubeQ);
      if (cur.hold) {
        V.char.updateMatrixWorld(true); handsMid();
        curOff.lerpVectors(offFrom, offTo, e);
        cubeG.position.copy(hands).add(curOff);
        cur.cx = cubeG.position.x; cur.cz = cubeG.position.z; cur.cy = cubeG.position.y - hh;
      } else cubeG.position.set(cur.cx, cur.cy + hh + arc, cur.cz);
      cubeG.quaternion.copy(cubeQ);
      const ck = Math.max(.3, 1 - (cubeG.position.y - hh) / 2.5);
      cubeShadow.position.set(cubeG.position.x + .06, .001, cubeG.position.z); cubeShadow.scale.set(ck, ck, 1); cubeShadow.material.opacity = ck;
    }
    if (controls) controls.update();
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
    if (custom) { start(custom.move || (atHome() ? tapMoves[mi++ % tapMoves.length] : "praten"), custom.text); return; }
    start(atHome() ? tapMoves[mi++ % tapMoves.length] : "praten", lines[li++ % lines.length]);
  }
  renderer.domElement.addEventListener("pointerdown", e => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  renderer.domElement.addEventListener("pointerup", e => {
    if (!down) return; const d = down; down = null;
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 8 || performance.now() - d.t > 600) return;
    if (o.tapAnywhere || hitVimo(e)) { e.stopPropagation(); queue = []; onDone = null; if (o.onTapStart) o.onTapStart(); talk(); }
  });
  renderer.domElement.style.cursor = "pointer";
  if (o.autoTalk) setInterval(() => { if (visible && name === "idle") talk(); }, o.autoTalk);

  start("idle");
  return {
    play: (n, text) => { queue = []; onDone = null; start(n, text); },
    say: (text, mv) => { queue = []; onDone = null; start(mv || "praten", text); },
    sequence: (steps, done) => { queue = steps.slice(); onDone = done || null; finished(performance.now()); },
    stop: () => { queue = []; onDone = null; start(atHome() ? "idle" : "__home"); },
    talk, view, topFace: () => topFace(),
    setOrbit: on => { if (controls) controls.autoRotate = on; },
    hasCube: () => hasCube, poses: POSES, faces: FACES,
    moves: Object.keys(STATIC).filter(k => !["idle", "denken", "praten"].includes(k)).concat(o.cube ? ["kubus", "gooien"] : []),
    current: () => name,
    _debug: () => ({ name, seg, n: list.length, hold: cur.hold, cy: +cur.cy.toFixed(2), g: Math.round(cur.g), roll: Math.round(cur.roll), z: +cur.z.toFixed(2) })
  };
}
