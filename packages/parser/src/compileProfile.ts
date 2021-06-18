


import { Epsilon, Seq, Uni } from "../src/stateMachine";
import { CounterStack, Literalizer, State } from "../src/stateMachine";

const text = Literalizer("text");

const letters = "abcdefghij";

function randomLetter(): string {
    return letters[Math.floor(Math.random() * letters.length)];
}

function randomWord(length: number): string {
    var result = "";
    for (var i = 0; i < length; i++) {
        result += randomLetter();
    }
    return result;
}

const word = randomWord(10);
console.log(word);

function randomLiteral(length: number = 10): State {
    return text(randomWord(length));
}

function randomUnion(recursion: number = 0, numOptions: number = 10000, wordLength: number = 5): State {
    const children: State[] = [];
    for (var i = 0; i < numOptions-1; i++) {
        const grandChildren: State[] = [];
        if (recursion > 0) {
            grandChildren.push(randomUnion(recursion-1, numOptions, wordLength));
        }
        grandChildren.push(randomLiteral(wordLength));
        children.push(Seq(...grandChildren))
    }

    const grandChildren: State[] = [];
    if (recursion > 0) {
        grandChildren.push(randomUnion(recursion-1, numOptions, wordLength));
    }
    grandChildren.push(text("aaaaa"));
    children.push(Seq(...grandChildren));

    return Uni(...children);
}

const u = randomUnion();

/*
var startTime = Date.now();
console.log([...u.parse({text:"aaaaa"})]);
console.log(`Found parse: ${Date.now()-startTime}ms`);

startTime = Date.now();
const compiledU = u.compile(new CounterStack(0));
console.log(`Compiled: ${Date.now()-startTime}ms`);

var startTime = Date.now();
console.log([...compiledU.parse({text:"aaaaa"})]);
console.log(`Found parse: ${Date.now()-startTime}ms`);
*/