import {
    AlternationGrammar,
    CollectionGrammar, CorrespondGrammar, 
    CountGrammar, GreedyCursorGrammar, 
    Grammar, HideGrammar,
    JoinGrammar, MatchGrammar,
    NegationGrammar, PreTapeGrammar, 
    PriorityUnionGrammar, 
    RenameGrammar, RepeatGrammar,
    ReplaceGrammar, SequenceGrammar, 
    ShortGrammar,
    CursorGrammar,
} from "../grammars";
import { Dict } from "../utils/func";
import { 
    CollectionExpr, EPSILON,
    Expr, 
    NULL, constructAlternation, constructCollection, 
    constructCorrespond, constructCount, constructCursor, 
    constructDot, constructDotStar, constructEmbed, 
    constructJoin, constructLiteral, 
    constructMatch, constructNegation, constructPreTape, 
    constructPrecede, constructRename, constructRepeat, 
    constructSeq, constructShort, constructPriorityUnion, constructReplace,
    constructGreedyCursor
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
        case "testnot":         return constructExpr(env, g.child);

        // grammars with no children are pretty trivial, do them
        // in one line
        case "epsilon":         return EPSILON;
        case "null":            return NULL;
        case "lit":             return constructLiteral(env, g.tapeName, g.text, g.tokens);
        case "dot":             return constructDot(g.tapeName);
        case "embed":           return constructEmbed(env, g.symbol, undefined);
    
        // everything else has children
        case "seq":             return constructExprSeq(env, g);
        case "alt":             return constructExprAlt(env, g);
        case "short":           return constructExprShort(env, g);
        case "join":            return constructExprJoin(env, g);
        case "priority":        return constructExprPriUni(env, g);
        case "replace":         return constructExprReplace(env, g);
        case "count":           return constructExprCount(env, g);
        case "rename":          return constructExprRename(env, g);
        case "repeat":          return constructExprRepeat(env, g);
        case "not":             return constructExprNot(env, g);
        case "cursor":          return constructExprCursor(env, g);
        case "greedyCursor":    return constructExprGreedyCursor(env, g);
        case "pretape":         return constructExprPreTape(env, g);
        case "hide":            return constructExprHide(env, g);
        case "match":           return constructExprMatch(env, g);
        case "collection":      return constructExprCollection(env, g);
        case "correspond":      return constructExprCorrespond(env, g);
        
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

function constructExprReplace(
    env: PassEnv,
    g: ReplaceGrammar
): Expr {
    return constructReplace(env, constructExpr(env, g.inputChild),
                                 constructExpr(env, g.outputChild),
                                 constructExpr(env, g.preChild),
                                 constructExpr(env, g.postChild),
                                 g.beginsWith,
                                 g.endsWith,
                                 g.optional);
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

function constructExprGreedyCursor(
    env: PassEnv,
    g: GreedyCursorGrammar
): Expr {
    const childExpr = constructExpr(env, g.child);
    if (g.vocab.tag !== Vocab.Tag.Lit) {
        throw new Error(`Constructing greedy cursor ${g.tapeName} with unresolved vocab: ${Vocab.toStr(g.vocab)}`);
    }
    const atomic = g.vocab.atomicity === Vocab.Atomicity.Atomic || 
                    g.vocab.atomicity === Vocab.Atomicity.Concatenated;
    return constructGreedyCursor(env, g.tapeName, childExpr, g.vocab.tokens, atomic);
}

function constructExprPreTape(
    env: PassEnv,
    g: PreTapeGrammar
): Expr {
    const childExpr = constructExpr(env, g.child);
    return constructPreTape(env, g.inputTape, g.outputTape, childExpr);
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
    return constructMatch(env, childExpr, g.inputTape, g.outputTape);
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