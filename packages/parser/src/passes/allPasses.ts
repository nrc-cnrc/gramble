import { CreateNamespaces } from "./createNamespaces";
import { PassEnv, Pass } from "../passes";
import { Grammar, GrammarPass, NsGrammar } from "../grammars";
import { Result } from "../msgs";
import { timeIt, VERBOSE_TIME } from "../util";
import { NameQualifierPass } from "./nameQualifier";
import { FlattenPass } from "./flatten";
import { RenameFixPass } from "./renameFix";
import { RuleReplacePass2 } from "./ruleReplace2";
import { SameTapeReplacePass } from "./sameTapeReplace";
import { FilterPass } from "./filter";
import { CheckNamedParams } from "./checkNamedParams";
import { RescopeLeftBinders } from "./rescopeLeftBinders";
import { CreateOps } from "./createOps";
import { ParseSheets } from "./parseSheets";
import { CheckStructuralParams } from "./checkStructuralParams";
import { CheckTestLiterals } from "./checkTestLiterals";
import { CreateHeaders } from "./createHeaders";
import { AssociateHeaders } from "./associateHeaders";
import { InsertTables } from "./insertTables";
import { CreateGrammars } from "./createGrammars";

type GrammarTransformConstructor = new (g: NsGrammar) => GrammarPass;
export class TransformWrapper extends Pass<Grammar, Grammar> {
    
    constructor(
        public childConstructor: GrammarTransformConstructor
    ) {
        super();
    }

    public get desc(): string {
        return "Wrapped function";
    }

    public transform(t: Grammar, env: PassEnv): Result<Grammar> {
        if (!(t instanceof NsGrammar)) {
            // GrammarTransforms assume they start with a namespace
            throw new Error("Calling a grammar transform on a non-namespace");
        }
        const childTransform = new this.childConstructor(t);
        return childTransform.transform(env);
    }

    public transformAndLog(t: Grammar, env: PassEnv): Result<Grammar> {
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

function wrap(t: GrammarTransformConstructor): Pass<Grammar,Grammar> {
    return new TransformWrapper(t);
}

export const PRE_GRAMMAR_PASSES = 

    // parse the sheet into an initial TST, mostly consisting of
    // placeholder TstOps and TstGrids without any particular 
    // semantics
    new ParseSheets().compose(

    // turn ops that represent namespaces into actual namespaces 
    // and rescope their children as necessary
    new CreateNamespaces().compose(
        
    // in syntactic positions when there's an implicit table semantics,
    // insert a TstTable as appropriate
    new InsertTables().compose(
        
    // make sure ops have the right structural parameters (.sibling,
    // .children) to be interpreted, and that these parameters are 
    // the right kinds of syntactic objects.
    new CheckStructuralParams().compose(

    // parse the first row of TstPreGrids into TstHeaders
    new CreateHeaders().compose(

    // make sure there aren't extraneous parameters that the ops
    // can't interpret
    new CheckNamedParams().compose(
        
    // make sure that all unit test content is literal (e.g. isn't
    // an embed, a regex, etc.)
    new CheckTestLiterals().compose(

    // associate content cells below headers into TstHeadedCells
    new AssociateHeaders().compose(

    // transform the remaining placeholder ops into their 
    // appropriate syntactic structures
    new CreateOps().compose(

    // restructure content cells that scope only over the cell to
    // their left (e.g. equals, rename)
    new RescopeLeftBinders().compose(

    // create grammar objects
    new CreateGrammars()))))))))))

    
// qualify symbol names (e.g. turn `VERB` in sheet Sheet1 
// into `Sheet1.VERB`) and attempt to resolve references to them
// (e.g. figure out whether VERB refers to Sheet1.VERB or 
// something else)
export const NAME_QUALIFICATION = wrap(NameQualifierPass);

export const GRAMMAR_PASSES =

    NAME_QUALIFICATION.compose(

    // flatten nested sequences/alternations into flat ones
    wrap(FlattenPass).compose(

    // if the programmer has specified an invalid renaming/hiding
    // structure that would cause problems during evaluation, fix
    // it so it doesn't
    wrap(RenameFixPass).compose(

    // turn new-style replacement cascades into the appropriate
    // structures
    wrap(RuleReplacePass2).compose(

    // take old-style replacement rules and (when the from/to tapes
    // are the same) insert renaming so that there's no conflict
    wrap(SameTapeReplacePass).compose(

    // some filters (like `starts re text: ~k`) have counterintuitive
    // results, rescope them as necessary to try to have the 
    // semantics that the programmer anticipates 
    wrap(FilterPass))))))

export const ALL_PASSES = PRE_GRAMMAR_PASSES.compose(GRAMMAR_PASSES);



