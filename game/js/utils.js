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

export function saveProgress(data) {
    try {
        localStorage.setItem('furiousFowl_progress', JSON.stringify(data));
    } catch (e) { /* storage full or blocked */ }
}

export function loadProgress() {
    try {
        const raw = localStorage.getItem('furiousFowl_progress');
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}
