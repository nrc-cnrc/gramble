
import { Seq, Uni, Join, Emb, Proj } from "../src/parserInterface";
import { text, testNumOutputs, testHasOutput, t1, t2, t3, unrelated, testDoesntHaveOutput } from './testUtils';

describe('Joining text:hello & text:hello', function() {
    const grammar = Join(text("hello"), text("hello"));
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello");
});

describe('Joining text:hello & text:hello+text:<emtpy>', function() {
    const grammar = Join(text("hello"), Seq(text("hello"), text("")));
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello");
});


describe('Joining text:hello & text:<emtpy>+text:hello', function() {
    const grammar = Join(text("hello"), Seq(text(""), text("hello")));
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello");
});


describe('Joining text:<emtpy>+text:hello & text:hello', function() {
    const grammar = Join(Seq(text(""), text("hello")), text("hello"));
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello");
});


describe('Joining text:hello+text:<emtpy> & text:hello', function() {
    const grammar = Join(Seq(text("hello"), text("")), text("hello"));
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello");
});

describe('Joining Seq(text:hello) & text:hello', function() {
    const grammar = Join(Seq(text("hello")), text("hello"));
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello");
});


describe('Joining text:hello & Seq(text:hello)', function() {
    const grammar = Join(text("hello"), Seq(text("hello")));
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello");
});


describe('Joining Uni(text:hello) & text:hello', function() {
    const grammar = Join(Uni(text("hello")), text("hello"));
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello");
});


describe('Joining text:hello & Uni(text:hello)', function() {
    const grammar = Join(text("hello"), Uni(text("hello")));
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello");
});

describe('Joining t1:hi & t1:hi+t2:bye', function() {
    const outputs = [...Join(t1("hi"), Seq(t1("hi"), t2("bye"))).run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t2", "bye");
}); 

describe('Joining (t1:hi & t1:hi+t2:bye) & t2:bye+t3:yo', function() {
    const outputs = [...Join(Join(t1("hi"), Seq(t1("hi"), t2("bye"))), Seq(t2("bye"), t3("yo"))).run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t3", "yo");
}); 


describe('Joining text:hello+text:world & text:hello+text:world', function() {
    const outputs = [...Join(Seq(text("hello"), text("world")), Seq(text("hello"), text("world"))).run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "helloworld");
}); 

describe('Joining t1:hello+t1:kitty & t1:hello+t2:goodbye+t1:kitty+t2:world', function() {
    const outputs = [...Join(Seq(t1("hello"), t1("kitty")), Seq(t1("hello"), t2("goodbye"), t1("kitty"), t2("world"))).run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t2", "goodbyeworld");
}); 

describe('Joining t1:hello+t1:kitty & (t1:hello+t1:kitty)+(t2:goodbye+t2:world)', function() {
    const outputs = [...Join(Seq(t1("hello"), t1("kitty")), Seq(Seq(t1("hello"), t1("kitty")), Seq(t2("goodbye"), t2("world")))).run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t2", "goodbyeworld");
}); 

describe('Joining t1:hello+t1:kitty & (t1:hello+t2:goodbye)+(t1:kitty+t2:world)', function() {
    const outputs = [...Join(Seq(t1("hello"), t1("kitty")), Seq(Seq(t1("hello"), t2("goodbye")), Seq(t1("kitty"), t2("world")))).run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t2", "goodbyeworld");
}); 


describe('Joining t1:hello+t1:kitty & (t1:hello+t2:goodbye)+(t2:world+t1:kitty)', function() {
    const outputs = [...Join(Seq(t1("hello"), t1("kitty")), Seq(Seq(t1("hello"), t2("goodbye")), Seq(t2("world"), t1("kitty")))).run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t2", "goodbyeworld");
}); 


describe('Joining t1:hello+t1:kitty & (t1:hello+t2:goodbye+t1:kitty)+t2:world)', function() {
    const outputs = [...Join(Seq(t1("hello"), t1("kitty")), Seq(Seq(t1("hello"), t2("goodbye"), t1("kitty")), t2("world"))).run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t2", "goodbyeworld");
}); 

describe('Joining an alternation & literal', function() {
    const outputs = [...Join(Uni(t1("hi"), t1("yo")), Seq(t1("hi"), t2("bye"))).run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t2", "bye");
}); 


describe('Joining t1:hi & (t1:hi+t2:bye & t2:bye+t3:yo)', function() {
    const outputs = [...Join(t1("hi"), Join(Seq(t1("hi"), t2("bye")), Seq(t2("bye"), t3("yo")))).run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t3", "yo");
}); 


describe('Joining of (t1:hi & t1:hi+t2:bye)+t2:world', function() {
    const outputs = [...Seq(Join(t1("hi"), Seq(t1("hi"), t2("bye"))), t2("world")).run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t2", "byeworld");
}); 


describe('Joining text:hello & text:hello+text:world', function() {
    const outputs = [...Join(text("hello"), Seq(text("hello"), text("world"))).run()];
    testNumOutputs(outputs, 0);
}); 


describe('Joining text:hello & text:helloworld', function() {
    const outputs = [...Join(text("hello"), text("helloworld")).run()];
    testNumOutputs(outputs, 0);
}); 

describe('Joining text:hello & text:hello+text:world', function() {
    const outputs = [...Join(text("hello"), Seq(text("hello"), text("world"))).run()];
    testNumOutputs(outputs, 0);
}); 

describe('Joining text:helloworld & text:hello', function() {
    const outputs = [...Join(text("helloworld"), text("hello")).run()];
    testNumOutputs(outputs, 0);
}); 

describe('Joining text:hello+text:world & text:hello', function() {
    const outputs = [...Join(Seq(text("hello"), text("world")), text("hello")).run()];
    testNumOutputs(outputs, 0);
}); 

describe('Joining text:hi+unrelated:world & text:hi+unrelated:world', function() {
    const outputs = [...Join(Seq(text("hi"), unrelated("world")), Seq(text("hi"), unrelated("world"))).run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hi");
    testHasOutput(outputs, "unrelated", "world");
}); 


describe('Joining unrelated:world+text:hello & text:hello+unrelated:world', function() {
    const outputs = [...Join(Seq(unrelated("world"), text("hello")), Seq(text("hello"), unrelated("world"))).run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello");
    testHasOutput(outputs, "unrelated", "world");
}); 

describe('Joining text:hello & text:hello+unrelated:foo', function() {
    const outputs = [...Join(text("hello"), Seq(text("hello"), unrelated("foo"))).run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "unrelated", "foo");
}); 

describe('Joining text:hello & unrelated:foo+text:hello', function() {
    const outputs = [...Join(text("hello"), Seq(unrelated("foo"),text("hello"))).run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "unrelated", "foo");
});

describe('Joining text:hello+unrelated:foo & text:hello', function() {
    const outputs = [...Join(Seq(text("hello"), unrelated("foo")), text("hello")).run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "unrelated", "foo");
}); 

describe('Joining +unrelated:foo+text:hello & text:hello', function() {
    const outputs = [...Join(Seq(unrelated("foo"), text("hello")), text("hello")).run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "unrelated", "foo");
}); 

describe('Joining text:hello+unrelated:foo & text:hello+unrelated:bar', function() {
    const outputs = [...Join(Seq(text("hello"), unrelated("foo")), Seq(text("hello"), unrelated("bar"))).run()];
    testNumOutputs(outputs, 0);
}); 

describe('Joining (text:hello|text:goodbye) & (text:goodbye|text:welcome)', function() {
    const outputs = [...Join(Uni(text("hello"), text("goodbye")), Uni(text("goodbye"),  text("welcome"))).run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "goodbye");
}); 

describe('Joining (text:goodbye|text:welcome) & (text:hello|text:goodbye)', function() {
    const outputs = [...Join(Uni(text("goodbye"),  text("welcome")), Uni(text("hello"), text("goodbye"))).run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "goodbye");
}); 

describe('Nested joining, leftward', function() {
    const outputs = [...Join(Join(Uni(text("hello"), text("goodbye")), Uni(text("goodbye"),  text("welcome"))), Uni(text("yo"), text("goodbye"))).run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "goodbye");
}); 

describe('Nested joining, rightward', function() {
    const outputs = [...Join(Uni(text("yo"), text("goodbye")), Join(Uni(text("hello"), text("goodbye")), Uni(text("goodbye"),  text("welcome")))).run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "goodbye");
}); 

describe('Joining to joining text:hello & text:hello', function() {
    const outputs = [...Join(text("hello"), Join(text("hello"), text("hello"))).run()];
    testNumOutputs(outputs, 1);
}); 

describe('Joining to joining of (text:hello|text:goodbye) & (text:goodbye|text:welcome)', function() {
    const outputs = [...Join(text("goodbye"), Join(Uni(text("hello"), text("goodbye")), Uni(text("goodbye"),  text("welcome")))).run()];
    testNumOutputs(outputs, 1);
}); 

describe('Joining to joining of (text:goodbye|text:welcome) & (text:hello|text:goodbye)', function() {
    const outputs = [...Join(text("goodbye"), Join(Uni(text("goodbye"),  text("welcome")), Uni(text("hello"), text("goodbye")))).run()];
    testNumOutputs(outputs, 1);
}); 

describe('Joining to nested joining, leftward', function() {
    const outputs = [...Join(text("goodbye"), Join(Join(Uni(text("hello"), text("goodbye")), Uni(text("goodbye"),  text("welcome"))), Uni(text("yo"), text("goodbye")))).run()];
    testNumOutputs(outputs, 1);
}); 

describe('Joining to nested joining, rightward', function() {
    const outputs = [...Join(text("goodbye"), Join(Uni(text("yo"), text("goodbye")), Join(Uni(text("hello"), text("goodbye")), Uni(text("goodbye"),  text("welcome"))))).run()];
    testNumOutputs(outputs, 1);
}); 


describe('Joining to a sequence of alternating sequences ', function() {
    const outputs = [...Join(text("hello"), Seq(Uni(Seq(text("hello"),unrelated("hola")), Seq(text("goodbye"), unrelated("adios"))))).run()];
    testNumOutputs(outputs, 1);
}); 


describe('Joining to a sequence of alternating sequences ', function() {
    const outputs = [...Join(Seq(text("hello"), unrelated("adios")), Seq(Uni(Seq(text("hello"),unrelated("hola")), Seq(text("goodbye"), unrelated("adios"))))).run()];
    testNumOutputs(outputs, 0);
});

describe('Joining to an alt of different tiers', function() {
    const outputs = [...Join(text("hello"), Uni(text("hello"), unrelated("foo"))).run()];
    testNumOutputs(outputs, 2);
});