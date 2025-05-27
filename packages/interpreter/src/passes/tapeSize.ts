import { exhaustive, getCaseInsensitive } from "../utils/func.js";
import { AlternationGrammar, CountGrammar, EmbedGrammar, Grammar, HideGrammar, JoinGrammar, MatchGrammar, NegationGrammar, RenameGrammar, RepeatGrammar, SelectionGrammar, SequenceGrammar, TapeSize } from "../grammars.js";
import { QualifiedGrammar } from "../grammars.js";
import { SymbolEnv } from "../passes.js";
import { CounterStack } from "../utils/counter.js";
import { renameTape } from "../tapes.js";


const TAPE_SIZE_EPSILON: TapeSize = { cardinality: 1, minLength: 0, maxLength: 0 };

/**
 * This method is used to detect grammars that might be infinite --
 * not *certain* to be infinite, but potentially so, that that we
 * add a CountGrammar to the root just in case.  
 * 
 * I don't think it's possible to be certain that an arbitrary grammar
 * is infinite; for example, we might join two grammars, both of which
 * are infinite, but they actually only have a single entry that both 
 * share.  We wouldn't know that, however, until generation; out of safety
 * we have to treat the joins of two infinite grammars as themselves 
 * infinite.  
 * 
 * It costs us little if we're wrong here; CountExprs have 
 * negligible runtime cost.  We still want to try to get this correct, 
 * though, because it truncates the outputs of the grammar-as-written,
 * we want the addition of CountGrammar to be a last resort.
 */
export function getTapeSize(
    g: Grammar,
    tapeName: string, 
    stack: CounterStack, 
    env: SymbolEnv
): TapeSize {

    switch (g.tag) {

        // ones with a specific length
        case "epsilon": return TAPE_SIZE_EPSILON;
        case "null": 
            return { cardinality: 0, minLength: 0, maxLength: 0 };
        case "lit": 
            if (tapeName !== g.tapeName) 
                return TAPE_SIZE_EPSILON;
            return { cardinality: 1, minLength: g.text.length, maxLength: g.text.length };
        case "dot":
            if (tapeName !== g.tapeName) 
                return TAPE_SIZE_EPSILON;
            return { cardinality: Infinity, minLength: 1, maxLength: 1 };
        case "replace": 
            return { cardinality: Infinity, minLength: 0, maxLength: Infinity };
        case "replaceblock":
            // we shouldn't get these here anyway
            if (tapeName !== g.inputTape) 
                return getTapeSize(g.child, tapeName, stack, env);
            return { cardinality: Infinity, minLength: 0, maxLength: Infinity };

        // ones where the length is just the child's length
        case "short": 
        case "test": 
        case "testnot":
        case "pretape":
        case "cursor":
        case "greedyCursor":
        case "singletape":
        case "correspond":
            return getTapeSize(g.child, tapeName, stack, env);

        // ones where it's based on the child(ren) but complicated
        case "embed": return getTapeSizeEmbed(g, tapeName, stack, env);
        case "seq": return getTapeSizeSeq(g, tapeName, stack, env);
        case "alt": return getTapeSizeAlt(g, tapeName, stack, env);
        case "join": return getTapeSizeJoin(g, tapeName, stack, env);
        case "match": return getTapeSizeMatch(g, tapeName, stack, env);
        case "count": return getTapeSizeCount(g, tapeName, stack, env);
        case "rename": return getTapeSizeRename(g, tapeName, stack, env);
        case "hide": return getTapeSizeHide(g, tapeName, stack, env);
        case "repeat": return getTapeSizeRepeat(g, tapeName, stack, env);
        case "not": return getTapeSizeNegation(g, tapeName, stack, env);
        case "qualified": return getTapeSizeQualified(g, tapeName, stack, env);
        case "selection":    return getTapeSizeSelection(g, tapeName, stack, env);

        // ones where it's not implemented
        case "context": 
        case "filter":
        case "starts":
        case "ends":
        case "contains":
        case "collection":
        case "tapename":
            throw new Error("not implemented");

        default: exhaustive(g);
    }
}

function getTapeSizeEmbed(g: EmbedGrammar, tapeName: string, stack: CounterStack, env: SymbolEnv): TapeSize {
    if (stack.get(g.symbol) >= 1)
        return { cardinality: Infinity, minLength: 0, maxLength: Infinity };
    const newStack = stack.add(g.symbol);
    const referent = env.symbolNS[g.symbol];
    if (referent === undefined) {
        throw new Error(`undefined referent ${g.symbol}, candidates are [${Object.keys(env.symbolNS)}]`);
    }
    return getTapeSize(referent, tapeName, newStack, env);
}

function getTapeSizeSeq(g: SequenceGrammar, tapeName: string, stack: CounterStack, env: SymbolEnv): TapeSize {
    let minLength = 0;
    let maxLength = 0;
    let cardinality = 1;
    for (const child of g.children) {
        const childLength = getTapeSize(child, tapeName, stack, env);
        cardinality *= childLength.cardinality;
        minLength += childLength.minLength;
        maxLength += childLength.maxLength;
    }
    return { cardinality, minLength, maxLength };  
}

function getTapeSizeAlt(g: AlternationGrammar, tapeName: string, stack: CounterStack, env: SymbolEnv): TapeSize {
    let minLength = Infinity;
    let maxLength = 0;
    let cardinality = 0;
    for (const child of g.children) {
        const childLength = getTapeSize(child, tapeName, stack, env);
        cardinality = cardinality + childLength.cardinality;
        minLength = Math.min(minLength, childLength.minLength);
        maxLength = Math.max(maxLength, childLength.maxLength);
    }
    return { cardinality, minLength, maxLength };
}

function getTapeSizeJoin(g: JoinGrammar, tapeName: string, stack: CounterStack, env: SymbolEnv): TapeSize {
    const child1Length = getTapeSize(g.child1, tapeName, stack, env);
    const child2Length = getTapeSize(g.child2, tapeName, stack, env);

    const child1tapes = new Set(g.child1.tapeNames);
    const child2tapes = new Set(g.child2.tapeNames);

    if (!(child1tapes.has(tapeName))) return child2Length;
    if (!(child2tapes.has(tapeName))) return child1Length;

    return { 
        cardinality: Math.min(child1Length.cardinality, child2Length.cardinality),
        minLength: Math.max(child1Length.minLength, child2Length.minLength),
        maxLength: Math.min(child1Length.maxLength, child2Length.maxLength)
    }
}

function getTapeSizeMatch(g: MatchGrammar, tapeName: string, stack: CounterStack, env: SymbolEnv): TapeSize {
    if (tapeName === g.outputTape) {
        // also collect as a rename
        let newTapeName = renameTape(tapeName, g.outputTape, g.inputTape);
        return getTapeSize(g.child, newTapeName, stack, env);
    }
    return getTapeSize(g.child, tapeName, stack, env);
}

function getTapeSizeCount(g: CountGrammar, tapeName: string, stack: CounterStack, env: SymbolEnv): TapeSize {
    const childLength = getTapeSize(g.child, tapeName, stack, env);
    if (tapeName !== g.tapeName) return childLength;
    return {
        cardinality: childLength.cardinality,
        minLength: childLength.minLength,
        maxLength: Math.min(childLength.maxLength, g.maxChars)
    }
}

function getTapeSizeRename(g: RenameGrammar, tapeName: string, stack: CounterStack, env: SymbolEnv): TapeSize {
    if (tapeName != g.toTape && tapeName == g.fromTape) {
        return TAPE_SIZE_EPSILON;
    }

    const newTapeName = renameTape(tapeName, g.toTape, g.fromTape);
    return getTapeSize(g.child, newTapeName, stack, env);
}

function getTapeSizeHide(g: HideGrammar, tapeName: string, stack: CounterStack, env: SymbolEnv): TapeSize {
    if (tapeName != g.toTape && tapeName == g.tapeName) {
        return TAPE_SIZE_EPSILON;
    }
    const newTapeName = renameTape(tapeName, g.toTape, g.tapeName);
    return getTapeSize(g.child, newTapeName, stack, env);
}

function getTapeSizeRepeat(g: RepeatGrammar, tapeName: string, stack: CounterStack, env: SymbolEnv): TapeSize {
    const childLength = getTapeSize(g.child, tapeName, stack, env);
    return {
        cardinality: childLength.cardinality,
        minLength: multAux(childLength.minLength, g.minReps),
        maxLength: multAux(childLength.maxLength, g.maxReps)
    };
}

/** 
 * Convenience function to get around the 
 * bizarre fact that 0 * Infinity == NaN.
 */
function multAux(n1: number, n2: number) {
    if (n1 === 0) return 0;
    if (n2 === 0) return 0;
    return n1 * n2;
}

function getTapeSizeNegation(g: NegationGrammar, tapeName: string, stack: CounterStack, env: SymbolEnv): TapeSize {
    const childTapes = new Set(g.child.tapeNames);
    if (childTapes.has(tapeName)) 
        return { cardinality: Infinity, minLength: 0, maxLength: Infinity };
    return getTapeSize(g.child, tapeName, stack, env);
}

function getTapeSizeSelection(
    g: SelectionGrammar, 
    tapeName: string, 
    stack: CounterStack, 
    env: SymbolEnv
): TapeSize {
    const newEnv = env.update(g);
    const referent = getCaseInsensitive(g.symbols, g.selection);
    if (referent === undefined) { 
        // without a valid symbol, collections are epsilon,
        // but now is not the time to complain
        return TAPE_SIZE_EPSILON;
    }
    return getTapeSize(referent, tapeName, stack, newEnv);
}

function getTapeSizeQualified(
    g: QualifiedGrammar, 
    tapeName: string, 
    stack: CounterStack, 
    env: SymbolEnv
): TapeSize {
    return TAPE_SIZE_EPSILON;
}
