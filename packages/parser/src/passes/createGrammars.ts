import { 
    TstAssignment,
    TstBinary, TstBinaryOp,
    TstEmpty, 
    TstFilter, TstHeaderContentPair, 
    TstHide, TstNamespace, TstNegativeUnitTest, TstRename, 
    TstReplace, 
    TstReplaceTape, TstSequence, TstTable, TstUnitTest 
} from "../tsts";
import { Component } from "../components";
import { Pass, PassEnv } from "../passes";
import { 
    AlternationGrammar,
    EpsilonGrammar, EqualsGrammar, 
    Grammar, GrammarResult, 
    HideGrammar, JoinReplaceGrammar, JoinRuleGrammar, LocatorGrammar, 
    NegativeUnitTestGrammar, 
    NsGrammar, 
    RenameGrammar, ReplaceGrammar, SequenceGrammar, UnitTestGrammar
} from "../grammars";
import { TapeNameHeader } from "../headers";
import { Err, Msgs, resultList, Warn } from "../msgs";
import { BINARY_OPS_MAP, BLANK_PARAM } from "../ops";

/**
 * This is the workhorse of grammar creation, turning the 
 * syntactic tree (of operations, headers, etc., still with reference
 * to units of the program as the programmer wrote them) into
 * grammars, which describe the language being generated (in terms
 * of sequences, alternations, filters, joins, renames, etc.)
 */
export class CreateGrammars extends Pass<Component,Grammar> {

    public get desc(): string {
        return "Creating TST";
    }

    public transform(t: Component, env: PassEnv): GrammarResult {

        switch(t.constructor) {
            case TstHeaderContentPair:
                return this.handleHeaderContentPair(t as TstHeaderContentPair, env);
            case TstRename:
                return this.handleRename(t as TstRename, env);
            case TstHide:
                return this.handleHide(t as TstRename, env);
            case TstFilter:
                return this.handleFilter(t as TstFilter, env);
            case TstEmpty:
                return this.handleEmpty(t as TstEmpty, env);
            case TstBinary:
                return this.handleBinary(t as TstBinary, env);
            case TstTable:
                return this.handleTable(t as TstTable, env);
            case TstBinaryOp:
                return this.handleBinaryOp(t as TstBinaryOp, env);
            case TstReplace:
                return this.handleReplace(t as TstReplace, env);
            case TstReplaceTape:
                return this.handleReplaceTape(t as TstReplaceTape, env);
            case TstUnitTest:
                return this.handleTest(t as TstUnitTest, env);
            case TstNegativeUnitTest:
                return this.handleNegativeTest(t as TstNegativeUnitTest, env);
            case TstSequence:
                return this.handleSequence(t as TstSequence, env);
            case TstAssignment:
                return this.handleAssignment(t as TstAssignment, env);
            case TstNamespace:
                return this.handleNamespace(t as TstNamespace, env);
            default: 
                throw new Error(`unhandled ${t.constructor.name}`);
        }
    }

    public handleHeaderContentPair(t: TstHeaderContentPair, env: PassEnv): GrammarResult {
        return t.header.headerToGrammar(t.cell)
                    .bind(c => new LocatorGrammar(t.cell.pos, c));
    }
    
    public handleRename(t: TstRename, env: PassEnv): GrammarResult {
        if (!(t.header.header instanceof TapeNameHeader)) {
            // TODO: This doesn't seem right
            return new EpsilonGrammar().msg()
                .err("Renaming error",
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
        const [grammar, msgs] = t.header.headerToGrammar(t.cell)
                                        .destructure();
        const result = new EqualsGrammar(prevGrammar, grammar);
        const locatedResult = new LocatorGrammar(t.cell.pos, result);
        return locatedResult.msg(prevMsgs).msg(msgs);
    }
    
    public handleEmpty(t: TstEmpty, env: PassEnv): GrammarResult {
        return new EpsilonGrammar().msg();
    }

    public handleBinary(t: TstBinary, env: PassEnv): GrammarResult {
        // we only ever end up in this base EncloseComponent compile if it wasn't
        // a known operator.  this is an error, but we flag it for the programmer
        // elsewhere.
        return resultList([t.sibling, t.child])
                    .map(c => this.transform(c, env))
                    .bind(([s,c]) => new LocatorGrammar(t.cell.pos, s));
    }

    public handleTable(t: TstTable, env: PassEnv): GrammarResult {
        return resultList(t.child.rows)
                  .map(r => r.getParam(BLANK_PARAM))
                  .map(r => this.transform(r, env))
                  .bind(cs => new AlternationGrammar(cs))
                  .bind(c => new LocatorGrammar(t.cell.pos, c))
    }
    
    public handleBinaryOp(t: TstBinaryOp, env: PassEnv): GrammarResult {
        const op = BINARY_OPS_MAP[t.opName];
        return resultList([t.sibling, t.child])
                    .map(c => this.transform(c, env))
                    .bind(([s,c]) => op(s,c));
    }
    
    public handleReplaceTape(t: TstReplaceTape, env: PassEnv): GrammarResult {

        let [sibling, sibMsgs] = this.transform(t.sibling, env).destructure();
        const replaceRules: ReplaceGrammar[] = [];
        const newMsgs: Msgs = [];

        for (const params of t.child.rows) {
            const fromArg = this.transform(params.getParam("from"), env).msgTo(newMsgs);
            const toArg = this.transform(params.getParam("to"), env).msgTo(newMsgs);
            const preArg = this.transform(params.getParam("pre"), env).msgTo(newMsgs);
            const postArg = this.transform(params.getParam("post"), env).msgTo(newMsgs);
            const replaceRule = new ReplaceGrammar(fromArg, toArg, preArg, postArg,
                new EpsilonGrammar(), false, false, 0, Infinity, Infinity, Infinity,
                true, `${params.pos.sheet}_${params.pos.row}`);
            replaceRules.push(replaceRule);
        }

        if (replaceRules.length == 0) {
            return sibling.msg(sibMsgs).msg(newMsgs);  // in case every rule fails, at least generate something
        }

        let result: Grammar = new JoinRuleGrammar(t.tape, sibling, replaceRules);
        result = new LocatorGrammar(t.cell.pos, result);
        return result.msg(sibMsgs).msg(newMsgs);
    }

    public handleReplace(t: TstReplace, env: PassEnv): GrammarResult {
        let [sibling, sibMsgs] = this.transform(t.sibling, env).destructure();
        const replaceRules: ReplaceGrammar[] = [];
        const newMsgs: Msgs = [];

        for (const params of t.child.rows) {
            const fromArg = this.transform(params.getParam("from"), env).msgTo(newMsgs);
            const toArg = this.transform(params.getParam("to"), env).msgTo(newMsgs);
            const preArg = this.transform(params.getParam("pre"), env).msgTo(newMsgs);
            const postArg = this.transform(params.getParam("post"), env).msgTo(newMsgs);
            const replaceRule = new ReplaceGrammar(fromArg, toArg, preArg, postArg,
                new EpsilonGrammar(), false, false, 0, Infinity, Infinity, Infinity,
                true, `${params.pos.sheet}_${params.pos.row}`);
            replaceRules.push(replaceRule);
        }

        if (replaceRules.length == 0) {
            return sibling.msg(sibMsgs).msg(newMsgs);  // in case every rule fails, at least generate something
        }

        let result: Grammar = new JoinReplaceGrammar(sibling, replaceRules);
        result = new LocatorGrammar(t.cell.pos, result);
        return result.msg(sibMsgs).msg(newMsgs);
    }

    
    public handleTest(t: TstUnitTest, env: PassEnv): GrammarResult {
        let result = this.transform(t.sibling, env);

        const msgs: Msgs = [];
        for (const params of t.child.rows) {
            const testInputs = this.transform(params.getParam(BLANK_PARAM), env).msgTo(msgs);
            const unique = this.transform(params.getParam("unique"), env).msgTo(msgs);
            const uniqueLiterals = unique.getLiterals();
            result = result.bind(c => new UnitTestGrammar(c, testInputs, uniqueLiterals))
                           .bind(c => new LocatorGrammar(params.pos, c));
        }

        return result.msg(msgs)
                     .bind(c => new LocatorGrammar(t.cell.pos, c));
    }
    
    public handleNegativeTest(t: TstNegativeUnitTest, env: PassEnv): GrammarResult {
        let result = this.transform(t.sibling, env);

        const msgs: Msgs = [];
        for (const params of t.child.rows) {
            const testInputs = this.transform(params.getParam(BLANK_PARAM), env).msgTo(msgs);
            result = result.bind(c => new NegativeUnitTestGrammar(c, testInputs))
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

    
    public handleNamespace(t: TstNamespace, env: PassEnv): GrammarResult {
        const ns = new NsGrammar();
        const msgs: Msgs = [];
        for (let i = 0; i < t.children.length; i++) {
            const child = t.children[i];
            const isLastChild = i == t.children.length - 1;
            const grammar = this.transform(child, env).msgTo(msgs);
            if (!(child instanceof TstAssignment) && !isLastChild) {
                // warn that the child isn't going to be assigned to anything
                Warn(
                    "This content doesn't end up being assigned to anything and will be ignored.", 
                    child.pos).msgTo(msgs);
                continue;
            }

            if (child instanceof TstAssignment) {
                const referent = ns.getSymbol(child.name);
                if (referent != undefined) {
                    // we're reassigning an existing symbol!
                    Err('Reassigning existing symbol', 
                        `The symbol ${child.name} already refers to another grammar above.`,
                        child.pos).msgTo(msgs);
                    continue;
                }     
                ns.addSymbol(child.name, grammar);
            } else if (isLastChild) {
                ns.addSymbol("", grammar);
            }
            
        }
        return ns.msg(msgs);
    }
}