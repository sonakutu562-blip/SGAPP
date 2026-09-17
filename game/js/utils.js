export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export function dist(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

export function lerp(a, b, t) {
    return a + (b - a) * t;
}

export function randomRange(min, max) {
    return min + Math.random() * (max - min);
}

export function angle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

export function mulberry32(a) {
    return function () {
        a |= 0;
        a = a + 0x6D2B79F5 | 0;
        var t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

export function saveProgress(data) {
    try {
        localStorage.setItem('ff2', JSON.stringify(data));
    } catch (e) { /* storage full or blocked */ }
}

export function loadProgress() {
    try {
        const raw = localStorage.getItem('ff2');
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}
