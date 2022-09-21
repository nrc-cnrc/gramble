import { 
    AlternationGrammar, Grammar,
    GrammarResult,
    JoinGrammar, JoinReplaceGrammar, 
    RenameGrammar, ReplaceGrammar
} from "../grammars";

import { IdentityTransform } from "./transforms";
import { Msgs } from "../msgs";

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

    public transformJoinReplace(g: JoinReplaceGrammar): GrammarResult {

        let [child, childMsgs] = g.child.accept(this).destructure();
        const [rules, ruleMsgs] = this.mapTo(g.rules).destructure() as [ReplaceGrammar[], Msgs];

        let fromTape: string | undefined = undefined;
        let replaceTape: string | undefined = undefined;
        for (const rule of rules) {
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

        let result = child;
        if (fromTape != undefined && replaceTape != undefined) {
            
            if (g.child.tapes.indexOf(fromTape) == -1) {
                return g.msg(childMsgs)
                        .msg(ruleMsgs)
                        .err(`Replacing on non-existent tape'`,
                            `The grammar above does not have a tape ${fromTape} to replace on`)
                        .bind(r => child);
                // if replace is replacing a tape not relevant to the child,
                // then we generate infinitely -- which is correct but not what
                // anyone wants.  so ignore the replacement entirely.
            }
            
            result = renameGrammar(result, fromTape, replaceTape);
        }

        const child2 = new AlternationGrammar(rules);
        return new JoinGrammar(result, child2)
                      .msg(childMsgs)
                      .msg(ruleMsgs);
    }

    public transformReplace(g: ReplaceGrammar): GrammarResult {

        let replaceTapeName = g.fromTapeName;
        for (const toTapeName of g.toTapeNames) {
            if (g.fromTapeName == toTapeName)
                replaceTapeName = g.hiddenTapeName;
        }

        const [cFrom, fromMsgs] = g.fromGrammar.accept(this).destructure();
        const [cTo, toMsgs] = g.toGrammar.accept(this).destructure();
        const [cPre, preMsgs] = g.preContext.accept(this).destructure();
        const [cPost, postMsgs] = g.postContext.accept(this).destructure();
        const [cOther, otherMsgs] = g.otherContext.accept(this).destructure();

        const renamedFrom = renameGrammar(cFrom, g.fromTapeName, replaceTapeName);
        const renamedPre = renameGrammar(cPre, g.fromTapeName, replaceTapeName);
        const renamedPost = renameGrammar(cPost, g.fromTapeName, replaceTapeName);

        return new ReplaceGrammar(renamedFrom, cTo, 
            renamedPre, renamedPost, cOther,
            g.beginsWith, g.endsWith, g.minReps, g.maxReps, g.maxExtraChars, g.maxCopyChars,
            g.vocabBypass)
            .msg(fromMsgs).msg(toMsgs)
            .msg(preMsgs).msg(postMsgs).msg(otherMsgs);
    }

}

function renameGrammar(g: Grammar, fromTape: string, toTape: string): Grammar {
    if (fromTape == toTape) {
        return g;
    }
    return new RenameGrammar(g, fromTape, toTape);
}