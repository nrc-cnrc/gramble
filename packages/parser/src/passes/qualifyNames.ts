import { MissingSymbolError, Msgs, Result } from "../msgs";
import { 
    CounterStack,
    EmbedGrammar,
    EpsilonGrammar,
    Grammar,
    GrammarPass,
    GrammarResult,
    Ns,
    NsGrammar
} from "../grammars";
import { Pass, PassEnv } from "../passes";

/**
 * Goes through the tree and 
 * 
 * (1) flattens the Namespace structure, replacing the 
 * potentially complex tree of namespaces with a single 
 * one at the root
 * 
 * (2) replaces unqualified symbol references (like "VERB") to 
 * fully-qualified names (like "MainSheet.VERB")
 * 
 * (3) gives EmbedGrammars reference to the namespace they'll need
 * to reference that symbol later.
 */
export class QualifyNames extends Pass<Grammar,Grammar> {

    constructor(
        public nsStack: [string, NsGrammar][] = []
    ) {
        super();
    }

    public transformRoot(g: Grammar, env: PassEnv): Result<Grammar> {
        
        if (!(g instanceof NsGrammar)) {
            throw new Error("QualifyNames requires an NsGrammar root");
        }

        // the root of the tree is the existing namespace
        // we'll be replacing that with the new one in env.
        // this will then be the only namespace in the tree.
        env.ns = new NsGrammar();

        // we keep a stack of the old namespaces, in which we'll
        // attempt to find the referents of embedded symbols
        const startingStack: [string, NsGrammar][] = [["", g]];
        const newThis = new QualifyNames(startingStack);

        return newThis.transform(g, env)
                      .bind(_ => env.ns);
    }

    public transform(g: Grammar, env: PassEnv): GrammarResult {
        
        switch(g.constructor) {
            case NsGrammar:
                return this.transformNamespace(g as NsGrammar, env);
            case EmbedGrammar:
                return this.transformEmbed(g as EmbedGrammar, env);
            default: 
                return g.mapChildren(this, env) as GrammarResult;
        }

    }
    
    public get desc(): string {
        return "Qualifying names";
    }

    public transformNamespace(g: NsGrammar, env: PassEnv): GrammarResult {
        const stackNames = this.nsStack.map(([n,g]) => n);
        const msgs: Msgs = [];

        for (const [k, v] of Object.entries(g.symbols)) {
            if (v instanceof NsGrammar) {
                const newStack: [string, NsGrammar][] = [ ...this.nsStack, [k, v] ];
                const newThis = new QualifyNames(newStack);
                const _ = newThis.transform(v, env)
                                 .msgTo(msgs);
            } else {
                const newName = g.calculateQualifiedName(k, stackNames);
                const newV = this.transform(v, env)
                                 .msgTo(msgs);
                env.ns.addSymbol(newName, newV);
            }
        }
        const defaultName = g.calculateQualifiedName("", stackNames);
        const defaultSymbol = env.ns.symbols[defaultName];
        if (defaultSymbol == undefined) {
            const defaultRef = env.ns.getDefaultSymbol();
            env.ns.addSymbol(defaultName, defaultRef);
        }
        return g.msg(msgs);  // doesn't actually matter what grammar
                             // we return here; it gets ignored
    }

    public transformEmbed(g: EmbedGrammar, env: PassEnv): GrammarResult {
        let resolution: [string, Grammar] | undefined = undefined;
        for (let i = this.nsStack.length-1; i >=0; i--) {
            // we go down the stack asking each to resolve it
            const subStack = this.nsStack.slice(0, i+1);
            const topOfStack = subStack[i][1];
            const stackNames = subStack.map(([n,g]) => n);
            resolution = topOfStack.resolveName(g.name, stackNames);
            if (resolution != undefined) {              
                const [qualifiedName, _] = resolution;
                const result = new EmbedGrammar(qualifiedName, env.ns);
                return result.msg();
            }
        }

        // didn't find it
        const msg = new MissingSymbolError(g.name);
        return new EpsilonGrammar().msg(msg);
    }

}
