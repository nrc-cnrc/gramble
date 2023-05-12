import { 
    AlternationGrammar, CounterStack, Grammar,
    GrammarPass,
    GrammarResult,
    JoinGrammar, JoinReplaceGrammar, 
    CollectionGrammar, 
    RenameGrammar, ReplaceGrammar, EpsilonGrammar
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
        const result = g.mapChildren(this, env);
        return result.bind(g => {
            switch (g.tag) {
                case "joinreplace": return this.handleJoinReplace(g, env);
                case "replace":     return this.handleReplace(g, env);
                default:            return g;
            }
        });
    }

    public handleJoinReplace(g: JoinReplaceGrammar, env: PassEnv): GrammarResult {

        g.calculateTapes(new CounterStack(2), env);
        
        let fromTape: string | undefined = undefined;
        let replaceTape: string | undefined = undefined;
        for (const rule of g.rules) {
            if (rule instanceof EpsilonGrammar) continue;
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

    public handleReplace(g: ReplaceGrammar, env: PassEnv): GrammarResult {
        g.calculateTapes(new CounterStack(2), env);

        if (g._fromTapeName == undefined || g._toTapeNames == undefined) {
            throw new Error("getting vocab copy edges without tapes");
        }

        let replaceTapeName = g._fromTapeName;
        for (const toTapeName of g._toTapeNames) {
            if (g._fromTapeName == toTapeName)
                replaceTapeName = g.hiddenTapeName;
        }

        const renamedFrom = renameGrammar(g.fromGrammar, g._fromTapeName, replaceTapeName);
        const renamedPre = renameGrammar(g.preContext, g._fromTapeName, replaceTapeName);
        const renamedPost = renameGrammar(g.postContext, g._fromTapeName, replaceTapeName);

        return new ReplaceGrammar(renamedFrom, g.toGrammar, 
                                  renamedPre, renamedPost, g.otherContext,
                                  g.beginsWith, g.endsWith,
                                  g.minReps, g.maxReps, g.hiddenTapeName, g.optional).msg();
    }

}

function renameGrammar(g: Grammar, fromTape: string, toTape: string): Grammar {
    if (fromTape == toTape) {
        return g;
    }
    return new RenameGrammar(g, fromTape, toTape);
}
