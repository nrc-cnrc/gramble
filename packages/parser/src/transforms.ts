import { 
    AlternationGrammar, CharSetGrammar, ContainsGrammar,
    CounterStack, DotGrammar, EmbedGrammar, EndsWithGrammar,
    EpsilonGrammar, FilterGrammar, Grammar, GrammarTransform,
    HideGrammar, IntersectionGrammar, JoinGrammar,
    JoinReplaceGrammar, LiteralGrammar, MatchGrammar,
    NsGrammar, NegationGrammar, NegativeUnitTestGrammar,
    NullGrammar, RenameGrammar, RepeatGrammar, ReplaceGrammar,
    SequenceGrammar, StartsWithGrammar, UnitTestGrammar,
    UnresolvedEmbedGrammar
} from "./grammars";
import { DummyCell } from "./util";

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

    public transformFilter(g: FilterGrammar, ns: NsGrammar, args: T): Grammar {
        const newChild1 = g.child1.accept(this, ns, args);
        const newChild2 = g.child2.accept(this, ns, args);
        return new FilterGrammar(g.cell, newChild1, newChild2);
    }

    public transformStartsWith(g: StartsWithGrammar, ns: NsGrammar, args: T): Grammar {
        const newChild1 = g.child1.accept(this, ns, args);
        const newChild2 = g.child2.accept(this, ns, args);
        return new StartsWithGrammar(g.cell, newChild1, newChild2);
    }

    public transformEndsWith(g: EndsWithGrammar, ns: NsGrammar, args: T): Grammar {
        const newChild1 = g.child1.accept(this, ns, args);
        const newChild2 = g.child2.accept(this, ns, args);
        return new EndsWithGrammar(g.cell, newChild1, newChild2);
    }

    public transformContains(g: ContainsGrammar, ns: NsGrammar, args: T): Grammar {
        const newChild1 = g.child1.accept(this, ns, args);
        const newChild2 = g.child2.accept(this, ns, args);
        return new ContainsGrammar(g.cell, newChild1, newChild2);
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

export class NameQualifier extends IdentityTransform<NsGrammar[] > {

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

export class ReplaceAdjuster extends IdentityTransform<void>{

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
            throw new Error(`Performing ReplaceTape transformation without having calculated tapes`);
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
