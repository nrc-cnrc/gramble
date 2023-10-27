import { DotGrammar, Grammar, LiteralGrammar, RepeatGrammar } from "../grammars";
import { Component } from "../components";
import { DUMMY_REGEX_TAPE } from "../util";

export function grammarID(
    x: any,
    brac: boolean = true
): string {
    if (x instanceof Component) return grammarToID(x as Grammar);
    if (Array.isArray(x)) return arrayToID(x, brac);
    if (x instanceof Set) return setToID(x, brac);
    if (x instanceof Object) return objToID(x, brac);
    return `${x}`;
}

function arrayToID(
    xs: any[], 
    brac: boolean = true
): string {
    const results = xs.map(x => grammarID(x));
    return enclose(results, "[", "]", " ", brac);
}

function objToID(
    g: Object,
    brac: boolean = true
): string {
    let elements = [];
    for (const [k, v] of Object.entries(g)) {
        if (!g.hasOwnProperty(k)) continue;
        if (k == "tag") continue;
        if (k.startsWith("_")) continue;
        elements.push(`  ${k}:${grammarID(v)}\n`);
    }
    return enclose(elements, "{\n", "}", "", brac);
}

function setToID<T>(
    g: Set<T>,
    brac: boolean = true
): string {
    let elements: string[] = [];
    for (const x in g) {
        elements.push(grammarID(x));
    }
    return enclose(elements, "{", "}", "", brac);
}

export function litToID(x: LiteralGrammar): string {
    if (x.tapeName == DUMMY_REGEX_TAPE && x.text == "") return "ε"
    if (x.tapeName == DUMMY_REGEX_TAPE) return x.text;
    return `${x.tapeName}:${x.text}`;
}

export function dotToID(x: DotGrammar): string {
    if (x.tapeName == DUMMY_REGEX_TAPE) return ".";
    return `${x.tapeName}:.`;
}

export function repeatToID(g: RepeatGrammar): string {
    let tag = "repeat";
    let elements: any[] = [g.child];

    if (g.minReps == 0 && g.maxReps == 1) tag = "ques";
    else if (g.minReps == 1 && g.maxReps == Infinity) tag = "plus";
    else if (g.minReps == 0 && g.maxReps == Infinity) tag = "star";
    else elements.push(g.minReps, g.maxReps);

    const strs = elements.map(e => grammarID(e));
    return enclose([tag, ...strs]);
}

export function grammarToID(x: Grammar): string {

    // first, common "leaf" nodes get abbreviated forms 
    // for brevity
    switch (x.tag) {
        case "epsilon": return "ε";
        case "null":    return "∅";
        case "lit":     return litToID(x);
        case "dot":     return dotToID(x);
        case "repeat":  return repeatToID(x);
    }

    // otherwise your id is an s-expr created automatically
    // from your tag and children
    const elements = [ x.tag ];

    const kvPairs = Object.entries(x)
                          .filter(([k,v]) =>
                             x.hasOwnProperty(k) &&
                             k != "tag" &&
                             !k.startsWith("_"));
    for (let i = 0; i < kvPairs.length; i++) {
        const [k,v] = kvPairs[i];
        console.log(`child ${k}`);
        const isLast = i == kvPairs.length-1;
        console.log(`child ${k} is last? ${isLast}`);
        const childID = grammarID(v, !isLast);
        elements.push(childID);
    }

    return enclose(elements);
}

function enclose(
    xs: string[],
    openBracket: string = "(",
    closeBracket: string = ")",
    delimiter: string = " ",
    brac: boolean = true
): string {
    const joined = xs.filter(x => x.length > 0).join(delimiter);
    if (!brac) return joined;
    return openBracket + joined + closeBracket;
}