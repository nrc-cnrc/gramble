import { PassEnv } from "../passes";
import { 
    CollectionGrammar, CorrespondGrammar, DotGrammar, 
    EmbedGrammar, Grammar, HideGrammar, 
    IntersectionGrammar, JoinGrammar, MatchGrammar, 
    NegationGrammar, RenameGrammar, RepeatGrammar, 
    ReplaceGrammar, SequenceGrammar, ShortGrammar, 
    StringPairSet 
} from "../grammars";
import { OPTIMIZE_ATOMIC, ValueSet, listIntersection } from "../util";
import { renameTape } from "../tapes";

type AtomicityClass = {
    joinable: boolean,
    concatenable: boolean
};

export function determineAtomicity(
    g: Grammar,
    tape: string,
    env: PassEnv
): boolean {
    if (!OPTIMIZE_ATOMIC) return false;
    const tapeInfo = getAtomicityClass(g, tape, new ValueSet(), env);
    return !tapeInfo.joinable || !tapeInfo.concatenable;
}

function getAtomicityClass(
    g: Grammar,
    tape: string,
    symbolsVisited: StringPairSet,
    env: PassEnv
): AtomicityClass {
    switch (g.tag) {
        // most grammars' class is just the combined class of their children 
        // (i.e., they're joinable if any child is joinable, same with concatenable)
        case "epsilon": 
        case "null": 
        case "lit":  
        case "alt":      
        case "singletape": 
        case "count":    
        case "locator":   
        case "test":     
        case "testnot": 
        case "cursor":     
        case "pretape":    return getAtomicityClassDefault(g, tape, symbolsVisited, env);

        // the concat-like and join-like operators may have concatenable/joinable status
        // independent of their children
        case "seq":        return getAtomicityClassSeq(g, tape, symbolsVisited, env);
        case "repeat":     return getAtomicityClassRepeat(g, tape, symbolsVisited, env);
        case "intersect":  return getAtomicityClassIntersect(g, tape, symbolsVisited, env);
        case "join":       return getAtomicityClassJoin(g, tape, symbolsVisited, env);

        // if any of the char-level operators are present relevant to the tape in question,
        // treat that tape as join+concat (that is, non-atomic).  after all, we're doing 
        // stuff at the character level
        case "dot":        return getAtomicityClassDot(g, tape, symbolsVisited, env);
        case "short":      return getAtomicityClassShort(g, tape, symbolsVisited, env);
        case "match":      return getAtomicityClassMatch(g, tape, symbolsVisited, env);
        case "correspond": return getAtomicityClassCorrespond(g, tape, symbolsVisited, env); 
        case "replace":    return getAtomicityClassReplace(g, tape, symbolsVisited, env);
        case "not":        return getAtomicityClassNegation(g, tape, symbolsVisited, env);

        // collection, embed, hide, and rename have their usual complications w.r.t. 
        // tape names and env
        case "collection": return getAtomicityClassCollection(g, tape, symbolsVisited, env);
        case "embed":      return getAtomicityClassEmbed(g, tape, symbolsVisited, env);
        case "hide":       return getAtomicityClassHide(g, tape, symbolsVisited, env);
        case "rename":     return getAtomicityClassRename(g, tape, symbolsVisited, env);

        default:           throw new Error(`unhandled grammar in getAtomicityClass: ${g.tag}`);
    }
}

export function getAtomicityClassDefault(
    g: Grammar,
    tape: string,
    symbolsVisited: StringPairSet,
    env: PassEnv
): AtomicityClass {
    let result: AtomicityClass = { joinable: false, concatenable: false };
    for (const child of g.getChildren()) {
        const childAtomicityClass = getAtomicityClass(child, tape, symbolsVisited, env);
        result.joinable ||= childAtomicityClass.joinable;
        result.concatenable ||= childAtomicityClass.concatenable;
    }
    return result;
}

function getAtomicityClassDot(
    g: DotGrammar,
    tapeName: string,
    symbolsVisited: StringPairSet,
    env: PassEnv
): AtomicityClass {
    if (tapeName == g.tapeName) {
        return { joinable: true, concatenable: true };
    }
    return { joinable: false, concatenable: false };
}

function getAtomicityClassSeq(
    g: SequenceGrammar,
    tapeName: string,
    symbolsVisited: StringPairSet,
    env: PassEnv
): AtomicityClass {
    const result = getAtomicityClassDefault(g, tapeName, symbolsVisited, env);
    if (result.concatenable) return result; // nothing is going to change if
                                            // it's already concatenable
    let alreadyFound = false;
    for (const child of g.children) {
        const ts = new Set(child.tapes);
        if (!(ts.has(tapeName))) {
            continue;
        }
        if (alreadyFound) {
            result.concatenable = true;
            return result;
        }
        alreadyFound = true;
    }
    return result;
}

function getAtomicityClassCorrespond(
    g: CorrespondGrammar,
    tapeName: string,
    symbolsVisited: StringPairSet,
    env: PassEnv
): AtomicityClass {
    if (tapeName == g.tape1 || tapeName == g.tape2) {
        return { joinable: true, concatenable: true };
    }
    return getAtomicityClassDefault(g, tapeName, symbolsVisited, env);
}

function getAtomicityClassReplace(
    g: ReplaceGrammar,
    tapeName: string,
    symbolsVisited: StringPairSet,
    env: PassEnv
): AtomicityClass {
    const ts = new Set(g.tapes);
    if (ts.has(tapeName)) {
        return { joinable: true, concatenable: true };
    }
    return getAtomicityClassDefault(g, tapeName, symbolsVisited, env);
}


function getAtomicityClassShort(
    g: ShortGrammar,
    tapeName: string,
    symbolsVisited: StringPairSet,
    env: PassEnv
): AtomicityClass {
    const ts = new Set(g.tapes);
    if (ts.has(tapeName)) {
        return { joinable: true, concatenable: true };
    }
    return getAtomicityClassDefault(g, tapeName, symbolsVisited, env);
}

function getAtomicityClassIntersect(
    g: IntersectionGrammar,
    tapeName: string,
    symbolsVisited: StringPairSet,
    env: PassEnv
): AtomicityClass {
    const result = getAtomicityClassDefault(g, tapeName, symbolsVisited, env);
    const child1Tapes = g.child1.tapes;
    const child2Tapes = g.child2.tapes;
    const intersection = new Set(listIntersection(child1Tapes, child2Tapes));
    result.joinable ||= intersection.has(tapeName);
    return result;
}

function getAtomicityClassEmbed(
    g: EmbedGrammar,
    tapeName: string,
    symbolsVisited: StringPairSet,
    env: PassEnv
): AtomicityClass {
    if (symbolsVisited.has([g.name, tapeName])) { 
        // we're recursing to a symbol we've already visited.  
        // these might be true or false, but we can just return 
        // false here because if it's true in other contexts 
        // it'll end up true in the end
        return { joinable: false, concatenable: false };
    }
    symbolsVisited.add([g.name, tapeName]);
    const referent = env.symbolNS.get(g.name);
    return getAtomicityClass(referent, tapeName, symbolsVisited, env);
}

function getAtomicityClassCollection(
    g: CollectionGrammar,
    tapeName: string,
    symbolsVisited: StringPairSet,
    env: PassEnv
): AtomicityClass {
    const newEnv = env.pushSymbols(g.symbols);
    return getAtomicityClassDefault(g, tapeName, symbolsVisited, newEnv);
}

function getAtomicityClassMatch(
    g: MatchGrammar,
    tapeName: string,
    symbolsVisited: StringPairSet,
    env: PassEnv
): AtomicityClass {
    if (tapeName == g.fromTape || tapeName == g.toTape) {
        return { joinable: true, concatenable: true };
    }
    return getAtomicityClassDefault(g, tapeName, symbolsVisited, env);
}


function getAtomicityClassHide(
    g: HideGrammar,
    tapeName: string,
    symbolsVisited: StringPairSet,
    env: PassEnv
): AtomicityClass {
    if (tapeName != g.toTape && tapeName == g.tapeName) {
        return {joinable: false, concatenable: false};
    }
    const newTapeName = renameTape(tapeName, g.toTape, g.tapeName);
    return getAtomicityClass(g.child, newTapeName, symbolsVisited, env);
}

function getAtomicityClassNegation(
    g: NegationGrammar,
    tapeName: string, 
    symbolsVisited: StringPairSet,
    env: PassEnv
): AtomicityClass {
    const ts = new Set(g.tapes);
    if (ts.has(tapeName)) {
        return { joinable: true, concatenable: true };
    }
    return getAtomicityClassDefault(g, tapeName, symbolsVisited, env);
}

function getAtomicityClassRepeat(
    g: RepeatGrammar,
    tapeName: string, 
    symbolsVisited: StringPairSet,
    env: PassEnv
): AtomicityClass {
    const result = getAtomicityClass(g.child, tapeName, symbolsVisited, env);
    const ts = new Set(g.tapes);
    if (ts.has(tapeName)) {
        result.concatenable = true;
    }
    return result;
}

function getAtomicityClassRename(
    g: RenameGrammar,
    tapeName: string, 
    symbolsVisited: StringPairSet,
    env: PassEnv
): AtomicityClass {
    if (tapeName != g.toTape && tapeName == g.fromTape) {
        return {joinable: false, concatenable: false};
    }
    const newTapeName = renameTape(tapeName, g.toTape, g.fromTape);
    return getAtomicityClass(g.child, newTapeName, symbolsVisited, env);
}

function getAtomicityClassJoin(
    g: JoinGrammar,
    tapeName: string, 
    symbolsVisited: StringPairSet,
    env: PassEnv
): AtomicityClass {
    const result = getAtomicityClassDefault(g, tapeName, symbolsVisited, env);
    const child1Tapes = g.child1.tapes;
    const child2Tapes = g.child2.tapes;
    const intersection = new Set(listIntersection(child1Tapes, child2Tapes));
    result.joinable ||= intersection.has(tapeName);
    return result;
}