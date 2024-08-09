import { Grammar } from "../grammars";

export function getAllSymbols(
    g: Grammar
): string[] {
    switch (g.tag) {
        case "collection": 
        case "selection":
            return Object.keys(g.symbols);
        default: 
            throw new Error(`Cannot get symbols from a ${g.tag}`);
    }
}