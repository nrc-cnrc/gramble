import {TextProject} from "../src/spreadsheet";
import 'mocha';
import {testNumResults, testFlattenedOutput, cellSplit} from "./test_util"

const impGrammar = cellSplit(`
    VROOT, add, text, gloss, imp
        , , oba, jump, indic
        , , obi, jump, imp
        , , apara, run, indic
        , , aparo, run, imp

    INDIC_STEM, add, var, text, gloss
        , , VROOT, bar, -1SG
        , , VROOT, ta, -2SG
        , , VROOT, ga, -3SG

    IMP_STEM, add, var, text, gloss
        , , VROOT, sa, -IMP

    MAIN, add, require imp, var
        , , indic    , INDIC_STEM
        , , imp      , IMP_STEM
`);

const impProject = new TextProject().addSheet("testSheet", impGrammar);


describe('Requirement grammar, Using "input imp: indic" to constrain parse path', function() {
    const result = impProject.parseFlatten({text: "obata"});
    testNumResults(result, 1);
    testFlattenedOutput(result, 0, "gloss", "jump-2SG");
});

describe('Requirement grammar, Using "input imp: imp" to constrain parse path', function() {
    const result = impProject.parseFlatten({text: "obisa"});
    testNumResults(result, 1);
    testFlattenedOutput(result, 0, "gloss", "jump-IMP");
});


describe('Requirement grammar, Using "input imp: indic" to constrain parse path, impossible parse', function() {
    const result = impProject.parseFlatten({text: "obasa"});
    testNumResults(result, 0);
});

describe('Requirement grammar, Using "input imp: imp" to constrain parse path, impossible parse', function() {
    const result = impProject.parseFlatten({text: "obita"});
    testNumResults(result, 0);
});


describe('Requirement grammar, generating all forms', function() {
    const result = impProject.generateFlatten();
    testNumResults(result, 8);
});


describe('Requirement grammar, generating all non-imperative forms', function() {
    const result = impProject.parseFlatten({imp: "indic"});
    testNumResults(result, 6);
});

describe('Requirement grammar, generating all imperative forms', function() {
    const result = impProject.parseFlatten({imp: "imp"});
    testNumResults(result, 2);
});


const impGrammar2 = cellSplit(`
    VROOT, add, text, gloss, imp
        , , oba, jump, 
        , , obi, jump, imp
        , , apara, run,  
        , , aparo, run, imp

    INDIC_STEM, add, var, text, gloss
        , , VROOT, bar, -1SG
        , , VROOT, ta, -2SG
        , , VROOT, ga, -3SG

    IMP_STEM, add, var, text, gloss
        , , VROOT, sa, -IMP

    MAIN, add, require imp, var
        ,  ,        , INDIC_STEM
        , , imp      , IMP_STEM
`);

const impProject2 = new TextProject().addSheet("testSheet", impGrammar2);


describe('Requirement grammar with empty cells, Using "input imp: <empty>" to constrain parse path', function() {
    const result = impProject2.parseFlatten({text: "obata"});
    testNumResults(result, 1);
    testFlattenedOutput(result, 0, "gloss", "jump-2SG");
});

describe('Requirement grammar with empty cells, Using "input imp: imp" to constrain parse path (vs empty)', function() {
    const result = impProject2.parseFlatten({text: "obisa"});
    testNumResults(result, 1);
    testFlattenedOutput(result, 0, "gloss", "jump-IMP");
});


describe('Requirement grammar with empty cells, Using "input imp: <empty>" to constrain parse path, impossible parse', function() {
    const result = impProject2.parseFlatten({text: "obasa"});
    testNumResults(result, 0);
});

describe('Requirement grammar with empty cells, Using "input imp: imp" to constrain parse path (vs empty), impossible parse', function() {
    const result = impProject2.parseFlatten({text: "obita"});
    testNumResults(result, 0);
});


describe('Requirement grammar with empty cells, generating all forms', function() {
    const result = impProject2.generateFlatten();
    testNumResults(result, 8);
});

const impGrammar3 = cellSplit(`
    VROOT, add, text, gloss, imp, irr
        , , obe, jump, indic, real
        , , obi, jump, imp, irr
        , , obo, jump, indic, irr
        , , apara, run, indic, real
        , , apare, run, imp, irr
        , , aparo, run, indic, irr

    INDIC_STEM, add, var, text, gloss
        , , VROOT, bar, -1SG
        , , VROOT, ta, -2SG
        , , VROOT, ga, -3SG

    IMP_STEM, add, var, text, gloss
        , , VROOT, sa, -IMP

    MAIN, add, require imp, require irr, var
        , , indic      , irr        , INDIC_STEM
        , , indic      , real       , INDIC_STEM
        , , imp        , irr        , IMP_STEM
`);


const impProject3 = new TextProject().addSheet("testSheet", impGrammar3);


describe('Requirement grammar with multiple requirements, generating all forms', function() {
    const result = impProject3.generateFlatten();
    testNumResults(result, 14);
});

describe('Requirement grammar with multiple requirements, generating all non-imperative forms', function() {
    const result = impProject3.parseFlatten({imp: "indic"});
    testNumResults(result, 12);
});

describe('Requirement grammar with multiple requirements, generating all imperative forms', function() {
    const result = impProject3.parseFlatten({imp: "imp"});
    testNumResults(result, 2);
});

describe('Requirement grammar with multiple requirements, generating all realis forms', function() {
    const result = impProject3.parseFlatten({irr: "real"});
    testNumResults(result, 6);
});


describe('Requirement grammar with multiple requirements, generating all indicative irrealis forms', function() {
    const result = impProject3.parseFlatten({imp: "indic", irr: "irr"});
    testNumResults(result, 6);
});


describe('Requirement grammar with multiple requirements, generating all imperative realis forms', function() {
    const result = impProject3.parseFlatten({imp: "imp", irr: "real"});
    testNumResults(result, 0);
});


const impGrammar4 = cellSplit(`
    VROOT, add, text, gloss, alt imp
        , , obi, jump, indic|imp
        , , apara, run, indic
        , , aparo, run, imp

    INDIC_STEM, add, var, text, gloss
        , , VROOT, bar, -1SG
        , , VROOT, ta, -2SG
        , , VROOT, ga, -3SG

    IMP_STEM, add, var, text, gloss
        , , VROOT, sa, -IMP

    MAIN, add, require imp, var
        , , indic      , INDIC_STEM
        , , imp        , IMP_STEM
`);

const impProject4 = new TextProject().addSheet("testSheet", impGrammar4);

describe('Requirement grammar with alt cells, Using "input imp: indic" to constrain parse path', function() {
    const result = impProject4.parseFlatten({text: "obita"});
    testNumResults(result, 1);
    testFlattenedOutput(result, 0, "gloss", "jump-2SG");
});

describe('Requirement grammar with alt cells, Using "input imp: imp" to constrain parse path', function() {
    const result = impProject4.parseFlatten({text: "obisa"});
    testNumResults(result, 1);
    testFlattenedOutput(result, 0, "gloss", "jump-IMP");
});


describe('Requirement grammar with alt cells, generating all non-imperative forms', function() {
    const result = impProject4.parseFlatten({imp: "indic"});
    testNumResults(result, 6);
});

describe('Requirement grammar with alt cells, generating all imperative forms', function() {
    const result = impProject4.parseFlatten({imp: "imp"});
    testNumResults(result, 2);
});