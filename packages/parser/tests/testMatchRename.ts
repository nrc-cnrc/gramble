import { 
    AstComponent, 
    Epsilon, 
    Seq, 
    Uni, 
    Join, 
    Any, 
    Rep, 
    Rename,
    Match
} from "../src/ast";

import { 
    t1, t2, t3, 
    testAstHasTapes, 
    //testHasVocab, 
    //testHasNoVocab,  
    testAst
} from './testUtils';

import * as path from 'path';

describe(`${path.basename(module.filename)}`, function() {

    // 1. Sequence t1:hello + t1 to t2 of t1:hello
    describe('1. Sequence t1:hello + t1 to t2 of t1:hello', function() {
        const grammar1: AstComponent = t1("hello");
        const grammar2: AstComponent = Rename(grammar1, "t1", "t2");
        const grammar: AstComponent = Match(Seq(grammar1, grammar2), "t1", "t2");

        describe("grammar1", function() {
            testAstHasTapes(grammar1, ['t1']);
            //testHasVocab(grammar1, {t1: 4});
            testAst(grammar1, [{t1: 'hello'}]);
        });

        describe("grammar2", function() {
            testAstHasTapes(grammar2, ['t2']);
            //testHasVocab(grammar2, {t2: 4});
            testAst(grammar2, [{t2: 'hello'}]);
        });

        describe("grammar", function() {
            testAstHasTapes(grammar, ['t1', 't2']);
            //testHasVocab(grammar, {t1: 4, t2: 4});
            testAst(grammar, [{t1: 'hello', t2: 'hello'}]);
        });
    });

    // 2. t1 to t2 of Empty grammar
    describe('2. t1 to t2 of Empty grammar', function() {
        const grammar1: AstComponent = Epsilon();
        const grammar2: AstComponent = Rename(grammar1, "t1", "t2");
        const grammar: AstComponent = Match(Seq(grammar1, grammar2), "t1", "t2");

        describe("grammar1", function() {
            testAstHasTapes(grammar1, []);
            testAst(grammar1, [{}]);
        });

        describe("grammar2", function() {
            testAstHasTapes(grammar2, []);
            testAst(grammar2, [{}]);
        }); 

        describe("grammar", function() {
            //testAstHasTapes(grammar, ['t1', 't2']);
            //testHasNoVocab(grammar, 't1');
            //testHasNoVocab(grammar, 't2');
            testAst(grammar, [{}]);
        });
    });

    // 3. t1 to t2 of t1:hello+t1:world
    describe('3. t1 to t2 of t1:hello+t1:world', function() {
        const grammar1: AstComponent = Seq(t1("hello"), t1("world"));
        const grammar2: AstComponent = Rename(grammar1, "t1", "t2");
        const grammar: AstComponent = Match(Seq(grammar1, grammar2), "t1", "t2");

        describe("grammar1", function() {
            testAstHasTapes(grammar1, ['t1']);
            //testHasVocab(grammar1, {t1: 7});
            testAst(grammar1, [{t1: 'helloworld'}]);
        });

        describe("grammar2", function() {
            testAstHasTapes(grammar2, ['t2']);
            //testHasVocab(grammar2, {t2: 7});
            testAst(grammar2, [{t2: 'helloworld'}]);
        });

        describe("grammar", function() {
            testAstHasTapes(grammar, ['t1', 't2']);
            //testHasVocab(grammar, {t1: 7, t2: 7});
            testAst(grammar, [{t1: 'helloworld', t2: 'helloworld'}]);
        });
    });

    // 4. t1 to t2 of t1:hello+t3:goodbye
    describe('4. t1 to t2 of t1:hello+t3:goodbye', function() {
        const grammar1: AstComponent = Seq(t1("hi"), t3("bye"));
        const grammar2: AstComponent = Rename(grammar1, "t1", "t2");
        const grammar: AstComponent = Match(Seq(grammar1, grammar2), "t1", "t2");

        describe("grammar1", function() {
            testAstHasTapes(grammar1, ['t1', 't3']);
            //testHasVocab(grammar1, {t1: 4, t3: 6});
            testAst(grammar1, [{t1: 'hi', t3: 'bye'}]);
        });

        describe("grammar2", function() {
            testAstHasTapes(grammar2, ['t2', 't3']);
            //testHasVocab(grammar2, {t2: 4, t3: 6});
            testAst(grammar2, [{t2: 'hi', t3: 'bye'}]);
        });
        
        describe("grammar", function() {
            testAstHasTapes(grammar, ['t1', 't2', 't3']);
            //testHasVocab(grammar, {t1: 4, t2: 4, t3: 6});
            testAst(grammar, [{t1: 'hi', t2: 'hi', t3: 'byebye'}]);
        });
    });

    // 5. t1 to t2 of Nested sequence (t1:hello+t1:,)+t1:world
    describe('5. t1 to t2 of Nested sequence (t1:hello+t1:,)+t1:world', function() {
        const grammar1: AstComponent = Seq(Seq(t1("hello"), t1(", ")), t1("world"));
        const grammar2: AstComponent = Rename(grammar1, "t1", "t2");
        const grammar: AstComponent = Match(Seq(grammar1, grammar2), "t1", "t2");

        describe("grammar1", function() {
            testAstHasTapes(grammar1, ['t1']);
            //testHasVocab(grammar1, {t1: 9});
            testAst(grammar1, [{t1: 'hello, world'}]);
        });

        describe("grammar2", function() {
            testAstHasTapes(grammar2, ['t2']);
            //testHasVocab(grammar2, {t2: 9});
            testAst(grammar2, [{t2: 'hello, world'}]);
        });

        describe("grammar", function() {
            testAstHasTapes(grammar, ['t1', 't2']);
            //testHasVocab(grammar, {t1: 9, t2: 9});
            testAst(grammar, [{t1: 'hello, world', t2: 'hello, world'}]);
        });
    });

    // 6. t1 to t2 of t1:hello|t1:goodbye
    describe('6. t1 to t2 of t1:hello|t1:goodbye', function() {
        const grammar1: AstComponent = Uni(t1("hello"), t1("goodbye"));
        const grammar2: AstComponent = Rename(grammar1, "t1", "t2");
        const grammar: AstComponent = Match(Seq(grammar1, grammar2), "t1", "t2");

        describe("grammar1", function() {
            testAstHasTapes(grammar1, ['t1']);
            //testHasVocab(grammar1, {t1: 8});
            testAst(grammar1, [{t1: 'hello'},
                                             {t1: 'goodbye'}]);
        });

        describe("grammar2", function() {
            testAstHasTapes(grammar2, ['t2']);
            //testHasVocab(grammar2, {t2: 8});
            testAst(grammar2, [{t2: 'hello'},
                                             {t2: 'goodbye'}]);
        });

        describe("grammar", function() {
            testAstHasTapes(grammar, ['t1', 't2']);
            //testHasVocab(grammar, {t1: 8, t2: 8});
            testAst(grammar, [{t1: 'hello', t2: 'hello'},
                                            {t1: 'goodbye', t2: 'goodbye'}]);
        });
    });

    // 7. t1 to t2 of t1:hello|t3:goodbye
    describe('7. t1 to t2 of t1:hello|t3:goodbye', function() {
        const grammar1: AstComponent = Uni(t1("hello"), t3("goodbye"));
        const grammar2: AstComponent = Rename(grammar1, "t1", "t2");
        const grammar: AstComponent = Match(Seq(grammar1, grammar2), "t1", "t2");

        describe("grammar1", function() {
            testAstHasTapes(grammar1, ['t1', 't3']);
            //testHasVocab(grammar1, {t1: 4, t3: 6});
            testAst(grammar1, [{t1: 'hello'},
                                             {t3: 'goodbye'}]);
        });

        describe("grammar2", function() {
            testAstHasTapes(grammar2, ['t2', 't3']);
            //testHasVocab(grammar2, {t2: 4, t3: 6});
            testAst(grammar2, [{t2: 'hello'},
                                             {t3: 'goodbye'}]);
        });

        describe("grammar", function() {
            testAstHasTapes(grammar, ['t1', 't2', 't3']);
            //testHasVocab(grammar, {t1: 4, t2: 4, t3: 6});
            testAst(grammar, [{t1: 'hello', t2: 'hello'},
                                            {t3: 'goodbyegoodbye'}]);
        });
    });

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

    // 9. t1 to t2 of (t1:hello|t1:goodbye)+(t1:world|t1:kitty)
    describe('9. t1 to t2 of (t1:hello|t1:goodbye)+(t1:world|t1:kitty)', function() {
        const grammar1: AstComponent = Seq(Uni(t1("hello"), t1("goodbye")),
                                    Uni(t1("world"), t1("kitty")));
        const grammar2: AstComponent = Rename(grammar1, "t1", "t2");
        const grammar: AstComponent = Match(Seq(grammar1, grammar2), "t1", "t2");

        describe("grammar1", function() {
            testAstHasTapes(grammar1, ['t1']);
            //testHasVocab(grammar1, {t1: 13});
            testAst(grammar1, [{t1: 'helloworld'},
                                             {t1: 'goodbyeworld'},
                                             {t1: 'hellokitty'},
                                             {t1: 'goodbyekitty'}]);
        });

        describe("grammar2", function() {
            testAstHasTapes(grammar2, ['t2']);
            //testHasVocab(grammar2, {t2: 13});
            testAst(grammar2, [{t2: 'helloworld'},
                                             {t2: 'goodbyeworld'},
                                             {t2: 'hellokitty'},
                                             {t2: 'goodbyekitty'}]);
        });

        describe("grammar", function() {
            testAstHasTapes(grammar, ['t1', 't2']);
            //testHasVocab(grammar, {t1: 13, t2: 13});
            testAst(grammar, [{t1: 'helloworld', t2: 'helloworld'},
                                            {t1: 'goodbyeworld', t2: 'goodbyeworld'},
                                            {t1: 'hellokitty', t2: 'hellokitty'},
                                            {t1: 'goodbyekitty', t2: 'goodbyekitty'}]);
        });
    });

    // 10. t1 to t2 of (t1:hello+t1:kitty)|(t1:goodbye+t1:world)
    describe('10. t1 to t2 of (t1:hello+t1:kitty)|(t1:goodbye+t1:world)', function() {
        const grammar1: AstComponent = Uni(Seq(t1("hello"), t1("kitty")),
                                    Seq(t1("goodbye"), t1("world")));
        const grammar2: AstComponent = Rename(grammar1, "t1", "t2");
        const grammar: AstComponent = Match(Seq(grammar1, grammar2), "t1", "t2");

        describe("grammar1", function() {
            testAstHasTapes(grammar1, ['t1']);
            //testHasVocab(grammar1, {t1: 13});
            testAst(grammar1, [{t1: 'hellokitty'},
                                             {t1: 'goodbyeworld'}]);
        });

        describe("grammar2", function() {
            testAstHasTapes(grammar2, ['t2']);
            //testHasVocab(grammar2, {t2: 13});
            testAst(grammar2, [{t2: 'hellokitty'},
                                             {t2: 'goodbyeworld'}]);
        });

        describe("grammar", function() {
            testAstHasTapes(grammar, ['t1', 't2']);
            //testHasVocab(grammar, {t1: 13, t2: 13});
            testAst(grammar, [{t1: 'hellokitty', t2: 'hellokitty'},
                                            {t1: 'goodbyeworld', t2: 'goodbyeworld'}]);
        });
    });

    // 11. t1 to t2 of t1:hi+t1:.
    describe('11. t1 to t2 of t1:hi+t1:.', function() {
        const grammar1: AstComponent = Seq(t1("hi"), Any("t1"));
        const grammar2: AstComponent = Rename(grammar1, "t1", "t2");
        const grammar: AstComponent = Match(Seq(grammar1, grammar2), "t1", "t2");

        describe("grammar1", function() {
            testAstHasTapes(grammar1, ['t1']);
            //testHasVocab(grammar1, {t1: 2});
            testAst(grammar1, [{t1: 'hih'},
                                             {t1: 'hii'}]);
        });

        describe("grammar2", function() {
            testAstHasTapes(grammar2, ['t2']);
            //testHasVocab(grammar2, {t2: 2});
            testAst(grammar2, [{t2: 'hih'},
                                             {t2: 'hii'}]);
        });

        describe("grammar", function() {
            testAstHasTapes(grammar, ['t1', 't2']);
            //testHasVocab(grammar, {t1: 2, t2: 2});
            testAst(grammar, [{t1: 'hih', t2: 'hih'},
                                            {t1: 'hii', t2: 'hii'}]);
        });
    });

    // 12. t1 to t2 of joining t1:hello & t1:.ello
    describe('12. t1 to t2 of t1:hello & t1:.ello', function() {
        const grammar1: AstComponent = Join(t1("hello"), Seq(Any("t1"), t1('ello')));
        const grammar2: AstComponent = Rename(grammar1, "t1", "t2");
        const grammar: AstComponent = Match(Seq(grammar1, grammar2), "t1", "t2");

        describe("grammar1", function() {
            testAstHasTapes(grammar1, ['t1']);
            //testHasVocab(grammar1, {t1: 4});
            testAst(grammar1, [{t1: 'hello'}]);
        });

        describe("grammar2", function() {
            testAstHasTapes(grammar2, ['t2']);
            //testHasVocab(grammar2, {t2: 4});
            testAst(grammar2, [{t2: 'hello'}]);
        });

        describe("grammar", function() {
            testAstHasTapes(grammar, ['t1', 't2']);
            //testHasVocab(grammar, {t1: 4, t2: 4});
            testAst(grammar, [{t1: 'hello', t2: 'hello'}]);
        });
    });

    // 13. t2 to t3 of joining t1:hello+t1:kitty & (t1:hello+t2:goodbye+t1:kitty)+t2:world
    describe('13. t2 to t3 of joining t1:hello+t1:kitty & (t1:hello+t2:goodbye+t1:kitty)+t2:world', function() {
        const grammar1: AstComponent = Join(Seq(t1("hello"), t1("kitty")),
                                     Seq(Seq(t1("hello"), t2("goodbye"), t1("kitty")),
                                         t2("world")));
        const grammar2: AstComponent = Rename(grammar1, "t2", "t3");
        const grammar: AstComponent = Match(Seq(grammar1, grammar2), "t2", "t3");

        describe("grammar1", function() {
            testAstHasTapes(grammar1, ['t1', 't2']);
            //testHasVocab(grammar1, {t1: 8, t2: 9});
            testAst(grammar1, [{t1: 'hellokitty', t2: 'goodbyeworld'}]);
        });

        describe("grammar2", function() {
            testAstHasTapes(grammar2, ['t1', 't3']);
            //testHasVocab(grammar2, {t1: 8, t3: 9});
            testAst(grammar2, [{t1: 'hellokitty', t3: 'goodbyeworld'}]);
        });

        describe("grammar", function() {
            testAstHasTapes(grammar, ['t1', 't2', 't3']);
            //testHasVocab(grammar, {t1: 8, t2: 9, t3: 9});
            testAst(grammar, [{t1: 'hellokittyhellokitty', t2: 'goodbyeworld', t3: 'goodbyeworld'}]);
        });
    });

    // 14. t1 to t3 of joining t1:hello+t1:kitty & (t1:hello+t2:goodbye+t1:kitty)+t2:world
    describe('14. t1 to t3 of joining t1:hello+t1:kitty & (t1:hello+t2:goodbye+t1:kitty)+t2:world', function() {
        const grammar1: AstComponent = Join(Seq(t1("hello"), t1("kitty")),
                                     Seq(Seq(t1("hello"), t2("goodbye"), t1("kitty")),
                                         t2("world")));
        const grammar2: AstComponent = Rename(grammar1, "t1", "t3");
        const grammar: AstComponent = Match(Seq(grammar1, grammar2), "t1", "t3");

        describe("grammar1", function() {
            testAstHasTapes(grammar1, ['t1', 't2']);
            //testHasVocab(grammar1, {t1: 8, t2: 9});
            testAst(grammar1, [{t1: 'hellokitty', t2: 'goodbyeworld'}]);
        });

        describe("grammar2", function() {
            testAstHasTapes(grammar2, ['t3', 't2']);
            //testHasVocab(grammar2, {t3: 8, t2: 9});
            testAst(grammar2, [{t3: 'hellokitty', t2: 'goodbyeworld'}]);
        });

        describe("grammar", function() {
            testAstHasTapes(grammar, ['t1', 't2', 't3']);
            //testHasVocab(grammar, {t1: 8, t3: 8, t2: 9});
            testAst(grammar, [{t1: 'hellokitty', t3: 'hellokitty', t2: 'goodbyeworldgoodbyeworld'}]);
        });
    });

    // 15. t1 to t2 of t1:o{0,1}
    describe('15. t1 to t2 of t1:o{0,1}', function() {
        const grammar1: AstComponent = Rep(t1("o"), 0, 1);
        const grammar2: AstComponent = Rename(grammar1, "t1", "t2");
        const grammar: AstComponent = Match(Seq(grammar1, grammar2), "t1", "t2");

        describe("grammar1", function() {
            testAstHasTapes(grammar1, ['t1']);
            //testHasVocab(grammar1, {t1: 1});
            testAst(grammar1, [{},
                                             {t1: 'o'}]);
        });

        describe("grammar2", function() {
            testAstHasTapes(grammar2, ['t2']);
            //testHasVocab(grammar2, {t2: 1});
            testAst(grammar2, [{},
                                             {t2: 'o'}]);
        });

        describe("grammar", function() {
            testAstHasTapes(grammar, ['t1', 't2']);
            //testHasVocab(grammar, {t1: 1, t2: 1});
            testAst(grammar, [{},
                                            {t1: 'o', t2: 'o'}]);
        });
    });

    // 16. t1 to t2 of joining t1:h{1,4}+t3:world+t1:ello & the same
    describe('16. t1 to t2 of joining t1:h{1,4}+t3:world+t1:ello & the same', function() {
        const grammar1: AstComponent = Join(Seq(Rep(t1("h"), 1, 4), t3("world"), t1("ello")),
                                     Seq(Rep(t1("h"), 1, 4), t3("world"), t1("ello")));
        const grammar2: AstComponent = Rename(grammar1, "t1", "t2");
        const grammar: AstComponent = Match(Seq(grammar1, grammar2), "t1", "t2");

        describe("grammar1", function() {
            testAstHasTapes(grammar1, ['t1', 't3']);
            //testHasVocab(grammar1, {t1: 4, t3: 5});
            testAst(grammar1, [{t1: 'hello', t3: 'world'},
                                             {t1: 'hhello', t3: 'world'},
                                             {t1: 'hhhello', t3: 'world'},
                                             {t1: 'hhhhello', t3: 'world'}]);
        });

        describe("grammar2", function() {
            testAstHasTapes(grammar2, ['t2', 't3']);
            //testHasVocab(grammar2, {t2: 4, t3: 5});
            testAst(grammar2, [{t2: 'hello', t3: 'world'},
                                             {t2: 'hhello', t3: 'world'},
                                             {t2: 'hhhello', t3: 'world'},
                                             {t2: 'hhhhello', t3: 'world'}]);
        });

        describe("grammar", function() {
            testAstHasTapes(grammar, ['t1', 't2', 't3']);
            //testHasVocab(grammar, {t1: 4, t2: 4, t3: 5});
            testAst(grammar, [{t1: 'hello', t2: 'hello', t3: 'worldworld'},
                                            {t1: 'hhello', t2: 'hhello', t3: 'worldworld'},
                                            {t1: 'hhhello', t2: 'hhhello', t3: 'worldworld'},
                                            {t1: 'hhhhello', t2: 'hhhhello', t3: 'worldworld'}]);
        });
    });

    // 17. t1 to t2 of t1:na{1,4}
    describe('17. t1 to t2 of t1:na{1,4}', function() {
        const grammar1: AstComponent = Rep(t1("na"), 1, 4);
        const grammar2: AstComponent = Rename(grammar1, "t1", "t2");
        const grammar: AstComponent = Match(Seq(grammar1, grammar2), "t1", "t2");

        describe("grammar1", function() {
            testAstHasTapes(grammar1, ['t1']);
            //testHasVocab(grammar1, {t1: 2});
            testAst(grammar1, [{t1: 'na'},
                                             {t1: 'nana'},
                                             {t1: 'nanana'},
                                             {t1: 'nananana'}]);
        });

        describe("grammar2", function() {
            testAstHasTapes(grammar2, ['t2']);
            //testHasVocab(grammar2, {t2: 2});
            testAst(grammar2, [{t2: 'na'},
                                             {t2: 'nana'},
                                             {t2: 'nanana'},
                                             {t2: 'nananana'}]);
        });

        describe("grammar", function() {
            testAstHasTapes(grammar, ['t1', 't2']);
            //testHasVocab(grammar, {t1: 2, t2: 2});
            testAst(grammar, [{t1: 'na', t2: 'na'},
                                            {t1: 'nana', t2: 'nana'},
                                            {t1: 'nanana', t2: 'nanana'},
                                            {t1: 'nananana', t2: 'nananana'}]);
        });
    });

    // 18. t1 to t2 of t1:.{0,2}+t1:hi
    describe('18. t1 to t2 of t1:.{0,2}+t1:hi', function() {
        const grammar1: AstComponent = Seq(Rep(Any("t1"), 0, 2), t1("hi"));
        const grammar2: AstComponent = Rename(grammar1, "t1", "t2");
        const grammar: AstComponent = Match(Seq(grammar1, grammar2), "t1", "t2");

        describe("grammar1", function() {
            testAstHasTapes(grammar1, ['t1']);
            //testHasVocab(grammar1, {t1: 2});
            testAst(grammar1, [{t1: 'hi'},
                                             {t1: 'ihi'},
                                             {t1: 'hhi'},
                                             {t1: 'iihi'},
                                             {t1: 'hihi'},
                                             {t1: 'hhhi'},
                                             {t1: 'ihhi'}]);
        });

        describe("grammar2", function() {
            testAstHasTapes(grammar2, ['t2']);
            //testHasVocab(grammar2, {t2: 2});
            testAst(grammar2, [{t2: 'hi'},
                                             {t2: 'ihi'},
                                             {t2: 'hhi'},
                                             {t2: 'iihi'},
                                             {t2: 'hihi'},
                                             {t2: 'hhhi'},
                                             {t2: 'ihhi'}]);
        });

        describe("grammar", function() {
            testAstHasTapes(grammar, ['t1', 't2']);
            //testHasVocab(grammar, {t1: 2, t2: 2});
            testAst(grammar, [{t1: 'hi', t2: 'hi'},
                                            {t1: 'ihi', t2: 'ihi'},
                                            {t1: 'hhi', t2: 'hhi'},
                                            {t1: 'iihi', t2: 'iihi'},
                                            {t1: 'hihi', t2: 'hihi'},
                                            {t1: 'hhhi', t2: 'hhhi'},
                                            {t1: 'ihhi', t2: 'ihhi'}]);
        });
    });

    // 19. t1 to t2 of t1:.{0,1}+t1:hi+t1:.{0,1}
    describe('19. t1 to t2 of t1:.{0,1}+t1:hi+t1:.{0,1}', function() {
        const grammar1: AstComponent = Seq(Rep(Any("t1"), 0, 1), t1("hi"), Rep(Any("t1"), 0, 1));
        const grammar2: AstComponent = Rename(grammar1, "t1", "t2");
        const grammar: AstComponent = Match(Seq(grammar1, grammar2), "t1", "t2");

        describe("grammar1", function() {
            testAstHasTapes(grammar1, ['t1']);
            //testHasVocab(grammar1, {t1: 2});
            testAst(grammar1, [{t1: 'hi'},
                                             {t1: 'hhi'},
                                             {t1: 'ihi'},
                                             {t1: 'hih'},
                                             {t1: 'hii'},
                                             {t1: 'hhih'},
                                             {t1: 'hhii'},
                                             {t1: 'ihih'},
                                             {t1: 'ihii'}]);
        });

        describe("grammar2", function() {
            testAstHasTapes(grammar2, ['t2']);
            //testHasVocab(grammar2, {t2: 2});
            testAst(grammar2, [{t2: 'hi'},
                                             {t2: 'hhi'},
                                             {t2: 'ihi'},
                                             {t2: 'hih'},
                                             {t2: 'hii'},
                                             {t2: 'hhih'},
                                             {t2: 'hhii'},
                                             {t2: 'ihih'},
                                             {t2: 'ihii'}]);
        });

        describe("grammar", function() {
            testAstHasTapes(grammar, ['t1', 't2']);
            //testHasVocab(grammar, {t1: 2, t2: 2});
            testAst(grammar, [{t1: 'hi', t2: 'hi'},
                                            {t1: 'hhi', t2: 'hhi'},
                                            {t1: 'ihi', t2: 'ihi'},
                                            {t1: 'hih', t2: 'hih'},
                                            {t1: 'hii', t2: 'hii'},
                                            {t1: 'hhih', t2: 'hhih'},
                                            {t1: 'hhii', t2: 'hhii'},
                                            {t1: 'ihih', t2: 'ihih'},
                                            {t1: 'ihii', t2: 'ihii'}]);
        });
    });
 
});