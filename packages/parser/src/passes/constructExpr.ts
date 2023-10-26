import { PassEnv } from "../passes";
import {
    AlternationGrammar,
    CollectionGrammar, CorrespondGrammar, CountGrammar, CursorGrammar, DotGrammar,
    EmbedGrammar, Expr, Grammar, HideGrammar,
    IntersectionGrammar, JoinGrammar, MatchGrammar,
    NegationGrammar, PreTapeGrammar, RenameGrammar, RepeatGrammar,
    ReplaceGrammar, SequenceGrammar, ShortGrammar,
} from "../grammars";
import { Dict, REPLACE_INPUT_TAPE } from "../util";
import { TapeNamespace } from "../tapes";
import { CollectionExpr, EPSILON, EpsilonExpr, NULL, constructAlternation, constructCollection, constructCorrespond, constructCount, constructCursor, constructDot, constructDotStar, constructEmbed, constructIntersection, constructJoin, constructLiteral, constructMatch, constructNegation, constructNotContains, constructPreTape, constructPrecede, constructRename, constructRepeat, constructSequence, constructShort } from "../exprs";

export function constructExpr(
    env: PassEnv,
    g: Grammar,
    tapeNS: TapeNamespace
): Expr {
    switch (g.tag) {

        // test and testnot play no role in the Expr tree
        case "test":
        case "testnot":
        case "locator":    return constructExpr(env, g.child, tapeNS);

        // grammars with no children are pretty trivial, do them
        // in one line
        case "epsilon":    return EPSILON;
        case "null":       return NULL;
        case "lit":        return constructLiteral(g.tapeName, g.text, g.tokens);
        case "dot":        return constructDot(g.tapeName);
        case "embed":      return constructEmbed(g.name, undefined);
    
        // everything else has children
        case "seq":        return constructExprSeq(env, g, tapeNS);
        case "alt":        return constructExprAlt(env, g, tapeNS);
        case "short":      return constructExprShort(env, g, tapeNS);
        case "intersect":  return constructExprIntersect(env, g, tapeNS);
        case "join":       return constructExprJoin(env, g, tapeNS);
        case "count":      return constructExprCount(env, g, tapeNS);
        case "rename":     return constructExprRename(env, g, tapeNS);
        case "repeat":     return constructExprRepeat(env, g, tapeNS);
        case "not":        return constructExprNot(env, g, tapeNS);
        case "cursor":     return constructExprCursor(env, g, tapeNS);
        case "pretape":    return constructExprPreTape(env, g, tapeNS);
        case "hide":       return constructExprHide(env, g, tapeNS);
        case "match":      return constructExprMatch(env, g, tapeNS);
        case "collection": return constructExprCollection(env, g, tapeNS);
        case "correspond": return constructExprCorrespond(env, g, tapeNS);
        case "replace":    return constructExprReplace(env, g, tapeNS);
        
        default: throw new Error(`unhandled grammar in constructExpr: ${g.tag}`)
    }
}

function constructExprSeq(
    env: PassEnv,
    g: SequenceGrammar,
    tapeNS: TapeNamespace
): Expr {
    const childExprs = g.children.map(c => constructExpr(env, c, tapeNS));
    return constructSequence(...childExprs);
}

function constructExprAlt(
    env: PassEnv,
    g: AlternationGrammar,
    tapeNS: TapeNamespace
): Expr {
    const childExprs = g.children.map(c => constructExpr(env, c, tapeNS));
    return constructAlternation(...childExprs);
}

function constructExprShort(
    env: PassEnv,
    g: ShortGrammar,
    tapeNS: TapeNamespace
): Expr {
    const child = constructExpr(env, g.child, tapeNS);
    return constructShort(child);
}

function constructExprIntersect(
    env: PassEnv,
    g: IntersectionGrammar,
    tapeNS: TapeNamespace
): Expr {
    const left = constructExpr(env, g.child1, tapeNS);
    const right = constructExpr(env, g.child2, tapeNS);
    return constructIntersection(left, right);
}

function constructExprJoin(
    env: PassEnv,
    g: JoinGrammar,
    tapeNS: TapeNamespace
): Expr {
    return constructJoin(constructExpr(env, g.child1, tapeNS),
        constructExpr(env, g.child2, tapeNS),
        new Set(g.child1.tapes),
        new Set(g.child2.tapes));
}


function constructExprCount(
    env: PassEnv,
    g: CountGrammar,
    tapeNS: TapeNamespace
): Expr {
    let childExpr = constructExpr(env, g.child, tapeNS);
    return constructCount(childExpr, g.tapeName, g.maxChars,
        g.countEpsilon, g.errorOnCountExceeded);
}

function constructExprRename(
    env: PassEnv,
    g: RenameGrammar,
    tapeNS: TapeNamespace
): Expr {
    const newTapeNS = tapeNS.rename(g.toTape, g.fromTape);
    const childExpr = constructExpr(env, g.child, newTapeNS);
    return constructRename(childExpr, g.fromTape, g.toTape);
}

function constructExprRepeat(
    env: PassEnv,
    g: RepeatGrammar,
    tapeNS: TapeNamespace
): Expr {
    const childExpr = constructExpr(env, g.child, tapeNS);
    return constructRepeat(childExpr, g.minReps, g.maxReps);
}

function constructExprNot(
    env: PassEnv,
    g: NegationGrammar,
    tapeNS: TapeNamespace
): Expr {
    const childExpr = constructExpr(env, g.child, tapeNS);
    return constructNegation(childExpr, new Set(g.child.tapes));
}

function constructExprCursor(
    env: PassEnv,
    g: CursorGrammar,
    tapeNS: TapeNamespace
): Expr {
    const childExpr = constructExpr(env, g.child, tapeNS);
    return constructCursor(g.tape, childExpr);
}

function constructExprPreTape(
    env: PassEnv,
    g: PreTapeGrammar,
    tapeNS: TapeNamespace
): Expr {
    const childExpr = constructExpr(env, g.child, tapeNS);
    return constructPreTape(g.fromTape, g.toTape, childExpr);
}

function constructExprHide(
    env: PassEnv,
    g: HideGrammar,
    tapeNS: TapeNamespace
): Expr {
    const childExpr = constructExpr(env, g.child, tapeNS);
    return constructRename(childExpr, g.tapeName, g.toTape);
}

function constructExprMatch(
    env: PassEnv,
    g: MatchGrammar,
    tapeNS: TapeNamespace
): Expr {
    const childExpr = constructExpr(env, g.child, tapeNS);
    return constructMatch(childExpr, g.fromTape, g.toTape);
}

function constructExprCollection(
    env: PassEnv,
    g: CollectionGrammar,
    tapeNS: TapeNamespace
): Expr {
    let newSymbols: Dict<Expr> = {};
    let selectedExpr: Expr = EPSILON;
    let selectedFound = false;
    //const newSymbolNS = symbols.push(newSymbols);
    for (const [name, referent] of Object.entries(g.symbols)) {
        let expr = constructExpr(env, referent, tapeNS);
        newSymbols[name] = expr;
        if (name.toLowerCase() == g.selectedSymbol.toLowerCase()) {
            selectedExpr = expr;
            selectedFound = true;
        }
    }
    if (selectedFound) {
        return constructCollection(selectedExpr, newSymbols);
    }
    return new CollectionExpr(selectedExpr, newSymbols);
}


function constructExprCorrespond(
    env: PassEnv,
    g: CorrespondGrammar,
    tapeNS: TapeNamespace
): Expr {
    const childExpr = constructExpr(env, g.child, tapeNS);
    return constructCorrespond(childExpr, g.tape1, g.tape2);
}

function constructExprReplace(
    env: PassEnv,
    g: ReplaceGrammar,
    tapeNS: TapeNamespace
): Expr {
    if (g.beginsWith || g.endsWith) {
        g.maxReps = Math.max(1, g.maxReps);
        g.minReps = Math.min(g.minReps, g.maxReps);
    }

    const fromExpr: Expr = constructExpr(env, g.fromGrammar, tapeNS);
    const toExpr: Expr = constructExpr(env, g.toGrammar, tapeNS);
    const preContextExpr: Expr = constructExpr(env, g.preContext, tapeNS);
    const postContextExpr: Expr = constructExpr(env, g.postContext, tapeNS);
    let states: Expr[] = [
        constructMatch(preContextExpr),
        constructCorrespond(constructPrecede(fromExpr, toExpr)),
        constructMatch(postContextExpr)
    ];

    const that = g;

    function matchAnythingElse(replaceNone: boolean = false): Expr {
        // 1. If the rule is optional, we just need to match .*
        // 2. If we are matching an instance at the start of text (beginsWith),
        //    or end of text (endsWith), then merely matching the replacement pattern
        //    isn't really matching.  That is, if we're matching "#b", the fact that b
        //    occurs elsewhere is no problem, it's not actually a match.  So we just 
        //    need to match .*

        if( that.optional ||
                (that.beginsWith && !replaceNone) ||
                (that.endsWith && !replaceNone)) {
            return constructMatch(constructDotStar(REPLACE_INPUT_TAPE));
        }
        const fromInstance: Expr[] = [preContextExpr, fromExpr, postContextExpr];

        let notExpr: Expr = constructNotContains(REPLACE_INPUT_TAPE, fromInstance,
            that.beginsWith && replaceNone, that.endsWith && replaceNone);
        return constructMatch(notExpr);
    }
    
    if (!g.endsWith)
        states.push(matchAnythingElse());

    const replaceOne: Expr = constructSequence(...states);
    const replaceMultiple: Expr = constructRepeat(replaceOne, Math.max(1, g.minReps), g.maxReps);
    
    // we need to match the context on other tapes too
    const otherContextExpr: Expr = constructExpr(env, g.otherContext, tapeNS);
    if (g.beginsWith)
        states = [replaceOne, otherContextExpr]
    else if (g.endsWith)
        states = [matchAnythingElse(), replaceOne, otherContextExpr];
    else
        states = [matchAnythingElse(), replaceMultiple, otherContextExpr];
    let replaceExpr: Expr = constructSequence(...states);
            
    if (g.minReps > 0) {
        return replaceExpr;
    } else {
        let copyExpr: Expr = matchAnythingElse(true);
        if (! (otherContextExpr instanceof EpsilonExpr)) {
            let negatedOtherContext: Expr = 
                constructNegation(otherContextExpr, new Set(g.otherContext.tapes));
            const matchDotStar: Expr =
                constructMatch(constructDotStar(REPLACE_INPUT_TAPE));
            copyExpr = constructAlternation(constructSequence(matchAnythingElse(true), otherContextExpr),
                                            constructSequence(matchDotStar, negatedOtherContext));
        }
        return constructAlternation(copyExpr, replaceExpr);
    }
}