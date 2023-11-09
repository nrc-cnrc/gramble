import { DEFAULT_MAX_CHARS, DEFAULT_MAX_RECURSION, HIDDEN_PREFIX } from './utils/constants';
import { SILENT } from './utils/logging';

export interface Options {
    maxRecursion: number,
    maxChars: number,
    verbose: number,
    optimizeAtomicity: boolean,
    directionLTR: boolean
}

export const DEFAULT_OPTIONS: Options = {
    maxRecursion: DEFAULT_MAX_RECURSION, 
    maxChars: DEFAULT_MAX_CHARS,
    verbose: SILENT,
    optimizeAtomicity: true,
    directionLTR: true
}

export function Options(opt: Partial<Options> = {}): Options {
    return {...DEFAULT_OPTIONS, ...opt};
}

export class Env {

    public opt: Options;

    constructor(
        opt: Partial<Options> = {}
    ) { 
        this.opt = Options(opt);
    }

}

export function update<T>(orig: T, update: any): T {
    let clone = Object.create(Object.getPrototypeOf(orig));
    Object.assign(clone, orig);
    Object.assign(clone, update);
    clone._tapes = undefined;
    return clone as T;
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

export function *iterUnit<T>(item: T): Gen<T> {
    yield item;
}

export function *iterConcat<T>(gs: Gen<T>[]): Gen<T> {
    for (const g of gs) {
        yield *g;
    }
}

export function iterTake<T>(gen: Gen<T>, n: number): [T[], Gen<T>] {
    const results = [];

    if (n === 0) return [[], gen];

    let curr = gen.next();
    for (let i = 0; i < n - 1 && !curr.done; i++) {
        results.push(curr.value);
        curr = gen.next();
    }

    // don't forget that last curr
    if (!curr.done) results.push(curr.value);

    return [results, gen];
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

export function outputProduct(ds1: StringDict[], ds2: StringDict[]): StringDict[] {
    const results: StringDict[] = [];
    for (const d1 of ds1) {
        for (const d2 of ds2) {
            results.push(concatStringDict(d1, d2));
        }
    }
    return results;
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
