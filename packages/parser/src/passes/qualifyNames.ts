import { MissingSymbolError, Msgs, Result, resultDict, resultList } from "../msgs";
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
import { Dict } from "../util";

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

        // we keep a stack of the old namespaces, in which we'll
        // attempt to find the referents of embedded symbols
        const names: string[] = [""];
        const grammars: NsGrammar[] = [g];
        const newThis = new QualifyNames(names, grammars);

        return newThis.transform(g, env)
            .bind(_ => new NsGrammar(env.symbolNS.entries));

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
        const newSymbols: Dict<Grammar> = {};
        const msgs: Msgs = [];

        const entries = Object.entries(g.symbols);
        for (let i = 0; i < entries.length; i++) {
            const [k, v] = entries[i];
            const lastChild = i == entries.length-1;

            let newV: Grammar;
            if (v instanceof NsGrammar) {
                const newNameStack = [ ...this.nameStack, k ];
                const newGrammarStack = [ ...this.nsStack, v ];
                const newThis = new QualifyNames(newNameStack, newGrammarStack);
                newV = newThis.transform(v, env)
                                 .msgTo(msgs);
            } else {
                const newName = g.calculateQualifiedName(k, this.nameStack);
                newV = this.transform(v, env)
                                 .msgTo(msgs);
                env.symbolNS.set(newName, newV);
            }

            newSymbols[k] = newV;

            if (lastChild) {
                const defaultName = g.calculateQualifiedName("", this.nameStack);
                const defaultSymbol = env.symbolNS.attemptGet(defaultName);
                if (defaultSymbol == undefined) {
                    const defaultRef = newV.getDefaultSymbol();
                    env.symbolNS.set(defaultName, defaultRef);
                }
            }
        }
        
        const r = new NsGrammar(newSymbols);
        return r.msg(msgs);
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
                const result = new EmbedGrammar(qualifiedName);
                return result.msg();
            }
        }

        // didn't find it
        const msg = new MissingSymbolError(g.name);
        return new EpsilonGrammar().msg(msg);
    }

}
