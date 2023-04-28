import { 
    testErrors, sheetFromFile, 
    testHasVocab, testGrammar 
} from "../../testUtil";
import * as path from 'path';
import { VERBOSE_DEBUG, VERBOSE_STATES } from "../../../src/util";

const DIR = `${path.dirname(module.filename)}/csvs`;

describe(`${path.basename(module.filename)}`, function() {

    describe('Simple replace', function() {
        const project = sheetFromFile(`${DIR}/simpleReplace.csv`);
        testHasVocab(project, {text: 3})
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"}
        ]);
    }); 
    
    describe('Trivial replace', function() {
        const project = sheetFromFile(`${DIR}/trivialReplace.csv`);
        testHasVocab(project, {text: 2})
        testErrors(project, []);
        testGrammar(project, [
            {"text":"aba"}
        ]);
    }); 

    describe('Simple replace multiple times', function() {
        const project = sheetFromFile(`${DIR}/replaceMulti.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"avva"}
        ]);
    });
    
    describe('Simple replace under assignment', function() {
        const project = sheetFromFile(`${DIR}/replaceUnderAssignment.csv`);
        testHasVocab(project, {text: 3})
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"}
        ]);
    }); 
    
    describe('Replacing wrong tape', function() {
        const project = sheetFromFile( `${DIR}/replaceWrongTape.csv`);
        testErrors(project, [
            ["replaceWrongTape",3,1,"error"]
        ]);
        testGrammar(project, [
            {"text":"aba"}
        ]);
    }); 

    describe('Replace but the tape is a reserved word', function() {
        const project = sheetFromFile(`${DIR}/replaceReservedWord.csv`);
        testErrors(project, [
            ["replaceReservedWord",3,1,"error"]
        ]);
        testGrammar(project, [
            {"text":"aba"}
        ]);
    }); 

    describe('Simple replace with embed', function() {
        const project = sheetFromFile(`${DIR}/replaceEmbed.csv`);
        testHasVocab(project, {text: 3})
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"}
        ]);
    });
    
    describe('Simple replace with two embed', function() {
        const project = sheetFromFile(`${DIR}/replaceTwoEmbed.csv`);
        testHasVocab(project, {text: 3})
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"}
        ]);
    });

    describe('Simple replace with two embed 2', function() {
        const project = sheetFromFile(`${DIR}/replaceTwoEmbed2.csv`);
        testHasVocab(project, {text: 3})
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"}
        ]);
    });

    describe('Replacing, embedded', function() {
        const project = sheetFromFile(`${DIR}/replaceEmbedded.csv`);
        testHasVocab(project, {text: 3})
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"}
        ]);
    });
    
    describe('Rule cascade, embedded', function() {
        const project = sheetFromFile(`${DIR}/cascadeEmbedded.csv`);
        testHasVocab(project, {text: 4})
        testErrors(project, []);
        testGrammar(project, [
            {"text":"awa"}
        ]);
    });

    describe('Replacing an embedded replace', function() {
        const project = sheetFromFile(`${DIR}/replaceEmbeddedReplace.csv`);
        testHasVocab(project, {text: 4})
        testErrors(project, []);
        testGrammar(project, [
            {"text":"awa"}
        ]);
    });
    
    describe('Cascading an embedded casecade', function() {
        const project = sheetFromFile(`${DIR}/cascadeOfCascade.csv`);
        testHasVocab(project, {text: 8})
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ABCD"}
        ]);
    });

    describe('Nested replace', function() {
        const project = sheetFromFile(`${DIR}/nestedSame.csv`);
        testHasVocab(project, {text: 3})
        testErrors(project, []);
        testGrammar(project, [
            {text: "w"}
        ]);
    });
    
    describe('Nested replace under assignment', function() {
        const project = sheetFromFile(`${DIR}/nestedSameUnderAssignment.csv`);
        testHasVocab(project, {text: 3})
        testErrors(project, []);
        testGrammar(project, [
            {text: "w"}
        ]);
    });
    
    describe('Nested replace with some unchanged letters', function() {
        const project = sheetFromFile(`${DIR}/nestedSameWithUnchanged.csv`);
        testHasVocab(project, {text: 5})
        testErrors(project, []);
        testGrammar(project, [
            {text: "awc"}
        ]);
    });

    describe('Nested replace 2', function() {
        const project = sheetFromFile(`${DIR}/nestedSame2.csv`);
        testHasVocab(project, {text: 4})
        testErrors(project, []);
        testGrammar(project, [
            {text: "ev"}
        ]);
    });
    
    describe('Rule cascade', function() {
        const project = sheetFromFile(`${DIR}/ruleCascade.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {text: "w"}
        ]);
    });

    
    describe('Rule cascade 2', function() {
        const project = sheetFromFile(`${DIR}/ruleCascade2.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {text: "ev"}
        ]);
    });
    
    describe('Simple replace with pre', function() {
        const project = sheetFromFile(`${DIR}/ruleWithPre.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"},
            {"text":"arba"}
        ]);
    });

    describe('Simple replace with post', function() {
        const project = sheetFromFile(`${DIR}/ruleWithPost.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"},
            {"text":"abra"}
        ]);
    });

    describe('Simple replace with pre and post', function() {
        const project = sheetFromFile(`${DIR}/ruleWithPrePost.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"},
            {"text":"abra"},
            {"text":"arba"}
        ]);
    });
    
    describe('Replace with pre context', function() {
        const project = sheetFromFile(`${DIR}/rulePreContext.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"},
            {"text":"arba"}
        ]);
    });

    describe('Replace with post context', function() {
        const project = sheetFromFile(`${DIR}/rulePostContext.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"},
            {"text":"abra"}
        ]);
    });
    
    describe('Replace with pre and post context', function() {
        const project = sheetFromFile(`${DIR}/rulePrePostContext.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"},
            {"text":"abra"},
            {"text":"arba"}
        ]);
    });

    describe('Replace with an empty-string context', function() {
        const project = sheetFromFile(`${DIR}/ruleEmptyStringContext.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"},
            {"text":"arva"}
        ]);
    });
    
    describe('Replace with an empty context', function() {
        const project = sheetFromFile(`${DIR}/ruleEmptyContext.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"},
            {"text":"arva"}
        ]);
    });

    describe('Replace with an alternation in from', function() {
        const project = sheetFromFile(`${DIR}/ruleFromAlt.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"}
        ]);
    });

    describe('Replace with an alternation in to', function() {
        const project = sheetFromFile(`${DIR}/ruleToAlt.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"apa"},
            {"text":"ava"}
        ]);
    });

    describe('Replace with an alternation in pre', function() {
        const project = sheetFromFile(`${DIR}/rulePreAlt.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"},
            {"text":"arba"},
            {"text":"iva"}
        ]);
    });

    describe('Replace with an alternation in pre context', function() {
        const project = sheetFromFile(`${DIR}/rulePreContextAlt.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"},
            {"text":"arba"},
            {"text":"iva"}
        ]);
    });

    describe('Replace with an alternation in post', function() {
        const project = sheetFromFile(`${DIR}/rulePostAlt.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"},
            {"text":"abra"},
            {"text":"avi"}
        ]);
    });
    
    describe('Replace with an alternation in post context', function() {
        const project = sheetFromFile(`${DIR}/rulePostContextAlt.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"},
            {"text":"abra"},
            {"text":"avi"}
        ]);
    });

    describe('Replace with a repetition in from', function() {
        const project = sheetFromFile(`${DIR}/ruleFromRep.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"aa"},
            {"text":"ava"},
            {"text":"ava"},
            {"text":"avva"}
        ]);
    });
    
    describe('Replace with a repetition in to', function() {
        const project = sheetFromFile(`${DIR}/ruleToRep.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"av*a"},
        ]);
    });

    describe('Replace with a repetition in pre', function() {
        const project = sheetFromFile(`${DIR}/rulePreRep.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"aba"},
            {"text":"dava"},
            {"text":"daava"},
        ]);
    });

    describe('Replace with a repetition in post', function() {
        const project = sheetFromFile(`${DIR}/rulePostRep.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"aba"},
            {"text":"avad"},
            {"text":"avaad"},
        ]);
    });

    describe('Replace with a repetition in pre context', function() {
        const project = sheetFromFile(`${DIR}/rulePreContextRep.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"aba"},
            {"text":"dava"},
            {"text":"daava"},
        ]);
    });

    describe('Replace with a repetition in post context', function() {
        const project = sheetFromFile(`${DIR}/rulePostContextRep.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"aba"},
            {"text":"avad"},
            {"text":"avaad"},
        ]);
    });


    // word boundary-sensitive rule tests
    describe('Replace at beginning', function() {
        const project = sheetFromFile(`${DIR}/ruleBegins.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"a"},
            {"text":"v"},
            {"text":"ab"},
            {"text":"va"},
            {"text":"aba"}
        ]);
    });

    describe('Replace at end', function() {
        const project = sheetFromFile(`${DIR}/ruleEnds.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"a"},
            {"text":"v"},
            {"text":"av"},
            {"text":"ba"},
            {"text":"aba"}
        ]);
    });

    describe('Replace at beginning and end', function() {
        const project = sheetFromFile(`${DIR}/ruleBeginsEnds.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"a"},
            {"text":"v"},
            {"text":"ab"},
            {"text":"ba"},
            {"text":"aba"}
        ]);
    });
    
    describe('Replace with unnamed param', function() {
        const project = sheetFromFile(`${DIR}/replaceWithUnnamedParam.csv`);
        testErrors(project, [
            ["replaceWithUnnamedParam",12,4,"error"],
            ["replaceWithUnnamedParam",12,1,"warning"]
        ]);        
        testGrammar(project, [
            {"text":"foo", "gloss":"run.3SG"},
            {"text":"foobaz", "gloss":"run-2SG"},
            {"text":"foobar", "gloss":"run-1SG"},
            {"text":"moo", "gloss":"jump.3SG"},
            {"text":"moobaz", "gloss":"jump-2SG"},
            {"text":"moobar", "gloss":"jump-1SG"}
        ]);
    });

    describe('Replace with invalid param', function() {
        const project = sheetFromFile(`${DIR}/replaceWithInvalidParam.csv`);
        testErrors(project, [
            ["replaceWithInvalidParam",12,4,"error"],
            ["replaceWithInvalidParam",12,1,"warning"]
        ]);
        testGrammar(project, [
            {"text":"foo", "gloss":"run.3SG"},
            {"text":"foobaz", "gloss":"run-2SG"},
            {"text":"foobar", "gloss":"run-1SG"},
            {"text":"moo", "gloss":"jump.3SG"},
            {"text":"moobaz", "gloss":"jump-2SG"},
            {"text":"moobar", "gloss":"jump-1SG"}
        ]);
    });

    describe('Replace with no sibling', function() {
        const project = sheetFromFile(`${DIR}/replaceWithNoSibling.csv`);
        testErrors(project, [
            ["replaceWithNoSibling",0,1,"error"],
            ["replaceWithNoSibling",0,0,"warning"]
        ]);        
        testGrammar(project, [{}]);
    });
    
    describe('Replace with no sibling bare', function() {
        const project = sheetFromFile(`${DIR}/replaceWithNoSiblingBare.csv`);
        testErrors(project, [
            ["replaceWithNoSiblingBare",0,0,"error"],
            ["replaceWithNoSiblingBare",0,0,"warning"]
        ]);        
        testGrammar(project, [{}]);
    });

    describe('Replace with no child', function() {
        const project = sheetFromFile(`${DIR}/replaceWithNoChild.csv`);
        testErrors(project, [
            ["replaceWithNoChild",3,1,"error"]
        ]);        
        testGrammar(project, [
            {"text":"aba"}
        ]);
    });

    describe('Replace with missing "from" param', function() {
        const project = sheetFromFile(`${DIR}/replaceWithMissingFrom.csv`);
        testErrors(project, [
            ["replaceWithMissingFrom",12,1,"error"]
        ]);        
        testGrammar(project, [
            {"text":"foo", "gloss":"run.3SG"},
            {"text":"foobaz", "gloss":"run-2SG"},
            {"text":"foobar", "gloss":"run-1SG"},
            {"text":"moo", "gloss":"jump.3SG"},
            {"text":"moobaz", "gloss":"jump-2SG"},
            {"text":"moobar", "gloss":"jump-1SG"}
        ]);
    });

    describe('Replace with missing "to" param', function() {
        const project = sheetFromFile(`${DIR}/replaceWithMissingTo.csv`);
        testErrors(project, [
            ["replaceWithMissingTo",12,1,"error"]
        ]);        
        testGrammar(project, [
            {"text":"foo", "gloss":"run.3SG"},
            {"text":"foobaz", "gloss":"run-2SG"},
            {"text":"foobar", "gloss":"run-1SG"},
            {"text":"moo", "gloss":"jump.3SG"},
            {"text":"moobaz", "gloss":"jump-2SG"},
            {"text":"moobar", "gloss":"jump-1SG"}
        ]);
    });

    describe('Rule with an empty to', function() {
        const project = sheetFromFile(
            `${DIR}/blankTo.csv`);
        testHasVocab(project, {text: 2})
        testErrors(project, []);
        testGrammar(project, [
            {"text":"aa"}
        ]);
    });

    describe('Shortening rule', function() {
        const project = sheetFromFile(`${DIR}/shorteningRule.csv`);
        testHasVocab(project, {text: 2})
        testErrors(project, []);
        testGrammar(project, [
            {"text":"aba"}
        ]);
    });

    describe('Shortening rule long', function() {
        const project = sheetFromFile(`${DIR}/shorteningRuleLong.csv`);
        testHasVocab(project, {text: 2})
        testErrors(project, []);
        testGrammar(project, [
            {"text":"aba"}
        ]);
    });
    
    describe('Shortening rule empty to', function() {
        const project = sheetFromFile(`${DIR}/shorteningRuleEmptyTo.csv`);
        testHasVocab(project, {text: 2})
        testErrors(project, []);
        testGrammar(project, [
            {"text":"aa"}
        ]);
    });

    describe('Rule with an empty from', function() {
        const project = sheetFromFile(`${DIR}/blankFrom.csv`);
        testHasVocab(project, {text: 3})
        testErrors(project, [
            ["blankFrom",3,1,"warning"]
        ]);
        testGrammar(project, []);
    }); 

    describe('Rule with an empty from, with pre and post', function() {
        const project = sheetFromFile(`${DIR}/blankFromPrePost.csv`);
        testHasVocab(project, {text: 3})
        testErrors(project, []);
        testGrammar(project, [
            {"text":"abca"},
        ]);
    });

    describe('Rule cascade with an empty to', function() {
        const project = sheetFromFile(
            `${DIR}/cascadeBlankTo.csv`);
        testHasVocab(project, {text: 5})
        testErrors(project, []);
        testGrammar(project, [
            {"text":"BC"}
        ]);
    });

    describe('Replace with a symbol in regex in from', function() {
        const project = sheetFromFile(`${DIR}/replaceFromRegexEmbed.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"}
        ]);
    });

    describe('Replace with a symbol in regex in from, but the symbol is defined after', function() {
        const project = sheetFromFile(`${DIR}/replaceFromRegexEmbedAfter.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"}
        ]);
    });
    
    describe('Replace with a symbol in regex in pre', function() {
        const project = sheetFromFile(`${DIR}/replacePreRegexEmbed.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"},
            {"text":"arba"},
            {"text":"iva"}
        ]);
    });

    describe('Replace with a symbol in regex in pre, but the symbol is defined after', function() {
        const project = sheetFromFile(`${DIR}/replacePreRegexEmbedAfter.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"},
            {"text":"arba"},
            {"text":"iva"}
        ]);
    });
    
    describe('Replace with a symbol in regex in post', function() {
        const project = sheetFromFile(`${DIR}/replacePostRegexEmbed.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"},
            {"text":"abra"},
            {"text":"avi"}
        ]);
    });

    describe('Replace with a symbol in regex in post, but the symbol is defined after', function() {
        const project = sheetFromFile(`${DIR}/replacePostRegexEmbedAfter.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"},
            {"text":"abra"},
            {"text":"avi"}
        ]);
    });
    
    describe('Replace with a multi-tape symbol in regex in post', function() {
        const project = sheetFromFile(`${DIR}/replacePostRegexMultiTape.csv`);
        testErrors(project, [
            ["replacePostRegexMultiTape",10,4,"error"]
        ]);
        testGrammar(project, [
            {"text":"ava"},
            {"text":"avra"},
            {"text":"avi"}
        ]);
    });

    describe('Replace with a table: op nested underneath', function() {
        const project = sheetFromFile(`${DIR}/replaceWithTableOp.csv`);
        testErrors(project, [
            ["replaceWithTableOp",12,1,"error"]
        ]);
        testGrammar(project, [
            {"text":"foo", "gloss":"run.3SG"},
            {"text":"foobaz", "gloss":"run-2SG"},
            {"text":"foobar", "gloss":"run-1SG"},
            {"text":"moo", "gloss":"jump.3SG"},
            {"text":"moobaz", "gloss":"jump-2SG"},
            {"text":"moobar", "gloss":"jump-1SG"}
        ]);
    });
    
    describe('Replace with a test: op nested underneath', function() {
        const project = sheetFromFile(`${DIR}/replaceWithTestOp.csv`);
        testErrors(project, [
            ["replaceWithTestOp", 12, 2, "error"],
            ["replaceWithTestOp",12,1,"warning"]
        ]);
        testGrammar(project, [
            {"text":"foo", "gloss":"run.3SG"},
            {"text":"foobaz", "gloss":"run-2SG"},
            {"text":"foobar", "gloss":"run-1SG"},
            {"text":"moo", "gloss":"jump.3SG"},
            {"text":"moobaz", "gloss":"jump-2SG"},
            {"text":"moobar", "gloss":"jump-1SG"}
        ]);
    });
});