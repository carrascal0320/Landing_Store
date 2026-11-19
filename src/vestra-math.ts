export interface PackshotBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ProductSpec {
  id: number;
  title: string;
  price: string;
  pillName: string;
  sub: string;
  wearFile: string;
  box: PackshotBox;
}

export const CLOUDFRONT_PREFIX =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/';

export const BASE_PLATE_FILE =
  'hf_20261115_071307_1d0f42d5-b05f-4e21-bf76-f52fb4b12bb5.png';

export const PACKSHOT_SHEET_FILE =
  'hf_20261115_071304_55f839b8-7976-43af-8b07-b439c6be0936.png';

export const PRODUCTS: ProductSpec[] = [
  {
    id: 0,
    title: 'Alpine Puffer',
    price: '$238.00',
    pillName: 'Alpine Puffer Jacket',
    sub: 'Ice Grey',
    wearFile: 'hf_20261115_071402_80cf9c12-dd74-45cf-a639-1f8580543ff3.png',
    box: { x: 134, y: 79, w: 760, h: 863 },
  },
  {
    id: 1,
    title: 'Ridge Fleece',
    price: '$148.00',
    pillName: 'Ridge Fleece Jacket',
    sub: 'Sage',
    wearFile: 'hf_20261115_071402_63307d14-96fd-4b18-bae5-034018df0692.png',
    box: { x: 1138, y: 79, w: 790, h: 863 },
  },
  {
    id: 2,
    title: 'Drift Shell',
    price: '$196.00',
    pillName: 'Drift Shell Jacket',
    sub: 'Light Grey',
    wearFile: 'hf_20261115_071402_01ef6ea1-a2e6-4d0d-83ce-cbae31202ccc.png',
    box: { x: 137, y: 1024, w: 748, h: 901 },
  },
  {
    id: 3,
    title: 'Harbor Parka',
    price: '$284.00',
    pillName: 'Harbor Parka',
    sub: 'Navy',
    wearFile: 'hf_20261115_071400_47a4d43c-8f7c-4f0a-b860-1dc753202b92.png',
    box: { x: 1146, y: 1011, w: 776, h: 966 },
  },
];

export function buildProxyUrl(fileName: string, width: number): string {
  const original = CLOUDFRONT_PREFIX + fileName;
  return `https://images.higgs.ai/?default=1&output=webp&url=${encodeURIComponent(original)}&w=${width}&q=85`;
}

export interface DesktopLayout {
  isPhone: false;
  u: number;
  navHeight: number;
  ps: number;
  ox: number;
  oy: number;
  railScale: number;
  railCy: number;
  slot0Left: number;
  slot1Left: number;
  dashLeft: number;
  dashTop: number;
}

export interface PhoneLayout {
  isPhone: true;
  u: number;
  navHeight: number;
  stageTop: number;
  stageBottom: number;
  stageHeight: number;
  ps: number;
  ox: number;
  oy: number;
  railScale: number;
  railCy: number;
  slot0Left: number;
  slot1Left: number;
  dashLeft: number;
  dashTop: number;
}

export type HeroLayout = DesktopLayout | PhoneLayout;

export function computeLayout(
  vw: number,
  vh: number,
  shopBtnBottom = 228
): HeroLayout {
  const isPhone = vw < 820;
  if (!isPhone) {
    const u = Math.min(vw / 1440, vh / 900);
    const navHeight = Math.max(44 * u, 40);
    const ps = Math.max(vw / 2048, vh / 1360);
    const ox = (vw - 2048 * ps) / 2;
    const rawOy = (vh - 1360 * ps) / 2;
    const oy = Math.min(0, Math.max(rawOy, navHeight + 18 * u - 150 * ps));
    const railScale = 0.335 * u;
    const railCy = vh * 0.5 - 13 * u;
    return {
      isPhone: false,
      u,
      navHeight,
      ps,
      ox,
      oy,
      railScale,
      railCy,
      slot0Left: vw - 393 * u,
      slot1Left: vw - 120 * u,
      dashLeft: vw - 393 * u,
      dashTop: vh * 0.5 + 190 * u,
    };
  }

  const u = vw / 390;
  const navHeight = 52;
  const stageTop = shopBtnBottom + 8;
  const stageBottom = vh - 82;
  const stageHeight = Math.max(120, stageBottom - stageTop);
  const ps = Math.min(stageHeight / 1080, (0.64 * vw) / 600);
  const ox = 0.39 * vw - 1012 * ps;
  const oy = stageTop - 120 * ps;
  const railScale = 0.29 * ps;
  const railCy = stageTop + 0.4 * stageHeight;
  return {
    isPhone: true,
    u,
    navHeight,
    stageTop,
    stageBottom,
    stageHeight,
    ps,
    ox,
    oy,
    railScale,
    railCy,
    slot0Left: vw - 102 * u,
    slot1Left: vw - 10 * u,
    dashLeft: vw - 102 * u,
    dashTop: railCy + 500 * railScale,
  };
}

export function computePackshotStyle(box: PackshotBox, scale: number) {
  return {
    width: box.w * scale,
    height: box.h * scale,
    bgSize: 2048 * scale,
    bgPosX: -box.x * scale,
    bgPosY: -box.y * scale,
  };
}

export function computeFlyerTarget(
  startLeft: number,
  startTop: number,
  box: PackshotBox,
  railScale: number,
  ox: number,
  oy: number,
  ps: number
) {
  const startCx = startLeft + (box.w * railScale) / 2;
  const startCy = startTop + (box.h * railScale) / 2;
  const targetCx = ox + 1012 * ps;
  const targetCy = oy + 710 * ps;
  const k = (0.86 * 600 * ps) / (760 * railScale);
  return {
    dx: targetCx - startCx,
    dy: targetCy - startCy,
    scale: k,
  };
}

export interface SwapQueueState {
  active: number;
  swapping: boolean;
  inFlightTarget: number | null;
  queuedTarget: number | null;
}

export function requestSwapState(
  state: SwapQueueState,
  target: number,
  count = 4
): { nextState: SwapQueueState; startSwapTo: number | null } {
  const normalized = ((target % count) + count) % count;
  if (!state.swapping) {
    if (normalized === state.active) {
      return { nextState: state, startSwapTo: null };
    }
    return {
      nextState: {
        active: state.active,
        swapping: true,
        inFlightTarget: normalized,
        queuedTarget: null,
      },
      startSwapTo: normalized,
    };
  }

  const currentHeading = state.inFlightTarget ?? state.active;
  const queuedTarget = normalized === currentHeading ? null : normalized;
  return {
    nextState: {
      ...state,
      queuedTarget,
    },
    startSwapTo: null,
  };
}

export function stepSwapState(
  state: SwapQueueState,
  dir: 1 | -1,
  count = 4
): { nextState: SwapQueueState; startSwapTo: number | null } {
  const base = state.swapping
    ? state.queuedTarget !== null
      ? state.queuedTarget
      : (state.inFlightTarget ?? state.active)
    : state.active;
  const target = (((base + dir) % count) + count) % count;
  return requestSwapState(state, target, count);
}

export function finishSwapState(state: SwapQueueState): {
  nextState: SwapQueueState;
  startSwapTo: number | null;
} {
  const landed = state.inFlightTarget ?? state.active;
  const queued = state.queuedTarget;
  if (queued !== null && queued !== landed) {
    return {
      nextState: {
        active: landed,
        swapping: true,
        inFlightTarget: queued,
        queuedTarget: null,
      },
      startSwapTo: queued,
    };
  }
  return {
    nextState: {
      active: landed,
      swapping: false,
      inFlightTarget: null,
      queuedTarget: null,
    },
    startSwapTo: null,
  };
}

export interface WheelAccumulatorState {
  acc: number;
  lastEventTime: number;
  lastStepTime: number;
}

export function processWheelDelta(
  state: WheelAccumulatorState,
  deltaY: number,
  deltaMode: number,
  viewportHeight: number,
  now: number
): { nextState: WheelAccumulatorState; stepDir: 1 | -1 | 0 } {
  const px =
    deltaMode === 1
      ? deltaY * 16
      : deltaMode === 2
        ? deltaY * viewportHeight
        : deltaY;
  if (px === 0) {
    return { nextState: state, stepDir: 0 };
  }
  let acc = state.acc;
  if (now - state.lastEventTime > 250) {
    acc = 0;
  }
  if (acc !== 0 && Math.sign(px) !== Math.sign(acc)) {
    acc = 0;
  }
  acc += px;

  if (Math.abs(acc) >= 50 && now - state.lastStepTime >= 140) {
    const stepDir: 1 | -1 = acc > 0 ? 1 : -1;
    return {
      nextState: {
        acc: 0,
        lastEventTime: now,
        lastStepTime: now,
      },
      stepDir,
    };
  }

  return {
    nextState: {
      acc,
      lastEventTime: now,
      lastStepTime: state.lastStepTime,
    },
    stepDir: 0,
  };
}
