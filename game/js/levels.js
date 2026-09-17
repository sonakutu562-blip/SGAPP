import { mulberry32 } from './utils.js';
import { worldOf, WORLD_MATERIALS, WORLD_BIRDS } from './worlds.js';

const GY = 430;

const HAND_CRAFTED = [
    { birds: ["red", "red", "red"], s1: 2000, s2: 4000, s3: 6000, structs: [{ t: "wood", x: 700, y: 380, w: 20, h: 100 }, { t: "wood", x: 780, y: 380, w: 20, h: 100 }, { t: "wood", x: 740, y: 320, w: 120, h: 20 }], pigs: [{ x: 740, y: 280, r: 18 }] },
    { birds: ["red", "blue", "red"], s1: 3000, s2: 6000, s3: 9000, structs: [{ t: "wood", x: 680, y: 380, w: 20, h: 100 }, { t: "wood", x: 760, y: 380, w: 20, h: 100 }, { t: "wood", x: 720, y: 320, w: 120, h: 20 }, { t: "glass", x: 700, y: 290, w: 20, h: 60 }, { t: "glass", x: 740, y: 290, w: 20, h: 60 }, { t: "wood", x: 720, y: 252, w: 80, h: 16 }], pigs: [{ x: 720, y: 380, r: 16 }, { x: 720, y: 220, r: 16 }] },
    { birds: ["red", "yellow", "red", "blue"], s1: 4000, s2: 8000, s3: 12000, structs: [{ t: "stone", x: 660, y: 390, w: 20, h: 80 }, { t: "stone", x: 760, y: 390, w: 20, h: 80 }, { t: "stone", x: 710, y: 342, w: 120, h: 16 }, { t: "wood", x: 680, y: 310, w: 20, h: 60 }, { t: "wood", x: 740, y: 310, w: 20, h: 60 }, { t: "wood", x: 710, y: 275, w: 100, h: 16 }, { t: "glass", x: 850, y: 400, w: 20, h: 60 }, { t: "glass", x: 910, y: 400, w: 20, h: 60 }, { t: "glass", x: 880, y: 362, w: 80, h: 16 }], pigs: [{ x: 710, y: 250, r: 18 }, { x: 710, y: 400, r: 16 }, { x: 880, y: 340, r: 16 }] },
    { birds: ["blue", "blue", "red", "yellow"], s1: 5000, s2: 10000, s3: 15000, structs: [{ t: "glass", x: 620, y: 400, w: 16, h: 60 }, { t: "glass", x: 670, y: 400, w: 16, h: 60 }, { t: "glass", x: 645, y: 364, w: 70, h: 14 }, { t: "glass", x: 750, y: 400, w: 16, h: 60 }, { t: "glass", x: 800, y: 400, w: 16, h: 60 }, { t: "glass", x: 775, y: 364, w: 70, h: 14 }, { t: "glass", x: 880, y: 400, w: 16, h: 60 }, { t: "glass", x: 930, y: 400, w: 16, h: 60 }, { t: "glass", x: 905, y: 364, w: 70, h: 14 }, { t: "wood", x: 775, y: 330, w: 300, h: 14 }], pigs: [{ x: 645, y: 340, r: 16 }, { x: 775, y: 340, r: 16 }, { x: 905, y: 340, r: 16 }, { x: 775, y: 308, r: 18 }] },
    { birds: ["yellow", "black", "red", "blue"], s1: 6000, s2: 12000, s3: 18000, structs: [{ t: "stone", x: 650, y: 380, w: 24, h: 100 }, { t: "stone", x: 750, y: 380, w: 24, h: 100 }, { t: "stone", x: 700, y: 322, w: 130, h: 18 }, { t: "wood", x: 670, y: 290, w: 20, h: 60 }, { t: "wood", x: 730, y: 290, w: 20, h: 60 }, { t: "stone", x: 700, y: 252, w: 100, h: 18 }, { t: "stone", x: 850, y: 390, w: 24, h: 80 }, { t: "stone", x: 950, y: 390, w: 24, h: 80 }, { t: "stone", x: 900, y: 342, w: 130, h: 18 }, { t: "wood", x: 880, y: 310, w: 20, h: 60 }, { t: "wood", x: 920, y: 310, w: 20, h: 60 }, { t: "wood", x: 900, y: 275, w: 80, h: 16 }], pigs: [{ x: 700, y: 230, r: 18 }, { x: 700, y: 370, r: 16 }, { x: 900, y: 252, r: 16 }, { x: 900, y: 380, r: 16 }] },
    { birds: ["black", "yellow", "blue", "red", "black"], s1: 8000, s2: 16000, s3: 24000, structs: [{ t: "stone", x: 640, y: 385, w: 24, h: 90 }, { t: "stone", x: 780, y: 385, w: 24, h: 90 }, { t: "stone", x: 710, y: 332, w: 170, h: 18 }, { t: "stone", x: 660, y: 300, w: 24, h: 60 }, { t: "stone", x: 760, y: 300, w: 24, h: 60 }, { t: "stone", x: 710, y: 262, w: 130, h: 18 }, { t: "wood", x: 690, y: 235, w: 20, h: 50 }, { t: "wood", x: 730, y: 235, w: 20, h: 50 }, { t: "wood", x: 710, y: 202, w: 80, h: 16 }, { t: "glass", x: 710, y: 180, w: 40, h: 40 }, { t: "stone", x: 870, y: 400, w: 100, h: 20 }, { t: "stone", x: 840, y: 370, w: 20, h: 60 }, { t: "stone", x: 900, y: 370, w: 20, h: 60 }, { t: "stone", x: 870, y: 332, w: 80, h: 18 }], pigs: [{ x: 710, y: 380, r: 16 }, { x: 710, y: 300, r: 16 }, { x: 710, y: 155, r: 14 }, { x: 870, y: 310, r: 16 }, { x: 870, y: 380, r: 16 }] },
    { birds: ["black", "blue", "yellow", "black", "red", "blue"], s1: 10000, s2: 20000, s3: 30000, structs: [{ t: "stone", x: 580, y: 385, w: 24, h: 90 }, { t: "stone", x: 680, y: 385, w: 24, h: 90 }, { t: "stone", x: 630, y: 332, w: 130, h: 18 }, { t: "wood", x: 610, y: 300, w: 20, h: 60 }, { t: "wood", x: 650, y: 300, w: 20, h: 60 }, { t: "wood", x: 630, y: 262, w: 80, h: 16 }, { t: "stone", x: 770, y: 390, w: 24, h: 80 }, { t: "stone", x: 870, y: 390, w: 24, h: 80 }, { t: "stone", x: 820, y: 342, w: 130, h: 18 }, { t: "glass", x: 800, y: 310, w: 16, h: 60 }, { t: "glass", x: 840, y: 310, w: 16, h: 60 }, { t: "wood", x: 820, y: 275, w: 80, h: 16 }, { t: "stone", x: 940, y: 395, w: 24, h: 70 }, { t: "stone", x: 1020, y: 395, w: 24, h: 70 }, { t: "stone", x: 980, y: 352, w: 110, h: 18 }, { t: "wood", x: 960, y: 320, w: 20, h: 60 }, { t: "wood", x: 1000, y: 320, w: 20, h: 60 }, { t: "stone", x: 980, y: 282, w: 80, h: 18 }, { t: "glass", x: 980, y: 260, w: 40, h: 40 }], pigs: [{ x: 630, y: 240, r: 18 }, { x: 630, y: 380, r: 16 }, { x: 820, y: 252, r: 16 }, { x: 820, y: 385, r: 16 }, { x: 980, y: 238, r: 14 }, { x: 980, y: 385, r: 16 }] },
    { birds: ["blue", "blue", "blue", "red"], s1: 6000, s2: 12000, s3: 18000, structs: [{ t: "glass", x: 650, y: 395, w: 16, h: 70 }, { t: "glass", x: 710, y: 395, w: 16, h: 70 }, { t: "glass", x: 680, y: 352, w: 80, h: 14 }, { t: "glass", x: 660, y: 320, w: 16, h: 60 }, { t: "glass", x: 700, y: 320, w: 16, h: 60 }, { t: "glass", x: 680, y: 284, w: 60, h: 14 }, { t: "glass", x: 800, y: 395, w: 16, h: 70 }, { t: "glass", x: 860, y: 395, w: 16, h: 70 }, { t: "glass", x: 830, y: 352, w: 80, h: 14 }, { t: "glass", x: 810, y: 320, w: 16, h: 60 }, { t: "glass", x: 850, y: 320, w: 16, h: 60 }, { t: "glass", x: 830, y: 284, w: 60, h: 14 }], pigs: [{ x: 680, y: 265, r: 15 }, { x: 680, y: 390, r: 15 }, { x: 830, y: 265, r: 15 }, { x: 830, y: 390, r: 15 }] }
];

function tShelter(cx, m) {
    return { s: [{ t: m, x: cx - 25, y: GY - 30, w: 16, h: 60 }, { t: m, x: cx + 25, y: GY - 30, w: 16, h: 60 }, { t: m, x: cx, y: GY - 67, w: 70, h: 14 }], p: [{ x: cx, y: GY - 16, r: 14 }], w: 80 };
}
function tTower2(cx, m) {
    return { s: [{ t: m, x: cx - 25, y: GY - 30, w: 16, h: 60 }, { t: m, x: cx + 25, y: GY - 30, w: 16, h: 60 }, { t: m, x: cx, y: GY - 67, w: 70, h: 14 }, { t: m, x: cx - 20, y: GY - 100, w: 14, h: 52 }, { t: m, x: cx + 20, y: GY - 100, w: 14, h: 52 }, { t: m, x: cx, y: GY - 133, w: 54, h: 14 }], p: [{ x: cx, y: GY - 16, r: 14 }, { x: cx, y: GY - 82, r: 12 }], w: 80 };
}
function tTower3(cx, m) {
    return { s: [{ t: m, x: cx - 28, y: GY - 35, w: 18, h: 70 }, { t: m, x: cx + 28, y: GY - 35, w: 18, h: 70 }, { t: m, x: cx, y: GY - 77, w: 74, h: 14 }, { t: m, x: cx - 22, y: GY - 107, w: 14, h: 46 }, { t: m, x: cx + 22, y: GY - 107, w: 14, h: 46 }, { t: m, x: cx, y: GY - 137, w: 58, h: 14 }, { t: m, x: cx - 16, y: GY - 157, w: 12, h: 26 }, { t: m, x: cx + 16, y: GY - 157, w: 12, h: 26 }, { t: m, x: cx, y: GY - 177, w: 44, h: 14 }], p: [{ x: cx, y: GY - 16, r: 14 }, { x: cx, y: GY - 90, r: 12 }, { x: cx, y: GY - 148, r: 11 }], w: 82 };
}
function tBox(cx, m) {
    return { s: [{ t: m, x: cx - 30, y: GY - 30, w: 16, h: 60 }, { t: m, x: cx + 30, y: GY - 30, w: 16, h: 60 }, { t: m, x: cx, y: GY - 5, w: 44, h: 10 }, { t: m, x: cx, y: GY - 67, w: 76, h: 14 }], p: [{ x: cx, y: GY - 28, r: 14 }], w: 80 };
}
function tPyramid(cx, m) {
    return { s: [{ t: m, x: cx - 35, y: GY - 15, w: 28, h: 30 }, { t: m, x: cx, y: GY - 15, w: 28, h: 30 }, { t: m, x: cx + 35, y: GY - 15, w: 28, h: 30 }, { t: m, x: cx - 17, y: GY - 45, w: 28, h: 30 }, { t: m, x: cx + 17, y: GY - 45, w: 28, h: 30 }, { t: m, x: cx, y: GY - 75, w: 28, h: 30 }], p: [{ x: cx, y: GY - 38, r: 10 }], w: 110 };
}
function tDouble(cx, m) {
    return { s: [{ t: m, x: cx - 45, y: GY - 30, w: 16, h: 60 }, { t: m, x: cx, y: GY - 30, w: 16, h: 60 }, { t: m, x: cx + 45, y: GY - 30, w: 16, h: 60 }, { t: m, x: cx - 22, y: GY - 67, w: 62, h: 14 }, { t: m, x: cx + 22, y: GY - 67, w: 62, h: 14 }], p: [{ x: cx, y: GY - 16, r: 14 }, { x: cx, y: GY - 16, r: 14 }], w: 110 };
}
function tFortress(cx, m) {
    return { s: [{ t: m, x: cx - 40, y: GY - 40, w: 20, h: 80 }, { t: m, x: cx + 40, y: GY - 40, w: 20, h: 80 }, { t: m, x: cx, y: GY - 87, w: 100, h: 14 }, { t: m, x: cx - 30, y: GY - 110, w: 16, h: 32 }, { t: m, x: cx + 30, y: GY - 110, w: 16, h: 32 }, { t: m, x: cx, y: GY - 133, w: 76, h: 14 }], p: [{ x: cx, y: GY - 16, r: 15 }, { x: cx, y: GY - 100, r: 13 }], w: 110 };
}
function tTntShelter(cx, m) {
    return { s: [{ t: m, x: cx - 25, y: GY - 30, w: 16, h: 60 }, { t: m, x: cx + 25, y: GY - 30, w: 16, h: 60 }, { t: m, x: cx, y: GY - 67, w: 70, h: 14 }, { t: 'tnt', x: cx, y: GY - 10, w: 20, h: 20 }], p: [{ x: cx, y: GY - 82, r: 14 }], w: 80 };
}
function tTntWall(cx, m) {
    return { s: [{ t: m, x: cx, y: GY - 50, w: 20, h: 100 }, { t: 'tnt', x: cx, y: GY - 110, w: 20, h: 20 }], p: [], w: 40 };
}

const EASY_T = [tShelter, tBox];
const MED_T = [tShelter, tTower2, tDouble, tPyramid];
const HARD_T = [tTower2, tTower3, tFortress, tPyramid, tDouble];
const TNT_T = [tTntShelter, tTntWall];

function generateLevel(id) {
    const rng = mulberry32(id * 7919 + 31337);
    const w = worldOf(id);
    const diff = id / 107;
    const wm = WORLD_MATERIALS[w];
    const wb = WORLD_BIRDS[w];
    const nGroups = Math.min(5, 2 + Math.floor(diff * 3 + rng() * 1.5));
    let structs = [];
    let pigs = [];
    let cx = 460 + Math.floor(rng() * 100);
    const hasTnt = w >= 4;

    for (let g = 0; g < nGroups; g++) {
        let tpl;
        if (hasTnt && rng() > 0.6) {
            tpl = TNT_T[Math.floor(rng() * TNT_T.length)];
        } else if (diff < 0.25) {
            tpl = EASY_T[Math.floor(rng() * EASY_T.length)];
        } else if (diff < 0.55) {
            tpl = MED_T[Math.floor(rng() * MED_T.length)];
        } else {
            tpl = HARD_T[Math.floor(rng() * HARD_T.length)];
        }
        const mat = wm[Math.floor(rng() * wm.length)];
        const res = tpl(cx, mat);
        structs.push(...res.s);
        pigs.push(...res.p);
        cx += res.w + 30 + Math.floor(rng() * 50);
        if (cx > 1080) break;
    }

    if (pigs.length === 0) {
        pigs.push({ x: structs[0] ? structs[0].x : 600, y: GY - 16, r: 14 });
    }

    const nBirds = Math.min(7, 3 + Math.floor(diff * 4 + rng()));
    const birds = [];
    for (let b = 0; b < nBirds; b++) {
        birds.push(wb[Math.floor(rng() * wb.length)]);
    }

    let wind = 0;
    if (w >= 2 && rng() > 0.55) {
        wind = (rng() - 0.5) * 0.0004;
    }

    const raw = 1500 + pigs.length * 1200 + structs.length * 400 + diff * 5000;
    const s1 = Math.round(raw / 1000) * 1000;
    const s2 = s1 * 2;
    const s3 = s1 * 3;

    return { birds, structs, pigs, s1, s2, s3, wind };
}

export function getLevel(id) {
    if (id < HAND_CRAFTED.length) {
        return { ...HAND_CRAFTED[id], wind: 0 };
    }
    return generateLevel(id);
}

export const TOTAL_LEVELS = 108;
