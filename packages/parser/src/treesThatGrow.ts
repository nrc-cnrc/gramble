
type Plain = "Plain";
type Taped = "Taped";
type Loc = "Loc";

type Mixins = {
    Loc: { row: number, col: number },
    Taped: { tapes: string },
    Plain: object;
}

type Mixin = keyof Mixins;
type ASTNode<M extends Mixin = Plain> = Seq<M> | Lit<M>;

type Seq<M extends Mixin = Plain> = { 
    tag: "seq", 
    children: ASTNode<M>[] 
} & Mixins[M];

type Lit<M extends Mixin = Plain> = {
    tag: "lit",
    tape: string,
    text: string
} & Mixins[M];

function Seq(...cs: ASTNode[]): Seq {
    return { tag: "seq", children: cs };
}

function Lit(tape: string, text: string): Lit {
    return { tag: "lit", tape: tape, text: text };
}

const t1 = (text: string) => Lit("t1", text);
const t2 = (text: string) => Lit("t2", text);
const t3 = (text: string) => Lit("t3", text);

type Pass<T1,T2> = (t: T1) => T2;

export function mapAny<T>(x: any, f: Pass<T,any>): any {
    if (x instanceof Object && "tag" in x) {
        return f(x as T);
    } else if (Array.isArray(x)) {
        return mapArray(x, f);
    } else {
        return x;
    }
}

export function mapArray<T>(xs: any[], f: Pass<T,any>): any[] {
    const results: any[] = [];
    for (const x of xs) {
        const newX = mapAny(x, f);
        results.push(newX);
    }
    return results;
}

export function mapNode<T,T2>(x: any, f: Pass<T,T2>): T2 {
    const results = Object.create(Object.getPrototypeOf(x));
    for (const [k, v] of Object.entries(x)) {
        if (!x.hasOwnProperty(k)) continue;
        const newX = mapAny(v, f);
        results[k] = newX;
    }
    return results as T2;
}

function reverse(t: ASTNode): ASTNode {
    //const newT = mapObj(t, foldSeq);
    switch (t.tag) {
        case "seq": 
            const newT = mapNode(t, reverse) as Seq;
            return Seq(...newT.children.reverse());
        case "lit":
            return mapNode(t, reverse) as Lit;
    }
}

function calcTapes(t: ASTNode): ASTNode<Taped> {
    switch (t.tag) {
        case "seq": 
            const newSeq = mapNode(t, calcTapes) as Seq<Taped>;
            const seqTapes = newSeq.children.map(c => c.tapes);
            return { ...newSeq, tapes: seqTapes.join("&") };
        case "lit":
            return { ...t, tapes: t.tape };
    }
}

function removeTapes(t: ASTNode<Taped>): ASTNode {
    let {tapes: _, ...rest} = t;
    const newT = mapNode(rest, removeTapes);
    return newT;
}

function id<M extends Mixin>(t: ASTNode<M>): string {
    switch(t.tag) {
        case "seq": return "(" + t.children.map(c => id(c)).join("+") + ")";
        case "lit": return `${t.tape}:${t.text}`
    }
}

let row = 0;
let col = 0;
function locate(t: ASTNode): ASTNode<Loc> {
    const newT = mapNode(t, locate);
    row++;
    return {...newT, row: row, col:col };
}

const example = Seq(t1("hello"), Seq(t2("world"), t3("goo")));

const reversed = reverse(example);
const located = locate(reversed);
const taped = calcTapes(located);
console.log(taped);
