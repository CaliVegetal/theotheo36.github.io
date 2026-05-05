


const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");

const w = canvas.width;
const h = canvas.height;
const cx = w / 2;
const cy = h / 2;
const R = Math.min(cx, cy);

let pickX = cx;
let pickY = cy;

let dragging = false;

/* ---------------------------
   Blaschke transform
----------------------------*/
function blaschke(zx, zy, ax, ay) {
  const zRe = zx, zIm = zy;
  const aRe = ax, aIm = ay;

  const aConjRe = aRe;
  const aConjIm = -aIm;

  const numRe = zRe - aRe;
  const numIm = zIm - aIm;

  const denRe = 1 - (aConjRe * zRe - aConjIm * zIm);
  const denIm = 0 - (aConjRe * zIm + aConjIm * zRe);

  const d = denRe * denRe + denIm * denIm;

  return {
    re: (numRe * denRe + numIm * denIm) / d,
    im: (numIm * denRe - numRe * denIm) / d
  };
}

/* ---------------------------
   HSL → RGB
----------------------------*/
function hslToRgb(h, s, l) {
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [r * 255, g * 255, b * 255];
}

/* ---------------------------
   Render
----------------------------*/
function draw() {
  const ax = (pickX - cx) / R;
  const ay = (pickY - cy) / R;

  const img = ctx.createImageData(w, h);
  const data = img.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {

      const dx = x - cx;
      const dy = y - cy;

      const r = Math.sqrt(dx * dx + dy * dy);

      const i = (y * w + x) * 4;

      if (r > R) {
        data[i + 3] = 0;
        continue;
      }

      // normalize to unit disk
      const zx = dx / R;
      const zy = dy / R;

      // apply Blaschke
      const z = blaschke(zx, zy, ax, ay);

      const hue = (Math.atan2(z.im, z.re) + Math.PI) / (2 * Math.PI);
      const sat = Math.min(1, Math.sqrt(z.re*z.re + z.im*z.im));
      const light = 0.5;

      const [rC, gC, bC] = hslToRgb(hue, sat, light);

      data[i] = rC;
      data[i + 1] = gC;
      data[i + 2] = bC;
      data[i + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  drawPicker();
}

/* ---------------------------
   Picker
----------------------------*/
function drawPicker() {
  ctx.beginPath();
  ctx.arc(pickX, pickY, 8, 0, Math.PI * 2);
  ctx.strokeStyle = "white";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(pickX, pickY, 8, 0, Math.PI * 2);
  ctx.strokeStyle = "black";
  ctx.lineWidth = 1;
  ctx.stroke();
}

/* ---------------------------
   Interaction
----------------------------*/
function updatePick(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const dx = x - cx;
  const dy = y - cy;
  const r = Math.sqrt(dx * dx + dy * dy);

  if (r > R) return;

  pickX = x;
  pickY = y;

  draw();
}

canvas.addEventListener("pointerdown", (e) => {
  dragging = true;
  canvas.setPointerCapture(e.pointerId);
  updatePick(e);
});

canvas.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  updatePick(e);
});

function stop() {
  dragging = false;
}

canvas.addEventListener("pointerup", stop);
canvas.addEventListener("pointercancel", stop);

/* ---------------------------
   Init
----------------------------*/
draw();
