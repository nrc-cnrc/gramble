/*
import { 
    Grammar, 
    Epsilon, 
    Seq, 
    Uni, 
    Join, 
    Any, 
    Rep, 
    Rename,
    Match
} from "../src/grammars";

import { 
    testSuiteName, logTestSuite,
    VERBOSE_TEST_L2,
    t1,
    testHasTapes,  
    testGenerate
} from './testUtil';

import {
    StringDict, SILENT, VERBOSE_DEBUG,
} from "../src/util";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

describe(`${testSuiteName(module)}`, function() {

    logTestSuite(this.title);

    describe('1. Match t1>t2, t1:hello + (Rename t1>t2, t1:hello)', function() {
        const grammar1: Grammar = t1("hello");
        const grammar2: Grammar = Rename(grammar1, "t1", "t2");
        const grammar: Grammar = Match(Seq(grammar1, grammar2), "t1", "t2");

        describe("grammar1", function() {
            testHasTapes(grammar1, ['t1']);
            //testHasVocab(grammar1, {t1: 1});
            const expectedResults: StringDict[] = [
                {t1: 'hello'}
            ];
            testGenerate(grammar1, expectedResults);
        });

        describe("grammar2", function() {
            testHasTapes(grammar2, ['t2']);
            //testHasVocab(grammar2, {t2: 1});
            const expectedResults: StringDict[] = [
                {t2: 'hello'}
            ];
            testGenerate(grammar2, expectedResults);
        });

        describe("grammar", function() {
            testHasTapes(grammar, ['t1', 't2']);
            //testHasVocab(grammar, {t1: 1, t2: 1});
            const expectedResults: StringDict[] = [
                {t1: 'hello', t2: 'hello'}
            ];
            testGenerate(grammar, expectedResults);
        });
    });

    describe('2. Match t1>t2, ε + (Rename t1>t2, ε)', function() {
        const grammar1: Grammar = Epsilon();
        const grammar2: Grammar = Rename(grammar1, "t1", "t2");
        const grammar: Grammar = Match(Seq(grammar1, grammar2), "t1", "t2");

        describe("grammar1", function() {
            testHasTapes(grammar1, []);
            const expectedResults: StringDict[] = [
                {}
            ];
            testGenerate(grammar1, expectedResults);
        });

        describe("grammar2", function() {
            testHasTapes(grammar2, []);
            const expectedResults: StringDict[] = [
                {}
            ];
            testGenerate(grammar2, expectedResults);
        }); 

        describe("grammar", function() {
            //testAstHasTapes(grammar, ['t1', 't2']);
            //testHasNoVocab(grammar, 't1');
            //testHasNoVocab(grammar, 't2');
            const expectedResults: StringDict[] = [
                {}
            ];
            testGenerate(grammar, expectedResults);
        });
    });

    describe('3. Match t1>t2, (t1:hello + t1:world) + ' +
             '(Rename t1>t2, t1:hello + t1:world)', function() {
        const grammar1: Grammar = Seq(t1("hello"), t1("world"));
        const grammar2: Grammar = Rename(grammar1, "t1", "t2");
        const grammar: Grammar = Match(Seq(grammar1, grammar2), "t1", "t2");

        describe("grammar1", function() {
            testHasTapes(grammar1, ['t1']);
            //testHasVocab(grammar1, {t1: 7});
            const expectedResults: StringDict[] = [
                {t1: 'helloworld'}
            ];
            testGenerate(grammar1, expectedResults);
        });

        describe("grammar2", function() {
            testHasTapes(grammar2, ['t2']);
            //testHasVocab(grammar2, {t2: 7});
            const expectedResults: StringDict[] = [
                {t2: 'helloworld'}
            ];
            testGenerate(grammar2, expectedResults);
        });

        describe("grammar", function() {
            testHasTapes(grammar, ['t1', 't2']);
            //testHasVocab(grammar, {t1: 7, t2: 7});
            const expectedResults: StringDict[] = [
                {t1: 'helloworld', t2: 'helloworld'}
            ];
            testGenerate(grammar, expectedResults);
        });
    });

    /*
    describe('4. t1 to t2 of t1:hello+t3:goodbye', function() {
        const grammar1: AstComponent = Seq(t1("hi"), t3("bye"));
        const grammar2: AstComponent = Rename(grammar1, "t1", "t2");
        const grammar: AstComponent = Match(Seq(grammar1, grammar2), "t1", "t2");

        describe("grammar1", function() {
            testHasTapes(grammar1, ['t1', 't3']);
            //testHasVocab(grammar1, {t1: 4, t3: 6});
            testAst(grammar1, [{t1: 'hi', t3: 'bye'}]);
        });

        describe("grammar2", function() {
            testHasTapes(grammar2, ['t2', 't3']);
            //testHasVocab(grammar2, {t2: 4, t3: 6});
            testAst(grammar2, [{t2: 'hi', t3: 'bye'}]);
        });
        
        describe("grammar", function() {
            testHasTapes(grammar, ['t1', 't2', 't3']);
            //testHasVocab(grammar, {t1: 4, t2: 4, t3: 6});
            testAst(grammar, [{t1: 'hi', t2: 'hi', t3: 'byebye'}]);
        });
    });
    */

    /*
    describe('5. Match t1>t2, ((t1:hello+t1:,) + t1:world) + ' +
             '(Rename t1>t2, (t1:hello+t1:,) + t1:world)', function() {
        const grammar1: Grammar = Seq(Seq(t1("hello"), t1(", ")), t1("world"));
        const grammar2: Grammar = Rename(grammar1, "t1", "t2");
        const grammar: Grammar = Match(Seq(grammar1, grammar2), "t1", "t2");

        describe("grammar1", function() {
            testHasTapes(grammar1, ['t1']);
            //testHasVocab(grammar1, {t1: 9});
            const expectedResults: StringDict[] = [
                {t1: 'hello, world'}
            ];
            testGenerate(grammar1, expectedResults);
        });

        describe("grammar2", function() {
            testHasTapes(grammar2, ['t2']);
            //testHasVocab(grammar2, {t2: 9});
            const expectedResults: StringDict[] = [
                {t2: 'hello, world'}
            ];
            testGenerate(grammar2, expectedResults);
        });

        describe("grammar", function() {
            testHasTapes(grammar, ['t1', 't2']);
            //testHasVocab(grammar, {t1: 9, t2: 9});
            const expectedResults: StringDict[] = [
                {t1: 'hello, world', t2: 'hello, world'}
            ];
            testGenerate(grammar, expectedResults);
        });
    });

    describe('6. Match t1>t2, (t1:hello | t1:goodbye) + ' +
             '(Rename t1>t2, t1:hello | t1:goodbye)', function() {
        const grammar1: Grammar = Uni(t1("hello"), t1("goodbye"));
        const grammar2: Grammar = Rename(grammar1, "t1", "t2");
        const grammar: Grammar = Match(Seq(grammar1, grammar2), "t1", "t2");

        describe("grammar1", function() {
            testHasTapes(grammar1, ['t1']);
            //testHasVocab(grammar1, {t1: 8});
            const expectedResults: StringDict[] = [
                {t1: 'hello'},
                {t1: 'goodbye'},
            ];
            testGenerate(grammar1, expectedResults);
        });

        describe("grammar2", function() {
            testHasTapes(grammar2, ['t2']);
            //testHasVocab(grammar2, {t2: 8});
            const expectedResults: StringDict[] = [
                {t2: 'hello'},
                {t2: 'goodbye'},
            ];
            testGenerate(grammar2, expectedResults);
        });

        describe("grammar", function() {
            testHasTapes(grammar, ['t1', 't2']);
            //testHasVocab(grammar, {t1: 8, t2: 8});
            const expectedResults: StringDict[] = [
                {t1: 'hello', t2: 'hello'},
                {t1: 'goodbye', t2: 'goodbye'},
            ];
            testGenerate(grammar, expectedResults);
        });
    });

    /*
    describe('7. t1 to t2 of t1:hello|t3:goodbye', function() {
        const grammar1: AstComponent = Uni(t1("hello"), t3("goodbye"));
        const grammar2: AstComponent = Rename(grammar1, "t1", "t2");
        const grammar: AstComponent = Match(Seq(grammar1, grammar2), "t1", "t2");

        describe("grammar1", function() {
            testHasTapes(grammar1, ['t1', 't3']);
            //testHasVocab(grammar1, {t1: 4, t3: 6});
            testAst(grammar1, [{t1: 'hello'},
                                             {t3: 'goodbye'}]);
        });

        describe("grammar2", function() {
            testHasTapes(grammar2, ['t2', 't3']);
            //testHasVocab(grammar2, {t2: 4, t3: 6});
            testAst(grammar2, [{t2: 'hello'},
                                             {t3: 'goodbye'}]);
        });

        describe("grammar", function() {
            testHasTapes(grammar, ['t1', 't2', 't3']);
            //testHasVocab(grammar, {t1: 4, t2: 4, t3: 6});
            testAst(grammar, [{t1: 'hello', t2: 'hello'},
                                            {t3: 'goodbyegoodbye'}]);
        });
    });
    */

    /*
    I think this one is no longer true in the current semantics

    // 8. t1 to t2 of t3:hello|t1:goodbye
    describe('8. t1 to t2 of t3:hello|t1:goodbye', function() {
        const grammar1: AstComponent = Uni(t3("hello"), t1("goodbye"));
        const grammar2: AstComponent = Rename(grammar1, "t1", "t2");
        const grammar: AstComponent = Match(Seq(grammar1, grammar2), "t1", "t2");

        describe("grammar1", function() {
            testAstHasTapes(grammar1, ['t1', 't3']);
            //testHasVocab(grammar1, {t1: 6, t3: 4});
            testAst(grammar1, [{t3: 'hello'},
                               {t1: 'goodbye'}]);
        });

        describe("grammar2", function() {
            testAstHasTapes(grammar2, ['t2', 't3']);
            //testHasVocab(grammar2, {t2: 6, t3: 4});
            testAst(grammar2, [{t3: 'hello'},
                               {t2: 'goodbye'}]);
        });

        describe("grammar", function() {
            testAstHasTapes(grammar, ['t1', 't2', 't3']);
            //testHasVocab(grammar, {t1: 6, t2: 6, t3: 4});
            testAst(grammar, [{t3: 'hellohello'},
                            {t1: 'goodbye', t2: 'goodbye'}]);
        });
    });
    */

    /*
    describe('9. Match t1>t2, ((t1:hello|t1:goodbye) + (t1:world|t1:kitty)) + ' +
             '(Rename t1>t2, (t1:hello|t1:goodbye) + (t1:world|t1:kitty))', function() {
        const grammar1: Grammar = Seq(Uni(t1("hello"), t1("goodbye")),
                                      Uni(t1("world"), t1("kitty")));
        const grammar2: Grammar = Rename(grammar1, "t1", "t2");
        const grammar: Grammar = Match(Seq(grammar1, grammar2), "t1", "t2");

        describe("grammar1", function() {
            testHasTapes(grammar1, ['t1']);
            //testHasVocab(grammar1, {t1: 13});
            const expectedResults: StringDict[] = [
                {t1: 'helloworld'},
                {t1: 'goodbyeworld'},
                {t1: 'hellokitty'},
                {t1: 'goodbyekitty'},
            ];
            testGenerate(grammar1, expectedResults);
        });

        describe("grammar2", function() {
            testHasTapes(grammar2, ['t2']);
            //testHasVocab(grammar2, {t2: 13});
            const expectedResults: StringDict[] = [
                {t2: 'helloworld'},
                {t2: 'goodbyeworld'},
                {t2: 'hellokitty'},
                {t2: 'goodbyekitty'},
            ];
            testGenerate(grammar2, expectedResults);
        });

        describe("grammar", function() {
            testHasTapes(grammar, ['t1', 't2']);
            //testHasVocab(grammar, {t1: 13, t2: 13});
            const expectedResults: StringDict[] = [
                {t1: 'helloworld', t2: 'helloworld'},
                {t1: 'goodbyeworld', t2: 'goodbyeworld'},
                {t1: 'hellokitty', t2: 'hellokitty'},
                {t1: 'goodbyekitty', t2: 'goodbyekitty'},
            ];
            testGenerate(grammar, expectedResults);
        });
    });

    describe('10. Match t1>t2, ((t1:hello+t1:kitty) | (t1:goodbye+t1:world)) + ' +
             '(Rename t1>t2, (t1:hello+t1:kitty) | (t1:goodbye+t1:world))', function() {
        const grammar1: Grammar = Uni(Seq(t1("hello"), t1("kitty")),
                                      Seq(t1("goodbye"), t1("world")));
        const grammar2: Grammar = Rename(grammar1, "t1", "t2");
        const grammar: Grammar = Match(Seq(grammar1, grammar2), "t1", "t2");

        describe("grammar1", function() {
            testHasTapes(grammar1, ['t1']);
            //testHasVocab(grammar1, {t1: 13});
            const expectedResults: StringDict[] = [
                {t1: 'hellokitty'},
                {t1: 'goodbyeworld'},
            ];
            testGenerate(grammar1, expectedResults);
        });

        describe("grammar2", function() {
            testHasTapes(grammar2, ['t2']);
            //testHasVocab(grammar2, {t2: 13});
            const expectedResults: StringDict[] = [
                {t2: 'hellokitty'},
                {t2: 'goodbyeworld'},
            ];
            testGenerate(grammar2, expectedResults);
        });

        describe("grammar", function() {
            testHasTapes(grammar, ['t1', 't2']);
            //testHasVocab(grammar, {t1: 13, t2: 13});
            const expectedResults: StringDict[] = [
                {t1: 'hellokitty', t2: 'hellokitty'},
                {t1: 'goodbyeworld', t2: 'goodbyeworld'},
            ];
            testGenerate(grammar, expectedResults);
        });
    });

    describe('11. Match t1>t2, (t1:hi + t1:.) + ' +
             '(Rename t1>t2, t1:hi + t1:.)', function() {
        const grammar1: Grammar = Seq(t1("hi"), Any("t1"));
        const grammar2: Grammar = Rename(grammar1, "t1", "t2");
        const grammar: Grammar = Match(Seq(grammar1, grammar2), "t1", "t2");

        describe("grammar1", function() {
            testHasTapes(grammar1, ['t1']);
            //testHasVocab(grammar1, {t1: 2});
            const expectedResults: StringDict[] = [
                {t1: 'hih'},
                {t1: 'hii'},
            ];
            testGenerate(grammar1, expectedResults);
        });

        describe("grammar2", function() {
            testHasTapes(grammar2, ['t2']);
            //testHasVocab(grammar2, {t2: 2});
            const expectedResults: StringDict[] = [
                {t2: 'hih'},
                {t2: 'hii'},
            ];
            testGenerate(grammar2, expectedResults);
        });

        describe("grammar", function() {
            testHasTapes(grammar, ['t1', 't2']);
            //testHasVocab(grammar, {t1: 2, t2: 2});
            const expectedResults: StringDict[] = [
                {t1: 'hih', t2: 'hih'},
                {t1: 'hii', t2: 'hii'},
            ];
            testGenerate(grammar, expectedResults);
        });
    });

    describe('12. Match t1>t2, (t1:hello ⨝ t1:.ello) + ' +
             '(Rename t1>t2, t1:hello ⨝ t1:.ello)', function() {
        const grammar1: Grammar = Join(t1("hello"), Seq(Any("t1"), t1('ello')));
        const grammar2: Grammar = Rename(grammar1, "t1", "t2");
        const grammar: Grammar = Match(Seq(grammar1, grammar2), "t1", "t2");

        describe("grammar1", function() {
            testHasTapes(grammar1, ['t1']);
            //testHasVocab(grammar1, {t1: 4});
            const expectedResults: StringDict[] = [
                {t1: 'hello'}
            ];
            testGenerate(grammar1, expectedResults);
        });

        describe("grammar2", function() {
            testHasTapes(grammar2, ['t2']);
            //testHasVocab(grammar2, {t2: 4});
            const expectedResults: StringDict[] = [
                {t2: 'hello'}
            ];
            testGenerate(grammar2, expectedResults);
        });

        describe("grammar", function() {
            testHasTapes(grammar, ['t1', 't2']);
            //testHasVocab(grammar, {t1: 4, t2: 4});
            const expectedResults: StringDict[] = [
                {t1: 'hello', t2: 'hello'}
            ];
            testGenerate(grammar, expectedResults);
        });
    });

    /*
    describe('13. t2 to t3 of joining t1:hello+t1:kitty & (t1:hello+t2:goodbye+t1:kitty)+t2:world', function() {
        const grammar1: AstComponent = Join(Seq(t1("hello"), t1("kitty")),
                                     Seq(Seq(t1("hello"), t2("goodbye"), t1("kitty")),
                                         t2("world")));
        const grammar2: AstComponent = Rename(grammar1, "t2", "t3");
        const grammar: AstComponent = Match(Seq(grammar1, grammar2), "t2", "t3");

        describe("grammar1", function() {
            testHasTapes(grammar1, ['t1', 't2']);
            //testHasVocab(grammar1, {t1: 8, t2: 9});
            testAst(grammar1, [{t1: 'hellokitty', t2: 'goodbyeworld'}]);
        });

        describe("grammar2", function() {
            testHasTapes(grammar2, ['t1', 't3']);
            //testHasVocab(grammar2, {t1: 8, t3: 9});
            testAst(grammar2, [{t1: 'hellokitty', t3: 'goodbyeworld'}]);
        });

        describe("grammar", function() {
            testHasTapes(grammar, ['t1', 't2', 't3']);
            //testHasVocab(grammar, {t1: 8, t2: 9, t3: 9});
            testAst(grammar, [{t1: 'hellokittyhellokitty', t2: 'goodbyeworld', t3: 'goodbyeworld'}]);
        });
    });

    describe('14. t1 to t3 of joining t1:hello+t1:kitty & (t1:hello+t2:goodbye+t1:kitty)+t2:world', function() {
        const grammar1: AstComponent = Join(Seq(t1("hello"), t1("kitty")),
                                     Seq(Seq(t1("hello"), t2("goodbye"), t1("kitty")),
                                         t2("world")));
        const grammar2: AstComponent = Rename(grammar1, "t1", "t3");
        const grammar: AstComponent = Match(Seq(grammar1, grammar2), "t1", "t3");

        describe("grammar1", function() {
            testHasTapes(grammar1, ['t1', 't2']);
            //testHasVocab(grammar1, {t1: 8, t2: 9});
            testAst(grammar1, [{t1: 'hellokitty', t2: 'goodbyeworld'}]);
        });

        describe("grammar2", function() {
            testHasTapes(grammar2, ['t3', 't2']);
            //testHasVocab(grammar2, {t3: 8, t2: 9});
            testAst(grammar2, [{t3: 'hellokitty', t2: 'goodbyeworld'}]);
        });

        describe("grammar", function() {
            testHasTapes(grammar, ['t1', 't2', 't3']);
            //testHasVocab(grammar, {t1: 8, t3: 8, t2: 9});
            testAst(grammar, [{t1: 'hellokitty', t3: 'hellokitty', t2: 'goodbyeworldgoodbyeworld'}]);
        });
    });
    */
/*
    describe('15. Match t1>t2, t1:o{0,1} + (Rename t1>t2, t1:o{0,1})', function() {
        const grammar1: Grammar = Rep(t1("o"), 0, 1);
        const grammar2: Grammar = Rename(grammar1, "t1", "t2");
        const grammar: Grammar = Match(Seq(grammar1, grammar2), "t1", "t2");

        describe("grammar1", function() {
            testHasTapes(grammar1, ['t1']);
            //testHasVocab(grammar1, {t1: 1});
            const expectedResults: StringDict[] = [
                {},
                {t1: 'o'},
            ];
            testGenerate(grammar1, expectedResults);
        });

        describe("grammar2", function() {
            testHasTapes(grammar2, ['t2']);
            //testHasVocab(grammar2, {t2: 1});
            const expectedResults: StringDict[] = [
                {},
                {t2: 'o'},
            ];
            testGenerate(grammar2, expectedResults);
        });

        describe("grammar", function() {
            testHasTapes(grammar, ['t1', 't2']);
            //testHasVocab(grammar, {t1: 1, t2: 1});
            const expectedResults: StringDict[] = [
                {},
                {t1: 'o', t2: 'o'},
            ];
            testGenerate(grammar, expectedResults);
        });
    });

    /*
    describe('16. t1 to t2 of joining t1:h{1,4}+t3:world+t1:ello & the same', function() {
        const grammar1: AstComponent = Join(Seq(Rep(t1("h"), 1, 4), t3("world"), t1("ello")),
                                     Seq(Rep(t1("h"), 1, 4), t3("world"), t1("ello")));
        const grammar2: AstComponent = Rename(grammar1, "t1", "t2");
        const grammar: AstComponent = Match(Seq(grammar1, grammar2), "t1", "t2");

        describe("grammar1", function() {
            testHasTapes(grammar1, ['t1', 't3']);
            //testHasVocab(grammar1, {t1: 4, t3: 5});
            testAst(grammar1, [{t1: 'hello', t3: 'world'},
                                             {t1: 'hhello', t3: 'world'},
                                             {t1: 'hhhello', t3: 'world'},
                                             {t1: 'hhhhello', t3: 'world'}]);
        });

        describe("grammar2", function() {
            testHasTapes(grammar2, ['t2', 't3']);
            //testHasVocab(grammar2, {t2: 4, t3: 5});
            testAst(grammar2, [{t2: 'hello', t3: 'world'},
                                             {t2: 'hhello', t3: 'world'},
                                             {t2: 'hhhello', t3: 'world'},
                                             {t2: 'hhhhello', t3: 'world'}]);
        });

        describe("grammar", function() {
            testHasTapes(grammar, ['t1', 't2', 't3']);
            //testHasVocab(grammar, {t1: 4, t2: 4, t3: 5});
            testAst(grammar, [{t1: 'hello', t2: 'hello', t3: 'worldworld'},
                                            {t1: 'hhello', t2: 'hhello', t3: 'worldworld'},
                                            {t1: 'hhhello', t2: 'hhhello', t3: 'worldworld'},
                                            {t1: 'hhhhello', t2: 'hhhhello', t3: 'worldworld'}]);
        });
    });
    */
   /*
    describe('17. Match t1>t2, t1:na{1,4} + (Rename t1>t2, t1:na{1,4})', function() {
        const grammar1: Grammar = Rep(t1("na"), 1, 4);
        const grammar2: Grammar = Rename(grammar1, "t1", "t2");
        const grammar: Grammar = Match(Seq(grammar1, grammar2), "t1", "t2");

        describe("grammar1", function() {
            testHasTapes(grammar1, ['t1']);
            //testHasVocab(grammar1, {t1: 2});
            const expectedResults: StringDict[] = [
                {t1: 'na'},
                {t1: 'nana'},
                {t1: 'nanana'},
                {t1: 'nananana'},
            ];
            testGenerate(grammar1, expectedResults);
        });

        describe("grammar2", function() {
            testHasTapes(grammar2, ['t2']);
            //testHasVocab(grammar2, {t2: 2});
            const expectedResults: StringDict[] = [
                {t2: 'na'},
                {t2: 'nana'},
                {t2: 'nanana'},
                {t2: 'nananana'},
            ];
            testGenerate(grammar2, expectedResults);
        });

        describe("grammar", function() {
            testHasTapes(grammar, ['t1', 't2']);
            //testHasVocab(grammar, {t1: 2, t2: 2});
            const expectedResults: StringDict[] = [
                {t1: 'na', t2: 'na'},
                {t1: 'nana', t2: 'nana'},
                {t1: 'nanana', t2: 'nanana'},
                {t1: 'nananana', t2: 'nananana'},
            ];
            testGenerate(grammar, expectedResults);
        });
    });

    describe('18. Match t1>t2, (t1:.{0,2} + t1:hi) + ' +
             '(Rename t1>t2, t1:.{0,2} + t1:hi)', function() {
        const grammar1: Grammar = Seq(Rep(Any("t1"), 0, 2), t1("hi"));
        const grammar2: Grammar = Rename(grammar1, "t1", "t2");
        const grammar: Grammar = Match(Seq(grammar1, grammar2), "t1", "t2");

        describe("grammar1", function() {
            testHasTapes(grammar1, ['t1']);
            //testHasVocab(grammar1, {t1: 2});
            const expectedResults: StringDict[] = [
                {t1: 'hi'},
                {t1: 'ihi'},  {t1: 'hhi'},
                {t1: 'iihi'}, {t1: 'hihi'},
                {t1: 'hhhi'}, {t1: 'ihhi'},
            ];
            testGenerate(grammar1, expectedResults);
        });

        describe("grammar2", function() {
            testHasTapes(grammar2, ['t2']);
            //testHasVocab(grammar2, {t2: 2});
            const expectedResults: StringDict[] = [
                {t2: 'hi'},
                {t2: 'ihi'},  {t2: 'hhi'},
                {t2: 'iihi'}, {t2: 'hihi'},
                {t2: 'hhhi'}, {t2: 'ihhi'},
            ];
            testGenerate(grammar2, expectedResults);
        });

        describe("grammar", function() {
            testHasTapes(grammar, ['t1', 't2']);
            //testHasVocab(grammar, {t1: 2, t2: 2});
            const expectedResults: StringDict[] = [
                {t1: 'hi', t2: 'hi'},
                {t1: 'ihi', t2: 'ihi'},   {t1: 'hhi', t2: 'hhi'},
                {t1: 'iihi', t2: 'iihi'}, {t1: 'hihi', t2: 'hihi'},
                {t1: 'hhhi', t2: 'hhhi'}, {t1: 'ihhi', t2: 'ihhi'},
            ];
            testGenerate(grammar, expectedResults);
        });
    });

    describe('19. Match t1>t2, (t1:.{0,1} + t1:hi + t1:.{0,1}) + ' +
             '(Rename t1>t2, t1:.{0,1} + t1:hi + t1:.{0,1})', function() {
        const grammar1: Grammar = Seq(Rep(Any("t1"), 0, 1),
                                      t1("hi"),
                                      Rep(Any("t1"), 0, 1));
        const grammar2: Grammar = Rename(grammar1, "t1", "t2");
        const grammar: Grammar = Match(Seq(grammar1, grammar2), "t1", "t2");

        describe("grammar1", function() {
            testHasTapes(grammar1, ['t1']);
            //testHasVocab(grammar1, {t1: 2});
            const expectedResults: StringDict[] = [
                {t1: 'hi'},
                {t1: 'hhi'},  {t1: 'ihi'},
                {t1: 'hih'},  {t1: 'hii'},
                {t1: 'hhih'}, {t1: 'hhii'},
                {t1: 'ihih'}, {t1: 'ihii'},
            ];
            testGenerate(grammar1, expectedResults);
        });

        describe("grammar2", function() {
            testHasTapes(grammar2, ['t2']);
            //testHasVocab(grammar2, {t2: 2});
            const expectedResults: StringDict[] = [
                {t2: 'hi'},
                {t2: 'hhi'},  {t2: 'ihi'},
                {t2: 'hih'},  {t2: 'hii'},
                {t2: 'hhih'}, {t2: 'hhii'},
                {t2: 'ihih'}, {t2: 'ihii'},
            ];
            testGenerate(grammar2, expectedResults);
        });

        describe("grammar", function() {
            testHasTapes(grammar, ['t1', 't2']);
            //testHasVocab(grammar, {t1: 2, t2: 2});
            const expectedResults: StringDict[] = [
                {t1: 'hi', t2: 'hi'},
                {t1: 'hhi', t2: 'hhi'},   {t1: 'ihi', t2: 'ihi'},
                {t1: 'hih', t2: 'hih'},   {t1: 'hii', t2: 'hii'},
                {t1: 'hhih', t2: 'hhih'}, {t1: 'hhii', t2: 'hhii'},
                {t1: 'ihih', t2: 'ihih'}, {t1: 'ihii', t2: 'ihii'},
            ];
            testGenerate(grammar, expectedResults);
        });
    });
    
});
*/