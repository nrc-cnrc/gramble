import { MissingSymbolError, Msgs } from "../msgs";
import { 
    EmbedGrammar,
    EpsilonGrammar,
    Grammar,
    NsGrammar
} from "../grammars";

import { IdentityTransform } from "./transforms";

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

    public transform(): [NsGrammar, Msgs] {
        const newNamespace = new NsGrammar();
        const newStack: [string, NsGrammar][] = [["", this.ns]];
        const newTransform = new NameQualifierTransform(newNamespace, newStack);
        const [_, msgs] = this.ns.accept(newTransform);
        return [newNamespace, msgs];
    }
    
    public get desc(): string {
        return "Qualifying names";
    }

    public transformNamespace(g: NsGrammar): [Grammar, Msgs] {
        const stackNames = this.nsStack.map(([n,g]) => n);
        const msgs: Msgs = [];

        for (const [name, child] of g.symbols) {
            if (child instanceof NsGrammar) {
                const newStack: [string, NsGrammar][] = [ ...this.nsStack, [name, child] ];
                const newTransform = new NameQualifierTransform(this.ns, newStack);
                const [_, ms] = child.accept(newTransform);
                msgs.push(...ms);
            } else {
                const newName = g.calculateQualifiedName(name, stackNames);
                const [result, ms] = child.accept(this);
                this.ns.addSymbol(newName, result);
                msgs.push(...ms);
            }
        }
        const defaultName = g.calculateQualifiedName("", stackNames);
        const defaultSymbol = this.ns.symbols.get(defaultName);
        if (defaultSymbol == undefined) {
            const defaultRef = this.ns.getDefaultSymbol();
            this.ns.addSymbol(defaultName, defaultRef);
        }
        return [g, msgs];
    }

    public transformEmbed(g: EmbedGrammar): [Grammar, Msgs] {
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
                return [result, []];
            }
        }

        // didn't find it
        const result = new EpsilonGrammar();
        const msg = new MissingSymbolError(g.name);
        return [result, [msg]];
    }

}
