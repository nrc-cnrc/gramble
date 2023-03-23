
import { Seq, Uni, Filter, Epsilon, Starts, Not, Ends, Contains, Intersect, Null, Grammar } from "../src/grammars";
import { Any, CountTape, MatchFrom, Priority, Rep, Short, Vocab } from "../src/grammars";
import { t1, t2, t3, testGrammar } from './testUtil';

import * as path from 'path';
import { VERBOSE_DEBUG, VERBOSE_GRAMMAR } from "../src/util";

describe(`${path.basename(module.filename)}`, function() {

    describe('F.1 Filter t1:hello[t1:hello]', function() {
        const grammar = Filter(t1("hello"), t1("hello"));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('F.2 Filter t1:hello[ε]', function() {
        const grammar = Filter(t1("hello"), Epsilon());
        testGrammar(grammar, [{t1:"hello"}]);
    });

    describe('F.3 Filter ε[ε]', function() {
        const grammar = Filter(Epsilon(), Epsilon());
        testGrammar(grammar, [{}]);
    });

    describe('F.4 Filter ε[t1:hello]', function() {
        const grammar = Filter(Epsilon(), t1("hello"));
        testGrammar(grammar, []);
    });

    describe('F.5 Filter t1:hello[0]', function() {
        const grammar = Filter(t1("hello"), Null());
        testGrammar(grammar, []);
    });

    describe('F.6 Filter 0[ε]', function() {
        const grammar = Filter(Null(), Epsilon());
        testGrammar(grammar, []);
    });
    
    describe('F.7 Filter ε[0]', function() {
        const grammar = Filter(Epsilon(), Null());
        testGrammar(grammar, []);
    });

    describe('F.8 Filter 0[t1:hello]', function() {
        const grammar = Filter(Null(), t1("hello"));
        testGrammar(grammar, []);
    });
    
    describe('F.9 Filter t1:hello[t1:""]', function() {
        const grammar = Filter(t1("hello"), t1(""));
        testGrammar(grammar, []);
    });

    describe('F.10 Filter t1:""[t1:""]', function() {
        const grammar = Filter(t1(""), t1(""));
        testGrammar(grammar, [{}]);
    });

    describe('F.11 Filter (t1:hello|t1:"")[t1:""]', function() {
        const grammar = Filter(Uni(t1("hello"), t1("")), t1(""));
        testGrammar(grammar, [{}]);
    });

    describe('F.12 Filter t1:h[t1:hello]', function() {
        const grammar = Filter(t1("h"), t1("hello"));
        testGrammar(grammar, []);
    });

    describe('F.13 Filter t1:hello[t1:h]', function() {
        const grammar = Filter(t1("hello"), t1("h"));
        testGrammar(grammar, []);
    });
    
    describe('F.14 Filter t1:hello[t1:hello+t2:foo]', function() {
        const grammar = Filter(t1("hello"), Seq(t1("hello"), t2("foo")));
        testGrammar(grammar, []);
    }); 

    describe('F.15 Filter (t1:hi+t2:foo)[t1:hi]', function() {
        const grammar = Filter(Seq(t1("hi"), t2("foo")), t1("hi"));
        testGrammar(grammar, [{t1: "hi", t2: "foo"}]);
    });
    
    describe('F.16 Filter t1:hello[t1:hello+t2:foo]', function() {
        const grammar = Filter(t1("hello"), Seq(t1("hello"), t2("foo")));
        testGrammar(grammar, []);
    }); 
    
    describe('F.17 Filter (t1:hi+t2:world)[t1:hi+t2:world]', function() {
        const grammar = Filter(Seq(t1("hi"), t2("world")),
                             Seq(t1("hi"), t2("world")));
        testGrammar(grammar, [{t1: "hi", t2: "world"}]);
    });

    describe('F.18 Filter (t2:wo+t1:hi)[t1:hi+t2:wo]', function() {
        const grammar = Filter(Seq(t2("b"), t1("a")),
                             Seq(t1("a"), t2("b")));
        testGrammar(grammar, [{t1: "a", t2: "b"}]);
    });

    describe('F.19 Filter (t1:hello+t2:world|t1:hello+t2:kitty)[t1:hello]', function() {
        const grammar = Filter(Uni(Seq(t1("hello"), t2("world")),
                                    Seq(t1("hello"), t2("kitty"))),
                                    t1("hello"));
        testGrammar(grammar, [{t1: "hello", t2: "world"},
                                        {t1: "hello", t2: "kitty"}]);
    }); 

    describe('F.20 Filter (t1:hello+t2:world+t3:!|t1:hello+t2:kitty+t3:!)[t1:hello][t3:!]', function() {
        const grammar = Filter(Filter(Uni(Seq(t1("hello"), t2("world"), t3("!")),
                                    Seq(t1("hello"), t2("kitty"), t3("!"))),
                                    t1("hello")), t3("!"));
        testGrammar(grammar, [{t1: "hello", t2: "world", t3:"!"},
                                        {t1: "hello", t2: "kitty", t3:"!"}]);
    });

    describe('F.21 Filter different-tape alts in same direction', function() {
        const grammar = Filter(Uni(t1("hi"), t2("foo")),
                             Uni(t1("hi"), t2("foo")));
        testGrammar(grammar, [{t1: "hi"},
                              {t2: "foo"}]);
    });

    describe('F.22 Filter different-tape alts in different directions', function() {
        const grammar = Filter(Uni(t2("foo"), t1("hi")),
                             Uni(t1("hi"), t2("foo")));
        testGrammar(grammar, [{t2: "foo"},
                              {t1: "hi"}]);
    });

    describe('F.23 Filter t1:hi+t2:hi[(t1:h+t2:i)+(t1:h+t2:i)]', function() {
        const grammar = Filter(Seq(t1("hi"), t2("hi")), Seq(Seq(t1("h"), t2("h")), Seq(t1("i"), t2("i"))));
        testGrammar(grammar, [{t1: "hi", t2: "hi"}]);
    });
    
    describe('F.24 Nested filter t1:hi[t1:hi][t1:hi]', function() {
        const grammar = Filter(Filter(t1("hi"), t1("hi")), t1("hi"));
        testGrammar(grammar, [{t1: "hi"}]);
    });

    describe('F.25 Nested filter (t1:hi+t2:wo)[t1:hi][t2:wo]', function() {
        const grammar = Filter(Filter(Seq(t1("hi"), t2("wo")), t1("hi")), t2("wo"));
        testGrammar(grammar, [{t1: "hi", t2: "wo"}]);
    });

    describe('F.26 Nested filter (t1:hi+t2:wo)[t2:wo][t1:hi]', function() {
        const grammar = Filter(Filter(Seq(t1("hi"), t2("wo")), t2("wo")), t1("hi"));
        testGrammar(grammar, [{t1: "hi", t2: "wo"}]);
    }); 

    describe('RB.1 Filter (M(t1>t2,~((t1:.){0,17}+Short(t1:hel+(t1:.){0,17})))+t3:[1SG])[t1:hel+t3:G] vocab hel/hela/[1SG]', function() {
        const dotStar: Grammar = Rep(Any("t1"), 0, 17);
        const fromGrammar: Grammar = Not(Seq(dotStar, Short(Seq(t1("hel"), dotStar))));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const candidateGrammar: Grammar = Seq(matchGrammar, t3("[1SG]"));
        const filterGrammar = Filter(candidateGrammar, Seq(t1("hel"), t3("G")));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab({t1:"hel", t2:"hela", t3:"[1SG]"}));
        grammarWithVocab = CountTape(3, grammarWithVocab);
        testGrammar(grammarWithVocab, []);
    }); 

    describe('RB.2 Filter (M(t1>t2,(t1:.){0,17})+~(t3:[1SG])))[t1:hel+t3:G] vocab hel/hela/[1SG]', function() {
        const dotStar: Grammar = Rep(Any("t1"), 0, 17);
        const fromGrammar: Grammar = dotStar;
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const candidateGrammar: Grammar = Seq(matchGrammar, Not(t3("[1SG]")));
        const filterGrammar = Filter(candidateGrammar, Seq(t1("hel"), t3("G")));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab({t1:"hel", t2:"hela", t3:"[1SG]"}));
        grammarWithVocab = CountTape(3, grammarWithVocab);
        testGrammar(grammarWithVocab, [{t1: 'hel', t2: 'hel', t3: 'G'}]);
    }); 

    describe('RB.2a Filter (M(t1>t2,t1:a{0,3})+~(t3:[1SG])))[t1:hel+t3:G] vocab a/a/[1SG]', function() {
        const fromGrammar: Grammar = Rep(t1("a"), 0, 3);
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const candidateGrammar: Grammar = Seq(matchGrammar, Not(t3("[1SG]")));
        const filterGrammar = Filter(candidateGrammar, Seq(t1("aa"), t3("G")));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab({t1:"a", t2:"a", t3:"[1SG]"}));
        grammarWithVocab = CountTape(3, grammarWithVocab);
        testGrammar(grammarWithVocab, [{t1: 'aa', t2: 'aa', t3: 'G'}]);
    }); 

    describe('RB.2b Filter (t1:aa+t2:aa+~(t3:[1SG]))[t1:aa+t3:G] vocab a/a/[1SG]', function() {
        const candidateGrammar: Grammar = Seq(t1("aa"), t2("aa"), Not(t3("[1SG]")));
        const filterGrammar = Filter(candidateGrammar, Seq(t1("aa"), t3("G")));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab({t1:"a", t2:"a", t3:"[1SG]"}));
        grammarWithVocab = CountTape(3, grammarWithVocab);
        testGrammar(grammarWithVocab, [{t1:'aa', t2:'aa', t3: 'G'}]);
    }); 

    describe('RB.2c Filter (t1:a{0,3}+~(t3:[1SG]))[t1:aa+t3:G] vocab a/[1SG]', function() {
        const candidateGrammar: Grammar = Seq(Rep(t1("a"), 0, 3), Not(t3("[1SG]")));
        const filterGrammar = Filter(candidateGrammar, Seq(t1("aa"), t3("G")));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab({t1:"a", t3:"[1SG]"}));
        grammarWithVocab = CountTape(3, grammarWithVocab);
        testGrammar(grammarWithVocab, [{t1:'aa', t3: 'G'}]);
    }); 

    describe('RB.2d Filter (t1:a{0,2}+~(t3:[1SG]))[t1:aa+t3:G] vocab a/[1SG]', function() {
        const candidateGrammar: Grammar = Seq(Rep(t1("a"), 0, 2), Not(t3("[1SG]")));
        const filterGrammar = Filter(candidateGrammar, Seq(t1("aa"), t3("G")));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab({t1:"a", t3:"[1SG]"}));
        grammarWithVocab = CountTape(3, grammarWithVocab);
        testGrammar(grammarWithVocab, [{t1:'aa', t3: 'G'}]);
    }); 

    // STARTS WITH

    describe('S.1 t1:hello starts with ε', function() {
        const grammar = Starts(t1("hello"), Epsilon());
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('S.2 t1:hello starts with t1:ε', function() {
        const grammar = Starts(t1("hello"), t1(""));
        testGrammar(grammar, [{t1: "hello"}]);
    });
    
    describe('S.3 t1:hello starts with 0', function() {
        const grammar = Starts(t1("hello"), Null());
        testGrammar(grammar, []);
    });

    describe('S.4 t1:hello starts with t1:h', function() {
        const grammar = Starts(t1("hello"), t1("h"));
        testGrammar(grammar, [{t1: "hello"}]);
    });
    
    describe('S.5 t1:hello starts with ε+t1:h', function() {
        const grammar = Starts(t1("hello"), Seq(Epsilon(), t1("h")));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('S.6 t1:hello starts with t1:h+ε', function() {
        const grammar = Starts(t1("hello"), Seq(t1("h"), Epsilon()));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('S.7 t1:hello+t2:world starts with (t1:h+t2:w)', function() {
        const grammar = Starts(Seq(t1("hello"), t2("world")), Seq(t1("h"), t2("w")));
        testGrammar(grammar, [{t1: "hello", t2: "world"}]);
    });

    describe('S.8 t1:hello starts with t1:he', function() {
        const grammar = Starts(t1("hello"), t1("he"));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('S.9 t1:hello starts with t1:hello', function() {
        const grammar = Starts(t1("hello"), t1("hello"));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('S.10 t1:hello starts with ~(ε+t1:h)', function() {
        const grammar = Starts(t1("hello"), Not(Seq(Epsilon(), t1("h"))));
        testGrammar(grammar, []);
    });

    describe('S.11 t1:hello starts with ~(t1:h+ε)', function() {
        const grammar = Starts(t1("hello"), Not(Seq(t1("h"), Epsilon())));
        testGrammar(grammar, []);
    });
    
    describe('S.12 t1:hello starts with ~(t1:h)', function() {
        const grammar = Starts(t1("hello"), Not(t1("h")));
        testGrammar(grammar, []);
    });
    
    
    describe('S.13 t1:hello starts with ~t1:he', function() {
        const grammar = Starts(t1("hello"), Not(t1("he")));
        testGrammar(grammar, []);
    });

    describe('S.14 t1:world starts with ~t1:h', function() {
        const grammar = Starts(t1("world"), Not(t1("h")));
        testGrammar(grammar, [{t1: "world"}]);
    });
    
    describe('S.15 (t1:hello|t1:world) starts with t1:h', function() {
        const grammar = Starts(Uni(t1("hello"), t1("world")), t1("h"));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('S.16 (t1:hello|t1:world) starts with ~t1:h', function() {
        const grammar = Starts(Uni(t1("hello"), t1("world")), Not(t1("h")));
        testGrammar(grammar, [{t1: "world"}]);
    });
    
    describe('S.17 (t1:hello|t1:world|t1:kitty) starts with (t1:h|t1:k)', function() {
        const grammar = Starts(Uni(t1("hello"), t1("world"), t1("kitty")), 
                                    Uni(t1("h"), t1("k")));
        testGrammar(grammar, [{t1: "hello"}, {t1: "kitty"}]);
    });

    describe('S.18 (t1:hello|t1:world|t1:kitty) starts with ~t1:w', function() {
        const grammar = Starts(Uni(t1("hello"), t1("world"), t1("kitty")), 
                                    Not(t1("w")));
        testGrammar(grammar, [{t1: "hello"}, {t1: "kitty"}]);
    });

    describe('S.19 (t1:hello|t1:world|t1:kitty) starts with ~(t1:h|t1:k)', function() {
        const grammar = Starts(Uni(t1("hello"), t1("world"), t1("kitty")), 
                                    Not(Uni(t1("h"), t1("k"))));
        testGrammar(grammar, [{t1: "world"}]);
    });
    
    describe('S.20 (t1:hello|t1:world|t1:kitty) starts with ~t1:h & ~t1:k', function() {
        const grammar = Starts(Uni(t1("hello"), t1("world"), t1("kitty")), 
                                    Intersect(Not(t1("h")), Not(t1("k"))));
        testGrammar(grammar, [{t1: "world"}]);
    });

    describe('S.21 t1:hello starts with t1:h+t1:e', function() {
        const grammar = Starts(t1("hello"), Seq(t1("h"), t1("e")));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('S.22 t1:hello starts with ~(t1:w)+t1:e', function() {
        const grammar = Starts(t1("hello"), Seq(Not(t1("w")), t1("e")));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('S.23 t1:hello starts with t1:h+~(t1:o)', function() {
        const grammar = Starts(t1("hello"), Seq(t1("h"), Not(t1("o"))));
        testGrammar(grammar, [{t1: "hello"}]);
    });
    
    describe('S.24 t1:hello starts with ~(t1:h)+t1:e', function() {
        const grammar = Starts(t1("hello"), Seq(Not(t1("h")), t1("e")));
        testGrammar(grammar, []);
    });

    describe('S.25 t1:hello starts with t1:h+~(t1:e)', function() {
        const grammar = Starts(t1("hello"), Seq(t1("h"), Not(t1("e"))));
        testGrammar(grammar, []);
    });

    describe('S.26 t1:hello starts with t1:wo|~(t1:k)', function() {
        const grammar = Starts(t1("hello"), Uni(t1("wo"), Not(t1("k"))));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('S.27 t1:hello starts with t1:wo|~(t1:h)', function() {
        const grammar = Starts(t1("hello"), Uni(t1("wo"), Not(t1("h"))));
        testGrammar(grammar, []);
    });

    // ENDS WITH

    describe('E.1 t1:hello ends with ε', function() {
        const grammar = Ends(t1("hello"), Epsilon());
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('E.2 t1:hello ends with t1:ε', function() {
        const grammar = Ends(t1("hello"), t1(""));
        testGrammar(grammar, [{t1: "hello"}]);
    });
    
    describe('E.3 t1:hello ends with 0', function() {
        const grammar = Ends(t1("hello"), Null());
        testGrammar(grammar, []);
    });

    describe('E.4 t1:hello ends with t1:o', function() {
        const grammar = Ends(t1("hello"), t1("o"));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('E.5 t1:hello ends with ε+t1:o', function() {
        const grammar = Ends(t1("hello"), Seq(Epsilon(), t1("o")));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('E.6 t1:hello ends with t1:o+ε', function() {
        const grammar = Ends(t1("hello"), Seq(t1("o"), Epsilon()));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('E.7 t1:hello+t2:world ends with (t1:o+t2:d)', function() {
        const grammar = Ends(Seq(t1("hello"), t2("world")), Seq(t1("o"), t2("d")));
        testGrammar(grammar, [{t1: "hello", t2: "world"}]);
    });

    describe('E.8 t1:hello ends with t1:lo', function() {
        const grammar = Ends(t1("hello"), t1("lo"));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('E.9 t1:hello ends with t1:hello', function() {
        const grammar = Ends(t1("hello"), t1("hello"));
        testGrammar(grammar, [{t1: "hello"}]);
    });
    
    describe('E.10 t1:hello ends with ~t1:o', function() {
        const grammar = Ends(t1("hello"), Not(t1("o")));
        testGrammar(grammar, []);
    });
    
    describe('E.11 t1:hello ends with ~t1:lo', function() {
        const grammar = Ends(t1("hello"), Not(t1("lo")));
        testGrammar(grammar, []);
    });

    describe('E.12 t1:world ends with ~t1:o', function() {
        const grammar = Ends(t1("world"), Not(t1("o")));
        testGrammar(grammar, [{t1: "world"}]);
    });
    
    describe('E.13 (t1:hello|t1:world) ends with t1:o', function() {
        const grammar = Ends(Uni(t1("hello"), t1("world")), t1("o"));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('E.14 (t1:hello|t1:world) ends with ~t1:o', function() {
        const grammar = Ends(Uni(t1("hello"), t1("world")), Not(t1("o")));
        testGrammar(grammar, [{t1: "world"}]);
    });
    
    describe('E.15 (t1:hello|t1:world|t1:kitty) ends with (t1:o|t1:y)', function() {
        const grammar = Ends(Uni(t1("hello"), t1("world"), t1("kitty")), 
                                    Uni(t1("o"), t1("y")));
        testGrammar(grammar, [{t1: "hello"}, {t1: "kitty"}]);
    });

    describe('E.16 (t1:hello|t1:world|t1:kitty) ends with ~t1:d', function() {
        const grammar = Ends(Uni(t1("hello"), t1("world"), t1("kitty")), 
                                    Not(t1("d")));
        testGrammar(grammar, [{t1: "hello"}, {t1: "kitty"}]);
    });

    describe('E.17 (t1:hello|t1:world|t1:kitty) ends with ~(t1:o|t1:y)', function() {
        const grammar = Ends(Uni(t1("hello"), t1("world"), t1("kitty")), 
                                    Not(Uni(t1("o"), t1("y"))));
        testGrammar(grammar, [{t1: "world"}]);
    });
    
    describe('E.18 (t1:hello|t1:world|t1:kitty) ends with ~t1:o & ~t1:y', function() {
        const grammar = Ends(Uni(t1("hello"), t1("world"), t1("kitty")), 
                                    Intersect(Not(t1("o")), Not(t1("y"))));
        testGrammar(grammar, [{t1: "world"}]);
    });

    describe('E.19 t1:hello ends with t1:l+t1:o', function() {
        const grammar = Ends(t1("hello"), Seq(t1("l"), t1("o")));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('E.20 t1:hello ends with ~(t1:t)+t1:o', function() {
        const grammar = Ends(t1("hello"), Seq(Not(t1("t")), t1("o")));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('E.21 t1:hello ends with t1:h+~(t1:o)', function() {
        const grammar = Ends(t1("hello"), Seq(t1("h"), Not(t1("o"))));
        testGrammar(grammar, [{t1: "hello"}]);
    });
    
    describe('E.22 t1:hello ends with ~(t1:l)+t1:o', function() {
        const grammar = Ends(t1("hello"), Seq(Not(t1("l")), t1("o")));
        testGrammar(grammar, []);
    });
    
    describe('E.23 t1:world ends with t1:l+~(t1:d)', function() {
        // "hello" isn't a good example for it because hello really does 
        // end with l~(o), because "lo" is a member of ~(o).
        const grammar = Ends(t1("world"), Seq(t1("l"), Not(t1("d"))));
        testGrammar(grammar, []);
    });

    describe('E.24 t1:hello ends with t1:ld|~(t1:y)', function() {
        const grammar = Ends(t1("hello"), Uni(t1("ld"), Not(t1("y"))));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('E.25 t1:hello ends with t1:ld|~(t1:o)', function() {
        const grammar = Ends(t1("hello"), Uni(t1("ld"), Not(t1("o"))));
        testGrammar(grammar, []);
    });

    // CONTAINS

    describe('C.1 t1:hello contains ε', function() {
        const grammar = Contains(t1("hello"), Epsilon());
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('C.2 t1:hello contains t1:ε', function() {
        const grammar = Contains(t1("hello"), t1(""));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('C.3 t1:hello contains 0', function() {
        const grammar = Contains(t1("hello"), Null());
        testGrammar(grammar, []);
    });

    describe('C.4 t1:hello contains t1:e', function() {
        const grammar = Contains(t1("hello"), t1("e"));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('C.5 t1:hello contains ε+t1:e', function() {
        const grammar = Contains(t1("hello"), Seq(Epsilon(), t1("e")));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('C.6 t1:hello contains t1:e+ε', function() {
        const grammar = Contains(t1("hello"), Seq(t1("e"), Epsilon()));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('C.7 t1:hello+t2:world contains (t1:e+t2:r)', function() {
        const grammar = Contains(Seq(t1("hello"), t2("world")), Seq(t1("e"), t2("r")));
        testGrammar(grammar, [{t1: "hello", t2: "world"}]);
    });
    
    describe('C.8 t1:hello contains t1:el', function() {
        const grammar = Contains(t1("hello"), t1("el"));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('C.9 t1:hello contains t1:hello', function() {
        const grammar = Contains(t1("hello"), t1("hello"));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('C.10 t1:hello contains t1:h', function() {
        const grammar = Contains(t1("hello"), t1("h"));
        testGrammar(grammar, [{t1: "hello"}]);
    });
    
    describe('C.11 t1:hello contains t1:o', function() {
        const grammar = Contains(t1("hello"), t1("o"));
        testGrammar(grammar, [{t1: "hello"}]);
    });
    
    describe('C.12 t1:hello contains ~t1:e', function() {
        const grammar = Contains(t1("hello"), Not(t1("e")));
        testGrammar(grammar, []);
    });
    
    describe('C.13 t1:hello contains ~t1:el', function() {
        const grammar = Contains(t1("hello"), Not(t1("el")));
        testGrammar(grammar, []);
    });

    describe('C.14 t1:hello contains ~t1:h', function() {
        const grammar = Contains(t1("hello"), Not(t1("h")));
        testGrammar(grammar, []);
    });
    
    describe('C.15 t1:hello contains ~t1:o', function() {
        const grammar = Contains(t1("hello"), Not(t1("o")));
        testGrammar(grammar, []);
    });

    describe('C.16 t1:world contains ~t1:e', function() {
        const grammar = Contains(t1("world"), Not(t1("e")));
        testGrammar(grammar, [{t1: "world"}]);
    });
    
    describe('C.17 (t1:hello|t1:kitty) contains t1:e', function() {
        const grammar = Contains(Uni(t1("hello"), t1("kitty")), t1("e"));
        testGrammar(grammar, [{t1: "hello"}]);
    });
    
    describe('C.18 (t1:hello|t1:kitty) contains t1:h', function() {
        const grammar = Contains(Uni(t1("hello"), t1("kitty")), t1("h"));
        testGrammar(grammar, [{t1: "hello"}]);
    });
    
    describe('C.19 (t1:hello|t1:kitty) contains t1:o', function() {
        const grammar = Contains(Uni(t1("hello"), t1("kitty")), t1("o"));
        testGrammar(grammar, [{t1: "hello"}]);
    });
    
    describe('C.20 (t1:hello|t1:kitty) contains ~t1:e', function() {
        const grammar = Contains(Uni(t1("hello"), t1("kitty")), Not(t1("e")));
        testGrammar(grammar, [{t1: "kitty"}]);
    });
    
    describe('C.22 (t1:hello|t1:kitty) contains ~t1:h', function() {
        const grammar = Contains(Uni(t1("hello"), t1("kitty")), Not(t1("h")));
        testGrammar(grammar, [{t1: "kitty"}]);
    });
    
    describe('C.23 (t1:hello|t1:kitty) contains ~t1:o', function() {
        const grammar = Contains(Uni(t1("hello"), t1("kitty")), Not(t1("o")));
        testGrammar(grammar, [{t1: "kitty"}]);
    });

    describe('C.24 (t1:hello|t1:world|t1:kitty) contains (t1:e|t1:i)', function() {
        const grammar = Contains(Uni(t1("hello"), t1("world"), t1("kitty")), 
                                    Uni(t1("e"), t1("i")));
        testGrammar(grammar, [{t1: "hello"}, {t1: "kitty"}]);
    });
    
    describe('C.25 (t1:hello|t1:world|t1:kitty) contains ~t1:t', function() {
        const grammar = Contains(Uni(t1("hello"), t1("world"), t1("kitty")), 
                                    Not(t1("t")));
        testGrammar(grammar, [{t1: "hello"}, {t1: "world"}]);
    });

    describe('C.26 (t1:hello|t1:world|t1:kitty) contains ~(t1:e|t1:i)', function() {
        const grammar = Contains(Uni(t1("hello"), t1("world"), t1("kitty")), 
                                    Not(Uni(t1("e"), t1("i"))));
        testGrammar(grammar, [{t1: "world"}]);
    });
    
    describe('C.27 (t1:hello|t1:world|t1:kitty) contains ~t1:e & ~t1:i', function() {
        const grammar = Contains(Uni(t1("hello"), t1("world"), t1("kitty")), 
                                    Intersect(Not(t1("e")), Not(t1("i"))));
        testGrammar(grammar, [{t1: "world"}]);
    });

    describe('C.28 t1:world contains t1:r+t1:l', function() {
        const grammar = Contains(t1("world"), Seq(t1("r"), t1("l")));
        testGrammar(grammar, [{t1: "world"}]);
    });

    describe('C.29 t1:world contains t1:o+t1:r+t1:l', function() {
        const grammar = Contains(t1("world"), Seq(t1("o"), t1("r"), t1("l")));
        testGrammar(grammar, [{t1: "world"}]);
    });

    describe('C.30 t1:world contains ~(t1:t)+t1:l', function() {
        const grammar = Contains(t1("world"), Seq(Not(t1("t")), t1("l")));
        testGrammar(grammar, [{t1: "world"}]);
    });

    describe('C.31 t1:world contains t1:r+~(t1:t)', function() {
        const grammar = Contains(t1("world"), Seq(t1("r"), Not(t1("t"))));
        testGrammar(grammar, [{t1: "world"}]);
    });
    
    describe('C.32 t1:world contains ~(t1:r)+t1:l', function() {
        const grammar = Contains(t1("world"), Seq(Not(t1("r")), t1("l")));
        testGrammar(grammar, []);
    });

    describe('C.33 t1:world contains t1:r+~(t1:l)', function() {
        const grammar = Contains(t1("world"), Seq(t1("r"), Not(t1("l"))));
        testGrammar(grammar, []);
    });

    describe('C.34 t1:world contains t1:he|~(t1:k)', function() {
        const grammar = Contains(t1("world"), Uni(t1("he"), Not(t1("k"))));
        testGrammar(grammar, [{t1: "world"}]);
    });

    describe('C.35 t1:world contains t1:he|~(t1:r)', function() {
        const grammar = Contains(t1("world"), Uni(t1("he"), Not(t1("r"))));
        testGrammar(grammar, []);
    });

});
