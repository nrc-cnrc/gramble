import { 
    TstAssignment,
    TstOr,
    TstEmpty, 
    TstFilter, TstHeaderPair, 
    TstHide, TstCollection, 
    TstTestNot, TstRename,
    TstReplace, TstSequence, 
    TstTable, TstTest, TstJoin, TST 
} from "../tsts.js";
import { Pass } from "../passes.js";
import { 
    AlternationGrammar,
    EpsilonGrammar, 
    Grammar, 
    HideGrammar,  
    ReplaceBlockGrammar, 
    TestNotGrammar, 
    QualifiedGrammar, 
    RenameGrammar, 
    SequenceGrammar, 
    TestGrammar, 
    JoinGrammar,
    RuleContextGrammar,
    FilterGrammar,
    ReplaceGrammar,
    CollectionGrammar
} from "../grammars.js";
import { parseClass, TapeHeader } from "../headers.js";
import { Err, Msg, Message, msgList } from "../utils/msgs.js";
import { HeaderToGrammar } from "./headerToGrammar.js";
import { parseContent } from "../content.js";
import { DEFAULT_PARAM } from "../utils/constants.js";
import { uniqueLiterals } from "./uniqueLiterals.js";
import { PassEnv } from "../components.js";
import { getCaseInsensitive } from "../utils/func.js";

/**
 * This is the workhorse of grammar creation, turning the 
 * syntactic tree (of operations, headers, etc., still with reference
 * to units of the program as the programmer wrote them) into
 * grammars, which describe the language being generated (in terms
 * of sequences, alternations, filters, joins, renames, etc.)
 */
export class CreateGrammars extends Pass<TST,Grammar> {

    public transformAux(t: TST, env: PassEnv): Grammar|Msg<Grammar> {

        switch(t.tag) {
            case "headerpair": return this.handleHeaderPair(t, env);
            case "rename":     return this.handleRename(t, env);
            case "hide":       return this.handleHide(t, env);
            case "filter":     return this.handleFilter(t, env);
            case "empty":      return this.handleEmpty(t, env);
            case "table":      return this.handleTable(t, env);
            case "or":         return this.handleOr(t, env);
            case "join":       return this.handleJoin(t, env);
            case "replace":    return this.handleReplace(t, env);
            case "test":       return this.handleTest(t, env);
            case "testnot":    return this.handleNegativeTest(t, env);
            case "seq":        return this.handleSequence(t, env);
            case "assign":     return this.handleAssignment(t, env);
            case "collection": return this.handleCollection(t, env);
            default: 
                throw new Error(`unhandled ${t.constructor.name}`);
        }
    }

    public handleHeaderPair(t: TstHeaderPair, env: PassEnv): Msg<Grammar> {
        const pc = parseClass(t.header.header);
        return parseContent(pc, t.cell.text)
                .bind(g => new HeaderToGrammar(g))
                .bind(h => h.transform(t.header.header, env))
                .localize(t.cell.pos)
                .bind(g => g.locate(t.cell.pos));
    }
    
    public handleRename(t: TstRename, env: PassEnv): Msg<Grammar> {
        if (!(t.header.header instanceof TapeHeader)) {
            // TODO: This doesn't seem right
            return new EpsilonGrammar().err( "Renaming error",
                    "Rename (>) needs to have a tape name after it");
        }
        const fromTape = t.cell.text;
        const toTape = t.header.header.text;
        return this.transform(t.prev, env)
                    .bind(c => new RenameGrammar(c, fromTape, toTape))
                    .bind(c => c.locate(t.cell.pos));
    }
    
    public handleHide(t: TstHide, env: PassEnv): Msg<Grammar> {
        let result = this.transform(t.prev, env);
        for (const tape of t.cell.text.split("/")) {
            if (tape.trim().length == 0) continue;  // empty strings are meaningless here, don't try to hide them as tapes
            result = result.bind(c => new HideGrammar(c, tape.trim()));
        }
        return result.bind(g => g.locate(t.pos));
    }

    public handleFilter(t: TstFilter, env: PassEnv): Msg<Grammar> {
        const [prevGrammar, prevMsgs] = this.transform(t.prev, env)
                                            .destructure();

        const pc = parseClass(t.header.header);
        const [grammar, msgs] = parseContent(pc, t.cell.text)
                .bind(g => new HeaderToGrammar(g))
                .bind(h => h.transform(t.header.header, env))
                .localize(t.cell.pos)
                .bind(g => g.locate(t.pos))
                .destructure();

        const result = new FilterGrammar(prevGrammar, grammar);
        return result.locate(t.cell.pos).msg(prevMsgs).msg(msgs);
    }
    
    public handleEmpty(t: TstEmpty, env: PassEnv): Grammar {
        return new EpsilonGrammar();
    }

    public handleTable(t: TstTable, env: PassEnv): Msg<Grammar> {
        return msgList(t.child.rows)
                  .map(r => r.getParam(DEFAULT_PARAM))
                  .map(r => this.transform(r, env))
                  .bind(cs => new AlternationGrammar(cs))
                  .bind(c => c.locate(t.cell.pos));
    }
    
    public handleOr(t: TstOr, env: PassEnv): Msg<Grammar> {
        return msgList([t.sibling, t.child])
                    .map(c => this.transform(c, env))
                    .bind(cs => new AlternationGrammar(cs))
                    .bind(c => c.locate(t.cell.pos));
    }
    
    public handleJoin(t: TstJoin, env: PassEnv): Msg<Grammar> {
        return msgList([t.sibling, t.child])
                    .map(c => this.transform(c, env))
                    .bind(([c,s]) => new JoinGrammar(c, s))
                    .bind(c => c.locate(t.cell.pos));
    }

    public handleReplace(t: TstReplace, env: PassEnv): Msg<Grammar> {

        let [sibling, sibMsgs] = this.transform(t.sibling, env).destructure();
        const replaceRules: ReplaceGrammar[] = [];
        const newMsgs: Message[] = [];

        for (const params of t.child.rows) {
            const fromArg = this.transform(params.getParam("from"), env).msgTo(newMsgs);
            const toArg = this.transform(params.getParam("to"), env).msgTo(newMsgs);
            let preArg: Grammar = new EpsilonGrammar();
            let postArg: Grammar = new EpsilonGrammar();
            let contextArg = this.transform(params.getParam("context"), env).msgTo(newMsgs);
            let begins = false;
            let ends = false;

            if (contextArg instanceof RuleContextGrammar) {
                begins = contextArg.begins;
                ends = contextArg.ends;
                preArg = contextArg.preContext.locate(contextArg.pos);
                postArg = contextArg.postContext.locate(contextArg.pos);
            }
            
            const replaceRule = new ReplaceGrammar(fromArg, toArg,
                                                   preArg, postArg,
                                                   begins, ends, false,
                                                   `${params.pos.sheet}_${params.pos.row}`);
            replaceRules.push(replaceRule);
        }

        if (replaceRules.length == 0) {
            return sibling.msg(sibMsgs).msg(newMsgs);  // in case every rule fails, at least generate something
        }

        let result: Grammar = new ReplaceBlockGrammar(t.tape, sibling, replaceRules);
        return result.locate(t.cell.pos).msg(sibMsgs).msg(newMsgs);
    }
    
    public handleTest(t: TstTest, env: PassEnv): Msg<Grammar> {
        let result = this.transform(t.sibling, env);

        const msgs: Message[] = [];
        for (const params of t.child.rows) {
            const testInputs = this.transform(params.getParam(DEFAULT_PARAM), env).msgTo(msgs);
            const unique = this.transform(params.getParam("unique"), env).msgTo(msgs);
            const uniqueLits = uniqueLiterals(unique);
            result = result.bind(c => new TestGrammar(c, testInputs, uniqueLits))
                           .bind(c => c.locate(params.pos))       
        }

        return result.bind(c => c.locate(t.cell.pos))
                     .msg(msgs);
    }
    
    public handleNegativeTest(t: TstTestNot, env: PassEnv): Msg<Grammar> {
        let result = this.transform(t.sibling, env);

        const msgs: Message[] = [];
        for (const params of t.child.rows) {
            const testInputs = this.transform(params.getParam(DEFAULT_PARAM), env).msgTo(msgs);
            result = result.bind(c => new TestNotGrammar(c, testInputs))
                           .bind(c => c.locate(params.pos))   
        }
        
        return result.bind(c => c.locate(t.cell.pos))
                     .msg(msgs);
    }
    
    public handleSequence(t: TstSequence, env: PassEnv): Msg<Grammar> {
        return msgList(t.children)
                  .map(c => this.transform(c, env))
                  .bind(cs => new SequenceGrammar(cs));
    }
    
    public handleAssignment(t: TstAssignment, env: PassEnv): Msg<Grammar> {
        return this.transform(t.child, env);
    }

    public handleCollection(t: TstCollection, env: PassEnv): Msg<Grammar> {
        const newColl = new CollectionGrammar();
        const msgs: Message[] = [];

        for (const child of t.children) {

            const grammar = this.transform(child, env).msgTo(msgs);
            
            if (!(child instanceof TstAssignment)) {
                // at this point, all non-assignment children
                // of collections should have been wrapped in assignments
                throw new Error(`non-assignment child of collection: ${child.constructor.name}`);
            }

            const existingReferent = getCaseInsensitive(newColl.symbols, child.name);
            if (existingReferent != undefined) {
                // we're reassigning an existing symbol!
                Err('Reassigning existing symbol', 
                    `The symbol ${child.name} already refers to another grammar above.`)
                    .localize(child.pos).msgTo(msgs);
                continue;
            }     
            
            newColl.symbols[child.name] = grammar;
        }

        return newColl.locate(t.pos).msg(msgs);
    }
}
