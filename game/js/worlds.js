export const WORLDS = [
    { name: "Poultry Paradise", sky: ['#87CEEB', '#B0E0FF', '#E8F4FD'], gnd: '#5da832', hill: '#7ec850', accent: '#4CAF50' },
    { name: "Piggy Forest", sky: ['#3a6b28', '#5a9b48', '#8abb78'], gnd: '#3d5b2e', hill: '#4a7838', accent: '#66BB6A' },
    { name: "Sandy Shores", sky: ['#ff9944', '#ffcc88', '#fff4dd'], gnd: '#d4a857', hill: '#c49840', accent: '#FF9800' },
    { name: "Frozen Peaks", sky: ['#88bbdd', '#bbddee', '#eef4f8'], gnd: '#c8d8e8', hill: '#b0c4d8', accent: '#00BCD4' },
    { name: "Jungle Ruins", sky: ['#1a4420', '#2d6b3a', '#5a9b5a'], gnd: '#2a4a1a', hill: '#3a6a2a', accent: '#8BC34A' },
    { name: "Cloud Kingdom", sky: ['#5577bb', '#88aadd', '#ccddf0'], gnd: '#aabbcc', hill: '#8899bb', accent: '#9C27B0' },
    { name: "Magma Mountains", sky: ['#661100', '#993300', '#cc5500'], gnd: '#3a2818', hill: '#5a3828', accent: '#F44336' },
    { name: "Sunken City", sky: ['#002244', '#004466', '#006688'], gnd: '#1a3a5a', hill: '#2a4a6a', accent: '#03A9F4' },
    { name: "Dark Fortress", sky: ['#1a1a2a', '#2a2a3a', '#3a3a4a'], gnd: '#2a2a2a', hill: '#3a3a3a', accent: '#607D8B' },
    { name: "Final Frontier", sky: ['#0a0020', '#1a0040', '#2a1060'], gnd: '#1a0a1a', hill: '#2a1a2a', accent: '#E91E63' }
];

export const WORLD_STARTS = [0, 11, 22, 33, 44, 55, 66, 77, 88, 99, 108];

export function worldOf(id) {
    for (let i = 0; i < 10; i++) {
        if (id < WORLD_STARTS[i + 1]) return i;
    }
    return 9;
}

export const WORLD_MATERIALS = [
    ['wood', 'glass'],
    ['wood', 'wood', 'glass'],
    ['glass', 'glass', 'wood'],
    ['stone', 'stone', 'glass'],
    ['wood', 'glass', 'stone'],
    ['glass', 'wood', 'glass'],
    ['stone', 'stone', 'wood'],
    ['stone', 'glass', 'stone'],
    ['stone', 'stone', 'stone'],
    ['stone', 'wood', 'glass']
];

export const WORLD_BIRDS = [
    ['red', 'blue', 'yellow', 'black'],
    ['red', 'red', 'blue', 'yellow'],
    ['red', 'blue', 'yellow', 'green'],
    ['red', 'yellow', 'black', 'green'],
    ['red', 'blue', 'yellow', 'black', 'green', 'white'],
    ['red', 'blue', 'white', 'green'],
    ['black', 'yellow', 'red', 'white'],
    ['red', 'blue', 'yellow', 'black', 'green', 'white'],
    ['black', 'red', 'yellow', 'white', 'green'],
    ['red', 'blue', 'yellow', 'black', 'green', 'white']
];
