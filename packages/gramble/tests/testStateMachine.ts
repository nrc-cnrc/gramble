import { expect } from 'chai';
import {Literalizer, Seq, Uni, Join, Emb, Proj, StringDict, Rename} from "../src/parserInterface";

const text = Literalizer("text");
const unrelated = Literalizer("unrelated");
const t1 = Literalizer("t1");
const t2 = Literalizer("t2");
const t3 = Literalizer("t3");


export function testNumOutputs(outputs: StringDict[], expected_num: number) {
    it("should have " + expected_num + " result(s)", function() {
        expect(outputs.length).to.equal(expected_num);
    });
}

export function testHasOutput(outputs: StringDict[], tier: string, target: string) {
    it("should have " + target + " on tier " + tier, function() {
        var results = outputs.filter(o => tier in o)
                             .map(o => o[tier]);
        expect(results).to.contain(target);
    });
}

export function testDoesntHaveOutput(outputs: StringDict[], tier: string, target: string) {
    it("should not have " + target + " on tier " + tier, function() {
        var results = outputs.filter(o => tier in o)
                             .map(o => o[tier]);
        expect(results).to.not.contain(target);
    });
}

describe('Literal text:hello', function() {
    const grammar = text("hello");
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello");
});

describe('Sequence text:hello+test:world', function() {
    const grammar = Seq(text("hello"), text("world"));
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "helloworld");
}); 


describe('Sequence text:hello+test:<empty>', function() {
    const grammar = Seq(text("hello"), text(""));
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello");
}); 


describe('Sequence test:<empty>+text:hello', function() {
    const grammar = Seq(text(""), text("hello"));
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello");
}); 

describe('Sequence text:hello+text:,+test:world', function() {
    const grammar = Seq(text("hello"), text(", "), text("world"));
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello, world");
}); 

describe('Nested sequence (text:hello+text:,)+test:world', function() {
    const grammar = Seq(Seq(text("hello"), text(", ")), text("world"));
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello, world");
}); 


describe('Nested sequence text:hello+(text:,+test:world)', function() {
    const grammar = Seq(text("hello"), Seq(text(", ")), text("world"));
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello, world");
}); 


describe('Alt text:hello|text:goodbye', function() {
    const grammar = Uni(text("hello"), text("goodbye"));
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 2);
    testHasOutput(outputs, "text", "hello");
    testHasOutput(outputs, "text", "goodbye");
}); 


describe('Sequence with alt: (text:hello|text:goodbye)+text:world', function() {
    const grammar = Seq(Uni(text("hello"), text("goodbye")), text("world"));
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 2);
    testHasOutput(outputs, "text", "helloworld");
    testHasOutput(outputs, "text", "goodbyeworld");
}); 

describe('Sequence with alt: text:say+(text:hello|text:goodbye)', function() {
    const grammar = Seq(text("say"), Uni(text("hello"), text("goodbye")));
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 2);
    testHasOutput(outputs, "text", "sayhello");
    testHasOutput(outputs, "text", "saygoodbye");
}); 


describe('Sequence with alt: (text:hello|text:goodbye)+(text:world|text:kitty)', function() {
    const grammar = Seq(Uni(text("hello"), text("goodbye")), Uni(text("world"), text("kitty")));
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 4);
    testHasOutput(outputs, "text", "helloworld");
    testHasOutput(outputs, "text", "goodbyeworld");
    testHasOutput(outputs, "text", "hellokitty");
    testHasOutput(outputs, "text", "goodbyekitty");
}); 


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

describe('Joining text:hello+unrelated:foo & text:hello+unrelated:foo', function() {
    const outputs = [...Join(Seq(text("hello"), unrelated("foo")), Seq(text("hello"), unrelated("foo"))).run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello");
    testHasOutput(outputs, "unrelated", "foo");
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

/**
 * Embedding tests
 */

describe('Symbol containing text:hello', function() {
    const symbolTable = { "s": text("hello") };
    const grammar = Emb("s", symbolTable);
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello");
}); 

describe('Symbol containing text:hello+text:world', function() {
    const symbolTable = { "s": Seq(text("hello"), text("world")) };
    const grammar = Emb("s", symbolTable);
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "helloworld");
}); 

describe('Symbol containing text:hello|text:goodbye', function() {
    const symbolTable = { "s": Uni(text("hello"), text("goodbye")) };
    const grammar = Emb("s", symbolTable);
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 2);
    testHasOutput(outputs, "text", "hello");
    testHasOutput(outputs, "text", "goodbye");
}); 

describe('Symbol of (t1:hi & t1:hi+t2:bye)', function() {
    const symbolTable = { "hi2bye" : Join(t1("hi"), Seq(t1("hi"), t2("bye"))) };
    const outputs = [...Emb("hi2bye", symbolTable).run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t2", "bye");
}); 

describe('Joining sym(t1:hi & t1:hi+t2:bye) & t2:bye+t3:yo', function() {
    const symbolTable = { "hi2bye" : Join(t1("hi"), Seq(t1("hi"), t2("bye"))) };
    const grammar = Join(Emb("hi2bye", symbolTable), Seq(t2("bye"), t3("yo")));
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t3", "yo");
}); 

describe('Joining t1:hi & sym(t1:hi+t2:bye & t2:bye+t3:yo)', function() {
    const symbolTable = { "hi2yo": Join(Seq(t1("hi"), t2("bye")), Seq(t2("bye"), t3("yo")))};
    const grammar = Join(t1("hi"), Emb("hi2yo", symbolTable));
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t3", "yo");
});  

describe('Joining of sym(t1:hi & t1:hi+t2:bye)+t2:world', function() {
    const symbolTable = { "hi2bye" : Join(t1("hi"), Seq(t1("hi"), t2("bye"))) };
    const grammar = Seq(Emb("hi2bye", symbolTable), t2("world")); 
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t2", "byeworld");
}); 

/**
 * Projection tests
 */

describe('Projection(text) of text:hello', function() {
    const grammar = text("hello");
    const outputs = [...Proj(grammar, "text").run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello");
}); 


describe('Projection(text) of text:hello+unrelated:foo', function() {
    const grammar = Seq(text("hello"), unrelated("foo"));
    const outputs = [...Proj(grammar, "text").run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello");
    testDoesntHaveOutput(outputs, "unrelated", "foo");
}); 


describe('Proj(text, text:hello+unrelated:foo)+unrelated:bar', function() {
    const grammar = Seq(Proj(Seq(text("hello"), unrelated("foo")),"text"), unrelated("bar"));
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello");
    testHasOutput(outputs, "unrelated", "bar");
    testDoesntHaveOutput(outputs, "unrelated", "foobar");
    testDoesntHaveOutput(outputs, "unrelated", "foo");
}); 


describe('Proj(text, text:hello+unrelated:foo) & unrelated:bar', function() {
    const grammar = Join(Proj(Seq(text("hello"), unrelated("foo")),"text"), unrelated("bar"));
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello");
    testHasOutput(outputs, "unrelated", "bar");
    testDoesntHaveOutput(outputs, "unrelated", "foobar");
    testDoesntHaveOutput(outputs, "unrelated", "foo");
}); 


describe('Projection(text) of text:hello+unrelated:foo & text:hello+unrelated:foo', function() {
    const grammar = Join(Seq(text("hello"), unrelated("foo")), Seq(text("hello"), unrelated("foo")));
    const outputs = [...Proj(grammar, "text").run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello");
    testDoesntHaveOutput(outputs, "unrelated", "foo");
}); 

describe('Projection(text) of text:hello+unrelated:foo & text:hello+unrelated:bar', function() {
    const grammar = Join(Seq(text("hello"), unrelated("foo")), Seq(text("hello"), unrelated("bar")));
    const outputs = [...Proj(grammar, "text").run()];
    testNumOutputs(outputs, 0);
}); 

describe('Rename(t2/t1) of t1:hello', function() {
    const outputs = [...Rename(t1("hello"), "t1", "t2").run()];
    console.log(outputs);
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t2", "hello");
    testDoesntHaveOutput(outputs, "t1", "hello");
});

describe('Rename(t2/t1) of t1:hello+t2:foo', function() {
    const outputs = [...Rename(Seq(t1("hello"),t2("foo")), "t1", "t2").run()];
    console.log(outputs);
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t2", "hellofoo");
    testDoesntHaveOutput(outputs, "t1", "hello");
    testDoesntHaveOutput(outputs, "t2", "foo");
});

describe('Rename(t2/t1) of t1:hello+t3:foo', function() {
    const outputs = [...Rename(Seq(t1("hello"),t3("foo")), "t1", "t2").run()];
    console.log(outputs);
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t2", "hello");
    testHasOutput(outputs, "t3", "foo");
    testDoesntHaveOutput(outputs, "t1", "hello");
});


describe('Joining t1:hello & rename(t2/t1, t1:hello))', function() {
    const grammar = Join(t2("hello"), Rename(t1("hello"), "t1", "t2"));
    const outputs = [...grammar.run()];
    console.log(outputs);
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t2", "hello");
    testDoesntHaveOutput(outputs, "t1", "hello");
});

describe('Joining rename(t2/t1, t1:hello)) & t1:hello', function() {
    const grammar = Join(Rename(t1("hello"), "t1", "t2"), t2("hello"));
    const outputs = [...grammar.run()];
    console.log(outputs);
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t2", "hello");
    testDoesntHaveOutput(outputs, "t1", "hello");
});

describe('Joining rename(t2/t1, t1:hello+t3:foo)) & t1:hello', function() {
    const grammar = Join(Rename(Seq(t1("hello"), t3("foo")), "t1", "t2"), t2("hello"));
    const outputs = [...grammar.run()];
    console.log(outputs);
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t2", "hello");
    testHasOutput(outputs, "t3", "foo");
    testDoesntHaveOutput(outputs, "t1", "hello");
});

describe('Joining rename(t2/t1, t1:hello+t3:foo)) & t1:hello+t3:bar', function() {
    const grammar = Join(Rename(Seq(t1("hello"), t3("foo")), "t1", "t2"), Seq(t2("hello"), t3("bar")));
    const outputs = [...grammar.run()];
    console.log(outputs);
    testNumOutputs(outputs, 0);
});

describe('Joining t1:hello+t3:bar & rename(t2/t1, t1:hello+t3:foo))', function() {
    const grammar = Join(Seq(t2("hello"), t3("bar")), Rename(Seq(t1("hello"), t3("foo")), "t1", "t2"));
    const outputs = [...grammar.run()];
    console.log(outputs);
    testNumOutputs(outputs, 0);
});


