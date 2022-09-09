import { 
    AlternationGrammar, Grammar,
    JoinGrammar, JoinReplaceGrammar, 
    NsGrammar, RenameGrammar, ReplaceGrammar
} from "../grammars";

import { IdentityTransform } from "./transforms";
import { DummyCell } from "../util";

/**
 * This Transform handles the behind-the-scenes renaming necessary when the programmer
 * expresses a "from T1 to T1" replacement rule.  This can't literally be true (no output
 * has two different strings on the same tape), so one of those two tapes has to be renamed.
 */
export class SameTapeReplaceTransform extends IdentityTransform {

    public replaceIndex: number = 0;

    public get desc(): string {
        return "Adjusted tape names in same-tape replace rules";
    }

    public transformJoinReplace(g: JoinReplaceGrammar): Grammar {

        let newChild = g.child.accept(this);
        const newRules = g.rules.map(r => r.accept(this));

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
    }

    public transformReplace(g: ReplaceGrammar): Grammar {

        let replaceTapeName = g.fromTapeName;
        for (const toTapeName of g.toTapeNames) {
            if (g.fromTapeName == toTapeName)
                replaceTapeName = g.hiddenTapeName;
        }

        const newFrom = g.fromGrammar.accept(this);
        const newTo = g.toGrammar.accept(this);
        const newPre = g.preContext.accept(this);
        const newPost = g.postContext.accept(this);
        const newOther = g.otherContext.accept(this);

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
