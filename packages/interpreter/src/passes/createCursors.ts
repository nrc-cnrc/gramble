import { Pass, SymbolEnv } from "../passes.js";
import { 
    QualifiedGrammar,
    GreedyCursorGrammar, DotGrammar, 
    EmbedGrammar, Grammar, 
    HideGrammar, JoinGrammar, 
    LiteralGrammar, 
    PreTapeGrammar, 
    RenameGrammar, 
    ReplaceGrammar, 
    StringPairSet, 
    CursorGrammar,
    SelectionGrammar
} from "../grammars.js";
import { 
    renameTape
} from "../tapes.js";
import { Cursor } from "../grammarConvenience.js";
import { children } from "../components.js";
import { Options } from "../utils/options.js";
import { getCaseInsensitive } from "../utils/func.js";

export class CreateCursors extends Pass<Grammar,Grammar> {

    public getEnv(opt: Partial<Options>): SymbolEnv {
        return new SymbolEnv(opt);
    }

    public transformAux(g: Grammar, env: SymbolEnv): Grammar {
        const priorities = prioritizeTapes(g, env);
        //env.logDebug(`priorities = ${priorities}`);
        return Cursor(priorities, g).tapify(env);
    }
}

export function prioritizeTapes(
    g: Grammar,
    env: SymbolEnv,
): string[] {
    const priorities: [string, number][] = g.tapeNames.map(t => {
        const joinWeight = getTapePriority(g, t, new StringPairSet(), env);
        
        /* TODO: temporarily removing vocab size from
          this calculation; return it later */
        //const tape = tapeNS.get(t);
        //const priority = joinWeight * Math.max(tape.vocab.size, 1);
        //return [t, priority];

        return [t, joinWeight];
    });

    const computedPriorities = priorities.filter(([t, priority]) => priority >= 0)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([a,_]) => a);

    if (env.opt.priority.length == 0)
        return computedPriorities;

    // Concatenate explicit tape priorities from env.opt with the computed ones,
    // and remove the duplicates.
    const result = env.opt.priority.concat(computedPriorities)
                        .filter((e, idx, self) => idx === self.indexOf(e));

    // env.logDebug(`result: ${result}`);
    return result;
}

function getTapePriority(
    g: Grammar,
    tape: string,
    symbolsVisited: StringPairSet,
    env: SymbolEnv
): number {
    switch (g.tag) {
        case "epsilon": 
        case "null": 
        case "seq":
        case "alt":
        case "repeat":  
        case "not":    
        case "singletape": 
        case "count":    
        case "match":
        case "test":     
        case "testnot": 
        case "short":
        case "match":
        case "correspond":  return getTapePriorityDefault(g, tape, symbolsVisited, env);

        // literals & similar start things out, they're priority 1 for their tape
        case "lit":         return getTapePriorityLeaf(g, tape, symbolsVisited, env);
        case "dot":         return getTapePriorityLeaf(g, tape, symbolsVisited, env);

        // joins & similar increase the priority of their intersecting tapes
        case "join":        return getTapePriorityJoin(g, tape, symbolsVisited, env);
        case "replace":     return getTapePriorityReplace(g, tape, symbolsVisited, env);

        // cursor and pretape handle priority on their own, so they're -1 for the tape they handle
        case "pretape":     return getTapePriorityPreTape(g, tape, symbolsVisited, env);
        case "cursor":      return getTapePriorityCursor(g, tape, symbolsVisited, env);

        // embed/rename etc. have their usual complications
        case "embed":       return getTapePriorityEmbed(g, tape, symbolsVisited, env);
        case "selection":  return getTapePrioritySelection(g, tape, symbolsVisited, env);
        case "hide":        return getTapePriorityHide(g, tape, symbolsVisited, env);
        case "rename":      return getTapePriorityRename(g, tape, symbolsVisited, env);

        default:            throw new Error(`missing grammar in getTapePriority: ${g.tag}`);
    }
}

function getTapePriorityDefault(
    g: Grammar,
    tape: string,
    symbolsVisited: StringPairSet,
    env: SymbolEnv
): number {
    const priorities: number[] = [0];
    for (const child of children(g)) {
        const childPriority = getTapePriority(child, tape, symbolsVisited, env);
        if (childPriority < 0) {
            return childPriority;
        }
        priorities.push(childPriority);
    }
    return Math.max(...priorities);
}

function getTapePriorityLeaf(
    g: LiteralGrammar | DotGrammar,
    tape: string,
    symbolsVisited: StringPairSet,
    env: SymbolEnv
): number {
    return (tape == g.tapeName) ? 1 : 0;
}

function getTapePrioritySelection(
    g: SelectionGrammar,
    tape: string,
    symbolsVisited: StringPairSet,
    env: SymbolEnv  
): number {
    const newEnv = env.update(g);
    const referent = getCaseInsensitive(g.symbols, g.selection);
    if (referent === undefined) { 
        // without a valid symbol, collections are epsilon,
        // but now is not the time to complain
        return 0;  
    }
    return getTapePriority(referent, tape, symbolsVisited, newEnv);
}

function getTapePriorityEmbed(
    g: EmbedGrammar,
    tape: string,
    symbolsVisited: StringPairSet,
    env: SymbolEnv
): number {
    if (symbolsVisited.has([g.symbol, tape])) { 
        return 0;
    }
    symbolsVisited.add([g.symbol, tape]);
    const referent = env.symbolNS[g.symbol];
    if (referent === undefined) {
        throw new Error(`undefined referent ${g.symbol}, candidates are [${Object.keys(env.symbolNS)}]`);
    }
    return getTapePriority(referent, tape, symbolsVisited, env);
}

function getTapePriorityHide(
    g: HideGrammar,
    tape: string,
    symbolsVisited: StringPairSet,
    env: SymbolEnv
): number {
    if (tape != g.toTape && tape == g.tapeName) {
        return 0;
    }
    const newTape = renameTape(tape, g.toTape, g.tapeName);
    return getTapePriority(g.child, newTape, symbolsVisited, env);
}

function getTapePriorityPreTape(
    g: PreTapeGrammar,
    tape: string,
    symbolsVisited: StringPairSet,
    env: SymbolEnv
): number {
    if (tape == g.inputTape) return -1;
    return getTapePriorityDefault(g, tape, symbolsVisited, env);
}

function getTapePriorityCursor(
    g: CursorGrammar,
    tapeName: string,
    symbolsVisited: StringPairSet,
    env: SymbolEnv
): number {
    if (tapeName == g.tapeName) return -1;
    return getTapePriorityDefault(g, tapeName, symbolsVisited, env);
}

function getTapePriorityRename(
    g: RenameGrammar,
    tapeName: string,
    symbolsVisited: StringPairSet,
    env: SymbolEnv
): number {
    if (tapeName != g.toTape && tapeName == g.fromTape) {
        return 0;
    }
    const newTapeName = renameTape(tapeName, g.toTape, g.fromTape);
    return getTapePriority(g.child, newTapeName, symbolsVisited, env);
}

function getTapePriorityJoin(
    g: JoinGrammar,
    tapeName: string,
    symbolsVisited: StringPairSet,
    env: SymbolEnv
): number {
    const c1tapes = new Set(g.child1.tapeNames);
    const c2tapes = new Set(g.child2.tapeNames);
    const c1priority = getTapePriority(g.child1, tapeName, symbolsVisited, env);
    const c2priority = getTapePriority(g.child2, tapeName, symbolsVisited, env);
    if (c1tapes.has(tapeName) && c2tapes.has(tapeName)) {
        return c1priority + c2priority * 10;
    }
    return (c1priority + c2priority);
}

function getTapePriorityReplace(
    g: ReplaceGrammar,
    tapeName: string,
    symbolsVisited: StringPairSet,
    env: SymbolEnv
): number {
    const c1tapes = new Set(g.inputChild.tapeNames);
    const c2tapes = new Set(g.outputChild.tapeNames);
    const c1priority = getTapePriority(g.inputChild, tapeName, symbolsVisited, env);
    const c2priority = getTapePriority(g.outputChild, tapeName, symbolsVisited, env);
    if (c1tapes.has(tapeName) && c2tapes.has(tapeName)) {
        return c1priority + c2priority * 10;
    }
    return (c1priority + c2priority);
}
