
export type Gen<T> = Generator<T, void, undefined>;


export type StringDict = {[key: string]: string};

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

    public toString() {
        return `${this.sheet}:${this.row}:${this.col}`;
    }
}

export interface Cell {

    message(msg: any): void;
    readonly id: string;

}

export class DummyCell implements Cell {

    public message(msg: any): void { }
    public get id(): string {
        return "NOWHERE";
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

export const DUMMY_POSITION = new CellPos("?", -1, -1);

function sum(a: number[]): number {
    var s = 0;
    for (var i = 0; i < a.length; i++) s += a[i];
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
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

export function iterTake<T>(gen: Gen<T>, n: number) {
    var i = 1;
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


export function HSVtoRGB(h: number, s: number, v: number): [number, number, number] {
    var r: number, g: number, b: number, i: number, 
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

export function setUnion<T>(s1: Iterable<T>, s2: Iterable<T>): Set<T> {
    return new Set([...s1, ...s2]);
}

export function flatten<T>(ss: Iterable<Iterable<T>>): T[] {
    var results: T[] = [];
    for (const s of ss) {
        results = results.concat(...s);
    }
    return results;
}

export function listUnique<T>(lst: T[]): T[] {
    return [... new Set(lst)];
}

export function setIntersection<T>(s1: Set<T>, s2: Set<T>): Set<T> {
    return new Set([...s1].filter(i => s2.has(i)));
}

export function listIntersection<T>(s1: T[], s2: T[]): T[] {
    const set2 = new Set(s2);
    return s1.filter(i => set2.has(i));
}

export function setDifference<T>(s1: Set<T>, s2: Set<T>): Set<T> {
    return new Set([...s1].filter(x => !s2.has(x)));
}

export function listDifference<T>(l1: T[], l2: T[]): T[] {
    const set2 = new Set(l2);
    return l1.filter(x => !set2.has(x));
}

export function setChain<T>(sets: Iterable<Set<T>>): Set<T> {
    const results: Set<T> = new Set();
    for (const set of sets) {
        for (const item of set) {
            results.add(item);
        }
    }
    return results;
}

class Iter<T> implements Gen<T> {
    
    constructor(
        private gen: Gen<T>
    ) { }

    public next(...args: []): IteratorResult<T> {
        return this.gen.next(...args);
    }

    public return(value: void): IteratorResult<T, void> {
        return this.gen.return(value);
    }

    public throw(e: any): IteratorResult<T, void> {
        return this.throw(e);
    }

    public [Symbol.iterator](): Gen<T> {
        return this.gen[Symbol.iterator]();
    }

    public map<ReturnType>(f: (a: T) => ReturnType): Iter<ReturnType> {
        return iter(iterMap(this.gen, f));
    }

    public map2nd<T1, T2, ReturnType>(f: (a: T2) => ReturnType): Iter<[T1, ReturnType]> {
        const gen = this.gen as unknown as Gen<[T1,T2]>;
        return iter(gen).map(([a,b]) => [a, f(b)]);
    }

    public product<T2>(other: Gen<T2>): Iter<[T,T2]> {
        return iter(iterProduct(this.gen, other));
    }
}

function iter<T>(x: Generator<T, void>): Iter<T> {
    return new Iter(x);
}

function iterChain<T>(iters: Iterable<Iterable<T>>): Iter<T> {
    return iter(function *() {
        for (const iter of iters) {
            yield* iter;
        }
    }());
}

function iterFail<T>(): Iter<T> {
    return iter(function *(){}())
}

function *iterProduct<T1,T2>(i1: Iterable<T1>, i2: Iterable<T2>): Gen<[T1,T2]> {
    for (const item1 of i1) {
        for (const item2 of i2) {
            yield [item1, item2];
        }
    }
}

function *iterMap<T,T2>(i: Iterable<T>, f: (i: T) => T2): Gen<T2> {
    for (const item of i) {
        yield f(item);
    }
}
