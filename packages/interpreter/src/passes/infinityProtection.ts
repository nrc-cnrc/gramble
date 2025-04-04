import { Pass, SymbolEnv } from "../passes.js";
import { AlternationGrammar, 
    QualifiedGrammar, 
    CountGrammar, 
    GreedyCursorGrammar, 
    EmbedGrammar, 
    Grammar, HideGrammar,
    JoinGrammar, 
    LengthRange, 
    MatchGrammar,
    NegationGrammar,
    PriorityUnionGrammar,
    RenameGrammar,
    RepeatGrammar,
    SequenceGrammar,
    CursorGrammar,
    SelectionGrammar
} from "../grammars.js";
import { renameTape } from "../tapes.js";
import { Count } from "../grammarConvenience.js";
import { exhaustive, getCaseInsensitive, update } from "../utils/func.js";
import { Msg } from "../utils/msgs.js";
import { CounterStack } from "../utils/counter.js";
import { Options } from "../utils/options.js";
import { DEFAULT_MAX_CHARS } from "../utils/constants.js";

export class InfinityProtection extends Pass<Grammar,Grammar> {

    public getEnv(opt: Partial<Options>): SymbolEnv {
        return new SymbolEnv(opt);
    }

    public transform(g: Grammar, env: SymbolEnv): Msg<Grammar> {

        if (env.opt.maxChars == Infinity) return g.msg();

        const newEnv = env.update(g);
        const mapped = g.mapChildren(this, newEnv);
        return mapped.bind(g => {
            switch (g.tag) {
                case "cursor":
                case "greedyCursor":   return this.transformCursor(g, env);

                default:               return g;
            }
        });
    }

    public transformCursor(
        g: CursorGrammar | GreedyCursorGrammar, 
        env: SymbolEnv
    ): Grammar {
        const stack = new CounterStack(2);
        const len = lengthRange(g.child, g.tapeName, stack, env);

        // it's null, it doesn't matter
        if (len.null == true) return g;
        
        // if it's not potentially infinite, replace with a greedy cursor
        if (len.max !== Infinity) {
            return new GreedyCursorGrammar(g.tapeName, g.child, g.vocab)
                                        .tapify(env);
        }

        // it's potentially infinite, add a Count for protection
        let maxChars: number;
        if (typeof env.opt.maxChars === 'number')
            maxChars = env.opt.maxChars;
        else if (g.tapeName in env.opt.maxChars)
            maxChars = env.opt.maxChars[g.tapeName];
        else
            maxChars = DEFAULT_MAX_CHARS;
        const child = new CountGrammar(g.child, g.tapeName, maxChars, false, false);
        return update(g, {child}).tapify(env);
    }
}

export function infinityProtection(
    grammar: Grammar,
    tapes: string[],
    env: SymbolEnv
): Grammar {

    let foundInfinite = false;
    const maxCharsDict: {[tape: string]: number} = {};
    const stack = new CounterStack(2);

    for (const tape of tapes) {
        const len = lengthRange(grammar, tape, stack, env);
        if (len.null == true) continue;
        if (len.max == Infinity && env.opt.maxChars != Infinity) {
            if (typeof env.opt.maxChars === 'number')
                maxCharsDict[tape] = env.opt.maxChars;
            else if (tape in maxCharsDict)
                maxCharsDict[tape] = env.opt.maxChars[tape];
            foundInfinite = true;
        }
    }

    if (!foundInfinite) return grammar;
    return Count(maxCharsDict, grammar);
}

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
export function lengthRange(
    g: Grammar,
    tapeName: string, 
    stack: CounterStack, 
    env: SymbolEnv
): LengthRange {

    switch (g.tag) {

        // ones with a specific length
        case "epsilon": return { null: false, min: 0, max: 0 };
        case "null": 
            return { null: true, min: 0, max: 0 };
        case "lit": 
            if (tapeName !== g.tapeName) 
                return { null: false, min: 0, max: 0 };
            return { null: false, min: g.text.length, max: g.text.length };
        case "dot":
            if (tapeName !== g.tapeName) 
                return { null: false, min: 0, max: 0 };
            return { null: false, min: 1, max: 1 };
        case "replace": 
            return { null: false, min: 0, max: Infinity };
        case "replaceblock":
            // we shouldn't get these here anyway
            if (tapeName !== g.inputTape) 
                return lengthRange(g.child, tapeName, stack, env);
            return { null: false, min: 0, max: Infinity };

        // ones where the length is just the child's length
        case "short": 
        case "test": 
        case "testnot":
        case "pretape":
        case "cursor":
        case "greedyCursor":
        case "singletape":
        case "correspond":
            return lengthRange(g.child, tapeName, stack, env);

        // ones where it's based on the child(ren) but complicated
        case "embed": return lengthEmbed(g, tapeName, stack, env);
        case "seq": return lengthSeq(g, tapeName, stack, env);
        case "alt": return lengthAlt(g, tapeName, stack, env);
        case "priority": return lengthPriority(g, tapeName, stack, env);
        case "join": return lengthJoin(g, tapeName, stack, env);
        case "match": return lengthMatch(g, tapeName, stack, env);
        case "count": return lengthCount(g, tapeName, stack, env);
        case "rename": return lengthRename(g, tapeName, stack, env);
        case "hide": return lengthHide(g, tapeName, stack, env);
        case "repeat": return lengthRepeat(g, tapeName, stack, env);
        case "not": return lengthNot(g, tapeName, stack, env);
        case "qualified": return lengthQualified(g, tapeName, stack, env);
        case "selection":    return lengthSelection(g, tapeName, stack, env);

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

function lengthEmbed(g: EmbedGrammar, tapeName: string, stack: CounterStack, env: SymbolEnv): LengthRange {
    if (stack.get(g.symbol) >= 1)
        return { null: false, min: 0, max: Infinity };
    const newStack = stack.add(g.symbol);
    const referent = env.symbolNS[g.symbol];
    if (referent === undefined) {
        throw new Error(`undefined referent ${g.symbol}, candidates are [${Object.keys(env.symbolNS)}]`);
    }
    return lengthRange(referent, tapeName, newStack, env);
}

function lengthSeq(g: SequenceGrammar, tapeName: string, stack: CounterStack, env: SymbolEnv): LengthRange {
    let min = 0;
    let max = 0;
    for (const child of g.children) {
        const childLength = lengthRange(child, tapeName, stack, env);
        if (childLength.null) { return childLength; } // short-circuit if null
        min += childLength.min;
        max += childLength.max;
    }
    return { null: false, min: min, max: max };  
}

function lengthAlt(g: AlternationGrammar, tapeName: string, stack: CounterStack, env: SymbolEnv): LengthRange {
    let min = Infinity;
    let max = 0;
    let isNull = true;
    if (g.children.length == 0) {
        return { null: true, min: min, max: max };
    }
    for (const child of g.children) {
        const childLength = lengthRange(child, tapeName, stack, env);
        isNull = isNull && childLength.null;
        min = Math.min(min, childLength.min);
        max = Math.max(max, childLength.max);
    }
    return { null: isNull, min: min, max: max };
}

function lengthPriority(g: PriorityUnionGrammar, tapeName: string, stack: CounterStack, env: SymbolEnv): LengthRange {
    const child1length = lengthRange(g.child1, tapeName, stack, env);
    const child2length = lengthRange(g.child2, tapeName, stack, env);
    return { null: child1length.null && child2length.null,
             min: Math.min(child1length.min, child2length.min),
             max: Math.max(child1length.max, child2length.max) }
}

function lengthJoin(g: JoinGrammar, tapeName: string, stack: CounterStack, env: SymbolEnv): LengthRange {
    const child1Length = lengthRange(g.child1, tapeName, stack, env);
    const child2Length = lengthRange(g.child2, tapeName, stack, env);

    const child1tapes = new Set(g.child1.tapeNames);
    const child2tapes = new Set(g.child2.tapeNames);

    if (!(child1tapes.has(tapeName))) return child2Length;
    if (!(child2tapes.has(tapeName))) return child1Length;

    if (child1Length.null == true || child2Length.null == true) {
        return { null: true, min: 0, max: 0 };
    }
    return { 
        null: false,
        min: Math.max(child1Length.min, child2Length.min),
        max: Math.min(child1Length.max, child2Length.max)
    }
}

function lengthMatch(g: MatchGrammar, tapeName: string, stack: CounterStack, env: SymbolEnv): LengthRange {
    if (tapeName === g.outputTape) {
        // also collect as a rename
        let newTapeName = renameTape(tapeName, g.outputTape, g.inputTape);
        return lengthRange(g.child, newTapeName, stack, env);
    }
    return lengthRange(g.child, tapeName, stack, env);
}

function lengthCount(g: CountGrammar, tapeName: string, stack: CounterStack, env: SymbolEnv): LengthRange {
    const childLength = lengthRange(g.child, tapeName, stack, env);
    if (tapeName !== g.tapeName) return childLength;
    return {
        null: childLength.null,
        min: childLength.min,
        max: Math.min(childLength.max, g.maxChars)
    }
}

function lengthRename(g: RenameGrammar, tapeName: string, stack: CounterStack, env: SymbolEnv): LengthRange {
    if (tapeName != g.toTape && tapeName == g.fromTape) {
        return { null: false, min: 0, max: 0 };
    }

    const newTapeName = renameTape(tapeName, g.toTape, g.fromTape);
    return lengthRange(g.child, newTapeName, stack, env);
}

function lengthHide(g: HideGrammar, tapeName: string, stack: CounterStack, env: SymbolEnv): LengthRange {
    if (tapeName != g.toTape && tapeName == g.tapeName) {
        return { null: false, min: 0, max: 0 };
    }
    const newTapeName = renameTape(tapeName, g.toTape, g.tapeName);
    return lengthRange(g.child, newTapeName, stack, env);
}

function lengthRepeat(g: RepeatGrammar, tapeName: string, stack: CounterStack, env: SymbolEnv): LengthRange {
    const childLength = lengthRange(g.child, tapeName, stack, env);
    return {
        null: childLength.null,
        min: multAux(childLength.min, g.minReps),
        max: multAux(childLength.max, g.maxReps)
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

function lengthNot(g: NegationGrammar, tapeName: string, stack: CounterStack, env: SymbolEnv): LengthRange {
    const childTapes = new Set(g.child.tapeNames);
    if (childTapes.has(tapeName)) 
        return { null: false, min: 0, max: Infinity };
    return lengthRange(g.child, tapeName, stack, env);
}

function lengthSelection(
    g: SelectionGrammar, 
    tapeName: string, 
    stack: CounterStack, 
    env: SymbolEnv
): LengthRange {
    const newEnv = env.update(g);
    const referent = getCaseInsensitive(g.symbols, g.selection);
    if (referent === undefined) { 
        // without a valid symbol, collections are epsilon,
        // but now is not the time to complain
        return { null: false, min: 0, max: 0 };
    }
    return lengthRange(referent, tapeName, stack, newEnv);
}

function lengthQualified(
    g: QualifiedGrammar, 
    tapeName: string, 
    stack: CounterStack, 
    env: SymbolEnv
): LengthRange {
    return { null: false, min: 0, max: 0 };
}
