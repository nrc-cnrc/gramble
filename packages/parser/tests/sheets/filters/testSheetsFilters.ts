import { testGramble, testErrors, sheetFromFile } from "../../testUtils";
import * as path from 'path';

const DIR = `${path.dirname(module.filename)}/csvs`;

describe(`${path.basename(module.filename)}`, function() {

    describe('Simple equals', function() {
        const project = sheetFromFile(`${DIR}/simpleEquals.csv`);
        testErrors(project, []);
        testGramble(project, [
            { pos:"v", text:"goo"},
            { pos:"v", text:"foo"}
        ]);
    });

    describe('Equals with an empty-string condition', function() {
        const project = sheetFromFile(`${DIR}/equalsEmptyString.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text:"mooba", gloss:"jump"},
            { text:"fooba", gloss:"run"},
        ]);
    });

    describe('Equals with an ill-formed filter', function() {
        const project = sheetFromFile(`${DIR}/illFormedFilter.csv`);
        testErrors(project, [
            ["illFormedFilter", 7, 3, "error"]
        ]);
        testGramble(project, [
            { text:"goo", pos:"v"},
            { text:"moo", pos:"n"},
            { text:"foo", pos:"v"}
        ]);
    });

    describe('Equals to the left of a sequence', function() {
        const project = sheetFromFile(`${DIR}/equalsGrammar.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" }
        ]);
    });

    describe('Equals containing escaped parens', function() {
        const project = sheetFromFile(`${DIR}/equalsWithEscapes.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foobaz", gloss: "run(2SG)", subj: "(2SG)" },
            { text: "moobaz", gloss: "jump(2SG)", subj: "(2SG)" }
        ]);
    });

    describe('Nested equals', function() {
        const project = sheetFromFile(`${DIR}/nestedEquals.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]", trans: "INTR" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]", trans: "INTR" }
        ]);
    });
    
    describe('Equals with alt value', function() {
        const project = sheetFromFile(`${DIR}/equalsOr.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" },
            { text: "foo", gloss: "run[3SG]", subj: "[3SG]" },
            { text: "moo", gloss: "jump[3SG]", subj: "[3SG]" }
        ]);
    });

    describe('Equals with an alt and empty-string', function() {
        const project = sheetFromFile(`${DIR}/equalsOrEmptyString.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" },
            { text:"mooba", gloss:"jump"},
            { text:"fooba", gloss:"run"},
        ]);
    });

    describe('Equals with a sequence', function() {
        const project = sheetFromFile(`${DIR}/equalsSeq.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" }
        ]);
    });
    
    describe('Equals with a sequence with alt', function() {
        const project = sheetFromFile(`${DIR}/equalsSeqOr.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text:"moobar", gloss:"jump[1SG]", subj:"[1SG]"},
            { text:"moobaz", gloss:"jump[2SG]", subj:"[2SG]"},
            { text:"foobar", gloss:"run[1SG]", subj:"[1SG]"},
            { text:"foobaz", gloss:"run[2SG]", subj:"[2SG]"}
        ]);
    });

    describe('Equals with a sequence with not', function() {
        const project = sheetFromFile(`${DIR}/equalsSeqNot.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text:"moobar", gloss:"jump[1SG]", subj:"[1SG]"},
            { text:"moobaz", gloss:"jump[2SG]", subj:"[2SG]"},
            { text:"foobar", gloss:"run[1SG]", subj:"[1SG]"},
            { text:"foobaz", gloss:"run[2SG]", subj:"[2SG]"}
        ]);
    });

    describe('Equals embed', function() {
        const project = sheetFromFile(`${DIR}/equalsEmbed.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" },
            { text: "foo", gloss: "run[3SG]", subj: "[3SG]" },
            { text: "moo", gloss: "jump[3SG]", subj: "[3SG]" }
        ]);
    });
    
    describe('Equals embed where the symbol is defined later', function() {
        const project = sheetFromFile(`${DIR}/equalsEmbedAfter.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" },
            { text: "foo", gloss: "run[3SG]", subj: "[3SG]" },
            { text: "moo", gloss: "jump[3SG]", subj: "[3SG]" }
            ], 
            "equalsEmbedAfter.word"
        );
    });
    
    describe('Equals with not value', function() {
        const project = sheetFromFile(`${DIR}/equalsNot.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" },
            { text: "foo", gloss: "run[3SG]", subj: "[3SG]" },
            { text: "moo", gloss: "jump[3SG]", subj: "[3SG]" }
        ]);
    });

    describe('Equals with neither value', function() {
        const project = sheetFromFile(`${DIR}/equalsNotOr.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" }
        ]);
    });

    describe('Equals with not embed', function() {
        const project = sheetFromFile(`${DIR}/equalsNegatedEmbed.csv`);
        testErrors(project, []);
        testGramble(project, [
            {gloss: "run[1SG]", subj: "[1SG]", text: "foobar"},
            {gloss: "jump[1SG]", subj: "[1SG]", text: "moobar"}
        ]);
    });

    describe('Equals with a slash header', function() {
        const project = sheetFromFile(`${DIR}/equalsSlash.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text:"foo", pos:"v", class:"v"}
        ]);
    });
    
    describe('Equals with a slash header and an alt value', function() {
        // the alt scopes over the slash, which ends up ruling out
        // the line where pos=v and class=n.  i'm not sure this is 
        // the correct scope for this, intuitively, but this is a 
        // weird thing to try anyway so it's not a priority.  this is 
        // really more to test whether it works at all.
        const project = sheetFromFile(`${DIR}/equalsSlashOr.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text:"moo", pos:"n", class:"n"},
            { text:"foo", pos:"v", class:"v"}
        ]);
    });

    describe('startswith', function() {
        const project = sheetFromFile(`${DIR}/startsWithGrammar.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "umfoo", gloss: "[1SG]run" },
            { text: "ungoo", gloss: "[1SG]climb" }
        ]);
    });

    describe('startswith empty string', function() {
        const project = sheetFromFile(`${DIR}/startsWithEmptyString.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "unfoo", gloss: "[1SG]run" },
            { text: "ungoo", gloss: "[1SG]climb" }
        ]);
    });
    
    
    describe('startswith with alt value', function() {
        const project = sheetFromFile(`${DIR}/startsWithOr.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "umfoo", gloss: "[1SG]run" },
            { text: "ummoo", gloss: "[1SG]jump" },
            { text: "ungoo", gloss: "[1SG]climb" }
        ]);
    });
    
    describe('startswith with not value', function() {
        const project = sheetFromFile(`${DIR}/startsWithNot.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "umfoo", gloss: "[1SG]run" },
            { text: "ummoo", gloss: "[1SG]jump" },
            { text: "ungoo", gloss: "[1SG]climb" }
        ]);
    });

    describe('startswith embed', function() {
        const project = sheetFromFile(`${DIR}/startsWithEmbed.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "umfoo", gloss: "[1SG]run" },
            { text: "ummoo", gloss: "[1SG]jump" },
            { text: "ungoo", gloss: "[1SG]climb" }
        ]);
    });

    describe('startswith embed where the symbol is defined later', function() {
        const project = sheetFromFile(`${DIR}/startsWithEmbedAfter.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "umfoo", gloss: "[1SG]run" },
            { text: "ummoo", gloss: "[1SG]jump" },
            { text: "ungoo", gloss: "[1SG]climb" }
        ], 
        "startsWithEmbedAfter.word");
    });

    describe('startswith negated embed', function() {
        const project = sheetFromFile(`${DIR}/startsWithNegatedEmbed.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "umfoo", gloss: "[1SG]run" },
            { text: "ummoo", gloss: "[1SG]jump" },
            { text: "ungoo", gloss: "[1SG]climb" }
        ]);
    });

    describe('startswith and equals modifying same embed', function() {
        const project = sheetFromFile(`${DIR}/startsWithEquals.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "umfoo", gloss: "[1SG]run", trans: "[INTR]" },
            { text: "ungoo", gloss: "[1SG]climb", trans: "[INTR]" },
            { text: "moo", gloss: "[1SG]see", trans: "[TR]" }
        ]);
    });

    describe('equals and startswith modifying same embed', function() {
        const project = sheetFromFile(`${DIR}/equalsStartsWith.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "umfoo", gloss: "[1SG]run", trans: "[INTR]" },
            { text: "ungoo", gloss: "[1SG]climb", trans: "[INTR]" },
            { text: "moo", gloss: "[1SG]see", trans: "[TR]" },
        ]);
    });
    
    describe('endswith', function() {
        const project = sheetFromFile(`${DIR}/endsWithGrammar.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foobarq", gloss: "run[1SG]" },
            { text: "foobazk", gloss: "jump[1SG]" }
        ]);
    });

    describe('endswith empty string', function() {
        const project = sheetFromFile(`${DIR}/endsWithEmptyString.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foobarq", gloss: "run[1SG]" },
            { text: "foobazq", gloss: "jump[1SG]" }
        ]);
    });

    describe('endswith with alt value', function() {
        const project = sheetFromFile(`${DIR}/endsWithOr.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foobarq", gloss: "run[1SG]" },
            { text: "foobazk", gloss: "jump[1SG]" },
            { text: "foobask", gloss: "climb[1SG]" }
        ]);
    });

    describe('endswith with not value', function() {
        const project = sheetFromFile(`${DIR}/endsWithNot.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foobarq", gloss: "run[1SG]" },
            { text: "foobazk", gloss: "jump[1SG]" },
            { text: "foobask", gloss: "climb[1SG]" }
        ]);
    });

    describe('endswith embed', function() {
        const project = sheetFromFile(`${DIR}/endsWithEmbed.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foobarq", gloss: "run[1SG]" },
            { text: "foobazk", gloss: "jump[1SG]" },
            { text: "foobask", gloss: "climb[1SG]" }
        ]);
    });

    describe('endswith embed where the symbol is defined later', function() {
        const project = sheetFromFile(`${DIR}/endsWithEmbedAfter.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foobarq", gloss: "run[1SG]" },
            { text: "foobazk", gloss: "jump[1SG]" },
            { text: "foobask", gloss: "climb[1SG]" }
        ], 
        "endsWithEmbedAfter.word");
    });

    describe('endswith negated embed', function() {
        const project = sheetFromFile(`${DIR}/endsWithEmbedNot.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foobar", gloss: "run[1SG]" },
            { text: "foobor", gloss: "jump[1SG]" },
            { text: "foobaru", gloss: "climb[1SG]" }
        ]);
    });
    
    describe('endswith complex embed', function() {
        const project = sheetFromFile(`${DIR}/endsWithComplexEmbed.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foobar", gloss: "run[1SG]" },
            { text: "foobor", gloss: "jump[1SG]" },
            { text: "foobart", gloss: "climb[1SG]" },
            { text: "foobatu", gloss: "eat[1SG]" }
        ]);
    });

    describe('endswith and equals modifying same embed', function() {
        const project = sheetFromFile(`${DIR}/endsWithEquals.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foobarq", gloss: "run[1SG]", trans: "INTR" },
            { text: "foobazk", gloss: "jump[1SG]", trans: "INTR" },
            { text: "foobas", gloss: "see[1SG]", trans: "TR" }
        ]);
    });
    
    describe('equals and endswith modifying same embed', function() {
        const project = sheetFromFile(`${DIR}/equalsEndsWith.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foobarq", gloss: "run[1SG]", trans: "INTR" },
            { text: "foobazk", gloss: "jump[1SG]", trans: "INTR" },
            { text: "foobas", gloss: "see[1SG]", trans: "TR" }
        ]);
    });

    describe('startswith and endswith modifying same embed', function() {
        const project = sheetFromFile(`${DIR}/startsWithEndsWith.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "umfooz", gloss: "[1SG]jump" }
        ]);
    });
    
    describe('Contains', function() {
        const project = sheetFromFile(`${DIR}/containsGrammar.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foobaz", gloss: "run[2SG.SUBJ]", subj: "[2SG.SUBJ]" },
            { text: "moobaz", gloss: "jump[2SG.SUBJ]", subj: "[2SG.SUBJ]" }
        ]);
    });

    describe('Contains empty string', function() {
        const project = sheetFromFile(`${DIR}/containsEmptyString.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text:"moobaz", gloss:"jump[2SG.SUBJ]", subj:"[2SG.SUBJ]"},
            { text:"moobar", gloss:"jump[1SG.SUBJ]", subj:"[1SG.SUBJ]"},
            { text:"foobaz", gloss:"run[2SG.SUBJ]", subj:"[2SG.SUBJ]"},
            { text:"foobar", gloss:"run[1SG.SUBJ]", subj:"[1SG.SUBJ]"}
        ]);
    });

    describe('Contains with alt value', function() {
        const project = sheetFromFile(`${DIR}/containsOr.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foobaz", gloss: "run[2SG.SUBJ]", subj: "[2SG.SUBJ]" },
            { text: "moobaz", gloss: "jump[2SG.SUBJ]", subj: "[2SG.SUBJ]" },
            { text: "foo", gloss: "run[3SG.SUBJ]", subj: "[3SG.SUBJ]" },
            { text: "moo", gloss: "jump[3SG.SUBJ]", subj: "[3SG.SUBJ]" }
        ]);
    });

    describe('Contains with not value', function() {
        const project = sheetFromFile(`${DIR}/containsNot.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foobaz", gloss: "run[2SG.SUBJ]", subj: "[2SG.SUBJ]" },
            { text: "moobaz", gloss: "jump[2SG.SUBJ]", subj: "[2SG.SUBJ]" },
            { text: "foo", gloss: "run[3SG.SUBJ]", subj: "[3SG.SUBJ]" },
            { text: "moo", gloss: "jump[3SG.SUBJ]", subj: "[3SG.SUBJ]" }
        ]);
    }); 

    describe('Contains with embed', function() {
        const project = sheetFromFile(`${DIR}/containsEmbed.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foobaz", gloss: "run[2SG.SUBJ]", subj: "[2SG.SUBJ]" },
            { text: "moobaz", gloss: "jump[2SG.SUBJ]", subj: "[2SG.SUBJ]" },
            { text: "foo", gloss: "run[3SG.SUBJ]", subj: "[3SG.SUBJ]" },
            { text: "moo", gloss: "jump[3SG.SUBJ]", subj: "[3SG.SUBJ]" }
        ]);
    });

    describe('Contains where the condition is defined after', function() {
        const project = sheetFromFile(`${DIR}/containsEmbedAfter.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foobaz", gloss: "run[2SG.SUBJ]", subj: "[2SG.SUBJ]" },
            { text: "moobaz", gloss: "jump[2SG.SUBJ]", subj: "[2SG.SUBJ]" },
            { text: "foo", gloss: "run[3SG.SUBJ]", subj: "[3SG.SUBJ]" },
            { text: "moo", gloss: "jump[3SG.SUBJ]", subj: "[3SG.SUBJ]" }
        ],
        "containsEmbedAfter.word");
    });

    describe('Contains with negated embed', function() {
        const project = sheetFromFile(`${DIR}/containsNegatedEmbed.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foobar", gloss: "run[1SG.SUBJ]", subj: "[1SG.SUBJ]" },
            { text: "moobar", gloss: "jump[1SG.SUBJ]", subj: "[1SG.SUBJ]" },
        ]);
    });

});


