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

    public transform(): NsGrammar {
        return this.ns.accept(this) as NsGrammar;
    }

    public get desc(): string {
        return "Identity transformation";
    }

    public transformEpsilon(g: EpsilonGrammar): Grammar {
        return g;
    }

    public transformNull(g: NullGrammar): Grammar {
        return g;
    }

    public transformCharSet(g: CharSetGrammar): Grammar {
        return g;
    }

    public transformLiteral(g: LiteralGrammar): Grammar {
        return g;
    }

    public transformDot(g: DotGrammar): Grammar {
        return g;
    }

    public transformSequence(g: SequenceGrammar): Grammar {
        const newChildren = g.children.map(c => c.accept(this));
        return new SequenceGrammar(g.cell, newChildren);
    }

    public transformParallel(g: SequenceGrammar): Grammar {
        const newChildren = g.children.map(c => c.accept(this));
        return new ParallelGrammar(g.cell, newChildren);
    }

    public transformAlternation(g: AlternationGrammar): Grammar {
        const newChildren = g.children.map(c => c.accept(this));
        return new AlternationGrammar(g.cell, newChildren);
    }

    public transformIntersection(g: IntersectionGrammar): Grammar {
        const newChild1 = g.child1.accept(this);
        const newChild2 = g.child2.accept(this);
        return new IntersectionGrammar(g.cell, newChild1, newChild2);
    }

    public transformJoin(g: JoinGrammar): Grammar {
        const newChild1 = g.child1.accept(this);
        const newChild2 = g.child2.accept(this);
        return new JoinGrammar(g.cell, newChild1, newChild2);     
    }

    public transformEquals(g: EqualsGrammar): Grammar {
        const newChild1 = g.child1.accept(this);
        const newChild2 = g.child2.accept(this);
        return new EqualsGrammar(g.cell, newChild1, newChild2);
    }

    public transformStarts(g: StartsGrammar): Grammar {
        const newChild = g.child.accept(this);
        return new StartsGrammar(g.cell, newChild);
    }

    public transformEnds(g: EndsGrammar): Grammar {
        const newChild = g.child.accept(this);
        return new EndsGrammar(g.cell, newChild);
    }

    public transformContains(g: ContainsGrammar): Grammar {
        const newChild = g.child.accept(this);
        return new ContainsGrammar(g.cell, newChild);
    }

    public transformMatch(g: MatchGrammar): Grammar {
        const newChild = g.child.accept(this);
        return new MatchGrammar(g.cell, newChild, g.relevantTapes);
    }
  
    public transformMatchFrom(g: MatchFromGrammar): Grammar {
        const newChild = g.child.accept(this);
        return new MatchFromGrammar(g.cell, newChild, g.fromTape, g.toTape);
    }

    public transformReplace(g: ReplaceGrammar): Grammar {
        const newFrom = g.fromGrammar.accept(this);
        const newTo = g.toGrammar.accept(this);
        const newPre = g.preContext?.accept(this);
        const newPost = g.postContext?.accept(this);
        const newOther = g.otherContext?.accept(this);
        return new ReplaceGrammar(g.cell, newFrom, newTo, newPre, newPost, newOther,
            g.beginsWith, g.endsWith, g.minReps, g.maxReps, g.maxExtraChars, g.maxCopyChars,
            g.vocabBypass, g.hiddenTapeName);
    }

    public transformEmbed(g: EmbedGrammar): Grammar {
        return new EmbedGrammar(g.cell, g.name, this.ns);
    }

    public transformLocator(g: LocatorGrammar): Grammar {
        const newChild = g.child.accept(this);
        return new LocatorGrammar(g.cell, newChild);
    }

    public transformUnresolvedEmbed(g: UnresolvedEmbedGrammar): Grammar {
        return g;
    }

    public transformNamespace(g: NsGrammar): Grammar {
        const result = new NsGrammar(g.cell);
        for (const [name, child] of g.symbols) {
            const newChild = child.accept(this);
            result.addSymbol(name, newChild);
        }
        return result;
    }

    public transformRepeat(g: RepeatGrammar): Grammar {
        const newChild = g.child.accept(this);
        return new RepeatGrammar(g.cell, newChild, g.minReps, g.maxReps);
    }

    public transformUnitTest(g: UnitTestGrammar): Grammar {
        const newChild = g.child.accept(this);
        const newTest = g.test.accept(this);
        const newUniques = g.uniques.map(u => u.accept(this)) as LiteralGrammar[];
        return new UnitTestGrammar(g.cell, newChild, newTest, newUniques);
    }

    public transformNegativeUnitTest(g: NegativeUnitTestGrammar): Grammar {
        const newChild = g.child.accept(this);
        const newTest = g.test.accept(this);
        return new NegativeUnitTestGrammar(g.cell, newChild, newTest);
    }

    public transformJoinReplace(g: JoinReplaceGrammar): Grammar {
        const newChild = g.child.accept(this);
        const newRules = g.rules.map(r => r.accept(this));
        return new JoinReplaceGrammar(g.cell, newChild, 
            newRules as ReplaceGrammar[]);
    }

    public transformJoinRule(g: JoinRuleGrammar): Grammar {
        const newChild = g.child.accept(this);
        const newRules = g.rules.map(r => r.accept(this));
        return new JoinRuleGrammar(g.cell, g.inputTape, newChild, 
            newRules as ReplaceGrammar[]);
    }

    public transformNegation(g: NegationGrammar): Grammar {
        const newChild = g.child.accept(this);
        return new NegationGrammar(g.cell, newChild, g.maxReps);
    }

    public transformRename(g: RenameGrammar): Grammar {
        const newChild = g.child.accept(this);
        return new RenameGrammar(g.cell, newChild, g.fromTape, g.toTape);
    }

    public transformHide(g: HideGrammar): Grammar {
        const newChild = g.child.accept(this);
        return new HideGrammar(g.cell, newChild, g.tapeName, g.name);
    }

    public transformCount(g: CountGrammar): Grammar {
        const newChild = g.child.accept(this);
        return new CountGrammar(g.cell, newChild, g.maxChars);
    }

    public transformCountTape(g: CountTapeGrammar): Grammar {
        const newChild = g.child.accept(this);
        return new CountTapeGrammar(g.cell, newChild, g.maxChars);
    }

    public transformPriority(g: PriorityGrammar): Grammar {
        const newChild = g.child.accept(this);
        return new PriorityGrammar(g.cell, newChild, g.tapePriority);
    }
    
    public transformShort(g: PriorityGrammar): Grammar {
        const newChild = g.child.accept(this);
        return new ShortGrammar(g.cell, newChild);
    }

}
