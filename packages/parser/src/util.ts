//import BitSet from 'bitset';
import { getCategory } from 'unicode-properties';
//import { Token } from './tapes';


// CONSTANTS

export const HIDDEN_PREFIX = ".";
export const INTERNAL_PREFIX = "$";
export const REPLACE_INPUT_TAPE = INTERNAL_PREFIX + "i";
export const REPLACE_OUTPUT_TAPE = INTERNAL_PREFIX + "o";
export const DUMMY_REGEX_TAPE = INTERNAL_PREFIX + "T";
export const DUMMY_TAPE = HIDDEN_PREFIX + "END";

export const OPEN_TAPE = INTERNAL_PREFIX + "OPEN";

//export const ANY_CHAR_STR = "__ANY_CHAR__";
//export const NO_CHAR_STR = "__NO_CHAR__";

export const PLAIN_PARAM: string = INTERNAL_PREFIX + "plain";

export const DEFAULT_PROJECT_NAME = "";
export const DEFAULT_SYMBOL_NAME = "Default";
export const ALL_SYMBOL_NAME = "All"
export const AUTO_SYMBOL_NAME = INTERNAL_PREFIX + "Auto"

export const DEFAULT_MAX_CHARS = 100;

export const DIRECTION_LTR: boolean = true; // whether we parse/generate from the beginning or end of words

export const SILENT = 0;
export const VERBOSE_TIME = 1;
export const VERBOSE_DEBUG = 1 << 1;
export const VERBOSE_STATES = 1 << 2;
export const VERBOSE_GRAMMAR = 1 << 3;

export function logDebug(verbose: number, ...msgs: string[]): void {
    if ((verbose & VERBOSE_DEBUG) == VERBOSE_DEBUG) {
        for (const msg of msgs) {
            console.log(msg);
        }
    }
}

export function logTime(verbose: number, msg: string): void {
    if ((verbose & VERBOSE_TIME) == VERBOSE_TIME) {
        console.log(msg);
    }
}

export function logStates(verbose: number, msg: string): void {
    if ((verbose & VERBOSE_STATES) == VERBOSE_STATES) {
        console.log(msg);
    }
}

export function logGrammar(verbose: number, msg: string): void {
    if ((verbose & VERBOSE_GRAMMAR) == VERBOSE_GRAMMAR) {
        console.log(msg);
    }
}


export class GenOptions {
    public random: boolean = false;
    public maxRecursion: number = 2; 
    public maxChars: number = 100;
    public verbose: number = SILENT
}

export type Gen<T> = Generator<T, void, undefined>;

export type Dict<T> = {[k:string]:T};
export type StringDict = Dict<string>;

export class ValueSet<T> {

    private keys: Set<string> = new Set();
    private items: Set<T> = new Set();

    constructor(
        items: Set<T> = new Set()
    ) { 
        this.add(...items);
    }

    public add(...items: T[]): void {
        for (const item of items) {
            const key = JSON.stringify(item);
            if (this.keys.has(key)) {
                return;
            }
            this.items.add(item);
            this.keys.add(key);
        }
    }

    public has(item: T): boolean {
        const key = JSON.stringify(item);
        return this.keys.has(key);
    }

    public *[Symbol.iterator]() {
        for(let i of this.items) {
            yield i;
        }
    }

}

export type StringSet = Set<string>;


/**
 * Namespace<T> is a convenience wrapper around Map<string, T> that
 * allows us to rename a given item statelessly.  This is used for Tapes
 * in particular.
 */
 export class Namespace<T> {

    constructor(
        public entries: Dict<T> = {},
        public prev: Namespace<T> | undefined = undefined
    ) { }

    public get(key: string): T {
        const result = this.attemptGet(key);
        if (result != undefined) {
            return result;
        }
        throw new Error(`Cannot find ${key} in namespace, candidates: ${Object.keys(this.entries)}`);
    }

    public attemptGet(key: string): T | undefined {
        const result = this.entries[key];
        if (result == undefined && this.prev != undefined) {
            return this.prev.attemptGet(key);
        }
        return result;
    }

    public set(key: string, value: T): void {
        this.entries[key] = value;
    }

    public push(d: Dict<T>): Namespace<T> {
        return new Namespace<T>(d, this);
    }

    public rename(fromKey: string, toKey: string): Namespace<T> {
        if (fromKey == toKey) {
            return this;
        }
        const referent = this.attemptGet(fromKey);
        if (referent == undefined) {
            return this;
        }
        return this.push({[toKey]: referent});
    }

}

/**
 * A convenience class encapsulating information about where a cell
 * is.  Every component of the abstract syntax tree has one of these;
 * if it's a cell, that's just its position on a spreadsheet; if it's a
 * complex component, it's the position of its first cell.
 *
 * By convention we treat the spreadsheet itself as a component with 
 * its first cell at -1, -1.
 */
export class CellPos {

    constructor(
        public readonly sheet: string = "?",
        public readonly row: number = -1,
        public readonly col: number = -1
    ) { }

    public toString(): string {
        return `${this.sheet}:${this.row}:${this.col}`;
    }
}

export class Cell {

    constructor(
        public text: string,
        public pos: CellPos
    ) { }

    public get id(): string { 
        return this.pos.toString();
    }

}

/**
 * DevEnvironment
 * 
 * To make an editor (e.g. Google Sheets) "smart" about Gramble, you implement this interface.  Most
 * of the public-facing methods of the Project edifice take an DevEnvironment instance as an argument.
 * When parsing a spreadsheet, executing a unit test, etc., the Parser will notify the DevEnvironment instance
 * that particular cells are errors, comments, column headers, etc.
 */
export interface DevEnvironment {
    getErrorMessages(): [string, number, number, string, "error"|"warning"|"info"][];
    numErrors(level: "error" | "warning"|"any"): number;
    logErrors(): void;
    getErrors(sheet: string, row: number, col: number): string[];

    hasSource(sheet: string): boolean;
    loadSource(sheet: string): string[][];

    addSourceAsText(sheetName: string, text: string): void;
    addSourceAsCells(sheetName: string, cells: string[][]): void;
    
    message(msg: any): void;
    
    highlight(): void;
    alert(msg: string): void;
}

const MARK_CATEGORIES = [ 'Lm', 'Sk', 'Mc', 'Me', 'Mn' ];
function isDiacritic(c: string) {
    const codePoint = c.charCodeAt(0);
    const category = getCategory(codePoint);
    return MARK_CATEGORIES.indexOf(category) != -1;
}

export function tokenizeUnicode(str: string): string[] {

    const results: string[] = [];
    let anticipate = false;
    let buffer: string[] = [];
    for (const c of str) {

        // there are three cases where we push to the buffer
        // but don't join/emit it yet: tie characters, diacritical
        // marks, and when we've previously seen a tie character and
        // haven't consumed the character it ties
        if (c == '\u0361' || c == '\u035C') {
            buffer.push(c);
            anticipate = true;
            continue;
        }

        if (isDiacritic(c)) {
            buffer.push(c);
            continue;
        }

        if (anticipate) {
            buffer.push(c);
            anticipate = false;
            continue;
        }

        // it's not special, it starts a new token
        if (buffer.length > 0) {
            results.push(buffer.join(""));
            buffer = [];
        }
        buffer.push(c);

    }

    if (buffer.length > 0) {
        results.push(buffer.join(""));
    }

    return results;
}

export function timeIt<T>(
    func: () => T, 
    verbose: boolean = true,
    message: string = "",
    startMessage: string = "",
): T {
    if (verbose && startMessage.length > 0) {
        console.log(startMessage);
    }
    const startTime = Date.now();
    const results = func();
    if (verbose) {
        const elapsedTime = msToTime(Date.now() - startTime);
        console.log(`${message}: ${elapsedTime}`);
    }
    return results;
}

export function msToTime(s: number): string {
    const ms = s % 1000;
    s = (s - ms) / 1000;
    const secs = s % 60;
    s = (s - secs) / 60;
    const mins = s % 60;
    const hrs = (s - mins) / 60;
    return `${hrs}h ${mins}m ${secs}.${ms.toString().padStart(3,"0")}s`;
}


export function parseCSV(str: string): string[][] {
    let arr: string[][] = [];
    let quote = false;  // 'true' means we're inside a quoted field
    let row = 0;
    let col = 0;

    // Iterate over each character, keep track of current row and column (of the returned array)
    for (let c = 0; c < str.length; c++) {
        let cc = str[c];                       // Current character
        let nc = str[c+1];                     // Next character
        arr[row] = arr[row] || [];             // Create a new row if necessary
        arr[row][col] = arr[row][col] || '';   // Create a new column (start with empty string) if necessary

        // If the current character is a quotation mark, and we're inside a
        // quoted field, and the next character is also a quotation mark,
        // add a quotation mark to the current column and skip the next character
        if (cc == '"' && quote && nc == '"') { 
            arr[row][col] += cc; 
            ++c; 
            continue; 
        }

        // If it's just one quotation mark, begin/end quoted field
        if (cc == '"') {
            quote = !quote; 
            continue; 
        }

        // If it's a comma and we're not in a quoted field, move on to the next column
        if (cc == ',' && !quote) { 
            ++col; 
            continue; 
        }

        // If it's a newline (CRLF) and we're not in a quoted field, skip the next character
        // and move on to the next row and move to column 0 of that new row
        if (cc == '\r' && nc == '\n' && !quote) { 
            ++row; 
            col = 0; 
            ++c; 
            continue; 
        }

        // If it's a newline (LF or CR) and we're not in a quoted field,
        // move on to the next row and move to column 0 of that new row
        if (cc == '\n' && !quote) { 
            ++row; 
            col = 0; 
            continue; 
        }

        if (cc == '\r' && !quote) { 
            ++row; 
            col = 0; 
            continue; 
        }

        // Otherwise, append the current character to the current column
        arr[row][col] += cc;
    }

    return arr;
}

export function sum(a: number[]): number {
    let s = 0;
    for (let i = 0; i < a.length; i++) s += a[i];
    return s;
} 
 
function degToRad(a: number): number {
    return Math.PI / 180 * a;
}

export function meanAngleDeg(a: number[]): number {
    return 180 / Math.PI * Math.atan2(
        sum(a.map(degToRad).map(Math.sin)) / a.length,
        sum(a.map(degToRad).map(Math.cos)) / a.length
    );
}

/* Randomize array in-place using Durstenfeld shuffle algorithm */
export function shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

export function iterTake<T>(gen: Gen<T>, n: number) {
    let i = 1;
    const results = [];

    if (n <= 0) {
        throw new Error("Invalid index");
    }

    for (const value of gen) {
        results.push(value);
        if (i++ == n) {
            break;
        }
    }

    return results;
}

export function* stripHiddenTapes(gen: Gen<StringDict>): Gen<StringDict> {
    for (const sd of gen) {
        const result: StringDict = {};
        for (const tapeName in sd) {
            if (tapeName.startsWith(HIDDEN_PREFIX)) {
                continue;
            }
            result[tapeName] = sd[tapeName];
        }
        yield result;
    }
}

export function HSVtoRGB(h: number, s: number, v: number): [number, number, number] {
    let r: number, g: number, b: number, i: number, 
        f: number, p: number, q: number, t: number;
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    r = 0;
    g = 0;
    b = 0;
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    r = Math.round(r * 255)
    g = Math.round(g * 255)
    b = Math.round(b * 255)
    return [r, g, b];
}

export function RGBtoString(r: number, g: number, b: number): string {
    return "#" + r.toString(16) + g.toString(16) + b.toString(16);
}

export function flatten<T>(ss: Iterable<Iterable<T>>): T[] {
    let results: T[] = [];
    for (const s of ss) {
        results = results.concat(...s);
    }
    return results;
}

export function listUnique<T>(lst: T[]): T[] {
    return [... new Set(lst)];
}

export function listIntersection<T>(s1: T[], s2: T[]): T[] {
    const set2 = new Set(s2);
    return s1.filter(i => set2.has(i));
}

export function setUnion<T>(s1: Set<T>, s2: Set<T>): Set<T> {
    return new Set([...s1, ...s2]);
}

export function setDifference<T>(s1: Set<T>, s2: Set<T>): Set<T> {
    return new Set([...s1].filter(x => !s2.has(x)));
}

export function isSubset<T>(s1: Set<T>, s2: Set<T>): boolean {
    return [...s1].every(item => s2.has(item));
}

export function listDifference<T>(l1: T[], l2: T[]): T[] {
    const set2 = new Set(l2);
    return l1.filter(x => !set2.has(x));
}

export function concatStringDict(d1: StringDict, d2: StringDict): StringDict {
    const result: StringDict = {};
    Object.assign(result, d1);
    for (const [key, value] of Object.entries(d2)) {
        const oldStr = key in result ? result[key] : "";
        result[key] = oldStr + value;
    }
    return result;
}

export function foldLeft<T>(
    arr: T[], 
    f: (t1: T, t2: T) => T
): T {
    if (arr.length == 0) {
        throw new Error(`foldLeft must have >0 arguments`);
    }
    let result = arr[0];
    for (let i = 1; i < arr.length; i++) {
        result = f(result, arr[i]);
    }
    return result;
} 

export function foldRight<T>(
    arr: T[],
    f: (t1: T, t2: T) => T
): T {
    if (arr.length == 0) {
        throw new Error(`foldRight must have >0 arguments`);
    }
    let result = arr[arr.length-1];
    for (let i = arr.length-2; i >= 0; i--) {
        result = f(arr[i], result);
    }
    return result;
}
