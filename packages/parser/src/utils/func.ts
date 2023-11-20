
export type Func<T1,T2> = (i: T1) => T2;
export type Gen<T> = Generator<T, void, undefined>;
export type Dict<T> = {[k:string]:T};
export type StringDict = Dict<string>;
export type StringSet = Set<string>;

export function update<T>(orig: T, update: any): T {
    let clone = Object.create(Object.getPrototypeOf(orig));
    Object.assign(clone, orig);
    Object.assign(clone, update);
    clone._tapes = undefined;
    return clone as T;
}

export class ValueSet<T> {

    private keys: Set<string> = new Set();
    private items: Set<T> = new Set();

    constructor(
        items: Iterable<T> = new Set(),
        public hasher: (t: T) => string = t => JSON.stringify(t)
    ) { 
        this.add(...items);
    }

    public add(...items: T[]): void {
        for (const item of items) {
            const key = this.hasher(item);
            if (this.keys.has(key)) {
                continue;
            }
            this.items.add(item);
            this.keys.add(key);
        }
    }

    public has(item: T): boolean {
        const key = this.hasher(item);
        return this.keys.has(key);
    }

    public *[Symbol.iterator]() {
        for(let i of this.items) {
            yield i;
        }
    }

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

export function arrayEquals<T>(a1: T[], a2: T[]): boolean {
    if (a1 === a2) return true;
    if (a1 == null || a2 == null) return false;
    if (a1.length !== a2.length) return false;
    for (var i = 0; i < a1.length; ++i) {
      if (a1[i] !== a2[i]) return false;
    }
    return true;
}

export function listIntersection<T>(s1: T[], s2: T[]): T[] {
    const set2 = new Set(s2);
    return s1.filter(i => set2.has(i));
}

export function union<T>(s1: Iterable<T>, s2: Iterable<T>): Set<T> {
    return new Set([...s1, ...s2]);
}

export function difference<T>(s1: Set<T>, s2: Set<T>): Set<T> {
    return new Set([...s1].filter(x => !s2.has(x)));
}

export function mapSet<T1,T2>(ss: Iterable<T1>, f: Func<T1,T2>): Set<T2> {
    const result: Set<T2> = new Set();
    for (const s of ss) {
        result.add(f(s));
    }
    return result;
}

export function mapValues<T1,T2>(d: Dict<T1>, f: Func<T1,T2>): Dict<T2> {
    const result: Dict<T2> = {};
    for (const [k,v] of Object.entries(d)) {
        result[k] = f(v);
    }
    return result;
}

export function mapDict<T1,T2>(
    d: Dict<T1>, 
    f: (k: string, value: T1) => T2
): Dict<T2> {
    const result: Dict<T2> = {};
    for (const [k,v] of Object.entries(d)) {
        result[k] = f(k,v);
    }
    return result;
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
    f: (t1: T, t2: T) => T,
    start: T,
): T {
    let result = start;
    for (let i = 0; i < arr.length; i++) {
        result = f(result, arr[i]);
    }
    return result;
} 

export function foldRight<T>(
    arr: T[],
    f: (t1: T, t2: T) => T,
    start: T
): T {
    let result = start
    for (let i = arr.length-1; i >= 0; i--) {
        result = f(arr[i], result);
    }
    return result;
}

export function exhaustive(n: never): never {
    return n;
}