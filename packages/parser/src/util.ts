
export type Gen<T> = Generator<T, void, undefined>;


export type StringDict = {[key: string]: string};

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
