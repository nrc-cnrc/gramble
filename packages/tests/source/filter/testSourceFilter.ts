import { VERBOSE_DEBUG } from "@gramble/interpreter";
import {
    testSource, SourceTest, 
    Error, Warning 
} from "../testSourceUtil.js";

const DIR = "filter";

function testSrc(params: Partial<SourceTest>): void {
    testSource({dir: DIR, ...params});
}

describe(`Source ${DIR}`, function() {

    testSrc({
		desc: '1. Simple equals',
        results: [
            {pos: "v", text: "goo"},
            {pos: "v", text: "foo"}
        ]
    });

    testSrc({
		desc: '2. Equals with an empty-string condition',
        results: [
            {text: "mooba", gloss: "jump"},
            {text: "fooba", gloss: "run"},
        ]
    });

    testSrc({
		desc: '4. Equals to the left of a sequence',
        results: [
            {text: "foobaz", gloss: "run[2SG]", subj: "[2SG]"},
            {text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]"}
        ]
    });
    
    testSrc({
		desc: '5. Equals containing escaped parens',
        results: [
            {text: "foobaz", gloss: "run(2SG)", subj: "(2SG)"},
            {text: "moobaz", gloss: "jump(2SG)", subj: "(2SG)"}
        ]
    });

    testSrc({
		desc: '6. Nested equals',
        results: [
            {text: "foobaz", gloss: "run[2SG]", subj: "[2SG]", trans: "INTR"},
            {text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]", trans: "INTR"}
        ]
    });
    
    testSrc({
		desc: '7. Equals with alt value',
        results: [
            {text: "foobaz", gloss: "run[2SG]", subj: "[2SG]"},
            {text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]"},
            {text: "foo", gloss: "run[3SG]", subj: "[3SG]"},
            {text: "moo", gloss: "jump[3SG]", subj: "[3SG]"}
        ]
    });

    testSrc({
		desc: '8. Equals with an alt and empty-string',
        results: [
            {text: "foobaz", gloss: "run[2SG]", subj: "[2SG]"},
            {text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]"},
            {text: "mooba", gloss: "jump"},
            {text: "fooba", gloss: "run"}
        ]
    });

    testSrc({
		desc: '9. Equals with a sequence',
        results: [
            {text: "foobaz", gloss: "run[2SG]", subj: "[2SG]"},
            {text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]"}
        ]
    });

    testSrc({
		desc: '10. Equals with a sequence with alt',
        results: [
            {text: "moobar", gloss: "jump[1SG]", subj: "[1SG]"},
            {text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]"},
            {text: "foobar", gloss: "run[1SG]", subj: "[1SG]"},
            {text: "foobaz", gloss: "run[2SG]", subj: "[2SG]"}
        ]
    });


    testSrc({
		desc: '11. Equals with a sequence with not',
        results: [
            {text: "moobar", gloss: "jump[1SG]", subj: "[1SG]"},
            {text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]"},
            {text: "foobar", gloss: "run[1SG]", subj: "[1SG]"},
            {text: "foobaz", gloss: "run[2SG]", subj: "[2SG]"}
        ]
    });

    testSrc({
		desc: '12. Equals with a repetition',
        results: [
            {gloss: "be"},
            {text: "foo", gloss: "run"},
            {text: "foofoo", gloss: "run.impf"}
        ]
    });

    testSrc({
		desc: '13. Equals with a sequence with repetition',
        results: [
            {text: "bar", gloss: "be"},
            {text: "foobar", gloss: "run"},
            {text: "foofoobar", gloss: "run.impf"}
        ]
    });


    testSrc({
		desc: '14. Equals with a question',
        results: [
            {gloss: "be"},
            {text: "foo", gloss: "run"},
        ]
    });
    

    testSrc({
		desc: '15. Equals with a sequence with question',
        results: [
            {text: "bar", gloss: "be"},
            {text: "foobar", gloss: "run"},
        ]
    });

    
    testSrc({
		desc: '16. Equals with a plus',
        results: [
            {text: "foo", gloss: "run"},
            {text: "foofoo", gloss: "run.impf"}
        ]
    });


    testSrc({
		desc: '17. Equals with a sequence with plus',
        results: [
            {text: "foobar", gloss: "run"},
            {text: "foofoobar", gloss: "run.impf"}
        ]
    });
    
    testSrc({
		desc: '18. Equals with not value',
        results: [
            {text: "foobaz", gloss: "run[2SG]", subj: "[2SG]"},
            {text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]"},
            {text: "foo", gloss: "run[3SG]", subj: "[3SG]"},
            {text: "moo", gloss: "jump[3SG]", subj: "[3SG]"}
        ]
    });

    testSrc({
		desc: '19. Equals with escaped ~',
        results: [
            {gloss: "jump~[1SG]", text: "moobap", subj: "~[1SG]"},
            {gloss: "run~[1SG]",  text: "foobap", subj: "~[1SG]"}
        ]
    });

    testSrc({
		desc: '20. Equals with neither value',
        results: [
            {text: "foobaz", gloss: "run[2SG]", subj: "[2SG]"},
            {text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]"}
        ]
    });

    testSrc({
		desc: '21. Equals with a slash header',
        results: [
            {text: "goo", pos: "v", class: "n"},
            {text: "moo", pos: "n", class: "n"},
            {text: "foo", pos: "v", class: "v"}
        ],
        errors: [
            Error(6, 3, "Equals requires an ordinary header"),
            Warning(7,3)
        ]
    });

    testSrc({
		desc: '22. Equals with dot',
        results: [
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "eat"},
            {text: "goo", gloss: "jump"},
        ]
    });

    testSrc({
		desc: '23. Equals with dot in parens',
        results: [
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "eat"},
            {text: "goo", gloss: "jump"},
        ]
    });

    testSrc({
		desc: '24. Equals with dot star',
        results: [
            {text: "foo", gloss: "run"},
            {text: "foofoo", gloss: "run.impf"},
        ]
    });

    testSrc({
		desc: '25. Equals embed',
        results: [
            {text: "foobaz", gloss: "run[2SG]", subj: "[2SG]"},
            {text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]"},
            {text: "foo", gloss: "run[3SG]", subj: "[3SG]"},
            {text: "moo", gloss: "jump[3SG]", subj: "[3SG]"}
        ]
    });

    testSrc({
		desc: '26. Equals embed with a join',
        results: [
            {gloss: "[3SG]", subj: "[3SG]"},
            {text: "baz", gloss: "[2SG]", subj: "[2SG]"},
            {text: "bar", gloss: "[1SG]", subj: "[1SG]"}
        ],
        errors: [
            Error(13, 3, "Embedding multi-field symbol in regex/rule")
        ]
    });

    testSrc({
		desc: '27. Equals embed where the symbol is defined later',
        results: [
            {text: "foobask", gloss: "climb[1SG]"},
            {text: "foobazk", gloss: "jump[1SG]"},
            {text: "foobarq", gloss: "run[1SG]"}
        ]
    });

    testSrc({
		desc: '28. Equals with not embed',
        results: [
            {gloss: "run[1SG]", subj: "[1SG]", text: "foobar"},
            {gloss: "jump[1SG]", subj: "[1SG]", text: "moobar"}
        ]
    });

    testSrc({
		desc: '29. starts',
        results: [
            {text: "umfoo", gloss: "[1SG]run"},
            {text: "ungoo", gloss: "[1SG]climb"}
        ]
    });

    testSrc({
		desc: '30. starts empty string',
        results: [
            {text: "unfoo", gloss: "[1SG]run"},
            {text: "ungoo", gloss: "[1SG]climb"}  
        ]
    });
    
    testSrc({
		desc: '31. starts with alt value',
        results: [
            {text: "umfoo", gloss: "[1SG]run"},
            {text: "ummoo", gloss: "[1SG]jump"},
            {text: "ungoo", gloss: "[1SG]climb"}  
        ]
    });
    
    testSrc({
		desc: '32. starts with not value',
        results: [
            {text: "umfoo", gloss: "[1SG]run"},
            {text: "ummoo", gloss: "[1SG]jump"},
            {text: "ungoo", gloss: "[1SG]climb"}
        ]
    });

    testSrc({
		desc: '33. starts with not value, embedded',
        results: [
            {text: "umfoo", gloss: "[1SG]run"},
            {text: "ummoo", gloss: "[1SG]jump"},
            {text: "ungoo", gloss: "[1SG]climb"}
        ]
    });

    testSrc({
		desc: '34. starts and equals modifying same embed',
        results: [
            {text: "umfoo", gloss: "[1SG]run", trans: "[INTR]"},
            {text: "ungoo", gloss: "[1SG]climb", trans: "[INTR]"},
            {text: "moo", gloss: "[1SG]see", trans: "[TR]"} 
        ]
    });
    
    testSrc({
		desc: '35. starts embed',
        results: [
            {text: "umfoo", gloss: "[1SG]run"},
            {text: "ummoo", gloss: "[1SG]jump"},
            {text: "ungoo", gloss: "[1SG]climb"}
        ]
    });

    testSrc({
		desc: '36. starts embed where the symbol is defined later',
        results: [
            {text: "umfoo", gloss: "[1SG]run"},
            {text: "ummoo", gloss: "[1SG]jump"},
            {text: "ungoo", gloss: "[1SG]climb"}        
        ]
    });

    testSrc({
		desc: '37. starts negated embed',
        results: [
            {text: "umfoo", gloss: "[1SG]run"},
            {text: "ummoo", gloss: "[1SG]jump"},
            {text: "ungoo", gloss: "[1SG]climb"}   
        ]
    });
    
    testSrc({
		desc: '38. starts embed with a hidden join',
        results: [
            {text: "umgoo", gloss: "[1SG]climb"},
            {text: "ummoo", gloss: "[1SG]jump"},
            {text: "umfoo", gloss: "[1SG]run"} 
        ],
        errors: [
            Error(15, 4, "Embedding multi-field symbol in regex/rule")
        ]
    });
   
    testSrc({
		desc: '39. equals and starts modifying same embed',
        results: [
            {text: "umfoo", gloss: "[1SG]run", trans: "[INTR]"},
            {text: "ungoo", gloss: "[1SG]climb", trans: "[INTR]"},
            {text: "moo", gloss: "[1SG]see", trans: "[TR]"},
        ]
    });
    
    testSrc({
		desc: '40. ends',
        results: [
            {text: "foobarq", gloss: "run[1SG]"},
            {text: "foobazk", gloss: "jump[1SG]"}        
        ]
    });

    testSrc({
		desc: '41. ends empty string',
        results: [
            {text: "foobarq", gloss: "run[1SG]"},
            {text: "foobazq", gloss: "jump[1SG]"}
        ]
    });

    testSrc({
		desc: '42. ends with alt value',
        results: [
            {text: "foobarq", gloss: "run[1SG]"},
            {text: "foobazk", gloss: "jump[1SG]"},
            {text: "foobask", gloss: "climb[1SG]"}           
        ]
    });

    testSrc({
		desc: '43. ends with not value',
        results: [
            {text: "foobarq", gloss: "run[1SG]"},
            {text: "foobazk", gloss: "jump[1SG]"},
            {text: "foobask", gloss: "climb[1SG]"}      
        ]
    });

    testSrc({
		desc: '44. ends and equals modifying same embed',
        results: [
            {text: "foobarq", gloss: "run[1SG]", trans: "INTR"},
            {text: "foobazk", gloss: "jump[1SG]", trans: "INTR"},
            {text: "foobas", gloss: "see[1SG]", trans: "TR"}      
        ]
    });
    
    testSrc({
		desc: '45. equals and ends modifying same embed',
        results: [
            {text: "foobarq", gloss: "run[1SG]", trans: "INTR"},
            {text: "foobazk", gloss: "jump[1SG]", trans: "INTR"},
            {text: "foobas", gloss: "see[1SG]", trans: "TR"}       
        ]
    });

    testSrc({
		desc: '46. starts and ends modifying same embed',
        results: [
            {text: "umfooz", gloss: "[1SG]jump"}
        ]
    });

    testSrc({
		desc: '47. ends embed',
        results: [
            {text: "foobarq", gloss: "run[1SG]"},
            {text: "foobazk", gloss: "jump[1SG]"},
            {text: "foobask", gloss: "climb[1SG]"}
        ]
    });

    testSrc({
		desc: '48. ends embed where the symbol is defined later',
        results: [
            {text: "foobarq", gloss: "run[1SG]"},
            {text: "foobazk", gloss: "jump[1SG]"},
            {text: "foobask", gloss: "climb[1SG]"}           
        ]
    });

    testSrc({
		desc: '49. ends negated embed',
        results: [
            {text: "foobar", gloss: "run[1SG]"},
            {text: "foobor", gloss: "jump[1SG]"},
            {text: "foobaru", gloss: "climb[1SG]"}     
        ]
    });

    testSrc({
		desc: '50. ends complex embed',
        results: [
            {text: "foobar", gloss: "run[1SG]"},
            {text: "foobor", gloss: "jump[1SG]"},
            {text: "foobart", gloss: "climb[1SG]"},
            {text: "foobatu", gloss: "eat[1SG]"}      
        ]
    });
    
    testSrc({
		desc: '51. Contains',
        results: [
            {text: "foobaz", gloss: "run[2SG.SUBJ]", subj: "[2SG.SUBJ]"},
            {text: "moobaz", gloss: "jump[2SG.SUBJ]", subj: "[2SG.SUBJ]"}
        ]
    });

    testSrc({
		desc: '52. Contains empty string',
        results: [
            {text: "moobaz", gloss: "jump[2SG.SUBJ]", subj: "[2SG.SUBJ]"},
            {text: "moobar", gloss: "jump[1SG.SUBJ]", subj: "[1SG.SUBJ]"},
            {text: "foobaz", gloss: "run[2SG.SUBJ]", subj: "[2SG.SUBJ]"},
            {text: "foobar", gloss: "run[1SG.SUBJ]", subj: "[1SG.SUBJ]"}
        ]
    });

    testSrc({
		desc: '53. Contains with alt value',
        results: [
            {text: "foobaz", gloss: "run[2SG.SUBJ]", subj: "[2SG.SUBJ]"},
            {text: "moobaz", gloss: "jump[2SG.SUBJ]", subj: "[2SG.SUBJ]"},
            {text: "foo", gloss: "run[3SG.SUBJ]", subj: "[3SG.SUBJ]"},
            {text: "moo", gloss: "jump[3SG.SUBJ]", subj: "[3SG.SUBJ]"}   
        ]
    });
    
    testSrc({
		desc: '54. Contains with embed',
        results: [
            {text: "foobaz", gloss: "run[2SG.SUBJ]", subj: "[2SG.SUBJ]"},
            {text: "moobaz", gloss: "jump[2SG.SUBJ]", subj: "[2SG.SUBJ]"},
            {text: "foo", gloss: "run[3SG.SUBJ]", subj: "[3SG.SUBJ]"},
            {text: "moo", gloss: "jump[3SG.SUBJ]", subj: "[3SG.SUBJ]"}
        ]
    });

    testSrc({
		desc: '55. Contains where the condition is defined after',
        results: [
            {text: "foobaz", gloss: "run[2SG.SUBJ]", subj: "[2SG.SUBJ]"},
            {text: "moobaz", gloss: "jump[2SG.SUBJ]", subj: "[2SG.SUBJ]"},
            {text: "foo", gloss: "run[3SG.SUBJ]", subj: "[3SG.SUBJ]"},
            {text: "moo", gloss: "jump[3SG.SUBJ]", subj: "[3SG.SUBJ]"}
        ]
    });

    testSrc({
		desc: '56. Contains with not value',
        results: [
            {text: "foobaz", gloss: "run[2SG.SUBJ]", subj: "[2SG.SUBJ]"},
            {text: "moobaz", gloss: "jump[2SG.SUBJ]", subj: "[2SG.SUBJ]"},
            {text: "foo", gloss: "run[3SG.SUBJ]", subj: "[3SG.SUBJ]"},
            {text: "moo", gloss: "jump[3SG.SUBJ]", subj: "[3SG.SUBJ]"}
        ]
    });

    testSrc({
		desc: '57. Contains with not embed',
        results: [
            {text: "foobar", gloss: "run[1SG.SUBJ]", subj: "[1SG.SUBJ]"},
            {text: "moobar", gloss: "jump[1SG.SUBJ]", subj: "[1SG.SUBJ]"},
        ]
    });

    testSrc({
		desc: '58a. Starts single-char negation',
        results: [
            {text: "foobar", gloss: "run[1SG.SUBJ]"},
            {text: "goobar", gloss: "climb[1SG.SUBJ]"},
        ]
    });    
    
    testSrc({
		desc: '58b. Ends single-char negation',
        results: [
            {text: "oofbar", gloss: "run[1SG.SUBJ]"},
            {text: "oogbar", gloss: "climb[1SG.SUBJ]"},
        ]
    });    

    testSrc({
		desc: '59a. Starts single-char negation of alt',
        results: [
            {text: "foobar", gloss: "run[1SG.SUBJ]"},
        ]
    });    
    
    testSrc({
		desc: '59b. Ends single-char negation of alt',
        results: [
            {text: "oofbar", gloss: "run[1SG.SUBJ]"},
        ]
    });    

    testSrc({
		desc: '60a. Starts single-char negation',
        results: [
            {text: "foobar", gloss: "run[1SG.SUBJ]"},
            {text: "goobar", gloss: "climb[1SG.SUBJ]"},
        ]
    });    
    
    testSrc({
		desc: '60b. Ends single-char negation',
        results: [
            {text: "oofbar", gloss: "run[1SG.SUBJ]"},
            {text: "oogbar", gloss: "climb[1SG.SUBJ]"},
        ]
    });    

    testSrc({
		desc: '61a. Starts single-char negation of alt, using ^',
        results: [
            {text: "foobar", gloss: "run[1SG.SUBJ]"},
        ]
    });    
    
    testSrc({
		desc: '61b. Ends single-char negation of alt, using ^',
        results: [
            {text: "oofbar", gloss: "run[1SG.SUBJ]"},
        ]
    });    

    testSrc({
        desc: '62a. Starts with a literal, embedded',
        results: [
            {text: "foo"}
        ]    
    });

    testSrc({
        desc: '62b. Starts with an embed, embedded',
        results: [
            {text: "foo"}
        ]    
    });
    
    testSrc({
        desc: '62c. Starts with an embed, not embedded',
        results: [
            {text: "foo"}
        ]    
    });
    
    testSrc({
		desc: 'E1. Equals with an ill-formed filter',
        results: [
            {text: "moo", pos: "n"},
            {text: "goo", pos: "v"},
            {text: "foo", pos: "v"}
        ],
        errors: [
            Error(7, 3, "Error parsing cell: 'v~'")
        ]
    });

    testSrc({
		desc: 'E2. Equals where the filter references a non-existent header',
        results: [
            {text: "goo"},
            {text: "moo"},
            {text: "foo"}
        ],
        errors: [
            Error(7, 3, "Filtering non-existent header 'pos'")
        ],
        // verbose: VERBOSE_DEBUG
    });
    
    testSrc({
		desc: 'E3. Starts with an ill-formed filter',
        results: [
            {text: "goo", pos: "verb"},
            {text: "moo", pos: "noun"},
            {text: "foo", pos: "verb"}
        ],
        errors: [
            Error(7, 3, "Error parsing cell: 'v~'")
        ]
    });
    
    testSrc({
		desc: 'E4. Starts where the filter references a non-existent header',
        results: [
            {text: "goo"},
            {text: "moo"},
            {text: "foo"}
        ],
        errors: [
            Error(7, 3, "Filtering non-existent header 'pos'")
        ],
        verbose: VERBOSE_DEBUG
    });

    testSrc({
		desc: 'E5. Ends with an ill-formed filter',
        results: [
            {text: "goo", pos: "verb"},
            {text: "moo", pos: "noun"},
            {text: "foo", pos: "verb"}
        ],
        errors: [
            Error(7, 3, "Error parsing cell: 'v~'")
        ],
    });
    
    testSrc({
		desc: 'E6. Ends where the filter references a non-existent header',
        results: [
            {text: "goo"},
            {text: "moo"},
            {text: "foo"}
        ],
        errors: [
            Error(7, 3, "Filtering non-existent header 'pos'")
        ]
    });

    testSrc({
		desc: 'E7. Contains with an ill-formed filter',
        results: [
            {text: "goo", pos: "verb"},
            {text: "moo", pos: "noun"},
            {text: "foo", pos: "verb"}
        ],
        errors: [
            Error(7, 3, "Error parsing cell: 'v~'")
        ],
    });
    
    testSrc({
		desc: 'E8. Contains where the filter references a non-existent header',
        results: [
            {text: "goo"},
            {text: "moo"},
            {text: "foo"}
        ],
        errors: [
            Error(7, 3, "Filtering non-existent header 'pos'")
        ]
    });

    testSrc({
		desc: 'E9. Equals with a non-existant symbol',
        results: [
            {}
        ],
        errors: [
            Error(7, 2, "Undefined symbol: 'noun'"),
            Error(7, 3, "Filtering non-existent header 'pos'")
        ]
    });
   
    testSrc({
		desc: 'E10. Nested equals with an unknown symbol',
        results: [
            {}
        ],
        errors: [
            Error(11,2, "Undefined symbol: 'noun'"),
            Error(11,3, "Filtering non-existent header 'subj'"),
            Error(11,4, "Filtering non-existent header 'trans'"),
        ]
    });

    testSrc({
		desc: 'E11. Equals with an embed referring to an erroneous table',
        results: [
            {"gloss":"jump","trans":"INTR"},
            {"gloss":"run","trans":"INTR"}
        ],
        errors: [
            Error(1, 2, "Invalid header: 'text blorp'"),
            Warning(2,2),
            Warning(3,2),
            Warning(4,2),
        ]
    });

    testSrc({
		desc: 'E12. Nested equals with a malformed inner filter',
        results: [
            {"gloss":"jump[2SG]","subj":"[2SG]","text":"moobaz","trans":"INTR"},
            {"gloss":"jump[1SG]","subj":"[1SG]","text":"moobar","trans":"INTR"},
            {"gloss":"run[2SG]","subj":"[2SG]","text":"foobaz","trans":"INTR"},
            {"gloss":"run[1SG]","subj":"[1SG]","text":"foobar","trans":"INTR"}
        ],
        errors: [
            Error(11,3, "Filtering non-existent header 'blorp'")
        ]
    });

    /*
    testSrc({
		desc: 'HighVowel tests 1',
        id: "11",
        results: [
        ]
    });
    function() {
        const project = sheetFromFile(`${DIR}/highVowel1.csv`);
        testErrors(project, []);
        testGenerate(project, [
            {gloss: "[3SG]sing",text: "umurf"},
            {gloss: "[3SG]climb",text: "umirf"},
            {gloss: "[2PL]sing",text: "omurf"},
            {gloss: "[2PL]climb",text: "omirf"},
            {gloss: "[2SG]sing",text: "imurf"},
            {gloss: "[2SG]climb",text: "imirf"},
            {gloss: "[1PL]sing",text: "emurf"},
            {gloss: "[1PL]climb",text: "emirf"},
            {gloss: "[1SG]sing",text: "amurf"},
            {gloss: "[1SG]climb",text: "amirf"}
        ]);
    }); 
    
    testSrc({
		desc: 'HighVowel tests 2',
        id: "11",
        results: [
        ]
    });
    function() {
        const project = sheetFromFile(`${DIR}/highVowel2.csv`);
        testErrors(project, []);
        testGenerate(project, [
            {gloss: "[3SG]sing",text: "umurf"},
            {gloss: "[3SG]climb",text: "umirf"},
            {gloss: "[2SG]sing",text: "imurf"},
            {gloss: "[2SG]climb",text: "imirf"}
        ]);
    }); 

    testSrc({
		desc: 'HighVowel tests 2b',
        id: "11",
        results: [
        ]
    });
    function() {
        const project = sheetFromFile(`${DIR}/highVowel2b.csv`);
        testErrors(project, []);
        testGenerate(project, [
            {gloss: "[3SG]sing",text: "umurf"},
            {gloss: "[3SG]climb",text: "umirf"},
            {gloss: "[2SG]sing",text: "imurf"},
            {gloss: "[2SG]climb",text: "imirf"}
        ]);
    }); 

    testSrc({
		desc: 'HighVowel tests 3',
        id: "11",
        results: [
        ]
    });
    function() {
        const project = sheetFromFile(`${DIR}/highVowel3.csv`);
        testErrors(project, []);
        testGenerate(project, [
            {gloss: "[2PL]sing",text: "omurf"},
            {gloss: "[2PL]climb",text: "omirf"},
            {gloss: "[1PL]sing",text: "emurf"},
            {gloss: "[1PL]climb",text: "emirf"},
            {gloss: "[1SG]sing",text: "amurf"},
            {gloss: "[1SG]climb",text: "amirf"}
        ]);
    }); 

    testSrc({
		desc: 'HighVowel tests 3b',
        id: "11",
        results: [
        ]
    });
    function() {
        const project = sheetFromFile(`${DIR}/highVowel3b.csv`);
        testErrors(project, []);
        testGenerate(project, [
            {gloss: "[2PL]sing",text: "omurf"},
            {gloss: "[2PL]climb",text: "omirf"},
            {gloss: "[1PL]sing",text: "emurf"},
            {gloss: "[1PL]climb",text: "emirf"},
            {gloss: "[1SG]sing",text: "amurf"},
            {gloss: "[1SG]climb",text: "amirf"}
        ]);
    }); 
    
    testSrc({
		desc: 'HighVowel tests 4',
        id: "11",
        results: [
        ]
    });
    function() {
        const project = sheetFromFile(`${DIR}/highVowel4.csv`, VERBOSE_DEBUG);
        testErrors(project, []);
        testGenerate(project, [
            {gloss: "[2PL]sing",text: "omurf"},
            {gloss: "[2PL]climb",text: "omirf"},
            {gloss: "[1PL]sing",text: "emurf"},
            {gloss: "[1PL]climb",text: "emirf"},
            {gloss: "[1SG]sing",text: "amurf"},
            {gloss: "[1SG]climb",text: "amirf"}
        ]);
    }); 

    testSrc({
		desc: 'HighVowel tests 4b',
        id: "11",
        results: [
        ]
    });
    function() {
        const project = sheetFromFile(`${DIR}/highVowel4b.csv`);
        testErrors(project, []);
        testGenerate(project, [
            {gloss: "[2PL]sing",text: "omurf"},
            {gloss: "[2PL]climb",text: "omirf"},
            {gloss: "[1PL]sing",text: "emurf"},
            {gloss: "[1PL]climb",text: "emirf"},
            {gloss: "[1SG]sing",text: "amurf"},
            {gloss: "[1SG]climb",text: "amirf"}
        ]);
    }); 
    */
});


