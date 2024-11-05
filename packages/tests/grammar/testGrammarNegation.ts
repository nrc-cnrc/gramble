import {
    Count, Dot, Join, 
    Not, Rep, Seq, Short,
    Uni, WithVocab,
} from "../../interpreter/src/grammarConvenience.js";

import {
    grammarTestSuiteName,
    testGrammar,
    t1, t2,
} from "./testGrammarUtil.js";

import { 
    logTestSuite, VERBOSE_TEST_L2,
} from "../testUtil.js";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

const module = import.meta;

describe(`${grammarTestSuiteName(module)}`, function() {

    logTestSuite(this.title);

    testGrammar({
        desc: '1. Join t1:foo ⨝ ~t1:hello',
        grammar: Join(t1("foo"),
        		 	  Not(t1("hello"))),
        tapes: ['t1'],
        vocab: {t1: [..."fohel"]},
        results: [
            {t1: 'foo'},
        ],
    });

    testGrammar({
        desc: '2. Join t1:hello ⨝ ~t1:hello',
        grammar: Join(t1("hello"),
        		 	  Not(t1("hello"))),
        results: [],
    });

    testGrammar({
        desc: '3. Join t1:hell ⨝ ~t1:hello',
        grammar: Join(t1("hell"),
        		 	  Not(t1("hello"))),
        results: [
            {t1: 'hell'},
        ],
    });

    testGrammar({
        desc: '4. Join(t1:helloo ⨝ ~t1:hello',
        grammar: Join(t1("helloo"),
        		 	  Not(t1("hello"))),
        results: [
            {t1: 'helloo'},
        ],
    });

    testGrammar({
        desc: '5. Join t1:hello ⨝ (t1:hello|~t1:hello)',
        grammar: Join(t1("hello"),
        		 	  Uni(t1("hello"), Not(t1("hello")))),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: '6. Join ~t1:hello ⨝ t1:foo',
        grammar: Join(Not(t1("hello")),
        		 	  t1("foo")),
        results: [
            {t1: 'foo'},
        ],
    });

    testGrammar({
        desc: '7. Join ~t1:hello ⨝ t1:hell',
        grammar: Join(Not(t1("hello")),
        		 	  t1("hell")),
        results: [
            {t1: 'hell'},
        ],
    });

    testGrammar({
        desc: '8. Join ~t1:hello ⨝ t1:helloo',
        grammar: Join(Not(t1("hello")),
        		 	  t1("helloo")),
        results: [
            {t1: 'helloo'},
        ],
    });

    testGrammar({
        desc: '9. Join t1:foo ⨝ ~(t1:hello|t1:world)',
        grammar: Join(t1("foo"),
        		 	  Not(Uni(t1("hello"), t1("world")))),
        results: [
            {t1: 'foo'},
        ],
    });

    testGrammar({
        desc: '10. Join t1:hello ⨝ ~(t1:hello|t1:world)',
        grammar: Join(t1("hello"),
        		 	  Not(Uni(t1("hello"), t1("world")))),
        results: [],
    });

    testGrammar({
        desc: '11. Join t1:world ⨝ ~(t1:hello|t1:world)',
        grammar: Join(t1("world"),
        		 	  Not(Uni(t1("hello"), t1("world")))),
        results: [],
    });

    testGrammar({
        desc: '12. Join ~(t1:hello|t1:world) ⨝ t1:foo',
        grammar: Join(Not(Uni(t1("hello"), t1("world"))),
        		 	  t1("foo")),
        results: [
            {t1: 'foo'},
        ],
    });

    testGrammar({
        desc: '13. Join ~(t1:hello|t1:world) ⨝ t1:hello',
        grammar: Join(Not(Uni(t1("hello"), t1("world"))),
        		 	  t1("hello")),
        results: [],
    });

    // This and the following three tests are crucial tests for Negation, because they
    // fail when the results of the enclosed grammar (here, t1:hello|t1:help) are
    // not properly determinized (if the same result appears in multiple yields). Consider, 
    // here, "h" transitioning to t1:ello and also "h" transition to t1:elp.
    // If these are separate yields, then the negation that wraps them can be going down the second
    // path through "elp", eventually fail to join it with "ello" on the other side, and say 
    // "Yay, that failed, so I succeed."  But that ends up succeeding on "hello", which should
    // be forbidden by this grammar.  On the other hand, if "h" led to a UnionState(t1:ello, t1:elp),
    // this works correctly.
    testGrammar({
        desc: '14. Join ~(t1:hello|t1:help) ⨝ t1:hello',
        grammar: Join(Not(Uni(t1("hello"), t1("help"))),
        		 	  t1("hello")),
        results: [],
    });

    testGrammar({
        desc: '15. Join t1:hello ⨝ ~(t1:hello|t1:help)',
        grammar: Join(t1("hello"),
        		 	  Not(Uni(t1("hello"), t1("help")))),
        results: [],
    });

    // This one is testing the same thing, but the problem is more subtle.  Improperly
    // determinized, this could have an "h" leading into the first child of the concat, 
    // the repetition, or (because this repetition can be zero) finishing the repetition
    // right away and leading to the second child, t1:hello.  So similarly to the above,
    // the negation that wraps them can say "Okay, going to the first child, matched an 'h',
    // now can't match an 'e', okay yay that failed, so I succeed," and incorrectly succeed
    // on "hello" just like before.
    testGrammar({
        desc: '16. Join ~(t1:h{0,2}+t1:hello) ⨝ t1:hhello',
        grammar: Join(Not(Seq(Rep(t1("h"),0,2), t1("hello"))),
        		 	  t1("hhello")),
        results: [],
    });

    testGrammar({
        desc: '17. Join t1:hhello ⨝ ~(t1:h{0,2}+t1:hello)',
        grammar: Join(t1("hhello"),
        		 	  Not(Seq(Rep(t1("h"),0,2), t1("hello")))),
        results: [],
    });

    testGrammar({
        desc: '18. Join ~(t1:h*hello) ⨝ t1:hhello',
        grammar: Join(Not(Seq(Rep(t1("h")), t1("hello"))),
        		 	  t1("hhello")),
        results: [],
    });

    testGrammar({
        desc: '19. Join t1:hhello ⨝ ~(t1:h*hello)',
        grammar: Join(t1("hhello"),
        		 	  Not(Seq(Rep(t1("h")), t1("hello")))),
        results: [],
    });

    testGrammar({
        desc: '20. Double negation: ~(~t1:hello)',
        grammar: Not(Not(t1("hello"))),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: '21. ~t1:hi',
        grammar: Count({t1:4},
                 	   Not(t1("hi"))),
        tapes: ['t1'],
        vocab: {t1: [..."hi"]},
        results: [
            {},           {t1: 'h'},    {t1: 'i'},
            {t1: 'hh'},   {t1: 'ih'},   {t1: 'ii'},
            {t1: 'hih'},  {t1: 'hii'},  {t1: 'hhh'},
            {t1: 'hhi'},  {t1: 'ihh'},  {t1: 'ihi'},
            {t1: 'iih'},  {t1: 'iii'},  {t1: 'hihh'},
            {t1: 'hihi'}, {t1: 'hiih'}, {t1: 'hiii'},
            {t1: 'hhhh'}, {t1: 'hhhi'}, {t1: 'hhih'},
            {t1: 'hhii'}, {t1: 'ihhh'}, {t1: 'ihhi'},
            {t1: 'ihih'}, {t1: 'ihii'}, {t1: 'iihh'},
            {t1: 'iihi'}, {t1: 'iiih'}, {t1: 'iiii'},
        ],
    });

    testGrammar({
        desc: '22. ~(t1:h+t1:i)',
        grammar: Count({t1:4},
                 	   Not(Seq(t1("h"), t1("i")))),
        tapes: ['t1'],
        vocab: {t1: [..."hi"]},
        results: [
            {},           {t1: 'h'},    {t1: 'i'},
            {t1: 'hh'},   {t1: 'ih'},   {t1: 'ii'},
            {t1: 'hih'},  {t1: 'hii'},  {t1: 'hhh'},
            {t1: 'hhi'},  {t1: 'ihh'},  {t1: 'ihi'},
            {t1: 'iih'},  {t1: 'iii'},  {t1: 'hihh'},
            {t1: 'hihi'}, {t1: 'hiih'}, {t1: 'hiii'},
            {t1: 'hhhh'}, {t1: 'hhhi'}, {t1: 'hhih'},
            {t1: 'hhii'}, {t1: 'ihhh'}, {t1: 'ihhi'},
            {t1: 'ihih'}, {t1: 'ihii'}, {t1: 'iihh'},
            {t1: 'iihi'}, {t1: 'iiih'}, {t1: 'iiii'},
        ],
    });

    testGrammar({
        desc: '23. Alt (~t1:hello ⨝ t1:helloo) | t2:foobar',
        grammar: Uni(Join(Not(t1("hello")), t1("helloo")),
                     t2("foobar")),
        results: [
            {t1: 'helloo'},
            {t2: 'foobar'},
        ],
    });

    testGrammar({
        desc: '24. Alt ~t1:hi | t2:hi',
        grammar: Count({t1:4, t2:4},
                 	   Uni(Not(t1("hi")), t2("hi"))),
        tapes: ['t1', 't2'],
        vocab: {t1: [..."hi"], t2: [..."hi"]},
        results: [
            {},           {t1: 'h'},    {t1: 'i'},
            {t1: 'hh'},   {t1: 'ih'},   {t1: 'ii'},
            {t1: 'hih'},  {t1: 'hii'},  {t1: 'hhh'},
            {t1: 'hhi'},  {t1: 'ihh'},  {t1: 'ihi'},
            {t1: 'iih'},  {t1: 'iii'},  {t1: 'hihh'},
            {t1: 'hihi'}, {t1: 'hiih'}, {t1: 'hiii'},
            {t1: 'hhhh'}, {t1: 'hhhi'}, {t1: 'hhih'},
            {t1: 'hhii'}, {t1: 'ihhh'}, {t1: 'ihhi'},
            {t1: 'ihih'}, {t1: 'ihii'}, {t1: 'iihh'},
            {t1: 'iihi'}, {t1: 'iiih'}, {t1: 'iiii'}, 
            {t2: 'hi'},
        ],
    });

    testGrammar({
        desc: '25. ~t1:h',
        grammar: Count({t1:4},
                       Not(t1("h"))),
        vocab: {t1: [..."h"]},
        results: [
            {}, {t1: 'hh'}, {t1: 'hhh'}, {t1: 'hhhh'},
        ],
    });

    testGrammar({
        desc: '26. t1:h + (~t1:h)',
        grammar: Count({t1:5},
                 	   Seq(t1("h"), Not(t1("h")))),
        vocab: {t1: [..."h"]},
        results: [
            {t1: 'h'}, {t1: 'hhh'}, {t1: 'hhhh'}, {t1: 'hhhhh'},
        ],
    });

    testGrammar({
        desc: '27. (~t1:h) + t1:h',
        grammar: Count({t1:5},
                 	   Seq(Not(t1("h")), t1("h"))),
        vocab: {t1: [..."h"]},
        results: [
            {t1: 'h'}, {t1: 'hhh'}, {t1: 'hhhh'}, {t1: 'hhhhh'},
        ],
    });

    testGrammar({
        desc: '28. ~t1:h{0,1}',
        grammar: Count({t1:4},
                 	   Not(Rep(t1("h"), 0, 1))),
        vocab: {t1: [..."h"]},
        results: [
            {t1: 'hh'}, {t1: 'hhh'}, {t1: 'hhhh'},
        ],
    });

    testGrammar({
        desc: '29. ~t1:h{1,3}',
        grammar: Count({t1:4},
                 	   Not(Rep(t1("h"), 1, 3))),
        vocab: {t1: [..."h"]},
        results: [
            {}, {t1: 'hhhh'},
        ],
    });

    testGrammar({
        desc: '30. Join ~t1:hi ⨝ t2:hi',
        grammar: Count({t1:4, t2:2},
                 	   Join(Not(t1("hi")), t2("hi"))),
        vocab: {t1: [..."hi"], t2: [..."hi"]},
        results: [
            {t2: 'hi'},             {t1: 'h', t2: 'hi'},
            {t1: 'i', t2: 'hi'},    {t1: 'hh', t2: 'hi'},
            {t1: 'ih', t2: 'hi'},   {t1: 'ii', t2: 'hi'},
            {t1: 'hih', t2: 'hi'},  {t1: 'hii', t2: 'hi'},
            {t1: 'hhh', t2: 'hi'},  {t1: 'hhi', t2: 'hi'},
            {t1: 'ihh', t2: 'hi'},  {t1: 'ihi', t2: 'hi'},
            {t1: 'iih', t2: 'hi'},  {t1: 'iii', t2: 'hi'},
            {t1: 'hihh', t2: 'hi'}, {t1: 'hihi', t2: 'hi'},
            {t1: 'hiih', t2: 'hi'}, {t1: 'hiii', t2: 'hi'},
            {t1: 'hhhh', t2: 'hi'}, {t1: 'hhhi', t2: 'hi'},
            {t1: 'hhih', t2: 'hi'}, {t1: 'hhii', t2: 'hi'},
            {t1: 'ihhh', t2: 'hi'}, {t1: 'ihhi', t2: 'hi'},
            {t1: 'ihih', t2: 'hi'}, {t1: 'ihii', t2: 'hi'},
            {t1: 'iihh', t2: 'hi'}, {t1: 'iihi', t2: 'hi'},
            {t1: 'iiih', t2: 'hi'}, {t1: 'iiii', t2: 'hi'},
        ],
    });

    testGrammar({
        desc: '31. Join t2:hi ⨝ ~t1:hi',
        grammar: Count({t1:4, t2:2},
                 	   Join(t2("hi"), Not(t1("hi")))),
        vocab: {t1: [..."hi"], t2: [..."hi"]},
        results: [
            {t2: 'hi'},             {t1: 'h', t2: 'hi'},
            {t1: 'i', t2: 'hi'},    {t1: 'hh', t2: 'hi'},
            {t1: 'ih', t2: 'hi'},   {t1: 'ii', t2: 'hi'},
            {t1: 'hih', t2: 'hi'},  {t1: 'hii', t2: 'hi'},
            {t1: 'hhh', t2: 'hi'},  {t1: 'hhi', t2: 'hi'},
            {t1: 'ihh', t2: 'hi'},  {t1: 'ihi', t2: 'hi'},
            {t1: 'iih', t2: 'hi'},  {t1: 'iii', t2: 'hi'},
            {t1: 'hihh', t2: 'hi'}, {t1: 'hihi', t2: 'hi'},
            {t1: 'hiih', t2: 'hi'}, {t1: 'hiii', t2: 'hi'},
            {t1: 'hhhh', t2: 'hi'}, {t1: 'hhhi', t2: 'hi'},
            {t1: 'hhih', t2: 'hi'}, {t1: 'hhii', t2: 'hi'},
            {t1: 'ihhh', t2: 'hi'}, {t1: 'ihhi', t2: 'hi'},
            {t1: 'ihih', t2: 'hi'}, {t1: 'ihii', t2: 'hi'},
            {t1: 'iihh', t2: 'hi'}, {t1: 'iihi', t2: 'hi'},
            {t1: 'iiih', t2: 'hi'}, {t1: 'iiii', t2: 'hi'},
        ],
    });

    testGrammar({
        desc: '32. ~(t1:h+t2:i)',
        grammar: Count({t1:3, t2:3},
                 	   Not(Seq(t1("h"), t2("i")))),
        results: [
            {},
            {t1: 'h'}, {t1: 'hh'}, {t1: 'hhh'},
            {t2: 'i'}, {t2: 'ii'}, {t2: 'iii'},
            {t1: 'h', t2: 'ii'},   {t1: 'h', t2: 'iii'},
            {t1: 'hh', t2: 'i'},   {t1: 'hh', t2: 'ii'},
            {t1: 'hh', t2: 'iii'}, {t1: 'hhh', t2: 'i'},
            {t1: 'hhh', t2: 'ii'}, {t1: 'hhh', t2: 'iii'},
        ],
    });

    testGrammar({
        desc: '33. ~(t1:h|t2:i)',
        grammar: Count({t1:3, t2:3},
                 	   Not(Uni(t1("h"), t2("i")))),
        results: [
            {},         
            {t1: 'hh'},           {t1: 'hhh'},
            {t2: 'ii'},           {t2: 'iii'},
            {t1: 'h', t2: 'i'},   {t1: 'h', t2: 'ii'},
            {t1: 'h', t2: 'iii'}, {t1: 'hh', t2: 'i'},
            {t1: 'hh', t2: 'ii'}, {t1: 'hh', t2: 'iii'},
            {t1: 'hhh', t2: 'i'}, {t1: 'hhh', t2: 'ii'},
            {t1: 'hhh', t2: 'iii'},
        ],
    });

    testGrammar({
        desc: '34. ~(t1:he)',
        grammar: Count({t1:3},
                 	   Not(t1("he"))),
        tapes: ['t1'],
        vocab: {t1: [..."he"]},
        results: [
            {},          {t1: 'h'},   {t1: 'e'},
            {t1: 'hh'},  {t1: 'eh'},  {t1: 'ee'},
            {t1: 'heh'}, {t1: 'hee'}, {t1: 'hhh'},
            {t1: 'hhe'}, {t1: 'ehh'}, {t1: 'ehe'},
            {t1: 'eeh'}, {t1: 'eee'},
        ],
    });

    // Testing negation with "dot".
    
    testGrammar({
        desc: '35. ~(t1:.i)',
        grammar: Count({t1:3},
                 	   Not(Seq(Dot('t1'), t1('i')))),
        vocab: {t1: [..."i"]},
        results: [
            {}, {t1: 'i'}, {t1: 'iii'},
        ],
    });

    testGrammar({
        desc: '36. ~(t1:.) (vocab hi)',
        grammar: Count({t1:2},
        		     WithVocab({t1:'hi'},
                 	     Not(Dot('t1')))),
        tapes: ['t1'],
        vocab: {t1: [..."hi"]},
        results: [
            {},
            {t1: 'hh'}, {t1: 'hi'},
            {t1: 'ih'}, {t1: 'ii'},
        ],
    });

    testGrammar({
        desc: '37. ~(t1:.i)) (vocab hi)',
        grammar: Count({t1:2},
        		     WithVocab({t1:'hi'},
                 	     Not(Seq(Dot('t1'), t1('i'))))),
        tapes: ['t1'],
        vocab: {t1: [..."hi"]},
        results: [
            {},
            {t1: 'h'},  {t1: 'i'},
            {t1: 'hh'}, {t1: 'ih'},
        ],
    });

    testGrammar({
        desc: '38. ~(t1:.i) (vocab hi)',
        grammar: Count({t1:2},
        		     WithVocab({t1:'hi'},
                 	     Not(Seq(Dot('t1'), t1('i'))))),
        tapes: ['t1'],
        vocab: {t1: [..."hi"]},
        results: [
            {},
            {t1: 'h'},  {t1: 'i'},
            {t1: 'hh'}, {t1: 'ih'},
        ],
    });

    testGrammar({
        desc: '39. ~(t1:.{0,1} + t1:i) (vocab hi)',
        grammar: Count({t1:3},
        		     WithVocab({t1:'hi'},
                 	     Not(Seq(Rep(Dot('t1'), 0, 1), t1('i'))))),
        tapes: ['t1'],
        vocab: {t1: [..."hi"]},
        results: [
            {},
            {t1: 'h'},   {t1: 'hh'},  {t1: 'ih'},
            {t1: 'hhh'}, {t1: 'hhi'}, {t1: 'hih'},
            {t1: 'hii'}, {t1: 'ihh'}, {t1: 'ihi'},
            {t1: 'iih'}, {t1: 'iii'},
        ],
    });

    testGrammar({
        desc: '40. ~(t1:.{0,3} + t1:i) (vocab hi)',
        grammar: Count({t1:3},
        		     WithVocab({t1:'hi'},
                 	     Not(Seq(Rep(Dot('t1'), 0, 3), t1('i'))))),
        tapes: ['t1'],
        vocab: {t1: [..."hi"]},
        results: [
            {},
            {t1: 'h'},   {t1: 'hh'},  {t1: 'ih'},
            {t1: 'hhh'}, {t1: 'hih'}, {t1: 'ihh'},
            {t1: 'iih'},
        ],
    });

    testGrammar({
        desc: '41. ~(t1:.*i) (vocab hi)',
        grammar: Count({t1:3},
        		     WithVocab({t1:'hi'},
                 	     Not(Seq(Rep(Dot('t1')), t1('i'))))),
        tapes: ['t1'],
        vocab: {t1: [..."hi"]},
        results: [
            {},
            {t1: 'h'},   {t1: 'hh'},  {t1: 'ih'},
            {t1: 'hhh'}, {t1: 'hih'}, {t1: 'ihh'},
            {t1: 'iih'},
        ],
    });

    testGrammar({
        desc: '42-ltr. Does not contain a: ' +
            '~(Short(t1:.*a) + t1:.*) (vocab ab)',
        grammar: Count({t1:3},
                    WithVocab({t1:'ab'},
                        Not(Seq(Short(Seq(Rep(Dot("t1")), t1("a"))),
                                Rep(Dot("t1")))))),
        results: [
            {}, {t1: 'b'}, {t1: 'bb'}, {t1: 'bbb'},
        ],
        directionLTR: true
    });

    testGrammar({
        desc: '42-rtl. Does not contain a: ' +
            '~(t1:.* + Short(t1:a.*)) (vocab ab)',
        grammar: Count({t1:3},
                    WithVocab({t1:'ab'},
                        Not(Seq(Rep(Dot("t1")), 
                            Short(Seq(t1("a"), Rep(Dot("t1")))))))),
        results: [
            {}, {t1: 'b'}, {t1: 'bb'}, {t1: 'bbb'},
        ],
        directionLTR: false
    });

});
