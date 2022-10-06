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
        public nameStack: string[] = [],
        public nsStack: NsGrammar[] = []
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
        const names: string[] = [""];
        const grammars: NsGrammar[] = [g];
        const newThis = new QualifyNames(names, grammars);

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
        const msgs: Msgs = [];

        for (const [k, v] of Object.entries(g.symbols)) {
            if (v instanceof NsGrammar) {
                const newNameStack = [ ...this.nameStack, k ];
                const newGrammarStack = [ ...this.nsStack, v ];
                const newThis = new QualifyNames(newNameStack, newGrammarStack);
                const _ = newThis.transform(v, env)
                                 .msgTo(msgs);
            } else {
                const newName = g.calculateQualifiedName(k, this.nameStack);
                const newV = this.transform(v, env)
                                 .msgTo(msgs);
                env.ns.addSymbol(newName, newV);
            }
        }
        const defaultName = g.calculateQualifiedName("", this.nameStack);
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
            const subNsStack = this.nsStack.slice(0, i+1);
            const subNameStack = this.nameStack.slice(0, i+1);
            resolution = subNsStack[i].resolveName(g.name, subNameStack);
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
