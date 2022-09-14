import { 
    AlternationGrammar, Grammar,
    JoinGrammar, JoinReplaceGrammar, 
    NsGrammar, RenameGrammar, ReplaceGrammar
} from "../grammars";

import { IdentityTransform } from "./transforms";
import { DummyCell, Err, Errs } from "../util";

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

    public transformJoinReplace(g: JoinReplaceGrammar): [Grammar, Errs] {

        let [newChild, childErrs] = g.child.accept(this);
        const [newRules, ruleErrs] = this.mapTo(g.rules) as [ReplaceGrammar[], Errs];
        const errs = [...childErrs, ...ruleErrs];

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
                const newErrs = [...errs, {
                    type: "error",
                    shortMsg: `Replacing on non-existent tape'`,
                    longMsg: `The grammar above does not have a tape ${fromTape} to replace on`

                }]
                // if replace is replacing a tape not relevant to the child,
                // then we generate infinitely -- which is correct but not what
                // anyone wants.  so ignore the replacement entirely.
                return [newChild, newErrs];
            }
            
            newChild = renameGrammar(newChild, fromTape, replaceTape);
        }

        const child2 = new AlternationGrammar(newRules);
        const result = new JoinGrammar(newChild, child2);
        return [result, errs];
    }

    public transformReplace(g: ReplaceGrammar): [Grammar, Errs] {

        let replaceTapeName = g.fromTapeName;
        for (const toTapeName of g.toTapeNames) {
            if (g.fromTapeName == toTapeName)
                replaceTapeName = g.hiddenTapeName;
        }

        const [newFrom, fromErrs] = g.fromGrammar.accept(this);
        const [newTo, toErrs] = g.toGrammar.accept(this);
        const [newPre, preErrs] = g.preContext.accept(this);
        const [newPost, postErrs] = g.postContext.accept(this);
        const [newOther, otherErrs] = g.otherContext.accept(this);
        const errs = [...fromErrs, ...toErrs, ...preErrs, ...postErrs, ...otherErrs];

        // We use a dummy cell because this rename may be invalid, but we don't want
        // it reported to the user because the compiler did it
        const renamedFrom = renameGrammar(newFrom, g.fromTapeName, replaceTapeName);
        const renamedPre = renameGrammar(newPre, g.fromTapeName, replaceTapeName);
        const renamedPost = renameGrammar(newPost, g.fromTapeName, replaceTapeName);

        const result = new ReplaceGrammar(renamedFrom, newTo, renamedPre, renamedPost, newOther,
            g.beginsWith, g.endsWith, g.minReps, g.maxReps, g.maxExtraChars, g.maxCopyChars,
            g.vocabBypass);
        return [result, errs];
    }

}

function renameGrammar(g: Grammar, fromTape: string, toTape: string): Grammar {
    if (fromTape == toTape) {
        return g;
    }
    return new RenameGrammar(g, fromTape, toTape);
}