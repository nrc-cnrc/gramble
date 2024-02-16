import {
    AlternationGrammar,
    CollectionGrammar, CorrespondGrammar, 
    CountGrammar, CursorGrammar, 
    Grammar, HideGrammar,
    JoinGrammar, MatchGrammar,
    NegationGrammar, PreTapeGrammar, 
    PriorityUnionGrammar, 
    RenameGrammar, RepeatGrammar,
    ReplaceGrammar, RewriteGrammar, SequenceGrammar, 
    ShortGrammar,
} from "../grammars";
import { Dict } from "../utils/func";
import { 
    CollectionExpr, EPSILON, EpsilonExpr, 
    Expr, 
    NULL, constructAlternation, constructCollection, 
    constructCorrespond, constructCount, constructCursor, 
    constructDot, constructDotStar, constructEmbed, 
    constructJoin, constructLiteral, 
    constructMatch, constructNegation, constructPreTape, 
    constructPrecede, constructRename, constructRepeat, 
    constructSeq, constructShort, constructPriorityUnion, constructRewrite
} from "../exprs";
import { INPUT_TAPE } from "../utils/constants";
import { Env } from "../utils/options";
import * as Tapes from "../tapes";
import * as Vocab from "../vocab";
import { PassEnv } from "../components";

export function constructExpr(
    env: PassEnv,
    g: Grammar
): Expr {
    switch (g.tag) {

        // test and testnot play no role in the Expr tree
        case "test":
        case "testnot":    return constructExpr(env, g.child);

        // grammars with no children are pretty trivial, do them
        // in one line
        case "epsilon":    return EPSILON;
        case "null":       return NULL;
        case "lit":        return constructLiteral(env, g.tapeName, g.text, g.tokens);
        case "dot":        return constructDot(g.tapeName);
        case "embed":      return constructEmbed(env, g.symbol, undefined);
    
        // everything else has children
        case "seq":        return constructExprSeq(env, g);
        case "alt":        return constructExprAlt(env, g);
        case "short":      return constructExprShort(env, g);
        case "join":       return constructExprJoin(env, g);
        case "priority":   return constructExprPriUni(env, g);
        case "rewrite":    return constructExprRewrite(env, g);
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
    return constructSeq(env, ...childExprs);
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

function constructExprJoin(
    env: PassEnv,
    g: JoinGrammar
): Expr {
    return constructJoin(env, constructExpr(env, g.child1),
        constructExpr(env, g.child2),
        new Set(g.child1.tapeNames),
        new Set(g.child2.tapeNames));
}

function constructExprPriUni(
    env: PassEnv,
    g: PriorityUnionGrammar
): Expr {
    return constructPriorityUnion(env, constructExpr(env, g.child1),
                                        constructExpr(env, g.child2));
}

function constructExprRewrite(
    env: PassEnv,
    g: RewriteGrammar
): Expr {
    return constructRewrite(env, constructExpr(env, g.child1),
                                    constructExpr(env, g.child2));
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
    return constructNegation(env, childExpr, new Set(g.child.tapeNames));
}

function constructExprCursor(
    env: PassEnv,
    g: CursorGrammar
): Expr {
    const childExpr = constructExpr(env, g.child);
    if (g.vocab.tag !== Vocab.Tag.Lit) {
        throw new Error(`Constructing cursor ${g.tapeName} with unresolved vocab: ${Vocab.toStr(g.vocab)}`);
    }
    const atomic = g.vocab.atomicity === Vocab.Atomicity.Atomic || 
                    g.vocab.atomicity === Vocab.Atomicity.Concatenated;
    return constructCursor(env, g.tapeName, childExpr, g.vocab.tokens, atomic);
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
    return constructCorrespond(env, childExpr, g.inputTape, g.outputTape);
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
    
    const preMatch = constructMatch(env, preContextExpr);
    const postMatch = constructMatch(env, postContextExpr);
    const match = constructCorrespond(env, constructPrecede(env, fromExpr, toExpr));
    const pattern = constructSeq(env, preMatch, match, postMatch);
    
    const dotStar: Expr = constructDotStar(INPUT_TAPE);
    const anything = constructMatch(env, dotStar);
    const fromContent = constructSeq(env, preContextExpr, fromExpr, postContextExpr);
    
    if (g.beginsWith && g.endsWith) {
        let replaceExpr = constructSeq(env, pattern);
        let shortFrom = constructShort(env, fromContent);
        let copyExpr: Expr = g.minReps > 0 ? NULL : matchNot(env, shortFrom);
        return constructAlternation(env, copyExpr, replaceExpr);
    }
    
    if (g.beginsWith) {
        let replaceExpr = constructSeq(env, pattern, anything);
        let shortFrom = constructSeq(env, constructShort(env, fromContent), dotStar);
        let copyExpr: Expr = g.minReps > 0 ? NULL : matchNot(env, shortFrom);
        return constructAlternation(env, copyExpr, replaceExpr);
    }
    
    if (g.endsWith) {
        let replaceExpr = constructSeq(env, anything, pattern);
        let shortFrom = constructSeq(env, dotStar, constructShort(env, fromContent));
        let copyExpr: Expr = g.minReps > 0 ? NULL : matchNot(env, shortFrom);
        return constructAlternation(env, copyExpr, replaceExpr);
    }

    // neither beginsWith nor endsWith
    const anythingElse = g.optional ? anything 
                                    : matchNotContains(env, fromContent);
    const seq = constructSeq(env, pattern, anythingElse);
    const rep = constructRepeat(env, seq, g.minReps, g.maxReps);
    return constructSeq(env, anythingElse, rep);
}

export function matchNot(
    env: Env,
    child: Expr,
    tape: string = INPUT_TAPE
): Expr {
    const notExpr = constructNegation(env, child, new Set([tape]));
    return constructMatch(env, notExpr);
}

export function matchNotContains(
    env: Env,
    child: Expr,
): Expr {
    const dotStar: Expr = constructDotStar(INPUT_TAPE);
    const shortFrom = env.opt.directionLTR ?
              constructSeq(env, constructShort(env, constructSeq(env, dotStar, child)), dotStar) :
              constructSeq(env, dotStar, constructShort(env, constructSeq(env, child, dotStar)));
    return matchNot(env, shortFrom);
}