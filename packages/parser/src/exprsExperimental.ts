import { BinaryExpr, constructListExpr, CounterStack, EpsilonExpr, Expr, NULL, NullExpr, UnaryExpr, UnionExpr } from "./exprs";
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


class FlatMemoExpr extends UnaryExpr {

    constructor(
        child: Expr,
        public limit: number = 3
    ) {
        super(child);
    }

    //public acceptingOnStart: {[tape: string]: boolean} = {};
    public memoizedDelta: {[tape: string]: Expr} = {};
    public memoizedBits: {[tape: string]: Token} = {};
    public transitions: {[tape: string]: {[c: string]: Expr}} = {};

    public delta(tape: Tape, stack: CounterStack): Expr {
        if (tape.tapeName in this.memoizedDelta) {
            return this.memoizedDelta[tape.tapeName]
        }
        const childExpr = this.child.delta(tape, stack);
        const nextExpr = constructMemo(childExpr, this.limit);
        this.memoizedDelta[tape.tapeName] = nextExpr;
        return nextExpr;
    }
        
    public *disjointDeriv(
        tape: Tape, 
        target: Token,
        stack: CounterStack
    ): Gen<[Tape, Token, Expr]> {
        yield* this.deriv(tape, target, stack);
    }

    public *deriv(
        tape: Tape, 
        target: Token,
        stack: CounterStack
    ): Gen<[Tape, Token, Expr]> {

        if (!(tape.tapeName in this.transitions)) {
            this.transitions[tape.tapeName] = {}
        }

        if (!(tape.tapeName in this.memoizedBits)) {
            this.memoizedBits[tape.tapeName] = tape.none();
        }

        const alreadyMemoized = this.memoizedBits[tape.tapeName];
        const targetMemoized = target.and(alreadyMemoized);
        const targetUnmemoized = target.andNot(alreadyMemoized);

        //console.log(`looking for ${tape.fromToken(tape.tapeName, target)}`);
        //console.log(`already memoized ${tape.fromToken(tape.tapeName, alreadyMemoized)}`);

        // first go through any memoized results
        for (const c of tape.fromToken(tape.tapeName, targetMemoized)) {
            const nextToken = new Token(tape.toBits(tape.tapeName, c));
            const nextExpr = this.transitions[tape.tapeName][c];
            if (nextExpr == undefined) {
                throw new Error(`we thought we had memoized ${c} but hadn't`);
            }
            if (nextExpr instanceof NullExpr) {
                continue;
            }
            yield [tape, nextToken, nextExpr];
        }

        let remainder: Token = new Token(targetUnmemoized.bits.clone());
        // then take the remainder and memoize them
        for (const [childTape, childToken, childExpr] of 
                this.child.disjointDeriv(tape, targetUnmemoized, stack)) {
            remainder = remainder.andNot(childToken); // remove them from the remainder
            this.memoizedBits[childTape.tapeName] = this.memoizedBits[childTape.tapeName].or(childToken)
            for (const c of childTape.fromToken(tape.tapeName, childToken)) {
                this.transitions[childTape.tapeName][c] = childExpr;
                const nextToken = new Token(tape.toBits(tape.tapeName, c));
                const nextExpr = constructMemo(childExpr, this.limit -1);
                yield [tape, nextToken, nextExpr];
            }
        }

        // any remaining bits are null
        this.memoizedBits[tape.tapeName] = this.memoizedBits[tape.tapeName].or(remainder);
        for (const c of tape.fromToken(tape.tapeName, remainder)) {
            this.transitions[tape.tapeName][c] = NULL;
        }
    }
}

class MemoExpr extends UnaryExpr {


    constructor(
        child: Expr,
        public limit: number = 3
    ) {
        super(child);
    }

    //public acceptingOnStart: {[tape: string]: boolean} = {};
    public transitionsByTape: {[tape: string]: [Tape, Token, Expr][]} = {};

    public addTransition(queryTape: Tape,
                        resultTape: Tape,
                        token: Token,
                        next: Expr): void {
        if (!(queryTape.tapeName in this.transitionsByTape)) {
            this.transitionsByTape[queryTape.tapeName] = [];
        }
        this.transitionsByTape[queryTape.tapeName].push([resultTape, token, next]);
    }

    public delta(tape: Tape, stack: CounterStack): Expr {
        const childNext = this.child.delta(tape, stack);
        return constructMemo(childNext, this.limit);
    }
        
    public *disjointDeriv(
        tape: Tape, 
        target: Token,
        stack: CounterStack
    ): Gen<[Tape, Token, Expr]> {
        yield* this.deriv(tape, target, stack);
    }

    public *deriv(
        tape: Tape, 
        target: Token,
        stack: CounterStack
    ): Gen<[Tape, Token, Expr]> {

        let transitions = this.transitionsByTape[tape.tapeName];
        if (transitions == undefined) {
            this.transitionsByTape[tape.tapeName] = [];
            transitions = [];
        }

        let remainder = new Token(target.bits.clone());

        // first we go through results we've tried before
        for (const [origResultTape, token, next] of transitions) {
            /*if (origResultTape.isTrivial) { // no vocab, so no possible results
                yield [origResultTape, token, next];
                return;
            } */

            if (remainder.isEmpty()) {
                return;
            }
            
            if (next instanceof NullExpr) {
                continue;
            }

            const matchedTape = tape.matchTape(origResultTape.tapeName);
            if (matchedTape == undefined) {
                throw new Error(`Failed to match ${tape.tapeName} to ${origResultTape.tapeName}..?`);
            }
            
            const resultToken = matchedTape.match(token, remainder);
            if (resultToken.isEmpty()) {
                continue;
            }
            
            yield [matchedTape, resultToken, next];

            remainder = remainder.andNot(resultToken);
        }

        if (remainder.isEmpty()) {
            return;
        }

        // if we get here, remainder is non-empty, meaning we haven't
        // yet memoized everything.  we have to ask the child about 
        // what remains.
        for (const [cTape, cTarget, cNext] of this.child.disjointDeriv(tape, remainder, stack)) {
            
            //if (cNext instanceof NullExpr) {
            //    continue;
            //}

            const shared = cTarget.and(remainder);
            const successor = constructMemo(cNext, this.limit - 1);
            yield [cTape, shared, successor];
            this.addTransition(tape, cTape, shared, successor);
            remainder = remainder.andNot(shared);
            if (remainder.isEmpty()) {
                return;
            }
        }

        // if we get here, there are characters that don't match any result.  we don't
        // want to forever keep querying the child for characters we know don't have any 
        // result, so we remember that they're Null
        this.addTransition(tape, tape, remainder, NULL);
    }
}


export function constructMemo(child: Expr, limit: number = 3): Expr {
    if (limit <= 0) {
        return child;
    }
    if (child instanceof EpsilonExpr) {
        return child;
    }
    if (child instanceof NullExpr) {
        return child;
    }
    return new FlatMemoExpr(child, limit);
}