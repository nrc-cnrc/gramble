import { 
    AlternationGrammar, CollectionGrammar, 
    ContainsGrammar, CorrespondGrammar, 
    CountGrammar, CursorGrammar, 
    DotGrammar, EmbedGrammar, 
    EndsGrammar, EpsilonGrammar, 
    FilterGrammar, Grammar, 
    HideGrammar, 
    JoinGrammar, LiteralGrammar, 
    MatchGrammar, NegationGrammar, 
    NullGrammar, PreTapeGrammar, 
    PriorityUnionGrammar, 
    RenameGrammar, RepeatGrammar, 
    ReplaceBlockGrammar, ReplaceGrammar, 
    RewriteGrammar, 
    SequenceGrammar, ShortGrammar, 
    SingleTapeGrammar, 
    StartsGrammar 
} from "./grammars";
import { Dict, StringDict, foldRight } from "./utils/func";
import { INPUT_TAPE, OUTPUT_TAPE, DEFAULT_TAPE } from "./utils/constants";
import { toStr } from "./passes/toStr";
import { EPSILON } from "./exprs";

export function SingleTape(
    tapeName: string,
    child: Grammar | string
): Grammar {
    child = makeGrammar(child);
    return new SingleTapeGrammar(tapeName, child);
}

export function Rewrite(
    inputChild: Grammar|string, 
    outputChild: Grammar|string,
    preChild: Grammar|string = Epsilon(),
    postChild: Grammar|string = Epsilon(),
    beginsWith: boolean = false,
    endsWith: boolean = false,
    name: string = "",
): RewriteGrammar {
    inputChild = SingleTape(INPUT_TAPE, inputChild);
    outputChild = SingleTape(OUTPUT_TAPE, outputChild);
    preChild = SingleTape(INPUT_TAPE, preChild);
    postChild = SingleTape(INPUT_TAPE, postChild);
    return new RewriteGrammar(inputChild, outputChild, preChild, postChild, beginsWith, endsWith, false, name);
}

export function OptionalRewrite(
    inputChild: Grammar|string, 
    outputChild: Grammar|string,
    preChild: Grammar|string = Epsilon(),
    postChild: Grammar|string = Epsilon(),
    beginsWith: boolean = false,
    endsWith: boolean = false,
    name: string = "",
): RewriteGrammar {
    inputChild = SingleTape(INPUT_TAPE, inputChild);
    outputChild = SingleTape(OUTPUT_TAPE, outputChild);
    preChild = SingleTape(INPUT_TAPE, preChild);
    postChild = SingleTape(INPUT_TAPE, postChild);
    return new RewriteGrammar(inputChild, outputChild, preChild, postChild, beginsWith, endsWith, true, name);
}


/**
  * Replace implements general phonological replacement rules.
  * 
  * NOTE: The defaults for this convenience function differ from those 
  * in the constructor of ReplaceGrammar.  These are the defaults appropriate
  * for testing, whereas the defaults in ReplaceGrammar are appropriate for
  * the purposes of converting tabular syntax into grammars.
  * 
  * inputGrammar: input (target) Grammar (on inputTape)
  * toGrammar: output (change) Grammar (on one or more outputTapes)
  * preContext: context to match before the target inputGrammar (on inputTape)
  * postContext: context to match after the target inputGrammar (on inputTape)
  * otherContext: context to match on other tapes (other than inputTape & outputTapes)
  * beginsWith: set to True to match at the start of inputTape
  * endsWith: set to True to match at the end of inputTape
  * minReps: minimum number of times the replace rule is applied; normally 0
  * maxReps: maximum number of times the replace rule is applied
*/
export function Replace(
    inputGrammar: Grammar | string, 
    outputGrammar: Grammar | string,
    preContext: Grammar | string = Epsilon(),
    postContext: Grammar | string = Epsilon(),
    otherContext: Grammar | string = Epsilon(),
    beginsWith: boolean = false, 
    endsWith: boolean = false,
    minReps: number = 0, 
    maxReps: number = Infinity,
    hiddenTapeName: string = "",
    optional: boolean = false
): ReplaceGrammar {
    if (typeof preContext === 'string' && preContext.startsWith("#"))
        beginsWith = true;
    if (typeof postContext === 'string' && postContext.endsWith("#"))
        endsWith = true;
    inputGrammar = SingleTape(INPUT_TAPE, inputGrammar);
    outputGrammar = SingleTape(OUTPUT_TAPE, outputGrammar);
    preContext = SingleTape(INPUT_TAPE, preContext);
    postContext = SingleTape(INPUT_TAPE, postContext);
    otherContext = makeGrammar(otherContext);
    return new ReplaceGrammar(inputGrammar, outputGrammar, 
        preContext, postContext, otherContext, beginsWith, endsWith, 
        minReps, maxReps, hiddenTapeName, optional);
}

export function OptionalReplace(
    inputGrammar: Grammar | string, 
    outputGrammar: Grammar | string,
    preContext: Grammar | string = Epsilon(), 
    postContext: Grammar | string = Epsilon(),
    otherContext: Grammar | string = Epsilon(),
    beginsWith: boolean = false, 
    endsWith: boolean = false,
    minReps: number = 0, 
    maxReps: number = Infinity,
    hiddenTapeName: string = ""
): ReplaceGrammar {
    return Replace(inputGrammar, outputGrammar, 
        preContext, postContext, otherContext, beginsWith, endsWith, 
        minReps, maxReps, hiddenTapeName, true);
}

export function ReplaceBlock(
    inputTape: string,
    child: Grammar | string,
    ...rules: RewriteGrammar[]
): ReplaceBlockGrammar {
    child = makeGrammar(child, inputTape);
    if (rules instanceof RewriteGrammar) rules = [rules];
    return new ReplaceBlockGrammar(inputTape, child, rules);
}

export function Correspond(
    child: Grammar | string,
    tape1: string = INPUT_TAPE,
    tape2: string = OUTPUT_TAPE,
): CorrespondGrammar {
    child = makeGrammar(child, INPUT_TAPE);
    return new CorrespondGrammar(child, tape1, tape2);
}

export function Query(
    query: StringDict[] | StringDict = {},
): Grammar {
    if (! Array.isArray(query)) {
        query = [query];
    }
    let queries: SequenceGrammar[] = [];
    for (let q of query) {
        const queryLiterals = Object.entries(q).map(([key, value]) => {
            key = key.normalize("NFD"); 
            value = value.normalize("NFD");
            return new LiteralGrammar(key, value);
        });
        const seq = new SequenceGrammar(queryLiterals)
        queries.push(seq);
    }
    if (queries.length == 1) {
        return queries[0];
    }
    return new AlternationGrammar(queries);
}

export function PreTape(
    inputTape: string, 
    outputTape: string, 
    child: Grammar | string
): Grammar {
    child = makeGrammar(child);
    return new PreTapeGrammar(inputTape, outputTape, child);
}

export function Epsilon(): EpsilonGrammar {
    return new EpsilonGrammar();
}

export function Seq(...children: (Grammar|string)[]): SequenceGrammar {
    children = children.map(c => makeGrammar(c));
    return new SequenceGrammar(children as Grammar[]);
}

export function Uni(...children: (Grammar|string)[]): AlternationGrammar {
    children = children.map(c => makeGrammar(c));
    return new AlternationGrammar(children as Grammar[]);
}

export function PriUni(...children: (Grammar|string)[]): Grammar {
    const childGrammars = children.map(c => makeGrammar(c));
    return foldRight(childGrammars, 
                    (c1, c2) => new PriorityUnionGrammar(c1, c2), 
                    new NullGrammar());
}


export function Optional(
    child: Grammar | string
): AlternationGrammar {
    child = makeGrammar(child);
    return Uni(child, Epsilon());
}

export function CharSet(tape: string, chars: string[]): Grammar {
    return new AlternationGrammar(chars.map(c => Lit(tape, c)));
}

export function Lit(tape: string, text: string): LiteralGrammar {
    return new LiteralGrammar(tape, text);
}

export function Join(
    child1: Grammar | string, 
    child2: Grammar | string
): JoinGrammar {
    child1 = makeGrammar(child1);
    child2 = makeGrammar(child2);
    return new JoinGrammar(child1, child2);
}

export function Short(
    child: Grammar | string
): ShortGrammar {
    child = makeGrammar(child);
    return new ShortGrammar(child);
}

export function Starts(
    child1: Grammar | string, 
    child2: Grammar | string
): FilterGrammar {
    child1 = makeGrammar(child1);
    child2 = makeGrammar(child2);
    const filter = new StartsGrammar(child2);
    return new FilterGrammar(child1, filter);
}

export function Ends(
    child1: Grammar | string, 
    child2: Grammar | string
): FilterGrammar {
    child1 = makeGrammar(child1);
    child2 = makeGrammar(child2);
    const filter = new EndsGrammar(child2);
    return new FilterGrammar(child1, filter);
}

export function Contains(
    child1: Grammar | string, 
    child2: Grammar | string
): FilterGrammar {
    child1 = makeGrammar(child1);
    child2 = makeGrammar(child2);
    const filter = new ContainsGrammar(child2);
    return new FilterGrammar(child1, filter);
}

export function Rep(
    child: Grammar | string, 
    minReps: number = 0, 
    maxReps: number = Infinity
) {
    child = makeGrammar(child);
    return new RepeatGrammar(child, minReps, maxReps);
}

export function Null(): NullGrammar {
    return new NullGrammar();
}

export function Embed(symbol: string): EmbedGrammar {
    return new EmbedGrammar(symbol);
}

export function Dot(...tapes: string[]): Grammar {
    if (tapes.length == 1) return new DotGrammar(tapes[0]);
    return Seq(...tapes.map(t => new DotGrammar(t)));
}

export function Match(
    child: Grammar | string, 
    inputTape: string, 
    ...outputTapes: string[]
): Grammar {
    child = makeGrammar(child);
    let result = child;
    for (const tape of outputTapes) {
        result = new MatchGrammar(result, inputTape, tape);
    }
    return result;
}

export function Rename(
    child: Grammar | string, 
    fromTape: string, 
    toTape: string
): RenameGrammar {
    child = makeGrammar(child);
    return new RenameGrammar(child, fromTape, toTape);
}

export function Not(child: Grammar | string): NegationGrammar {
    child = makeGrammar(child);
    return new NegationGrammar(child);
}

export function Collection(
    symbols: Dict<Grammar> = {}
): CollectionGrammar {
    return new CollectionGrammar(symbols);
}

export function Hide(
    child: Grammar | string, 
    tape: string, 
    toTape: string = ""
): HideGrammar {
    child = makeGrammar(child);
    return new HideGrammar(child, tape, toTape);
}

export function WithVocab(vocabs: StringDict, child: Grammar | string) {
    child = makeGrammar(child);
    return Seq(VocabAux(vocabs), child);
}

function VocabAux(vocabs: StringDict): Grammar {
    let vocabGrammars: LiteralGrammar[] = [];
    for (const tape in vocabs as StringDict) {
        vocabGrammars.push(Lit(tape, vocabs[tape]));
    }
    return Rep(Seq(...vocabGrammars), 0, 0);
}

export function Count(
    maxChars: Dict<number>,
    child: Grammar | string,
    countEpsilon: boolean = false,
    errorOnCountExceeded: boolean = false
): Grammar {
    child = makeGrammar(child);
    let result = child;
    for (const [tapeName, max] of Object.entries(maxChars)) {
        result = new CountGrammar(result, tapeName, max,
                                  countEpsilon, errorOnCountExceeded);
    }
    return result;
}

export function Cursor(
    tape: string | string[], 
    child: Grammar | string
): Grammar {
    child = makeGrammar(child);
    let result = child;
    if (!Array.isArray(tape)) tape = [tape];
    for (let i = tape.length-1; i >= 0; i--) {
        result = new CursorGrammar(tape[i], result);   
    }
    return result;
}

function makeGrammar(
    g: Grammar | string, 
    tapeName: string = DEFAULT_TAPE
): Grammar {
    if (typeof(g) === 'string')
        return Lit(tapeName, g);
    return g;
}
