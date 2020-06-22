import {RandomPicker} from "../src/util"
import { expect } from 'chai';
import 'mocha';
import {testNumResults, testOutput, cellSplit, testFlattenedOutput} from "./test_util";
import {transducerFromTable, Transducer, makeTable} from "../src/transducers"
import {Project, TextDevEnvironment} from "../src/spreadsheet";

const devEnv = new TextDevEnvironment();

/**
 * Testing the random picker
 */

describe('Random picker', function() {
    const items: Array<[string, number]> = [ ["foo", 0.2], ["moo", 0.2], ["loo", 0.6] ];
    const picker = new RandomPicker<string>(items);
    const draw1 = picker.pop();
    const draw2 = picker.pop();
    const draw3 = picker.pop();
    const draw4 = picker.pop();
    it("should have all different draws", function() {
        expect(draw1).to.not.equal(draw2);
        expect(draw1).to.not.equal(draw3);
        expect(draw2).to.not.equal(draw3);
    });
    
    it("should return undefined after popping all items", function() {
        expect(draw4).to.be.undefined;
    });
});

/**
 * Random parsing from an ambiguous grammar
 */

const flatGrammar = cellSplit(`
    VROOT, text, gloss
        , foo, jump
        , foob, run

    TENSE, text, gloss
        , bar, -1SG
        , ar, -3SG.PAST
        , tar, -3PL.PAST

    MAIN, var, var
    , VROOT, TENSE
`);


const flatProject = new Project().addSheet("testSheet", flatGrammar, devEnv);

describe('Random transducer, with max_results=1', function() {
    const result = flatProject.parseFlatten({text: "foobar"}, "MAIN", true, 1);
    testNumResults(result, 1);
});


describe('Random generator, with max_results=1', function() {
    const result = flatProject.generateFlatten('MAIN', true, 1);
    testNumResults(result, 1);
});

/**
 * The flat grammar with explicit probabilities for some rows
 */

const probGrammar = cellSplit(`
    VROOT, text, gloss
        , foo, jump
        , foob, run

    TENSE, text, gloss, p
        , bar, -1SG, 0.0
        , ar, -3SG.PAST, 1.0
        , tar, -3PL.PAST, 0.5

    MAIN, var, var
    , VROOT, TENSE
`);


const probProject = new Project().addSheet("testSheet", probGrammar, devEnv);


describe('Random transducer with weights', function() {

    const results = probProject.parseFlatten({text: "foobar"});
    testNumResults(results, 2);

    // there will be two results, but one of which has probability zero
    var nonzero_results: {[key: string]: string}[] = [];
    for (const record of results) {
        for (const key in record) {
            if (key == "p" && parseFloat(record.p) != 0) {
                nonzero_results.push(record);
            }
        }
    }
    testNumResults(nonzero_results, 1);
    testFlattenedOutput(nonzero_results, 0, "gloss", "run-3SG.PAST");
});
    
