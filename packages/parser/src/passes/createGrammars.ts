import { 
    TstAssignment,
    TstOr,
    TstEmpty, 
    TstFilter, TstHeaderPair, 
    TstHide, TstCollection, 
    TstTestNot, TstRename,
    TstReplace, TstSequence, 
    TstTable, TstTest, TstJoin, TST 
} from "../tsts";
import { Pass, PassEnv } from "../passes";
import { 
    AlternationGrammar,
    EpsilonGrammar, 
    Grammar, GrammarResult, 
    HideGrammar,  
    ReplaceBlockGrammar, LocatorGrammar, 
    TestNotGrammar, 
    CollectionGrammar, 
    RenameGrammar, ReplaceGrammar, 
    SequenceGrammar, TestGrammar, 
    JoinGrammar,
    RuleContextGrammar,
    FilterGrammar
} from "../grammars";
import { Header, parseClass, TapeHeader } from "../headers";
import { Err, Msgs, resultList } from "../msgs";
import { HeaderToGrammar } from "./headerToGrammar";
import { parseCell } from "../cell";
import { PLAIN_PARAM } from "../util";
import { uniqueLiterals } from "./uniqueLiterals";

/**
 * This is the workhorse of grammar creation, turning the 
 * syntactic tree (of operations, headers, etc., still with reference
 * to units of the program as the programmer wrote them) into
 * grammars, which describe the language being generated (in terms
 * of sequences, alternations, filters, joins, renames, etc.)
 */
export class CreateGrammars extends Pass<TST,Grammar> {

    public get desc(): string {
        return "Creating grammar objects";
    }

    public transform(t: TST, env: PassEnv): GrammarResult {

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

    public handleHeaderPair(t: TstHeaderPair, env: PassEnv): GrammarResult {
        const pc = parseClass(t.header.header);
        return parseCell(pc, t.cell.text)
                .bind(g => new HeaderToGrammar(g))
                .bind(h => h.transform(t.header.header, env))
                .localize(t.cell.pos)
                .bind(g => new LocatorGrammar(t.cell.pos, g));
    }
    
    public handleRename(t: TstRename, env: PassEnv): GrammarResult {
        if (!(t.header.header instanceof TapeHeader)) {
            // TODO: This doesn't seem right
            return new EpsilonGrammar().err( "Renaming error",
                    "Rename (>) needs to have a tape name after it");
        }
        const fromTape = t.cell.text;
        const toTape = t.header.header.text;
        return this.transform(t.prev, env)
                    .bind(c => new RenameGrammar(c, fromTape, toTape))
                    .bind(c => new LocatorGrammar(t.cell.pos, c));
    }
    
    public handleHide(t: TstHide, env: PassEnv): GrammarResult {
        let result = this.transform(t.prev, env);
        for (const tape of t.cell.text.split("/")) {
            result = result.bind(c => new HideGrammar(c, tape.trim()));
        }
        return result.bind(c => new LocatorGrammar(t.cell.pos, c));
    }

    public handleFilter(t: TstFilter, env: PassEnv): GrammarResult {
        const [prevGrammar, prevMsgs] = this.transform(t.prev, env)
                                            .destructure();

        const pc = parseClass(t.header.header);
        const [grammar, msgs] = parseCell(pc, t.cell.text)
                .bind(g => new HeaderToGrammar(g))
                .bind(h => h.transform(t.header.header, env))
                .localize(t.cell.pos)
                .bind(g => new LocatorGrammar(t.cell.pos, g))
                .destructure();

        const result = new FilterGrammar(prevGrammar, grammar);
        const locatedResult = new LocatorGrammar(t.cell.pos, result);
        return locatedResult.msg(prevMsgs).msg(msgs);
    }
    
    public handleEmpty(t: TstEmpty, env: PassEnv): GrammarResult {
        return new EpsilonGrammar().msg();
    }

    public handleTable(t: TstTable, env: PassEnv): GrammarResult {
        return resultList(t.child.rows)
                  .map(r => r.getParam(PLAIN_PARAM))
                  .map(r => this.transform(r, env))
                  .bind(cs => new AlternationGrammar(cs))
                  .bind(c => new LocatorGrammar(t.cell.pos, c))
    }
    
    public handleOr(t: TstOr, env: PassEnv): GrammarResult {
        return resultList([t.sibling, t.child])
                    .map(c => this.transform(c, env))
                    .bind(cs => new AlternationGrammar(cs))
                    .bind(c => new LocatorGrammar(t.cell.pos, c));
    }
    
    public handleJoin(t: TstJoin, env: PassEnv): GrammarResult {
        return resultList([t.sibling, t.child])
                    .map(c => this.transform(c, env))
                    .bind(([c,s]) => new JoinGrammar(c, s))
                    .bind(c => new LocatorGrammar(t.cell.pos, c));
    }

    public handleReplace(t: TstReplace, env: PassEnv): GrammarResult {

        let [sibling, sibMsgs] = this.transform(t.sibling, env).destructure();
        const replaceRules: ReplaceGrammar[] = [];
        const newMsgs: Msgs = [];

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
                preArg = contextArg.preContext;
                postArg = contextArg.postContext;
            }
            
            if (contextArg instanceof LocatorGrammar && 
                    contextArg.child instanceof RuleContextGrammar) {
                begins = contextArg.child.begins;
                ends = contextArg.child.ends;
                preArg = new LocatorGrammar(contextArg.pos,
                                contextArg.child.preContext);
                postArg = new LocatorGrammar(contextArg.pos,
                                contextArg.child.postContext); 
            }

            const replaceRule = new ReplaceGrammar(fromArg, toArg,
                                                   preArg, postArg, new EpsilonGrammar(),
                                                   begins, ends, 0, Infinity, 
                                                   `${params.pos.sheet}_${params.pos.row}`, false);
            replaceRules.push(replaceRule);
        }

        if (replaceRules.length == 0) {
            return sibling.msg(sibMsgs).msg(newMsgs);  // in case every rule fails, at least generate something
        }

        let result: Grammar = new ReplaceBlockGrammar(t.tape, sibling, replaceRules);
        result = new LocatorGrammar(t.cell.pos, result);
        return result.msg(sibMsgs).msg(newMsgs);
    }
    
    public handleTest(t: TstTest, env: PassEnv): GrammarResult {
        let result = this.transform(t.sibling, env);

        const msgs: Msgs = [];
        for (const params of t.child.rows) {
            const testInputs = this.transform(params.getParam(PLAIN_PARAM), env).msgTo(msgs);
            const unique = this.transform(params.getParam("unique"), env).msgTo(msgs);
            const uniqueLits = uniqueLiterals(unique);
            result = result.bind(c => new TestGrammar(c, testInputs, uniqueLits))
                           .bind(c => new LocatorGrammar(params.pos, c));
        }

        return result.msg(msgs)
                     .bind(c => new LocatorGrammar(t.cell.pos, c));
    }
    
    public handleNegativeTest(t: TstTestNot, env: PassEnv): GrammarResult {
        let result = this.transform(t.sibling, env);

        const msgs: Msgs = [];
        for (const params of t.child.rows) {
            const testInputs = this.transform(params.getParam(PLAIN_PARAM), env).msgTo(msgs);
            result = result.bind(c => new TestNotGrammar(c, testInputs))
                           .bind(c => new LocatorGrammar(params.pos, c));
        }
        
        return result.msg(msgs)
                     .bind(c => new LocatorGrammar(t.cell.pos, c));
    }
    
    public handleSequence(t: TstSequence, env: PassEnv): GrammarResult {
        return resultList(t.children)
                  .map(c => this.transform(c, env))
                  .bind(cs => new SequenceGrammar(cs));
    }
    
    public handleAssignment(t: TstAssignment, env: PassEnv): GrammarResult {
        return this.transform(t.child, env);
    }

    public handleCollection(t: TstCollection, env: PassEnv): GrammarResult {
        const newColl = new CollectionGrammar();
        const msgs: Msgs = [];

        for (const child of t.children) {

            const grammar = this.transform(child, env).msgTo(msgs);
            
            if (!(child instanceof TstAssignment)) {
                // at this point, all non-assignment children
                // of collections should have been wrapped in assignments
                throw new Error(`non-assignment child of collection: ${child.constructor.name}`);
            }

            const existingReferent = newColl.getSymbol(child.name);
            if (existingReferent != undefined) {
                // we're reassigning an existing symbol!
                Err('Reassigning existing symbol', 
                    `The symbol ${child.name} already refers to another grammar above.`)
                    .localize(child.pos).msgTo(msgs);
                continue;
            }     
            
            newColl.symbols[child.name] = grammar;
        }

        return newColl.msg(msgs)
                      .bind(c => new LocatorGrammar(t.pos, c));
    }
}

function getFilterTape(h: Header): string | undefined {
    switch (h.tag) {
        case "tape": return h.text;
        case "equals":
        case "starts":
        case "ends":
        case "contains": return getFilterTape(h.child);
        default: return undefined;
    }
}