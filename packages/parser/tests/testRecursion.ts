import { 
    Seq, Uni, 
    Join, Embed, 
    Collection 
} from "../src/grammars";
import { 
    t1,
    testGrammar,
} from './testUtil';

import * as path from 'path';
import { SILENT } from "../src/util";


describe(`${path.basename(module.filename)}`, function() {

    describe('Joining "hiworld" with right-recursive "hi+ world"', function() {
        const world = Uni(t1("world"), Embed("hiWorld"))
        const hiWorld = Seq(t1("hi"), world);
        const coll = Collection({
            "hiWorld": hiWorld,
            "default": Join(t1("hiworld"), hiWorld)
        });
        testGrammar(coll, [{t1: "hiworld"}]);
    });
    
    describe('Joining right-recursive "hi+ world" with "hiworld"', function() {
        const world = Uni(t1("world"), Embed("hiWorld"))
        const hiWorld = Seq(t1("hi"), world);
        const coll = Collection({
            "hiWorld": hiWorld,
            "default": Join(hiWorld, t1("hiworld"))
        });
        testGrammar(coll, [{t1: "hiworld"}]);
    });

    describe('Joining "hihiworld" with right-recursive "hi+ world"', function() {
        
        const world = Uni(t1("world"), Embed("hiWorld"))
        const hiWorld = Seq(t1("hi"), world);
        const coll = Collection({
            "hiWorld": hiWorld,
            "default": Join(t1("hihiworld"), hiWorld)
        });
        testGrammar(coll, [{t1: "hihiworld"}]);
    });

    describe('Joining right-recursive "hi+ world" with "hihiworld"', function() {
        
        const world = Uni(t1("world"), Embed("hiWorld"))
        const hiWorld = Seq(t1("hi"), world);
        const coll = Collection({
            "hiWorld": hiWorld,
            "default": Join(hiWorld, t1("hihiworld"))
        });
        testGrammar(coll, [{t1: "hihiworld"}]);
    });

    describe('Joining "hiworld" with left-recursive "hi+ world"', function() {
        const hihi = Uni(t1("hi"), Seq(Embed("hihi"), t1("hi")));
        const hiWorld = Seq(hihi, t1("world"));
        const coll = Collection({
            "hihi": hihi,
            "default": Join(t1("hiworld"), hiWorld)
        });
        testGrammar(coll, [{t1: "hiworld"}]);
    });

    describe('Joining "hihiworld" with left-recursive "hi+ world"', function() {
        const hihi = Uni(t1("hi"), Seq(Embed("hihi"), t1("hi")));
        const hiWorld = Seq(hihi, t1("world"));
        const coll = Collection({
            "hihi": hihi,
            "default": Join(t1("hihiworld"), hiWorld)
        });
        testGrammar(coll, [{t1: "hihiworld"}]);
    });

    describe('Joining left-recursive "hi+ world" with "hiworld"', function() {
        const hihi = Uni(t1("hi"), Seq(Embed("hihi"), t1("hi")));
        const hiWorld = Seq(hihi, t1("world"));
        const coll = Collection({
            "hihi": hihi,
            "default": Join(hiWorld, t1("hiworld"))
        });
        testGrammar(coll, [{t1: "hiworld"}]);
    });
    
    describe('Joining left-recursive "hi+ world" with "hihiworld"', function() {
        const hihi = Uni(t1("hi"), Seq(Embed("hihi"), t1("hi")));
        const hiWorld = Seq(hihi, t1("world"));
        const coll = Collection({
            "hihi": hihi,
            "default": Join(hiWorld, t1("hihiworld"))
        });
        testGrammar(coll, [{t1: "hihiworld"}]);
    });

    describe('Generating from right-recursive "hi+ world" with default max recursion (4)', function() {
        const world = Uni(t1("world"), Embed("hiWorld"))
        const hiWorld = Seq(t1("hi"), world);
        const coll = Collection({
            "hiWorld": hiWorld,
            "default": hiWorld
        });
        testGrammar(coll, [{t1: "hiworld"},
                              {t1: "hihiworld"},
                              {t1: "hihihiworld"},
                              {t1: "hihihihiworld"},
                              {t1: "hihihihihiworld"}]);
    });

    describe('Emitting from right-recursive "hi+ world" with max recursion 2', function() {
        const world = Uni(t1("world"), Embed("hiWorld"))
        const hiWorld = Seq(t1("hi"), world);
        const coll = Collection({
            "hiWorld": hiWorld,
            "default": hiWorld
        });
        testGrammar(coll, [{t1: "hiworld"},
                              {t1: "hihiworld"},
                              {t1: "hihihiworld"}], 
                            SILENT, "", 2);
    });
    
    describe('Emitting from center-recursive "hi+ world" with max recursion 2', function() {
        const world = Uni(t1("world"), Embed("hiWorld"))
        const hiWorld = Seq(t1("hi"), world, t1("hi"));
        const coll = Collection({
            "hiWorld": hiWorld,
            "default": hiWorld
        });
        testGrammar(coll, [{t1: "hiworldhi"},
                              {t1: "hihiworldhihi"},
                              {t1: "hihihiworldhihihi"}], 
                            SILENT, "", 2);
    });

    describe('Emitting from right-recursive "hi+ world" with max recursion 0', function() {
        const world = Uni(t1("world"), Embed("hiWorld"))
        const hiWorld = Seq(t1("hi"), world);
        const coll = Collection({
            "hiWorld": hiWorld,
            "default": hiWorld
        });
        testGrammar(coll, [{t1: "hiworld"}], SILENT, "", 0);
    });

    describe('Emitting from left-recursive "hi+ world" with default max recursion (4)', function() {
        const hihi = Uni(t1("hi"), Seq(Embed("hihi"), t1("hi")));
        const hiWorld = Seq(hihi, t1("world"));
        const coll = Collection({
            "hihi": hihi,
            "default": hiWorld
        });
        testGrammar(coll, [{t1: "hiworld"},
                              {t1: "hihiworld"},
                              {t1: "hihihiworld"},
                              {t1: "hihihihiworld"},
                              {t1: "hihihihihiworld"}]);
    });

    describe('Emitting from left-recursive "hi+ world" with max recursion 2', function() {
        const hihi = Uni(t1("hi"), Seq(Embed("hihi"), t1("hi")));
        const hiWorld = Seq(hihi, t1("world"));
        const coll = Collection({
            "hihi": hihi,
            "default": hiWorld
        });
        testGrammar(coll, [{t1: "hiworld"},
                              {t1: "hihiworld"},
                              {t1: "hihihiworld"}], 
                            SILENT, "", 2);
    });

    describe('Emitting from left-recursive "hi+ world" with max recursion 0', function() {
        const hihi = Uni(t1("hi"), Seq(Embed("hihi"), t1("hi")));
        const hiWorld = Seq(hihi, t1("world"));
        const coll = Collection({
            "hihi": hihi,
            "default": hiWorld
        });
        testGrammar(coll, [{t1: "hiworld"}], 
                        SILENT, "", 0);
    }); 
});