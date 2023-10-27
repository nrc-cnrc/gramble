import { Grammar } from "../grammars";
import { Component } from "../components";

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

export function grammarToID(x: Grammar): string {

    // first, common "leaf" nodes get abbreviated forms 
    // for brevity
    switch (x.tag) {
        case "epsilon": return "ε";
        case "null":    return "∅";
        case "lit":     return `${x.tapeName}:${x.text}`;
        case "dot":     return `${x.tapeName}:.`;
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