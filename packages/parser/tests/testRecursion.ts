import { 
    Seq, Uni, 
    Join, Embed, 
    Collection 
} from "../src/grammars";

import { 
    testSuiteName, logTestSuite,
    VERBOSE_TEST_L2,
    t1,
    testGrammar,
} from './testUtil';

import {
    StringDict, SILENT, VERBOSE_DEBUG,
} from "../src/util";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

describe(`${testSuiteName(module)}`, function() {

    logTestSuite(this.title);

    describe('1. Join t1:hiworld ⨝ right-recursive (t1:hi)+ + t1:world', function() {
        const world = Uni(t1("world"), Embed("hiWorld"))
        const hiWorld = Seq(t1("hi"), world);
        const coll = Collection({
            hiWorld: hiWorld,
            default: Join(t1("hiworld"), hiWorld)
        });
        const expectedResults: StringDict[] = [
            {t1: "hiworld"}
        ];
        testGrammar(coll, expectedResults);
    });
    
    describe('2. Join right-recursive (t1:hi)+ + t1:world ⨝ t1:hiworld', function() {
        const world = Uni(t1("world"), Embed("hiWorld"))
        const hiWorld = Seq(t1("hi"), world);
        const coll = Collection({
            hiWorld: hiWorld,
            default: Join(hiWorld, t1("hiworld"))
        });
        const expectedResults: StringDict[] = [
            {t1: "hiworld"}
        ];
        testGrammar(coll, expectedResults);
    });

    describe('3. Join t1:hihiworld ⨝ right-recursive (t1:hi)+ + t1:world', function() {
        const world = Uni(t1("world"), Embed("hiWorld"))
        const hiWorld = Seq(t1("hi"), world);
        const coll = Collection({
            hiWorld: hiWorld,
            default: Join(t1("hihiworld"), hiWorld)
        });
        const expectedResults: StringDict[] = [
            {t1: "hihiworld"}
        ];
        testGrammar(coll, expectedResults);
    });

    describe('4. Join right-recursive (t1:hi)+ + t1:world ⨝ t1:hihiworld', function() {
        const world = Uni(t1("world"), Embed("hiWorld"))
        const hiWorld = Seq(t1("hi"), world);
        const coll = Collection({
            hiWorld: hiWorld,
            default: Join(hiWorld, t1("hihiworld"))
        });
        const expectedResults: StringDict[] = [
            {t1: "hihiworld"}
        ];
        testGrammar(coll, expectedResults);
    });

    describe('5. Join t1:hiworld ⨝ left-recursive (t1:hi)+ + t1:world', function() {
        const hihi = Uni(t1("hi"), Seq(Embed("hihi"), t1("hi")));
        const hiWorld = Seq(hihi, t1("world"));
        const coll = Collection({
            hihi: hihi,
            default: Join(t1("hiworld"), hiWorld)
        });
        const expectedResults: StringDict[] = [
            {t1: "hiworld"}
        ];
        testGrammar(coll, expectedResults);
    });

    describe('6. Join t1:hihiworld ⨝ left-recursive (t1:hi)+ + t1:world', function() {
        const hihi = Uni(t1("hi"), Seq(Embed("hihi"), t1("hi")));
        const hiWorld = Seq(hihi, t1("world"));
        const coll = Collection({
            hihi: hihi,
            default: Join(t1("hihiworld"), hiWorld)
        });
        const expectedResults: StringDict[] = [
            {t1: "hihiworld"}
        ];
        testGrammar(coll, expectedResults);
    });

    describe('7. Join left-recursive (t1:hi)+ + t1:world ⨝ t1:hiworld', function() {
        const hihi = Uni(t1("hi"), Seq(Embed("hihi"), t1("hi")));
        const hiWorld = Seq(hihi, t1("world"));
        const coll = Collection({
            hihi: hihi,
            default: Join(hiWorld, t1("hiworld"))
        });
        const expectedResults: StringDict[] = [
            {t1: "hiworld"}
        ];
        testGrammar(coll, expectedResults);
    });
    
    describe('8. Join left-recursive (t1:hi)+ + t1:world ⨝ t1:hihiworld', function() {
        const hihi = Uni(t1("hi"), Seq(Embed("hihi"), t1("hi")));
        const hiWorld = Seq(hihi, t1("world"));
        const coll = Collection({
            hihi: hihi,
            default: Join(hiWorld, t1("hihiworld"))
        });
        const expectedResults: StringDict[] = [
            {t1: "hihiworld"}
        ];
        testGrammar(coll, expectedResults);
    });

    describe('9. Emit from right-recursive (t1:hi)+ + t1:world ' +
             'with default max recursion (4)', function() {
        const world = Uni(t1("world"), Embed("hiWorld"))
        const hiWorld = Seq(t1("hi"), world);
        const coll = Collection({
            hiWorld: hiWorld,
            default: hiWorld
        });
        const expectedResults: StringDict[] = [
            {t1: "hiworld"},
            {t1: "hihiworld"},
            {t1: "hihihiworld"},
            {t1: "hihihihiworld"},
            {t1: "hihihihihiworld"},
        ];
        testGrammar(coll, expectedResults);
    });

    describe('10. Emit from right-recursive (t1:hi)+ + t1:world ' +
             'with max recursion 2', function() {
        const world = Uni(t1("world"), Embed("hiWorld"))
        const hiWorld = Seq(t1("hi"), world);
        const coll = Collection({
            hiWorld: hiWorld,
            default: hiWorld
        });
        const expectedResults: StringDict[] = [
            {t1: "hiworld"},
            {t1: "hihiworld"},
            {t1: "hihihiworld"},
        ];
        testGrammar(coll, expectedResults, SILENT, "", 2);
    });
    
    describe('11. Emit from center-recursive (t1:hi)+ + t1:world ' +
             'with max recursion 2', function() {
        const world = Uni(t1("world"), Embed("hiWorld"))
        const hiWorld = Seq(t1("hi"), world, t1("hi"));
        const coll = Collection({
            hiWorld: hiWorld,
            default: hiWorld
        });
        const expectedResults: StringDict[] = [
            {t1: "hiworldhi"},
            {t1: "hihiworldhihi"},
            {t1: "hihihiworldhihihi"},
        ];
        testGrammar(coll, expectedResults, SILENT, "", 2);
    });

    describe('12. Emit from right-recursive (t1:hi)+ + t1:world ' +
             'with max recursion 0', function() {
        const world = Uni(t1("world"), Embed("hiWorld"))
        const hiWorld = Seq(t1("hi"), world);
        const coll = Collection({
            hiWorld: hiWorld,
            default: hiWorld
        });
        const expectedResults: StringDict[] = [
            {t1: "hiworld"}
        ];
        testGrammar(coll, expectedResults, SILENT, "", 0);
    });

    describe('13. Emit from left-recursive (t1:hi)+ + t1:world ' +
             'with default max recursion (4)', function() {
        const hihi = Uni(t1("hi"), Seq(Embed("hihi"), t1("hi")));
        const hiWorld = Seq(hihi, t1("world"));
        const coll = Collection({
            hihi: hihi,
            default: hiWorld
        });
        const expectedResults: StringDict[] = [
            {t1: "hiworld"},
            {t1: "hihiworld"},
            {t1: "hihihiworld"},
            {t1: "hihihihiworld"},
            {t1: "hihihihihiworld"},
        ];
        testGrammar(coll, expectedResults);
    });

    describe('14. Emit from left-recursive (t1:hi)+ + t1:world ' +
             'with max recursion 2', function() {
        const hihi = Uni(t1("hi"), Seq(Embed("hihi"), t1("hi")));
        const hiWorld = Seq(hihi, t1("world"));
        const coll = Collection({
            hihi: hihi,
            default: hiWorld
        });
        const expectedResults: StringDict[] = [
            {t1: "hiworld"},
            {t1: "hihiworld"},
            {t1: "hihihiworld"},
        ];
        testGrammar(coll, expectedResults, SILENT, "", 2);
    });

    describe('15. Emit from left-recursive (t1:hi)+ + t1:world ' +
             'with max recursion 0', function() {
        const hihi = Uni(t1("hi"), Seq(Embed("hihi"), t1("hi")));
        const hiWorld = Seq(hihi, t1("world"));
        const coll = Collection({
            hihi: hihi,
            default: hiWorld
        });
        const expectedResults: StringDict[] = [
            {t1: "hiworld"}
        ];
        testGrammar(coll, expectedResults, SILENT, "", 0);
    }); 
});
