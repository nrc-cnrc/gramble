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
    CountTapeGrammar, CounterStack, JoinRuleGrammar
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
export class IdentityTransform<T> implements GrammarTransform<T> {
    
    public transform(g: NsGrammar): NsGrammar {
        g.calculateTapes(new CounterStack(2));
        return g.accept(this, g, null) as NsGrammar;
    }

    public transformEpsilon(g: EpsilonGrammar, ns: NsGrammar, args: T): Grammar {
        return g;
    }

    public transformNull(g: NullGrammar, ns: NsGrammar, args: T): Grammar {
        return g;
    }

    public transformCharSet(g: CharSetGrammar, ns: NsGrammar, args: T): Grammar {
        return g;
    }

    public transformLiteral(g: LiteralGrammar, ns: NsGrammar, args: T): Grammar {
        return g;
    }

    public transformDot(g: DotGrammar, ns: NsGrammar, args: T): Grammar {
        return g;
    }

    public transformSequence(g: SequenceGrammar, ns: NsGrammar, args: T): Grammar {
        const newChildren = g.children.map(c => c.accept(this, ns, args));
        return new SequenceGrammar(g.cell, newChildren);
    }

    public transformAlternation(g: AlternationGrammar, ns: NsGrammar, args: T): Grammar {
        const newChildren = g.children.map(c => c.accept(this, ns, args));
        return new AlternationGrammar(g.cell, newChildren);
    }

    public transformIntersection(g: IntersectionGrammar, ns: NsGrammar, args: T): Grammar {
        const newChild1 = g.child1.accept(this, ns, args);
        const newChild2 = g.child2.accept(this, ns, args);
        return new IntersectionGrammar(g.cell, newChild1, newChild2);
    }

    public transformJoin(g: JoinGrammar, ns: NsGrammar, args: T): Grammar {
        const newChild1 = g.child1.accept(this, ns, args);
        const newChild2 = g.child2.accept(this, ns, args);
        return new JoinGrammar(g.cell, newChild1, newChild2);     
    }

    public transformEquals(g: EqualsGrammar, ns: NsGrammar, args: T): Grammar {
        const newChild1 = g.child1.accept(this, ns, args);
        const newChild2 = g.child2.accept(this, ns, args);
        return new EqualsGrammar(g.cell, newChild1, newChild2);
    }

    public transformStarts(g: StartsGrammar, ns: NsGrammar, args: T): Grammar {
        const newChild = g.child.accept(this, ns, args);
        return new StartsGrammar(g.cell, newChild);
    }

    public transformEnds(g: EndsGrammar, ns: NsGrammar, args: T): Grammar {
        const newChild = g.child.accept(this, ns, args);
        return new EndsGrammar(g.cell, newChild);
    }

    public transformContains(g: ContainsGrammar, ns: NsGrammar, args: T): Grammar {
        const newChild = g.child.accept(this, ns, args);
        return new ContainsGrammar(g.cell, newChild);
    }

    public transformMatch(g: MatchGrammar, ns: NsGrammar, args: T): Grammar {
        const newChild = g.child.accept(this, ns, args);
        return new MatchGrammar(g.cell, newChild, g.relevantTapes);
    }

    public transformReplace(g: ReplaceGrammar, ns: NsGrammar, args: T): Grammar {
        const newFrom = g.fromGrammar.accept(this, ns, args);
        const newTo = g.toGrammar.accept(this, ns, args);
        const newPre = g.preContext?.accept(this, ns, args);
        const newPost = g.postContext?.accept(this, ns, args);
        const newOther = g.otherContext?.accept(this, ns, args);
        return new ReplaceGrammar(g.cell, newFrom, newTo, newPre, newPost, newOther,
            g.beginsWith, g.endsWith, g.minReps, g.maxReps, g.maxExtraChars, g.maxCopyChars,
            g.vocabBypass, g.hiddenTapeName);
    }

    public transformEmbed(g: EmbedGrammar, ns: NsGrammar, args: T): Grammar {
        return new EmbedGrammar(g.cell, g.name, ns);
    }

    public transformUnresolvedEmbed(g: UnresolvedEmbedGrammar, ns: NsGrammar, args: T): Grammar {
        return g;
    }

    public transformNamespace(g: NsGrammar, ns: NsGrammar, args: T): Grammar {
        const result = new NsGrammar(g.cell);
        for (const [name, child] of g.symbols) {
            const newChild = child.accept(this, ns, args);
            result.addSymbol(name, newChild);
        }
        return result;
    }

    public transformRepeat(g: RepeatGrammar, ns: NsGrammar, args: T): Grammar {
        const newChild = g.child.accept(this, ns, args);
        return new RepeatGrammar(g.cell, newChild, g.minReps, g.maxReps);
    }

    public transformUnitTest(g: UnitTestGrammar, ns: NsGrammar, args: T): Grammar {
        const newChild = g.child.accept(this, ns, args);
        const newTest = g.test.accept(this, ns, args);
        const newUniques = g.uniques.map(u => u.accept(this, ns, args)) as LiteralGrammar[];
        return new UnitTestGrammar(g.cell, newChild, newTest, newUniques);
    }

    public transformNegativeUnitTest(g: NegativeUnitTestGrammar, ns: NsGrammar, args: T): Grammar {
        const newChild = g.child.accept(this, ns, args);
        const newTest = g.test.accept(this, ns, args);
        return new NegativeUnitTestGrammar(g.cell, newChild, newTest);
    }

    public transformJoinReplace(g: JoinReplaceGrammar, ns: NsGrammar, args: T): Grammar {
        const newChild = g.child.accept(this, ns, args);
        const newRules = g.rules.map(r => r.accept(this, ns, args));
        return new JoinReplaceGrammar(g.cell, newChild, 
            newRules as ReplaceGrammar[]);
    }

    public transformJoinRule(g: JoinRuleGrammar, ns: NsGrammar, args: T): Grammar {
        const newChild = g.child.accept(this, ns, args);
        const newRules = g.rules.map(r => r.accept(this, ns, args));
        return new JoinRuleGrammar(g.cell, g.inputTape, newChild, 
            newRules as ReplaceGrammar[]);
    }

    public transformNegation(g: NegationGrammar, ns: NsGrammar, args: T): Grammar {
        const newChild = g.child.accept(this, ns, args);
        return new NegationGrammar(g.cell, newChild, g.maxReps);
    }

    public transformRename(g: RenameGrammar, ns: NsGrammar, args: T): Grammar {
        const newChild = g.child.accept(this, ns, args);
        return new RenameGrammar(g.cell, newChild, g.fromTape, g.toTape);
    }

    public transformHide(g: HideGrammar, ns: NsGrammar, args: T): Grammar {
        const newChild = g.child.accept(this, ns, args);
        return new HideGrammar(g.cell, newChild, g.tapeName, g.name);
    }

    public transformCount(g: CountGrammar, ns: NsGrammar, args: T): Grammar {
        const newChild = g.child.accept(this, ns, args);
        return new CountGrammar(g.cell, newChild, g.maxChars);
    }
    
    public transformCountTape(g: CountTapeGrammar, ns: NsGrammar, args: T): Grammar {
        const newChild = g.child.accept(this, ns, args);
        return new CountTapeGrammar(g.cell, newChild, g.maxChars);
    }
}
