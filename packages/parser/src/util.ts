
export type Gen<T> = Generator<T, void, undefined>;


export type StringDict = {[key: string]: string};

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
