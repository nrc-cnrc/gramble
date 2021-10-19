import { expect } from 'chai';
import * as path from 'path';
import { tokenizeUnicode } from "../src/util";
import { testTokenize } from './testUtils';

describe(`${path.basename(module.filename)}`, function() {

    describe('Empty string', function() {
        testTokenize("", []);
    });

    describe('Simple string', function() {
        testTokenize("foo", [ 'f', 'o', 'o' ]);
    });
    
    describe('String with a diacritic', function() {
        testTokenize("fóo", [ 'f', 'ó', 'o']);
    });

    describe('String beginning in a diacritic', function() {
        testTokenize("óo", [ 'ó', 'o' ]);
    });
    
    describe('String ending in a diacritic', function() {
        testTokenize("foó", [ 'f', 'o', 'ó' ]);
    });
    
    describe('String with two diacritics', function() {
        testTokenize("fö́o", [ 'f', 'ö́', 'o' ]);
    });
    
    describe('String ending in two diacritics', function() {
        testTokenize("fö́", [ 'f', 'ö́' ]);
    });
    
    describe('String with a superscript h', function() {
        testTokenize("pʰoo", [ 'pʰ', 'o', 'o']);
    });

    describe('String beginning with a superscript h', function() {
        testTokenize("ʰpoo", [ 'ʰ', 'p', 'o', 'o']);
    });

    describe('String with tied characters', function() {
        testTokenize("ut͡su", [ 'u', 't͡s', 'u' ]);
    });

    describe('String with tied characters (under-tie)', function() {
        testTokenize("ut͜su", [ 'u', 't͜s', 'u' ]);
    });

    describe('String ending in tied characters', function() {
        testTokenize("ut͡s", [ 'u', 't͡s' ]);
    });

    describe('String ending in tie', function() {
        testTokenize("ut͡", [ 'u', 't͡' ]);
    });
    
    describe('String with tied characters and a diacritic on 1st one', function() {
        testTokenize("ut͡ʼsu", [ 'u', 't͡ʼs', 'u' ]);
    });

    describe('String with tied characters and a diacritic on 2nd one', function() {
        testTokenize("ut͡sʼu", [ 'u', 't͡sʼ', 'u' ]);
    });

});