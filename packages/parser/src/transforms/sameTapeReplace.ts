import { 
    AlternationGrammar, CounterStack, Grammar,
    GrammarResult,
    JoinGrammar, JoinReplaceGrammar, 
    RenameGrammar, ReplaceGrammar
} from "../grammars";

import { IdentityTransform } from "./transforms";
import { Msgs, Result } from "../msgs";

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

        const superResult = super.transformJoinReplace(g) as Result<JoinReplaceGrammar>;
        const [newG, msgs] = superResult.destructure();
        newG.calculateTapes(new CounterStack(2));
        
        let fromTape: string | undefined = undefined;
        let replaceTape: string | undefined = undefined;
        for (const rule of newG.rules) {
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

        let result = newG.child;

        if (fromTape != undefined && replaceTape != undefined) {
            
            if (newG.child.tapes.indexOf(fromTape) == -1) {
                return superResult.err(`Replacing on non-existent tape'`,
                                     `The grammar above does not have a tape ${fromTape} to replace on`)
                                  .bind(r => r.child);
                // if replace is replacing a tape not relevant to the child,
                // then we generate infinitely -- which is correct but not what
                // anyone wants.  so ignore the replacement entirely.
            }
            
            result = renameGrammar(result, fromTape, replaceTape);
        }

        const child2 = new AlternationGrammar(newG.rules);
        return new JoinGrammar(result, child2).msg(msgs);
    }

    public transformReplace(g: ReplaceGrammar): GrammarResult {

        const [newG, msgs] = super.transformReplace(g)
                .destructure() as [ReplaceGrammar, Msgs];
        newG.calculateTapes(new CounterStack(2));
        let replaceTapeName = newG.fromTapeName;
        for (const toTapeName of newG.toTapeNames) {
            if (newG.fromTapeName == toTapeName)
                replaceTapeName = newG.hiddenTapeName;
        }

        const renamedFrom = renameGrammar(newG.fromGrammar, g.fromTapeName, replaceTapeName);
        const renamedPre = renameGrammar(newG.preContext, g.fromTapeName, replaceTapeName);
        const renamedPost = renameGrammar(newG.postContext, g.fromTapeName, replaceTapeName);

        return new ReplaceGrammar(renamedFrom, newG.toGrammar, 
                    renamedPre, renamedPost, newG.otherContext,
                    g.beginsWith, g.endsWith, g.minReps, 
                    g.maxReps, g.maxExtraChars, g.maxCopyChars,
                    g.vocabBypass)
                .msg(msgs);
    }

}

function renameGrammar(g: Grammar, fromTape: string, toTape: string): Grammar {
    if (fromTape == toTape) {
        return g;
    }
    return new RenameGrammar(g, fromTape, toTape);
}