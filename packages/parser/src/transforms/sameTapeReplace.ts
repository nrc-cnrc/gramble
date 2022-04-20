import { 
    AlternationGrammar, CounterStack, Grammar,
    JoinGrammar, JoinReplaceGrammar, 
    NsGrammar, RenameGrammar, ReplaceGrammar
} from "../grammars";

import { IdentityTransform } from "./transforms";
import { DummyCell } from "../util";

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
