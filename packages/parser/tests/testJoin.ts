
import {
    Seq, Uni, Join, Epsilon, CharSet
} from "../src/grammars";

import { 
    testSuiteName, logTestSuite,
    VERBOSE_TEST_L2,
    t1, t2, t3, 
    testHasTapes,
    testGrammar 
} from './testUtil';

import {
    StringDict, SILENT, VERBOSE_DEBUG,
} from "../src/util";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

describe(`${testSuiteName(module)}`, function() {

    logTestSuite(this.title);

    describe('1. Join t1:hello ⨝ t1:hello', function() {
        const grammar = Join(t1("hello"), t1("hello"));
        testGrammar(grammar, [{t1: 'hello'}]);
    });

    describe('2. Join t1:hello+t1:world ⨝ t1:helloworld', function() {
        const grammar = Join(Seq(t1("hello"), t1("world")), t1("helloworld"));
        testGrammar(grammar, [{t1: 'helloworld'}]);
    });
    
    describe('3. Join t1:helloworld ⨝ t1:hello+t1:world ', function() {
        const grammar = Join(t1("helloworld"), Seq(t1("hello"), t1("world")));
        testGrammar(grammar, [{t1: 'helloworld'}]);
    });

    describe('4. Join t1:hello ⨝ t2:foo', function() {
        const grammar = Join(t1("hello"), t2("foo"));
        testHasTapes(grammar, ["t1", "t2"]);
        testGrammar(grammar, [{t1: 'hello', t2: 'foo'}]);
    });

    describe('5. Join ε ⨝ ε', function() {
        const grammar = Join(Epsilon(), Epsilon());
        testGrammar(grammar, [{}]);
    });

    describe('6. Join t1:hello ⨝ ε', function() {
        const grammar = Join(t1("hello"), Epsilon());
        testGrammar(grammar, [{t1: 'hello'}]);
    });

    describe('7. Join ε ⨝ t1:hello', function() {
        const grammar = Join(t1("hello"), Epsilon());
        testGrammar(grammar, [{t1: 'hello'}]);
    });

    describe('8. Join t1:hello ⨝ t1:hello+t1:""', function() {
        const grammar = Join(t1("hello"), Seq(t1("hello"), t1("")));
        testGrammar(grammar, [{t1: 'hello'}]);
    });

    describe('9. Join t1:hello ⨝ t1:""+t1:hello', function() {
        const grammar = Join(t1("hello"), Seq(t1(""), t1("hello")));
        testGrammar(grammar, [{t1: 'hello'}]);
    });

    describe('10. Join t1:""+t1:hello ⨝ t1:hello', function() {
        const grammar = Join(Seq(t1(""), t1("hello")), t1("hello"));
        testGrammar(grammar, [{t1: 'hello'}]);
    });

    describe('11. Join t1:hello+t1:"" ⨝ t1:hello', function() {
        const grammar = Join(Seq(t1("hello"), t1("")), t1("hello"));
        testGrammar(grammar, [{t1: 'hello'}]);
    });

    describe('12. Join Seq(t1:hello) ⨝ t1:hello', function() {
        const grammar = Join(Seq(t1("hello")), t1("hello"));
        testGrammar(grammar, [{t1: 'hello'}]);
    });

    describe('13. Join t1:hello ⨝ Seq(t1:hello)', function() {
        const grammar = Join(t1("hello"), Seq(t1("hello")));
        testGrammar(grammar, [{t1: 'hello'}]);
    });

    describe('14. Join Uni(t1:hello) ⨝ t1:hello', function() {
        const grammar = Join(Uni(t1("hello")), t1("hello"));
        testGrammar(grammar, [{t1: 'hello'}]);
    });

    describe('15. Join t1:hello ⨝ Uni(t1:hello)', function() {
        const grammar = Join(t1("hello"), Uni(t1("hello")));
        testGrammar(grammar, [{t1: 'hello'}]);
    });


    describe('16. Join t1:hi ⨝ t1:hi+t2:bye', function() {
        const grammar = Join(t1("hi"), Seq(t1("hi"), t2("bye")));
        testGrammar(grammar, [{t1: 'hi', t2: 'bye'}]);
    });

    describe('17. Join (t1:hi ⨝ t1:hi+t2:bye) ⨝ t2:bye+t3:yo', function() {
        const grammar = Join(Join(t1("hi"), Seq(t1("hi"), t2("bye"))),
                             Seq(t2("bye"), t3("yo")));
        testGrammar(grammar, [{t1: 'hi', t2: 'bye', t3: 'yo'}]);
    });


    describe('18. Join t1:hello+t1:world ⨝ t1:hello+t1:world', function() {
        const grammar = Join(Seq(t1("hello"), t1("world")),
                             Seq(t1("hello"), t1("world")));
        testGrammar(grammar, [{t1: 'helloworld'}]);
    });

    describe('19. Join t1:hi+t1:ki ⨝ t1:hi+t2:bi+t1:ki+t2:wo', function() {
        const grammar = Join(Seq(t1("hi"), t1("ki")),
                             Seq(t1("hi"), t2("bi"), t1("ki"), t2("wo")));
        testGrammar(grammar, [{t1: "hiki", t2: "biwo"}]);
    });

    describe('20. Join t1:hello+t1:kitty ⨝ ' +
             '(t1:hello+t1:kitty)+(t2:goodbye+t2:world)', function() {
        const grammar = Join(Seq(t1("hello"), t1("kitty")),
                             Seq(Seq(t1("hello"), t1("kitty")),
                                 Seq(t2("goodbye"), t2("world"))));
        testGrammar(grammar, [{t1: 'hellokitty', t2: 'goodbyeworld'}]);
    });

    describe('21. Join t1:hello+t1:kitty ⨝ ' +
             '(t1:hello+t2:goodbye)+(t1:kitty+t2:world)', function() {
        const grammar = Join(Seq(t1("hello"), t1("kitty")),
                             Seq(Seq(t1("hello"), t2("goodbye")),
                                 Seq(t1("kitty"), t2("world"))));
        testGrammar(grammar, [{t1: 'hellokitty', t2: 'goodbyeworld'}]);
    });

    describe('22. Join t1:hello+t1:kitty ⨝ ' +
             '(t1:hello+t2:goodbye)+(t2:world+t1:kitty)', function() {
        const grammar = Join(Seq(t1("hello"), t1("kitty")),
                             Seq(Seq(t1("hello"), t2("goodbye")),
                                 Seq(t2("world"), t1("kitty"))));
        testGrammar(grammar, [{t1: 'hellokitty', t2: 'goodbyeworld'}]);
    });

    describe('23. Join t1:hello+t1:kitty ⨝ ' +
             '(t1:hello+t2:goodbye+t1:kitty)+t2:world)', function() {
        const grammar = Join(Seq(t1("hello"), t1("kitty")),
                             Seq(Seq(t1("hello"), t2("goodbye"), t1("kitty")),
                                 t2("world")));
        testGrammar(grammar, [{t1: 'hellokitty', t2: 'goodbyeworld'}]);
    });


    describe('24. Join t1:hi|t1:yo ⨝ t1:hi+t2:bye', function() {
        const grammar = Join(Uni(t1("hi"), t1("yo")),
                             Seq(t1("hi"), t2("bye")));
        testGrammar(grammar, [{t1: 'hi', t2: 'bye'}]);
    });

    describe('25. Join t1:hi+t2:bye ⨝ t2:bye+t3:yo', function() {
        const grammar = Join(Seq(t1("hi"), t2("bye")),
                             Seq(t2("bye"), t3("yo")));
        testGrammar(grammar, [{t1: 'hi', t2: 'bye', t3: 'yo'}]);
    });

    describe('26. Join t1:hi ⨝ (t1:hi+t2:bye ⨝ t2:bye+t3:yo)', function() {
        const grammar = Join(t1("hi"),
                             Join(Seq(t1("hi"), t2("bye")),
                                  Seq(t2("bye"), t3("yo"))));
        testGrammar(grammar, [{t1: 'hi', t2: 'bye', t3: 'yo'}]);
    });

    describe('27. Seq (t1:hi ⨝ t1:hi+t2:bye) + t2:world', function() {
        const grammar = Seq(Join(t1("hi"),
                                 Seq(t1("hi"), t2("bye"))),
                            t2("world"));
        testGrammar(grammar, [{t1: 'hi', t2: "byeworld"}]);
    });


    describe('28. Join t1:hello ⨝ t1:hello+t1:world', function() {
        const grammar = Join(t1("hello"), Seq(t1("hello"), t1("world")));
        testGrammar(grammar, []);
    });

    describe('29. Join t1:hello ⨝ t1:helloworld', function() {
        const grammar = Join(t1("hello"), t1("helloworld"));
        testGrammar(grammar, []);
    });

    describe('30. Join t1:helloworld ⨝ t1:hello', function() {
        const grammar = Join(t1("helloworld"), t1("hello"));
        testGrammar(grammar, []);
    });

    describe('31. Join t1:hello+t1:world ⨝ t1:hello', function() {
        const grammar = Join(Seq(t1("hello"), t1("world")), t1("hello"));
        testGrammar(grammar, []);
    });

    describe('32. Join t1:hi+t2:world ⨝ t1:hi+t2:world', function() {
        const grammar = Join(Seq(t1("hi"), t2("world")),
                             Seq(t1("hi"), t2("world")));
        testGrammar(grammar, [{t1: 'hi', t2: 'world'}]);
    });

    describe('33. Join t2:fo+t1:hi ⨝ t1:hi+t2:fo', function() {
        const grammar = Join(Seq(t2("fo"), t1("hi")),
                             Seq(t1("hi"), t2("fo")));
        testGrammar(grammar, [{t1: 'hi', t2: 'fo'}]);
    });

    describe('34. Join t1:hello ⨝ t1:hello+t2:foo', function() {
        const grammar = Join(t1("hello"), Seq(t1("hello"), t2("foo")));
        testGrammar(grammar, [{t1: 'hello', t2: 'foo'}]);
    });

    describe('35. Join t1:hello ⨝ t2:foo+t1:hello', function() {
        const grammar = Join(t1("hello"), Seq(t2("foo"),t1("hello")));
        testGrammar(grammar, [{t1: 'hello', t2: 'foo'}]);
    });

    describe('36. Join t1:hello+t2:foo ⨝ t1:hello', function() {
        const grammar = Join(Seq(t1("hello"), t2("foo")), t1("hello"));
        testGrammar(grammar, [{t1: 'hello', t2: 'foo'}]);
    });

    describe('37. Join t2:foo+t1:hello ⨝ t1:hello', function() {
        const grammar = Join(Seq(t2("foo"), t1("hello")), t1("hello"));
        testGrammar(grammar, [{t1: 'hello', t2: 'foo'}]);
    });

    describe('38. Join t1:hello+t2:foo ⨝ t1:hello+t2:bar', function() {
        const grammar = Join(Seq(t1("hello"), t2("foo")),
                             Seq(t1("hello"), t2("bar")));
        testGrammar(grammar, []);
    });

    describe('39. Join (t1:hello|t1:goodbye) ⨝ ' +
             '(t1:goodbye|t1:welcome)', function() {
        const grammar = Join(Uni(t1("hello"), t1("goodbye")),
                             Uni(t1("goodbye"), t1("welcome")));
        testGrammar(grammar, [{t1: 'goodbye'}]);
    });

    describe('40. Join (t1:goodbye|t1:welcome) ⨝ ' +
             '(t1:hello|t1:goodbye)', function() {
        const grammar = Join(Uni(t1("goodbye"), t1("welcome")),
                             Uni(t1("hello"), t1("goodbye")));
        testGrammar(grammar, [{t1: 'goodbye'}]);
    });

    describe('41. Nested joining, leftward', function() {
        const grammar = Join(Join(Uni(t1("hello"), t1("goodbye")),
                                  Uni(t1("goodbye"), t1("welcome"))),
                             Uni(t1("yo"), t1("goodbye")));
        testGrammar(grammar, [{t1: 'goodbye'}]);
    });

    describe('42. Nested joining, rightward', function() {
        const grammar = Join(Uni(t1("yo"), t1("goodbye")),
                             Join(Uni(t1("hello"), t1("goodbye")),
                                  Uni(t1("goodbye"), t1("welcome"))));
        testGrammar(grammar, [{t1: 'goodbye'}]);
    });

    describe('43. Join t1:hello ⨝ (t1:hello ⨝ t1:hello)', function() {
        const grammar = Join(t1("hello"),
                             Join(t1("hello"), t1("hello")));
        testGrammar(grammar, [{t1: 'hello'}]);
    });

    describe('44. Join t1:goodbye ⨝ ' +
             '((t1:hello|t1:goodbye) ⨝ (t1:goodbye|t1:welcome))', function() {
        const grammar = Join(t1("goodbye"),
                             Join(Uni(t1("hello"), t1("goodbye")),
                                  Uni(t1("goodbye"), t1("welcome"))));
        testGrammar(grammar, [{t1: 'goodbye'}]);
    });

    describe('45. Join t1:goodbye ⨝ ' +
             '((t1:goodbye|t1:welcome) ⨝ (t1:hello|t1:goodbye))', function() {
        const grammar = Join(t1("goodbye"),
                             Join(Uni(t1("goodbye"), t1("welcome")),
                                  Uni(t1("hello"), t1("goodbye"))));
        testGrammar(grammar, [{t1: 'goodbye'}]);
    });

    describe('46. Join to nested join, leftward: ' +
             't1:goodbye ⨝ ((t1:hello|t1:goodbye ⨝ ' +
             't1:goodbye|t1:welcome) ⨝ t1:yo|t1:goodbye)', function() {
        const grammar = Join(t1("goodbye"),
                             Join(Join(Uni(t1("hello"), t1("goodbye")),
                                       Uni(t1("goodbye"), t1("welcome"))),
                                  Uni(t1("yo"), t1("goodbye"))));
        testGrammar(grammar, [{t1: 'goodbye'}]);
    });

    describe('47. Join to nested joining, rightward: ' +
             't1:goodbye ⨝ (t1:yo|t1:goodbye ⨝ ' +
            '(t1:hello|t1:goodbye ⨝ t1:goodbye|t1:welcome))', function() {
        const grammar = Join(t1("goodbye"),
                             Join(Uni(t1("yo"), t1("goodbye")),
                                  Join(Uni(t1("hello"), t1("goodbye")),
                                       Uni(t1("goodbye"), t1("welcome")))));
        testGrammar(grammar, [{t1: 'goodbye'}]);
    });


    describe('48. Join to a sequence of alternating sequences: ' +
             't1:hello ⨝ ' +
             'seq((t1:hello+t2:hola)|(t1:goodbye+t2:adios))', function() {
        const grammar = Join(t1("hello"),
                             Seq(Uni(Seq(t1("hello"), t2("hola")),
                                     Seq(t1("goodbye"), t2("adios")))));
        testGrammar(grammar, [{t1: 'hello', t2: "hola"}]);
    });

    describe('49. Join to a sequence of alternating sequences: ' +
             '(t1:hello+t2:adios) ⨝ ' +
             'seq((t1:hello+t2:hola)|(t1:goodbye+t2:adios))', function() {
        const grammar = Join(Seq(t1("hello"), t2("adios")),
                             Seq(Uni(Seq(t1("hello"),t2("hola")),
                                     Seq(t1("goodbye"), t2("adios")))));
        testGrammar(grammar, []);
    });

    /*
    TODO: not sure what these should be anymore, reconsider and redo
    
    describe('Join to an alt of different tapes', function() {
        const grammar = Join(t1("hello"), Uni(t1("hello"), t2("foo")));
        testGenerateAndSample(grammar, [{t1: 'hello'},
                              {t1: 'hello', t2: 'foo'}]);
    }); 

    describe('Join t2-tape alts in same direction', function() {
        const grammar = Join(Uni(t1("hello"), t2("foo")),
                             Uni(t1("hello"), t2("foo")));
        testGenerateAndSample(grammar, [{t1: 'hello'},
                              {t2: 'foo'}]);
    });

    describe('Join t2-tape alts in different directions', function() {
        const grammar = Join(Uni(t2("foo"), t1("hello")),
                             Uni(t1("hello"), t2("foo")));
        testGenerateAndSample(grammar, [{t2: 'foo'},
                              {t1: 'hello'}]);
    });
    */

    describe('50. Unfinished join: t1:h ⨝ t1:hello', function() {
        const grammar = Join(t1("h"), t1("hello"));
        testGrammar(grammar, []);
    });

    describe('51. Unfinished join, opposite direction: ' +
             't1:hello ⨝ t1:h', function() {
        const grammar = Join(t1("hello"), t1("h"));
        testGrammar(grammar, []);
    });

    describe('52. Unfinished join with t2: t1:h+t2:foo ⨝ t1:hello', function() {
        const grammar = Join(Seq(t1("h"), t2("foo")), t1("hello"));
        testGrammar(grammar, []);
    });

    describe('53. Unfinished join with t2, other direction: ' +
             't1:hello ⨝ t1:h+t2:foo', function() {
        const grammar = Join(t1("hello"), Seq(t1("h"), t2("foo")));
        testGrammar(grammar, []);
    });

    describe('54. Identical join of t1:hello interrupted by t2 content: ' +
             't1:h+t1:foo+t1:ello ⨝ t1:hello', function() {
        const grammar = Join(Seq(t1("h"), t2("foo"), t1("ello")),
                             t1("hello"));
        testGrammar(grammar, [{t1: 'hello', t2: 'foo'}]);
    });

    describe('55. t1:[hi] ⨝ t1:[hi]', function() {
        const grammar = Join(CharSet("t1", ["h", "i"]), 
                             CharSet("t1", ["h", "i"]));
        testHasTapes(grammar, ["t1"]);
        const expectedResults: StringDict[] = [
            {t1: "h"}, 
            {t1: "i"}, 
        ];
        testGrammar(grammar, expectedResults);
    }); 

    describe('56. t1:[hi] ⨝ t1:[ij]', function() {
        const grammar = Join(CharSet("t1", ["h", "i"]), 
                             CharSet("t1", ["i", "j"]));
        testHasTapes(grammar, ["t1"]);
        const expectedResults: StringDict[] = [
            {t1: "i"}, 
        ];
        testGrammar(grammar, expectedResults);
    }); 

    describe('57. t1:[chi] ⨝ t1:[hij]', function() {
        const grammar = Join(CharSet("t1", ["c", "h", "i"]), 
                             CharSet("t1", ["h", "i", "j"]));
        testHasTapes(grammar, ["t1"]);
        const expectedResults: StringDict[] = [
            {t1: "h"}, 
            {t1: "i"}, 
        ];
        testGrammar(grammar, expectedResults);
    }); 

    describe('58. t1:__ANY_CHAR__ ⨝ t1:h', function() {
        const grammar = Join(t1("__ANY_CHAR__"), t1("h"));
        const expectedResults: StringDict[] = [];
        testGrammar(grammar, expectedResults);

    });

});
