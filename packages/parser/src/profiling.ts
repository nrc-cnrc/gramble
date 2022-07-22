import { Epsilon, Grammar, Join, JoinReplace, Lit, Replace, ReplaceGrammar } from "./grammars";
import { Interpreter } from "./interpreter";
import { StringDict, VERBOSE_STATES, VERBOSE_TIME } from "./util";

export const t1 = (s: string) => Lit("t1", s);
export const t2 = (s: string) => Lit("t2", s);
export const t3 = (s: string) => Lit("t3", s);
export const t4 = (s: string) => Lit("t4", s);
export const t5 = (s: string) => Lit("t5", s);

function ReplaceBypass(
    fromGrammar: Grammar, toGrammar: Grammar,
    preContext: Grammar = Epsilon(), postContext: Grammar = Epsilon(),
    otherContext: Grammar = Epsilon(),
    beginsWith: boolean = false, endsWith: boolean = false,
    minReps: number = 0, maxReps: number = Infinity,
    maxExtraChars: number = 100,
    maxCopyChars: number = Infinity,
    vocabBypass: boolean = true
): ReplaceGrammar {
    return Replace(fromGrammar, toGrammar, 
        preContext, postContext, otherContext, beginsWith, endsWith, 
        minReps, maxReps, maxExtraChars, maxCopyChars, vocabBypass);
}

function generateAndLog(inputs: {name: string, g: Grammar}): void {
    console.log()
    console.log(inputs.name);
    let interpreter = Interpreter.fromGrammar(inputs.g, VERBOSE_TIME|VERBOSE_STATES);
    let results = interpreter.generate();
    console.log(results);
}
const g = t1("abcdef");
const r1 = ReplaceBypass(t1("a"), t2("A"));
const r2 = ReplaceBypass(t2("b"), t3("B"));
const r3 = ReplaceBypass(t3("c"), t4("C"));
const r4 = ReplaceBypass(t3("d"), t4("D"));


const items: [string, Grammar][] = [
    ["G", g],
    ["R1", r1],
    ["R2", r2],
    ["R3", r3],
//    ["R4", r4]
]

function randomTree(items: [string, Grammar][]) {

    if (items.length == 0) {
        throw new Error("Cannot make a tree of zero items");
    }

    let results = [...items];
    while (results.length > 1) {
        const index1 = Math.floor(Math.random() * results.length);
        const [name1, item1] = results.splice(index1, 1)[0];
        const index2 = Math.floor(Math.random() * results.length);
        const [name2, item2] = results.splice(index2, 1)[0];
        const newName = `(${name1},${name2})`
        const newItem = Join(item1, item2);
        results.push([newName, newItem]);
    }

    return results[0]
}

/*
for (let i = 0; i < 10; i++) {
    const [name, g] = randomTree(items);
    generateAndLog({name:name, g:g});
} */

generateAndLog({
    name: '(((g,R1),R2), R3)',
    g: Join(Join(Join(Join(g, r1), r2), r3), t4("ABCdef"))
})

generateAndLog({
    name: '(((R3, R2),R1),g)',
    g: Join(Join(Join(Join(r3, r2),r1), g), t4("ABCdef"))
})

generateAndLog({
    name: '(((R3, R2),R1),g)',
    g: Join(t4("ABCdef"), Join(Join(Join(r3, r2),r1), g))
})

generateAndLog({
    name: '(((R3, R2),R1),g)',
    g: Join(t2("Abcdef"), Join(Join(Join(r3, r2),r1), g))
})