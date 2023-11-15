import { PassEnv } from "../passes";
import { 
    CounterStack, CursorGrammar, DotGrammar, 
    EmbedGrammar, Grammar, HideGrammar, 
    IntersectionGrammar, JoinGrammar, 
    LiteralGrammar, 
    PreTapeGrammar, 
    RenameGrammar, 
    StringPairSet 
} from "../grammars";
import { TapeNamespace, renameTape } from "../tapes";

export function prioritizeTapes(
    g: Grammar,
    tapeNS: TapeNamespace,
    env: PassEnv
): string[] {
    const priorities: [string, number][] = g.tapes.map(t => {
        const joinWeight = getTapePriority(g, t, new StringPairSet(), env);
        
        /* TODO: temporarily removing vocab size from
          this calculation; return it later */
        //const tape = tapeNS.get(t);
        //const priority = joinWeight * Math.max(tape.vocab.size, 1);
        //return [t, priority];

        return [t, joinWeight];
    });

    const result = priorities.filter(([t, priority]) => priority >= 0)
                     .sort((a, b) => b[1] - a[1])
                     .map(([a,_]) => a);
    
    return result;
}

function getTapePriority(
    g: Grammar,
    tape: string,
    symbolsVisited: StringPairSet,
    env: PassEnv
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
        case "locator":   
        case "match":
        case "test":     
        case "testnot": 
        case "short":
        case "match":
        case "replace":
        case "correspond":
        case "collection":  return getTapePriorityDefault(g, tape, symbolsVisited, env);
        
        // literals & similar start things out, they're priority 1 for their tape
        case "lit":         return getTapePriorityLeaf(g, tape, symbolsVisited, env);
        case "dot":         return getTapePriorityLeaf(g, tape, symbolsVisited, env);

        // joins & similar increase the priority of their intersecting tapes
        case "join":        return getTapePriorityJoin(g, tape, symbolsVisited, env);
        case "intersect":   return getTapePriorityIntersect(g, tape, symbolsVisited, env);

        // cursor and pretape handle priority on their own, so they're -1 for the tape they handle
        case "pretape":     return getTapePriorityPreTape(g, tape, symbolsVisited, env);
        case "cursor":      return getTapePriorityCursor(g, tape, symbolsVisited, env);

        // embed/rename etc. have their usual complications
        case "embed":       return getTapePriorityEmbed(g, tape, symbolsVisited, env);
        case "hide":        return getTapePriorityHide(g, tape, symbolsVisited, env);
        case "rename":      return getTapePriorityRename(g, tape, symbolsVisited, env);

        default:            throw new Error(`missing grammar in getTapePriority: ${g.tag}`);
    }
}

function getTapePriorityDefault(
    g: Grammar,
    tape: string,
    symbolsVisited: StringPairSet,
    env: PassEnv
): number {
    const priorities: number[] = [0];
    for (const child of g.getChildren()) {
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
    env: PassEnv
): number {
    return (tape == g.tapeName) ? 1 : 0;
}

function getTapePriorityEmbed(
    g: EmbedGrammar,
    tape: string,
    symbolsVisited: StringPairSet,
    env: PassEnv
): number {
    if (symbolsVisited.has([g.name, tape])) { 
        return 0;
    }
    symbolsVisited.add([g.name, tape]);
    const referent = env.symbolNS.get(g.name);
    return getTapePriority(referent, tape, symbolsVisited, env);
}

function getTapePriorityHide(
    g: HideGrammar,
    tape: string,
    symbolsVisited: StringPairSet,
    env: PassEnv
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
    env: PassEnv
): number {
    if (tape == g.fromTape) return -1;
    return getTapePriorityDefault(g, tape, symbolsVisited, env);
}

function getTapePriorityCursor(
    g: CursorGrammar,
    tapeName: string,
    symbolsVisited: StringPairSet,
    env: PassEnv
): number {
    if (tapeName == g.tape) return -1;
    return getTapePriorityDefault(g, tapeName, symbolsVisited, env);
}

function getTapePriorityRename(
    g: RenameGrammar,
    tapeName: string,
    symbolsVisited: StringPairSet,
    env: PassEnv
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
    env: PassEnv
): number {
        const c1tapes = new Set(g.child1.tapes);
        const c2tapes = new Set(g.child2.tapes);
        const c1priority = getTapePriority(g.child1, tapeName, symbolsVisited, env);
        const c2priority = getTapePriority(g.child2, tapeName, symbolsVisited, env);
        if (c1tapes.has(tapeName) && c2tapes.has(tapeName)) {
            return c1priority + c2priority * 10;
        }
        return (c1priority + c2priority);
    }

function getTapePriorityIntersect(
    g: IntersectionGrammar,
    tapeName: string,
    symbolsVisited: StringPairSet,
    env: PassEnv
): number {
    const c1priority = getTapePriority(g.child1, tapeName, symbolsVisited, env);
    const c2priority = getTapePriority(g.child2, tapeName, symbolsVisited, env);
    return c1priority + c2priority * 10;
}

