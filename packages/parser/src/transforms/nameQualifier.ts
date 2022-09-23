import { MissingSymbolError, Msgs, Result } from "../msgs";
import { 
    EmbedGrammar,
    EpsilonGrammar,
    Grammar,
    GrammarResult,
    NsGrammar
} from "../grammars";

import { IdentityTransform } from "./transforms";
import { TransEnv } from "../transforms";

/**
 * The NameQualifierTransform goes through the tree and 
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
export class NameQualifierTransform extends IdentityTransform {

    constructor(
        ns: NsGrammar,
        public nsStack: [string, NsGrammar][] = []
    ) {
        super(ns);
    }

    public transform(env: TransEnv): Result<NsGrammar> {
        const newNamespace = new NsGrammar();
        const newStack: [string, NsGrammar][] = [["", this.ns]];
        const newTransform = new NameQualifierTransform(newNamespace, newStack);
        const result = this.ns.accept(newTransform, env);
        return result.bind(r => newNamespace); // throw out the resulting namespace, 
                                               // we only care about this new one
    }
    
    public get desc(): string {
        return "Qualifying names";
    }

    public transformNamespace(g: NsGrammar, env: TransEnv): GrammarResult {
        const stackNames = this.nsStack.map(([n,g]) => n);
        const msgs: Msgs = [];

        for (const [k, v] of g.symbols) {
            if (v instanceof NsGrammar) {
                const newStack: [string, NsGrammar][] = [ ...this.nsStack, [k, v] ];
                const newTransform = new NameQualifierTransform(this.ns, newStack);
                const [_, ms] = v.accept(newTransform, env).destructure();
                msgs.push(...ms);
            } else {
                const newName = g.calculateQualifiedName(k, stackNames);
                const [newV, ms] = v.accept(this, env).destructure();
                this.ns.addSymbol(newName, newV);
                msgs.push(...ms);
            }
        }
        const defaultName = g.calculateQualifiedName("", stackNames);
        const defaultSymbol = this.ns.symbols.get(defaultName);
        if (defaultSymbol == undefined) {
            const defaultRef = this.ns.getDefaultSymbol();
            this.ns.addSymbol(defaultName, defaultRef);
        }
        return g.msg(msgs); // doesn't really matter what the
                            // result.item is, it'll be discarded anyway
    }

    public transformEmbed(g: EmbedGrammar, env: TransEnv): GrammarResult {
        let resolution: [string, Grammar] | undefined = undefined;
        for (let i = this.nsStack.length-1; i >=0; i--) {
            // we go down the stack asking each to resolve it
            const subStack = this.nsStack.slice(0, i+1);
            const topOfStack = subStack[i][1];
            const stackNames = subStack.map(([n,g]) => n);
            resolution = topOfStack.resolveName(g.name, stackNames);
            if (resolution != undefined) {              
                const [qualifiedName, _] = resolution;
                const result = new EmbedGrammar(qualifiedName, this.ns);
                return result.msg();
            }
        }

        // didn't find it
        const msg = new MissingSymbolError(g.name);
        return new EpsilonGrammar().msg([msg]);
    }

}
