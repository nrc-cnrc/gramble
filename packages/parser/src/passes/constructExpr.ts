import { PassEnv } from "../passes";
import {
    AlternationGrammar,
    CollectionGrammar, CorrespondGrammar, CountGrammar, CursorGrammar, DotGrammar,
    EmbedGrammar, Expr, Grammar, HideGrammar,
    IntersectionGrammar, JoinGrammar, MatchGrammar,
    NegationGrammar, PreTapeGrammar, RenameGrammar, RepeatGrammar,
    ReplaceGrammar, SequenceGrammar, ShortGrammar,
} from "../grammars";
import { Dict, Env } from "../util";
import { 
    CollectionExpr, EPSILON, EpsilonExpr, 
    NULL, constructAlternation, constructCollection, 
    constructCorrespond, constructCount, constructCursor, 
    constructDot, constructDotStar, constructEmbed, 
    constructIntersection, constructJoin, constructLiteral, 
    constructMatch, constructNegation, constructPreTape, 
    constructPrecede, constructRename, constructRepeat, 
    constructSequence, constructShort 
} from "../exprs";
import { REPLACE_INPUT_TAPE } from "../utils/constants";

export function constructExpr(
    env: PassEnv,
    g: Grammar
): Expr {
    switch (g.tag) {

        // test and testnot play no role in the Expr tree
        case "test":
        case "testnot":
        case "locator":    return constructExpr(env, g.child);

        // grammars with no children are pretty trivial, do them
        // in one line
        case "epsilon":    return EPSILON;
        case "null":       return NULL;
        case "lit":        return constructLiteral(env, g.tapeName, g.text, g.tokens);
        case "dot":        return constructDot(g.tapeName);
        case "embed":      return constructEmbed(env, g.name, undefined);
    
        // everything else has children
        case "seq":        return constructExprSeq(env, g);
        case "alt":        return constructExprAlt(env, g);
        case "short":      return constructExprShort(env, g);
        case "intersect":  return constructExprIntersect(env, g);
        case "join":       return constructExprJoin(env, g);
        case "count":      return constructExprCount(env, g);
        case "rename":     return constructExprRename(env, g);
        case "repeat":     return constructExprRepeat(env, g);
        case "not":        return constructExprNot(env, g);
        case "cursor":     return constructExprCursor(env, g);
        case "pretape":    return constructExprPreTape(env, g);
        case "hide":       return constructExprHide(env, g);
        case "match":      return constructExprMatch(env, g);
        case "collection": return constructExprCollection(env, g);
        case "correspond": return constructExprCorrespond(env, g);
        case "replace":    return constructExprReplace(env, g);
        
        default: throw new Error(`unhandled grammar in constructExpr: ${g.tag}`)
    }
}

function constructExprSeq(
    env: PassEnv,
    g: SequenceGrammar
): Expr {
    const childExprs = g.children.map(c => constructExpr(env, c));
    return constructSequence(env, ...childExprs);
}

function constructExprAlt(
    env: PassEnv,
    g: AlternationGrammar
): Expr {
    const childExprs = g.children.map(c => constructExpr(env, c));
    return constructAlternation(env, ...childExprs);
}

function constructExprShort(
    env: PassEnv,
    g: ShortGrammar
): Expr {
    const child = constructExpr(env, g.child);
    return constructShort(env, child);
}

function constructExprIntersect(
    env: PassEnv,
    g: IntersectionGrammar
): Expr {
    const left = constructExpr(env, g.child1);
    const right = constructExpr(env, g.child2);
    return constructIntersection(env, left, right);
}

function constructExprJoin(
    env: PassEnv,
    g: JoinGrammar
): Expr {
    return constructJoin(env, constructExpr(env, g.child1),
        constructExpr(env, g.child2),
        new Set(g.child1.tapes),
        new Set(g.child2.tapes));
}


function constructExprCount(
    env: PassEnv,
    g: CountGrammar
): Expr {
    let childExpr = constructExpr(env, g.child);
    return constructCount(env, childExpr, g.tapeName, g.maxChars,
        g.countEpsilon, g.errorOnCountExceeded);
}

function constructExprRename(
    env: PassEnv,
    g: RenameGrammar
): Expr {
    const childExpr = constructExpr(env, g.child);
    return constructRename(env, childExpr, g.fromTape, g.toTape);
}

function constructExprRepeat(
    env: PassEnv,
    g: RepeatGrammar
): Expr {
    const childExpr = constructExpr(env, g.child);
    return constructRepeat(env, childExpr, g.minReps, g.maxReps);
}

function constructExprNot(
    env: PassEnv,
    g: NegationGrammar
): Expr {
    const childExpr = constructExpr(env, g.child);
    return constructNegation(env, childExpr, new Set(g.child.tapes));
}

function constructExprCursor(
    env: PassEnv,
    g: CursorGrammar
): Expr {
    const childExpr = constructExpr(env, g.child);
    return constructCursor(env, g.tape, childExpr);
}

function constructExprPreTape(
    env: PassEnv,
    g: PreTapeGrammar
): Expr {
    const childExpr = constructExpr(env, g.child);
    return constructPreTape(env, g.fromTape, g.toTape, childExpr);
}

function constructExprHide(
    env: PassEnv,
    g: HideGrammar
): Expr {
    const childExpr = constructExpr(env, g.child);
    return constructRename(env, childExpr, g.tapeName, g.toTape);
}

function constructExprMatch(
    env: PassEnv,
    g: MatchGrammar
): Expr {
    const childExpr = constructExpr(env, g.child);
    return constructMatch(env, childExpr, g.fromTape, g.toTape);
}

function constructExprCollection(
    env: PassEnv,
    g: CollectionGrammar
): Expr {
    let newSymbols: Dict<Expr> = {};
    let selectedExpr: Expr = EPSILON;
    let selectedFound = false;
    //const newSymbolNS = symbols.push(newSymbols);
    for (const [name, referent] of Object.entries(g.symbols)) {
        let expr = constructExpr(env, referent);
        newSymbols[name] = expr;
        if (name.toLowerCase() == g.selectedSymbol.toLowerCase()) {
            selectedExpr = expr;
            selectedFound = true;
        }
    }
    if (selectedFound) {
        return constructCollection(env, selectedExpr, newSymbols);
    }
    return new CollectionExpr(selectedExpr, newSymbols);
}


function constructExprCorrespond(
    env: PassEnv,
    g: CorrespondGrammar
): Expr {
    const childExpr = constructExpr(env, g.child);
    return constructCorrespond(env, childExpr, g.tape1, g.tape2);
}

function constructExprReplace(
    env: PassEnv,
    g: ReplaceGrammar
): Expr {
    if (g.beginsWith || g.endsWith) {
        g.maxReps = Math.max(1, g.maxReps);
        g.minReps = Math.min(g.minReps, g.maxReps);
    }

    const fromExpr: Expr = constructExpr(env, g.fromGrammar);
    const toExpr: Expr = constructExpr(env, g.toGrammar);
    const preContextExpr: Expr = constructExpr(env, g.preContext);
    const postContextExpr: Expr = constructExpr(env, g.postContext);
    let states: Expr[] = [
        constructMatch(env, preContextExpr),
        constructCorrespond(env, constructPrecede(env, fromExpr, toExpr)),
        constructMatch(env, postContextExpr)
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
            return constructMatch(env, constructDotStar(REPLACE_INPUT_TAPE));
        }
        const fromInstance: Expr[] = [preContextExpr, fromExpr, postContextExpr];

        let notExpr: Expr = constructNotContains(env, REPLACE_INPUT_TAPE, fromInstance,
            that.beginsWith && replaceNone, that.endsWith && replaceNone);
        return constructMatch(env, notExpr);
    }
    
    if (!g.endsWith)
        states.push(matchAnythingElse());

    const replaceOne: Expr = constructSequence(env, ...states);
    const replaceMultiple: Expr = constructRepeat(env, replaceOne, Math.max(1, g.minReps), g.maxReps);
    
    // we need to match the context on other tapes too
    const otherContextExpr: Expr = constructExpr(env, g.otherContext);
    if (g.beginsWith)
        states = [replaceOne, otherContextExpr]
    else if (g.endsWith)
        states = [matchAnythingElse(), replaceOne, otherContextExpr];
    else
        states = [matchAnythingElse(), replaceMultiple, otherContextExpr];
    let replaceExpr: Expr = constructSequence(env, ...states);
            
    if (g.minReps > 0) {
        return replaceExpr;
    } else {
        let copyExpr: Expr = matchAnythingElse(true);
        if (! (otherContextExpr instanceof EpsilonExpr)) {
            let negatedOtherContext: Expr = 
                constructNegation(env, otherContextExpr, new Set(g.otherContext.tapes));
            const matchDotStar: Expr =
                constructMatch(env, constructDotStar(REPLACE_INPUT_TAPE));
            copyExpr = constructAlternation(env, constructSequence(env, matchAnythingElse(true), otherContextExpr),
                                            constructSequence(env, matchDotStar, negatedOtherContext));
        }
        return constructAlternation(env, copyExpr, replaceExpr);
    }
}

export function constructNotContains(
    env: Env,
    fromTapeName: string,
    children: Expr[], 
    begin: boolean = false,
    end: boolean = false,
): Expr {
    const dotStar: Expr = constructDotStar(fromTapeName);
    let seq: Expr;
    if (begin && end) {
        seq = constructShort(env, constructSequence(env, ...children));
    } else if (begin) {
        seq = constructSequence(env, constructShort(env, constructSequence(env, ...children)), dotStar);
    } else if (end) {
        seq = constructSequence(env, dotStar, constructShort(env, constructSequence(env, ...children)));
    } else {
        seq = env.opt.directionLTR ?
              constructSequence(env, constructShort(env, constructSequence(env, dotStar, ...children)), dotStar) :
              constructSequence(env, dotStar, constructShort(env, constructSequence(env, ...children, dotStar)));
    }
    return constructNegation(env, seq, new Set([fromTapeName]));
}