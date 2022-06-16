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
export class NameQualifierTransform extends IdentityTransform<[string, NsGrammar][] > {

    public transform(g: NsGrammar): NsGrammar {
        const newNamespace = new NsGrammar(g.cell);
        g.accept(this, newNamespace, [["", g]]); // the return value is meaningless here, all of the
                                            // embeds get attached to newNamespace, so we don't bother
                                            // assigning it to anything
        return newNamespace;
    }
    
    public get desc(): string {
        return "Qualifying names";
    }

    public transformNamespace(
        g: NsGrammar,
        ns: NsGrammar,
        args: [string, NsGrammar][]
    ): Grammar {
        const stackNames = args.map(([n,g]) => n);
        for (const [name, child] of g.symbols) {
            if (child instanceof NsGrammar) {
                const newStack: [string, NsGrammar][] = [ ...args, [name, child] ];
                child.accept(this, ns, newStack) as NsGrammar;
            } else {
                const newName = g.calculateQualifiedName(name, stackNames);
                const result = child.accept(this, ns, args);
                ns.addSymbol(newName, result);
            }
        }
        const defaultName = g.calculateQualifiedName("", stackNames);
        const defaultSymbol = ns.symbols.get(defaultName);
        if (defaultSymbol == undefined) {
            const defaultRef = ns.getDefaultSymbol();
            ns.addSymbol(defaultName, defaultRef);
        }
        return g;
    }

    public transformUnresolvedEmbed(
        g: UnresolvedEmbedGrammar, 
        ns: NsGrammar,
        args: [string, NsGrammar][]
    ): Grammar {
        let resolution: [string, Grammar] | undefined = undefined;
        for (let i = args.length-1; i >=0; i--) {
            // we go down the stack asking each to resolve it
            const subStack = args.slice(0, i+1);
            const topOfStack = subStack[i][1];
            const stackNames = subStack.map(([n,g]) => n);
            resolution = topOfStack.resolveName(g.name, stackNames);
            if (resolution != undefined) {              
                const [qualifiedName, referent] = resolution;
                return new EmbedGrammar(g.cell, qualifiedName, ns);
            }
        }
        return g;
    }

}
