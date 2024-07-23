import { 
    Seq, Uni, 
    Join, Embed, 
} from "../../interpreter/src/grammarConvenience";

import {
    grammarTestSuiteName,
    testGrammar,
    t1,
} from "./testGrammarUtil";

import { 
    logTestSuite, VERBOSE_TEST_L2,
} from '../testUtil';

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

describe(`${grammarTestSuiteName(module)}`, function() {

    logTestSuite(this.title);

    const world = Uni(t1("world"), Embed("hiWorld"));
    const rr_hiWorld = Seq(t1("hi"), world);
    const cr_hiWorld = Seq(t1("hi"), world, t1("hi"));
    const lr_hihi = Uni(t1("hi"), Seq(Embed("hihi"), t1("hi")));
    const lr_hiWorld = Seq(lr_hihi, t1("world"));

    testGrammar({
        desc: '1. Join t1:hiworld ⨝ right-recursive (t1:hi)+ + t1:world',
        grammar: {
            hiWorld: rr_hiWorld,
            default: Join(t1("hiworld"), rr_hiWorld)
        },
        results: [
            {t1: "hiworld"},
        ],
    });

    testGrammar({
        desc: '2. Join right-recursive (t1:hi)+ + t1:world ⨝ t1:hiworld',
        grammar: {
            hiWorld: rr_hiWorld,
            default: Join(rr_hiWorld, t1("hiworld"))
        },
        results: [
            {t1: "hiworld"},
        ],
    });

    testGrammar({
        desc: '3. Join t1:hihiworld ⨝ right-recursive (t1:hi)+ + t1:world',
        grammar: {
            hiWorld: rr_hiWorld,
            default: Join(t1("hihiworld"), rr_hiWorld)
        },
        results: [
            {t1: "hihiworld"},
        ],
    });

    testGrammar({
        desc: '4. Join right-recursive (t1:hi)+ + t1:world ⨝ t1:hihiworld',
        grammar: {
            hiWorld: rr_hiWorld,
            default: Join(rr_hiWorld, t1("hihiworld"))
        },
        results: [
            {t1: "hihiworld"},
        ],
    });

    testGrammar({
        desc: '5. Join t1:hiworld ⨝ left-recursive (t1:hi)+ + t1:world',
        grammar: {
            hihi: lr_hihi,
            default: Join(t1("hiworld"), lr_hiWorld)
        },
        results: [
            {t1: "hiworld"},
        ],
    });

    testGrammar({
        desc: '6. Join t1:hihiworld ⨝ left-recursive (t1:hi)+ + t1:world',
        grammar: {
            hihi: lr_hihi,
            default: Join(t1("hihiworld"), lr_hiWorld)
        },
        results: [
            {t1: "hihiworld"},
        ],
    });

    testGrammar({
        desc: '7. Join left-recursive (t1:hi)+ + t1:world ⨝ t1:hiworld',
        grammar: {
            hihi: lr_hihi,
            default: Join(lr_hiWorld, t1("hiworld"))
        },
        results: [
            {t1: "hiworld"},
        ],
    });

    testGrammar({
        desc: '8. Join left-recursive (t1:hi)+ + t1:world ⨝ t1:hihiworld',
        grammar: {
            hihi: lr_hihi,
            default: Join(lr_hiWorld, t1("hihiworld"))
        },
        results: [
            {t1: "hihiworld"},
        ],
    });

    testGrammar({
        desc: '9. Emit from right-recursive (t1:hi)+ + t1:world ' +
              'with default max recursion (4)',
        grammar: {
            hiWorld: rr_hiWorld,
            default: rr_hiWorld
        },
        results: [
            {t1: "hiworld"},
            {t1: "hihiworld"},
            {t1: "hihihiworld"},
            {t1: "hihihihiworld"},
            {t1: "hihihihihiworld"},
        ],
    });

    testGrammar({
        desc: '10. Emit from right-recursive (t1:hi)+ + t1:world ' +
              'with max recursion 2',
        grammar: {
            hiWorld: rr_hiWorld,
            default: rr_hiWorld
        },
        maxRecursion: 2,
        results: [
            {t1: "hiworld"},
            {t1: "hihiworld"},
            {t1: "hihihiworld"},
        ],
    });

    testGrammar({
        desc: '11. Emit from center-recursive (t1:hi)+ + t1:world ' +
              'with max recursion 2',
        grammar: {
            hiWorld: cr_hiWorld,
            default: cr_hiWorld
        },
        maxRecursion: 2,
        results: [
            {t1: "hiworldhi"},
            {t1: "hihiworldhihi"},
            {t1: "hihihiworldhihihi"},
        ],
    });

    testGrammar({
        desc: '12. Emit from right-recursive (t1:hi)+ + t1:world ' +
              'with max recursion 0',
        grammar: {
            hiWorld: rr_hiWorld,
            default: rr_hiWorld
        },
        maxRecursion: 0,
        results: [
            {t1: "hiworld"},
        ],
    });

    testGrammar({
        desc: '13. Emit from left-recursive (t1:hi)+ + t1:world ' +
              'with default max recursion (4)',
        grammar: {
            hihi: lr_hihi,
            default: lr_hiWorld
        },
        results: [
            {t1: "hiworld"},
            {t1: "hihiworld"},
            {t1: "hihihiworld"},
            {t1: "hihihihiworld"},
            {t1: "hihihihihiworld"},
        ],
    });

    testGrammar({
        desc: '14. Emit from left-recursive (t1:hi)+ + t1:world ' +
              'with max recursion 2',
        grammar: {
            hihi: lr_hihi,
            default: lr_hiWorld
        },
        maxRecursion: 2,
        results: [
            {t1: "hiworld"},
            {t1: "hihiworld"},
            {t1: "hihihiworld"},
        ],
    });

    testGrammar({
        desc: '15. Emit from left-recursive (t1:hi)+ + t1:world ' +
              'with max recursion 0',
        grammar: {
            hihi: lr_hihi,
            default: lr_hiWorld
        },
        maxRecursion: 0,
        results: [
            {t1: "hiworld"},
        ],
    });

});
