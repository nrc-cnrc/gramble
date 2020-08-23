
export interface GPos {
        sheet: string,
        row: number,
        col: number
}



export type Gen<T> = Generator<T, void, undefined>;

export const NULL_POS: GPos = { sheet: "", row: -1, col: -1 };

export class RandomPicker<T> implements Iterable<[T, number] | undefined> {

    private sum_of_weights: number = 0;

    public constructor(
        private items: Array<[T, number]>,
    ) {
        this.sum_of_weights = this.items.reduce((total, n) => total + n[1], 0);
    }

    [Symbol.iterator]() {
        return this
    }

    public push(item: T, weight: number): void {
        this.items.push([item, weight]);
        this.sum_of_weights += weight;
    }

    public pop(): [T, number] | undefined {
        if (this.items.length == 0) {
            return undefined;
        }
        if (this.items.length == 1) {
            return this.items.pop();
        }
        var n = Math.random() * this.sum_of_weights;
        for (var i = 0; i < this.items.length; i++) {
            n -= this.items[i][1];
            if (n < 0) {
                this.sum_of_weights -= this.items[i][1];
                const result = this.items[i];
                this.items.splice(i, 1);
                return result;
            }
        }
        throw new Error("Somehow didn't pick an item; something's wrong.")
    }

    public next(): IteratorResult<[T, number] | undefined > {
        if (this.items.length == 0) {
            return { done: true, value: undefined };
        }
        const popped = this.pop();
        if (popped == undefined) {
            throw new Error("Somehow didn't pick an item; something's wrong.")
        }
        return { done: false, value: popped };
    }
}


/*
function shuffle<T>(ar: T[]): T[] {
    ar = [...ar];
    var currentIndex = ar.length;
    var temporaryValue: T;
    var randomIndex: number;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // And swap it with the current element.
      temporaryValue = ar[currentIndex];
      ar[currentIndex] = ar[randomIndex];
      ar[randomIndex] = temporaryValue;
    }
  
    return ar;
}
*/


export function winnow<T>(items: T[], f: (item: T) => boolean): [T[], T[]] {
    const trueResults : T[] = [];
    const falseResults : T[] = [];
    for (const item of items) {
        if (f(item)) {
            trueResults.push(item);
            continue;
        }
        falseResults.push(item);
        continue;
    }
    return [trueResults, falseResults];
}


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

export function setIntersection<T>(s1: Set<T>, s2: Set<T>): Set<T> {
    return new Set([...s1].filter(i => s2.has(i)));
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