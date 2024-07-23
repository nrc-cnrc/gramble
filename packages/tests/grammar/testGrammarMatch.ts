import { 
    CharSet, Count, Dot,
    Epsilon, Join, Match, Null,
    Rep, Seq, Uni, WithVocab,
} from "../../interpreter/src/grammarConvenience";

import { Grammar } from "../../interpreter/src/grammars";

import {
    grammarTestSuiteName,
    testGrammar,
    t1, t2, t4,
} from "./testGrammarUtil";

import { 
    logTestSuite, VERBOSE_TEST_L2,
} from "../testUtil";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

describe(`${grammarTestSuiteName(module)}`, function() {

    logTestSuite(this.title);

    testGrammar({
        desc: '1. Match t1>t2, t1:hello',
        grammar: Match(
                     t1("hello"),
                     "t1", "t2"
                 ),
        tapes: ['t1', 't2'],
        vocab: {t1: [..."helo"], t2: [..."helo"]},
        results: [
            {t1: 'hello', t2: 'hello'},
        ],
    });

    testGrammar({
        desc: '2. Match t1>t2, ε',
        grammar: Match(
                     Epsilon(),
                     "t1", "t2"
                 ),
        tapes: ['t2'],
        vocab: {t2: 0},
        results: [
            {},
        ],
    });

    testGrammar({
        desc: '3. Match t1>t2, ∅',
        grammar: Match(
                     Null(),
                     "t1", "t2"
                 ),
        tapes: ['t2'],
        vocab: {t2: 0},
        results: [
        ],
    });

    testGrammar({
        desc: '4. Match t1>t2, t1:hello + t1:world',
        grammar: Match(
                     Seq(t1("hello"), t1("world")),
                     "t1", "t2"
                 ),
        tapes: ['t1', 't2'],
        vocab: {t1: [..."helowrd"], t2: [..."helowrd"]},
        results: [
            {t1: 'helloworld', t2: 'helloworld'},
        ],
    });

    testGrammar({
        desc: '5. Match t1>t2, t1:hello + t4:goodbye',
        grammar: Match(
                     Seq(t1("hello"), t4("goodbye")),
                     "t1", "t2"
                 ),
        tapes: ['t1', 't2', 't4'],
        vocab: {t1: [..."helo"], t2: [..."helo"], t4: [..."godbye"]},
        results: [
            {t1: 'hello', t2: 'hello', t4: 'goodbye'},
        ],
    });

    testGrammar({
        desc: '6. Match t1>t2, t4:goodbye + t1:hello',
        grammar: Match(
                     Seq(t4("goodbye"), t1("hello")),
                     "t1", "t2"
                 ),
        tapes: ['t1', 't2', 't4'],
        vocab: {t1: [..."helo"], t2: [..."helo"], t4: [..."godbye"]},
        results: [
            {t1: 'hello', t2: 'hello', t4: 'goodbye'},
        ],
    });

    testGrammar({
        desc: '7. Match t1>t2, Nested sequence ' +
              '(t1:hello+t1:,) + t1:world',
        grammar: Match(
                     Seq(Seq(t1("hello"), t1(", ")), t1("world")),
                     "t1", "t2"
                 ),
        tapes: ['t1', 't2'],
        vocab: {t1: [..."helo, wrd"], t2: [..."helo, wrd"]},
        results: [
            {t1: 'hello, world', t2: 'hello, world'},
        ],
    });

    testGrammar({
        desc: '8. Match t1>t2, t1:hello | t1:goodbye',
        grammar: Match(
                     Uni(t1("hello"), t1("goodbye")),
                     "t1", "t2"
                 ),
        tapes: ['t1', 't2'],
        vocab: {t1: [..."helogdby"], t2: [..."helogdby"]},
        results: [
            {t1: 'hello', t2: 'hello'},
            {t1: 'goodbye', t2: 'goodbye'},
        ],
    });

    testGrammar({
        desc: '9. Match t1>t2, t1:hello | t4:goodbye',
        grammar: Match(
                     Uni(t1("hello"), t4("goodbye")),
                     "t1", "t2"
                 ),
        tapes: ['t1', 't2', 't4'],
        vocab: {t1: [..."helo"], t2: [..."helo"], t4: [..."godbye"]},
        results: [
            {t1: 'hello', t2: 'hello'},
            {t4: 'goodbye'},
        ],
    });

    testGrammar({
        desc: '10. Match t1>t2, t4:goodbye | t1:hello',
        grammar: Match(
                     Uni(t4("goodbye"), t1("hello")),
                     "t1", "t2"
                 ),
        tapes: ['t1', 't2', 't4'],
        vocab: {t1: [..."helo"], t2: [..."helo"], t4: [..."godbye"]},
        results: [
            {t1: 'hello', t2: 'hello'},
            {t4: 'goodbye'},
        ],
    });

    testGrammar({
        desc: '11. Match t1>t2, ' +
              '(t1:hello|t1:goodbye) + (t1:world|t1:kitty)',
        grammar: Match(
                     Seq(Uni(t1("hello"), t1("goodbye")),
                         Uni(t1("world"), t1("kitty"))),
                     "t1", "t2"
                 ),
        tapes: ['t1', 't2'],
        vocab: {t1: [..."helowrdgbykit"], t2: [..."helowrdgbykit"]},
        results: [
            {t1: 'helloworld', t2: 'helloworld'},
            {t1: 'goodbyeworld', t2: 'goodbyeworld'},
            {t1: 'hellokitty', t2: 'hellokitty'},
            {t1: 'goodbyekitty', t2: 'goodbyekitty'},
        ],
    });

    testGrammar({
        desc: '12. Match t1>t2, ' +
              '(t1:hello+t1:kitty) | (t1:goodbye+t1:world)',
        grammar: Match(
                     Uni(Seq(t1("hello"), t1("kitty")),
                         Seq(t1("goodbye"), t1("world"))),
                     "t1", "t2"
                 ),
        tapes: ['t1', 't2'],
        vocab: {t1: [..."helowrdgbykit"], t2: [..."helowrdgbykit"]},
        results: [
            {t1: 'hellokitty', t2: 'hellokitty'},
            {t1: 'goodbyeworld', t2: 'goodbyeworld'},
        ],
    });

    testGrammar({
        desc: '13. Match t1>t2, t1:. (vocab t1:hi)',
        grammar: WithVocab({t1: "hi"},
                     Match(
                         Dot("t1"),
                         "t1", "t2"
                     )),
        tapes: ['t1', 't2'],
        vocab: {t1: [..."hi"], t2: [..."hi"]},
        results: [
            {t1: 'h', t2: 'h'},
            {t1: 'i', t2: 'i'},
        ],
    });

    testGrammar({
        desc: '14. Match t1>t2, t1:hi+t1:.',
        grammar: Match(
                     Seq(t1("hi"), Dot("t1")),
                     "t1", "t2"
                 ),
        tapes: ['t1', 't2'],
        vocab: {t1: [..."hi"], t2: [..."hi"]},
        results: [
            {t1: 'hih', t2: 'hih'},
            {t1: 'hii', t2: 'hii'},
        ],
    });

    testGrammar({
        desc: '15. Match t1>t2, Join t1:hello ⨝ t1:.ello',
        grammar: Match(
                     Join(t1("hello"),
                          Seq(Dot("t1"), t1('ello'))),
                     "t1", "t2"
                 ),
        tapes: ['t1', 't2'],
        vocab: {t1: [..."helo"], t2: [..."helo"]},
        results: [
            {t1: 'hello', t2: 'hello'},
        ],
    });

    testGrammar({
        desc: '16. Match t1>t2, Join t1:hello ⨝ t4:world',
        grammar: Match(
                     Join(t1("hello"), t4('world')),
                     "t1", "t2"
                 ),
        tapes: ['t1', 't2', 't4'],
        vocab: {t1: [..."helo"], t2: [..."helo"], t4: [..."world"]},
        results: [
            {t1: 'hello', t2: 'hello', t4: 'world'},
        ],
    });

    testGrammar({
        desc: '17. Match t1>t2, Join t4:world ⨝ t1:hello',
        grammar: Match(
                     Join(t4('world'), t1("hello")),
                     "t1", "t2"
                 ),
        tapes: ['t1', 't2', 't4'],
        vocab: {t1: [..."helo"], t2: [..."helo"], t4: [..."world"]},
        results: [
            {t1: 'hello', t2: 'hello', t4: 'world'},
        ],
    });

    testGrammar({
        desc: '18. Match t2>t3, Join ' +
              't1:hello+t1:kitty ⨝ (t1:hello+t2:goodbye+t1:kitty)+t2:world',
        grammar: Match(
                     Join(Seq(t1("hello"), t1("kitty")),
                          Seq(Seq(t1("hello"), t2("goodbye"), t1("kitty")),
                              t2("world"))),
                     "t2", "t3"
                 ),
        tapes: ['t1', 't2', 't3'],
        vocab: {t1: [..."helokity"], t2: [..."godbyewrl"], t3: [..."godbyewrl"]},
        results: [
            {t1: 'hellokitty', t2: 'goodbyeworld', t3: 'goodbyeworld'},
        ],
    });

    testGrammar({
        desc: '19. Match t2>t3, Join ' +
              '(t1:hello+t2:goodbye+t1:kitty)+t2:world ⨝ t1:hello+t1:kitty',
        grammar: Match(
                     Join(Seq(Seq(t1("hello"), t2("goodbye"), t1("kitty")),
                              t2("world")),
                          Seq(t1("hello"), t1("kitty"))),
                     "t2", "t3"
                 ),
        tapes: ['t1', 't2', 't3'],
        vocab: {t1: [..."helokity"], t2: [..."godbyewrl"], t3: [..."godbyewrl"]},
        results: [
            {t1: 'hellokitty', t2: 'goodbyeworld', t3: 'goodbyeworld'},
        ],
    });

    testGrammar({
        desc: '20. Match t1>t3, Join ' +
              't1:hello+t1:kitty ⨝ (t1:hello+t2:goodbye+t1:kitty)+t2:world',
        grammar: Match(
                     Join(Seq(t1("hello"), t1("kitty")),
                          Seq(Seq(t1("hello"), t2("goodbye"), t1("kitty")),
                              t2("world"))),
                     "t1", "t3"
                 ),
        tapes: ['t1', 't2', 't3'],
        vocab: {t1: [..."helokity"], t2: [..."godbyewrl"], t3: [..."helokity"]},
        results: [
            {t1: 'hellokitty', t2: 'goodbyeworld', t3: 'hellokitty'},
        ],
    });

    testGrammar({
        desc: '21. Match t1>t3, Join ' +
              '(t1:hello+t2:goodbye+t1:kitty)+t2:world ⨝ t1:hello+t1:kitty',
        grammar: Match(
                     Join(Seq(Seq(t1("hello"), t2("goodbye"), t1("kitty")),
                              t2("world")),
                          Seq(t1("hello"), t1("kitty"))),
                     "t1", "t3"
                 ),
        tapes: ['t1', 't2', 't3'],
        vocab: {t1: [..."helokity"], t2: [..."godbyewrl"], t3: [..."helokity"]},
        results: [
            {t1: 'hellokitty', t2: 'goodbyeworld', t3: 'hellokitty'},
        ],
    });

    testGrammar({
        desc: '22. Match t1>t3, Join ' +
              't1:hello+t1:kitty ⨝ (t2:goodbye+t1:hello+t2:world)+t1:kitty',
        grammar: Match(
                     Join(Seq(t1("hello"), t1("kitty")),
                          Seq(Seq(t2("goodbye"), t1("hello"), t2("world")),
                              t1("kitty"))),
                     "t1", "t3"
                 ),
        tapes: ['t1', 't2', 't3'],
        vocab: {t1: [..."helokity"], t2: [..."godbyewrl"], t3: [..."helokity"]},
        results: [
            {t1: 'hellokitty', t2: 'goodbyeworld', t3: 'hellokitty'},
        ],
    });

    testGrammar({
        desc: '23. Match t1>t3, Join ' +
              't1:hello+t1:kitty ⨝ (t2:goodbye+t1:hello+t2:world)+t1:kitty',
        grammar: Match(
                     Join(Seq(Seq(t2("goodbye"), t1("hello"), t2("world")),
                              t1("kitty")),
                          Seq(t1("hello"), t1("kitty"))),
                     "t1", "t3"
                 ),
        tapes: ['t1', 't2', 't3'],
        vocab: {t1: [..."helokity"], t2: [..."godbyewrl"], t3: [..."helokity"]},
        results: [
            {t1: 'hellokitty', t2: 'goodbyeworld', t3: 'hellokitty'},
        ],
    });

    testGrammar({
        desc: '24. Match t1>t2, t1:o{0,1}',
        grammar: Match(
                     Rep(t1("o"), 0, 1),
                     "t1", "t2"
                 ),
        tapes: ['t1', 't2'],
        vocab: {t1: [..."o"], t2: [..."o"]},
        results: [
            {},
            {t1: 'o', t2: 'o'},
        ],
    });

    testGrammar({
        desc: '25. Match t1>t2, Join ' +
              't1:h{1,4} + t4:world + t1:ello ⨝ the same',
        grammar: Match(
                     Join(Seq(Rep(t1("h"), 1, 4), t4("world"), t1("ello")),
                          Seq(Rep(t1("h"), 1, 4), t4("world"), t1("ello"))),
                     "t1", "t2"
                 ),
        tapes: ['t1', 't2', 't4'],
        vocab: {t1: [..."helo"], t2: [..."helo"], t4: [..."world"]},
        results: [
            {t1: 'hello', t2: 'hello', t4: 'world'},
            {t1: 'hhello', t2: 'hhello', t4: 'world'},
            {t1: 'hhhello', t2: 'hhhello', t4: 'world'},
            {t1: 'hhhhello', t2: 'hhhhello', t4: 'world'},
        ],
    });

    testGrammar({
        desc: '26. Match t1>t2, Join ' +
              't4:world + t1:h{1,4} + t1:ello ⨝ the same',
        grammar: Match(
                     Join(Seq(t4("world"), Rep(t1("h"), 1, 4), t1("ello")),
                          Seq(t4("world"), Rep(t1("h"), 1, 4), t1("ello"))),
                     "t1", "t2"
                 ),
        tapes: ['t1', 't2', 't4'],
        vocab: {t1: [..."helo"], t2: [..."helo"], t4: [..."world"]},
        results: [
            {t1: 'hello', t2: 'hello', t4: 'world'},
            {t1: 'hhello', t2: 'hhello', t4: 'world'},
            {t1: 'hhhello', t2: 'hhhello', t4: 'world'},
            {t1: 'hhhhello', t2: 'hhhhello', t4: 'world'},
        ],
    });

    testGrammar({
        desc: '27. Match t1>t2, t1:na{1,4}',
        grammar: Match(
                     Rep(t1("na"), 1, 4),
                     "t1", "t2"
                 ),
        tapes: ['t1', 't2'],
        vocab: {t1: [..."na"], t2: [..."na"]},
        results: [
            {t1: 'na', t2: 'na'},
            {t1: 'nana', t2: 'nana'},
            {t1: 'nanana', t2: 'nanana'},
            {t1: 'nananana', t2: 'nananana'},
        ],
    });

    testGrammar({
        desc: '28. Match t1>t2, t1:.{0,2} + t1:hi',
        grammar: Match(
                     Seq(Rep(Dot("t1"), 0, 2), t1("hi")),
                     "t1", "t2"
                 ),
        tapes: ['t1', 't2'],
        vocab: {t1: [..."hi"], t2: [..."hi"]},
        results: [
            {t1: 'hi', t2: 'hi'},
            {t1: 'ihi', t2: 'ihi'},   {t1: 'hhi', t2: 'hhi'},
            {t1: 'iihi', t2: 'iihi'}, {t1: 'hihi', t2: 'hihi'},
            {t1: 'hhhi', t2: 'hhhi'}, {t1: 'ihhi', t2: 'ihhi'},
        ],
    });

    testGrammar({
        desc: '29. Match t1>t2, t1:.{0,1} + t1:hi + t1:.{0,1}',
        grammar: Match(
                     Seq(Rep(Dot("t1"), 0, 1),
                         t1("hi"),
                         Rep(Dot("t1"), 0, 1)),
                     "t1", "t2"
                 ),
        tapes: ['t1', 't2'],
        vocab: {t1: [..."hi"], t2: [..."hi"]},
        results: [
            {t1: 'hi', t2: 'hi'},
            {t1: 'hhi', t2: 'hhi'},   {t1: 'ihi', t2: 'ihi'},
            {t1: 'hih', t2: 'hih'},   {t1: 'hii', t2: 'hii'},
            {t1: 'hhih', t2: 'hhih'}, {t1: 'hhii', t2: 'hhii'},
            {t1: 'ihih', t2: 'ihih'}, {t1: 'ihii', t2: 'ihii'},
        ],
    });

    testGrammar({
        desc: '30. Match t1>t2, t1:.* (vocab h/hI)',
        // From and to vocabs are merged for Match, so both are hI.
        grammar: Count({t1:3},
                    WithVocab({t1: "h", t2: "hI"},
                        Match(
                            Rep(Dot("t1")),
                            "t1", "t2"
                        ))),
        tapes: ['t1', 't2'],
        vocab: {t1: [..."hI"], t2: [..."hI"]},
        results: [
            {},
            {t1: 'h', t2: 'h'},     {t1: 'I', t2: 'I'},
            {t1: 'hh', t2: 'hh'},   {t1: 'hI', t2: 'hI'},
            {t1: 'Ih', t2: 'Ih'},   {t1: 'II', t2: 'II'},
            {t1: 'hhh', t2: 'hhh'}, {t1: 'hhI', t2: 'hhI'},
            {t1: 'hIh', t2: 'hIh'}, {t1: 'hII', t2: 'hII'},
            {t1: 'Ihh', t2: 'Ihh'}, {t1: 'IhI', t2: 'IhI'},
            {t1: 'IIh', t2: 'IIh'}, {t1: 'III', t2: 'III'},
        ],
    });

    // Match tests with two to-tapes.

    testGrammar({
        desc: '2-1. Match t1>t2,t3, t1:hello',
        grammar: Match(
        		 	 t1("hello"),
        		 	 "t1", "t2", "t3"
        		 ),
        tapes: ['t1', 't2', 't3'],
        vocab: {t1: [..."helo"], t2: [..."helo"], t3: [..."helo"]},
        results: [
            {t1: 'hello', t2: 'hello', t3: 'hello'},
        ],
    });

    testGrammar({
        desc: '2-2. Match t1>t2,t3, ε',
        grammar: Match(
        		 	 Epsilon(),
        		 	 "t1", "t2", "t3"
        		 ),
        tapes: ['t2', 't3'],
        vocab: {t2: 0, t3: 0},
        results: [
            {},
        ],
    });
    
    testGrammar({
        desc: '2-3. Match t1>t2,t3, ∅',
        grammar: Match(
        		 	 Null(),
        		 	 "t1", "t2", "t3"
        		 ),
        tapes: ['t2', 't3'],
        vocab: {t2: 0, t3: 0},
        results: [
        ],
    });

    testGrammar({
        desc: '2-4. Match t1>t2,t3, t1:hello + t1:world',
        grammar: Match(
        		 	 Seq(t1("hello"), t1("world")),
        		 	 "t1", "t2", "t3"
        		 ),
        tapes: ['t1', 't2', 't3'],
        vocab: {t1: [..."helowrd"], t2: [..."helowrd"], t3: [..."helowrd"]},
        results: [
            {t1: 'helloworld', t2: 'helloworld', t3: 'helloworld'},
        ],
    });

    testGrammar({
        desc: '2-5. Match t1>t2,t3, t1:hello + t4:goodbye',
        grammar: Match(
        		 	 Seq(t1("hello"), t4("goodbye")),
        		 	 "t1", "t2", "t3"
        		 ),
        tapes: ['t1', 't2', 't3', 't4'],
        vocab: {t1: [..."helo"], t2: [..."helo"], t3: [..."helo"], t4: [..."godbye"]},
        results: [
            {t1: 'hello', t2: 'hello', t3: 'hello', t4: 'goodbye'},
        ],
    });

    testGrammar({
        desc: '2-6. Match t1>t2,t3, t4:goodbye + t1:hello',
        grammar: Match(
        		 	 Seq(t4("goodbye"), t1("hello")),
        		 	 "t1", "t2", "t3"
        		 ),
        tapes: ['t1', 't2', 't3', 't4'],
        vocab: {t1: [..."helo"], t2: [..."helo"], t3: [..."helo"], t4: [..."godbye"]},
        results: [
            {t1: 'hello', t2: 'hello', t3: 'hello', t4: 'goodbye'},
        ],
    });

    testGrammar({
        desc: '2-7. Match t1>t2,t3, Nested sequence ' +
              '(t1:hello+t1:,) + t1:world',
        grammar: Match(
        		 	 Seq(Seq(t1("hello"), t1(", ")),
                         t1("world")),
        		 	 "t1", "t2", "t3"
        		 ),
        tapes: ['t1', 't2', 't3'],
        vocab: {t1: [..."helo, wrd"], t2: [..."helo, wrd"], t3: [..."helo, wrd"]},
        results: [
            {t1: 'hello, world', t2: 'hello, world', t3: 'hello, world'},
        ],
    });

    testGrammar({
        desc: '2-8. Match t1>t2,t3, t1:hello | t1:goodbye',
        grammar: Match(
        		 	 Uni(t1("hello"), t1("goodbye")),
        		 	 "t1", "t2", "t3"
        		 ),
        tapes: ['t1', 't2', 't3'],
        vocab: {t1: [..."helogdby"], t2: [..."helogdby"], t3: [..."helogdby"]},
        results: [
            {t1: 'hello', t2: 'hello', t3: 'hello'},
            {t1: 'goodbye', t2: 'goodbye', t3: 'goodbye'},
        ],
    });

    testGrammar({
        desc: '2-9. Match t1>t2,t3, t1:hello | t4:goodbye',
        grammar: Match(
        		 	 Uni(t1("hello"), t4("goodbye")),
        		 	 "t1", "t2", "t3"
        		 ),
        tapes: ['t1', 't2', 't3', 't4'],
        vocab: {t1: [..."helo"], t2: [..."helo"], t3: [..."helo"], t4: [..."godbye"]},
        results: [
            {t1: 'hello', t2: 'hello', t3: 'hello'},
            {t4: 'goodbye'},
        ],
    });

    testGrammar({
        desc: '2-10. Match t1>t2,t3, t4:goodbye | t1:hello',
        grammar: Match(
        		 	 Uni(t4("goodbye"), t1("hello")),
        		 	 "t1", "t2", "t3"
        		 ),
        tapes: ['t1', 't2', 't3', 't4'],
        vocab: {t1: [..."helo"], t2: [..."helo"], t3: [..."helo"], t4: [..."godbye"]},
        results: [
            {t1: 'hello', t2: 'hello', t3: 'hello'},
            {t4: 'goodbye'},
        ],
    });

    testGrammar({
        desc: '2-11. Match t1>t2,t3, ' +
              '(t1:hello|t1:goodbye) + (t1:world|t1:kitty)',
        grammar: Match(
        		 	 Seq(Uni(t1("hello"), t1("goodbye")),
                         Uni(t1("world"), t1("kitty"))),
        		 	 "t1", "t2", "t3"
        		 ),
        tapes: ['t1', 't2', 't3'],
        vocab: {t1: [..."helowrdgbykit"], t2: [..."helowrdgbykit"], t3: [..."helowrdgbykit"]},
        results: [
            {t1: 'helloworld', t2: 'helloworld', t3: 'helloworld'},
            {t1: 'goodbyeworld', t2: 'goodbyeworld', t3: 'goodbyeworld'},
            {t1: 'hellokitty', t2: 'hellokitty', t3: 'hellokitty'},
            {t1: 'goodbyekitty', t2: 'goodbyekitty', t3: 'goodbyekitty'},
        ],
    });

    testGrammar({
        desc: '2-12. Match t1>t2,t3, ' +
              '(t1:hello+t1:kitty) | (t1:goodbye+t1:world)',
        grammar: Match(
        		 	 Uni(Seq(t1("hello"), t1("kitty")),
                         Seq(t1("goodbye"), t1("world"))),
        		 	 "t1", "t2", "t3"
        		 ),
        tapes: ['t1', 't2', 't3'],
        vocab: {t1: [..."helowrdgbykit"], t2: [..."helowrdgbykit"], t3: [..."helowrdgbykit"]},
        results: [
            {t1: 'hellokitty', t2: 'hellokitty', t3: 'hellokitty'},
            {t1: 'goodbyeworld', t2: 'goodbyeworld', t3: 'goodbyeworld'},
        ],
    });

    testGrammar({
        desc: '2-13. Match t1>t2,t3, t1:. (vocab t1:hi)',
        grammar: WithVocab({t1: "hi"},
                     Match(
        		 	     Dot("t1"),
        		 	     "t1", "t2", "t3"
        		     )),
        tapes: ['t1', 't2', 't3'],
        vocab: {t1: [..."hi"], t2: [..."hi"], t3: [..."hi"]},
        results: [
            {t1: 'h', t2: 'h', t3: 'h'},
            {t1: 'i', t2: 'i', t3: 'i'},
        ],
    });

    testGrammar({
        desc: '2-14. Match t1>t2,t3, t1:hi+t1:.',
        grammar: Match(
        		 	 Seq(t1("hi"), Dot("t1")),
        		 	 "t1", "t2", "t3"
        		 ),
        tapes: ['t1', 't2', 't3'],
        vocab: {t1: [..."hi"], t2: [..."hi"], t3: [..."hi"]},
        results: [
            {t1: 'hih', t2: 'hih', t3: 'hih'},
            {t1: 'hii', t2: 'hii', t3: 'hii'},
        ],
    });

    testGrammar({
        desc: '2-15. Match t1>t2,t3, Join t1:hello ⨝ t1:.ello',
        grammar: Match(
        		 	 Join(t1("hello"),
                          Seq(Dot("t1"), t1('ello'))),
        		 	 "t1", "t2", "t3"
        		 ),
        tapes: ['t1', 't2', 't3'],
        vocab: {t1: [..."helo"], t2: [..."helo"], t3: [..."helo"]},
        results: [
            {t1: 'hello', t2: 'hello', t3: 'hello'},
        ],
    });

    testGrammar({
        desc: '2-16. Match t1>t2,t3 Join t1:hello ⨝ t4:world',
        grammar: Match(
        		 	 Join(t1("hello"), t4('world')),
        		 	 "t1", "t2", "t3"
        		 ),
        tapes: ['t1', 't2', 't3', 't4'],
        vocab: {t1: [..."helo"], t2: [..."helo"], t3: [..."helo"], t4: [..."world"]},
        results: [
            {t1: 'hello', t2: 'hello', t3: 'hello', t4: 'world'},
        ],
    });

    testGrammar({
        desc: '2-17. Match t1>t2,t3 Join t4:world ⨝ t1:hello',
        grammar: Match(
        		 	 Join(t4('world'), t1("hello")),
        		 	 "t1", "t2", "t3"
        		 ),
        tapes: ['t1', 't2', 't3', 't4'],
        vocab: {t1: [..."helo"], t2: [..."helo"], t3: [..."helo"], t4: [..."world"]},
        results: [
            {t1: 'hello', t2: 'hello', t3: 'hello', t4: 'world'},
        ],
    });

    testGrammar({
        desc: '2-18. Match t2>t3,t4, Join ' +
              't1:hello+t1:kitty ⨝ (t1:hello+t2:goodbye+t1:kitty)+t2:world',
        grammar: Match(
        		 	 Join(Seq(t1("hello"), t1("kitty")),
                          Seq(Seq(t1("hello"), t2("goodbye"), t1("kitty")),
                              t2("world"))),
        		 	 "t2", "t3", "t4"
        		 ),
        tapes: ['t1', 't2', 't3', 't4'],
        vocab: {t1: [..."helokity"], t2: [..."godbyewrld"],
                t3: [..."godbyewrld"], t4: [..."godbyewrld"]},
        results: [
            {t1: 'hellokitty', t2: 'goodbyeworld', t3: 'goodbyeworld', t4: 'goodbyeworld'},
        ],
    });

    testGrammar({
        desc: '2-19. Match t2>t3,t4, Join ' +
              't1:hello+t2:goodbye+t1:kitty)+t2:world ⨝ t1:hello+t1:kitty',
        grammar: Match(
        		 	 Join(Seq(Seq(t1("hello"), t2("goodbye"), t1("kitty")),
                              t2("world")),
                          Seq(t1("hello"), t1("kitty"))),
        		 	 "t2", "t3", "t4"
        		 ),
        tapes: ['t1', 't2', 't3', 't4'],
        vocab: {t1: [..."helokity"], t2: [..."godbyewrld"],
                t3: [..."godbyewrld"], t4: [..."godbyewrld"]},
        results: [
            {t1: 'hellokitty', t2: 'goodbyeworld', t3: 'goodbyeworld', t4: 'goodbyeworld'},
        ],
    });

    testGrammar({
        desc: '2-20. Match t1>t3,t4, Join ' +
        't1:hello+t1:kitty ⨝ (t1:hello+t2:goodbye+t1:kitty)+t2:world',
        grammar: Match(
        		 	 Join(Seq(t1("hello"), t1("kitty")),
                          Seq(Seq(t1("hello"), t2("goodbye"), t1("kitty")),
                              t2("world"))),
        		 	 "t1", "t3", "t4"
        		 ),
        tapes: ['t1', 't2', 't3', 't4'],
        vocab: {t1: [..."helokity"], t2: [..."godbyewrld"],
                t3: [..."helokity"], t4: [..."helokity"]},
        results: [
            {t1: 'hellokitty', t2: 'goodbyeworld', t3: 'hellokitty', t4: 'hellokitty'},
        ],
    });

    testGrammar({
        desc: '2-21. Match t1>t3,t4, Join ' +
              '(t1:hello+t2:goodbye+t1:kitty)+t2:world ⨝ t1:hello+t1:kitty',
        grammar: Match(
        		 	 Join(Seq(Seq(t1("hello"), t2("goodbye"), t1("kitty")),
                              t2("world")),
                          Seq(t1("hello"), t1("kitty"))),
        		 	 "t1", "t3", "t4"
        		 ),
        tapes: ['t1', 't2', 't3', 't4'],
        vocab: {t1: [..."helokity"], t2: [..."godbyewrld"],
                t3: [..."helokity"], t4: [..."helokity"]},
        results: [
            {t1: 'hellokitty', t2: 'goodbyeworld', t3: 'hellokitty', t4: 'hellokitty'},
        ],
    });

    testGrammar({
        desc: '2-22. Match t1>t3,t4, Join ' +
              't1:hello+t1:kitty ⨝ (t2:goodbye+t1:hello+t2:world)+t1:kitty',
        grammar: Match(
        		 	 Join(Seq(t1("hello"), t1("kitty")),
                          Seq(Seq(t2("goodbye"), t1("hello"), t2("world")),
                              t1("kitty"))),
        		 	 "t1", "t3", "t4"
        		 ),
        tapes: ['t1', 't2', 't3', 't4'],
        vocab: {t1: [..."helokity"], t2: [..."godbyewrld"],
                t3: [..."helokity"], t4: [..."helokity"]},
        results: [
            {t1: 'hellokitty', t2: 'goodbyeworld', t3: 'hellokitty', t4: 'hellokitty'},
        ],
    });

    testGrammar({
        desc: '2-23. Match t1>t3,t4, Join ' +
              '(t2:goodbye+t1:hello+t2:world)+t1:kitty ⨝ t1:hello+t1:kitty',
        grammar: Match(
        		 	 Join(Seq(Seq(t2("goodbye"), t1("hello"), t2("world")),
                              t1("kitty")),
                          Seq(t1("hello"), t1("kitty"))),
        		 	 "t1", "t3", "t4"
        		 ),
        tapes: ['t1', 't2', 't3', 't4'],
        vocab: {t1: [..."helokity"], t2: [..."godbyewrld"],
                t3: [..."helokity"], t4: [..."helokity"]},
        results: [
            {t1: 'hellokitty', t2: 'goodbyeworld', t3: 'hellokitty', t4: 'hellokitty'},
        ],
    });

    testGrammar({
        desc: '2-24. Match t1>t2,t3, t1:o{0,1}',
        grammar: Match(
        		 	 Rep(t1("o"), 0, 1),
        		 	 "t1", "t2", "t3"
        		 ),
        tapes: ['t1', 't2', 't3'],
        vocab: {t1: [..."o"], t2: [..."o"], t3: [..."o"]},
        results: [
            {},
            {t1: 'o', t2: 'o', t3: 'o'},
        ],
    });

    testGrammar({
        desc: '2-25. Match t1>t2,t3, Join t1:h{1,4} + t4:world + t1:ello ⨝ the same',
        grammar: Match(
        		 	 Join(Seq(Rep(t1("h"), 1, 4), t4("world"), t1("ello")),
                          Seq(Rep(t1("h"), 1, 4), t4("world"), t1("ello"))),
        		 	 "t1", "t2", "t3"
        		 ),
        tapes: ['t1', 't2', 't3', 't4'],
        vocab: {t1: [..."helo"], t2: [..."helo"], t3: [..."helo"], t4: [..."world"]},
        results: [
            {t1: 'hello', t2: 'hello', t3: 'hello', t4: 'world'},
            {t1: 'hhello', t2: 'hhello', t3: 'hhello', t4: 'world'},
            {t1: 'hhhello', t2: 'hhhello', t3: 'hhhello', t4: 'world'},
            {t1: 'hhhhello', t2: 'hhhhello', t3: 'hhhhello', t4: 'world'},
        ],
    });

    testGrammar({
        desc: '2-26. Match t1>t2,t3, Join t4:world + t1:h{1,4} + t1:ello ⨝ the same',
        grammar: Match(
        		 	 Join(Seq(t4("world"), Rep(t1("h"), 1, 4), t1("ello")),
                          Seq(t4("world"), Rep(t1("h"), 1, 4), t1("ello"))),
        		 	 "t1", "t2", "t3"
        		 ),
        tapes: ['t1', 't2', 't3', 't4'],
        vocab: {t1: [..."helo"], t2: [..."helo"], t3: [..."helo"], t4: [..."world"]},
        results: [
            {t1: 'hello', t2: 'hello', t3: 'hello', t4: 'world'},
            {t1: 'hhello', t2: 'hhello', t3: 'hhello', t4: 'world'},
            {t1: 'hhhello', t2: 'hhhello', t3: 'hhhello', t4: 'world'},
            {t1: 'hhhhello', t2: 'hhhhello', t3: 'hhhhello', t4: 'world'},
        ],
    });

    testGrammar({
        desc: '2-27. Match t1>t2,t3, t1:na{1,4}',
        grammar: Match(
        		 	 Rep(t1("na"), 1, 4),
        		 	 "t1", "t2", "t3"
        		 ),
        tapes: ['t1', 't2', 't3'],
        vocab: {t1: [..."na"], t2: [..."na"], t3: [..."na"]},
        results: [
            {t1: 'na', t2: 'na', t3: 'na'},
            {t1: 'nana', t2: 'nana', t3: 'nana'},
            {t1: 'nanana', t2: 'nanana', t3: 'nanana'},
            {t1: 'nananana', t2: 'nananana', t3: 'nananana'},
        ],
    });

    testGrammar({
        desc: '2-28. Match t1>t2,t3, t1:.{0,2} + t1:hi',
        grammar: Match(
        		 	 Seq(Rep(Dot("t1"), 0, 2), t1("hi")),
        		 	 "t1", "t2", "t3"
        		 ),
        tapes: ['t1', 't2', 't3'],
        vocab: {t1: [..."hi"], t2: [..."hi"], t3: [..."hi"]},
        results: [
            {t1: 'hi', t2: 'hi', t3: 'hi'},
            {t1: 'ihi', t2: 'ihi', t3: 'ihi'},
            {t1: 'hhi', t2: 'hhi', t3: 'hhi'},
            {t1: 'iihi', t2: 'iihi', t3: 'iihi'},
            {t1: 'hihi', t2: 'hihi', t3: 'hihi'},
            {t1: 'hhhi', t2: 'hhhi', t3: 'hhhi'},
            {t1: 'ihhi', t2: 'ihhi', t3: 'ihhi'},
        ],
    });

    testGrammar({
        desc: '2-29. Match t1>t2,t3, t1:.{0,1} + t1:hi + t1:.{0,1}',
        grammar: Match(
        		 	 Seq(Rep(Dot("t1"), 0, 1),
                         t1("hi"),
                         Rep(Dot("t1"), 0, 1)),
        		 	 "t1", "t2", "t3"
        		 ),
        tapes: ['t1', 't2', 't3'],
        vocab: {t1: [..."hi"], t2: [..."hi"], t3: [..."hi"]},
        results: [
            {t1: 'hi', t2: 'hi', t3: 'hi'},
            {t1: 'hhi', t2: 'hhi', t3: 'hhi'},
            {t1: 'ihi', t2: 'ihi', t3: 'ihi'},
            {t1: 'hih', t2: 'hih', t3: 'hih'},
            {t1: 'hii', t2: 'hii', t3: 'hii'},
            {t1: 'hhih', t2: 'hhih', t3: 'hhih'},
            {t1: 'hhii', t2: 'hhii', t3: 'hhii'},
            {t1: 'ihih', t2: 'ihih', t3: 'ihih'},
            {t1: 'ihii', t2: 'ihii', t3: 'ihii'},
        ],
    });

    testGrammar({
        desc: '2-30. Match t1>t2,t3, t1:.* (vocab h/hI/X)',
        // From and to vocabs are merged for Match, so all are hIX.
        grammar: Count({t1:3},
                    WithVocab({t1: "h", t2: "hI", t3: "X"},
                        Match(Rep(Dot("t1")), "t1", "t2", "t3"))),
        tapes: ['t1', 't2', 't3'],
        vocab: {t1: [..."hIX"], t2: [..."hIX"], t3: [..."hIX"]},
        results: [
            {},
            {t1: 'h', t2: 'h', t3: 'h'},
            {t1: 'I', t2: 'I', t3: 'I'},
            {t1: 'X', t2: 'X', t3: 'X'},
            {t1: 'hh', t2: 'hh', t3: 'hh'},
            {t1: 'hI', t2: 'hI', t3: 'hI'},
            {t1: 'hX', t2: 'hX', t3: 'hX'},
            {t1: 'Ih', t2: 'Ih', t3: 'Ih'},
            {t1: 'II', t2: 'II', t3: 'II'},
            {t1: 'IX', t2: 'IX', t3: 'IX'},
            {t1: 'Xh', t2: 'Xh', t3: 'Xh'},
            {t1: 'XI', t2: 'XI', t3: 'XI'},
            {t1: 'XX', t2: 'XX', t3: 'XX'},
            {t1: 'hhh', t2: 'hhh', t3: 'hhh'},
            {t1: 'hhI', t2: 'hhI', t3: 'hhI'},
            {t1: 'hhX', t2: 'hhX', t3: 'hhX'},
            {t1: 'hIh', t2: 'hIh', t3: 'hIh'},
            {t1: 'hII', t2: 'hII', t3: 'hII'},
            {t1: 'hIX', t2: 'hIX', t3: 'hIX'},
            {t1: 'hXh', t2: 'hXh', t3: 'hXh'},
            {t1: 'hXI', t2: 'hXI', t3: 'hXI'},
            {t1: 'hXX', t2: 'hXX', t3: 'hXX'},
            {t1: 'Ihh', t2: 'Ihh', t3: 'Ihh'},
            {t1: 'IhI', t2: 'IhI', t3: 'IhI'},
            {t1: 'IhX', t2: 'IhX', t3: 'IhX'},
            {t1: 'IIh', t2: 'IIh', t3: 'IIh'},
            {t1: 'III', t2: 'III', t3: 'III'},
            {t1: 'IIX', t2: 'IIX', t3: 'IIX'},
            {t1: 'IXh', t2: 'IXh', t3: 'IXh'},
            {t1: 'IXI', t2: 'IXI', t3: 'IXI'},
            {t1: 'IXX', t2: 'IXX', t3: 'IXX'},
            {t1: 'Xhh', t2: 'Xhh', t3: 'Xhh'},
            {t1: 'XhI', t2: 'XhI', t3: 'XhI'},
            {t1: 'XhX', t2: 'XhX', t3: 'XhX'},
            {t1: 'XIh', t2: 'XIh', t3: 'XIh'},
            {t1: 'XII', t2: 'XII', t3: 'XII'},
            {t1: 'XIX', t2: 'XIX', t3: 'XIX'},
            {t1: 'XXh', t2: 'XXh', t3: 'XXh'},
            {t1: 'XXI', t2: 'XXI', t3: 'XXI'},
            {t1: 'XXX', t2: 'XXX', t3: 'XXX'},
        ],
    });

    // Joins of Matches

    testGrammar({
        desc: 'J-1. t1:h ⨝ Match(t1>t2, t1:.) (vocab t1:hi)',
        grammar: WithVocab({t1: "hi"},
        		 	 Join(t1("h"),
        		 	 	  Match(Dot("t1"), "t1", "t2"))),
        tapes: ['t1', 't2'],
        vocab: {t1: [..."hi"], t2: [..."hi"]},
        results: [
            {t1: 'h', t2: 'h'},
        ],
    });

    testGrammar({
        desc: 'J-2. Match(t1>t2, t1:.) ⨝ t1:h (vocab t1:hi)',
        grammar: WithVocab({t1: "hi"},
        		 	 Join(Match(Dot("t1"), "t1", "t2"),
                          t1("h"))),
        tapes: ['t1', 't2'],
        vocab: {t1: [..."hi"], t2: [..."hi"]},
        results: [
            {t1: 'h', t2: 'h'},
        ],
    });

    testGrammar({
        desc: 'J-3. t2:hello ⨝ Match(t1>t2, t1:.*)',
        grammar: Join(t2("hello"),
        		 	  Match(Rep(Dot("t1")), "t1", "t2")),
        tapes: ['t1', 't2'],
        vocab: {t1: [..."helo"], t2: [..."helo"]},
        results: [
            {t1: 'hello', t2: 'hello'},
        ],
    });

    testGrammar({
        desc: 'J-4. t1:hello+t2:hello ⨝ Match(t1>t2, t1:.*)',
        grammar: Join(Seq(t1("hello"), t2("hello")),
        		 	  Match(Rep(Dot("t1")), "t1", "t2")),
        tapes: ['t1', 't2'],
        vocab: {t1: [..."helo"], t2: [..."helo"]},
        results: [
            {t1: 'hello', t2: 'hello'},
        ],
    });

    testGrammar({
        desc: 'J-5. Join output of two matches: ' +
              'Match(t1>t2, t1:[hi]) ⨝ Match(t3>t2, t3:[ij]) ' +
              '(vocab t2:hijk)',
        grammar: WithVocab({t2: "hijk"},
        		 	 Join(Match(CharSet("t1", ["h","i"]), "t1", "t2"),
        		 	 	  Match(CharSet("t3", ["i","j"]), "t3", "t2"))),
        tapes: ['t1', 't2', 't3'],
        vocab: {t1: [..."hijk"], t2: [..."hijk"], t3: [..."hijk"]},
        results: [
            {t1: 'i', t2: 'i', t3: 'i'},
        ],
    });

    testGrammar({
        desc: 'J-6. Join output of one match with input of another: ' +
              'Match(t1>t2, t1:[hi]) ⨝ Match(t2>t3, t2:[ij]) ' + 
              '(vocab t2:hijk)',
        grammar: WithVocab({t2: "hijk"},
        		 	 Join(Match(CharSet("t1", ["h","i"]), "t1", "t2"),
        		 	 	  Match(CharSet("t2", ["i","j"]), "t2", "t3"))),
        tapes: ['t1', 't2', 't3'],
        vocab: {t1: [..."hijk"], t2: [..."hijk"], t3: [..."hijk"]},
        results: [
            {t1: 'i', t2: 'i', t3: 'i'},
        ],
    });

    testGrammar({
        desc: 'J-7. Join output of one match with input of another, other direction: ' + 
              'Match(t2>t3, t2:[ij]) ⨝ Match(t1>t2, t1:[hi]) ' + 
              '(vocab t2:hijk)',
        grammar: WithVocab({t2: "hijk"},
        		 	 Join(Match(CharSet("t2", ["i","j"]), "t2", "t3"),
        		 	 	  Match(CharSet("t1", ["h","i"]), "t1", "t2"))),
        tapes: ['t1', 't2', 't3'],
        vocab: {t1: [..."hijk"], t2: [..."hijk"], t3: [..."hijk"]},
        results: [
            {t1: 'i', t2: 'i', t3: 'i'},
        ],
    });

    // Repetitions involving nullable matches.
    // For the following tests, some results used to be missing before
    // we implemented fixes for nullable repeats.

    function repMatchGrammar(min: number, max: number, fromGrammar: Grammar): Grammar {
        // returns (t2:e+M(t1>t2,fromGrammar){min,max}
        const matchGrammar: Grammar = Match(fromGrammar, "t1", "t2");
        const repGrammar: Grammar = Rep(Seq(t2("e"), matchGrammar), min, max);
        return repGrammar;
    }

    testGrammar({
        desc: 'R-1a. Effectively insert e twice: ' +
              't2,t1: (t2:e+M(t1>t2,.*)){2} (vocab h/he)',
        // From and to vocabs are merged for Match, so both are he.
        grammar: Count({t1:1, t2:3},
                    WithVocab({t1: "h", t2:"he"},
                    	repMatchGrammar(2, 2,
                            Rep(Dot("t1"))
                        ))),
        priority: ["t2", "t1"],
        tapes: ['t1', 't2'],
        vocab: {t1: [..."he"], t2: [..."he"]},
        results: [
            {t2: 'ee'},  // equivalent to {t1: '', t2: 'ee'}
            {t1: 'h', t2: 'ehe'},
            {t1: 'h', t2: 'eeh'},
            {t1: 'e', t2: 'eee'},
        ],
    });

    testGrammar({
        desc: 'R-1b. Effectively insert e twice: ' +
              't1,t2: (t2:e+M(t1>t2,.*)){2} (vocab h/he)',
        // From and to vocabs are merged for Match, so both are he.
        grammar: Count({t1:1, t2:3},
                    WithVocab({t1: "h", t2:"he"},
                    	repMatchGrammar(2, 2,
                            Rep(Dot("t1"))
                        ))),
        priority: ["t1", "t2"],
        tapes: ['t1', 't2'],
        vocab: {t1: [..."he"], t2: [..."he"]},
        results: [
            {t2: 'ee'},  // equivalent to {t1: '', t2: 'ee'}
            {t1: 'h', t2: 'ehe'},
            {t1: 'h', t2: 'eeh'},
            {t1: 'e', t2: 'eee'},
        ],
        allowDuplicateOutputs: true,
    });

    testGrammar({
        desc: 'R-2a. Effectively insert e twice: t2,t1: (t2:e+M(t1>t2,h*)){2}',
        // From and to vocabs are merged for Match, so both are he.
        grammar: Count({t1:1, t2:3},
                    repMatchGrammar(2, 2,
                        Rep(t1("h"))
                    )),
        priority: ["t2", "t1"],
        tapes: ['t1', 't2'],
        vocab: {t1: [..."he"], t2: [..."he"]},
        results: [
            {t2: 'ee'},  // equivalent to {t1: '', t2: 'ee'}
            {t1: 'h', t2: 'ehe'},
            {t1: 'h', t2: 'eeh'},
        ],
    });

    testGrammar({
        desc: 'R-2b. Effectively insert e twice: t1,t2: (t2:e+M(t1>t2,h*)){2}',
        // From and to vocabs are merged for Match, so both are he.
        grammar: Count({t1:1, t2:3},
                    repMatchGrammar(2, 2,
                        Rep(t1("h"))
                    )),
        priority: ["t1", "t2"],
        tapes: ['t1', 't2'],
        vocab: {t1: [..."he"], t2: [..."he"]},
        results: [
            {t2: 'ee'},  // equivalent to {t1: '', t2: 'ee'}
            {t1: 'h', t2: 'ehe'},
            {t1: 'h', t2: 'eeh'},
        ],
    });

    testGrammar({
        desc: 'R-3a. Effectively insert e twice: t2,t1: (t2:e+M(t1>t2,h{0,1})){2}',
        // From and to vocabs are merged for Match, so both are he.
        grammar: Count({t1:1, t2:3},
                    repMatchGrammar(2, 2,
                        Rep(t1("h"), 0, 1)
                    )),
        priority: ["t2", "t1"],
        tapes: ['t1', 't2'],
        vocab: {t1: [..."he"], t2: [..."he"]},
        results: [
            {t2: 'ee'},  // equivalent to {t1: '', t2: 'ee'}
            {t1: 'h', t2: 'ehe'},
            {t1: 'h', t2: 'eeh'},
        ],
    });

    testGrammar({
        desc: 'R-3b. Effectively insert e twice: t1,t2: (t2:e+M(t1>t2,h{0,1})){2}',
        // From and to vocabs are merged for Match, so both are he.
        grammar: Count({t1:1, t2:3},
                    repMatchGrammar(2, 2,
                        Rep(t1("h"), 0, 1)
                    )),
        priority: ["t1", "t2"],
        tapes: ['t1', 't2'],
        vocab: {t1: [..."he"], t2: [..."he"]},
        results: [
            {t2: 'ee'},  // equivalent to {t1: '', t2: 'ee'}
            {t1: 'h', t2: 'ehe'},
            {t1: 'h', t2: 'eeh'},
        ],
    });

    testGrammar({
        desc: 'R-4a. Effectively insert e twice: t2,t1: (t2:e+M(t1>t2,ε|t1:h)){2}',
        // From and to vocabs are merged for Match, so both are he.
        grammar: Count({t1:1, t2:3},
                    repMatchGrammar(2, 2,
                        Uni(Epsilon(), t1("h"))
                    )),
        priority: ["t2", "t1"],
        tapes: ['t1', 't2'],
        vocab: {t1: [..."he"], t2: [..."he"]},
        results: [
            {t2: 'ee'},  // equivalent to {t1: '', t2: 'ee'}
            {t1: 'h', t2: 'ehe'},
            {t1: 'h', t2: 'eeh'},
        ],
    });

    testGrammar({
        desc: 'R-4b. Effectively insert e twice: t1,t2: (t2:e+M(t1>t2,ε|t1:h)){2}',
        // From and to vocabs are merged for Match, so both are he.
        grammar: Count({t1:1, t2:3},
                    repMatchGrammar(2, 2,
                        Uni(Epsilon(), t1("h"))
                    )),
        priority: ["t1", "t2"],
        tapes: ['t1', 't2'],
        vocab: {t1: [..."he"], t2: [..."he"]},
        results: [
            {t2: 'ee'},  // equivalent to {t1: '', t2: 'ee'}
            {t1: 'h', t2: 'ehe'},
            {t1: 'h', t2: 'eeh'},
        ],
    });

    testGrammar({
        desc: 'R-5. Effectively insert e 2 or more times: ' +
              't1,t2: (t2:e+M(t1>t2,ε|t1:h)){2,100}',
        // From and to vocabs are merged for Match, so both are he.
        grammar: Count({t1:1, t2:4},
                    repMatchGrammar(2, 100,
                        Uni(Epsilon(), t1("h"))
                    )),
        priority: ["t1", "t2"],
        tapes: ['t1', 't2'],
        vocab: {t1: [..."he"], t2: [..."he"]},
        results: [
            {t2: 'ee'},   // equivalent to {t1: '', t2: 'ee'}
            {t2: 'eee'},  // equivalent to {t1: '', t2: 'eee'}
            {t2: 'eeee'}, // equivalent to {t1: '', t2: 'eeee'}
            {t1: 'h', t2: 'ehe'},  {t1: 'h', t2: 'eeh'},
            {t1: 'h', t2: 'ehee'}, {t1: 'h', t2: 'eehe'},
            {t1: 'h', t2: 'eeeh'},
        ],
    });

    testGrammar({
        desc: 'R-6. Effectively insert e 2 or more times: ' +
              't1,t2: (t2:e+M(t1>t2,ε|t1:h)){2+}',
        // From and to vocabs are merged for Match, so both are he.
        grammar: Count({t1:1, t2:4},
                    repMatchGrammar(2, Infinity,
                        Uni(Epsilon(), t1("h"))
                    )),
        priority: ["t1", "t2"],
        tapes: ['t1', 't2'],
        vocab: {t1: [..."he"], t2: [..."he"]},
        results: [
            {t2: 'ee'},   // equivalent to {t1: '', t2: 'ee'}
            {t2: 'eee'},  // equivalent to {t1: '', t2: 'eee'}
            {t2: 'eeee'}, // equivalent to {t1: '', t2: 'eeee'}
            {t1: 'h', t2: 'ehe'},  {t1: 'h', t2: 'eeh'},
            {t1: 'h', t2: 'ehee'}, {t1: 'h', t2: 'eehe'},
            {t1: 'h', t2: 'eeeh'},
        ],
    });

    testGrammar({
        desc: 'R-7. Effectively insert e 2 or more times: ' +
              't1,t2: (t2:e+M(t1>t2,ε|t1:h)){2,6}',
        // From and to vocabs are merged for Match, so both are he.
        grammar: Count({t1:1, t2:6},
                    repMatchGrammar(2, 6,
                        Uni(Epsilon(), t1("h"))
                    )),
        priority: ["t1", "t2"],
        tapes: ['t1', 't2'],
        vocab: {t1: [..."he"], t2: [..."he"]},
        results: [
            {t2: 'ee'},     // equivalent to {t1: '', t2: 'ee'}
            {t2: 'eee'},    // equivalent to {t1: '', t2: 'eee'}
            {t2: 'eeee'},   // equivalent to {t1: '', t2: 'eeee'}
            {t2: 'eeeee'},  // equivalent to {t1: '', t2: 'eeeee'}
            {t2: 'eeeeee'}, // equivalent to {t1: '', t2: 'eeeeee'}
            {t1: 'h', t2: 'ehe'},    {t1: 'h', t2: 'eeh'},
            {t1: 'h', t2: 'ehee'},   {t1: 'h', t2: 'eehe'},
            {t1: 'h', t2: 'eeeh'},   {t1: 'h', t2: 'eheee'},
            {t1: 'h', t2: 'eehee'},  {t1: 'h', t2: 'eeehe'},
            {t1: 'h', t2: 'eeeeh'},  {t1: 'h', t2: 'eheeee'},
            {t1: 'h', t2: 'eeheee'}, {t1: 'h', t2: 'eeehee'},
            {t1: 'h', t2: 'eeeehe'}, {t1: 'h', t2: 'eeeeeh'},
        ],
    });

    testGrammar({
        desc: 'R-8. Effectively insert e 2 or more times: ' +
              't1,t2: (t2:e+M(t1>t2,ε|t1:h)){2+}',
        // From and to vocabs are merged for Match, so both are he.
        grammar: Count({t1:1, t2:6},
                    repMatchGrammar(2, Infinity,
                        Uni(Epsilon(), t1("h"))
                    )),
        priority: ["t1", "t2"],
        tapes: ['t1', 't2'],
        vocab: {t1: [..."he"], t2: [..."he"]},
        results: [
            {t2: 'ee'},     // equivalent to {t1: '', t2: 'ee'}
            {t2: 'eee'},    // equivalent to {t1: '', t2: 'eee'}
            {t2: 'eeee'},   // equivalent to {t1: '', t2: 'eeee'}
            {t2: 'eeeee'},  // equivalent to {t1: '', t2: 'eeeee'}
            {t2: 'eeeeee'}, // equivalent to {t1: '', t2: 'eeeeee'}
            {t1: 'h', t2: 'ehe'},    {t1: 'h', t2: 'eeh'},
            {t1: 'h', t2: 'ehee'},   {t1: 'h', t2: 'eehe'},
            {t1: 'h', t2: 'eeeh'},   {t1: 'h', t2: 'eheee'},
            {t1: 'h', t2: 'eehee'},  {t1: 'h', t2: 'eeehe'},
            {t1: 'h', t2: 'eeeeh'},  {t1: 'h', t2: 'eheeee'},
            {t1: 'h', t2: 'eeheee'}, {t1: 'h', t2: 'eeehee'},
            {t1: 'h', t2: 'eeeehe'}, {t1: 'h', t2: 'eeeeeh'},
        ],
    });
});
