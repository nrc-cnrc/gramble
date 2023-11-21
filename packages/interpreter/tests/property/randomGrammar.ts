import { Collection, Embed, Lit, Rename, Seq } from "../../src/grammarConvenience";
import { CollectionGrammar, Grammar } from "../../src/grammars";
import { Dict } from "../../src/utils/func";

export type RandOptions = {
    numSymbols: number,
    numTapes: number,
    seqPoissonMean: number,
    maxDepth: number,
    probs: Dict<number>
}

const DEFAULT_OPTIONS: RandOptions = {
    numSymbols: 10,
    numTapes: 10,
    seqPoissonMean: 3,
    maxDepth: 4,
    probs: {
        lit: 0.3,
        seq: 0.4,
        embed: 0.1,
        rename: 0.1,
    }
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
    return range(opt.numSymbols).map(n => `S${n}`);
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
    return Embed(randomSymbol(opt));
}

export function randomLit(opt: RandOptions): Grammar {
    return Lit(randomTape(opt), "a");
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

export function randomGrammar(opt: RandOptions): Grammar {
    if (opt.maxDepth <= 1) {
        return randomLit(opt);
    } 
    const rand = Math.random();
    let totalP = 0.0;
    for (const [tag, p] of Object.entries(opt.probs)) {
        totalP += p;
        if (rand <= totalP) return randomGrammarFromTag(tag, opt);
    }
    return randomLit(opt);
}

export function randomGrammarFromTag(tag: string, opt: RandOptions): Grammar {
    switch (tag) {
        case "lit": return randomLit(opt);
        case "seq": return randomSeq(opt);
        case "embed": return randomEmbed(opt);
        case "rename": return randomRename(opt);
        default: throw new Error(`Can't make a random ${tag}.`)
    }
}