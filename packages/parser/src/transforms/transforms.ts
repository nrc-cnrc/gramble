import { Err, unzip, flatten, Errs } from "../util";
import { 
    AlternationGrammar, CharSetGrammar,
    DotGrammar, EmbedGrammar,
    EpsilonGrammar, EqualsGrammar, Grammar, GrammarTransform,
    HideGrammar, IntersectionGrammar, JoinGrammar,
    JoinReplaceGrammar, LiteralGrammar, MatchGrammar,
    NsGrammar, NegationGrammar, NegativeUnitTestGrammar,
    NullGrammar, RenameGrammar, RepeatGrammar, ReplaceGrammar,
    SequenceGrammar, UnitTestGrammar,
    UnresolvedEmbedGrammar, StartsGrammar, 
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
    ) {
        ns.calculateTapes(new CounterStack(2)); // just in case it hasn't been done
    }

    public transform(): [NsGrammar, Errs] {
        const [ns, err] = this.ns.accept(this);
        return [ns as NsGrammar, err];
    }
        
    public mapTo(gs: Grammar[]): [Grammar[], Errs] {
        const [results, errs] = unzip(gs.map(g => g.accept(this)));
        return [results, flatten(errs)];
    }

    public get desc(): string {
        return "Identity transformation";
    }

    public transformEpsilon(g: EpsilonGrammar): [Grammar, Errs] {
        return [g, []];
    }

    public transformNull(g: NullGrammar): [Grammar, Errs] {
        return [g, []];
    }

    public transformCharSet(g: CharSetGrammar): [Grammar, Errs] {
        return [g, []];
    }

    public transformLiteral(g: LiteralGrammar): [Grammar, Errs] {
        return [g, []];
    }

    public transformDot(g: DotGrammar): [Grammar, Errs] {
        return [g, []];
    }

    public transformSequence(g: SequenceGrammar): [Grammar, Errs] {
        const [newChildren, errs] = this.mapTo(g.children);
        const result = new SequenceGrammar(newChildren);
        return [result, errs];
    }

    public transformParallel(g: SequenceGrammar): [Grammar, Errs] {
        const [newChildren, errs] = this.mapTo(g.children);
        const result = new ParallelGrammar(newChildren);
        return [result, errs];
    }

    public transformAlternation(g: AlternationGrammar): [Grammar, Errs] {
        const [newChildren, errs] = this.mapTo(g.children);
        const result = new AlternationGrammar(newChildren);
        return [result, errs];
    }

    public transformIntersection(g: IntersectionGrammar): [Grammar, Errs] {
        const [newChild1, errs1] = g.child1.accept(this);
        const [newChild2, errs2] = g.child2.accept(this);
        const result = new IntersectionGrammar(newChild1, newChild2);
        return [result, [...errs1, ...errs2]]
    }

    public transformJoin(g: JoinGrammar): [Grammar, Errs] {
        const [newChild1, errs1] = g.child1.accept(this);
        const [newChild2, errs2] = g.child2.accept(this);
        const result = new JoinGrammar(newChild1, newChild2);
        return [result, [...errs1, ...errs2]];
    }

    public transformEquals(g: EqualsGrammar): [Grammar, Errs] {
        const [newChild1, errs1] = g.child1.accept(this);
        const [newChild2, errs2] = g.child2.accept(this);
        const result = new EqualsGrammar(newChild1, newChild2);
        return [result, [...errs1, ...errs2]]
    }

    public transformStarts(g: StartsGrammar): [Grammar, Errs] {
        const [newChild, errs] = g.child.accept(this);
        const result = new StartsGrammar(newChild);
        return [result, errs];
    }

    public transformEnds(g: EndsGrammar): [Grammar, Errs] {
        const [newChild, errs] = g.child.accept(this);
        const result = new EndsGrammar(newChild);
        return [result, errs];
    }

    public transformContains(g: ContainsGrammar): [Grammar, Errs] {
        const [newChild, errs] = g.child.accept(this);
        const result = new ContainsGrammar(newChild);
        return [result, errs];
    }

    public transformMatch(g: MatchGrammar): [Grammar, Errs] {
        const [newChild, errs] = g.child.accept(this);
        const result = new MatchGrammar(newChild, g.relevantTapes);
        return [result, errs];
    }
  
    public transformMatchFrom(g: MatchFromGrammar): [Grammar, Errs] {
        const [newChild, errs] = g.child.accept(this);
        const result = new MatchFromGrammar(newChild, g.fromTape, g.toTape);
        return [result, errs];
    }

    public transformReplace(g: ReplaceGrammar): [Grammar, Errs] {
        const [newFrom, fromErrs] = g.fromGrammar.accept(this);
        const [newTo, toErrs] = g.toGrammar.accept(this);
        const [newPre, preErrs] = g.preContext?.accept(this);
        const [newPost, postErrs] = g.postContext?.accept(this);
        const [newOther, otherErrs] = g.otherContext?.accept(this);
        const result = new ReplaceGrammar(newFrom, newTo, newPre, newPost, newOther,
            g.beginsWith, g.endsWith, g.minReps, g.maxReps, g.maxExtraChars, g.maxCopyChars,
            g.vocabBypass, g.hiddenTapeName);
        const errs = [...fromErrs, ...toErrs, ...preErrs, ...postErrs, ...otherErrs];
        return [result, errs];
    }

    public transformEmbed(g: EmbedGrammar): [Grammar, Errs] {
        const result = new EmbedGrammar(g.name, this.ns);
        return [result, []];
    }

    public transformLocator(g: LocatorGrammar): [Grammar, Errs] {
        const [newChild, errs] = g.child.accept(this);
        const result = new LocatorGrammar(g.cell, newChild);
        for (const err of errs) {
            g.cell.message(err);
        }
        return [result, []];
    }

    public transformUnresolvedEmbed(g: UnresolvedEmbedGrammar): [Grammar, Errs] {
        return [g, []];
    }

    public transformNamespace(g: NsGrammar): [Grammar, Errs] {
        const result = new NsGrammar();
        const errs: Errs = [];
        for (const [name, child] of g.symbols) {
            const [newChild, es] = child.accept(this);
            result.addSymbol(name, newChild);
            errs.push(...es);
        }
        return [result, errs];
    }

    public transformRepeat(g: RepeatGrammar): [Grammar, Errs] {
        const [newChild, errs] = g.child.accept(this);
        const result = new RepeatGrammar(newChild, g.minReps, g.maxReps);
        return [result, errs];
    }

    public transformUnitTest(g: UnitTestGrammar): [Grammar, Errs] {
        const [newChild, childErrs] = g.child.accept(this);
        const [newTest, testErrs] = g.test.accept(this);
        const [newUniques, uniqueErrs] = this.mapTo(g.uniques);
        const result = new UnitTestGrammar(newChild, newTest, newUniques as LiteralGrammar[]);
        const errs = [...childErrs, ...testErrs, ...uniqueErrs];
        return [result, errs];
    }

    public transformNegativeUnitTest(g: NegativeUnitTestGrammar): [Grammar, Errs] {
        const [newChild, childErrs] = g.child.accept(this);
        const [newTest, testErrs] = g.test.accept(this);
        const result = new NegativeUnitTestGrammar(newChild, newTest);
        const errs = [...childErrs, ...testErrs];
        return [result, errs];
    }

    public transformJoinReplace(g: JoinReplaceGrammar): [Grammar, Errs] {
        const [newChild, childErrs] = g.child.accept(this);
        const [newRules, ruleErrs] = this.mapTo(g.rules);
        const result = new JoinReplaceGrammar(newChild, 
            newRules as ReplaceGrammar[]);
        const errs = [...childErrs, ...ruleErrs];
        return [result, errs];
    }

    public transformJoinRule(g: JoinRuleGrammar): [Grammar, Errs] {
        const [newChild, childErrs] = g.child.accept(this);
        const [newRules, ruleErrs] = this.mapTo(g.rules);
        const result = new JoinRuleGrammar(g.inputTape, newChild, 
            newRules as ReplaceGrammar[]);
        const errs = [...childErrs, ...ruleErrs];
        return [result, errs];
    }

    public transformNegation(g: NegationGrammar): [Grammar, Errs] {
        const [newChild, errs] = g.child.accept(this);
        const result = new NegationGrammar(newChild, g.maxReps);
        return [result, errs];
    }

    public transformRename(g: RenameGrammar): [Grammar, Errs] {
        const [newChild, errs] = g.child.accept(this);
        const result = new RenameGrammar(newChild, g.fromTape, g.toTape);
        return [result, errs];
    }

    public transformHide(g: HideGrammar): [Grammar, Errs] {
        const [newChild, errs] = g.child.accept(this);
        const result = new HideGrammar(newChild, g.tapeName, g.name);
        return [result, errs];
    }

    public transformCount(g: CountGrammar): [Grammar, Errs] {
        const [newChild, errs] = g.child.accept(this);
        const result = new CountGrammar(newChild, g.maxChars);
        return [result, errs];
    }

    public transformCountTape(g: CountTapeGrammar): [Grammar, Errs] {
        const [newChild, errs] = g.child.accept(this);
        const result = new CountTapeGrammar(newChild, g.maxChars);
        return [result, errs];
    }

    public transformPriority(g: PriorityGrammar): [Grammar, Errs] {
        const [newChild, errs] = g.child.accept(this);
        const result = new PriorityGrammar(newChild, g.tapePriority);
        return [result, errs];
    }
    
    public transformShort(g: PriorityGrammar): [Grammar, Errs] {
        const [newChild, errs] = g.child.accept(this);
        const result = new ShortGrammar(newChild);
        return [result, errs];
    }

}
