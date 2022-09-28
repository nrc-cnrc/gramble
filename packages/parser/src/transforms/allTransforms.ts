import { CreateNamespaces } from "./createNamespaces";
import { WaywardAssigmentCheck } from "./waywardAssignment";
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
import { CheckNamedParams } from "./namedParamCheck";
import { RescopeLeftBinders } from "./rescopeLeftBinders";
import { CreateOps } from "./createOps";
import { CreateTST } from "./createTST";

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
    new CreateTST().compose(
    new CreateNamespaces().compose(
    new CreateOps().compose(
    new WaywardAssigmentCheck().compose(
    new CheckNamedParams().compose(
    new RescopeLeftBinders())))))

export const ALL_GRAMMAR_TRANSFORMS =
    wrap(NameQualifierTransform).compose(
    wrap(FlattenTransform).compose(
    wrap(RenameFixTransform).compose(
    wrap(RuleReplaceTransform2).compose(
    wrap(SameTapeReplaceTransform).compose(
    wrap(FilterTransform))))))



