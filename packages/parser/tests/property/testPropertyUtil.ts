import { Collection, Embed, Lit, Rename, Seq } from "../../src/grammarConvenience";
import { Grammar } from "../../src/grammars";

const NUM_SYMBOLS = 10;
const NUM_TAPES = 10;
const SEQ_POISSON_MEAN = 3;

const SYMBOLS = range(NUM_SYMBOLS).map(n => `s${n}`);
function randomSymbol() {
    return random(SYMBOLS);
}

const TAPES = range(NUM_TAPES).map(n => `t${n}`);
function randomTape() {
    return random(TAPES);
}

function random<T>(xs: T[]): T {
    const i = Math.floor(Math.random() * xs.length);
    return xs[i];
}

function range(length: number): number[] {
    return [...Array(length).keys()];
}

function poissonRange(mean: number): number[] {
    return range(poisson(mean));
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

export function randomEmbed(maxDepth: number = 5): Grammar {
    const s = randomSymbol();
    return Embed(s);
}

export function randomLit(maxDepth: number = 5): Grammar {
    const t = randomTape();
    return Lit(t, "a");
}
    
export function randomSeq(maxDepth: number = 5): Grammar {
    const children = poissonRange(SEQ_POISSON_MEAN).map(_ => randomGrammar(maxDepth-1));
    return Seq(...children);
}

export function randomCollection(maxDepth: number = 5): Grammar {
    const result = Collection();
    for (const symbol of SYMBOLS) {
        result.symbols[symbol] = randomGrammar(maxDepth);
    }
    return result;
}

export function randomRename(maxDepth: number = 5): Grammar {
    const child = randomGrammar(maxDepth-1)
    return Rename(child, randomTape(), randomTape());
}


type randomConstr = (depth: number) => Grammar;
const RANDOM_CONSTRUCTORS: [randomConstr, number][] = [
    [ randomLit, 0.2 ],
    [ randomSeq, 0.4 ],
    [ randomEmbed, 0.3],
    [ randomRename, 0.1],
]

export function randomGrammar(maxDepth: number = 5): Grammar {
    if (maxDepth <= 1) {
        return randomLit();
    } 
    const rand = Math.random();
    let totalP = 0.0;
    for (const [constr, p] of RANDOM_CONSTRUCTORS) {
        totalP += p;
        if (rand <= totalP) return constr(maxDepth-1);
    }
    return randomLit();
}