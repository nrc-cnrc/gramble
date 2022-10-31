import { Epsilon, Grammar, Join, JoinReplace, Lit, Priority, Replace, ReplaceGrammar, Uni } from "./grammars";
import { Interpreter } from "./interpreter";
import { shuffleArray, StringDict, VERBOSE_STATES, VERBOSE_TIME } from "./util";

export const t1 = (s: string) => Lit("t1", s);
export const t2 = (s: string) => Lit("t2", s);
export const t3 = (s: string) => Lit("t3", s);
export const t4 = (s: string) => Lit("t4", s);
export const t5 = (s: string) => Lit("t5", s);
export const t6 = (s: string) => Lit("t6", s);

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
    console.log(inputs.name);
    let interpreter = Interpreter.fromGrammar(inputs.g, VERBOSE_STATES);
    let results = interpreter.generate();
    //console.log(results);
}

function randomGrammar(): Grammar {

    const literals: Grammar[] = [];
    for (let i = 0; i < 10; i++) {
        let s = "";
        for (let i = 0; i < 10; i++) {
            s += "abcdefghij"[Math.floor(Math.random()*10)];
        }
        const grammar = t1(s);
        literals.push(grammar);
    }
    return Uni(...literals);
}

const g = randomGrammar();
const r1 = ReplaceBypass(t1("a"), t2("A"));
const r2 = ReplaceBypass(t2("b"), t3("B"));
const r3 = ReplaceBypass(t3("c"), t4("C"));
const r4 = ReplaceBypass(t4("d"), t5("D"));
const r5 = ReplaceBypass(t5("e"), t6("E"));

const items: [string, Grammar][] = [
    ["G", g],
    ["R1", r1],
    ["R2", r2],
    ["R3", r3],
    ["R4", r4],
    ["R5", r5]
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
for (let i = 0; i < 1; i++) {
    const [name, g] = randomTree(items);

    console.log(`natural priority: ${[...g.getAllTapes().getKeys()]}`)
    generateAndLog({name:name, g:g});

    console.log();
    const numericalPriority = Priority(["t1","t2","t3","t4","t5","t6"], g);
    console.log(`numerical priority: t1,t2,t3,t4,t5,t6`)
    generateAndLog({name:name, g:numericalPriority});

    console.log();
    const reversePriority = Priority(["t6","t5","t4","t3","t2","t1"], g);
    console.log(`reverse priority: t6,t5,t4,t3,t2,t1`)
    generateAndLog({name:name, g:reversePriority});

    let tapes = [...g.getAllTapes().getKeys()];
    shuffleArray(tapes);
    console.log();
    console.log(`random priority: ${tapes}`);
    const randomPriority = Priority(tapes, g);
    generateAndLog({name:name, g:randomPriority});
}   */


console.log();
let t: Grammar = Join(Join(Join(Join(r4,r3),r2),r1),g);
generateAndLog({
    name:`((((R4,R3),R2),R1),G), default priority}`, 
    g:t
});

console.log();
t = Join(Join(Join(Join(r4,r3),r2),r1),g);
t = Priority(["t1","t2","t3","t4","t5"], t);
generateAndLog({name:"((((R4,R3),R2),R1),G), numerical priority", g:t});

console.log();
t = Join(Join(Join(Join(r4,r3),r2),r1),g);
t = Priority(["t5","t4","t3","t2","t1"], t)
generateAndLog({name:"((((R4,R3),R2),R1),G), opposite priority", g:t});

console.log();
t = Join(Join(Join(Join(g,r1),r2),r3),r4);
generateAndLog({
    name:`((((G,R1),R2),R3),R4), default priority}`, 
    g:t
});

console.log();
t = Join(Join(Join(Join(g,r1),r2),r3),r4);
t = Priority(["t1","t2","t3","t4","t5"], t)
generateAndLog({name:"((((G,R1),R2),R3),R4), numerical priority", g:t});

console.log();
t = Join(Join(Join(Join(g,r1),r2),r3),r4);
t = Priority(["t5","t4","t3","t2","t1"], t)
generateAndLog({name:"((((G,R1),R2),R3),R4), opposite priority", g:t});


console.log();
t = Join(g, Join(r1, Join(r2, Join(r3, r4))));
generateAndLog({
    name:`(G,(R1,(R2,(R3,R4)))), default priority}`, 
    g:t
});

console.log();
t = Join(g, Join(r1, Join(r2, Join(r3, r4))));
t = Priority(["t1","t2","t3","t4","t5"], t)
generateAndLog({name:"(G,(R1,(R2,(R3,R4)))), numerical priority", g:t});

console.log();
t = Join(g, Join(r1, Join(r2, Join(r3, r4))));
t = Priority(["t5","t4","t3","t2","t1"], t)
generateAndLog({name:"(G,(R1,(R2,(R3,R4)))), opposite priority", g:t});
