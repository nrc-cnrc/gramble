
import { Seq, Uni, Filter, Epsilon, StartsWith, Not, EndsWith, Contains, Intersect, Null } from "../src/grammars";
import { t1, t2, t3, testGrammar } from './testUtils';

import * as path from 'path';

describe(`${path.basename(module.filename)}`, function() {

    describe('Filter t1:hello[t1:hello]', function() {
        const grammar = Filter(t1("hello"), t1("hello"));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('Filter t1:hello[ε]', function() {
        const grammar = Filter(t1("hello"), Epsilon());
        testGrammar(grammar, [{t1:"hello"}]);
    });

    describe('Filter ε[ε]', function() {
        const grammar = Filter(Epsilon(), Epsilon());
        testGrammar(grammar, [{}]);
    });

    describe('Filter ε[t1:hello]', function() {
        const grammar = Filter(Epsilon(), t1("hello"));
        testGrammar(grammar, []);
    });

    describe('Filter t1:hello[0]', function() {
        const grammar = Filter(t1("hello"), Null());
        testGrammar(grammar, []);
    });

    describe('Filter 0[ε]', function() {
        const grammar = Filter(Null(), Epsilon());
        testGrammar(grammar, []);
    });
    
    describe('Filter ε[0]', function() {
        const grammar = Filter(Epsilon(), Null());
        testGrammar(grammar, []);
    });

    describe('Filter 0[t1:hello]', function() {
        const grammar = Filter(Null(), t1("hello"));
        testGrammar(grammar, []);
    });
    
    describe('Filter t1:hello[t1:""]', function() {
        const grammar = Filter(t1("hello"), t1(""));
        testGrammar(grammar, []);
    });

    describe('Filter t1:""[t1:""]', function() {
        const grammar = Filter(t1(""), t1(""));
        testGrammar(grammar, [{}]);
    });

    describe('Filter (t1:hello|t1:"")[t1:""]', function() {
        const grammar = Filter(Uni(t1("hello"), t1("")), t1(""));
        testGrammar(grammar, [{}]);
    });

    describe('Filter t1:h[t1:hello]', function() {
        const grammar = Filter(t1("h"), t1("hello"));
        testGrammar(grammar, []);
    });

    describe('Filter t1:hello[t1:h]', function() {
        const grammar = Filter(t1("hello"), t1("h"));
        testGrammar(grammar, []);
    });
    
    describe('Filter t1:hello[t1:hello+t2:foo]', function() {
        const grammar = Filter(t1("hello"), Seq(t1("hello"), t2("foo")));
        testGrammar(grammar, []);
    }); 

    describe('Filter (t1:hi+t2:foo)[t1:hi]', function() {
        const grammar = Filter(Seq(t1("hi"), t2("foo")), t1("hi"));
        testGrammar(grammar, [{t1: "hi", t2: "foo"}]);
    });
    
    describe('Filter t1:hello[t1:hello+t2:foo]', function() {
        const grammar = Filter(t1("hello"), Seq(t1("hello"), t2("foo")));
        testGrammar(grammar, []);
    }); 
    
    describe('Filter (t1:hi+t2:world)[t1:hi+t2:world]', function() {
        const grammar = Filter(Seq(t1("hi"), t2("world")),
                             Seq(t1("hi"), t2("world")));
        testGrammar(grammar, [{t1: "hi", t2: "world"}]);
    });

    describe('Filter (t2:wo+t1:hi)[t1:hi+t2:wo]', function() {
        const grammar = Filter(Seq(t2("b"), t1("a")),
                             Seq(t1("a"), t2("b")));
        testGrammar(grammar, [{t1: "a", t2: "b"}]);
    });

    describe('Filter (t1:hello+t2:world|t1:hello+t2:kitty)[t1:hello]', function() {
        const grammar = Filter(Uni(Seq(t1("hello"), t2("world")),
                                    Seq(t1("hello"), t2("kitty"))),
                                    t1("hello"));
        testGrammar(grammar, [{t1: "hello", t2: "world"},
                                        {t1: "hello", t2: "kitty"}]);
    }); 

    describe('Filter (t1:hello+t2:world+t3:!|t1:hello+t2:kitty+t3:!)[t1:hello][t3:!]', function() {
        const grammar = Filter(Filter(Uni(Seq(t1("hello"), t2("world"), t3("!")),
                                    Seq(t1("hello"), t2("kitty"), t3("!"))),
                                    t1("hello")), t3("!"));
        testGrammar(grammar, [{t1: "hello", t2: "world", t3:"!"},
                                        {t1: "hello", t2: "kitty", t3:"!"}]);
    });

    describe('Filter different-tape alts in same direction', function() {
        const grammar = Filter(Uni(t1("hi"), t2("foo")),
                             Uni(t1("hi"), t2("foo")));
        testGrammar(grammar, [{t1: "hi"},
                              {t2: "foo"}]);
    });

    describe('Filter different-tape alts in different directions', function() {
        const grammar = Filter(Uni(t2("foo"), t1("hi")),
                             Uni(t1("hi"), t2("foo")));
        testGrammar(grammar, [{t2: "foo"},
                              {t1: "hi"}]);
    });

    describe('Filter t1:hi+t2:hi[(t1:h+t2:i)+(t1:h+t2:i)]', function() {
        const grammar = Filter(Seq(t1("hi"), t2("hi")), Seq(Seq(t1("h"), t2("h")), Seq(t1("i"), t2("i"))));
        testGrammar(grammar, [{t1: "hi", t2: "hi"}]);
    });
    
    describe('Nested filter t1:hi[t1:hi][t1:hi]', function() {
        const grammar = Filter(Filter(t1("hi"), t1("hi")), t1("hi"));
        testGrammar(grammar, [{t1: "hi"}]);
    });

    describe('Nested filter (t1:hi+t2:wo)[t1:hi][t2:wo]', function() {
        const grammar = Filter(Filter(Seq(t1("hi"), t2("wo")), t1("hi")), t2("wo"));
        testGrammar(grammar, [{t1: "hi", t2: "wo"}]);
    });

    describe('Nested filter (t1:hi+t2:wo)[t2:wo][t1:hi]', function() {
        const grammar = Filter(Filter(Seq(t1("hi"), t2("wo")), t2("wo")), t1("hi"));
        testGrammar(grammar, [{t1: "hi", t2: "wo"}]);
    }); 
    
    // STARTSWITH

    describe('t1:hello startswith ε', function() {
        const grammar = StartsWith(t1("hello"), Epsilon());
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('t1:hello startswith t1:ε', function() {
        const grammar = StartsWith(t1("hello"), t1(""));
        testGrammar(grammar, [{t1: "hello"}]);
    });
    
    describe('t1:hello startswith 0', function() {
        const grammar = StartsWith(t1("hello"), Null());
        testGrammar(grammar, []);
    });

    describe('t1:hello startswith t1:h', function() {
        const grammar = StartsWith(t1("hello"), t1("h"));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('t1:hello startswith t1:he', function() {
        const grammar = StartsWith(t1("hello"), t1("he"));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('t1:hello startswith ~t1:h', function() {
        const grammar = StartsWith(t1("hello"), Not(t1("h")));
        testGrammar(grammar, []);
    });
    
    describe('t1:hello startswith ~t1:he', function() {
        const grammar = StartsWith(t1("hello"), Not(t1("he")));
        testGrammar(grammar, []);
    });

    describe('t1:world startswith ~t1:h', function() {
        const grammar = StartsWith(t1("world"), Not(t1("h")));
        testGrammar(grammar, [{t1: "world"}]);
    });
    
    describe('(t1:hello|t1:world) startswith t1:h', function() {
        const grammar = StartsWith(Uni(t1("hello"), t1("world")), t1("h"));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('(t1:hello|t1:world) startswith ~t1:h', function() {
        const grammar = StartsWith(Uni(t1("hello"), t1("world")), Not(t1("h")));
        testGrammar(grammar, [{t1: "world"}]);
    });
    
    describe('(t1:hello|t1:world|t1:kitty) startswith (t1:h|t1:k)', function() {
        const grammar = StartsWith(Uni(t1("hello"), t1("world"), t1("kitty")), 
                                    Uni(t1("h"), t1("k")));
        testGrammar(grammar, [{t1: "hello"}, {t1: "kitty"}]);
    });

    describe('(t1:hello|t1:world|t1:kitty) startswith ~t1:w', function() {
        const grammar = StartsWith(Uni(t1("hello"), t1("world"), t1("kitty")), 
                                    Not(t1("w")));
        testGrammar(grammar, [{t1: "hello"}, {t1: "kitty"}]);
    });

    describe('(t1:hello|t1:world|t1:kitty) startswith ~(t1:h|t1:k)', function() {
        const grammar = StartsWith(Uni(t1("hello"), t1("world"), t1("kitty")), 
                                    Not(Uni(t1("h"), t1("k"))));
        testGrammar(grammar, [{t1: "world"}]);
    });
    
    describe('(t1:hello|t1:world|t1:kitty) startswith ~t1:h & ~t1:k', function() {
        const grammar = StartsWith(Uni(t1("hello"), t1("world"), t1("kitty")), 
                                    Intersect(Not(t1("h")), Not(t1("k"))));
        testGrammar(grammar, [{t1: "world"}]);
    });

    // ENDSWITH

    describe('t1:hello endswith ε', function() {
        const grammar = EndsWith(t1("hello"), Epsilon());
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('t1:hello endswith t1:ε', function() {
        const grammar = EndsWith(t1("hello"), t1(""));
        testGrammar(grammar, [{t1: "hello"}]);
    });
    
    describe('t1:hello endswith 0', function() {
        const grammar = EndsWith(t1("hello"), Null());
        testGrammar(grammar, []);
    });

    describe('t1:hello endswith t1:o', function() {
        const grammar = EndsWith(t1("hello"), t1("o"));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('t1:hello endswith t1:lo', function() {
        const grammar = EndsWith(t1("hello"), t1("lo"));
        testGrammar(grammar, [{t1: "hello"}]);
    });
    
    describe('t1:hello endswith ~t1:o', function() {
        const grammar = EndsWith(t1("hello"), Not(t1("o")));
        testGrammar(grammar, []);
    });
    
    describe('t1:hello endswith ~t1:lo', function() {
        const grammar = EndsWith(t1("hello"), Not(t1("lo")));
        testGrammar(grammar, []);
    });

    describe('t1:world endswith ~t1:o', function() {
        const grammar = EndsWith(t1("world"), Not(t1("o")));
        testGrammar(grammar, [{t1: "world"}]);
    });
    
    describe('(t1:hello|t1:world) endswith t1:o', function() {
        const grammar = EndsWith(Uni(t1("hello"), t1("world")), t1("o"));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('(t1:hello|t1:world) endswith ~t1:o', function() {
        const grammar = EndsWith(Uni(t1("hello"), t1("world")), Not(t1("o")));
        testGrammar(grammar, [{t1: "world"}]);
    });
    
    describe('(t1:hello|t1:world|t1:kitty) endswith (t1:o|t1:y)', function() {
        const grammar = EndsWith(Uni(t1("hello"), t1("world"), t1("kitty")), 
                                    Uni(t1("o"), t1("y")));
        testGrammar(grammar, [{t1: "hello"}, {t1: "kitty"}]);
    });

    describe('(t1:hello|t1:world|t1:kitty) endswith ~t1:d', function() {
        const grammar = EndsWith(Uni(t1("hello"), t1("world"), t1("kitty")), 
                                    Not(t1("d")));
        testGrammar(grammar, [{t1: "hello"}, {t1: "kitty"}]);
    });

    describe('(t1:hello|t1:world|t1:kitty) endswith ~(t1:o|t1:y)', function() {
        const grammar = EndsWith(Uni(t1("hello"), t1("world"), t1("kitty")), 
                                    Not(Uni(t1("o"), t1("y"))));
        testGrammar(grammar, [{t1: "world"}]);
    });
    
    describe('(t1:hello|t1:world|t1:kitty) endswith ~t1:o & ~t1:y', function() {
        const grammar = EndsWith(Uni(t1("hello"), t1("world"), t1("kitty")), 
                                    Intersect(Not(t1("o")), Not(t1("y"))));
        testGrammar(grammar, [{t1: "world"}]);
    });

    // CONTAINS

    describe('t1:hello contains ε', function() {
        const grammar = Contains(t1("hello"), Epsilon());
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('t1:hello contains t1:ε', function() {
        const grammar = Contains(t1("hello"), t1(""));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('t1:hello contains 0', function() {
        const grammar = Contains(t1("hello"), Null());
        testGrammar(grammar, []);
    });

    describe('t1:hello contains t1:e', function() {
        const grammar = Contains(t1("hello"), t1("e"));
        testGrammar(grammar, [{t1: "hello"}]);
    });
    
    describe('t1:hello contains t1:el', function() {
        const grammar = Contains(t1("hello"), t1("el"));
        testGrammar(grammar, [{t1: "hello"}]);
    });


    describe('t1:hello contains t1:h', function() {
        const grammar = Contains(t1("hello"), t1("h"));
        testGrammar(grammar, [{t1: "hello"}]);
    });
    
    describe('t1:hello contains t1:o', function() {
        const grammar = Contains(t1("hello"), t1("o"));
        testGrammar(grammar, [{t1: "hello"}]);
    });
    
    describe('t1:hello contains ~t1:e', function() {
        const grammar = Contains(t1("hello"), Not(t1("e")));
        testGrammar(grammar, []);
    });
    
    describe('t1:hello contains ~t1:el', function() {
        const grammar = Contains(t1("hello"), Not(t1("el")));
        testGrammar(grammar, []);
    });

    describe('t1:hello contains ~t1:h', function() {
        const grammar = Contains(t1("hello"), Not(t1("h")));
        testGrammar(grammar, []);
    });
    
    describe('t1:hello contains ~t1:o', function() {
        const grammar = Contains(t1("hello"), Not(t1("o")));
        testGrammar(grammar, []);
    });

    describe('t1:world contains ~t1:e', function() {
        const grammar = Contains(t1("world"), Not(t1("e")));
        testGrammar(grammar, [{t1: "world"}]);
    });
    
    describe('(t1:hello|t1:kitty) contains t1:e', function() {
        const grammar = Contains(Uni(t1("hello"), t1("kitty")), t1("e"));
        testGrammar(grammar, [{t1: "hello"}]);
    });
    
    describe('(t1:hello|t1:kitty) contains t1:h', function() {
        const grammar = Contains(Uni(t1("hello"), t1("kitty")), t1("h"));
        testGrammar(grammar, [{t1: "hello"}]);
    });
    
    describe('(t1:hello|t1:kitty) contains t1:o', function() {
        const grammar = Contains(Uni(t1("hello"), t1("kitty")), t1("o"));
        testGrammar(grammar, [{t1: "hello"}]);
    });
    
    describe('(t1:hello|t1:kitty) contains ~t1:e', function() {
        const grammar = Contains(Uni(t1("hello"), t1("kitty")), Not(t1("e")));
        testGrammar(grammar, [{t1: "kitty"}]);
    });
    
    describe('(t1:hello|t1:kitty) contains ~t1:h', function() {
        const grammar = Contains(Uni(t1("hello"), t1("kitty")), Not(t1("h")));
        testGrammar(grammar, [{t1: "kitty"}]);
    });
    
    describe('(t1:hello|t1:kitty) contains ~t1:o', function() {
        const grammar = Contains(Uni(t1("hello"), t1("kitty")), Not(t1("o")));
        testGrammar(grammar, [{t1: "kitty"}]);
    });

    describe('(t1:hello|t1:world|t1:kitty) contains (t1:e|t1:i)', function() {
        const grammar = Contains(Uni(t1("hello"), t1("world"), t1("kitty")), 
                                    Uni(t1("e"), t1("i")));
        testGrammar(grammar, [{t1: "hello"}, {t1: "kitty"}]);
    });
    
    describe('(t1:hello|t1:world|t1:kitty) contains ~t1:t', function() {
        const grammar = Contains(Uni(t1("hello"), t1("world"), t1("kitty")), 
                                    Not(t1("t")));
        testGrammar(grammar, [{t1: "hello"}, {t1: "world"}]);
    });

    describe('(t1:hello|t1:world|t1:kitty) contains ~(t1:e|t1:i)', function() {
        const grammar = Contains(Uni(t1("hello"), t1("world"), t1("kitty")), 
                                    Not(Uni(t1("e"), t1("i"))));
        testGrammar(grammar, [{t1: "world"}]);
    });
    
    describe('(t1:hello|t1:world|t1:kitty) contains ~t1:e & ~t1:i', function() {
        const grammar = Contains(Uni(t1("hello"), t1("world"), t1("kitty")), 
                                    Intersect(Not(t1("e")), Not(t1("i"))));
        testGrammar(grammar, [{t1: "world"}]);
    });

});