import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BASE_PLATE_FILE,
  PRODUCTS,
  buildProxyUrl,
  computeFlyerTarget,
  computeLayout,
  computePackshotStyle,
  finishSwapState,
  processWheelDelta,
  stepSwapState,
  type SwapQueueState,
  type WheelAccumulatorState,
} from './vestra-math';

test('desktop 1440x900 layout matches exact specification measurements', () => {
  const layout = computeLayout(1440, 900);
  assert.equal(layout.isPhone, false);
  assert.equal(layout.u, 1);
  assert.equal(layout.navHeight, 44);
  assert.ok(Math.abs(layout.ps - 0.703125) < 1e-6);
  assert.equal(layout.ox, 0);
  assert.ok(Math.abs(layout.oy - -28.125) < 1e-6);
  assert.equal(layout.slot0Left, 1047);
  assert.equal(layout.slot1Left, 1320);
  assert.equal(layout.dashLeft, 1047);
  assert.equal(layout.dashTop, 640);

  // Verify Ridge Fleece in slot 0: x 1047, y ~292, size ~265x289
  const fleece = computePackshotStyle(PRODUCTS[1].box, layout.railScale);
  const top = layout.railCy - fleece.height / 2;
  assert.equal(Math.round(fleece.width), 265);
  assert.equal(Math.round(fleece.height), 289);
  assert.equal(Math.round(top), 292);
});

test('short wide desktop window clamps oy so head stays below nav', () => {
  const layout = computeLayout(1440, 560);
  assert.equal(layout.isPhone, false);
  const headTop = layout.oy + 150 * layout.ps;
  assert.ok(headTop >= layout.navHeight + 18 * layout.u - 0.01);
  assert.ok(layout.oy <= 0);
});

test('phone 390x844 layout positions garment centre at 39% width with valid slots', () => {
  const layout = computeLayout(390, 844, 228);
  assert.equal(layout.isPhone, true);
  assert.equal(layout.u, 1);
  assert.equal(layout.navHeight, 52);
  const garmentX = layout.ox + 1012 * layout.ps;
  assert.ok(Math.abs(garmentX - 0.39 * 390) < 1e-6);
  assert.equal(layout.slot0Left, 288);
  assert.equal(layout.slot1Left, 380);
});

test('flyer target lands at torso center with expected scale ratio', () => {
  const layout = computeLayout(1440, 900);
  const box = PRODUCTS[1].box;
  const fleece = computePackshotStyle(box, layout.railScale);
  const top = layout.railCy - fleece.height / 2;
  const flyer = computeFlyerTarget(
    layout.slot0Left,
    top,
    box,
    layout.railScale,
    layout.ox,
    layout.oy,
    layout.ps
  );
  const expectedK = (0.86 * 600 * layout.ps) / (760 * layout.railScale);
  assert.ok(Math.abs(flyer.scale - expectedK) < 1e-6);
  assert.ok(flyer.dx < 0); // travels left from rail to centre model
});

test('five rapid step-downs land five jackets forward (mod 4)', () => {
  let state: SwapQueueState = {
    active: 0,
    swapping: false,
    inFlightTarget: null,
    queuedTarget: null,
  };

  // Notch 1 -> starts swap 0 -> 1
  let res = stepSwapState(state, 1);
  state = res.nextState;
  assert.equal(res.startSwapTo, 1);

  // Notches 2, 3, 4, 5 during running swap
  res = stepSwapState(state, 1);
  state = res.nextState;
  assert.equal(state.queuedTarget, 2);

  res = stepSwapState(state, 1);
  state = res.nextState;
  assert.equal(state.queuedTarget, 3);

  res = stepSwapState(state, 1);
  state = res.nextState;
  assert.equal(state.queuedTarget, 0);

  res = stepSwapState(state, 1);
  state = res.nextState;
  // 5 steps from 0 is 1, which equals inFlightTarget (1), so queue clears
  assert.equal(state.queuedTarget, null);

  // Swap completes at product 1
  res = finishSwapState(state);
  state = res.nextState;
  assert.equal(state.active, 1);
  assert.equal(state.swapping, false);
  assert.equal(res.startSwapTo, null);
});

test('two rapid step-downs execute second queued swap after first finishes', () => {
  let state: SwapQueueState = {
    active: 0,
    swapping: false,
    inFlightTarget: null,
    queuedTarget: null,
  };

  state = stepSwapState(state, 1).nextState;
  state = stepSwapState(state, 1).nextState;
  assert.equal(state.inFlightTarget, 1);
  assert.equal(state.queuedTarget, 2);

  const done1 = finishSwapState(state);
  assert.equal(done1.startSwapTo, 2);
  assert.equal(done1.nextState.active, 1);
  assert.equal(done1.nextState.swapping, true);

  const done2 = finishSwapState(done1.nextState);
  assert.equal(done2.startSwapTo, null);
  assert.equal(done2.nextState.active, 2);
  assert.equal(done2.nextState.swapping, false);
});

test('wheel accumulator respects 50px threshold, 140ms cooldown, and 250ms idle reset', () => {
  let w: WheelAccumulatorState = { acc: 0, lastEventTime: 0, lastStepTime: -1000 };

  // 100px mouse wheel notch triggers exactly 1 step
  let r = processWheelDelta(w, 100, 0, 900, 1000);
  w = r.nextState;
  assert.equal(r.stepDir, 1);
  assert.equal(w.acc, 0);

  // Immediate momentum event within 140ms does not trigger
  r = processWheelDelta(w, 80, 0, 900, 1050);
  w = r.nextState;
  assert.equal(r.stepDir, 0);

  // After 140ms cooldown, another scroll triggers
  r = processWheelDelta(w, 60, 0, 900, 1200);
  w = r.nextState;
  assert.equal(r.stepDir, 1);

  // Direction reversal resets accumulator
  r = processWheelDelta(w, 30, 0, 900, 1400);
  w = r.nextState;
  assert.equal(w.acc, 30);
  r = processWheelDelta(w, -60, 0, 900, 1450);
  w = r.nextState;
  assert.equal(r.stepDir, -1);

  // Line mode multiplies by 16
  r = processWheelDelta(w, 4, 1, 900, 1700);
  assert.equal(r.stepDir, 1);
});

test('proxy URL builder matches exact Higgsfield proxy format', () => {
  const url = buildProxyUrl(BASE_PLATE_FILE, 2048);
  assert.equal(
    url,
    'https://images.higgs.ai/?default=1&output=webp&url=' +
      encodeURIComponent(
        'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/' +
          BASE_PLATE_FILE
      ) +
      '&w=2048&q=85'
  );
});
