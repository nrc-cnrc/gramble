import { Msgs, Result, ResultList, resultList } from "../msgs";
import { 
    AlternationGrammar, CharSetGrammar,
    DotGrammar, EmbedGrammar,
    EpsilonGrammar, EqualsGrammar, Grammar, GrammarTransform,
    HideGrammar, IntersectionGrammar, JoinGrammar,
    JoinReplaceGrammar, LiteralGrammar, MatchGrammar,
    NsGrammar, NegationGrammar, NegativeUnitTestGrammar,
    NullGrammar, RenameGrammar, RepeatGrammar, ReplaceGrammar,
    SequenceGrammar, UnitTestGrammar,
    StartsGrammar, 
    EndsGrammar, ContainsGrammar, CountGrammar, 
    CountTapeGrammar, CounterStack, JoinRuleGrammar, 
    MatchFromGrammar, PriorityGrammar, ShortGrammar, ParallelGrammar, LocatorGrammar, GrammarResult, Count
} from "../grammars";

/**
 * IdentityTransform
 * 
 * This is a grammar transform that clones every node in the grammar tree.
 * 
 * It's important to note the role of the ns:NsGrammar argument to each of these. 
 * If this weren't present, we'd be cloning EmbedGrammars as-is... and they would
 * still refer to their old, untransformed namespaces, which contain symbols pointing
 * to the old, untransformed grammars.  So we have to pass a reference to the new 
 * namespace through the traversal, so that clones of the EmbedGrammars can refer to it, 
 * instead.  (Since every transform has to do this, I made it its own argument, rather
 * than pass it in through args.)
 */
export class IdentityTransform implements GrammarTransform {

    constructor(
        protected ns: NsGrammar
    ) { }

    public transform(): Result<NsGrammar> {
        this.ns.calculateTapes(new CounterStack(2)); // just in case it hasn't been done
        return this.ns.accept(this) as Result<NsGrammar>;
    }

    public get desc(): string {
        return "Identity transformation";
    }

    public transformEpsilon(g: EpsilonGrammar): GrammarResult {
        return g.msg();
    }

    public transformNull(g: NullGrammar): GrammarResult {
        return g.msg();
    }

    public transformCharSet(g: CharSetGrammar): GrammarResult {
        return g.msg();
    }

    public transformLiteral(g: LiteralGrammar): GrammarResult {
        return g.msg();
    }

    public transformDot(g: DotGrammar): GrammarResult {
        return g.msg();
    }

    public transformSequence(g: SequenceGrammar): GrammarResult {
        return resultList(g.children).map(c => c.accept(this))
                    .bind(cs => new SequenceGrammar(cs));
    }

    public transformParallel(g: SequenceGrammar): GrammarResult {
        return resultList(g.children).map(c => c.accept(this))
                   .bind(cs => new ParallelGrammar(cs));
    }

    public transformAlternation(g: AlternationGrammar): GrammarResult {
        return resultList(g.children).map(c => c.accept(this))
                   .bind(cs => new AlternationGrammar(cs));
    }

    public transformIntersection(g: IntersectionGrammar): GrammarResult {
        return resultList([g.child1, g.child2])
                   .map(c => c.accept(this))
                   .bind(([c1, c2]) => new IntersectionGrammar(c1, c2));
    }

    public transformJoin(g: JoinGrammar): GrammarResult {
        return resultList([g.child1, g.child2])
                   .map(c => c.accept(this))
                   .bind(([c1, c2]) => new JoinGrammar(c1, c2));
    }

    public transformEquals(g: EqualsGrammar): GrammarResult {
        return resultList([g.child1, g.child2])
                   .map(c => c.accept(this))
                   .bind(([c1, c2]) => new EqualsGrammar(c1, c2));
    }

    public transformStarts(g: StartsGrammar): GrammarResult {
        return g.child.accept(this)
                      .bind(r => new StartsGrammar(r));
    }

    public transformEnds(g: EndsGrammar): GrammarResult {
        return g.child.accept(this)
                      .bind(r => new EndsGrammar(r));
    }

    public transformContains(g: ContainsGrammar): GrammarResult {
        return g.child.accept(this)
                      .bind(r => new ContainsGrammar(r));
    }

    public transformMatch(g: MatchGrammar): GrammarResult {
        return g.child.accept(this)
                      .bind(r => new MatchGrammar(r, g.relevantTapes));
    }
  
    public transformMatchFrom(g: MatchFromGrammar): GrammarResult {
        return g.child.accept(this)
                      .bind(r => new MatchFromGrammar(r, g.fromTape, g.toTape));
    }

    public transformReplace(g: ReplaceGrammar): GrammarResult {
        const children = [g.fromGrammar, g.toGrammar, g.preContext, g.postContext, g.otherContext];
        return resultList(children)
                   .map(c => c.accept(this))
                   .bind(([f, t, pre, post, o]) => new ReplaceGrammar(
                        f, t, pre, post, o,
                        g.beginsWith, g.endsWith, g.minReps, 
                        g.maxReps, g.maxExtraChars, g.maxCopyChars,
                        g.vocabBypass, g.hiddenTapeName));
    }

    public transformEmbed(g: EmbedGrammar): GrammarResult {
        return new EmbedGrammar(g.name, this.ns).msg();
    }

    public transformLocator(g: LocatorGrammar): GrammarResult {
        const [child, msgs] = g.child.accept(this).destructure();
        const newMsgs = msgs.map(e => e.localize(g.cell.pos));
        return new LocatorGrammar(g.cell, child).msg(newMsgs);
    }

    public transformNamespace(g: NsGrammar): GrammarResult {
        const result = new NsGrammar();
        const msgs: Msgs = [];
        for (const [k, v] of g.symbols) {
            const [newV, ms] = v.accept(this).destructure();
            result.addSymbol(k, newV);
            msgs.push(...ms);
        }
        return result.msg(msgs);
    }

    public transformRepeat(g: RepeatGrammar): GrammarResult {
        return g.child.accept(this)
                      .bind(r => new RepeatGrammar(r, g.minReps, g.maxReps));
    }

    public transformUnitTest(g: UnitTestGrammar): GrammarResult {
        const [child, childMsgs] = g.child.accept(this).destructure();
        const [test, testMsgs] = g.test.accept(this).destructure();
        const [uniques, uniqueMsgs] = resultList(g.uniques)
                                        .map(c => c.accept(this))
                                        .destructure();
        return new UnitTestGrammar(child, test, uniques as LiteralGrammar[])
            .msg(childMsgs)
            .msg(testMsgs)
            .msg(uniqueMsgs);
    }

    public transformNegativeUnitTest(g: NegativeUnitTestGrammar): GrammarResult {
        return resultList([g.child, g.test])
                   .map(c => c.accept(this))
                   .bind(([c, t]) => new NegativeUnitTestGrammar(c, t));
    }

    public transformJoinReplace(g: JoinReplaceGrammar): GrammarResult {
        const [child, childMsgs] = g.child.accept(this).destructure();
        const [rules, ruleMsgs] = resultList(g.rules)
                                    .map(c => c.accept(this))
                                    .destructure();
        return new JoinReplaceGrammar(child, rules as ReplaceGrammar[])
                            .msg(childMsgs)
                            .msg(ruleMsgs);
    }

    public transformJoinRule(g: JoinRuleGrammar): GrammarResult {
        const [child, childMsgs] = g.child.accept(this).destructure();
        const [rules, ruleMsgs] = resultList(g.rules)
                                    .map(c => c.accept(this))
                                    .destructure();
        return new JoinRuleGrammar(g.inputTape, child, rules as ReplaceGrammar[])
                            .msg(childMsgs)
                            .msg(ruleMsgs);
    }

    public transformNegation(g: NegationGrammar): GrammarResult {
        return g.child.accept(this)
                      .bind(r => new NegationGrammar(r, g.maxReps));
    }

    public transformRename(g: RenameGrammar): GrammarResult {
        return g.child.accept(this)
                      .bind(r => new RenameGrammar(r, g.fromTape, g.toTape));
    }

    public transformHide(g: HideGrammar): GrammarResult {
        return g.child.accept(this)
                      .bind(r => new HideGrammar(r, g.tapeName, g.name));
    }

    public transformCount(g: CountGrammar): GrammarResult {
        return g.child.accept(this)
                      .bind(r => new CountGrammar(r, g.maxChars));
    }

    public transformCountTape(g: CountTapeGrammar): GrammarResult {
        return g.child.accept(this)
                      .bind(r => new CountTapeGrammar(r, g.maxChars));
    }

    public transformPriority(g: PriorityGrammar): GrammarResult {
        return g.child.accept(this)
                      .bind(r => new PriorityGrammar(r, g.tapePriority));
    }
    
    public transformShort(g: PriorityGrammar): GrammarResult {
        return g.child.accept(this)
                      .bind(r => new ShortGrammar(r));
    }

}
