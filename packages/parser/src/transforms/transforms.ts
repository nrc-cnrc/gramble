import { unzip, flatten } from "../util";
import { Msgs } from "../msgs";
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
    MatchFromGrammar, PriorityGrammar, ShortGrammar, ParallelGrammar, LocatorGrammar
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

    public transform(): [NsGrammar, Msgs] {
        this.ns.calculateTapes(new CounterStack(2)); // just in case it hasn't been done
        return this.ns.accept(this) as [NsGrammar, Msgs];
    }
        
    public mapTo(gs: Grammar[]): [Grammar[], Msgs] {
        const [results, msgs] = unzip(gs.map(g => g.accept(this)));
        return [results, flatten(msgs)];
    }

    public get desc(): string {
        return "Identity transformation";
    }

    public transformEpsilon(g: EpsilonGrammar): [Grammar, Msgs] {
        return [g, []];
    }

    public transformNull(g: NullGrammar): [Grammar, Msgs] {
        return [g, []];
    }

    public transformCharSet(g: CharSetGrammar): [Grammar, Msgs] {
        return [g, []];
    }

    public transformLiteral(g: LiteralGrammar): [Grammar, Msgs] {
        return [g, []];
    }

    public transformDot(g: DotGrammar): [Grammar, Msgs] {
        return [g, []];
    }

    public transformSequence(g: SequenceGrammar): [Grammar, Msgs] {
        const [newChildren, msgs] = this.mapTo(g.children);
        const result = new SequenceGrammar(newChildren);
        return [result, msgs];
    }

    public transformParallel(g: SequenceGrammar): [Grammar, Msgs] {
        const [newChildren, msgs] = this.mapTo(g.children);
        const result = new ParallelGrammar(newChildren);
        return [result, msgs];
    }

    public transformAlternation(g: AlternationGrammar): [Grammar, Msgs] {
        const [newChildren, msgs] = this.mapTo(g.children);
        const result = new AlternationGrammar(newChildren);
        return [result, msgs];
    }

    public transformIntersection(g: IntersectionGrammar): [Grammar, Msgs] {
        const [newChild1, msgs1] = g.child1.accept(this);
        const [newChild2, msgs2] = g.child2.accept(this);
        const result = new IntersectionGrammar(newChild1, newChild2);
        return [result, [...msgs1, ...msgs2]]
    }

    public transformJoin(g: JoinGrammar): [Grammar, Msgs] {
        const [newChild1, msgs1] = g.child1.accept(this);
        const [newChild2, msgs2] = g.child2.accept(this);
        const result = new JoinGrammar(newChild1, newChild2);
        return [result, [...msgs1, ...msgs2]];
    }

    public transformEquals(g: EqualsGrammar): [Grammar, Msgs] {
        const [newChild1, msgs1] = g.child1.accept(this);
        const [newChild2, msgs2] = g.child2.accept(this);
        const result = new EqualsGrammar(newChild1, newChild2);
        return [result, [...msgs1, ...msgs2]]
    }

    public transformStarts(g: StartsGrammar): [Grammar, Msgs] {
        const [newChild, msgs] = g.child.accept(this);
        const result = new StartsGrammar(newChild);
        return [result, msgs];
    }

    public transformEnds(g: EndsGrammar): [Grammar, Msgs] {
        const [newChild, msgs] = g.child.accept(this);
        const result = new EndsGrammar(newChild);
        return [result, msgs];
    }

    public transformContains(g: ContainsGrammar): [Grammar, Msgs] {
        const [newChild, msgs] = g.child.accept(this);
        const result = new ContainsGrammar(newChild);
        return [result, msgs];
    }

    public transformMatch(g: MatchGrammar): [Grammar, Msgs] {
        const [newChild, msgs] = g.child.accept(this);
        const result = new MatchGrammar(newChild, g.relevantTapes);
        return [result, msgs];
    }
  
    public transformMatchFrom(g: MatchFromGrammar): [Grammar, Msgs] {
        const [newChild, msgs] = g.child.accept(this);
        const result = new MatchFromGrammar(newChild, g.fromTape, g.toTape);
        return [result, msgs];
    }

    public transformReplace(g: ReplaceGrammar): [Grammar, Msgs] {
        const [newFrom, fromMsgs] = g.fromGrammar.accept(this);
        const [newTo, toMsgs] = g.toGrammar.accept(this);
        const [newPre, preMsgs] = g.preContext?.accept(this);
        const [newPost, postMsgs] = g.postContext?.accept(this);
        const [newOther, otherMsgs] = g.otherContext?.accept(this);
        const result = new ReplaceGrammar(newFrom, newTo, newPre, newPost, newOther,
            g.beginsWith, g.endsWith, g.minReps, g.maxReps, g.maxExtraChars, g.maxCopyChars,
            g.vocabBypass, g.hiddenTapeName);
        const msgs = [...fromMsgs, ...toMsgs, ...preMsgs, ...postMsgs, ...otherMsgs];
        return [result, msgs];
    }

    public transformEmbed(g: EmbedGrammar): [Grammar, Msgs] {
        const result = new EmbedGrammar(g.name, this.ns);
        return [result, []];
    }

    public transformLocator(g: LocatorGrammar): [Grammar, Msgs] {
        const [newChild, msgs] = g.child.accept(this);
        const newMsgs = msgs.map(e => e.localize(g.cell.pos));
        const result = new LocatorGrammar(g.cell, newChild);
        return [result, newMsgs];
    }

    public transformNamespace(g: NsGrammar): [Grammar, Msgs] {
        const result = new NsGrammar();
        const msgs: Msgs = [];
        for (const [name, child] of g.symbols) {
            const [newChild, ms] = child.accept(this);
            result.addSymbol(name, newChild);
            msgs.push(...ms);
        }
        return [result, msgs];
    }

    public transformRepeat(g: RepeatGrammar): [Grammar, Msgs] {
        const [newChild, msgs] = g.child.accept(this);
        const result = new RepeatGrammar(newChild, g.minReps, g.maxReps);
        return [result, msgs];
    }

    public transformUnitTest(g: UnitTestGrammar): [Grammar, Msgs] {
        const [newChild, childMsgs] = g.child.accept(this);
        const [newTest, testMsgs] = g.test.accept(this);
        const [newUniques, uniqueMsgs] = this.mapTo(g.uniques);
        const result = new UnitTestGrammar(newChild, newTest, newUniques as LiteralGrammar[]);
        const msgs = [...childMsgs, ...testMsgs, ...uniqueMsgs];
        return [result, msgs];
    }

    public transformNegativeUnitTest(g: NegativeUnitTestGrammar): [Grammar, Msgs] {
        const [newChild, childMsgs] = g.child.accept(this);
        const [newTest, testMsgs] = g.test.accept(this);
        const result = new NegativeUnitTestGrammar(newChild, newTest);
        const msgs = [...childMsgs, ...testMsgs];
        return [result, msgs];
    }

    public transformJoinReplace(g: JoinReplaceGrammar): [Grammar, Msgs] {
        const [newChild, childMsgs] = g.child.accept(this);
        const [newRules, ruleMsgs] = this.mapTo(g.rules);
        const result = new JoinReplaceGrammar(newChild, 
            newRules as ReplaceGrammar[]);
        const msgs = [...childMsgs, ...ruleMsgs];
        return [result, msgs];
    }

    public transformJoinRule(g: JoinRuleGrammar): [Grammar, Msgs] {
        const [newChild, childMsgs] = g.child.accept(this);
        const [newRules, ruleMsgs] = this.mapTo(g.rules);
        const result = new JoinRuleGrammar(g.inputTape, newChild, 
            newRules as ReplaceGrammar[]);
        const msgs = [...childMsgs, ...ruleMsgs];
        return [result, msgs];
    }

    public transformNegation(g: NegationGrammar): [Grammar, Msgs] {
        const [newChild, msgs] = g.child.accept(this);
        const result = new NegationGrammar(newChild, g.maxReps);
        return [result, msgs];
    }

    public transformRename(g: RenameGrammar): [Grammar, Msgs] {
        const [newChild, msgs] = g.child.accept(this);
        const result = new RenameGrammar(newChild, g.fromTape, g.toTape);
        return [result, msgs];
    }

    public transformHide(g: HideGrammar): [Grammar, Msgs] {
        const [newChild, msgs] = g.child.accept(this);
        const result = new HideGrammar(newChild, g.tapeName, g.name);
        return [result, msgs];
    }

    public transformCount(g: CountGrammar): [Grammar, Msgs] {
        const [newChild, msgs] = g.child.accept(this);
        const result = new CountGrammar(newChild, g.maxChars);
        return [result, msgs];
    }

    public transformCountTape(g: CountTapeGrammar): [Grammar, Msgs] {
        const [newChild, msgs] = g.child.accept(this);
        const result = new CountTapeGrammar(newChild, g.maxChars);
        return [result, msgs];
    }

    public transformPriority(g: PriorityGrammar): [Grammar, Msgs] {
        const [newChild, msgs] = g.child.accept(this);
        const result = new PriorityGrammar(newChild, g.tapePriority);
        return [result, msgs];
    }
    
    public transformShort(g: PriorityGrammar): [Grammar, Msgs] {
        const [newChild, msgs] = g.child.accept(this);
        const result = new ShortGrammar(newChild);
        return [result, msgs];
    }

}
