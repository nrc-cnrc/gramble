import { 
    AlternationGrammar, CounterStack, Grammar,
    GrammarPass,
    GrammarResult,
    JoinGrammar, JoinReplaceGrammar, 
    NsGrammar, 
    RenameGrammar, ReplaceGrammar
} from "../grammars";

import { result } from "../msgs";
import { Pass, PassEnv } from "../passes";

/**
 * This pass handles the behind-the-scenes renaming necessary when the programmer
 * expresses a "from T1 to T1" replacement rule.  This can't literally be true (no output
 * has two different strings on the same tape), so one of those two tapes has to be renamed.
 */
export class SameTapeReplacePass extends GrammarPass {

    public replaceIndex: number = 0;

    public get desc(): string {
        return "Adjusted tape names in same-tape replace rules";
    }

    public transform(g: Grammar, env: PassEnv): GrammarResult {
        const result = g.mapChildren(this, env) as GrammarResult;
        return result.bind(g => {
            switch (g.constructor) {
                case JoinReplaceGrammar:
                    return this.handleJoinReplace(g as JoinReplaceGrammar);
                case ReplaceGrammar:
                    return this.handleReplace(g as ReplaceGrammar);
                default:
                    return g;
            }
        });
    }

    public handleJoinReplace(g: JoinReplaceGrammar): GrammarResult {

        g.calculateTapes(new CounterStack(2));
        
        let fromTape: string | undefined = undefined;
        let replaceTape: string | undefined = undefined;
        for (const rule of g.rules) {
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

        let newG = g.child;

        if (fromTape != undefined && replaceTape != undefined) {
            
            if (g.child.tapes.indexOf(fromTape) == -1) {
                return result(g).err(`Replacing on non-existent tape'`,
                                     `The grammar above does not have a tape ${fromTape} to replace on`)
                                  .bind(r => r.child);
                // if replace is replacing a tape not relevant to the child,
                // then we generate infinitely -- which is correct but not what
                // anyone wants.  so ignore the replacement entirely.
            }
            
            newG = renameGrammar(newG, fromTape, replaceTape);
        }

        const child2 = new AlternationGrammar(g.rules);
        return new JoinGrammar(newG, child2).msg();
    }

    public handleReplace(g: ReplaceGrammar): GrammarResult {
        g.calculateTapes(new CounterStack(2));
        let replaceTapeName = g.fromTapeName;
        for (const toTapeName of g.toTapeNames) {
            if (g.fromTapeName == toTapeName)
                replaceTapeName = g.hiddenTapeName;
        }

        const renamedFrom = renameGrammar(g.fromGrammar, g.fromTapeName, replaceTapeName);
        const renamedPre = renameGrammar(g.preContext, g.fromTapeName, replaceTapeName);
        const renamedPost = renameGrammar(g.postContext, g.fromTapeName, replaceTapeName);

        return new ReplaceGrammar(renamedFrom, g.toGrammar, 
                    renamedPre, renamedPost, g.otherContext,
                    g.beginsWith, g.endsWith, g.minReps, 
                    g.maxReps, g.maxExtraChars, g.maxCopyChars,
                    g.vocabBypass).msg();
    }

}

function renameGrammar(g: Grammar, fromTape: string, toTape: string): Grammar {
    if (fromTape == toTape) {
        return g;
    }
    return new RenameGrammar(g, fromTape, toTape);
}