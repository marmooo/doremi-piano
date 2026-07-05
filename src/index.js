import { Midy } from "https://cdn.jsdelivr.net/gh/marmooo/midy@0.5.7/dist/midy.min.js";

function toggleDarkMode() {
  const html = document.documentElement;
  const newTheme = html.getAttribute("data-bs-theme") === "dark"
    ? "light"
    : "dark";
  html.setAttribute("data-bs-theme", newTheme);
  localStorage.setItem("darkMode", newTheme);
}

function toggleHandMode(event) {
  panel.classList.toggle("single");
  if (handMode === 1) {
    handMode = 2;
    event.target.textContent = "2️⃣";
  } else {
    handMode = 1;
    event.target.textContent = "1️⃣";
  }
  applyOrientation();
}

function changeLang() {
  const langObj = document.getElementById("lang");
  const lang = langObj.options[langObj.selectedIndex].value;
  location.href = `/doremi-piano/${lang}/`;
}

function getGlobalCSS() {
  let cssText = "";
  for (const stylesheet of document.styleSheets) {
    for (const rule of stylesheet.cssRules) {
      cssText += rule.cssText;
    }
  }
  const css = new CSSStyleSheet();
  css.replaceSync(cssText);
  return css;
}

function defineShadowElement(tagName, callback) {
  class ShadowElement extends HTMLElement {
    constructor() {
      super();
      const shadow = this.attachShadow({ mode: "open" });
      shadow.adoptedStyleSheets = [globalCSS];
      shadow.appendChild(
        document.getElementById(tagName).content.cloneNode(true),
      );
      callback?.(shadow, this);
    }
  }
  customElements.define(tagName, ShadowElement);
}

const globalCSS = getGlobalCSS();
defineShadowElement("midi-instrument", (shadow) => {
  shadow.querySelector("select").onchange = setProgramChange;
});
defineShadowElement("midi-drum", (shadow) => {
  shadow.querySelector("select").onchange = setProgramChange;
});

function setEffect(groupId, channel, value) {
  if (effectTypes[groupId] === "expression") {
    midy.setControlChange(channel, 11, value);
  } else {
    midy.setControlChange(channel, 74, value);
  }
}

async function setProgramChange(event) {
  const target = event.target;
  const host = target.getRootNode().host;
  const programNumber = target.selectedIndex;
  const channelNumber = (host.id === "instrument-first") ? 0 : 15;
  const channel = midy.channels[channelNumber];
  const bankNumber = channel.isDrum ? 128 : channel.bankLSB;
  const index = midy.soundFontTable[programNumber][bankNumber];
  if (index === undefined) {
    const program = programNumber.toString().padStart(3, "0");
    const baseName = bankNumber === 128 ? "128" : program;
    const path = `${soundFontURL}/${baseName}.sf3`;
    await midy.loadSoundFont(path);
  }
  midy.setProgramChange(channelNumber, programNumber);
}

function getPointerArea(event) {
  return event.width * event.height;
}

// A touch that lands within this fraction of a key's own width/depth from a
// boundary is also treated as touching the neighboring key — this is what
// lets one finger straddling a boundary sound both notes at once. It's a
// percentage of the key's own size (in SVG user units, see below), not a
// fixed pixel count, so it stays proportionally correct no matter how the
// keyboard is currently scaled on screen.
const BOUNDARY_TOLERANCE_RATIO = 0.08;

// Finds which keyboard group (svg + its key data) a screen point falls
// inside of. There can be more than one keyboard on screen (portrait mode
// stacks two), so this picks the right one before doing any key math.
function findGroupAt(clientX, clientY) {
  for (const group of keyboardGroups) {
    const r = group.svg.getBoundingClientRect();
    if (
      clientX >= r.left && clientX <= r.right &&
      clientY >= r.top && clientY <= r.bottom
    ) {
      return group;
    }
  }
  return null;
}

// Converts a screen point into the SVG's own user-space coordinates (the
// same 0..VIEW_W / 0..VIEW_H space the key geometry is defined in), using
// the SVG's actual current transform. This does the coordinate math
// ourselves instead of asking the browser "which element is at this
// screen point": on some devices/renderers, hit-testing inside a scaled
// (viewBox) SVG can be unreliable — off by a significant fraction of a key
// — while the transform matrix itself (and therefore this calculation)
// stays exact regardless of how the SVG is currently scaled or rendered.
function clientToSvgPoint(svg, clientX, clientY) {
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const p = pt.matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
}

// Finds every key entry in a group whose own geometry contains (x, y), in
// SVG user-space units, expanded by `tol` (also in user-space units) on
// each side, restricted to a single `type` ("white" or "black").
function keysOfTypeContaining(group, type, x, y, tol) {
  return group.keyEls.filter(({ data }) => {
    if (data.type !== type) return false;
    if (type === "black") {
      return y <= BK_V + tol &&
        x >= data.pos - tol && x <= data.pos + data.span + tol;
    }
    return x >= data.pos - tol && x <= data.pos + data.span + tol;
  });
}

// Resolves the single key exactly under (x, y), with no tolerance. Black
// keys are checked first: a black key's footprint and the white key
// directly behind it can never both be "the key you meant" for the same
// point, so if a black key exactly contains the point, that's the answer.
function keyExactlyAt(group, x, y) {
  const blacks = keysOfTypeContaining(group, "black", x, y, 0);
  if (blacks.length > 0) return blacks[0];
  const whites = keysOfTypeContaining(group, "white", x, y, 0);
  return whites[0] ?? null;
}

// Finds the white key touching a given black key's LEFT edge and/or its
// RIGHT edge — but only the side(s) the point (x) is actually close to,
// within `tol`. A black key's own span overlaps 0.3 units into each
// flanking white key's full logical span (the visual notch is cosmetic;
// the underlying position data is not narrowed), so "the white key at
// this edge" is simply whichever white key's span contains that edge
// x-coordinate.
function flankingWhitesNearEdge(group, blackData, x, tol) {
  const blackStart = blackData.pos;
  const blackEnd = blackData.pos + blackData.span;
  const results = [];
  if (x - blackStart <= tol) {
    const left = group.keyEls.find(({ data }) =>
      data.type === "white" && blackStart >= data.pos &&
      blackStart <= data.pos + data.span
    );
    if (left) results.push(left);
  }
  if (blackEnd - x <= tol) {
    const right = group.keyEls.find(({ data }) =>
      data.type === "white" && blackEnd >= data.pos &&
      blackEnd <= data.pos + data.span
    );
    if (right) results.push(right);
  }
  return results;
}

// How far (in the same SVG user-space units as key positions) a press has
// to be from a black key's edge to also count as touching the white key on
// that side, at a given depth `y` into the key (0 = the far/back edge near
// y=0, 1 = the near/front tip at y=BK_V). For most of the key's depth (up
// to FRONT_ZONE_START) this stays exactly BOUNDARY_TOLERANCE_RATIO — the
// same small edge tolerance used everywhere else — so the black key has a
// wide, comfortable "just this note" zone the whole way from the back
// down to near the front, not just a thin sliver. Only inside the last
// stretch near the very front tip does it widen further, enough that a
// roughly-centered press right at the tip can be "close enough" to BOTH
// edges simultaneously — that's the deliberate, narrow white-black-white
// 3-key spot. BOUNDARY_TOLERANCE_RATIO alone (0.08) is less than half a
// black key's own width (0.6), so the two edge zones can never meet on
// their own; this front-only widening is what makes the 3-key chord
// reachable at all, without shrinking the solo zone everywhere else.
const FRONT_ZONE_START = 0.95; // fraction of depth where widening begins
const BLACK_FRONT_TOL_RATIO = 0.75; // fraction of the black key's own span, reached at the very tip

function blackEdgeTolerance(blackData, y) {
  const depth = Math.min(Math.max(y / BK_V, 0), 1);
  if (depth <= FRONT_ZONE_START) return BOUNDARY_TOLERANCE_RATIO;
  const localDepth = (depth - FRONT_ZONE_START) / (1 - FRONT_ZONE_START);
  const frontTol = blackData.span * BLACK_FRONT_TOL_RATIO;
  return BOUNDARY_TOLERANCE_RATIO +
    (frontTol - BOUNDARY_TOLERANCE_RATIO) * localDepth;
}

// Resolves which key(s) a pointer event is touching, purely from geometry:
// find the right keyboard, convert the touch point into that keyboard's
// own coordinate space, and test it against each key's actual bounds. No
// step of this depends on the browser's own point-to-element hit-testing.
// The exact touch point first resolves a single, unambiguous primary key;
// widening by BOUNDARY_TOLERANCE_RATIO then looks for MORE keys of that
// SAME type (adjacent white keys, or — in principle — adjacent black
// keys), never the other type, so a precise press on a white key can never
// have its result silently swapped out by a black key that merely happens
// to be nearby. A black key additionally checks its flanking white keys
// using a tolerance that widens toward the front tip (see
// blackEdgeTolerance) — pressing near the back of a black key behaves like
// any other precise press (black alone, or +1 white right at an edge);
// only pressing low enough, and roughly centered, can reach both flanking
// white keys at once for the full white-black-white chord.
function getPadHits(event) {
  const group = findGroupAt(event.clientX, event.clientY);
  if (!group) return [];
  const p = clientToSvgPoint(group.svg, event.clientX, event.clientY);
  if (!p) return [];
  const primary = keyExactlyAt(group, p.x, p.y);
  if (!primary) return [];
  const widened = keysOfTypeContaining(
    group,
    primary.data.type,
    p.x,
    p.y,
    BOUNDARY_TOLERANCE_RATIO,
  );
  if (primary.data.type === "black") {
    const tol = blackEdgeTolerance(primary.data, p.y);
    const edgeWhites = flankingWhitesNearEdge(group, primary.data, p.x, tol);
    for (const white of edgeWhites) {
      if (!widened.includes(white)) widened.push(white);
    }
  }
  return widened.map((entry) => entry.el);
}

function setPadColor(padHit, velocity) {
  const visual = document.getElementById(padHit.dataset.visual);
  if (!visual) return null;
  if (velocity != null) {
    const lightness = 30 + (velocity / 127) * 40;
    visual.style.fill = `hsl(200, 80%, ${lightness}%)`;
  } else {
    visual.style.fill = "";
  }
  return visual;
}

function highlightPad(padHit, velocity = 64) {
  setPadColor(padHit, velocity);
}

function clearPadColor(padHit) {
  setPadColor(padHit, null);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toMidiValue(ratio) {
  return Math.max(1, Math.round(ratio * 127));
}

function getHitsOrientation(hits) {
  const rects = hits.map((h) => h.getBoundingClientRect());
  const left = Math.min(...rects.map((r) => r.left));
  const right = Math.max(...rects.map((r) => r.right));
  const top = Math.min(...rects.map((r) => r.top));
  const bottom = Math.max(...rects.map((r) => r.bottom));
  return (right - left) > (bottom - top) ? "horizontal" : "vertical";
}

function calcPitchBendRatio(event, padRect) {
  const inset = padRect.width * 0.1;
  const { clientX: x, clientY: y } = event;
  if (x < padRect.left) {
    return {
      ratio: clamp(1 + (x - padRect.left) / inset, 0, 1),
      direction: "horizontal",
    };
  }
  if (x > padRect.right) {
    return {
      ratio: clamp(1 + (padRect.right - x) / inset, 0, 1),
      direction: "horizontal",
    };
  }
  if (y < padRect.top) {
    return {
      ratio: clamp(1 + (y - padRect.top) / inset, 0, 1),
      direction: "vertical",
    };
  }
  if (y > padRect.bottom) {
    return {
      ratio: clamp(1 + (padRect.bottom - y) / inset, 0, 1),
      direction: "vertical",
    };
  }
  return null; // inside pad
}

function calcContinuousPitchBend(event, state) {
  const semitoneDiff = state.toNote - state.fromNote;
  let ratio = 1;
  if (state.targetPadHit && state.currentPadHit) {
    const fromRect = state.currentPadHit.getBoundingClientRect();
    const toRect = state.targetPadHit.getBoundingClientRect();
    const { clientX: x, clientY: y } = event;
    if (state.bendDirection === "horizontal") {
      const left = Math.max(fromRect.left, toRect.left);
      const right = Math.min(fromRect.right, toRect.right);
      ratio = clamp((x - left) / (right - left), 0, 1);
    } else {
      const top = Math.max(fromRect.top, toRect.top);
      const bottom = Math.min(fromRect.bottom, toRect.bottom);
      ratio = clamp((y - top) / (bottom - top), 0, 1);
    }
  } else if (state.currentPadHit) {
    const padRect = state.currentPadHit.getBoundingClientRect();
    const result = calcPitchBendRatio(event, padRect);
    if (result) {
      ratio = result.ratio;
      state.bendDirection ??= result.direction;
    }
  } else {
    state.bendDirection = null;
  }
  const sensitivity =
    midy.channels[state.channelNumber].state.pitchWheelSensitivity *
    128 * 2;
  return Math.round(8192 + (8192 * semitoneDiff * ratio) / sensitivity);
}

function calcExpressionFromMovement(event, state) {
  if (!state.currentPadHit || !state.bendDirection) return null;
  const padRect = state.currentPadHit.parentNode.getBoundingClientRect();
  const ratio = state.bendDirection === "horizontal"
    ? 1 - clamp(event.clientY - padRect.top, 0, padRect.height) / padRect.height
    : clamp(event.clientX - padRect.left, 0, padRect.width) / padRect.width;
  return toMidiValue(ratio);
}

function calcVelocityFromY(event, padHit) {
  const rect = padHit.getBoundingClientRect();
  const y = event.clientY - rect.top;
  const ratio = 1 - clamp(y / rect.height, 0, 1);
  return toMidiValue(ratio);
}

function calcInitialChordExpression(event, hits) {
  const rects = hits.map((h) => h.getBoundingClientRect());
  const left = Math.min(...rects.map((r) => r.left));
  const right = Math.max(...rects.map((r) => r.right));
  const ratio = clamp((event.clientX - left) / (right - left), 0, 1);
  return Math.round(ratio * 127);
}

function allocChannel(groupId) {
  if (groupId === 0) return lowerFreeChannels.shift() ?? null;
  if (groupId === 1) return upperFreeChannels.shift() ?? null;
  return null;
}

function releaseChannel(channelNumber) {
  if (1 <= channelNumber && channelNumber <= midy.lowerMPEMembers) {
    lowerFreeChannels.push(channelNumber);
  } else if (
    15 - midy.upperMPEMembers <= channelNumber && channelNumber <= 14
  ) {
    upperFreeChannels.push(channelNumber);
  }
}

function createMPEPointerState(channelNumber, groupId) {
  return {
    groupId,
    channelNumber,
    baseNotes: new Set(),
    padHits: new Set(),
    baseCenterNote: null,
    chordExpression: 64,
    initialOrientation: null,
    currentPadHit: null,
    targetPadHit: null,
    fromNote: null,
    toNote: null,
    bendDirection: null,
    // aftertouch
    baseArea: 1,
    pressure: 0,
    pressureDirection: 0,
    pressureInterval: null,
    lastMoveTime: 0,
  };
}

function getOrCreateState(pointerId, groupId) {
  if (!mpePointers.has(pointerId)) {
    const channelNumber = allocChannel(groupId);
    if (channelNumber == null) return null;
    mpePointers.set(pointerId, createMPEPointerState(channelNumber, groupId));
  }
  return mpePointers.get(pointerId);
}

function handlePointerDown(event, groupId) {
  if (!isInsidePanel(event)) return;
  panel.setPointerCapture(event.pointerId);
  if (mpePointers.has(event.pointerId)) {
    handlePointerUp(event);
  }
  const hits = getPadHits(event);
  if (hits.length === 0 || hits.length > 3) return;
  const state = getOrCreateState(event.pointerId, groupId);
  if (!state) return;
  if (hits.length >= 2) {
    state.initialOrientation = getHitsOrientation(hits);
    if (state.initialOrientation === "vertical") {
      state.chordExpression = calcInitialChordExpression(event, hits);
      setEffect(groupId, state.channelNumber, state.chordExpression);
    }
  }
  for (const padHit of hits) {
    activatePad(event, padHit, state);
  }
  mpeHitMap.set(event.pointerId, new Set(hits));
}

function activatePad(event, padHit, state) {
  const note = Number(padHit.dataset.index);
  if (state.baseNotes.has(note)) return;
  if (state.baseNotes.size === 0) {
    if (state.initialOrientation !== "vertical") {
      state.chordExpression = calcVelocityFromY(event, padHit);
    }
    setEffect(state.groupId, state.channelNumber, state.chordExpression);
    if (afterTouchEnabled) {
      state.baseArea = getPointerArea(event);
      state.pressure = 0;
      state.pressureDirection = 0;
      midy.setChannelPressure(state.channelNumber, 0);
      state.pressureInterval = setInterval(() => {
        const next = clamp(state.pressure + state.pressureDirection, 0, 127);
        if (next === state.pressure) return;
        state.pressure = next;
        midy.setChannelPressure(state.channelNumber, state.pressure);
      }, 0);
    }
  }
  highlightPad(padHit, state.chordExpression);
  if (state.baseCenterNote == null) {
    state.baseCenterNote = note;
    if (bendEnabled[state.groupId]) {
      midy.channels[state.channelNumber].setPitchBendRange(8192);
    }
  }
  midy.noteOn(state.channelNumber, note, 127);
  state.baseNotes.add(note);
  state.padHits.add(padHit);
  state.currentPadHit = padHit;
  state.fromNote = state.baseCenterNote ?? note;
  state.toNote = note;
}

// Piano keys normally don't pitch-bend: while dragging, just noteOff keys
// no longer touched and noteOn any newly touched ones (glissando-style),
// instead of bending pitch continuously between two notes.
function syncNoteOnMove(event, state, hits) {
  const hitMap = new Map(hits.map((h) => [Number(h.dataset.index), h]));
  for (const note of [...state.baseNotes]) {
    if (!hitMap.has(note)) {
      midy.noteOff(state.channelNumber, note);
      state.baseNotes.delete(note);
    }
  }
  for (const [note] of hitMap) {
    if (!state.baseNotes.has(note)) {
      midy.noteOn(state.channelNumber, note, 127);
      state.baseNotes.add(note);
    }
  }
  state.currentPadHit = hits[0] ?? state.currentPadHit;
  state.bendDirection = state.baseNotes.size > 1
    ? state.initialOrientation
    : "horizontal"; // keeps the vertical axis driving expression
  const expression = calcExpressionFromMovement(event, state);
  const vel = expression ?? state.chordExpression;
  if (expression !== null) {
    state.chordExpression = expression;
    setEffect(state.groupId, state.channelNumber, expression);
  }
  hits.forEach((p) => highlightPad(p, vel));
}

function handlePointerMove(event) {
  const state = mpePointers.get(event.pointerId);
  if (!state) return;
  if (afterTouchEnabled) {
    const now = event.timeStamp;
    state.lastMoveTime = now;
    const area = getPointerArea(event);
    state.pressureDirection = state.baseArea < area ? 1 : -1;
  }
  const hits = getPadHits(event);
  const newHitSet = new Set(hits);
  for (const padHit of state.padHits) {
    if (!newHitSet.has(padHit)) clearPadColor(padHit);
  }
  state.padHits = newHitSet;
  mpeHitMap.set(event.pointerId, newHitSet);
  if (!bendEnabled[state.groupId]) {
    syncNoteOnMove(event, state, hits);
    return;
  }
  if (hits.length === 2 && state.baseNotes.size === 1) {
    const padA = hits.find((p) => Number(p.dataset.index) === state.fromNote);
    const padB = hits.find((p) => Number(p.dataset.index) !== state.fromNote);
    if (padA && padB) {
      state.currentPadHit = padA;
      state.targetPadHit = padB;
      state.toNote = Number(padB.dataset.index);
      state.bendDirection = getHitsOrientation([padA, padB]);
    }
  } else if (hits.length === 1) {
    const note = Number(hits[0].dataset.index);
    state.currentPadHit = hits[0];
    state.targetPadHit = null;
    state.toNote = note;
  } else if (hits.length === 0) {
    state.currentPadHit = null;
    state.targetPadHit = null;
    state.toNote = state.fromNote;
  }
  if (state.baseNotes.size > 1 && hits.length >= 1) {
    state.currentPadHit = hits[0];
    state.bendDirection = state.initialOrientation;
    const expression = calcExpressionFromMovement(event, state);
    const vel = expression ?? state.chordExpression;
    if (expression !== null) {
      setEffect(state.groupId, state.channelNumber, expression);
    }
    hits.forEach((p) => highlightPad(p, vel));
  } else {
    const bend = calcContinuousPitchBend(event, state);
    midy.setPitchBend(state.channelNumber, bend);
    const expression = calcExpressionFromMovement(event, state);
    const vel = expression ?? state.chordExpression;
    if (expression !== null) {
      setEffect(state.groupId, state.channelNumber, expression);
    }
    hits.forEach((p) => highlightPad(p, vel));
  }
}

function handlePointerUp(event) {
  const state = mpePointers.get(event.pointerId);
  if (state) {
    if (state.pressureInterval !== null) {
      clearInterval(state.pressureInterval);
      state.pressureInterval = null;
    }
    state.padHits.forEach(clearPadColor);
    state.baseNotes.forEach((note) => midy.noteOff(state.channelNumber, note));
    midy.setPitchBend(state.channelNumber, 8192);
    midy.setChannelPressure(state.channelNumber, 0);
    releaseChannel(state.channelNumber);
    mpePointers.delete(event.pointerId);
  }
  if (mpeHitMap.has(event.pointerId)) {
    mpeHitMap.get(event.pointerId).clear();
    mpeHitMap.delete(event.pointerId);
  }
  try {
    panel.releasePointerCapture(event.pointerId);
  } catch { /* skip */ }
}

function setMPEKeyEvents(padHit, groupId) {
  padHit.addEventListener(
    "pointerdown",
    (event) => handlePointerDown(event, groupId),
  );
}

function isInsidePanel(event) {
  const rect = panel.getBoundingClientRect();
  return (
    event.clientX >= rect.left &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom
  );
}

function getTranslatedLabel(note) {
  const map = noteMap[htmlLang];
  return map[note[0]] + note.slice(1);
}

// ---- piano keyboard geometry -------------------------------------------

const WHITE_ORDER_FLAT = [
  "C",
  "D",
  "E",
  "F",
  "G",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "A",
  "B",
];
const SEMITONE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const BLACK_AFTER = { C: "C#", D: "D#", F: "F#", G: "G#", A: "A#" };
const TOTAL_WHITE = 14; // white keys per keyboard
const VIEW_W = TOTAL_WHITE; // SVG viewBox width  (1 unit = 1 white key)
const VIEW_H = 6; // SVG viewBox height (aspect ratio 14:6)
const BK_V = 3.6; // black key visual depth (60 % of VIEW_H)
// Hit-area notch now matches the visual black-key depth exactly. Previously
// this was shallower (3.0) than BK_V, which left a band directly under each
// black key where the white key's hit polygon was already full-width while
// the black key's hit rect was still on top of it — so a single press on
// the lower half of a black key also registered the white key underneath.
const WK_HIT_NOTCH = BK_V;
// Tiny epsilon (not a deliberate overlap) to avoid sub-pixel seams between
// adjacent hit shapes. Adjacent-key chords are handled separately, at event
// time, via pure coordinate math — see BOUNDARY_TOLERANCE_RATIO / getPadHits.
const KEY_OV = 0.001;

// Builds the 24 keys (14 white + 10 black) for a keyboard starting at
// `baseOctave`. Positions are in SVG user units (1 = one white-key width).
function buildKeyData(baseOctave) {
  const keys = [];
  for (let i = 0; i < TOTAL_WHITE; i++) {
    const name = WHITE_ORDER_FLAT[i];
    const octave = baseOctave + Math.floor(i / 7);
    const midi = (octave + 1) * 12 + SEMITONE[name];
    const prevName = i > 0 ? WHITE_ORDER_FLAT[i - 1] : null;
    const leftHasBlack = prevName != null &&
      BLACK_AFTER[prevName] !== undefined;
    const rightHasBlack = BLACK_AFTER[name] !== undefined;
    keys.push({
      type: "white",
      name: `${name}${octave}`,
      midi,
      pos: i,
      span: 1,
      leftCut: leftHasBlack ? 0.3 : 0,
      rightCut: rightHasBlack ? 0.3 : 0,
    });
    if (rightHasBlack) {
      keys.push({
        type: "black",
        name: `${BLACK_AFTER[name]}${octave}`,
        midi: midi + 1,
        pos: i + 1 - 0.3,
        span: 0.6,
      });
    }
  }
  return keys;
}

// SVG <polygon> points string for a white key's visual shape (8-point notch).
function whiteVisualPoints(pos, lc, rc) {
  const nd = BK_V;
  return `${pos + lc},0 ${pos + 1 - rc},0 ${pos + 1 - rc},${nd} ${
    pos + 1
  },${nd} ` +
    `${pos + 1},${VIEW_H} ${pos},${VIEW_H} ${pos},${nd} ${pos + lc},${nd}`;
}

// SVG <polygon> points string for a white key's hit area (shallower notch +
// small horizontal overlap so pressing at the boundary triggers both keys).
function whiteHitPoints(pos, lc, rc) {
  const nd = WK_HIT_NOTCH;
  const ov = KEY_OV;
  const x0 = pos - ov, x1 = pos + lc - ov;
  const x2 = pos + 1 - rc + ov, x3 = pos + 1 + ov;
  return `${x1},0 ${x2},0 ${x2},${nd} ${x3},${nd} ` +
    `${x3},${VIEW_H} ${x0},${VIEW_H} ${x0},${nd} ${x1},${nd}`;
}

const SVG_NS = "http://www.w3.org/2000/svg";

function makeSVGEl(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function makeGrad(id, stops) {
  const g = makeSVGEl("linearGradient", {
    id,
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1",
    gradientUnits: "objectBoundingBox",
  });
  for (const { offset, cssVar, color } of stops) {
    const s = makeSVGEl("stop", { offset });
    if (cssVar) s.style.stopColor = `var(${cssVar})`;
    else s.setAttribute("stop-color", color);
    g.append(s);
  }
  return g;
}

// Creates a full SVG keyboard and returns { svg, keyEls }.
function createSVGKeyboard(keyData, groupId) {
  const svg = makeSVGEl("svg", {
    viewBox: `0 0 ${VIEW_W} ${VIEW_H}`,
    width: "100%",
    height: "100%",
    preserveAspectRatio: "xMidYMin meet",
  });
  svg.style.display = "block";
  svg.style.touchAction = "none";

  const defs = makeSVGEl("defs", {});
  // 3-stop white key gradient via CSS vars (supports dark-mode toggle)
  defs.append(makeGrad(`wk-${groupId}`, [
    { offset: "0%", cssVar: "--wk-c0" },
    { offset: "65%", cssVar: "--wk-c1" },
    { offset: "100%", cssVar: "--wk-c2" },
  ]));
  // Black key gradient (hardcoded — looks same in both themes)
  defs.append(makeGrad(`bk-${groupId}`, [
    { offset: "0%", color: "#585050" },
    { offset: "18%", color: "#1c1818" },
    { offset: "100%", color: "#040202" },
  ]));
  // Drop-shadow for black keys
  const filt = makeSVGEl("filter", {
    id: `shad-${groupId}`,
    x: "-5%",
    width: "110%",
    y: "0%",
    height: "150%",
  });
  const ds = makeSVGEl("feDropShadow", {
    dx: "0",
    dy: "0.13",
    stdDeviation: "0.07",
    "flood-color": "#000",
    "flood-opacity": "0.5",
  });
  filt.append(ds);
  defs.append(filt);
  svg.appendChild(defs);

  // Layer groups (SVG paint order = DOM order)
  const gWV = makeSVGEl("g", {});
  const gBV = makeSVGEl("g", { filter: `url(#shad-${groupId})` });
  const gWH = makeSVGEl("g", { "pointer-events": "all" });
  const gBH = makeSVGEl("g", { "pointer-events": "all" });
  const gLB = makeSVGEl("g", { "pointer-events": "none" });
  svg.append(gWV, gBV, gWH, gBH, gLB);

  const keyEls = [];
  const whites = keyData.filter((d) => d.type === "white");
  const blacks = keyData.filter((d) => d.type === "black");

  whites.forEach((data, i) => {
    const vid = `wkv-${groupId}-${i}`;

    // Visual polygon
    const visual = makeSVGEl("polygon", {
      id: vid,
      points: whiteVisualPoints(data.pos, data.leftCut, data.rightCut),
      fill: `url(#wk-${groupId})`,
      stroke: "#a0a0a0",
      "stroke-width": "0.025",
    });
    gWV.appendChild(visual);
    // Front-edge accent (simulates key depth)
    gWV.appendChild(makeSVGEl("rect", {
      x: String(data.pos + 0.03),
      y: String(VIEW_H - 0.22),
      width: "0.94",
      height: "0.18",
      fill: "rgba(0,0,0,0.07)",
      rx: "0.05",
    }));

    // Hit polygon — fill-opacity > 0 ensures elementsFromPoint finds it
    const hit = makeSVGEl("polygon", {
      points: whiteHitPoints(data.pos, data.leftCut, data.rightCut),
      fill: "white",
      "fill-opacity": "0.002",
      "pointer-events": "all",
    });
    hit.classList.add("pad-hit");
    hit.dataset.index = String(data.midi);
    hit.dataset.visual = vid;
    gWH.appendChild(hit);
    setMPEKeyEvents(hit, groupId);

    const label = makeSVGEl("text", {
      x: String(data.pos + 0.5),
      y: String(VIEW_H - 0.36),
      "text-anchor": "middle",
      "font-size": "0.3",
      "font-family": "sans-serif",
      "font-weight": "bold",
      fill: "var(--wk-label)",
    });
    label.textContent = getTranslatedLabel(data.name);
    gLB.appendChild(label);
    keyEls.push({ el: hit, visual, label, data });
  });

  blacks.forEach((data, i) => {
    const vid = `bkv-${groupId}-${i}`;
    const ov = KEY_OV;

    const visual = makeSVGEl("rect", {
      id: vid,
      x: String(data.pos),
      y: "0",
      width: String(data.span),
      height: String(BK_V),
      fill: `url(#bk-${groupId})`,
      stroke: "#111",
      "stroke-width": "0.015",
      rx: "0.07",
    });
    gBV.appendChild(visual);
    // Specular highlight at very top of black key
    gBV.appendChild(makeSVGEl("rect", {
      x: String(data.pos + 0.06),
      y: "0.04",
      width: String(data.span - 0.12),
      height: "0.18",
      fill: "rgba(255,255,255,0.18)",
      rx: "0.05",
    }));

    // Hit rect — slightly wider for chord detection; fill-opacity > 0 for reliability
    const hit = makeSVGEl("rect", {
      x: String(data.pos - ov),
      y: "0",
      width: String(data.span + 2 * ov),
      height: String(BK_V),
      fill: "white",
      "fill-opacity": "0.002",
      "pointer-events": "all",
    });
    hit.classList.add("pad-hit");
    hit.dataset.index = String(data.midi);
    hit.dataset.visual = vid;
    gBH.appendChild(hit);
    setMPEKeyEvents(hit, groupId);

    const label = makeSVGEl("text", {
      x: String(data.pos + data.span / 2),
      y: String(BK_V - 0.2),
      "text-anchor": "middle",
      "font-size": "0.2",
      "font-family": "sans-serif",
      "font-weight": "bold",
      fill: "var(--bk-label)",
    });
    label.textContent = getTranslatedLabel(data.name);
    gLB.appendChild(label);
    keyEls.push({ el: hit, visual, label, data });
  });

  // Top rail — thin shadow line suggesting the piano body above the keys
  svg.appendChild(makeSVGEl("rect", {
    x: "0",
    y: "0",
    width: String(VIEW_W),
    height: "0.09",
    fill: "rgba(0,0,0,0.18)",
  }));

  return { svg, keyEls };
}

function createOctaveBar(groupId) {
  const bar = document.createElement("div");
  bar.className = "octave-bar";
  const down = document.createElement("button");
  down.type = "button";
  down.className = "btn btn-lg btn-danger";
  down.textContent = "⬇";
  const up = document.createElement("button");
  up.type = "button";
  up.className = "btn btn-lg btn-primary";
  up.textContent = "⬆";
  down.addEventListener("pointerdown", () => updateOctave(groupId, -1));
  up.addEventListener("pointerdown", () => updateOctave(groupId, 1));
  bar.append(down, up);
  return bar;
}

function initKeyboards() {
  const groups = [];
  document.querySelectorAll(".group").forEach((group, groupId) => {
    group.appendChild(createOctaveBar(groupId));
    const area = document.createElement("div");
    area.className = "keyboard-area";
    group.appendChild(area);

    const keyData = buildKeyData(baseOctaves[groupId]);
    const { svg, keyEls } = createSVGKeyboard(keyData, groupId);
    area.appendChild(svg);
    groups.push({ svg, area, keyEls });
  });
  return groups;
}

function updateOctave(groupId, direction) {
  const nextOctave = baseOctaves[groupId] + direction;
  if (nextOctave < 0 || nextOctave > 8) return;
  baseOctaves[groupId] = nextOctave;
  const keyData = buildKeyData(nextOctave);
  // keyEls is stored whites-first then blacks (same order as createSVGKeyboard)
  const whites = keyData.filter((d) => d.type === "white");
  const blacks = keyData.filter((d) => d.type === "black");
  const ordered = [...whites, ...blacks];
  keyboardGroups[groupId].keyEls.forEach((entry, i) => {
    entry.data = ordered[i];
    entry.el.dataset.index = String(ordered[i].midi);
    entry.label.textContent = getTranslatedLabel(ordered[i].name);
  });
}

function applyOrientation() {
  const isLandscape = orientationMQ.matches;
  panel.classList.toggle("layout-landscape", isLandscape);
  panel.classList.toggle("layout-portrait", !isLandscape);
}

function initConfig() {
  const ccHandlers = [
    (ch, v) => midy.setControlChange(ch, 1, v),
    (ch, v) => midy.setControlChange(ch, 76, v),
    (ch, v) => midy.setControlChange(ch, 77, v),
    (ch, v) => midy.setControlChange(ch, 78, v),
    (ch, v) => midy.setControlChange(ch, 91, v),
    (ch, v) => midy.setControlChange(ch, 93, v),
  ];
  document.getElementById("config").querySelectorAll("div.col")
    .forEach((config, groupId) => {
      const channelNumber = groupId === 0 ? 0 : 15;
      initMode(config, groupId);
      initEffect(config, groupId);
      initDrumToggle(config, channelNumber);
      initRangeControls(config, channelNumber, ccHandlers);
    });
}

function initMode(config, groupId) {
  const form = config.querySelectorAll("form")[0];
  form.addEventListener("change", (event) => {
    bendEnabled[groupId] = event.target.value === "bend";
  });
}

function initEffect(config, groupId) {
  const form = config.querySelectorAll("form")[1];
  form.addEventListener("change", (event) => {
    effectTypes[groupId] = event.target.value;
  });
}

function initDrumToggle(config, channelNumber) {
  const checkbox = config.querySelector("input[role=switch]");
  checkbox.addEventListener("change", (event) => {
    config.querySelector("midi-instrument").parentNode
      .classList.toggle("d-none");
    if (event.target.checked) {
      midy.setControlChange(channelNumber, 0, 120); // bankMSB
      midy.setProgramChange(channelNumber, 0);
    } else {
      midy.setControlChange(channelNumber, 0, 121); // bankMSB
      const select = config.querySelector("midi-instrument").shadowRoot
        .querySelector("select");
      select.selectedIndex = 0;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
}

function initRangeControls(config, channelNumber, ccHandlers) {
  config.querySelectorAll("input[type=range]").forEach((input, j) => {
    const handler = ccHandlers[j];
    if (!handler) return;
    input.addEventListener("change", (event) => {
      handler(channelNumber, event.target.value);
    });
  });
}

const lowerFreeChannels = Array.from({ length: 7 }, (_, i) => i + 1);
const upperFreeChannels = Array.from({ length: 7 }, (_, i) => i + 8);
const mpeHitMap = new Map();
const mpePointers = new Map();

const htmlLang = document.documentElement.lang;
const noteMap = {
  ja: { C: "ド", D: "レ", E: "ミ", F: "ファ", G: "ソ", A: "ラ", B: "シ" },
  en: { C: "C", D: "D", E: "E", F: "F", G: "G", A: "A", B: "B" },
};

const afterTouchEnabled = true;
const baseOctaves = [4, 4];
const effectTypes = ["expression", "expression"];
const bendEnabled = [false, false];
let handMode = 1;

const panel = document.getElementById("panel");
const keyboardGroups = initKeyboards();

const orientationMQ = matchMedia("(orientation: landscape)");
orientationMQ.addEventListener("change", applyOrientation);
globalThis.addEventListener("resize", applyOrientation);
applyOrientation();

// Panel-level move/up/cancel so events reach handlers even when pointer
// moves outside individual SVG elements (panel already captures the pointer).
panel.addEventListener("pointermove", handlePointerMove);
panel.addEventListener("pointerup", handlePointerUp);
panel.addEventListener("pointercancel", handlePointerUp);

const soundFontURL = "https://soundfonts.pages.dev/GeneralUser_GS_v1.471";
const audioContext = new AudioContext();
const midy = new Midy(audioContext);
await Promise.all([
  midy.loadSoundFont(`${soundFontURL}/000.sf3`),
  midy.loadSoundFont(`${soundFontURL}/128.sf3`),
]);
for (let i = 0; i < 16; i++) {
  midy.channels[i].setPitchBendRange(1200);
}
midy.channels[9].setBankMSB(121);
midy.setProgramChange(9, 0);
midy.setMIDIPolyphonicExpression(0, 7);
midy.setMIDIPolyphonicExpression(15, 7);
initConfig();

document.getElementById("toggleDarkMode").onclick = toggleDarkMode;
document.getElementById("toggleHandMode").onclick = toggleHandMode;
document.getElementById("lang").onchange = changeLang;
document.addEventListener("visibilitychange", async () => {
  if (document.hidden) {
    if (midy.audioContext.state === "running") {
      await midy.audioContext.suspend();
    }
  } else {
    if (midy.audioContext.state === "suspended") {
      await midy.audioContext.resume();
    }
  }
});
if (CSS.supports("-webkit-touch-callout: default")) { // iOS
  // prevent double click zoom
  document.addEventListener("dblclick", (event) => event.preventDefault());
  // prevent text selection
  const preventDefault = (event) => event.preventDefault();
  const panel = document.getElementById("panel");
  panel.addEventListener("touchstart", () => {
    document.addEventListener("touchstart", preventDefault, {
      passive: false,
    });
  });
  panel.addEventListener("touchend", () => {
    document.removeEventListener("touchstart", preventDefault, {
      passive: false,
    });
  });
}
