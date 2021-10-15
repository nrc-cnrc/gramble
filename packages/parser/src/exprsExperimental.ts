import { BinaryExpr, constructListExpr, CounterStack, EpsilonExpr, Expr, NULL, NullExpr, UnionExpr } from "./exprs";
import { Tape, Token } from "./tapes";
import { Gen } from "./util";

/**
 * These are just a bunch of expressions that I'm not currently
 * using, but don't want to delete the code because I might need
 *  them in the future.
 */

class UniverseExpr extends Expr {

    public get id(): string {
        return `Σ*`;
    }
    
    public delta(tape: Tape, stack: CounterStack): Expr {
        return this;
    }
    
    public *deriv(
        tape: Tape, 
        target: Token,
        stack: CounterStack
    ): Gen<[Tape, Token, Expr]> {
        yield [tape, target, this];
    }
}  

class TokenExpr extends Expr {

    constructor(
        public tape: string,
        public token: Token,
        public next: Expr
    ) {
        super();
    }

    public get id(): string {
        return `Token${this.next.id}`;
    }
        
    public delta(tape: Tape, stack: CounterStack): Expr {
        const matchedTape = tape.matchTape(this.tape);
        if (matchedTape == undefined) {
            return this;
        }
        return NULL;
    }
        
    public *deriv(
        tape: Tape, 
        target: Token,
        stack: CounterStack
    ): Gen<[Tape, Token, Expr]> {
        
        const matchedTape = tape.matchTape(this.tape);
        if (matchedTape == undefined) {
            return;
        }

        const result = matchedTape.match(this.token, target);
        if (result.isEmpty()) {
            return;
        }
        yield [matchedTape, result, this.next];
    }
}

/**
 * DisjointUnionExpr is a union where the results are disjoint.
 * Be warned that it does not *guarantee* this in code in any way;
 * rather, you should only use it in situations where you know
 * that the results of A and B will be disjoint (e.g. when 
 * storing the results of a disjointDeriv).
 */
class DisjointUnionExpr extends BinaryExpr {
    
    public get id(): string {
        return `(${this.child1.id}||${this.child2.id})`;
    }
    
    public delta(tape: Tape, stack: CounterStack): Expr {
        return constructDisjointAlternation( this.child1.delta(tape, stack),
                             this.child2.delta(tape, stack));
    }

    public *deriv(
        tape: Tape, 
        target: Token, 
        stack: CounterStack
    ): Gen<[Tape, Token, Expr]> {
        
        var remainder = new Token(target.bits.clone());
        for (const [c1tape, c1target, c1next] of 
                this.child1.deriv(tape, target, stack)) {
            yield [c1tape, c1target, c1next];
            remainder = remainder.andNot(c1target);
            if (remainder.isEmpty()) {
                return;
            }
        }

        yield* this.child2.deriv(tape, remainder, stack);
    }
}


export function constructDisjointAlternation(...children: Expr[]): Expr {
    return constructListExpr(children, constructBinaryDisjointUnion, NULL);
}

export function constructBinaryDisjointUnion(c1: Expr, c2: Expr): Expr {
    if (c1 instanceof NullExpr) {
        return c2;
    }
    if (c2 instanceof NullExpr) {
        return c1;
    }
    if (c1 instanceof EpsilonExpr && c2 instanceof EpsilonExpr) {
        return c1;
    }
    if (c1 instanceof DisjointUnionExpr) {
        const head = c1.child1;
        const tail = constructBinaryDisjointUnion(c1.child2, c2);
        return constructBinaryDisjointUnion(head, tail);
    }
    return new DisjointUnionExpr(c1, c2);
}
