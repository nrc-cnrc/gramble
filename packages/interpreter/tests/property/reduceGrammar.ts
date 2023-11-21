import { Epsilon, Seq } from "../../src/grammarConvenience";
import { CollectionGrammar, EpsilonGrammar, Grammar, RenameGrammar, SequenceGrammar } from "../../src/grammars";
import { update } from "../../src/utils/func";
import { randomChoice, range } from "./randomGrammar";

export function reduceGrammar(g: Grammar): Grammar {
    switch (g.tag) {
        case "collection": return reduceCollection(g);
        case "seq":        return reduceSeq(g);
        case "rename":     return reduceRename(g);
    }
    return Epsilon();
}

export function reduceCollection(g: CollectionGrammar): CollectionGrammar {
    if (Math.random() < 0.5) {
        // drop one symbol at random
        return dropCollection(g);
    }
    
    // clone it
    const result = new CollectionGrammar()
    Object.assign(result.symbols, g.symbols);

    // simplify one child at random
    const keys = Object.keys(g.symbols);
    const randomKey = randomChoice(keys);
    result.symbols[randomKey] = reduceGrammar(result.symbols[randomKey]);
    return result;
}

export function dropCollection(g: CollectionGrammar): CollectionGrammar {
    const result = new CollectionGrammar()
    const randomChild = randomChoice(Object.keys(g.symbols));
    for (const key of Object.keys(g.symbols)) {
        if (key === randomChild) continue;
        result.symbols[key] = g.symbols[key];
    }
    return result;
}

export function reduceSeq(g: SequenceGrammar): Grammar {
    if (Math.random() < 0.5) {
        // drop one child at random
        return dropSeq(g);
    }

    // otherwise, reduce one child at random
    const randomIndex = randomChoice(range(g.children.length));
    const newChildren: Grammar[] = [];
    for (let i = 0; i < g.children.length; i++) {
        if (i !== randomIndex) {
            newChildren.push(g.children[i]);
            continue;
        }
        const newChild = reduceGrammar(g.children[i]);
        newChildren.push(newChild);
        
    }
    return simplifySeq(new SequenceGrammar(newChildren));
}

function dropSeq(g: SequenceGrammar): Grammar {
    const randomIndex = randomChoice(range(g.children.length));
    const newChildren: Grammar[] = [];
    for (let i = 0; i < g.children.length; i++) {
        if (i === randomIndex) continue;
        newChildren.push(g.children[i]);
    }
    return simplifySeq(new SequenceGrammar(newChildren));
}

function simplifySeq(g: SequenceGrammar): Grammar {
    const newChildren: Grammar[] = [];
    for (const child of g.children) {
        if (child instanceof EpsilonGrammar) continue;
        if (child instanceof SequenceGrammar) {
            newChildren.push(...child.children);
            continue;
        }
        newChildren.push(child);
    }
    if (newChildren.length === 0) return Epsilon();
    if (newChildren.length === 1) return newChildren[0];
    return new SequenceGrammar(newChildren);


}

export function reduceRename(g: RenameGrammar): Grammar {
    if (Math.random() < 0.5) {
        // drop the renaming
        return g.child;
    }

    // otherwise reduce the child
    const newChild = reduceGrammar(g.child);
    return update(g, { child: newChild });
}