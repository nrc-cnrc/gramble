import {
    AlternationGrammar,
    SelectionGrammar, CorrespondGrammar, 
    CountGrammar, GreedyCursorGrammar, 
    Grammar, HideGrammar,
    JoinGrammar, MatchGrammar,
    NegationGrammar, PreTapeGrammar, 
    RenameGrammar, RepeatGrammar,
    ReplaceGrammar, SequenceGrammar, 
    ShortGrammar,
    CursorGrammar,
    JITGrammar,
} from "../grammars.js";
import { Dict } from "../utils/func.js";
import { 
    SelectionExpr, EPSILON,
    Expr, 
    NULL, constructAlternation, constructSelection, 
    constructCorrespond, constructCount, constructCursor, 
    constructDot, constructDotStar, constructEmbed, 
    constructJoin, constructLiteral, 
    constructMatch, constructNegation, constructPreTape, 
    constructRename, constructRepeat, 
    constructSeq, constructShort, constructReplace,
    constructGreedyCursor,
    constructJIT
} from "../exprs.js";
import { INPUT_TAPE } from "../utils/constants.js";
import { Env, Options } from "../utils/options.js";
import { PassEnv } from "../components.js";

export class ConstructExprEnv extends PassEnv {

    constructor(
        opt: Options,
        public symbols: Dict<Expr> | undefined
    ) {
        super(opt);
    }
}

export function constructExpr(
    env: ConstructExprEnv,
    g: Grammar,
): Expr {
    switch (g.tag) {

        // testblocks (and their test children) play no role 
        // in the Expr tree
        case "testblock":       return constructExpr(env, g.child);

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
        case "selection":       return constructExprSelection(env, g);
        case "correspond":      return constructExprCorrespond(env, g);
        case "jit":             return constructExprJIT(env, g);
        
        default: throw new Error(`unhandled grammar in constructExpr: ${g.tag}`)
    }
}

function constructExprSeq(
    env: ConstructExprEnv,
    g: SequenceGrammar
): Expr {
    const childExprs = g.children.map(c => constructExpr(env, c));
    return constructSeq(env, ...childExprs);
}

function constructExprAlt(
    env: ConstructExprEnv,
    g: AlternationGrammar
): Expr {
    const childExprs = g.children.map(c => constructExpr(env, c));
    return constructAlternation(env, ...childExprs);
}

function constructExprShort(
    env: ConstructExprEnv,
    g: ShortGrammar
): Expr {
    const child = constructExpr(env, g.child);
    return constructShort(env, child);
}

function constructExprJoin(
    env: ConstructExprEnv,
    g: JoinGrammar
): Expr {
    return constructJoin(env, constructExpr(env, g.child1),
        constructExpr(env, g.child2),
        new Set(g.child1.tapeNames),
        new Set(g.child2.tapeNames));
}

function constructExprReplace(
    env: ConstructExprEnv,
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
    env: ConstructExprEnv,
    g: CountGrammar
): Expr {
    let childExpr = constructExpr(env, g.child);
    return constructCount(env, childExpr, g.tapeName, g.maxChars,
        g.countEpsilon, g.errorOnCountExceeded);
}

function constructExprRename(
    env: ConstructExprEnv,
    g: RenameGrammar
): Expr {
    const childExpr = constructExpr(env, g.child);
    return constructRename(env, childExpr, g.fromTape, g.toTape);
}

function constructExprRepeat(
    env: ConstructExprEnv,
    g: RepeatGrammar
): Expr {
    const childExpr = constructExpr(env, g.child);
    return constructRepeat(env, childExpr, g.minReps, g.maxReps);
}

function constructExprNot(
    env: ConstructExprEnv,
    g: NegationGrammar
): Expr {
    const childExpr = constructExpr(env, g.child);
    return constructNegation(env, childExpr, new Set(g.child.tapeNames));
}

function constructExprCursor(
    env: ConstructExprEnv,
    g: CursorGrammar
): Expr {
    const childExpr = constructExpr(env, g.child);
    return constructCursor(env, g.tapeName, childExpr, g.vocab, g.atomic);
}

function constructExprGreedyCursor(
    env: ConstructExprEnv,
    g: GreedyCursorGrammar
): Expr {
    const childExpr = constructExpr(env, g.child);
    return constructGreedyCursor(env, g.tapeName, childExpr, g.vocab, g.atomic);
}

function constructExprPreTape(
    env: ConstructExprEnv,
    g: PreTapeGrammar
): Expr {
    const childExpr = constructExpr(env, g.child);
    return constructPreTape(env, g.inputTape, g.outputTape, childExpr);
}

function constructExprHide(
    env: ConstructExprEnv,
    g: HideGrammar
): Expr {
    const childExpr = constructExpr(env, g.child);
    return constructRename(env, childExpr, g.tapeName, g.toTape);
}

function constructExprMatch(
    env: ConstructExprEnv,
    g: MatchGrammar
): Expr {
    const childExpr = constructExpr(env, g.child);
    return constructMatch(env, childExpr, g.inputTape, g.outputTape);
}

function constructExprSelection(
    env: ConstructExprEnv,
    g: SelectionGrammar
): Expr {

    let exprSymbols: Dict<Expr> = {};
    let selectedExpr: Expr = EPSILON;

    for (const [name, referent] of Object.entries(g.symbols)) {
        
        if (env.symbols !== undefined && env.symbols[name] !== undefined) {
            exprSymbols[name] = env.symbols[name];
        } else {
            exprSymbols[name] = constructExpr(env, referent);
        }
        if (name.toLowerCase() == g.selection.toLowerCase()) {
            selectedExpr = exprSymbols[name];
        }
    }

    return constructSelection(env, selectedExpr, exprSymbols);
}


function constructExprCorrespond(
    env: ConstructExprEnv,
    g: CorrespondGrammar
): Expr {
    const childExpr = constructExpr(env, g.child);
    return constructCorrespond(env, childExpr, g.inputTape, g.outputTape);
}

function constructExprJIT(
    env: ConstructExprEnv,
    g: JITGrammar
): Expr {
    const childExpr = constructExpr(env, g.child);
    return constructJIT(env, childExpr, g.tapeName, 
        g.symbolName, g.vocab, g.atomic);
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
