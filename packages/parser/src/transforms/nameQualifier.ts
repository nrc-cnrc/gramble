import { 
    EmbedGrammar,
    Grammar,
    NsGrammar,
    UnresolvedEmbedGrammar
} from "../grammars";

import { IdentityTransform } from "./transforms";


export class NameQualifierTransform extends IdentityTransform<NsGrammar[] > {

    public transform(g: Grammar): Grammar {

        const newNamespace = new NsGrammar(g.cell, "");

        const newG = g.accept(this, newNamespace, []);

        const defaultSymbol = newNamespace.symbols.get("");
        if (defaultSymbol == undefined) {
            const defaultRef = (newG instanceof NsGrammar) 
                                ? newNamespace.getDefaultSymbol() 
                                : newG;
            newNamespace.addSymbol("", defaultRef);
        }

        return newNamespace;
    }

    public transformNamespace(
        g: NsGrammar,
        ns: NsGrammar,
        args: NsGrammar[]
    ): Grammar {
        const newStack = [ ...args, g ];
        for (const [name, child] of g.symbols) {
            if (child instanceof NsGrammar) {
                child.accept(this, ns, newStack) as NsGrammar;
            } else {
                const newName = g.calculateQualifiedName(name, newStack);
                const result = child.accept(this, ns, newStack);
                ns.addSymbol(newName, result);
            }
        }
        const defaultName = g.calculateQualifiedName("", newStack);
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
        args: NsGrammar[]
    ): Grammar {
        let resolution: [string, Grammar] | undefined = undefined;
        for (let i = args.length-1; i >=0; i--) {
            // we go down the stack asking each to resolve it
            const subStack = args.slice(0, i+1);
            resolution = args[i].resolveName(g.name, subStack);
            if (resolution != undefined) {              
                const [qualifiedName, referent] = resolution;
                return new EmbedGrammar(g.cell, qualifiedName, ns);
            }
        }
        return g;
    }

}
