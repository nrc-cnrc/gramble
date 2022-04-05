import { 
    AlternationGrammar, CharSetGrammar,
    CounterStack, DotGrammar, EmbedGrammar,
    EpsilonGrammar, EqualsGrammar, Grammar, GrammarTransform,
    HideGrammar, IntersectionGrammar, JoinGrammar,
    JoinReplaceGrammar, LiteralGrammar, MatchGrammar,
    NsGrammar, NegationGrammar, NegativeUnitTestGrammar,
    NullGrammar, RenameGrammar, RepeatGrammar, ReplaceGrammar,
    SequenceGrammar, UnitTestGrammar,
    UnresolvedEmbedGrammar, StartsGrammar, 
    EndsGrammar, ContainsGrammar, Seq, Null
} from "./grammars";
import { DummyCell } from "./util";

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
class IdentityTransform<T> implements GrammarTransform<T> {

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

    public transformFilter(g: EqualsGrammar, ns: NsGrammar, args: T): Grammar {
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
            g.vocabBypass);
    }
    
    public transformEmbed(g: EmbedGrammar, ns: NsGrammar, args: T): Grammar {
        return new EmbedGrammar(g.cell, g.name, ns);
    }

    public transformUnresolvedEmbed(g: UnresolvedEmbedGrammar, ns: NsGrammar, args: T): Grammar {
        return g;
    }

    public transformNamespace(g: NsGrammar, ns: NsGrammar, args: T): Grammar {
        const result = new NsGrammar(g.cell, g.name);
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
        return new HideGrammar(g.cell, newChild, g.tape, g.name);
    }
}

export class NameQualifierTransform extends IdentityTransform<NsGrammar[] > {

    public transform(g: Grammar): Grammar {

        const newNamespace = new NsGrammar(g.cell, "");

        const newG = g.accept(this, newNamespace, []);

        const defaultSymbol = newNamespace.symbols.get("");
        if (defaultSymbol == undefined) {
            const defaultRef = (newG instanceof NsGrammar) 
                                ? newNamespace.getDefaultSymbol() 
                                : newG;
            newNamespace.addSymbol("", defaultRef);
        }

        return newNamespace;
    }

    public transformNamespace(
        g: NsGrammar,
        ns: NsGrammar,
        args: NsGrammar[]
    ): Grammar {
        const newStack = [ ...args, g ];
        for (const [name, child] of g.symbols) {
            if (child instanceof NsGrammar) {
                child.accept(this, ns, newStack) as NsGrammar;
            } else {
                const newName = g.calculateQualifiedName(name, newStack);
                const result = child.accept(this, ns, newStack);
                ns.addSymbol(newName, result);
            }
        }
        const defaultName = g.calculateQualifiedName("", newStack);
        const defaultSymbol = ns.symbols.get(defaultName);
        if (defaultSymbol == undefined) {
            const defaultRef = ns.getDefaultSymbol();
            ns.addSymbol(defaultName, defaultRef);
        }
        return g;
    }

    public transformUnresolvedEmbed(
        g: UnresolvedEmbedGrammar, 
        ns: NsGrammar,
        args: NsGrammar[]
    ): Grammar {
        let resolution: [string, Grammar] | undefined = undefined;
        for (let i = args.length-1; i >=0; i--) {
            // we go down the stack asking each to resolve it
            const subStack = args.slice(0, i+1);
            resolution = args[i].resolveName(g.name, subStack);
            if (resolution != undefined) {              
                const [qualifiedName, referent] = resolution;
                return new EmbedGrammar(g.cell, qualifiedName, ns);
            }
        }
        return g;
    }

}

export class FlattenTransform extends IdentityTransform<void> {

    public transform(g: Grammar): Grammar {
        g.calculateTapes(new CounterStack(2));
        return g.accept(this, g as NsGrammar, null);
    }

    public transformSequence(g: SequenceGrammar, ns: NsGrammar, args: void): Grammar {
        
        const children = g.children.map(c => c.accept(this, ns, args));
        const newChildren: Grammar[] = [];
        for (const child of children) {
            if (child instanceof SequenceGrammar) {
                newChildren.push(...child.children);
                continue;
            }
            if (child instanceof EpsilonGrammar) {
                continue;
            }
            newChildren.push(child);
        }
        return new SequenceGrammar(g.cell, newChildren);
    }

    
    public transformAlternation(g: AlternationGrammar, ns: NsGrammar, args: void): Grammar {
        
        const children = g.children.map(c => c.accept(this, ns, args));
        const newChildren: Grammar[] = [];
        for (const child of children) {
            if (child instanceof AlternationGrammar) {
                newChildren.push(...child.children);
                continue;
            }
            if (child instanceof NullGrammar) {
                continue;
            }
            newChildren.push(child);
        }
        return new AlternationGrammar(g.cell, newChildren);
    }

}

export class FilterTransform extends IdentityTransform<void> {

    public transform(g: Grammar): Grammar {
        g.calculateTapes(new CounterStack(2));
        return g.accept(this, g as NsGrammar, null);
    }

    public transformStarts(g: StartsGrammar, ns: NsGrammar, args: void): Grammar {
        
        if (g.tapes == undefined) {
            throw new Error("missing tapes in StartsGrammar");
        }

        if (g.child instanceof NegationGrammar) {
            // this(not(x) -> not(this(x))
            const newFilter = new StartsGrammar(g.cell, g.child.child, g.tapes);
            const newNegation = new NegationGrammar(g.child.cell, newFilter, g.child.maxReps);
            return newNegation.accept(this, ns, args);
        }

        if (g.child instanceof SequenceGrammar && g.child.children.length > 0) {
            // this(x+y) -> x+this(y)
            const newChildren = [...g.child.children]; // clone the children
            const newLastChild = new StartsGrammar(
                g.cell, newChildren[newChildren.length-1], g.tapes);
            newChildren[newChildren.length-1] = newLastChild;
            const newSequence = new SequenceGrammar(g.cell, newChildren);
            return newSequence.accept(this, ns, args);
        }
        
        if (g.child instanceof AlternationGrammar) {
            // this(x|y) -> this(x)|this(y)
            const newChildren = g.child.children.map(c => new StartsGrammar(g.cell, c, g.tapes));
            const newAlternation = new AlternationGrammar(g.cell, newChildren);
            return newAlternation.accept(this, ns, args);
        }

        if (g.child instanceof IntersectionGrammar) {
            // this(x&y) -> this(x)&this(y)
            const newFilter1 = new StartsGrammar(g.cell, g.child.child1, g.tapes);
            const newFilter2 = new StartsGrammar(g.cell, g.child.child2, g.tapes);
            const newIntersection = new IntersectionGrammar(g.child.cell, newFilter1, newFilter2);
            return newIntersection.accept(this, ns, args);
        }

        // construct the filter
        const newChild = g.child.accept(this, ns, args);
        const dotStars: Grammar[] = [];
        for (const tape of g.tapes) {
            const dot = new DotGrammar(g.cell, tape);
            const dotStar = new RepeatGrammar(g.cell, dot);
            dotStars.push(dotStar);
        }
        return new SequenceGrammar(g.cell, [ newChild, ...dotStars ]);
    }
    
    public transformEnds(g: StartsGrammar, ns: NsGrammar, args: void): Grammar {
        
        if (g.tapes == undefined) {
            throw new Error("missing tapes in EndsGrammar");
        }

        if (g.child instanceof NegationGrammar) {
            // this(not(x) -> not(this(x))
            const newFilter = new EndsGrammar(g.cell, g.child.child, g.tapes);
            const newNegation = new NegationGrammar(g.child.cell, newFilter, g.child.maxReps);
            return newNegation.accept(this, ns, args);
        }

        if (g.child instanceof SequenceGrammar && g.child.children.length > 0) {
            // this(x+y) -> this(x)+y
            const newChildren = [...g.child.children]; // clone the children
            const newFirstChild = new EndsGrammar(g.cell, newChildren[0], g.tapes);
            newChildren[0] = newFirstChild;
            const newSequence = new SequenceGrammar(g.cell, newChildren);
            return newSequence.accept(this, ns, args);
        }
        
        if (g.child instanceof AlternationGrammar) {
            // this(x|y) -> this(x)|this(y)
            const newChildren = g.child.children.map(c => new EndsGrammar(g.cell, c, g.tapes));
            const newAlternation = new AlternationGrammar(g.cell, newChildren);
            return newAlternation.accept(this, ns, args);
        }

        if (g.child instanceof IntersectionGrammar) {
            // this(x&y) -> this(x)&this(y)
            const newFilter1 = new EndsGrammar(g.cell, g.child.child1, g.tapes);
            const newFilter2 = new EndsGrammar(g.cell, g.child.child2, g.tapes);
            const newIntersection = new IntersectionGrammar(g.child.cell, newFilter1, newFilter2);
            return newIntersection.accept(this, ns, args);
        }

        // create the filter
        const newChild = g.child.accept(this, ns, args);
        const dotStars: Grammar[] = [];
        for (const tape of g.tapes) {
            const dot = new DotGrammar(g.cell, tape);
            const dotStar = new RepeatGrammar(g.cell, dot);
            dotStars.push(dotStar);
        }
        return new SequenceGrammar(g.cell, [ ...dotStars, newChild ]);
    }
    
    public transformContains(g: ContainsGrammar, ns: NsGrammar, args: void): Grammar {
        
        if (g.tapes == undefined) {
            throw new Error("missing tapes in ContainsGrammar");
        }

        if (g.child instanceof NegationGrammar) {
            // this(not(x) -> not(this(x))
            const newFilter = new ContainsGrammar(g.cell, g.child.child, g.tapes);
            const newNegation = new NegationGrammar(g.child.cell, newFilter, g.child.maxReps);
            return newNegation.accept(this, ns, args);
        }

        if (g.child instanceof SequenceGrammar && g.child.children.length > 0) {
            // this(x+y) -> x+this(y)
            const newChildren = [...g.child.children]; // clone the children
            const newFirstChild = new EndsGrammar(g.cell, newChildren[0], g.tapes);
            newChildren[0] = newFirstChild;
            const newLastChild = new StartsGrammar(g.cell, newChildren[newChildren.length-1], g.tapes);
            newChildren[newChildren.length-1] = newLastChild;
            const newSequence = new SequenceGrammar(g.cell, newChildren);
            return newSequence.accept(this, ns, args);
        }
        
        if (g.child instanceof AlternationGrammar) {
            // this(x|y) -> this(x)|this(y)
            const newChildren = g.child.children.map(c => new ContainsGrammar(g.cell, c, g.tapes));
            const newAlternation = new AlternationGrammar(g.cell, newChildren);
            return newAlternation.accept(this, ns, args);
        }

        if (g.child instanceof IntersectionGrammar) {
            // this(x&y) -> this(x)&this(y)
            const newFilter1 = new ContainsGrammar(g.cell, g.child.child1, g.tapes);
            const newFilter2 = new ContainsGrammar(g.cell, g.child.child2, g.tapes);
            const newIntersection = new IntersectionGrammar(g.child.cell, newFilter1, newFilter2);
            return newIntersection.accept(this, ns, args);
        }

        // create the filter
        const newChild = g.child.accept(this, ns, args);
        const dotStars: Grammar[] = [];
        for (const tape of g.tapes) {
            const dot = new DotGrammar(g.cell, tape);
            const dotStar = new RepeatGrammar(g.cell, dot);
            dotStars.push(dotStar);
        }
        return new SequenceGrammar(g.cell, [ ...dotStars, newChild, ...dotStars ]);
    }
}

export class RenameFixTransform extends IdentityTransform<void>{

    public transform(g: Grammar): Grammar {
        g.calculateTapes(new CounterStack(2));  // just in case.  since tapes are 
                                                // memoized, no harm in double-checking
        return g.accept(this, g as NsGrammar, null);
    }

    public transformRename(g: RenameGrammar, ns: NsGrammar, args: void): Grammar {

        const newChild = g.child.accept(this, ns, args);
        newChild.calculateTapes(new CounterStack(2));

        if (newChild.tapes == undefined) {
            // shouldn't happen
            throw new Error("adjusting tapes without having calculated them first");
        }

        if (g.fromTape != g.toTape && newChild.tapes.indexOf(g.toTape) != -1) {
            g.message({
                type: "error", 
                shortMsg: "Destination tape already exists",
                longMsg: `The grammar to the left already contains the tape ${g.toTape}. `
            });
            
            const errTapeName = `__ERR${g.toTape}`;
            const errChild = new RenameGrammar(newChild.cell, newChild, g.toTape, errTapeName);
            return new RenameGrammar(g.cell, errChild, g.fromTape, g.toTape);
        }

        return new RenameGrammar(g.cell, newChild, g.fromTape, g.toTape);
    }


}

export class SameTapeReplaceTransform extends IdentityTransform<void>{

    public replaceIndex: number = 0;
    
    public transform(g: Grammar): Grammar {

        if (!(g instanceof NsGrammar)) {
            // shouldn't happen but just in case
            const newNs = new NsGrammar(g.cell, "");
            newNs.addSymbol("", g);
            g = newNs;
        }

        g.calculateTapes(new CounterStack(2));  // just in case.  since tapes are 
                                                // memoized, no harm in double-checking
        return g.accept(this, g as NsGrammar, null);
    }

    public transformJoinReplace(
        g: JoinReplaceGrammar, 
        ns: NsGrammar, 
        args: void
    ): Grammar {

        if (g.tapes == undefined || g.child.tapes == undefined) {
            // really only for linting
            throw new Error("Adjusting tapes before calculating them in the first place.");   
        }

        let newChild = g.child.accept(this, ns, args);
        const newRules = g.rules.map(r => r.accept(this, ns, args));

        let fromTape: string | undefined = undefined;
        let replaceTape: string | undefined = undefined;
        for (const rule of newRules as ReplaceGrammar[]) {
            const ruleFromTape = (rule.fromGrammar as RenameGrammar).fromTape;
            const ruleReplaceTape = (rule.fromGrammar as RenameGrammar).toTape;
            if ((replaceTape != undefined && ruleReplaceTape != replaceTape) ||
                (fromTape != undefined && fromTape != ruleFromTape)) {
                // this is an error, but caught/reported elsewhere
                continue;
            }
            fromTape = ruleFromTape;
            replaceTape = ruleReplaceTape;
        }

        if (fromTape != undefined && replaceTape != undefined) {
            
            if (g.child.tapes.indexOf(fromTape) == -1) {
                // if replace is replacing a tape not relevant to the child,
                // then we generate infinitely -- which is correct but not what
                // anyone wants.  so ignore the replacement entirely.
                return newChild;
            }
            
            // DUMMY_CELL because this rename may be invalid, but we don't want
            // it to be reported to the user because the compiler did it
            newChild = new RenameGrammar(new DummyCell(), newChild, fromTape, replaceTape);
        }

        const child2 = new AlternationGrammar(g.cell, newRules);
        const result = new JoinGrammar(g.cell, newChild, child2);
        return result;
        //return new JoinReplaceGrammar(g.cell, newChild, newRules as ReplaceGrammar[]);
    }

    public transformReplace(
        g: ReplaceGrammar, 
        ns: NsGrammar, 
        args: void
    ): Grammar {

        if (g.tapes == undefined) {
            throw new Error(`Performing SameTapeReplaceTransform without having calculated tapes`);
        }

        let replaceTapeName = g.fromTapeName;
        for (const toTapeName of g.toTapeNames) {
            if (g.fromTapeName == toTapeName)
                replaceTapeName = `__R${g.cell.pos.sheet}:${g.cell.pos.row}`
        }

        const newFrom = g.fromGrammar.accept(this, ns, args);
        const newTo = g.toGrammar.accept(this, ns, args);
        const newPre = g.preContext.accept(this, ns, args);
        const newPost = g.postContext.accept(this, ns, args);
        const newOther = g.otherContext.accept(this, ns, args);

        // We use a dummy cell because this rename may be invalid, but we don't want
        // it reported to the user because the compiler did it
        const renamedFrom = new RenameGrammar(new DummyCell(), newFrom, g.fromTapeName, replaceTapeName);
        const renamedPre = new RenameGrammar(new DummyCell(), newPre, g.fromTapeName, replaceTapeName);
        const renamedPost = new RenameGrammar(new DummyCell(), newPost, g.fromTapeName, replaceTapeName);

        const result = new ReplaceGrammar(g.cell, renamedFrom, newTo, renamedPre, renamedPost, newOther,
            g.beginsWith, g.endsWith, g.minReps, g.maxReps, g.maxExtraChars, g.maxCopyChars,
            g.vocabBypass);
        return result;
    }

}
