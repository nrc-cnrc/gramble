import {Project, TextDevEnvironment} from "../src/spreadsheet";
import 'mocha';
import {testNumResults, testFlattenedOutput, cellSplit} from "./test_util"

const devEnv = new TextDevEnvironment();


const impGrammar = cellSplit(`
    VROOT, text, gloss, imp
        , oba, jump, indic
        , obi, jump, imp
        , apara, run, indic
        , aparo, run, imp

    INDIC_STEM, var, text, gloss
        , VROOT, bar, -1SG
        , VROOT, ta, -2SG
        , VROOT, ga, -3SG

    IMP_STEM, var, text, gloss
        , VROOT, sa, -IMP

    MAIN, input imp, var
        , indic    , INDIC_STEM
        , imp      , IMP_STEM
`);

const impProject = new Project().addSheet("testSheet", impGrammar, devEnv);


describe('Using "input imp: indic" to constrain parse path', function() {
    const result = impProject.parseFlatten({text: "obata"});
    testNumResults(result, 1);
    testFlattenedOutput(result, 0, "gloss", "jump-2SG");
});

describe('Using "input imp: imp" to constrain parse path', function() {
    const result = impProject.parseFlatten({text: "obisa"});
    testNumResults(result, 1);
    testFlattenedOutput(result, 0, "gloss", "jump-IMP");
});


describe('Using "input imp: indic" to constrain parse path, impossible parse', function() {
    const result = impProject.parseFlatten({text: "obasa"});
    testNumResults(result, 0);
});

describe('Using "input imp: imp" to constrain parse path, impossible parse', function() {
    const result = impProject.parseFlatten({text: "obita"});
    console.log(result);
    testNumResults(result, 0);
});


const impGrammar2 = cellSplit(`
    VROOT, text, gloss, imp
        , oba, jump,  
        , obi, jump, imp
        , apara, run,  
        , aparo, run, imp

    INDIC_STEM, var, text, gloss
        , VROOT, bar, -1SG
        , VROOT, ta, -2SG
        , VROOT, ga, -3SG

    IMP_STEM, var, text, gloss
        , VROOT, sa, -IMP

    MAIN, input imp, var
        ,          , INDIC_STEM
        , imp      , IMP_STEM
`);

const impProject2 = new Project().addSheet("testSheet", impGrammar2, devEnv);


describe('Using "input imp: <empty>" to constrain parse path', function() {
    const result = impProject2.parseFlatten({text: "obata"});
    testNumResults(result, 1);
    testFlattenedOutput(result, 0, "gloss", "jump-2SG");
});

describe('Using "input imp: imp" to constrain parse path (vs empty)', function() {
    const result = impProject2.parseFlatten({text: "obisa"});
    testNumResults(result, 1);
    testFlattenedOutput(result, 0, "gloss", "jump-IMP");
});


describe('Using "input imp: <empty>" to constrain parse path, impossible parse', function() {
    const result = impProject2.parseFlatten({text: "obasa"});
    testNumResults(result, 0);
});

describe('Using "input imp: imp" to constrain parse path (vs empty), impossible parse', function() {
    const result = impProject2.parseFlatten({text: "obita"});
    console.log(result);
    testNumResults(result, 0);
});