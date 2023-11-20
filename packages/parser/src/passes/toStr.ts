import { 
    AbstractGrammar,
    DotGrammar, Grammar, 
    LiteralGrammar, RepeatGrammar 
} from "../grammars";
import { Component } from "../components";
import { DEFAULT_TAPE } from "../utils/constants";

export function toStr(
    x: any,
    brac: boolean = true
): string {
    if (x instanceof AbstractGrammar) return grammarToStr(x as Grammar);
    if (x instanceof Component) return componentToStr(x as Grammar);
    if (Array.isArray(x)) return arrayToStr(x, brac);
    if (x instanceof Set) return setToStr(x, brac);
    if (x instanceof Object) return objToStr(x, brac);
    return `${x}`;
}

function arrayToStr(
    xs: any[], 
    brac: boolean = true
): string {
    const results = xs.map(x => toStr(x));
    return enclose(results, "[", "]", " ", brac);
}

function objToStr(
    g: Object,
    brac: boolean = true
): string {
    let elements = [];
    for (const [k, v] of Object.entries(g)) {
        if (!g.hasOwnProperty(k)) continue;
        if (k == "tag") continue;
        if (k.startsWith("_")) continue;
        elements.push(`  ${k}:${toStr(v)}\n`);
    }
    return enclose(elements, "{\n", "}", "", brac);
}

function setToStr<T>(
    g: Set<T>,
    brac: boolean = true
): string {
    let elements: string[] = [];
    for (const x in g) {
        elements.push(toStr(x));
    }
    return enclose(elements, "{", "}", "", brac);
}

export function litToStr(x: LiteralGrammar): string {
    if (x.tapeName == DEFAULT_TAPE && x.text == "") return "ε"
    if (x.tapeName == DEFAULT_TAPE) return x.text;
    return `${x.tapeName}:${x.text}`;
}

export function dotToStr(x: DotGrammar): string {
    if (x.tapeName == DEFAULT_TAPE) return ".";
    return `${x.tapeName}:.`;
}

export function repeatToStr(g: RepeatGrammar): string {
    let tag = "repeat";
    let elements: any[] = [g.child];

    if (g.minReps == 0 && g.maxReps == 1) tag = "ques";
    else if (g.minReps == 1 && g.maxReps == Infinity) tag = "plus";
    else if (g.minReps == 0 && g.maxReps == Infinity) tag = "star";
    else elements.push(g.minReps, g.maxReps);

    const strs = elements.map(e => toStr(e));
    return enclose([tag, ...strs]);
}

const EXCLUDED_FROM_STR = new Set([
    "tag",
    "tapeSet",
    "qualifier",
    "pos"
]);

export function componentToStr(c: Component): string {
    // by default, components' string representation is an
    // s-expr on the model of (tag toStr(child) toStr(child).
    const elements = [ c.tag ];

    const kvPairs = Object.entries(c)
                          .filter(([k,_]) =>
                             c.hasOwnProperty(k) &&
                             !EXCLUDED_FROM_STR.has(k) &&
                             !k.startsWith("_"));
    for (let i = 0; i < kvPairs.length; i++) {
        const [_,v] = kvPairs[i];
        const isLast = i == kvPairs.length-1;
        const childID = toStr(v, !isLast);
        elements.push(childID);
    }

    return enclose(elements);
}

export function grammarToStr(g: Grammar): string {

    // first, common "leaf" nodes get abbreviated forms 
    // for brevity
    switch (g.tag) {
        case "epsilon": return "ε";
        case "null":    return "∅";
        case "lit":     return litToStr(g);
        case "dot":     return dotToStr(g);
        case "repeat":  return repeatToStr(g);
    }

    return componentToStr(g);
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