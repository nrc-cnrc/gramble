import { children } from "../components.js";
import { 
    CursorGrammar, 
    EmbedGrammar, 
    Grammar, 
    GreedyCursorGrammar, 
    PreTapeGrammar, 
    SelectionGrammar 
} from "../grammars.js";
import { getCaseInsensitive } from "../utils/func.js";
import { CounterStack } from "../utils/counter.js";
import { SymbolEnv } from "../passes.js";


export function getVocab(
    g: Grammar,
    tapeName: string,
    stack: CounterStack,
    env: SymbolEnv
): Set<string>|undefined {

    switch (g.tag) {

        case "cursor":
        case "greedyCursor":
            return getVocabCursor(g, tapeName, stack, env);
        case "pretape":
            return getVocabPreTape(g, tapeName, stack, env);
        case "selection":
            return getVocabSelection(g, tapeName, stack, env);
        case "embed":
            return getVocabEmbed(g, tapeName, stack, env);
        default:
            return getVocabDefault(g, tapeName, stack, env);

    }
}

function getVocabDefault(
    g: Grammar,
    tapeName: string,
    stack: CounterStack,
    env: SymbolEnv
): Set<string>|undefined {
    for (const child of children(g)) {
        const result = getVocab(child, tapeName, stack, env);
        if (result === undefined) continue;
        return result;
    }

    return undefined;
}

function getVocabCursor(
    g: CursorGrammar|GreedyCursorGrammar,
    tapeName: string,
    stack: CounterStack,
    env: SymbolEnv
): Set<string>|undefined {
    if (g.tapeName == tapeName) {
        return g.alphabet;
    }
    return getVocab(g.child, tapeName, stack, env);
}

function getVocabPreTape(
    g: PreTapeGrammar,
    tapeName: string,
    stack: CounterStack,
    env: SymbolEnv
): Set<string>|undefined {
    if (g.inputTape == tapeName) {
        return g.alphabet;
    }
    return getVocab(g.child, tapeName, stack, env);
}

function getVocabSelection(
    g: SelectionGrammar,
    tapeName: string,
    stack: CounterStack,
    env: SymbolEnv
): Set<string>|undefined {
    const newEnv = env.update(g);
    const referent = getCaseInsensitive(g.symbols, g.selection);
    if (referent === undefined) { 
        return undefined;
    }
    return getVocab(referent, tapeName, stack, newEnv);
}

function getVocabEmbed(
    g: EmbedGrammar, 
    tapeName: string,
    stack: CounterStack,
    env: SymbolEnv
): Set<string>|undefined {
    if (stack.get(g.symbol) >= 1)
        return;

    const newStack = stack.add(g.symbol);
    const referent = env.symbolNS[g.symbol];
    if (referent === undefined) {
        return undefined;
    }

    return getVocab(referent, tapeName, newStack, env);
}