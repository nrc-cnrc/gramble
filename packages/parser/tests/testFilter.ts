
import { Seq, Uni, Equals, Epsilon, Starts, Not, Ends, Contains, Intersect, Null } from "../src/grammars";
import { t1, t2, t3, testGrammar } from './testUtils';

import * as path from 'path';

describe(`${path.basename(module.filename)}`, function() {

    describe('Filter t1:hello[t1:hello]', function() {
        const grammar = Equals(t1("hello"), t1("hello"));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('Filter t1:hello[ε]', function() {
        const grammar = Equals(t1("hello"), Epsilon());
        testGrammar(grammar, [{t1:"hello"}]);
    });

    describe('Filter ε[ε]', function() {
        const grammar = Equals(Epsilon(), Epsilon());
        testGrammar(grammar, [{}]);
    });

    describe('Filter ε[t1:hello]', function() {
        const grammar = Equals(Epsilon(), t1("hello"));
        testGrammar(grammar, []);
    });

    describe('Filter t1:hello[0]', function() {
        const grammar = Equals(t1("hello"), Null());
        testGrammar(grammar, []);
    });

    describe('Filter 0[ε]', function() {
        const grammar = Equals(Null(), Epsilon());
        testGrammar(grammar, []);
    });
    
    describe('Filter ε[0]', function() {
        const grammar = Equals(Epsilon(), Null());
        testGrammar(grammar, []);
    });

    describe('Filter 0[t1:hello]', function() {
        const grammar = Equals(Null(), t1("hello"));
        testGrammar(grammar, []);
    });
    
    describe('Filter t1:hello[t1:""]', function() {
        const grammar = Equals(t1("hello"), t1(""));
        testGrammar(grammar, []);
    });

    describe('Filter t1:""[t1:""]', function() {
        const grammar = Equals(t1(""), t1(""));
        testGrammar(grammar, [{}]);
    });

    describe('Filter (t1:hello|t1:"")[t1:""]', function() {
        const grammar = Equals(Uni(t1("hello"), t1("")), t1(""));
        testGrammar(grammar, [{}]);
    });

    describe('Filter t1:h[t1:hello]', function() {
        const grammar = Equals(t1("h"), t1("hello"));
        testGrammar(grammar, []);
    });

    describe('Filter t1:hello[t1:h]', function() {
        const grammar = Equals(t1("hello"), t1("h"));
        testGrammar(grammar, []);
    });
    
    describe('Filter t1:hello[t1:hello+t2:foo]', function() {
        const grammar = Equals(t1("hello"), Seq(t1("hello"), t2("foo")));
        testGrammar(grammar, []);
    }); 

    describe('Filter (t1:hi+t2:foo)[t1:hi]', function() {
        const grammar = Equals(Seq(t1("hi"), t2("foo")), t1("hi"));
        testGrammar(grammar, [{t1: "hi", t2: "foo"}]);
    });
    
    describe('Filter t1:hello[t1:hello+t2:foo]', function() {
        const grammar = Equals(t1("hello"), Seq(t1("hello"), t2("foo")));
        testGrammar(grammar, []);
    }); 
    
    describe('Filter (t1:hi+t2:world)[t1:hi+t2:world]', function() {
        const grammar = Equals(Seq(t1("hi"), t2("world")),
                             Seq(t1("hi"), t2("world")));
        testGrammar(grammar, [{t1: "hi", t2: "world"}]);
    });

    describe('Filter (t2:wo+t1:hi)[t1:hi+t2:wo]', function() {
        const grammar = Equals(Seq(t2("b"), t1("a")),
                             Seq(t1("a"), t2("b")));
        testGrammar(grammar, [{t1: "a", t2: "b"}]);
    });

    describe('Filter (t1:hello+t2:world|t1:hello+t2:kitty)[t1:hello]', function() {
        const grammar = Equals(Uni(Seq(t1("hello"), t2("world")),
                                    Seq(t1("hello"), t2("kitty"))),
                                    t1("hello"));
        testGrammar(grammar, [{t1: "hello", t2: "world"},
                                        {t1: "hello", t2: "kitty"}]);
    }); 

    describe('Filter (t1:hello+t2:world+t3:!|t1:hello+t2:kitty+t3:!)[t1:hello][t3:!]', function() {
        const grammar = Equals(Equals(Uni(Seq(t1("hello"), t2("world"), t3("!")),
                                    Seq(t1("hello"), t2("kitty"), t3("!"))),
                                    t1("hello")), t3("!"));
        testGrammar(grammar, [{t1: "hello", t2: "world", t3:"!"},
                                        {t1: "hello", t2: "kitty", t3:"!"}]);
    });

    describe('Filter different-tape alts in same direction', function() {
        const grammar = Equals(Uni(t1("hi"), t2("foo")),
                             Uni(t1("hi"), t2("foo")));
        testGrammar(grammar, [{t1: "hi"},
                              {t2: "foo"}]);
    });

    describe('Filter different-tape alts in different directions', function() {
        const grammar = Equals(Uni(t2("foo"), t1("hi")),
                             Uni(t1("hi"), t2("foo")));
        testGrammar(grammar, [{t2: "foo"},
                              {t1: "hi"}]);
    });

    describe('Filter t1:hi+t2:hi[(t1:h+t2:i)+(t1:h+t2:i)]', function() {
        const grammar = Equals(Seq(t1("hi"), t2("hi")), Seq(Seq(t1("h"), t2("h")), Seq(t1("i"), t2("i"))));
        testGrammar(grammar, [{t1: "hi", t2: "hi"}]);
    });
    
    describe('Nested filter t1:hi[t1:hi][t1:hi]', function() {
        const grammar = Equals(Equals(t1("hi"), t1("hi")), t1("hi"));
        testGrammar(grammar, [{t1: "hi"}]);
    });

    describe('Nested filter (t1:hi+t2:wo)[t1:hi][t2:wo]', function() {
        const grammar = Equals(Equals(Seq(t1("hi"), t2("wo")), t1("hi")), t2("wo"));
        testGrammar(grammar, [{t1: "hi", t2: "wo"}]);
    });

    describe('Nested filter (t1:hi+t2:wo)[t2:wo][t1:hi]', function() {
        const grammar = Equals(Equals(Seq(t1("hi"), t2("wo")), t2("wo")), t1("hi"));
        testGrammar(grammar, [{t1: "hi", t2: "wo"}]);
    }); 
    
    // STARTSWITH

    describe('t1:hello startswith ε', function() {
        const grammar = Starts(t1("hello"), Epsilon());
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('t1:hello startswith t1:ε', function() {
        const grammar = Starts(t1("hello"), t1(""));
        testGrammar(grammar, [{t1: "hello"}]);
    });
    
    describe('t1:hello startswith 0', function() {
        const grammar = Starts(t1("hello"), Null());
        testGrammar(grammar, []);
    });

    describe('t1:hello startswith t1:h', function() {
        const grammar = Starts(t1("hello"), t1("h"));
        testGrammar(grammar, [{t1: "hello"}]);
    });
    
    describe('t1:hello startswith ε+t1:h', function() {
        const grammar = Starts(t1("hello"), Seq(Epsilon(), t1("h")));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('t1:hello startswith t1:h+ε', function() {
        const grammar = Starts(t1("hello"), Seq(t1("h"), Epsilon()));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('t1:hello+t2:world startswith (t1:h+t2:w)', function() {
        const grammar = Starts(Seq(t1("hello"), t2("world")), Seq(t1("h"), t2("w")));
        testGrammar(grammar, [{t1: "hello", t2: "world"}]);
    });

    describe('t1:hello startswith t1:he', function() {
        const grammar = Starts(t1("hello"), t1("he"));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('t1:hello startswith t1:hello', function() {
        const grammar = Starts(t1("hello"), t1("hello"));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('t1:hello startswith ~(ε+t1:h)', function() {
        const grammar = Starts(t1("hello"), Not(Seq(Epsilon(), t1("h"))));
        testGrammar(grammar, []);
    });

    describe('t1:hello startswith ~(t1:h+ε)', function() {
        const grammar = Starts(t1("hello"), Not(Seq(t1("h"), Epsilon())));
        testGrammar(grammar, []);
    });
    
    describe('t1:hello startswith ~(t1:h)', function() {
        const grammar = Starts(t1("hello"), Not(t1("h")));
        testGrammar(grammar, []);
    });
    
    
    describe('t1:hello startswith ~t1:he', function() {
        const grammar = Starts(t1("hello"), Not(t1("he")));
        testGrammar(grammar, []);
    });

    describe('t1:world startswith ~t1:h', function() {
        const grammar = Starts(t1("world"), Not(t1("h")));
        testGrammar(grammar, [{t1: "world"}]);
    });
    
    describe('(t1:hello|t1:world) startswith t1:h', function() {
        const grammar = Starts(Uni(t1("hello"), t1("world")), t1("h"));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('(t1:hello|t1:world) startswith ~t1:h', function() {
        const grammar = Starts(Uni(t1("hello"), t1("world")), Not(t1("h")));
        testGrammar(grammar, [{t1: "world"}]);
    });
    
    describe('(t1:hello|t1:world|t1:kitty) startswith (t1:h|t1:k)', function() {
        const grammar = Starts(Uni(t1("hello"), t1("world"), t1("kitty")), 
                                    Uni(t1("h"), t1("k")));
        testGrammar(grammar, [{t1: "hello"}, {t1: "kitty"}]);
    });

    describe('(t1:hello|t1:world|t1:kitty) startswith ~t1:w', function() {
        const grammar = Starts(Uni(t1("hello"), t1("world"), t1("kitty")), 
                                    Not(t1("w")));
        testGrammar(grammar, [{t1: "hello"}, {t1: "kitty"}]);
    });

    describe('(t1:hello|t1:world|t1:kitty) startswith ~(t1:h|t1:k)', function() {
        const grammar = Starts(Uni(t1("hello"), t1("world"), t1("kitty")), 
                                    Not(Uni(t1("h"), t1("k"))));
        testGrammar(grammar, [{t1: "world"}]);
    });
    
    describe('(t1:hello|t1:world|t1:kitty) startswith ~t1:h & ~t1:k', function() {
        const grammar = Starts(Uni(t1("hello"), t1("world"), t1("kitty")), 
                                    Intersect(Not(t1("h")), Not(t1("k"))));
        testGrammar(grammar, [{t1: "world"}]);
    });

    describe('t1:hello startswith t1:h+t1:e', function() {
        const grammar = Starts(t1("hello"), Seq(t1("h"), t1("e")));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('t1:hello startswith ~(t1:w)+t1:e', function() {
        const grammar = Starts(t1("hello"), Seq(Not(t1("w")), t1("e")));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('t1:hello startswith t1:h+~(t1:o)', function() {
        const grammar = Starts(t1("hello"), Seq(t1("h"), Not(t1("o"))));
        testGrammar(grammar, [{t1: "hello"}]);
    });
    
    describe('t1:hello startswith ~(t1:h)+t1:e', function() {
        const grammar = Starts(t1("hello"), Seq(Not(t1("h")), t1("e")));
        testGrammar(grammar, []);
    });

    describe('t1:hello startswith t1:h+~(t1:e)', function() {
        const grammar = Starts(t1("hello"), Seq(t1("h"), Not(t1("e"))));
        testGrammar(grammar, []);
    });

    describe('t1:hello startswith t1:wo|~(t1:k)', function() {
        const grammar = Starts(t1("hello"), Uni(t1("wo"), Not(t1("k"))));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('t1:hello startswith t1:wo|~(t1:h)', function() {
        const grammar = Starts(t1("hello"), Uni(t1("wo"), Not(t1("h"))));
        testGrammar(grammar, []);
    });

    // ENDSWITH

    describe('t1:hello endswith ε', function() {
        const grammar = Ends(t1("hello"), Epsilon());
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('t1:hello endswith t1:ε', function() {
        const grammar = Ends(t1("hello"), t1(""));
        testGrammar(grammar, [{t1: "hello"}]);
    });
    
    describe('t1:hello endswith 0', function() {
        const grammar = Ends(t1("hello"), Null());
        testGrammar(grammar, []);
    });

    describe('t1:hello endswith t1:o', function() {
        const grammar = Ends(t1("hello"), t1("o"));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('t1:hello endswith ε+t1:o', function() {
        const grammar = Ends(t1("hello"), Seq(Epsilon(), t1("o")));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('t1:hello endswith t1:o+ε', function() {
        const grammar = Ends(t1("hello"), Seq(t1("o"), Epsilon()));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('t1:hello+t2:world endswith (t1:o+t2:d)', function() {
        const grammar = Ends(Seq(t1("hello"), t2("world")), Seq(t1("o"), t2("d")));
        testGrammar(grammar, [{t1: "hello", t2: "world"}]);
    });

    describe('t1:hello endswith t1:lo', function() {
        const grammar = Ends(t1("hello"), t1("lo"));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('t1:hello endswith t1:hello', function() {
        const grammar = Ends(t1("hello"), t1("hello"));
        testGrammar(grammar, [{t1: "hello"}]);
    });
    
    describe('t1:hello endswith ~t1:o', function() {
        const grammar = Ends(t1("hello"), Not(t1("o")));
        testGrammar(grammar, []);
    });
    
    describe('t1:hello endswith ~t1:lo', function() {
        const grammar = Ends(t1("hello"), Not(t1("lo")));
        testGrammar(grammar, []);
    });

    describe('t1:world endswith ~t1:o', function() {
        const grammar = Ends(t1("world"), Not(t1("o")));
        testGrammar(grammar, [{t1: "world"}]);
    });
    
    describe('(t1:hello|t1:world) endswith t1:o', function() {
        const grammar = Ends(Uni(t1("hello"), t1("world")), t1("o"));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('(t1:hello|t1:world) endswith ~t1:o', function() {
        const grammar = Ends(Uni(t1("hello"), t1("world")), Not(t1("o")));
        testGrammar(grammar, [{t1: "world"}]);
    });
    
    describe('(t1:hello|t1:world|t1:kitty) endswith (t1:o|t1:y)', function() {
        const grammar = Ends(Uni(t1("hello"), t1("world"), t1("kitty")), 
                                    Uni(t1("o"), t1("y")));
        testGrammar(grammar, [{t1: "hello"}, {t1: "kitty"}]);
    });

    describe('(t1:hello|t1:world|t1:kitty) endswith ~t1:d', function() {
        const grammar = Ends(Uni(t1("hello"), t1("world"), t1("kitty")), 
                                    Not(t1("d")));
        testGrammar(grammar, [{t1: "hello"}, {t1: "kitty"}]);
    });

    describe('(t1:hello|t1:world|t1:kitty) endswith ~(t1:o|t1:y)', function() {
        const grammar = Ends(Uni(t1("hello"), t1("world"), t1("kitty")), 
                                    Not(Uni(t1("o"), t1("y"))));
        testGrammar(grammar, [{t1: "world"}]);
    });
    
    describe('(t1:hello|t1:world|t1:kitty) endswith ~t1:o & ~t1:y', function() {
        const grammar = Ends(Uni(t1("hello"), t1("world"), t1("kitty")), 
                                    Intersect(Not(t1("o")), Not(t1("y"))));
        testGrammar(grammar, [{t1: "world"}]);
    });

    describe('t1:hello endswith t1:l+t1:o', function() {
        const grammar = Ends(t1("hello"), Seq(t1("l"), t1("o")));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('t1:hello endswith ~(t1:t)+t1:o', function() {
        const grammar = Ends(t1("hello"), Seq(Not(t1("t")), t1("o")));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('t1:hello endswith t1:h+~(t1:o)', function() {
        const grammar = Ends(t1("hello"), Seq(t1("h"), Not(t1("o"))));
        testGrammar(grammar, [{t1: "hello"}]);
    });
    
    describe('t1:hello endswith ~(t1:l)+t1:o', function() {
        const grammar = Ends(t1("hello"), Seq(Not(t1("l")), t1("o")));
        testGrammar(grammar, []);
    });
    
    describe('t1:world endswith t1:l+~(t1:d)', function() {
        // "hello" isn't a good example for it because hello really does 
        // end with l~(o), because "lo" is a member of ~(o).
        const grammar = Ends(t1("world"), Seq(t1("l"), Not(t1("d"))));
        testGrammar(grammar, []);
    });

    describe('t1:hello endswith t1:ld|~(t1:y)', function() {
        const grammar = Ends(t1("hello"), Uni(t1("ld"), Not(t1("y"))));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('t1:hello endswith t1:ld|~(t1:o)', function() {
        const grammar = Ends(t1("hello"), Uni(t1("ld"), Not(t1("o"))));
        testGrammar(grammar, []);
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

    describe('t1:hello contains ε+t1:e', function() {
        const grammar = Contains(t1("hello"), Seq(Epsilon(), t1("e")));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('t1:hello contains t1:e+ε', function() {
        const grammar = Contains(t1("hello"), Seq(t1("e"), Epsilon()));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('t1:hello+t2:world contains (t1:e+t2:r)', function() {
        const grammar = Contains(Seq(t1("hello"), t2("world")), Seq(t1("e"), t2("r")));
        testGrammar(grammar, [{t1: "hello", t2: "world"}]);
    });
    
    describe('t1:hello contains t1:el', function() {
        const grammar = Contains(t1("hello"), t1("el"));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('t1:hello contains t1:hello', function() {
        const grammar = Contains(t1("hello"), t1("hello"));
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

    describe('t1:world contains t1:r+t1:l', function() {
        const grammar = Contains(t1("world"), Seq(t1("r"), t1("l")));
        testGrammar(grammar, [{t1: "world"}]);
    });

    describe('t1:world contains t1:o+t1:r+t1:l', function() {
        const grammar = Contains(t1("world"), Seq(t1("o"), t1("r"), t1("l")));
        testGrammar(grammar, [{t1: "world"}]);
    });

    describe('t1:world contains ~(t1:t)+t1:l', function() {
        const grammar = Contains(t1("world"), Seq(Not(t1("t")), t1("l")));
        testGrammar(grammar, [{t1: "world"}]);
    });

    describe('t1:world contains t1:r+~(t1:t)', function() {
        const grammar = Contains(t1("world"), Seq(t1("r"), Not(t1("t"))));
        testGrammar(grammar, [{t1: "world"}]);
    });
    
    describe('t1:world contains ~(t1:r)+t1:l', function() {
        const grammar = Contains(t1("world"), Seq(Not(t1("r")), t1("l")));
        testGrammar(grammar, []);
    });

    describe('t1:world contains t1:r+~(t1:l)', function() {
        const grammar = Contains(t1("world"), Seq(t1("r"), Not(t1("l"))));
        testGrammar(grammar, []);
    });

    describe('t1:world contains t1:he|~(t1:k)', function() {
        const grammar = Contains(t1("world"), Uni(t1("he"), Not(t1("k"))));
        testGrammar(grammar, [{t1: "world"}]);
    });

    describe('t1:world contains t1:he|~(t1:r)', function() {
        const grammar = Contains(t1("world"), Uni(t1("he"), Not(t1("r"))));
        testGrammar(grammar, []);
    });

});