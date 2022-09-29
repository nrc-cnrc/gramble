import { CreateNamespaces } from "./createNamespaces";
import { TransEnv, Transform } from "../transforms";
import { Grammar, GrammarTransform, NsGrammar } from "../grammars";
import { Result } from "../msgs";
import { timeIt, VERBOSE_TIME } from "../util";
import { NameQualifierTransform } from "./nameQualifier";
import { FlattenTransform } from "./flatten";
import { RenameFixTransform } from "./renameFix";
import { RuleReplaceTransform2 } from "./ruleReplace2";
import { SameTapeReplaceTransform } from "./sameTapeReplace";
import { FilterTransform } from "./filter";
import { CheckNamedParams } from "./checkNamedParams";
import { RescopeLeftBinders } from "./rescopeLeftBinders";
import { CreateOps } from "./createOps";
import { CreateTST } from "./createTST";
import { CheckStructuralParams } from "./checkStructuralParams";
import { CheckTestLiterals } from "./checkTestLiterals";

type GrammarTransformConstructor = new (g: NsGrammar) => GrammarTransform;
export class TransformWrapper extends Transform<Grammar, Grammar> {
    
    constructor(
        public childConstructor: GrammarTransformConstructor
    ) {
        super();
    }

    public get desc(): string {
        return "Wrapped function";
    }

    public transform(t: Grammar, env: TransEnv): Result<Grammar> {
        if (!(t instanceof NsGrammar)) {
            // GrammarTransforms assume they start with a namespace
            throw new Error("Calling a grammar transform on a non-namespace");
        }
        const childTransform = new this.childConstructor(t);
        return childTransform.transform(env);
    }

    public transformAndLog(t: Grammar, env: TransEnv): Result<Grammar> {
        if (!(t instanceof NsGrammar)) {
            // GrammarTransforms assume they start with a namespace
            throw new Error("Calling a grammar transform on a non-namespace");
        }

        const childTransform = new this.childConstructor(t);
        
        const verbose = (env.verbose & VERBOSE_TIME) != 0;
        return timeIt(() => childTransform.transform(env), 
               verbose, childTransform.desc);
    }

}

function wrap(t: GrammarTransformConstructor): Transform<Grammar,Grammar> {
    return new TransformWrapper(t);
}

export const ALL_TST_TRANSFORMS = 

    // parse the sheet into an initial TST, mostly consisting of
    // placeholder TstOps and TstGrids without any particular 
    // semantics
    new CreateTST().compose(

    // turn ops that represent namespaces into actual namespaces 
    // and rescope their children as necessary
    new CreateNamespaces().compose(

    // make sure ops have the right structural parameters (.sibling,
    // .children) to be interpreted, and that these parameters are 
    // the right kinds of syntactic objects.
    new CheckStructuralParams().compose(

    // make sure there aren't extraneous parameters that the ops
    // can't interpret
    new CheckNamedParams().compose(

    // make sure that all unit test content is literal (e.g. isn't
    // an embed, a regex, etc.)
    new CheckTestLiterals().compose(

    // transform the remaining placeholder ops into their 
    // appropriate syntactic structures
    new CreateOps().compose(

    // restructure content cells that scope only over the cell to
    // their left (e.g. equals, rename)
    new RescopeLeftBinders()))))))

export const ALL_GRAMMAR_TRANSFORMS =

    // qualify symbol names (e.g. turn `VERB` in sheet Sheet1 
    // into `Sheet1.VERB`) and attempt to resolve references to them
    // (e.g. figure out whether VERB refers to Sheet1.VERB or 
    // something else)
    wrap(NameQualifierTransform).compose(

    // flatten nested sequences/alternations into flat ones
    wrap(FlattenTransform).compose(

    // if the programmer has specified an invalid renaming/hiding
    // structure that would cause problems during evaluation, fix
    // it so it doesn't
    wrap(RenameFixTransform).compose(

    // turn new-style replacement cascades into the appropriate
    // structures
    wrap(RuleReplaceTransform2).compose(

    // take old-style replacement rules and (when the from/to tapes
    // are the same) insert renaming so that there's no conflict
    wrap(SameTapeReplaceTransform).compose(

    // some filters (like `starts re text: ~k`) have counterintuitive
    // results, rescope them as necessary to try to have the 
    // semantics that the programmer anticipates 
    wrap(FilterTransform))))))



