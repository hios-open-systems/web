export interface RandomStringOptions {
    length: number;
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    symbols: boolean;
    excludeAmbiguous: boolean;
}

const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const lower = 'abcdefghijklmnopqrstuvwxyz';
const numbers = '0123456789';
const symbols = '!@#$%^&*()-_=+[]{};:,.?';
const ambiguousPattern = /[0O1Il]/g;

export function getCharset(options: RandomStringOptions) {
    const parts = [
        options.uppercase ? upper : '',
        options.lowercase ? lower : '',
        options.numbers ? numbers : '',
        options.symbols ? symbols : '',
    ];

    const charset = parts.join('');
    return options.excludeAmbiguous ? charset.replace(ambiguousPattern, '') : charset;
}

export function estimateEntropy(options: RandomStringOptions) {
    const charset = getCharset(options);
    if (charset.length === 0) return 0;

    return Math.round(options.length * Math.log2(charset.length) * 10) / 10;
}

export function generateRandomStrings(options: RandomStringOptions, count: number) {
    const charset = getCharset(options);
    if (charset.length === 0) {
        throw new Error('empty-charset');
    }
    if (!globalThis.crypto?.getRandomValues) {
        throw new Error('crypto-unavailable');
    }

    const buffer = new Uint32Array(options.length * count);
    globalThis.crypto.getRandomValues(buffer);

    return Array.from({ length: count }, (_, index) => {
        const slice = buffer.slice(index * options.length, (index + 1) * options.length);
        return Array.from(slice, (value) => charset[value % charset.length]).join('');
    });
}