import { Collection, Embed, Lit, Rename, Seq } from "../../src/grammarConvenience";
import { CollectionGrammar, Grammar } from "../../src/grammars";

export type RandOptions = {
    numSymbols: number,
    numTapes: number,
    seqPoissonMean: number,
    maxDepth: number
}

const DEFAULT_OPTIONS: RandOptions = {
    numSymbols: 10,
    numTapes: 10,
    seqPoissonMean: 3,
    maxDepth: 4
}

export function RandOptions(
    opt: Partial<RandOptions> = {}
): RandOptions {
    return { ...DEFAULT_OPTIONS, ...opt };
}

function decr(opt: RandOptions): RandOptions {
    return { ...opt, maxDepth: opt.maxDepth-1 };
}

export function randomChoice<T>(xs: T[]): T {
    const i = Math.floor(Math.random() * xs.length);
    return xs[i];
}

function poisson(mean: number): number {
    const L = Math.exp(-mean);
    let p = 1.0;
    let k = 0;
    
    do {
        k++;
        p *= Math.random();
    } while (p > L);
    
    return k - 1;
}

export function range(length: number): number[] {
    return [...Array(length).keys()];
}

function poissonRange(mean: number): number[] {
    return range(poisson(mean));
}

function allSymbols(opt: RandOptions) {
    return range(opt.numSymbols).map(n => `s${n}`);
}

function randomSymbol(opt: RandOptions) {
    return randomChoice(allSymbols(opt));
}

function allTapes(opt: RandOptions): string[] {
    return range(opt.numTapes).map(n => `t${n}`);
}

function randomTape(opt: RandOptions) {
    return randomChoice(allTapes(opt));
}

export function randomEmbed(opt: RandOptions): Grammar {
    const s = randomSymbol(opt);
    return Embed(s);
}

export function randomLit(opt: RandOptions): Grammar {
    const t = randomTape(opt);
    return Lit(t, "a");
}
    
export function randomSeq(opt: RandOptions): Grammar {
    const children = poissonRange(opt.seqPoissonMean)
                    .map(_ => randomGrammar(decr(opt)));
    return Seq(...children);
}

export function randomCollection(opt: RandOptions): CollectionGrammar {
    const result = Collection();
    for (const symbol of allSymbols(opt)) {
        result.symbols[symbol] = randomGrammar(opt);
    }
    return result;
}

export function randomRename(opt: RandOptions): Grammar {
    const child = randomGrammar(decr(opt));
    return Rename(child, randomTape(opt), randomTape(opt));
}

type randomConstr = (opt: RandOptions) => Grammar;
const RANDOM_CONSTRUCTORS: [randomConstr, number][] = [
    [ randomLit, 0.3 ],
    [ randomSeq, 0.4 ],
    [ randomEmbed, 0.1],
    [ randomRename, 0.1],
]

export function randomGrammar(opt: RandOptions): Grammar {
    if (opt.maxDepth <= 1) {
        return randomLit(opt);
    } 
    const rand = Math.random();
    let totalP = 0.0;
    for (const [constr, p] of RANDOM_CONSTRUCTORS) {
        totalP += p;
        if (rand <= totalP) return constr(opt);
    }
    return randomLit(opt);
}