import { Msgs, Result, resultDict, resultList } from "../msgs";
import { 
    AlternationGrammar, CharSetGrammar,
    DotGrammar, EmbedGrammar,
    EpsilonGrammar, EqualsGrammar, Grammar, GrammarPass,
    HideGrammar, IntersectionGrammar, JoinGrammar,
    JoinReplaceGrammar, LiteralGrammar, MatchGrammar,
    NsGrammar, NegationGrammar, NegativeUnitTestGrammar,
    NullGrammar, RenameGrammar, RepeatGrammar, ReplaceGrammar,
    SequenceGrammar, UnitTestGrammar,
    StartsGrammar, EndsGrammar, ContainsGrammar, CountGrammar, 
    CountTapeGrammar, CounterStack, JoinRuleGrammar, 
    MatchFromGrammar, PriorityGrammar, ShortGrammar, 
    ParallelGrammar, LocatorGrammar, GrammarResult
} from "../grammars";
import { PassEnv } from "../passes";


/**
 * This is a grammar pass that clones every node in the grammar tree.
 * 
 * It's important to note the role of the ns:NsGrammar argument to each of these. 
 * If this weren't present, we'd be cloning EmbedGrammars as-is... and they would
 * still refer to their old, untransformed namespaces, which contain symbols pointing
 * to the old, untransformed grammars.  So we have to pass a reference to the new 
 * namespace through the traversal, so that clones of the EmbedGrammars can refer to it, 
 * instead.  (Since every pass has to do this, I made it its own argument, rather
 * than pass it in through args.)
 */
export class IdentityPass implements GrammarPass {

    constructor(
        protected ns: NsGrammar
    ) { }

    public transform(env: PassEnv): Result<NsGrammar> {
        this.ns.calculateTapes(new CounterStack(2)); // just in case it hasn't been done
        return this.ns.accept(this, env) as Result<NsGrammar>;
    }

    public get desc(): string {
        return "Identity transformation";
    }

    public transformEpsilon(g: EpsilonGrammar, env: PassEnv): GrammarResult {
        return g.msg();
    }

    public transformNull(g: NullGrammar, env: PassEnv): GrammarResult {
        return g.msg();
    }

    public transformCharSet(g: CharSetGrammar, env: PassEnv): GrammarResult {
        return g.msg();
    }

    public transformLiteral(g: LiteralGrammar, env: PassEnv): GrammarResult {
        return g.msg();
    }

    public transformDot(g: DotGrammar, env: PassEnv): GrammarResult {
        return g.msg();
    }

    public transformSequence(g: SequenceGrammar, env: PassEnv): GrammarResult {
        return resultList(g.children).map(c => c.accept(this, env))
                    .bind(cs => new SequenceGrammar(cs));
    }

    public transformParallel(g: SequenceGrammar, env: PassEnv): GrammarResult {
        return resultList(g.children).map(c => c.accept(this, env))
                   .bind(cs => new ParallelGrammar(cs));
    }

    public transformAlternation(g: AlternationGrammar, env: PassEnv): GrammarResult {
        return resultList(g.children).map(c => c.accept(this, env))
                   .bind(cs => new AlternationGrammar(cs));
    }

    public transformIntersection(g: IntersectionGrammar, env: PassEnv): GrammarResult {
        return resultList([g.child1, g.child2])
                   .map(c => c.accept(this, env))
                   .bind(([c1, c2]) => new IntersectionGrammar(c1, c2));
    }

    public transformJoin(g: JoinGrammar, env: PassEnv): GrammarResult {
        return resultList([g.child1, g.child2])
                   .map(c => c.accept(this, env))
                   .bind(([c1, c2]) => new JoinGrammar(c1, c2));
    }

    public transformEquals(g: EqualsGrammar, env: PassEnv): GrammarResult {
        return resultList([g.child1, g.child2])
                   .map(c => c.accept(this, env))
                   .bind(([c1, c2]) => new EqualsGrammar(c1, c2));
    }

    public transformStarts(g: StartsGrammar, env: PassEnv): GrammarResult {
        return g.child.accept(this, env)
                      .bind(r => new StartsGrammar(r));
    }

    public transformEnds(g: EndsGrammar, env: PassEnv): GrammarResult {
        return g.child.accept(this, env)
                      .bind(r => new EndsGrammar(r));
    }

    public transformContains(g: ContainsGrammar, env: PassEnv): GrammarResult {
        return g.child.accept(this, env)
                      .bind(r => new ContainsGrammar(r));
    }

    public transformMatch(g: MatchGrammar, env: PassEnv): GrammarResult {
        return g.child.accept(this, env)
                      .bind(r => new MatchGrammar(r, g.relevantTapes));
    }
  
    public transformMatchFrom(g: MatchFromGrammar, env: PassEnv): GrammarResult {
        return g.child.accept(this, env)
                      .bind(r => new MatchFromGrammar(r, g.fromTape, g.toTape));
    }

    public transformReplace(g: ReplaceGrammar, env: PassEnv): GrammarResult {
        const children = [g.fromGrammar, g.toGrammar, g.preContext, g.postContext, g.otherContext];
        return resultList(children)
                   .map(c => c.accept(this, env))
                   .bind(([f, t, pre, post, o]) => new ReplaceGrammar(
                        f, t, pre, post, o,
                        g.beginsWith, g.endsWith, g.minReps, 
                        g.maxReps, g.maxExtraChars, g.maxCopyChars,
                        g.vocabBypass, g.hiddenTapeName));
    }

    public transformEmbed(g: EmbedGrammar, env: PassEnv): GrammarResult {
        return new EmbedGrammar(g.name, this.ns).msg();
    }

    public transformLocator(g: LocatorGrammar, env: PassEnv): GrammarResult {
        return g.child.accept(this, env)
                      .localize(g.cell.pos)
                      .bind(c => new LocatorGrammar(g.cell, c));
    }

    public transformNamespace(g: NsGrammar, env: PassEnv): GrammarResult {
        return resultDict(g.symbols)
                .map(c => c.accept(this, env))
                .bind(cs => new NsGrammar(cs));
    }

    public transformRepeat(g: RepeatGrammar, env: PassEnv): GrammarResult {
        return g.child.accept(this, env)
                      .bind(r => new RepeatGrammar(r, g.minReps, g.maxReps));
    }

    public transformUnitTest(g: UnitTestGrammar, env: PassEnv): GrammarResult {
        const [child, childMsgs] = g.child.accept(this, env).destructure();
        const [test, testMsgs] = g.test.accept(this, env).destructure();
        const [uniques, uniqueMsgs] = resultList(g.uniques)
                                        .map(c => c.accept(this, env))
                                        .destructure();
        return new UnitTestGrammar(child, test, uniques as LiteralGrammar[])
            .msg(childMsgs)
            .msg(testMsgs)
            .msg(uniqueMsgs);
    }

    public transformNegativeUnitTest(g: NegativeUnitTestGrammar, env: PassEnv): GrammarResult {
        return resultList([g.child, g.test])
                   .map(c => c.accept(this, env))
                   .bind(([c, t]) => new NegativeUnitTestGrammar(c, t));
    }

    public transformJoinReplace(g: JoinReplaceGrammar, env: PassEnv): GrammarResult {
        const [child, childMsgs] = g.child.accept(this, env).destructure();
        const [rules, ruleMsgs] = resultList(g.rules)
                                    .map(c => c.accept(this, env))
                                    .destructure();
        return new JoinReplaceGrammar(child, rules as ReplaceGrammar[])
                            .msg(childMsgs)
                            .msg(ruleMsgs);
    }

    public transformJoinRule(g: JoinRuleGrammar, env: PassEnv): GrammarResult {
        const [child, childMsgs] = g.child.accept(this, env).destructure();
        const [rules, ruleMsgs] = resultList(g.rules)
                                    .map(c => c.accept(this, env))
                                    .destructure();
        return new JoinRuleGrammar(g.inputTape, child, rules as ReplaceGrammar[])
                            .msg(childMsgs)
                            .msg(ruleMsgs);
    }

    public transformNegation(g: NegationGrammar, env: PassEnv): GrammarResult {
        return g.child.accept(this, env)
                      .bind(r => new NegationGrammar(r, g.maxReps));
    }

    public transformRename(g: RenameGrammar, env: PassEnv): GrammarResult {
        return g.child.accept(this, env)
                      .bind(r => new RenameGrammar(r, g.fromTape, g.toTape));
    }

    public transformHide(g: HideGrammar, env: PassEnv): GrammarResult {
        return g.child.accept(this, env)
                      .bind(r => new HideGrammar(r, g.tapeName, g.name));
    }

    public transformCount(g: CountGrammar, env: PassEnv): GrammarResult {
        return g.child.accept(this, env)
                      .bind(r => new CountGrammar(r, g.maxChars));
    }

    public transformCountTape(g: CountTapeGrammar, env: PassEnv): GrammarResult {
        return g.child.accept(this, env)
                      .bind(r => new CountTapeGrammar(r, g.maxChars));
    }

    public transformPriority(g: PriorityGrammar, env: PassEnv): GrammarResult {
        return g.child.accept(this, env)
                      .bind(r => new PriorityGrammar(r, g.tapePriority));
    }
    
    public transformShort(g: PriorityGrammar, env: PassEnv): GrammarResult {
        return g.child.accept(this, env)
                      .bind(r => new ShortGrammar(r));
    }

}
