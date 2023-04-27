
import {
    CharSet, Epsilon, Seq, Uni,
} from "../src/grammars";

import {
    testSuiteName, logTestSuite, VERBOSE_TEST_L2,
    t1, t2, t3,
    testHasTapes, testHasVocab, testGrammar,
} from "./testUtil";

import {
    StringDict, SILENT, VERBOSE_DEBUG,
} from "../src/util";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

describe(`${testSuiteName(module)}`, function() {

    logTestSuite(this.title);

    describe('1. Literal t1:hello', function() {
        const grammar = t1("hello");
        testHasTapes(grammar, ["t1"]);
        //testHasVocab(grammar, {t1: 4});
        testGrammar(grammar, [{t1: 'hello'}]);
    });
    
    describe('2. Literal t1:""', function() {
        const grammar = t1("");
        testHasTapes(grammar, ["t1"]);
        testHasVocab(grammar, {t1: 0});
        testGrammar(grammar, [{}]);
    });

    describe('3. Just ε', function() {
        const grammar = Epsilon();
        testHasTapes(grammar, []);
        testGrammar(grammar, [{}]);
    });

    describe('4. Sequence t1:hello + t1:world', function() {
        const grammar = Seq(t1("hello"), t1("world"));
        testHasTapes(grammar, ["t1"]);
        //testHasVocab(grammar, {t1: 7});
        testGrammar(grammar, [{t1: 'helloworld'}]);
    });

    describe('5. Empty sequence', function() {
        const grammar = Seq();
        testHasTapes(grammar, []);
        testGrammar(grammar, [{}]);
    });

    describe('6. Sequence of one ε', function() {
        const grammar = Seq(Epsilon());
        testHasTapes(grammar, []);
        testGrammar(grammar, [{}]);
    });

    describe('7. ε+ε', function() {
        const grammar = Seq(Epsilon(), Epsilon());
        testHasTapes(grammar, []);
        testGrammar(grammar, [{}]);
    });

    describe('8. t1:hello + Seq()', function() {
        const grammar = Seq(t1("hello"), Seq());
        testHasTapes(grammar, ["t1"]);
        testGrammar(grammar, [{t1: 'hello'}]);
    });
    
    describe('9. Seq() + t1:hello', function() {
        const grammar = Seq(Seq(), t1("hello"));
        testHasTapes(grammar, ["t1"]);
        testGrammar(grammar, [{t1: 'hello'}]);
    });

    describe('10. t1:hello + Seq(ε)', function() {
        const grammar = Seq(t1("hello"), Seq(Epsilon()));
        testHasTapes(grammar, ["t1"]);
        testGrammar(grammar, [{t1: 'hello'}]);
    });
    
    describe('11. t1:hello + (ε+ε)', function() {
        const grammar = Seq(t1("hello"), Seq(Epsilon(), Epsilon()));
        testHasTapes(grammar, ["t1"]);
        testGrammar(grammar, [{t1: 'hello'}]);
    });

    describe('12. Sequence t1:hello + t1:""', function() {
        const grammar = Seq(t1("hello"), t1(""));
        testGrammar(grammar, [{t1: 'hello'}]);
    });

    describe('13. Sequence t1:"" + t1:hello', function() {
        const grammar = Seq(t1(""), t1("hello"));
        testGrammar(grammar, [{t1: 'hello'}]);
    });

    describe('14. Sequence t1:hello + ε', function() {
        const grammar = Seq(t1("hello"), Epsilon());
        testGrammar(grammar, [{t1: 'hello'}]);
    });

    describe('15. Sequence ε + t1:hello', function() {
        const grammar = Seq(Epsilon(), t1("hello"));
        testGrammar(grammar, [{t1: 'hello'}]);
    });

    describe('16. Sequence t1:hello + ε + world', function() {
        const grammar = Seq(t1("hello"), Epsilon(), t1("world"));
        testGrammar(grammar, [{t1: 'helloworld'}]);
    });

    describe('17. Sequence t1:hello + ε + ε + world', function() {
        const grammar = Seq(t1("hello"), Epsilon(), Epsilon(), t1("world"));
        testGrammar(grammar, [{t1: 'helloworld'}]);
    });

    describe('18. Sequence t1:ab + t1:cd + t1:ef', function() {
        const grammar = Seq(t1("ab"), t1("cd"), t1("ef"));
        testGrammar(grammar, [{t1: 'abcdef'}]);
    });
    
    describe('19. Nested sequence (t1:ab + t1:cd) + t1:ef', function() {
        const grammar = Seq(Seq(t1("ab"), t1("cd")), t1("ef"));
        testGrammar(grammar, [{t1: 'abcdef'}]);
    });

    describe('20. Nested sequence t1:ab + (t1:cd + t1:ef)', function() {
        const grammar = Seq(t1("ab"), Seq(t1("cd"), t1("ef")));
        testGrammar(grammar, [{t1: 'abcdef'}]);
    });

    describe('21. Nested sequence t1:ab + (t1:cd) + t1:ef', function() {
        const grammar = Seq(t1("ab"), Seq(t1("cd")), t1("ef"));
        testGrammar(grammar, [{t1: 'abcdef'}]);
    });

    describe('22. t1:hi + t2:yo', function() {
        const grammar = Seq(t1("hi"), t2("yo"));
        testHasTapes(grammar, ["t1", "t2"]);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        const expectedResults: StringDict[] = [
            {t1: 'hi', t2: 'yo'}
        ];
        testGrammar(grammar, expectedResults);
    });
    
    describe('23. t1:hi + t2:yo + t3:hey', function() {
        const grammar = Seq(t1("hi"), t2("yo"), t3("hey"));
        testHasTapes(grammar, ["t1", "t2", "t3"]);
        //testHasVocab(grammar, {t1: 2, t2: 2, t3: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hi', t2: 'yo', t3: 'hey'}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('24. t1:hi + (t2:yo + t3:hey)', function() {
        const grammar = Seq(t1("hi"), Seq(t2("yo"), t3("hey")));
        testHasTapes(grammar, ["t1", "t2", "t3"]);
        //testHasVocab(grammar, {t1: 2, t2: 2, t3: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hi', t2: 'yo', t3: 'hey'}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('25. (t1:hi + t2:yo) + t3:hey', function() {
        const grammar = Seq(Seq(t1("hi"), t2("yo")), t3("hey"));
        testHasTapes(grammar, ["t1", "t2", "t3"]);
        //testHasVocab(grammar, {t1: 2, t2: 2, t3: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hi', t2: 'yo', t3: 'hey'}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('26. Alt t1:hello | t1:goodbye', function() {
        const grammar = Uni(t1("hello"), t1("goodbye"));
        const expectedResults: StringDict[] = [
            {t1: 'hello'},
            {t1: 'goodbye'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('27. Alt t1:hello | ε', function() {
        const grammar = Uni(t1("hello"), Epsilon());
        const expectedResults: StringDict[] = [
            {t1: 'hello'},
            {},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('28. t1:hello + (t1:world | ε)', function() {
        const grammar = Seq(t1("hello"), Uni(t1("world"), Epsilon()));
        const expectedResults: StringDict[] = [
            {t1: 'hello'},
            {t1: 'helloworld'},
        ];
        testGrammar(grammar, expectedResults);
    });

    
    describe('29. (t1:hello | ε) + t1:world', function() {
        const grammar = Seq(Uni(t1("hello"), Epsilon()), t1("world"));
        const expectedResults: StringDict[] = [
            {t1: 'world'},
            {t1: 'helloworld'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('30. Alt of different tapes: t1:hello | t2:goodbye', function() {
        const grammar = Uni(t1("hello"), t2("goodbye"));
        testHasTapes(grammar, ["t1", "t2"]);
        const expectedResults: StringDict[] = [
            {t1: 'hello'},
            {t2: 'goodbye'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('31. Alt of sequences', function() {
        const grammar = Uni(Seq(t1("hello"), t2("kitty")),
                            Seq(t1("goodbye"), t2("world")));
        const expectedResults: StringDict[] = [
            { t1: 'hello', t2: 'kitty' },
            { t1: 'goodbye', t2: 'world' },
        ];
        testGrammar(grammar, expectedResults);
    });


    describe('32. Sequence with alt: ' +
             '(t1:hello | t1:goodbye) + t1:world', function() {
        const grammar = Seq(Uni(t1("hello"), t1("goodbye")), t1("world"));
        const expectedResults: StringDict[] = [
            {t1: 'helloworld'},
            {t1: 'goodbyeworld'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('33. Sequence with alt: ' +
             't1:say + (t1:hello | t1:goodbye)', function() {
        const grammar = Seq(t1("say"), Uni(t1("hello"), t1("goodbye")));
        const expectedResults: StringDict[] = [
            {t1: 'sayhello'},
            {t1: 'saygoodbye'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('34. Sequence with alt: ' +
             '(t1:hello | t1:goodbye) + (t1:world | t1:kitty)', function() {
        const grammar = Seq(Uni(t1("hello"), t1("goodbye")),
                            Uni(t1("world"), t1("kitty")));
        const expectedResults: StringDict[] = [
            {t1: 'helloworld'},
            {t1: 'goodbyeworld'},
            {t1: 'hellokitty'},
            {t1: 'goodbyekitty'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('35. Empty union', function() {
        const grammar = Uni();
        testHasTapes(grammar, []);
        testGrammar(grammar, []);
    });

    describe('36. Union of one ε', function() {
        const grammar = Uni(Epsilon());
        testHasTapes(grammar, []);
        testGrammar(grammar, [{}]);
    });

    describe('37. ε|ε', function() {
        const grammar = Uni(Epsilon(), Epsilon());
        testHasTapes(grammar, []);
        testGrammar(grammar, [{}]);
    });

    describe('38. t1:hello + (ε|ε)', function() {
        const grammar = Seq(t1("hello"), Uni(Epsilon(), Epsilon()));
        testHasTapes(grammar, ["t1"]);
        testGrammar(grammar, [{t1: 'hello'}]);
    }); 

    describe('39. t1:[hi]', function() {
        const grammar = CharSet("t1", ["h", "i"]);
        testHasTapes(grammar, ["t1"]);
        const expectedResults: StringDict[] = [
            {t1: 'h'},
            {t1: 'i'},
        ];
        testGrammar(grammar, expectedResults);
    }); 

    describe('40. t1:[hi] + t1:[hi]', function() {
        const grammar = Seq(CharSet("t1", ["h", "i"]), 
                            CharSet("t1", ["h", "i"]));
        testHasTapes(grammar, ["t1"]);
        const expectedResults: StringDict[] = [
            {t1: 'hh'}, 
            {t1: 'hi'}, 
            {t1: 'ih'}, 
            {t1: 'ii'}
        ];
        testGrammar(grammar, expectedResults);
    }); 
});
