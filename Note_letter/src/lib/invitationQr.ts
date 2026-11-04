/**
 * Small, offline QR encoder for short SendTheLetter invitation URLs.
 * QR Model 2 version 6, correction L: two Reed–Solomon blocks
 * (68 data + 18 error words each). Capacity: 134 UTF-8 bytes.
 * No link, secret, or IP address is sent to an external QR provider.
 */
const VERSION = 6;
const SIDE = VERSION * 4 + 17;
const DATA_BYTES = 136;
const MAX_TEXT_BYTES = 134;

function gfMultiply(a: number, b: number): number {
    let value = 0;
    for (let bit = 7; bit >= 0; bit--) {
        value = (value << 1) ^ ((value & 0x80) !== 0 ? 0x11d : 0);
        if (((b >>> bit) & 1) !== 0) value ^= a;
    }
    return value & 0xff;
}
function errorCorrection(block: number[]): number[] {
    let generator = [1];
    let root = 1;
    for (let i = 0; i < 18; i++) {
        const next = new Array(generator.length + 1).fill(0);
        for (let j = 0; j < generator.length; j++) {
            next[j] ^= generator[j];
            next[j + 1] ^= gfMultiply(generator[j], root);
        }
        generator = next;
        root = gfMultiply(root, 2);
    }
    const remainder = new Array(18).fill(0);
    for (const byte of block) {
        const factor = byte ^ remainder.shift()!;
        remainder.push(0);
        for (let j = 0; j < remainder.length; j++) {
            remainder[j] ^= gfMultiply(generator[j + 1], factor);
        }
    }
    return remainder;
}

export function qrForInvitation(url: string): boolean[][] {
    const bytes = Array.from(new TextEncoder().encode(url));
    if (bytes.length > MAX_TEXT_BYTES || bytes.length === 0) throw new Error('The invitation URL is too long for this offline QR code.');
    const bits: number[] = [];
    const append = (value: number, length: number) => {
        for (let bit = length - 1; bit >= 0; bit--) bits.push((value >>> bit) & 1);
    };
    append(4, 4); // UTF-8 byte mode
    append(bytes.length, 8);
    for (const byte of bytes) append(byte, 8);
    for (let i = 0; i < Math.min(4, DATA_BYTES * 8 - bits.length); i++) bits.push(0);
    while (bits.length % 8 !== 0) bits.push(0);
    const data: number[] = [];
    for (let i = 0; i < bits.length; i += 8) {
        data.push(parseInt(bits.slice(i, i + 8).join(''), 2));
    }
    while (data.length < DATA_BYTES) data.push(data.length % 2 === 0 ? 0xec : 0x11);
    const blocks = [data.slice(0, 68), data.slice(68, 136)];
    const parity = blocks.map(errorCorrection);
    const words: number[] = [];
    for (let i = 0; i < 68; i++) words.push(blocks[0][i], blocks[1][i]);
    for (let i = 0; i < 18; i++) words.push(parity[0][i], parity[1][i]);

    const matrix: (boolean | null)[][] = Array.from({ length: SIDE }, () => Array(SIDE).fill(null));
    const mark = (x: number, y: number, dark: boolean) => {
        if (x >= 0 && x < SIDE && y >= 0 && y < SIDE) matrix[y][x] = dark;
    };
    const finder = (cx: number, cy: number) => {
        for (let y = -4; y <= 4; y++)
            for (let x = -4; x <= 4; x++) {
                const d = Math.max(Math.abs(x), Math.abs(y));
                mark(cx + x, cy + y, d === 3 || d <= 1);
            }
    };
    finder(3, 3);
    finder(SIDE - 4, 3);
    finder(3, SIDE - 4);
    // v6 alignment centers 6 and 34; only the bottom-right is uncovered.
    for (let y = -2; y <= 2; y++)
        for (let x = -2; x <= 2; x++)
            mark(34 + x, 34 + y, Math.max(Math.abs(x), Math.abs(y)) !== 1);
    for (let i = 8; i < SIDE - 8; i++) {
        mark(6, i, i % 2 === 0);
        mark(i, 6, i % 2 === 0);
    }
    for (let i = 0; i <= 8; i++) {
        if (i !== 6) { mark(8, i, false); mark(i, 8, false); }
    }
    for (let i = 0; i < 8; i++) {
        mark(SIDE - 1 - i, 8, false);
        mark(8, SIDE - 1 - i, false);
    }
    mark(8, SIDE - 8, true);
    let bit = 0;
    let upward = true;
    for (let right = SIDE - 1; right >= 1; right -= 2) {
        if (right === 6) right = 5;
        for (let row = 0; row < SIDE; row++) {
            const y = upward ? SIDE - 1 - row : row;
            for (let dx = 0; dx < 2; dx++) {
                const x = right - dx;
                if (matrix[y][x] !== null) continue;
                const value = bit < words.length * 8 ? (words[bit >> 3] >>> (7 - (bit & 7))) & 1 : 0;
                bit++;
                matrix[y][x] = Boolean(value) !== ((x + y) % 2 === 0); // mask 0
            }
        }
        upward = !upward;
    }
    // 15 BCH-protected format bits, level L and mask 0, XOR 0x5412.
    const dataBits = 1 << 3;
    let rem = dataBits << 10;
    for (let i = 14; i >= 10; i--) if (((rem >>> i) & 1) !== 0) rem ^= 0x537 << (i - 10);
    const format = ((dataBits << 10) | rem) ^ 0x5412;
    const bitAt = (i: number) => ((format >>> i) & 1) !== 0;
    for (let i = 0; i <= 5; i++) mark(8, i, bitAt(i));
    mark(8, 7, bitAt(6));
    mark(8, 8, bitAt(7));
    mark(7, 8, bitAt(8));
    for (let i = 9; i < 15; i++) mark(14 - i, 8, bitAt(i));
    for (let i = 0; i < 8; i++) mark(SIDE - 1 - i, 8, bitAt(i));
    for (let i = 8; i < 15; i++) mark(8, SIDE - 15 + i, bitAt(i));
    mark(8, SIDE - 8, true);
    return matrix.map(row => row.map(cell => cell === true));
}
export function invitationQrSvg(url: string): string {
    const matrix = qrForInvitation(url);
    const path: string[] = [];
    matrix.forEach((row, y) => row.forEach((dark, x) => {
        if (dark) path.push(`M${x + 4} ${y + 4}h1v1h-1z`);
    }));
    const size = matrix.length + 8;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="392" height="392" shape-rendering="crispEdges" role="img" aria-label="QR code for a letter invitation"><rect width="${size}" height="${size}" fill="#fff"/><path fill="#243c30" d="${path.join(' ')}"/></svg>`;
}
