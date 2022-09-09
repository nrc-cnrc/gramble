import { 
    EmbedGrammar,
    Grammar,
    NsGrammar,
    UnresolvedEmbedGrammar
} from "../grammars";

import { IdentityTransform } from "./transforms";

/**
 * The NameQualifierTransform goes through the tree and 
 * 
 * (1) flattens the Namespace structure, replacing the potentially complex tree of 
 * namespaces with a single one at the root, and
 * 
 * (2) replaces UnresolvedEmbedGrammars, which contain simple symbol names (like "VERB"),
 * with EmbedGrammars, which contain fully-qualified names (like "MainSheet.VERB") and a 
 * reference to the namespace.
 */
export class NameQualifierTransform extends IdentityTransform {

    constructor(
        ns: NsGrammar,
        public nsStack: [string, NsGrammar][] = []
    ) {
        super(ns);
    }

    public transform(): NsGrammar {
        const newNamespace = new NsGrammar(this.ns.cell);
        const newStack: [string, NsGrammar][] = [["", this.ns]];
        const newTransform = new NameQualifierTransform(newNamespace, newStack);
        this.ns.accept(newTransform); // the return value is meaningless here, all of the
                                    // embeds get attached to newNamespace, so we don't bother
                                    // assigning it to anything
        return newNamespace;
    }
    
    public get desc(): string {
        return "Qualifying names";
    }

    public transformNamespace(
        g: NsGrammar
    ): Grammar {
        const stackNames = this.nsStack.map(([n,g]) => n);
        for (const [name, child] of g.symbols) {
            if (child instanceof NsGrammar) {
                const newStack: [string, NsGrammar][] = [ ...this.nsStack, [name, child] ];
                const newTransform = new NameQualifierTransform(this.ns, newStack);
                child.accept(newTransform) as NsGrammar;
            } else {
                const newName = g.calculateQualifiedName(name, stackNames);
                const result = child.accept(this);
                this.ns.addSymbol(newName, result);
            }
        }
        const defaultName = g.calculateQualifiedName("", stackNames);
        const defaultSymbol = this.ns.symbols.get(defaultName);
        if (defaultSymbol == undefined) {
            const defaultRef = this.ns.getDefaultSymbol();
            this.ns.addSymbol(defaultName, defaultRef);
        }
        return g;
    }

    public transformUnresolvedEmbed(g: UnresolvedEmbedGrammar): Grammar {
        let resolution: [string, Grammar] | undefined = undefined;
        for (let i = this.nsStack.length-1; i >=0; i--) {
            // we go down the stack asking each to resolve it
            const subStack = this.nsStack.slice(0, i+1);
            const topOfStack = subStack[i][1];
            const stackNames = subStack.map(([n,g]) => n);
            resolution = topOfStack.resolveName(g.name, stackNames);
            if (resolution != undefined) {              
                const [qualifiedName, referent] = resolution;
                return new EmbedGrammar(g.cell, qualifiedName, this.ns);
            }
        }
        return g;
    }

}
