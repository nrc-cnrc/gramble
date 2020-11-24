import {Seq, Uni, Join, Emb, SymbolTable, Namespace} from "../src/stateMachine";
import { text, testNumOutputs, testHasOutput, t1, t2, t3 } from './testUtils';


/**
 * Embedding tests
 */

describe('Symbol containing text:hello', function() {
    const symbolTable = new Namespace({ "s": text("hello") });
    const grammar = Emb("s", symbolTable);
    const outputs = [...grammar.generate()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello");
}); 

describe('Symbol containing text:hello+text:world', function() {
    const symbolTable = new Namespace({ "s": Seq(text("hello"), text("world")) });
    const grammar = Emb("s", symbolTable);
    const outputs = [...grammar.generate()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "helloworld");
}); 

describe('Symbol containing text:hello|text:goodbye', function() {
    const symbolTable = new Namespace({ "s": Uni(text("hello"), text("goodbye")) });
    const grammar = Emb("s", symbolTable);
    const outputs = [...grammar.generate()];
    testNumOutputs(outputs, 2);
    testHasOutput(outputs, "text", "hello");
    testHasOutput(outputs, "text", "goodbye");
}); 

describe('Symbol of (t1:hi & t1:hi+t2:bye)', function() {
    const symbolTable = new Namespace({ "hi2bye" : Join(t1("hi"), Seq(t1("hi"), t2("bye"))) });
    const outputs = [...Emb("hi2bye", symbolTable).generate()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t2", "bye");
}); 

describe('Joining sym(t1:hi & t1:hi+t2:bye) & t2:bye+t3:yo', function() {
    const symbolTable = new Namespace({ "hi2bye" : Join(t1("hi"), Seq(t1("hi"), t2("bye"))) });
    const grammar = Join(Emb("hi2bye", symbolTable), Seq(t2("bye"), t3("yo")));
    const outputs = [...grammar.generate()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t3", "yo");
}); 

describe('Joining t1:hi & sym(t1:hi+t2:bye & t2:bye+t3:yo)', function() {
    const symbolTable = new Namespace({ "hi2yo": Join(Seq(t1("hi"), t2("bye")), Seq(t2("bye"), t3("yo")))});
    const grammar = Join(t1("hi"), Emb("hi2yo", symbolTable));
    const outputs = [...grammar.generate()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t3", "yo");
});  


describe('Joining of sym(t1:hi & t1:hi+t2:bye)+t2:world', function() {
    const symbolTable = new Namespace({ "hi2bye" : Join(t1("hi"), Seq(t1("hi"), t2("bye"))) });
    const grammar = Seq(Emb("hi2bye", symbolTable), t2("world")); 
    const outputs = [...grammar.generate()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t2", "byeworld");
}); 

describe('Joining "helloworld" with right-recursive "hello+ world"', function() {
    const symbolTable = new Namespace();
    const world = Uni(text("world"), Emb("helloWorld", symbolTable))
    const helloWorld = Seq(text("hello"), world);
    symbolTable.addSymbol("helloWorld", helloWorld);

    const grammar = Join(text("helloworld"), helloWorld);
    const outputs = [... grammar.generate()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "helloworld");
});


describe('Joining right-recursive "hello+ world" with "helloworld"', function() {
    const symbolTable = new Namespace();
    const world = Uni(text("world"), Emb("helloWorld", symbolTable))
    const helloWorld = Seq(text("hello"), world);
    symbolTable.addSymbol("helloWorld", helloWorld);

    const grammar = Join(helloWorld, text("helloworld"));
    const outputs = [... grammar.generate()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "helloworld");
});

describe('Joining "hellohelloworld" with right-recursive "hello+ world"', function() {
    const symbolTable = new Namespace();
    const world = Uni(text("world"), Emb("helloWorld", symbolTable))
    const helloWorld = Seq(text("hello"), world);
    symbolTable.addSymbol("helloWorld", helloWorld);

    const grammar = Join(text("hellohelloworld"), helloWorld);
    const outputs = [... grammar.generate()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hellohelloworld");
});

describe('Joining right-recursive "hello+ world" with "hellohelloworld"', function() {
    const symbolTable = new Namespace();
    const world = Uni(text("world"), Emb("helloWorld", symbolTable))
    const helloWorld = Seq(text("hello"), world);
    symbolTable.addSymbol("helloWorld", helloWorld);

    const grammar = Join(helloWorld, text("hellohelloworld"));
    const outputs = [... grammar.generate()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hellohelloworld");
});


describe('Joining "helloworld" with left-recursive "hello+ world"', function() {
    const symbolTable = new Namespace();
    const helloHello = Uni(text("hello"), Seq(Emb("hellohello", symbolTable), text("hello")));
    const helloWorld = Seq(helloHello, text("world"));
    symbolTable.addSymbol("hellohello", helloHello);
    const grammar = Join(text("helloworld"), helloWorld);
    const outputs = [... grammar.generate()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "helloworld");
});


describe('Joining "hellohelloworld" with left-recursive "hello+ world"', function() {
    const symbolTable = new Namespace();
    const helloHello = Uni(text("hello"), Seq(Emb("hellohello", symbolTable), text("hello")));
    const helloWorld = Seq(helloHello, text("world"));
    symbolTable.addSymbol("hellohello", helloHello);
    const grammar = Join(text("hellohelloworld"), helloWorld);
    const outputs = [... grammar.generate()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hellohelloworld");
});


describe('Joining left-recursive "hello+ world" with "helloworld"', function() {
    const symbolTable = new Namespace();
    const helloHello = Uni(text("hello"), Seq(Emb("hellohello", symbolTable), text("hello")));
    const helloWorld = Seq(helloHello, text("world"));
    symbolTable.addSymbol("hellohello", helloHello);
    const grammar = Join(helloWorld, text("helloworld"));
    const outputs = [... grammar.generate()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "helloworld");
});


describe('Joining left-recursive "hello+ world" with "hellohelloworld"', function() {
    const symbolTable = new Namespace();
    const helloHello = Uni(text("hello"), Seq(Emb("hellohello", symbolTable), text("hello")));
    const helloWorld = Seq(helloHello, text("world"));
    symbolTable.addSymbol("hellohello", helloHello);
    const grammar = Join(helloWorld, text("hellohelloworld"));
    const outputs = [... grammar.generate()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hellohelloworld");
});

describe('Emitting from right-recursive "hello+ world" with default max recursion (4)', function() {
    const symbolTable = new Namespace();
    const world = Uni(text("world"), Emb("helloWorld", symbolTable))
    const helloWorld = Seq(text("hello"), world);
    symbolTable.addSymbol("helloWorld", helloWorld);
    const outputs = [... helloWorld.generate()];
    testNumOutputs(outputs, 5);
    testHasOutput(outputs, "text", "helloworld");
    testHasOutput(outputs, "text", "hellohelloworld");
    testHasOutput(outputs, "text", "hellohellohelloworld");
    testHasOutput(outputs, "text", "hellohellohellohelloworld");
    testHasOutput(outputs, "text", "hellohellohellohellohelloworld");
});

describe('Emitting from right-recursive "hello+ world" with max recursion 2', function() {
    const symbolTable = new Namespace();
    const world = Uni(text("world"), Emb("helloWorld", symbolTable))
    const helloWorld = Seq(text("hello"), world);
    symbolTable.addSymbol("helloWorld", helloWorld);
    const outputs = [... helloWorld.generate(false, 2)];
    testNumOutputs(outputs, 3);
    testHasOutput(outputs, "text", "helloworld");
    testHasOutput(outputs, "text", "hellohelloworld");
    testHasOutput(outputs, "text", "hellohellohelloworld");
});

describe('Emitting from right-recursive "hello+ world" with max recursion 0', function() {
    const symbolTable = new Namespace();
    const world = Uni(text("world"), Emb("helloWorld", symbolTable))
    const helloWorld = Seq(text("hello"), world);
    symbolTable.addSymbol("helloWorld", helloWorld);
    const outputs = [... helloWorld.generate(false, 0)];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "helloworld");
});

describe('Emitting from left-recursive "hello+ world" with default max recursion (4)', function() {
    const symbolTable = new Namespace();
    const helloHello = Uni(text("hello"), Seq(Emb("hellohello", symbolTable), text("hello")));
    const helloWorld = Seq(helloHello, text("world"));
    symbolTable.addSymbol("hellohello", helloHello);
    const outputs = [... helloWorld.generate()];
    testNumOutputs(outputs, 5);
    testHasOutput(outputs, "text", "helloworld");
    testHasOutput(outputs, "text", "hellohelloworld");
    testHasOutput(outputs, "text", "hellohellohelloworld");
    testHasOutput(outputs, "text", "hellohellohellohelloworld");
    testHasOutput(outputs, "text", "hellohellohellohellohelloworld");
});


describe('Emitting from left-recursive "hello+ world" with max recursion 2', function() {
    const symbolTable = new Namespace();
    const helloHello = Uni(text("hello"), Seq(Emb("hellohello", symbolTable), text("hello")));
    const helloWorld = Seq(helloHello, text("world"));
    symbolTable.addSymbol("hellohello", helloHello);
    const outputs = [... helloWorld.generate(false, 2)];
    testNumOutputs(outputs, 3);
    testHasOutput(outputs, "text", "helloworld");
    testHasOutput(outputs, "text", "hellohelloworld");
    testHasOutput(outputs, "text", "hellohellohelloworld");
});

describe('Emitting from left-recursive "hello+ world" with max recursion 0', function() {
    const symbolTable = new Namespace();
    const helloHello = Uni(text("hello"), Seq(Emb("hellohello", symbolTable), text("hello")));
    const helloWorld = Seq(helloHello, text("world"));
    symbolTable.addSymbol("hellohello", helloHello);
    const outputs = [... helloWorld.generate(false, 0)];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "helloworld");
});
