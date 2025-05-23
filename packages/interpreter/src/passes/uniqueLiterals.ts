import { flatten } from "../utils/func.js";
import { 
    Grammar, LiteralGrammar, 
    RenameGrammar, SingleTapeGrammar 
} from "../grammars.js";
import { DEFAULT_TAPE } from "../utils/constants.js";

export function uniqueLiterals(
    g: Grammar
): LiteralGrammar[] {

    switch (g.tag) {
        case "epsilon": return [];
        case "lit":     return [g];
        case "seq":     return flatten(g.children.map(c => uniqueLiterals(c)));
        case "rename":  return uniqueLiteralsRename(g);
        case "singletape": return uniqueLiteralsSingleTape(g);
        default: throw new Error(`unhandled grammar in getLiterals: ${g.tag}`);
    }
}

function uniqueLiteralsRename(
    g: RenameGrammar
): LiteralGrammar[] {
    return uniqueLiterals(g.child).map(c => {
        if (c.tapeName != g.fromTape) return c;
        return new LiteralGrammar(g.toTape, c.text);
    });
}

function uniqueLiteralsSingleTape(
    g: SingleTapeGrammar
): LiteralGrammar[] {
    return uniqueLiterals(g.child).map(c => {
        if (c.tapeName != DEFAULT_TAPE) return c;
        return new LiteralGrammar(g.tapeName, c.text);
    });
}
