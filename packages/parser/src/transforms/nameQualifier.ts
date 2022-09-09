import { Errs } from "../util";
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

    public transform(): [NsGrammar, Errs] {
        const newNamespace = new NsGrammar(this.ns.cell);
        const newStack: [string, NsGrammar][] = [["", this.ns]];
        const newTransform = new NameQualifierTransform(newNamespace, newStack);
        const [_, errs] = this.ns.accept(newTransform);
        return [newNamespace, errs];
    }
    
    public get desc(): string {
        return "Qualifying names";
    }

    public transformNamespace(g: NsGrammar): [Grammar, Errs] {
        const stackNames = this.nsStack.map(([n,g]) => n);
        const errs: Errs = [];

        for (const [name, child] of g.symbols) {
            if (child instanceof NsGrammar) {
                const newStack: [string, NsGrammar][] = [ ...this.nsStack, [name, child] ];
                const newTransform = new NameQualifierTransform(this.ns, newStack);
                child.accept(newTransform);
            } else {
                const newName = g.calculateQualifiedName(name, stackNames);
                const [result, es] = child.accept(this);
                this.ns.addSymbol(newName, result);
                errs.push(...es);
            }
        }
        const defaultName = g.calculateQualifiedName("", stackNames);
        const defaultSymbol = this.ns.symbols.get(defaultName);
        if (defaultSymbol == undefined) {
            const defaultRef = this.ns.getDefaultSymbol();
            this.ns.addSymbol(defaultName, defaultRef);
        }
        return [g, errs];
    }

    public transformUnresolvedEmbed(g: UnresolvedEmbedGrammar): [Grammar, Errs] {
        let resolution: [string, Grammar] | undefined = undefined;
        for (let i = this.nsStack.length-1; i >=0; i--) {
            // we go down the stack asking each to resolve it
            const subStack = this.nsStack.slice(0, i+1);
            const topOfStack = subStack[i][1];
            const stackNames = subStack.map(([n,g]) => n);
            resolution = topOfStack.resolveName(g.name, stackNames);
            if (resolution != undefined) {              
                const [qualifiedName, referent] = resolution;
                const result = new EmbedGrammar(g.cell, qualifiedName, this.ns);
                return [result, []];
            }
        }
        return [g, []];
    }

}
