import {
    testSuiteName, 
    logTestSuite,
    testTokenize,
} from '../testUtil';

describe(`${testSuiteName(module)}`, function() {

    logTestSuite(this.title);

    describe('1. Empty string', function() {
        testTokenize("", []);
    });

    describe('2. Simple string', function() {
        testTokenize("foo", [ 'f', 'o', 'o' ]);
    });
    
    describe('3. String with a diacritic', function() {
        testTokenize("fóo", [ 'f', 'ó', 'o']);
    });

    describe('4. String with a length marker', function() {
        testTokenize("foːo", [ 'f', 'oː', 'o']);
    });
    
    describe('5. String with a colon', function() {
        testTokenize("fo:o", [ 'f', 'o', ':', 'o']);
    });
    
    describe('6. String with superscript h', function() {
        testTokenize("pʰoo", [ 'pʰ', 'o', 'o']);
    });

    describe('7. String with superscript oe', function() {
        testTokenize("pꟹoo", [ 'pꟹ', 'o', 'o']);
    });

    describe('8. String with superscript l', function() {
        testTokenize("pˡoo", [ 'pˡ', 'o', 'o']);
    });

    describe('9. String with superscript ꚝ', function() {
        testTokenize("pꚝoo", [ 'pꚝ', 'o', 'o']);
    });

    describe('10. String with subscript s', function() {
        testTokenize("pₛoo", [ 'pₛ', 'o', 'o']);
    });
    
    describe('11. String with superscript a', function() {
        testTokenize("pᵃoo", [ 'pᵃ', 'o', 'o']);
    });
    
    describe('12. String with superscript n', function() {
        testTokenize("pⁿoo", [ 'pⁿ', 'o', 'o']);
    });

    describe('13. String with Medieval German superscript e', function() {
        testTokenize("puͤo", [ 'p', 'uͤ', 'o']);
    });
    
    describe('14. String with ligature fi', function() {
        testTokenize("ﬁoo", [ 'ﬁ', 'o', 'o' ]);
    });

    describe('15. String with ligature ts', function() {
        testTokenize("ʦoo", [ 'ʦ', 'o', 'o' ]);
    });
    
    describe('16. String beginning in a diacritic', function() {
        testTokenize("óo", [ 'ó', 'o' ]);
    });
    
    describe('17. String ending in a diacritic', function() {
        testTokenize("foó", [ 'f', 'o', 'ó' ]);
    });
    
    describe('18. String with two diacritics', function() {
        testTokenize("fö́o", [ 'f', 'ö́', 'o' ]);
    });
    
    describe('19. String ending in two diacritics', function() {
        testTokenize("fö́", [ 'f', 'ö́' ]);
    });
    
    describe('20. String with a superscript h', function() {
        testTokenize("pʰoo", [ 'pʰ', 'o', 'o']);
    });

    describe('21. String beginning with a superscript h', function() {
        testTokenize("ʰpoo", [ 'ʰ', 'p', 'o', 'o']);
    });

    describe('22. String with tied characters', function() {
        testTokenize("ut͡su", [ 'u', 't͡s', 'u' ]);
    });

    describe('23. String with tied characters (under-tie)', function() {
        testTokenize("ut͜su", [ 'u', 't͜s', 'u' ]);
    });

    describe('24. String ending in tied characters', function() {
        testTokenize("ut͡s", [ 'u', 't͡s' ]);
    });

    describe('25. String ending in tie', function() {
        testTokenize("ut͡", [ 'u', 't͡' ]);
    });
    
    describe('26. String with tied characters and a diacritic on 1st one', function() {
        testTokenize("ut͡ʼsu", [ 'u', 't͡ʼs', 'u' ]);
    });

    describe('27. String with tied characters and a diacritic on 2nd one', function() {
        testTokenize("ut͡sʼu", [ 'u', 't͡sʼ', 'u' ]);
    });

});
