(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.gramble = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/**
 * @license BitSet.js v5.1.1 2/1/2020
 * http://www.xarg.org/2014/03/javascript-bit-array/
 *
 * Copyright (c) 2020, Robert Eisele (robert@xarg.org)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 **/
(function(root) {

  'use strict';

  /**
   * The number of bits of a word
   * @const
   * @type number
   */
  var WORD_LENGTH = 32;

  /**
   * The log base 2 of WORD_LENGTH
   * @const
   * @type number
   */
  var WORD_LOG = 5;

  /**
   * Calculates the number of set bits
   *
   * @param {number} v
   * @returns {number}
   */
  function popCount(v) {

    // Warren, H. (2009). Hacker`s Delight. New York, NY: Addison-Wesley

    v -= ((v >>> 1) & 0x55555555);
    v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
    return (((v + (v >>> 4) & 0xF0F0F0F) * 0x1010101) >>> 24);
  }

  /**
   * Divide a number in base two by B
   *
   * @param {Array} arr
   * @param {number} B
   * @returns {number}
   */
  function divide(arr, B) {

    var r = 0;

    for (var i = 0; i < arr.length; i++) {
      r *= 2;
      var d = (arr[i] + r) / B | 0;
      r = (arr[i] + r) % B;
      arr[i] = d;
    }
    return r;
  }

  /**
   * Parses the parameters and set variable P
   *
   * @param {Object} P
   * @param {string|BitSet|Array|Uint8Array|number=} val
   */
  function parse(P, val) {

    if (val == null) {
      P['data'] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      P['_'] = 0;
      return;
    }

    if (val instanceof BitSet) {
      P['data'] = val['data'];
      P['_'] = val['_'];
      return;
    }

    switch (typeof val) {

      case 'number':
        P['data'] = [val | 0];
        P['_'] = 0;
        break;

      case 'string':

        var base = 2;
        var len = WORD_LENGTH;

        if (val.indexOf('0b') === 0) {
          val = val.substr(2);
        } else if (val.indexOf('0x') === 0) {
          val = val.substr(2);
          base = 16;
          len = 8;
        }

        P['data'] = [];
        P['_'] = 0;

        var a = val.length - len;
        var b = val.length;

        do {

          var num = parseInt(val.slice(a > 0 ? a : 0, b), base);

          if (isNaN(num)) {
            throw SyntaxError('Invalid param');
          }

          P['data'].push(num | 0);

          if (a <= 0)
            break;

          a -= len;
          b -= len;
        } while (1);

        break;

      default:

        P['data'] = [0];
        var data = P['data'];

        if (val instanceof Array) {

          for (var i = val.length - 1; i >= 0; i--) {

            var ndx = val[i];

            if (ndx === Infinity) {
              P['_'] = -1;
            } else {
              scale(P, ndx);
              data[ndx >>> WORD_LOG] |= 1 << ndx;
            }
          }
          break;
        }

        if (Uint8Array && val instanceof Uint8Array) {

          var bits = 8;

          scale(P, val.length * bits);

          for (var i = 0; i < val.length; i++) {

            var n = val[i];

            for (var j = 0; j < bits; j++) {

              var k = i * bits + j;

              data[k >>> WORD_LOG] |= (n >> j & 1) << k;
            }
          }
          break;
        }
        throw SyntaxError('Invalid param');
    }
  }

  /**
   * Module entry point
   *
   * @constructor
   * @param {string|BitSet|number=} param
   * @returns {BitSet}
   */
  function BitSet(param) {

    if (!(this instanceof BitSet)) {
      return new BitSet(param);
    }
    parse(this, param);
    this['data'] = this['data'].slice();
  }

  function scale(dst, ndx) {

    var l = ndx >>> WORD_LOG;
    var d = dst['data'];
    var v = dst['_'];

    for (var i = d.length; l >= i; l--) {
      d.push(v);
    }
  }

  var P = {
    'data': [], // Holds the actual bits in form of a 32bit integer array.
    '_': 0 // Holds the MSB flag information to make indefinitely large bitsets inversion-proof
  };

  BitSet.prototype = {
    'data': [],
    '_': 0,
    /**
     * Set a single bit flag
     *
     * Ex:
     * bs1 = new BitSet(10);
     *
     * bs1.set(3, 1);
     *
     * @param {number} ndx The index of the bit to be set
     * @param {number=} value Optional value that should be set on the index (0 or 1)
     * @returns {BitSet} this
     */
    'set': function(ndx, value) {

      ndx |= 0;

      scale(this, ndx);

      if (value === undefined || value) {
        this['data'][ndx >>> WORD_LOG] |= (1 << ndx);
      } else {
        this['data'][ndx >>> WORD_LOG] &= ~(1 << ndx);
      }
      return this;
    },
    /**
     * Get a single bit flag of a certain bit position
     *
     * Ex:
     * bs1 = new BitSet();
     * var isValid = bs1.get(12);
     *
     * @param {number} ndx the index to be fetched
     * @returns {number} The binary flag
     */
    'get': function(ndx) {

      ndx |= 0;

      var d = this['data'];
      var n = ndx >>> WORD_LOG;

      if (n >= d.length) {
        return this['_'] & 1;
      }
      return (d[n] >>> ndx) & 1;
    },
    /**
     * Creates the bitwise NOT of a set.
     *
     * Ex:
     * bs1 = new BitSet(10);
     *
     * res = bs1.not();
     *
     * @returns {BitSet} A new BitSet object, containing the bitwise NOT of this
     */
    'not': function() { // invert()

      var t = this['clone']();
      var d = t['data'];
      for (var i = 0; i < d.length; i++) {
        d[i] = ~d[i];
      }

      t['_'] = ~t['_'];

      return t;
    },
    /**
     * Creates the bitwise AND of two sets.
     *
     * Ex:
     * bs1 = new BitSet(10);
     * bs2 = new BitSet(10);
     *
     * res = bs1.and(bs2);
     *
     * @param {BitSet} value A bitset object
     * @returns {BitSet} A new BitSet object, containing the bitwise AND of this and value
     */
    'and': function(value) {// intersection

      parse(P, value);

      var T = this['clone']();
      var t = T['data'];
      var p = P['data'];

      var pl = p.length;
      var p_ = P['_'];
      var t_ = T['_'];

      // If this is infinite, we need all bits from P
      if (t_ !== 0) {
        scale(T, pl * WORD_LENGTH - 1);
      }

      var tl = t.length;
      var l = Math.min(pl, tl);
      var i = 0;

      for (; i < l; i++) {
        t[i] &= p[i];
      }

      for (; i < tl; i++) {
        t[i] &= p_;
      }

      T['_'] &= p_;

      return T;
    },
    /**
     * Creates the bitwise OR of two sets.
     *
     * Ex:
     * bs1 = new BitSet(10);
     * bs2 = new BitSet(10);
     *
     * res = bs1.or(bs2);
     *
     * @param {BitSet} val A bitset object
     * @returns {BitSet} A new BitSet object, containing the bitwise OR of this and val
     */
    'or': function(val) { // union

      parse(P, val);

      var t = this['clone']();
      var d = t['data'];
      var p = P['data'];

      var pl = p.length - 1;
      var tl = d.length - 1;

      var minLength = Math.min(tl, pl);

      // Append backwards, extend array only once
      for (var i = pl; i > minLength; i--) {
        d[i] = p[i];
      }

      for (; i >= 0; i--) {
        d[i] |= p[i];
      }

      t['_'] |= P['_'];

      return t;
    },
    /**
     * Creates the bitwise XOR of two sets.
     *
     * Ex:
     * bs1 = new BitSet(10);
     * bs2 = new BitSet(10);
     *
     * res = bs1.xor(bs2);
     *
     * @param {BitSet} val A bitset object
     * @returns {BitSet} A new BitSet object, containing the bitwise XOR of this and val
     */
    'xor': function(val) { // symmetric difference

      parse(P, val);

      var t = this['clone']();
      var d = t['data'];
      var p = P['data'];

      var t_ = t['_'];
      var p_ = P['_'];

      var i = 0;

      var tl = d.length - 1;
      var pl = p.length - 1;

      // Cut if tl > pl
      for (i = tl; i > pl; i--) {
        d[i] ^= p_;
      }

      // Cut if pl > tl
      for (i = pl; i > tl; i--) {
        d[i] = t_ ^ p[i];
      }

      // XOR the rest
      for (; i >= 0; i--) {
        d[i] ^= p[i];
      }

      // XOR infinity
      t['_'] ^= p_;

      return t;
    },
    /**
     * Creates the bitwise AND NOT (not confuse with NAND!) of two sets.
     *
     * Ex:
     * bs1 = new BitSet(10);
     * bs2 = new BitSet(10);
     *
     * res = bs1.notAnd(bs2);
     *
     * @param {BitSet} val A bitset object
     * @returns {BitSet} A new BitSet object, containing the bitwise AND NOT of this and other
     */
    'andNot': function(val) { // difference

      return this['and'](new BitSet(val)['flip']());
    },
    /**
     * Flip/Invert a range of bits by setting
     *
     * Ex:
     * bs1 = new BitSet();
     * bs1.flip(); // Flip entire set
     * bs1.flip(5); // Flip single bit
     * bs1.flip(3,10); // Flip a bit range
     *
     * @param {number=} from The start index of the range to be flipped
     * @param {number=} to The end index of the range to be flipped
     * @returns {BitSet} this
     */
    'flip': function(from, to) {

      if (from === undefined) {

        var d = this['data'];
        for (var i = 0; i < d.length; i++) {
          d[i] = ~d[i];
        }

        this['_'] = ~this['_'];

      } else if (to === undefined) {

        scale(this, from);

        this['data'][from >>> WORD_LOG] ^= (1 << from);

      } else if (0 <= from && from <= to) {

        scale(this, to);

        for (var i = from; i <= to; i++) {
          this['data'][i >>> WORD_LOG] ^= (1 << i);
        }
      }
      return this;
    },
    /**
     * Clear a range of bits by setting it to 0
     *
     * Ex:
     * bs1 = new BitSet();
     * bs1.clear(); // Clear entire set
     * bs1.clear(5); // Clear single bit
     * bs1.clear(3,10); // Clear a bit range
     *
     * @param {number=} from The start index of the range to be cleared
     * @param {number=} to The end index of the range to be cleared
     * @returns {BitSet} this
     */
    'clear': function(from, to) {

      var data = this['data'];

      if (from === undefined) {

        for (var i = data.length - 1; i >= 0; i--) {
          data[i] = 0;
        }
        this['_'] = 0;

      } else if (to === undefined) {

        from |= 0;

        scale(this, from);

        data[from >>> WORD_LOG] &= ~(1 << from);

      } else if (from <= to) {

        scale(this, to);

        for (var i = from; i <= to; i++) {
          data[i >>> WORD_LOG] &= ~(1 << i);
        }
      }
      return this;
    },
    /**
     * Gets an entire range as a new bitset object
     *
     * Ex:
     * bs1 = new BitSet();
     * bs1.slice(4, 8);
     *
     * @param {number=} from The start index of the range to be get
     * @param {number=} to The end index of the range to be get
     * @returns {BitSet} A new smaller bitset object, containing the extracted range
     */
    'slice': function(from, to) {

      if (from === undefined) {
        return this['clone']();
      } else if (to === undefined) {

        to = this['data'].length * WORD_LENGTH;

        var im = Object.create(BitSet.prototype);

        im['_'] = this['_'];
        im['data'] = [0];

        for (var i = from; i <= to; i++) {
          im['set'](i - from, this['get'](i));
        }
        return im;

      } else if (from <= to && 0 <= from) {

        var im = Object.create(BitSet.prototype);
        im['data'] = [0];

        for (var i = from; i <= to; i++) {
          im['set'](i - from, this['get'](i));
        }
        return im;
      }
      return null;
    },
    /**
     * Set a range of bits
     *
     * Ex:
     * bs1 = new BitSet();
     *
     * bs1.setRange(10, 15, 1);
     *
     * @param {number} from The start index of the range to be set
     * @param {number} to The end index of the range to be set
     * @param {number} value Optional value that should be set on the index (0 or 1)
     * @returns {BitSet} this
     */
    'setRange': function(from, to, value) {

      for (var i = from; i <= to; i++) {
        this['set'](i, value);
      }
      return this;
    },
    /**
     * Clones the actual object
     *
     * Ex:
     * bs1 = new BitSet(10);
     * bs2 = bs1.clone();
     *
     * @returns {BitSet|Object} A new BitSet object, containing a copy of the actual object
     */
    'clone': function() {

      var im = Object.create(BitSet.prototype);
      im['data'] = this['data'].slice();
      im['_'] = this['_'];

      return im;
    },
    /**
     * Gets a list of set bits
     *
     * @returns {Array}
     */
    'toArray': Math['clz32'] ?
    function() {

      var ret = [];
      var data = this['data'];

      for (var i = data.length - 1; i >= 0; i--) {

        var num = data[i];

        while (num !== 0) {
          var t = 31 - Math['clz32'](num);
          num ^= 1 << t;
          ret.unshift((i * WORD_LENGTH) + t);
        }
      }

      if (this['_'] !== 0)
        ret.push(Infinity);

      return ret;
    } :
    function() {

      var ret = [];
      var data = this['data'];

      for (var i = 0; i < data.length; i++) {

        var num = data[i];

        while (num !== 0) {
          var t = num & -num;
          num ^= t;
          ret.push((i * WORD_LENGTH) + popCount(t - 1));
        }
      }

      if (this['_'] !== 0)
        ret.push(Infinity);

      return ret;
    },
    /**
     * Overrides the toString method to get a binary representation of the BitSet
     *
     * @param {number=} base
     * @returns string A binary string
     */
    'toString': function(base) {

      var data = this['data'];

      if (!base)
        base = 2;

      // If base is power of two
      if ((base & (base - 1)) === 0 && base < 36) {

        var ret = '';
        var len = 2 + Math.log(4294967295/*Math.pow(2, WORD_LENGTH)-1*/) / Math.log(base) | 0;

        for (var i = data.length - 1; i >= 0; i--) {

          var cur = data[i];

          // Make the number unsigned
          if (cur < 0)
            cur += 4294967296 /*Math.pow(2, WORD_LENGTH)*/;

          var tmp = cur.toString(base);

          if (ret !== '') {
            // Fill small positive numbers with leading zeros. The +1 for array creation is added outside already
            ret += '0'.repeat(len - tmp.length - 1);
          }
          ret += tmp;
        }

        if (this['_'] === 0) {

          ret = ret.replace(/^0+/, '');

          if (ret === '')
            ret = '0';
          return ret;

        } else {
          // Pad the string with ones
          ret = '1111' + ret;
          return ret.replace(/^1+/, '...1111');
        }

      } else {

        if ((2 > base || base > 36))
          throw SyntaxError('Invalid base');

        var ret = [];
        var arr = [];

        // Copy every single bit to a new array
        for (var i = data.length; i--; ) {

          for (var j = WORD_LENGTH; j--; ) {

            arr.push(data[i] >>> j & 1);
          }
        }

        do {
          ret.unshift(divide(arr, base).toString(base));
        } while (!arr.every(function(x) {
          return x === 0;
        }));

        return ret.join('');
      }
    },
    /**
     * Check if the BitSet is empty, means all bits are unset
     *
     * Ex:
     * bs1 = new BitSet(10);
     *
     * bs1.isEmpty() ? 'yes' : 'no'
     *
     * @returns {boolean} Whether the bitset is empty
     */
    'isEmpty': function() {

      if (this['_'] !== 0)
        return false;

      var d = this['data'];

      for (var i = d.length - 1; i >= 0; i--) {
        if (d[i] !== 0)
          return false;
      }
      return true;
    },
    /**
     * Calculates the number of bits set
     *
     * Ex:
     * bs1 = new BitSet(10);
     *
     * var num = bs1.cardinality();
     *
     * @returns {number} The number of bits set
     */
    'cardinality': function() {

      if (this['_'] !== 0) {
        return Infinity;
      }

      var s = 0;
      var d = this['data'];
      for (var i = 0; i < d.length; i++) {
        var n = d[i];
        if (n !== 0)
          s += popCount(n);
      }
      return s;
    },
    /**
     * Calculates the Most Significant Bit / log base two
     *
     * Ex:
     * bs1 = new BitSet(10);
     *
     * var logbase2 = bs1.msb();
     *
     * var truncatedTwo = Math.pow(2, logbase2); // May overflow!
     *
     * @returns {number} The index of the highest bit set
     */
    'msb': Math['clz32'] ?
    function() {

      if (this['_'] !== 0) {
        return Infinity;
      }

      var data = this['data'];

      for (var i = data.length; i-- > 0;) {

        var c = Math['clz32'](data[i]);

        if (c !== WORD_LENGTH) {
          return (i * WORD_LENGTH) + WORD_LENGTH - 1 - c;
        }
      }
      return Infinity;
    } :
    function() {

      if (this['_'] !== 0) {
        return Infinity;
      }

      var data = this['data'];

      for (var i = data.length; i-- > 0;) {

        var v = data[i];
        var c = 0;

        if (v) {

          for (; (v >>>= 1) > 0; c++) {
          }
          return (i * WORD_LENGTH) + c;
        }
      }
      return Infinity;
    },
    /**
     * Calculates the number of trailing zeros
     *
     * Ex:
     * bs1 = new BitSet(10);
     *
     * var ntz = bs1.ntz();
     *
     * @returns {number} The index of the lowest bit set
     */
    'ntz': function() {

      var data = this['data'];

      for (var j = 0; j < data.length; j++) {
        var v = data[j];

        if (v !== 0) {

          v = (v ^ (v - 1)) >>> 1; // Set v's trailing 0s to 1s and zero rest

          return (j * WORD_LENGTH) + popCount(v);
        }
      }
      return Infinity;
    },
    /**
     * Calculates the Least Significant Bit
     *
     * Ex:
     * bs1 = new BitSet(10);
     *
     * var lsb = bs1.lsb();
     *
     * @returns {number} The index of the lowest bit set
     */
    'lsb': function() {

      var data = this['data'];

      for (var i = 0; i < data.length; i++) {

        var v = data[i];
        var c = 0;

        if (v) {

          var bit = (v & -v);

          for (; (bit >>>= 1); c++) {

          }
          return WORD_LENGTH * i + c;
        }
      }
      return this['_'] & 1;
    },
    /**
     * Compares two BitSet objects
     *
     * Ex:
     * bs1 = new BitSet(10);
     * bs2 = new BitSet(10);
     *
     * bs1.equals(bs2) ? 'yes' : 'no'
     *
     * @param {BitSet} val A bitset object
     * @returns {boolean} Whether the two BitSets have the same bits set (valid for indefinite sets as well)
     */
    'equals': function(val) {

      parse(P, val);

      var t = this['data'];
      var p = P['data'];

      var t_ = this['_'];
      var p_ = P['_'];

      var tl = t.length - 1;
      var pl = p.length - 1;

      if (p_ !== t_) {
        return false;
      }

      var minLength = tl < pl ? tl : pl;
      var i = 0;

      for (; i <= minLength; i++) {
        if (t[i] !== p[i])
          return false;
      }

      for (i = tl; i > pl; i--) {
        if (t[i] !== p_)
          return false;
      }

      for (i = pl; i > tl; i--) {
        if (p[i] !== t_)
          return false;
      }
      return true;
    },
    [Symbol.iterator]: function () {

      var d = this['data'];
      var ndx = 0;

      if (this['_'] === 0) {

        // Find highest index with something meaningful
        var highest = 0;
        for (var i = d.length - 1; i >= 0; i--) {
          if (d[i] !== 0) {
            highest = i;
            break;
          }
        }

        return {
          'next': function () {
            var n = ndx >>> WORD_LOG;

            return {
              'done': n > highest || n === highest && (d[n] >>> ndx) === 0,
              'value': n > highest ? 0 : (d[n] >>> ndx++) & 1
            };
          }
        };

      } else {
        // Endless iterator!
        return {
          'next': function () {
            var n = ndx >>> WORD_LOG;

            return {
              'done': false,
              'value': n < d.length ? (d[n] >>> ndx++) & 1 : 1,
            };
          }
        };
      }
    }
  };

  BitSet['fromBinaryString'] = function(str) {

    return new BitSet('0b' + str);
  };

  BitSet['fromHexString'] = function(str) {

    return new BitSet('0x' + str);
  };

  BitSet['Random'] = function(n) {

    if (n === undefined || n < 0) {
      n = WORD_LENGTH;
    }

    var m = n % WORD_LENGTH;

    // Create an array, large enough to hold the random bits
    var t = [];
    var len = Math.ceil(n / WORD_LENGTH);

    // Create an bitset instance
    var s = Object.create(BitSet.prototype);

    // Fill the vector with random data, uniformally distributed
    for (var i = 0; i < len; i++) {
      t.push(Math.random() * 4294967296 | 0);
    }

    // Mask out unwanted bits
    if (m > 0) {
      t[len - 1] &= (1 << m) - 1;
    }

    s['data'] = t;
    s['_'] = 0;
    return s;
  };

  if (typeof define === 'function' && define['amd']) {
    define([], function() {
      return BitSet;
    });
  } else if (typeof exports === 'object') {
    Object.defineProperty(exports, "__esModule", { 'value': true });
    BitSet['default'] = BitSet;
    BitSet['BitSet'] = BitSet;
    module['exports'] = BitSet;
  } else {
    root['BitSet'] = BitSet;
  }

})(this);

},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseHeader = exports.Header = exports.CellPosition = void 0;
const util_1 = require("./util");
const stateMachine_1 = require("./stateMachine");
const DEFAULT_SATURATION = 0.2;
const DEFAULT_VALUE = 1.0;
/**
 * A convenience class encapsulating information about where a cell
 * is.  Every component of the abstract syntax tree has one of these;
 * if it's a cell, that's just its position on a spreadsheet; if it's a
 * complex component, it's the position of its first cell.
 *
 * By convention we treat the spreadsheet itself as a component with
 * its first cell at -1, -1.
 */
class CellPosition {
    constructor(sheet, row = -1, col = -1) {
        this.sheet = sheet;
        this.row = row;
        this.col = col;
    }
    toString() {
        return `${this.sheet}:${this.row}:${this.col}`;
    }
}
exports.CellPosition = CellPosition;
/**
 * A Header is a cell in the top row of a table, consisting of one of
 *
 * * the name of a tape, like "text" or "gloss"
 * * a unary operator like "maybe" followed by a valid Header (e.g. "maybe text")
 * * two valid Headers joined by a slash (e.g. "text/gloss")
 * * a valid Header in parentheses (e.g. "(text)")
 * * a comment (e.g. "% text")
 *
 * (We treat commented-out headers specially, because they turn everything
 * in their column into no-ops.)
 */
class Header {
    getColor(saturation = DEFAULT_SATURATION, value = DEFAULT_VALUE) {
        return util_1.RGBtoString(...util_1.HSVtoRGB(this.hue, saturation, value));
    }
    getFgColor() {
        return "#000000";
    }
}
exports.Header = Header;
class AtomicHeader extends Header {
    constructor(text) {
        super();
        this.text = text;
    }
    get hue() {
        const str = this.text + "abcde"; // otherwise short strings are boring colors
        var hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return (hash & 0xFF) / 255;
    }
    compile(valueText, pos, namespace, devEnv) {
        if (this.text.toLowerCase() == "embed") {
            return stateMachine_1.Emb(valueText, namespace);
        }
        return stateMachine_1.Lit(this.text, valueText);
    }
}
class CommentHeader extends Header {
    get hue() {
        return 0;
    }
    getColor(saturation = DEFAULT_SATURATION, value = DEFAULT_VALUE) {
        return "#FFFFFF";
    }
    getFgColor() {
        return "#449944";
    }
    compile(valueText, pos, namespace, devEnv) {
        return stateMachine_1.Empty();
    }
}
class UnaryHeader extends Header {
    constructor(text, child) {
        super();
        this.text = text;
        this.child = child;
    }
    get hue() {
        return this.child.hue;
    }
    compile(valueText, pos, namespace, devEnv) {
        const childState = this.child.compile(valueText, pos, namespace, devEnv);
        if (this.text.toLowerCase() == "maybe") {
            const childState = this.child.compile(valueText, pos, namespace, devEnv);
            return stateMachine_1.Maybe(childState);
        }
        if (this.text.toLowerCase() == "not") {
            return stateMachine_1.Not(childState);
        }
        // The header parser shouldn't be creating unary headers that
        // aren't in the above set, but just in case...
        devEnv.markError(pos.sheet, pos.row, pos.col, `${valueText} is not among the operators allowed in headers.`);
        return stateMachine_1.Empty();
    }
}
class BinaryHeader extends Header {
    constructor(text, child1, child2) {
        super();
        this.text = text;
        this.child1 = child1;
        this.child2 = child2;
    }
    get hue() {
        return (util_1.meanAngleDeg([this.child1.hue * 360, this.child2.hue * 360]) + 360) / 360;
    }
    compile(valueText, pos, namespace, devEnv) {
        if (this.text == "/") {
            const childState1 = this.child1.compile(valueText, pos, namespace, devEnv);
            const childState2 = this.child2.compile(valueText, pos, namespace, devEnv);
            return stateMachine_1.Seq(childState1, childState2);
        }
        // The header parser shouldn't be creating binary headers that
        // aren't in the above set, but just in case...
        devEnv.markError(pos.sheet, pos.row, pos.col, `${valueText} is not among the operators allowed in headers.`);
        return stateMachine_1.Empty();
    }
}
const SYMBOL = ["(", ")", "%", "/"];
const UNARY_RESERVED = ["maybe", "not"];
const ALL_RESERVED = SYMBOL.concat(UNARY_RESERVED);
const SUBEXPR = AltHeaderParser([AtomicHeaderParser, ParensHeaderParser]);
const NON_COMMENT_EXPR = AltHeaderParser([UnaryHeaderParser, SlashHeaderParser, SUBEXPR]);
const EXPR = AltHeaderParser([CommentHeaderParser, NON_COMMENT_EXPR]);
function* AtomicHeaderParser(input) {
    if (input.length == 0 || ALL_RESERVED.indexOf(input[0]) != -1) {
        return;
    }
    yield [new AtomicHeader(input[0]), input.slice(1)];
}
function AltHeaderParser(children) {
    return function* (input) {
        for (const child of children) {
            yield* child(input);
        }
    };
}
function* UnaryHeaderParser(input) {
    if (input.length == 0 || UNARY_RESERVED.indexOf(input[0]) == -1) {
        return;
    }
    for (const [t, rem] of NON_COMMENT_EXPR(input.slice(1))) {
        yield [new UnaryHeader(input[0], t), rem];
    }
}
function* ParensHeaderParser(input) {
    if (input.length == 0 || input[0] != "(") {
        return;
    }
    for (const [t, rem] of NON_COMMENT_EXPR(input.slice(1))) {
        if (rem.length == 0 || rem[0] != ")") {
            return;
        }
        yield [t, rem.slice(1)];
    }
}
function* SlashHeaderParser(input) {
    if (input.length == 0) {
        return;
    }
    for (const [t1, rem1] of SUBEXPR(input)) {
        if (rem1.length == 0 || rem1[0] != "/") {
            return;
        }
        for (const [t2, rem2] of NON_COMMENT_EXPR(rem1.slice(1))) {
            yield [new BinaryHeader("/", t1, t2), rem2];
        }
    }
}
function* CommentHeaderParser(input) {
    if (input.length == 0 || input[0] != "%") {
        return;
    }
    yield [new CommentHeader(), []];
}
function parseHeader(headerText) {
    var pieces = headerText.split(/\s+|(\%|\(|\)|\/)/);
    pieces = pieces.filter((s) => s !== undefined && s !== '');
    var result = [...EXPR(pieces)];
    result = result.filter(([t, r]) => r.length == 0);
    if (result.length == 0) {
        throw new Error(`Cannot parse header: ${headerText}`);
    }
    if (result.length > 1) {
        // shouldn't happen with this grammar, but just in case
        throw new Error(`Ambiguous header, cannot parse: ${headerText}`);
    }
    return result[0][0];
}
exports.parseHeader = parseHeader;

},{"./stateMachine":4,"./util":6}],3:[function(require,module,exports){
"use strict";
/**
 * This file describes the parser that turns spreadsheets into abstract
 * syntax trees, for later compilation into formulas of a programming language.
 * It's agnostic as to exactly what that programming language is; to adapt
 * it to a particular language, implement Compiler<T> where T is the base class
 * of formulas in that language.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Project = exports.TableComponent = exports.EnclosureComponent = exports.CompileableComponent = exports.CellComponent = exports.TabularComponent = void 0;
const stateMachine_1 = require("./stateMachine");
const headerParser_1 = require("./headerParser");
/*
class SyntaxError {

    constructor(
        public position: CellPosition,
        public level: "error" | "warning",
        public msg: string
    ) { }

    public toString() {
        return `${this.level.toUpperCase()}: ${this.msg}`;
    }
}
export class ErrorAccumulator {

    protected errors: {[key: string]: SyntaxError[]} = {};

    public addError(pos: CellPosition, level: "error" | "warning", msg: string) {
        const key = pos.toString();
        if (!(key in this.errors)) {
            this.errors[key] = [];
        }
        const error = new SyntaxError(pos, level, msg);
        this.errors[key].push(error);
    }

    public logErrors(): void {
        for (const error of Object.values(this.errors)) {
            for (const errorMsg of error) {
                console.log(`${errorMsg.position}: ${errorMsg.toString()}`);
            }
        }
    }

    public getErrors(sheet: string, row: number, col: number): string[] {
        const key = new CellPosition(sheet, row, col).toString();
        const results: string[] = [];
        if (!(key in this.errors)) {
            return [];
        }
        return this.errors[key].map(e => e.toString());
    }

    public numErrors(level: "error" | "warning"|"any"): number {
        var result = 0;
        for (const error of Object.values(this.errors)) {
            for (const errorMsg of error) {
                if (level == "any" || errorMsg.level == level) {
                    result++;
                }
            }
        }
        return result;
    }
}
*/
class TabularComponent {
}
exports.TabularComponent = TabularComponent;
class CellComponent extends TabularComponent {
    constructor(text, position) {
        super();
        this.text = text;
        this.position = position;
    }
    toString() {
        return `${this.text}:${this.position}`;
    }
}
exports.CellComponent = CellComponent;
class CompileableComponent extends TabularComponent {
    constructor() {
        super(...arguments);
        /**
         * The previous sibling of the component (i.e. the component that shares
         * the same parent, but appeared before this component, usually directly
         * above this one).
         *
         * Only EnclosureComponents have siblings, but it's more convenient
         * to define it here so that certain clients (like unit tests) don't have
         * to deal with the templating aspects.
         */
        this.sibling = undefined;
        /**
         * The last-defined child of the component (i.e. of all the components
         * enclosed by this component, the last one.)  As [SheetParser] builds the
         * tree, this value will change; when a new child is added, it's set to the
         * parent's child and the previous child (if any) becomes the new child's
         * sibling.
         */
        this.child = undefined;
    }
}
exports.CompileableComponent = CompileableComponent;
const BINARY_OPS = {
    "or": stateMachine_1.Uni,
    "concat": stateMachine_1.Seq,
    "join": stateMachine_1.Join,
};
const BUILT_IN_OPS = new Set(Object.keys(BINARY_OPS));
BUILT_IN_OPS.add("table");
/* There are some reserved words like "maybe" that aren't built in ops,
but none implemented at the moment */
const RESERVED_WORDS = new Set(BUILT_IN_OPS);
/**
 * An enclosure represents a single-cell unit containing a command or identifier (call that the "startCell"),
 * and a rectangular region describing further details (like the parameters of the command,
 * or what is to be assigned to the identifier).
 *
 * An enclosure contains all cells to the right of it, and the cells below the cells to the right
 * (more precisely, a enclosure with its startCell in (r,c) contains all cells (x,y) where x >= r
 * and y > c), until a non-empty cell is encountered that is below the startCell or in a column before
 * the startCell.
 *
 * For example, if I is the ID cell, E are cells contained in the enclosure, X is the cell that "breaks"
 * the enclosure, and O are cells not contained in the enclosure:
 *
 * 0 0 0 0
 * 0 I E E E E
 *     E E E E
 *     E E E E
 *   X 0 0 0 0
 *     0 0 0 0
 *
 * Enclosures can be nested, and often are.  E.g., below, 2 contains all the A's, 3
 * contains all the B's, and 1 contains 2 and 3.
 *
 * 1 2 A A A A A
 *     A A A A A
 *
 *   3 B B B B
 *     B B B B
 *
 * Each enclosure keeps reference only to its last child.  Previous children are kept
 * as "sibling" references within that child.  Above, 3 is 1's child, and 2 is 3's
 * sibling.  Tables are also children; the table consisting of A's is 2's child.
 * For the most part, and operator like 3 will be a binary operation where
 * 2 and the B table are its params.  (For example, 3 might represent "or", and thus
 * the union of the grammar represented by 2 and the grammar represented by the B table.
 *
 */
class EnclosureComponent extends CompileableComponent {
    constructor(startCell, parent = undefined) {
        super();
        this.startCell = startCell;
        this.parent = parent;
        this.specRow = -1;
        this.specRow = startCell.position.row;
    }
    get position() {
        return this.startCell.position;
    }
    get text() {
        return this.startCell.text;
    }
    addHeader(header) {
        // can only add a header if there aren't any child enclosures yet.
        // well, we could, but it makes a particular kind of syntax error
        // hard to spot
        if (this.child == undefined) {
            this.child = new TableComponent();
        }
        if (!(this.child instanceof TableComponent)) {
            throw new Error("Closure already has a child; cannot add a header to it.");
        }
        this.child.addHeader(header);
    }
    addContent(cell) {
        if (!(this.child instanceof TableComponent)) {
            throw new Error("Trying to add content to a non-table");
        }
        this.child.addContent(cell);
    }
    compile(namespace, devEnv) {
        if (this.text == "table") {
            // it's a "table", which is technically a no-op,
            // but this .compileTable() function does some useful
            // error checking.
            return this.compileTable(namespace, devEnv);
        }
        if (this.text in BINARY_OPS) {
            // it's a binary operator like "or" or "join"
            return this.compileBinaryOp(namespace, devEnv);
        }
        /*
        if (this.parent == this.sheet) {
            // it's not any other kind of operator, but it's "top-level"
            // within its sheet, so it's an assignment to a new symbol
            return this.compileAssignment(namespace, errors);
        } */
        devEnv.markError(this.position.sheet, this.position.row, this.position.col, `Operator ${this.text} not recognized.`);
        return stateMachine_1.Empty();
    }
    compileAssignment(namespace, devEnv) {
        // first compile the previous sibling.  note that all siblings
        // of an assignment statement should be an assignment statement, since
        // being an assignment statement is, by definition, having a sheet component
        // as your immediate parent.
        if (this.sibling != undefined) {
            this.sibling.compileAssignment(namespace, devEnv);
        }
        if (RESERVED_WORDS.has(this.text)) {
            // oops, assigning to a reserved word
            devEnv.markError(this.position.sheet, this.position.row, this.position.col, "This cell has to be a symbol name for an assignment statement, but you're assigning to the " +
                `reserved word ${this.text}.  Choose a different symbol name.`);
            if (this.child != undefined) {
                // compile the child just in case there are useful errors to display
                this.child.compile(namespace, devEnv);
            }
            return stateMachine_1.Empty();
        }
        if (this.child == undefined) {
            // oops, empty "right side" of the assignment!
            devEnv.markError(this.position.sheet, this.position.row, this.position.col, `This looks like an assignment to a symbol ${this.text}, ` +
                "but there's nothing to the right of it.");
            return stateMachine_1.Empty();
        }
        const state = this.child.compile(namespace, devEnv);
        if (namespace.hasSymbol(this.text)) {
            // oops, trying to assign to a symbol that already is assigned to!
            devEnv.markError(this.position.sheet, this.position.row, this.position.col, `You've already assigned something to the symbol ${this.text}`);
            // TODO: The error message should say where it's assigned
        }
        namespace.addSymbol(this.text, state);
        return state;
    }
    compileTable(namespace, devEnv) {
        if (this.child == undefined) {
            devEnv.markError(this.position.sheet, this.position.row, this.position.col, "'table' seems to be missing a table; something should be in the cell to the right.");
            return stateMachine_1.Empty();
        }
        if (this.sibling != undefined) {
            const throwaway = this.sibling.compile(namespace, devEnv);
            // we don't do anything with the sibling, but we
            // compile it anyway in case there are errors in it the
            // programmer may want to know about
            devEnv.markError(this.position.sheet, this.position.row, this.position.col, `'table' here will obliterate the preceding content at ${this.sibling.position}.`, "warning");
        }
        return this.child.compile(namespace, devEnv);
    }
    compileBinaryOp(namespace, devEnv) {
        const op = BINARY_OPS[this.text];
        if (this.child == undefined) {
            devEnv.markError(this.position.sheet, this.position.row, this.position.col, `'${this.text}' is missing a second argument; ` +
                "something should be in the cell to the right.");
            return stateMachine_1.Empty();
        }
        if (this.sibling == undefined) {
            devEnv.markError(this.position.sheet, this.position.row, this.position.col, `'${this.text}' is missing a first argument; ` +
                "something should be in a cell above this.");
            return stateMachine_1.Empty();
        }
        const arg1 = this.sibling.compile(namespace, devEnv);
        const arg2 = this.child.compile(namespace, devEnv);
        return op(arg1, arg2);
    }
    addChildEnclosure(child, devEnv) {
        if (this.child instanceof TableComponent) {
            throw new Error("Can't add an operator to a line that already has headers.");
        }
        if (this.child != undefined && this.child.position.col != child.position.col) {
            devEnv.markError(this.position.sheet, this.position.row, this.position.col, "This operator is in an unexpected column.  Did you mean for it " +
                `to be in column ${this.child.position.col}, ` +
                `so that it's under the operator in cell ${this.child.position}?`, "warning");
        }
        child.sibling = this.child;
        this.child = child;
    }
    toString() {
        return `Enclosure(${this.position})`;
    }
    get sheet() {
        if (this.parent == undefined) {
            throw new Error("Stack empty; something has gone very wrong");
        }
        return this.parent.sheet;
    }
}
exports.EnclosureComponent = EnclosureComponent;
class SheetComponent extends EnclosureComponent {
    constructor(name) {
        super(new CellComponent(name, new headerParser_1.CellPosition(name)));
        this.name = name;
    }
    compile(namespace, devEnv) {
        if (this.child == undefined) {
            return stateMachine_1.Empty();
        }
        return this.child.compileAssignment(namespace, devEnv);
    }
    get sheet() {
        return this;
    }
}
/**
 * A Table is a rectangular region of the grid consisting of a header row
 * and cells beneath each header.  For example,
 *
 *      text, gloss
 *      foo, run
 *      moo, jump
 *      goo, climb
 *
 * Each header indicates how each cell beneath it should be interpreted; "foo"
 * should be interpret as "text", whatever that happens to mean in the programming
 * language in question.  Note that these are not necessarily well-formed database
 * tables; it's entirely possible to get tables where the same
 * header appears multiple times.
 */
class TableComponent extends CompileableComponent {
    constructor() {
        super(...arguments);
        this.headersByCol = {};
        this.headers = [];
        this.table = [];
    }
    compileAssignment(namespace, devEnv) {
        // I don't think this error is possible, but just in case
        devEnv.markError(this.position.sheet, this.position.row, this.position.col, "This cell needs to be an assignment, " +
            "but it looks like you're trying to start a table.");
        return stateMachine_1.Empty();
    }
    get position() {
        if (this.headers.length == 0) {
            return new headerParser_1.CellPosition("?", -1, -1);
        }
        return this.headers[0].position;
    }
    get text() {
        if (this.headers.length == 0) {
            return "?";
        }
        return this.headers[0].text;
    }
    addHeader(header) {
        this.headersByCol[header.position.col] = header;
    }
    addContent(cell) {
        const header = this.headersByCol[cell.position.col];
        if (header == undefined) {
            throw new Error(`Table at ${this.position} cannot add ` +
                `content in column ${cell.position.col}`);
        }
        if (this.table.length == 0 ||
            cell.position.row != this.table[this.table.length - 1][0].position.row) {
            this.table.push([]);
        }
        this.table[this.table.length - 1].push(cell);
    }
    compileCell(h, c, namespace, devEnv) {
        try {
            const header = headerParser_1.parseHeader(h.text);
            const headerColor = header.getColor(0.3);
            const contentColor = header.getColor(0.15);
            devEnv.markHeader(h.position.sheet, h.position.row, h.position.col, headerColor);
            devEnv.markTier(c.position.sheet, c.position.row, c.position.col, contentColor);
            return header.compile(c.text, h.position, namespace, devEnv);
        }
        catch (e) {
            devEnv.markError(h.position.sheet, h.position.row, h.position.col, e.toString());
            devEnv.markError(c.position.sheet, c.position.row, c.position.col, `Because of an error in the header at ${h.position}, ` +
                "this cell will be ignored.", "warning");
            return stateMachine_1.Empty();
        }
    }
    compile(namespace, devEnv) {
        const compiledRows = [];
        for (const row of this.table) {
            const compiledRow = [];
            for (const cell of row) {
                const header = this.headersByCol[cell.position.col];
                const compiledCell = this.compileCell(header, cell, namespace, devEnv);
                compiledRow.push(compiledCell);
            }
            compiledRows.push(stateMachine_1.Seq(...compiledRow));
        }
        return stateMachine_1.Uni(...compiledRows);
    }
    toString() {
        return `Table(${this.position})`;
    }
}
exports.TableComponent = TableComponent;
/**
 * A SheetParser turns a grid of cells into abstract syntax tree (AST) components, which in
 * turn are interpreted or compiled into a computer language.  This parser is agnostic as to
 * what exactly these components represent or how they'll be handled later, it's just a parser
 * for a particular class of tabular languages.
 */
class Project {
    constructor(devEnv) {
        this.devEnv = devEnv;
        this.globalNamespace = new stateMachine_1.Namespace();
        this.sheets = {};
    }
    generate(symbolName) {
        const startState = this.globalNamespace.get(symbolName);
        if (startState == undefined) {
            throw new Error(`Cannot find symbol ${symbolName}`);
        }
        return [...startState.generate()];
    }
    addSheet(sheetName) {
        if (sheetName in this.sheets) {
            // already loaded it, don't have to do anything
            return;
        }
        if (!this.devEnv.hasSource(sheetName)) {
            // this is an error, but we don't freak out about it here.
            // later on, we'll put errors on any cells for which we can't
            // resolve the reference.
            return;
        }
        const cells = this.devEnv.loadSource(sheetName);
        // parse the cells into an abstract syntax tree
        const sheetComponent = this.parseCells(sheetName, cells);
        // Create a new namespace for this sheet and add it to the 
        // global namespace
        const sheetNamespace = new stateMachine_1.Namespace();
        this.globalNamespace.addNamespace(sheetName, sheetNamespace);
        // Compile it
        sheetComponent.compile(sheetNamespace, this.devEnv);
        // Store it in .sheets
        this.sheets[sheetName] = sheetComponent;
        for (const requiredSheet of this.globalNamespace.requiredNamespaces) {
            this.addSheet(requiredSheet);
        }
    }
    getSheet(sheetName) {
        if (!(sheetName in this.sheets)) {
            throw new Error(`Sheet ${sheetName} not found in project`);
        }
        return this.sheets[sheetName];
    }
    getEnclosureOperators(cells) {
        const results = new Set(BUILT_IN_OPS);
        /* here is where we might also scan the files for definitions
        of new enclosure operators.  but we don't have the capability for
        custom operators yet. */
        return results;
    }
    parseCells(sheetName, cells) {
        const enclosureOps = this.getEnclosureOperators(cells);
        // There's one big enclosure that encompasses the whole sheet, with startCell (-1,-1)
        var topEnclosure = new SheetComponent(sheetName);
        // Now iterate through the cells, left-to-right top-to-bottom
        for (var rowIndex = 0; rowIndex < cells.length; rowIndex++) {
            for (var colIndex = 0; colIndex < cells[rowIndex].length; colIndex++) {
                const cellText = cells[rowIndex][colIndex].trim();
                if (cellText.length == 0) {
                    continue;
                }
                const position = new headerParser_1.CellPosition(sheetName, rowIndex, colIndex);
                const cell = new CellComponent(cellText, position);
                while (colIndex <= topEnclosure.position.col) {
                    // it breaks the previous enclosure; pop that off
                    if (topEnclosure.parent == undefined) {
                        throw new Error("The enclosure stack is empty somehow; " +
                            "something has gone very wrong.");
                    }
                    topEnclosure = topEnclosure.parent;
                    topEnclosure.specRow = rowIndex;
                }
                if (topEnclosure.specRow > -1 && rowIndex > topEnclosure.specRow) {
                    // we're inside an enclosure
                    try {
                        topEnclosure.addContent(cell);
                    }
                    catch (e) {
                        this.devEnv.markError(position.sheet, position.row, position.col, "This cell does not have a header above it, so we're unable to interpret it.");
                    }
                    continue;
                }
                // either we're still in the spec row, or there's no spec row yet
                if (enclosureOps.has(cellText) || position.col == 0) {
                    // it's the start of a new enclosure
                    this.devEnv.markCommand(position.sheet, position.row, position.col);
                    const newEnclosure = new EnclosureComponent(cell, topEnclosure);
                    try {
                        topEnclosure.addChildEnclosure(newEnclosure, this.devEnv);
                        topEnclosure = newEnclosure;
                    }
                    catch (e) {
                        this.devEnv.markError(position.sheet, position.row, position.col, "This looks like an operator, but only a header can follow a header.");
                    }
                    continue;
                }
                // it's a header
                try {
                    topEnclosure.addHeader(cell);
                }
                catch (e) {
                    //console.log(e);
                    this.devEnv.markError(position.sheet, position.row, position.col, `Cannot add a header to ${topEnclosure}; ` +
                        "you need an operator like 'or', 'apply', etc.");
                }
            }
        }
        return topEnclosure.sheet;
    }
}
exports.Project = Project;

},{"./headerParser":2,"./stateMachine":4}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Maybe = exports.Empty = exports.Rep = exports.Any = exports.Rename = exports.Proj = exports.Emb = exports.Not = exports.Join = exports.Uni = exports.Seq = exports.Literalizer = exports.Lit = exports.NegationState = exports.RenameState = exports.ProjectionState = exports.EmbedState = exports.RepetitionState = exports.JoinState = exports.UnionState = exports.ConcatState = exports.TrivialState = exports.LiteralState = exports.AnyCharState = exports.State = exports.Namespace = void 0;
const tapes_1 = require("./tapes");
/**
 * CounterStack
 *
 * A convenience class that works roughly like Python's collections.Counter.  Just
 * note that add() is non-destructive; it returns a new Counter without changing the original.
 * So use it like:
 *
 *  * counter = counter.add("verb");
 *
 * We use this to make sure we don't recurse an impractical number of times, like
 * infinitely.
 *
 * Infinite recursion is *correct* behavior for a grammar that's
 * genuinely infinite, but because this system is meant to be embedded in a
 * programming language meant for beginner programmers,
 * we default to allowing four recursions before stopping recursion.  Advanced
 * programmers will be able to turn this off and allow infinite recursion, but they
 * have to take an extra step to do so.
 */
class CounterStack {
    constructor(max = 4) {
        this.max = max;
        this.stack = {};
    }
    add(key) {
        const result = new CounterStack(this.max);
        result.stack[key] = 0;
        Object.assign(result.stack, this.stack);
        result.stack[key] += 1;
        return result;
    }
    get(key) {
        return (key in this.stack) ? this.stack[key] : 0;
    }
    exceedsMax(key) {
        return this.get(key) >= this.max;
    }
    toString() {
        return JSON.stringify(this.stack);
    }
}
/**
 * Namespace
 *
 * A Namespace object associates symbols with names, and resolves references
 * to them.  They are nested; when a symbol cannot be resolved in the current
 * namespace, it's passed to the parent namespace which tries to resolve it.
 *
 * While these namespaces, structurally, form a tree, at the moment we only
 * actually support one level of nesting.  There is a global namespace associated
 * with a whole Project, and a child namespace for each source sheet within the
 * project.  Project sources are currently assumed to be flat: that is to say,
 * there's nothing like a "directory" or "nested module" structure at the moment.
 * (The reason for that is that we conceptualize a project as being composed
 * primarily within a spreadsheet editor like Google Sheets or Excel, and there
 * is no metaphor within a spreadsheet by which worksheets are grouped in a
 * directory-like structure.  From the POV of the spreadsheet user, worksheets
 * are unordered and not hierarchically structured, and so likewise Gramble
 * project source files are unordered and not hierarchically structured, too.)
 */
class Namespace {
    constructor(symbols = {}) {
        this.symbols = symbols;
        this.parent = undefined;
        this.childNamespaces = {};
        this.requiredNamespaces = new Set();
    }
    hasSymbol(name) {
        return name in this.symbols;
    }
    addSymbol(name, state) {
        if (name in this.symbols) {
            throw new Error(`Redefining symbol ${name}`);
        }
        this.symbols[name] = state;
    }
    allSymbols() {
        const result = Object.keys(this.symbols);
        for (const namespaceName in this.childNamespaces) {
            const childNamespace = this.childNamespaces[namespaceName];
            for (const symbol of childNamespace.allSymbols()) {
                result.push(`${namespaceName}.${symbol}`);
            }
        }
        return result;
    }
    addNamespace(name, namespace) {
        if (name in this.childNamespaces) {
            throw new Error(`Redefining namespace ${name}`);
        }
        this.childNamespaces[name] = namespace;
        namespace.parent = this;
    }
    getNamePieces(namePieces) {
        if (namePieces.length == 1 && namePieces[0] in this.symbols) {
            return this.symbols[namePieces[0]];
        }
        if (namePieces[0] in this.childNamespaces) {
            const remainder = namePieces.slice(1);
            return this.childNamespaces[namePieces[0]].getNamePieces(remainder);
        }
        if (this.parent != undefined) {
            return this.parent.getNamePieces(namePieces);
        }
        return undefined;
    }
    get(name) {
        const pieces = name.split(".");
        return this.getNamePieces(pieces);
    }
    /**
     * When an EmbedState is constructed, it needs to "register" the symbol
     * name it is going to want later, so that we can (if necessary) load and
     * parse the source file that contains that symbol.
     */
    register(symbolName) {
        const pieces = symbolName.split(".");
        if (pieces.length == 1) {
            return;
        }
        if (pieces.length > 2) {
            // At some point we may want to allow registration of
            // symbols with nested namespaces, but right now that's
            // a whole can of worms.
            throw new Error(`${symbolName} is not a valid reference, ` +
                " because nested namespaces (e.g. X.Y.Z) are not currently supported.");
        }
        if (this.parent == undefined) {
            // I don't think this can actually happen.
            throw new Error("Something strange happened; trying to register " +
                "a symbol name in the global namespace");
        }
        this.parent.requiredNamespaces.add(pieces[0]);
    }
}
exports.Namespace = Namespace;
/**
 * State
 *
 * State is the basic class of the parser.  It encapsulate the current state of the parse; you can think
 * of it like a pointer into the state graph, if we were to ever construct that graph, which we don't.
 * Rather, a State encapsulates the *information* that that node would have represented.
 *
 * For example, imagine an automaton that recognizes the literal "hello".  We could implement this as an
 * explicit graph of nodes, where each node leads to the next by consuming a particular letter (state 0 leads
 * to 1 by consuming "h", state 1 leads to 2 by consuming "e", etc.).  Our pointer into this graph
 * basically represents two pieces of information, what the word is ("hello") and
 * how far into it we are.  We could also represent this information as an object { text: string, index: number }.
 * Rather than pre-compute each of these nodes, we can say that this object returns (upon matching) another
 * object {text: string, index: number+1}... until we exceed the length of the literal, of course.  This
 * idea, in general, allows us to avoid creating explicit state graphs that can be exponentially huge,
 * although it comes with its own pitfalls.
 *
 * For our purposes, a State is anything that can, upon being queried with a [tape, char] pair,
 * return the possible successor states it can get to.
 *
 * Many kinds of States have to contain references to other states (like an
 * [EmbedState], which lets us embed grammars inside other grammars, keeps a point to the current parse state inside
 * that embedded grammar).  The structure of State components ends up being roughly isomorphic to the grammar that it's
 * parsing (e.g. if the grammar is (A+(B|C)), then the start State that we begin in will have the same structure,
 * it'll be a [ConcatState] of (A and a [UnionState] of (B and C)).  Then as the parse goes on, the State will
 * simplify bit-by-bit, like once A is recognized, the current state will just be one corresponding to B|C, and
 * if B fails, the current state will just be C.
 *
 * For the purposes of the algorithm, there are three crucial functions of States:
 *
 *  * ndQuery(tape, char): What states can this state get to, compatible with a given tape/character
 *  * dQuery(tape, char): Calls ndQuery and rearranges the outputs so that any specific character can
 *                      only lead to one state.
 *  * accepting(): Whether this state is a final state, meaning it constitutes a complete parse
 */
class State {
    /**
     * accepting
     *
     * Whether the state is accepting (i.e. indicates that we have achieved a complete parse).  (What is typically rendered as a "double circle"
     * in a state machine.) Note that, since this is a recursive state machine, getting to an accepting state doesn't necessarily
     * mean that the *entire* grammar has completed; we might just be in a subgrammar.  In this case, accepting() isn't the signal that we
     * can stop parsing, just that we've reached a complete parse within the subgrammar.  For example, [ConcatState] checks whether its left
     * child is accepting() to determine whether to move on and start parsing its right child.
     *
     * @param symbolStack A [CounterStack] that keeps track of symbols, used for preventing infinite recursion.
     * @returns true if the state is an accepting state (i.e., constitutes a complete parse)
     */
    accepting(symbolStack) {
        return false;
    }
    /**
     * deterministic Query
     *
     * Queries the state so that the results are deterministic (or more accurately, so that all returned
     * transitions are disjoint).  (There can still be multiple results; when we query ANY:ANY, for example.)
     *
     * This looks a bit complicated (and it kind of is) but what it's doing is handing off the query to
     * ndQuery, then combining results so that there's no overlap between the tokens.  For example, say ndQuery yields
     * two tokens X and Y, and they have no intersection.  Then we're good, we just yield those.  But if they
     * do have an intersection, we need to return three paths:
     *
     *    X&Y (leading to the UnionState of the states X and Y would have led to)
     *    X-Y (leading to the state X would have led to)
     *    Y-X (leading to the state Y would have led to)
     *
     * @param tape A Tape object identifying the name/type/vocabulary of the relevant tape
     * @param target A Token identifying what characters we need to match
     * @param symbolStack A [CounterStack] that keeps track of symbols (for embedding grammars), used for preventing infinite recursion
     * @returns A tuple <tape, match, matched, nextState>, where:
     *      * tape is the tape we matched on,
     *      * match is the intersection of the original target and our match,
     *      * matched is whether we actually made a match or ignored it (for being on the wrong tape)
     *      * nextState is the state the matched transition leads to
     */
    *dQuery(tape, target, symbolStack) {
        var results = [];
        var nextStates = [...this.ndQuery(tape, target, symbolStack)];
        for (var [tape, bits, matched, next] of nextStates) {
            if (tape.numTapes == 0) {
                results.push([tape, bits, matched, next]);
                continue;
            }
            var newResults = [];
            for (var [otherTape, otherBits, otherMatched, otherNext] of results) {
                if (tape.tapeName != otherTape.tapeName) {
                    newResults.push([otherTape, otherBits, otherMatched, otherNext]);
                    continue;
                }
                const intersection = bits.and(otherBits);
                if (!intersection.isEmpty()) {
                    const union = new UnionState(next, otherNext);
                    newResults.push([tape, intersection, matched || otherMatched, union]);
                }
                bits = bits.andNot(intersection);
                otherBits = otherBits.andNot(intersection);
                if (!otherBits.isEmpty()) {
                    newResults.push([otherTape, otherBits, otherMatched, otherNext]);
                }
            }
            results = newResults;
            if (!bits.isEmpty()) {
                results.push([tape, bits, matched, next]);
            }
        }
        yield* results;
    }
    /**
     * Performs a breadth-first traversal of the graph.  This will be the function that most
     * clients will be calling.
     *
     * Note that there's no corresponding "parse" function, only "generate".  To do parses, we
     * join the grammar with a grammar corresponding to the query.  E.g., if we wanted to parse
     * { text: "foo" } in grammar X, we would construct JoinState(LiteralState("text", "foo"), X).
     * The reason for this is that it allows us a diverse collection of query types for free, by
     * choosing an appropriate "query grammar" to join X with.
     *
     * @param [maxRecursion] The maximum number of times the grammar can recurse; for infinite recursion pass Infinity.
     * @param [maxChars] The maximum number of steps any one traversal can take (roughly == the total number of characters
     *                    output to all tapes)
     * @returns a generator of { tape: string } dictionaries, one for each successful traversal.
     */
    *generate(maxRecursion = 4, maxChars = 1000) {
        const allTapes = new tapes_1.TapeCollection();
        this.collectVocab(allTapes, []);
        const initialOutput = new tapes_1.MultiTapeOutput();
        var stateQueue = [[initialOutput, this]];
        var symbolStack = new CounterStack(maxRecursion);
        var chars = 0;
        while (stateQueue.length > 0 && chars < maxChars) {
            var nextQueue = [];
            for (var i = 0; i < stateQueue.length; i++) {
                const [prevOutput, prevState] = stateQueue[i];
                if (prevState.accepting(symbolStack)) {
                    yield* prevOutput.toStrings();
                }
                for (const [tape, c, matched, newState] of prevState.dQuery(allTapes, tapes_1.ANY_CHAR, symbolStack)) {
                    if (!matched) {
                        console.log("Warning, got all the way through without a match");
                        continue;
                    }
                    const nextOutput = prevOutput.add(tape, c);
                    nextQueue.push([nextOutput, newState]);
                }
            }
            stateQueue = nextQueue;
            chars++;
        }
    }
    /**
     * Collects all explicitly mentioned characters in the grammar for all tapes.
     *
     * @param tapes A TapeCollection for holding found characters
     * @param stateStack What symbols we've already collected from, to prevent inappropriate recursion
     * @returns vocab
     */
    collectVocab(tapes, stateStack) { }
}
exports.State = State;
/**
 * Abstract base class for both LiteralState and AnyCharState,
 * since they share the same query algorithm template.
 *
 * In order to implement TextState, a descendant class must implement
 * firstToken() (giving the first token that needs to be matched) and
 * successor() (returning the state to which we would translate upon successful
 * matching of the token).
 */
class TextState extends State {
    constructor(tapeName) {
        super();
        this.tapeName = tapeName;
    }
    *ndQuery(tape, target, symbolStack) {
        const matchedTape = tape.matchTape(this.tapeName);
        if (matchedTape == undefined) {
            yield [tape, target, false, this];
            return;
        }
        if (this.accepting(symbolStack)) {
            return;
        }
        const bits = this.firstToken(matchedTape);
        const result = matchedTape.match(bits, target);
        const nextState = this.successor();
        yield [matchedTape, result, true, nextState];
    }
}
/**
 * The state that recognizes/emits any character on a specific tape;
 * implements the "dot" in regular expressions.
 */
class AnyCharState extends TextState {
    get id() {
        return `${this.tapeName}:(ANY)`;
    }
    firstToken(tape) {
        return tape.any();
    }
    successor() {
        return new TrivialState();
    }
}
exports.AnyCharState = AnyCharState;
/**
 * Recognizese/emits a literal string on a particular tape.
 * Inside, it's just a string like "foo"; upon successfully
 * matching "f" we construct a successor state looking for
 * "oo", and so on.
 *
 * The first time we construct a LiteralState, we just pass in
 * the text argument, and leave tokens empty.  (This is because,
 * at the initial point of construction of a LiteralState, we
 * don't know what the total character vocabulary of the grammar is
 * yet, and thus can't tokenize it into Tokens yet.)  On subsequent
 * constructions, like in successor(), we've already tokenized,
 * so we pass the remainder of the tokens into the tokens argument.
 * It doesn't really matter what we pass into text in subsequent
 * constructions, it's not used except for debugging, so we just pass
 * in the original text.
 */
class LiteralState extends TextState {
    constructor(tape, text, tokens = []) {
        super(tape);
        this.text = text;
        this.tokens = tokens;
    }
    get id() {
        return `${this.tapeName}:${this.text}[${this.text.length - this.tokens.length}]`;
    }
    accepting(symbolStack) {
        return this.tokens.length == 0;
    }
    collectVocab(tapes, stateStack) {
        this.tokens = tapes.tokenize(this.tapeName, this.text);
    }
    firstToken(tape) {
        return this.tokens[0];
    }
    successor() {
        const newTokens = this.tokens.slice(1);
        const newText = this.text;
        return new LiteralState(this.tapeName, newText, newTokens);
    }
}
exports.LiteralState = LiteralState;
/**
 * Recognizes the empty grammar.  This is occassionally
 * useful in implementing other states (e.g. when
 * you need a state that's accepting but won't go anywhere).
 */
class TrivialState extends State {
    constructor() {
        super();
    }
    get id() {
        return "0";
    }
    accepting(symbolStack) {
        return true;
    }
    *ndQuery(tape, target, symbolStack) { }
}
exports.TrivialState = TrivialState;
/**
 * The abstract base class of all States with two state children
 * (e.g. [JoinState], [ConcatState], [UnionState]).
 * States that conceptually might have infinite children (like Union)
 * we treat as right-recursive binary (see for
 * example the helper function [Uni] which converts lists of
 * states into right-braching UnionStates).
 */
class BinaryState extends State {
    constructor(child1, child2) {
        super();
        this.child1 = child1;
        this.child2 = child2;
    }
    collectVocab(tapes, stateStack) {
        this.child1.collectVocab(tapes, stateStack);
        this.child2.collectVocab(tapes, stateStack);
    }
    get id() {
        return `${this.constructor.name}(${this.child1.id},${this.child2.id})`;
    }
    accepting(symbolStack) {
        return this.child1.accepting(symbolStack) && this.child2.accepting(symbolStack);
    }
}
/**
 * ConcatState represents the current state in a concatenation A+B of two grammars.  It
 * is a [BinaryState], meaning it has two children; sequences ABCDEF are constructed as
 * A+(B+(C+(D+(E+F)))).
 *
 * The one thing that makes ConcatState a bit tricky is that they're the only part of the grammar
 * where there is a precedence order, which in a naive implementation can lead to a deadlock situation.
 * For example, if we have ConcatState(LiteralState("A","a"), LiteralState("B","b")), then the material
 * on tape A needs to be emitted/matched before the material on tape B.  But then consider the opposite,
 * ConcatState(LiteralState("B","b"), LiteralState("A","a")).  That grammar describes the same database,
 * but looks for the material in opposite tape order.  If we join these two, the first is emitting on A and
 * waiting for a match, but the second can't match it because it'll only get there later.  There are several
 * possible solutions for this, but the simplest by far is to implement ConcatState so that it can always emit/match
 * on any tape that any of its children refer to.  Basically, it goes through its children, and if child1
 * returns but doesn't match (meaning it doesn't care about tape T), it asks child2.  Then it returns the
 * appropriate ConcatState consisting of the unmatched material.
 */
class ConcatState extends BinaryState {
    *ndQuery(tape, target, symbolStack) {
        // We can yield from child2 if child1 is accepting, OR if child1 doesn't care about the requested tape,
        // but if child1 is accepting AND doesn't care about the requested tape, we don't want to yield twice;
        // that leads to duplicate results.  yieldedAlready is how we keep track of that.
        var yieldedAlready = false;
        for (const [c1tape, c1text, c1matched, c1next] of this.child1.dQuery(tape, target, symbolStack)) {
            if (c1matched) {
                yield [c1tape, c1text, c1matched, new ConcatState(c1next, this.child2)];
                continue;
            }
            // child1 not interested in the requested tape, the first character on the tape must be
            // (if it exists at all) in child2.
            for (const [c2tape, c2text, c2matched, c2next] of this.child2.dQuery(tape, target, symbolStack)) {
                yield [c2tape, c2text, c2matched, new ConcatState(this.child1, c2next)];
                yieldedAlready = true;
            }
        }
        if (!yieldedAlready && this.child1.accepting(symbolStack)) {
            yield* this.child2.dQuery(tape, target, symbolStack);
        }
    }
}
exports.ConcatState = ConcatState;
/**
 * UnionStates are very simple, they just have a left child and a right child,
 * and upon querying they yield from the first and then yield from the second.
 *
 * So note that UnionStates are only around initally; they don't construct
 * successor UnionStates, their successors are just the successors of their children.
 */
class UnionState extends BinaryState {
    accepting(symbolStack) {
        return this.child1.accepting(symbolStack) || this.child2.accepting(symbolStack);
    }
    *ndQuery(tape, target, symbolStack) {
        yield* this.child1.dQuery(tape, target, symbolStack);
        yield* this.child2.dQuery(tape, target, symbolStack);
    }
}
exports.UnionState = UnionState;
/**
 * SemijoinState
 *
 * This implements the left semijoin.  The full join is the priority union of the left and right
 * semijoins.

export class SemijoinState extends BinaryState {

    public *ndQuery(tape: string,
        target: BitSet,
        symbolStack: CounterStack,
        vocab: Vocab): Gen<[string, BitSet, boolean, State]> {

        for (const [c1tape, c1target, c1matched, c1next] of this.child1.dQuery(tape, target, symbolStack, vocab)) {

            if (c1tape == NO_TAPE) {
                yield [c1tape, c1target, c1matched, Join(c1next, this.child2)];
                continue;
            }
            
            for (const [c2tape, c2target, c2matched, c2next] of this.child2.dQuery(c1tape, c1target, symbolStack, vocab)) {
                yield [c2tape, c2target, c1matched || c2matched, Join(c1next, c2next)];
            }
        }
    }

}

 */
/**
 * Convenience function that takes two generators, and yields from the
 * second only if it can't yield from the first.  This is handy in situations
 * like the implementation of join, where if we yielded from both we would
 * constantly be yielding the same states.
 */
function* iterPriorityUnion(iter1, iter2) {
    var yieldedAlready = false;
    for (const output of iter1) {
        yield output;
        yieldedAlready = true;
    }
    if (!yieldedAlready) {
        yield* iter2;
    }
}
/**
 * The JoinState implements the natural join (in the relational algebra sense)
 * for two automata. This is a fundamental operation in the parser, as we implement
 * parsing as a traversal of a corresponding join state.  You can think of join(X,Y)
 * as yielding from the intersection of X and Y on tapes that they share, and the product
 * on tapes that they don't share.
 *
 * The algorithm is simplified by the fact that join(X, Y) can be implemented the union
 * of the left and right semijoins (or, put another way, the left semijoin of (X,Y) and
 * the left semijoin of (Y,X)).  The left semijoin (X,Y) just consists of querying X, then
 * taking the result of that and querying Y, and yielding the result of that.
 *
 * Because the ordinary union of these would lead to the same states twice, we use the
 * priority union instead.
 */
class JoinState extends BinaryState {
    *ndQueryLeft(tape, target, c1, c2, symbolStack) {
        for (const [c1tape, c1target, c1matched, c1next] of c1.dQuery(tape, target, symbolStack)) {
            if (c1tape.numTapes == 0) {
                // c1 contained a ProjectionState that hides the original tape; move on without
                // asking c2 to match anything.
                yield [c1tape, c1target, c1matched, new JoinState(c1next, c2)];
                continue;
            }
            for (const [c2tape, c2target, c2matched, c2next] of c2.dQuery(c1tape, c1target, symbolStack)) {
                yield [c2tape, c2target, c1matched || c2matched, new JoinState(c1next, c2next)];
            }
        }
    }
    *ndQuery(tape, target, symbolStack) {
        const leftJoin = this.ndQueryLeft(tape, target, this.child1, this.child2, symbolStack);
        const rightJoin = this.ndQueryLeft(tape, target, this.child2, this.child1, symbolStack);
        yield* iterPriorityUnion(leftJoin, rightJoin);
    }
}
exports.JoinState = JoinState;
/**
 * Abstract base class for states with only one child state.  Typically, UnaryStates
 * handle queries by forwarding on the query to their child, and doing something special
 * before or after.  For example, [EmbedStates] do a check a stack of symbol names to see
 * whether they've passed the allowable recursion limit, and [RenameState]s change what
 * the different tapes are named.
 *
 * Note that [UnaryState.child] is a getter, rather than storing an actual child.  This is
 * because [EmbedState] doesn't actually store its child, it grabs it from a symbol table instead.
 * (If it tried to take it as a param, or construct it during its own construction, this wouldn't
 * work, because the EmbedState's child can be that EmbedState itself.)
 */
class UnaryState extends State {
    get id() {
        return `${this.constructor.name}(${this.child.id})`;
    }
    collectVocab(tapes, stateStack) {
        this.child.collectVocab(tapes, stateStack);
    }
    accepting(symbolStack) {
        return this.child.accepting(symbolStack);
    }
}
/**
 * RepetitionState implements the Kleene star, plus, question mark, and in general
 * repetitions between N and M times.  (E.g. x{2,3} matching x two or three times.)
 *
 * The slightly odd part of implementing RepetitionState, compared to other states, is that only
 * RepetitionState needs to remember the initial state of its child.  That is, all the
 * other UnaryStates only keep track of the current state of the child parse.  RepetitionState,
 * however, needs to be able to *restart* the child.  To do that, it
 * keeps around the original child state, so that it can construct its appropriate successor
 * when the current child state is finished.
 *
 * Note that the below algorithm is fairly similar to [ConcatState]; in the future
 * we might want to partially unify these the way we did [LiteralState] and [AnyCharState].
 */
class RepetitionState extends UnaryState {
    constructor(child, minRepetitions = 0, maxRepetitions = Infinity, index = 0, initialChild) {
        super();
        this.child = child;
        this.minRepetitions = minRepetitions;
        this.maxRepetitions = maxRepetitions;
        this.index = index;
        this.initialChild = initialChild;
    }
    collectVocab(tapes, stateStack) {
        this.initialChild.collectVocab(tapes, stateStack);
    }
    accepting(symbolStack) {
        return this.index >= this.minRepetitions &&
            this.index <= this.maxRepetitions &&
            this.child.accepting(symbolStack);
    }
    *ndQuery(tape, target, symbolStack) {
        if (this.index > this.maxRepetitions) {
            return;
        }
        var yieldedAlready = false;
        if (this.child.accepting(symbolStack)) {
            // we just started, or the child is accepting, so our successor increases its index
            // and starts again with child.
            const successor = new RepetitionState(this.initialChild, this.minRepetitions, this.maxRepetitions, this.index + 1, this.initialChild);
            for (const result of successor.dQuery(tape, target, symbolStack)) {
                yield result;
                yieldedAlready = true;
            }
        }
        if (yieldedAlready) {
            return;
        }
        for (const [childTape, childText, childMatched, childNext] of this.child.dQuery(tape, target, symbolStack)) {
            if (!childMatched) { // child doesn't care, neither do we
                yield [childTape, childText, false, this];
                continue;
            }
            yield [childTape, childText, childMatched, new RepetitionState(childNext, this.minRepetitions, this.maxRepetitions, this.index, this.initialChild)];
        }
    }
}
exports.RepetitionState = RepetitionState;
/**
 * The parser that handles arbitrary subgrammars referred to by a symbol name; this is what makes
 * recursion possible.
 *
 * Like most such implementations, EmbedState's machinery serves to delay the construction of a child
 * state, since this child may be the EmbedState itself, or refer to this EmbedState by indirect recursion.
 * So instead of having a child at the start, it just has a symbol name and a reference to a symbol table.
 *
 * The successor states of the EmbedState may have an explicit child, though: the successors of that initial
 * child state.  (If we got the child from the symbol table every time, we'd just end up trying to match its
 * first letter again and again.)  We keep track of that through the _child member, which is initially undefined
 * but which we specify when constructing EmbedState's successor.
 */
class EmbedState extends UnaryState {
    constructor(symbolName, namespace, _child = undefined) {
        super();
        this.symbolName = symbolName;
        this.namespace = namespace;
        this._child = _child;
        // need to register our symbol name with the namespace, in case
        // the referred-to symbol is defined in a file we haven't yet loaded.
        namespace.register(symbolName);
    }
    get id() {
        return `${this.constructor.name}(${this.symbolName})`;
    }
    collectVocab(tapes, stateStack) {
        if (stateStack.indexOf(this.symbolName) != -1) {
            return;
        }
        const newStack = [...stateStack, this.symbolName];
        this.child.collectVocab(tapes, newStack);
    }
    get child() {
        if (this._child == undefined) {
            this._child = this.namespace.get(this.symbolName);
            if (this._child == undefined) {
                throw new Error(`Cannot find symbol name ${this.symbolName}`);
            }
        }
        return this._child;
    }
    accepting(symbolStack) {
        if (symbolStack.exceedsMax(this.symbolName)) {
            return false;
        }
        return this.child.accepting(symbolStack.add(this.symbolName));
    }
    *ndQuery(tape, target, symbolStack) {
        if (symbolStack.exceedsMax(this.symbolName)) {
            return;
        }
        symbolStack = symbolStack.add(this.symbolName);
        for (const [childchildTape, childTarget, childMatched, childNext] of this.child.ndQuery(tape, target, symbolStack)) {
            const successor = new EmbedState(this.symbolName, this.namespace, childNext);
            yield [childchildTape, childTarget, childMatched, successor];
        }
    }
}
exports.EmbedState = EmbedState;
/**
 * A state that implements Projection in the sense of relational algebra, only
 * exposing a subset of fields (read: tapes) of its child state.
 *
 * Note that the child state itself still has and operates on those fields/tapes.
 * For example, the Projection of a join can still fail when there's a conflict regarding
 * field T, even if the Projection hides field T.  We can think of the Project as encapsulating
 * the set of fields/tapes such that only a subset of its fields are exposed to the outside,
 * rather than removing those fields/tapes.
 */
class ProjectionState extends UnaryState {
    constructor(child, tapeRestriction) {
        super();
        this.child = child;
        this.tapeRestriction = tapeRestriction;
    }
    *ndQuery(tape, target, symbolStack) {
        if (tape.tapeName != "__ANY_TAPE__" && !this.tapeRestriction.has(tape.tapeName)) {
            // if it's not a tape we care about, go nowhere
            yield [tape, target, false, this];
        }
        for (var [childTape, childTarget, childMatch, childNext] of this.child.dQuery(tape, target, symbolStack)) {
            if (childTape.tapeName != "__ANY_TAPE__" && !this.tapeRestriction.has(childTape.tapeName)) {
                // even if our child yields content on a restricted tape, 
                // we don't let our own parent know about it
                childTape = new tapes_1.TapeCollection();
                childTarget = tapes_1.NO_CHAR;
            }
            yield [childTape, childTarget, childMatch, new ProjectionState(childNext, this.tapeRestriction)];
        }
    }
}
exports.ProjectionState = ProjectionState;
/**
 * Implements the Rename operation from relational algebra.
 *
 */
class RenameState extends UnaryState {
    constructor(child, fromTape, toTape) {
        super();
        this.child = child;
        this.fromTape = fromTape;
        this.toTape = toTape;
    }
    collectVocab(tapes, stateStack) {
        tapes = new tapes_1.RenamedTape(tapes, this.fromTape, this.toTape);
        this.child.collectVocab(tapes, stateStack);
    }
    *ndQuery(tape, target, symbolStack) {
        if (tape.tapeName == this.toTape || tape.tapeName == "__ANY_TAPE__") {
            tape = new tapes_1.RenamedTape(tape, this.fromTape, this.toTape);
        }
        for (var [childTape, childTarget, childMatched, childNext] of this.child.dQuery(tape, target, symbolStack)) {
            //assert(childTape instanceof RenamedTape);
            const trueChildTape = childTape.child;
            yield [trueChildTape, childTarget, childMatched, new RenameState(childNext, this.fromTape, this.toTape)];
        }
    }
}
exports.RenameState = RenameState;
/**
 * Negation leads to problems, which is why many languages' regex modules
 * don't allow negation of arbitrary parts of the grammar, only of operators
 * like lookahead where negation is well-behaved.  However, negated parsers
 * are genuinely used in linguistic programming (for, e.g., phonological
 * constraints) and so we should have them.
 *
 * In general, we negate an automaton by:
 *
 *  * turning all accepting states into non-accepting states and vice-versa,
 *    which we can do easily in the accepting() function.
 *
 *  * introducing a new accepting state that the parse goes to if it "falls off"
 *    the automaton (e.g., if the automaton recognizes "foo", and get "q", then
 *    that's an acceptable negation, you need a state to accept that).  Here
 *    we implement this state by having "undefined" in place of a child.
 *
 * There are two snags that come up when (as we do) you try to avoid actually
 * constructing the graph.
 *
 * In general, negation of an automaton requires two things:
 *
 *  * the automaton is deterministic; we handle that by calling dQuery instead
 *    of ndQuery.
 *
 *  * the automaton to be negated doesn't have loops that are always
 *    accepting (because those become loops that are never accepting,
 *    and the traversal of them can go on forever).  Or put another way,
 *    a negated automaton can have useless states that will never lead
 *    to an output, that would be properly pruned in a concrete & determinized
 *    automaton, but that we can't be sure of when we evaluate the graph
 *    lazily because it's effectively "looking into the future".
 *
 * So the second one effectively requires construction and determinization of the
 * graph, but that can take enormous space... and because this is intended as a
 * programming language that is kind to beginners, we want a well-formed grammar to always
 * successfully compile.  So we're going to probably end up with a patchwork of partial solutions,
 * and beyond that guarantee that the traversal halts by simply capping the
 * maximum number of steps the automaton can take.  Not ideal, but should cover
 * most reasonable use cases.
 */
class NegationState extends State {
    constructor(child) {
        super();
        this.child = child;
    }
    get id() {
        if (this.child == undefined) {
            return "~()";
        }
        return `~(${this.child.id})`;
    }
    collectVocab(tapes, stateStack) {
        if (this.child == undefined) {
            return;
        }
        this.child.collectVocab(tapes, stateStack);
    }
    accepting(symbolStack) {
        if (this.child == undefined) {
            return true;
        }
        return !this.child.accepting(symbolStack);
    }
    *ndQuery(tape, target, symbolStack) {
        if (this.child == undefined) { // we've can't possibly match the child, so we're basically .* from now on
            yield [tape, target, true, this];
            return;
        }
        var remainder = new tapes_1.Token(target.bits.clone());
        for (const [childTape, childText, childMatched, childNext] of this.child.dQuery(tape, target, symbolStack)) {
            remainder = remainder.andNot(childText);
            yield [childTape, childText, childMatched, new NegationState(childNext)];
        }
        yield [tape, remainder, true, new NegationState(undefined)];
    }
}
exports.NegationState = NegationState;
/* CONVENIENCE FUNCTIONS FOR CONSTRUCTING GRAMMARS */
function Lit(tier, text) {
    return new LiteralState(tier, text);
}
exports.Lit = Lit;
function Literalizer(tier) {
    return function (text) {
        return Lit(tier, text);
    };
}
exports.Literalizer = Literalizer;
function Seq(...children) {
    if (children.length == 0) {
        throw new Error("Sequences must have at least 1 child");
    }
    if (children.length == 1) {
        return children[0];
    }
    return new ConcatState(children[0], Seq(...children.slice(1)));
}
exports.Seq = Seq;
function Uni(...children) {
    if (children.length == 0) {
        throw new Error("Unions must have at least 1 child");
    }
    if (children.length == 1) {
        return children[0];
    }
    return new UnionState(children[0], Uni(...children.slice(1)));
}
exports.Uni = Uni;
/*
export function Pri(...children: State[]): State {
    return new PriorityUnionState(children);
} */
function Join(child1, child2) {
    return new JoinState(child1, child2);
    /* const left = new SemijoinState(child1, child2);
    const right = new SemijoinState(child2, child1);
    return new PriorityUnionState([left, right]); */
}
exports.Join = Join;
function Not(child) {
    return new NegationState(child);
}
exports.Not = Not;
function Emb(symbolName, namespace) {
    return new EmbedState(symbolName, namespace);
}
exports.Emb = Emb;
function Proj(child, ...tiers) {
    return new ProjectionState(child, new Set(tiers));
}
exports.Proj = Proj;
function Rename(child, fromTier, toTier) {
    return new RenameState(child, fromTier, toTier);
}
exports.Rename = Rename;
function Any(tier) {
    return new AnyCharState(tier);
}
exports.Any = Any;
function Rep(child, minReps = 0, maxReps = Infinity) {
    return new RepetitionState(new TrivialState(), minReps, maxReps, 0, child);
}
exports.Rep = Rep;
function Empty() {
    return new TrivialState();
}
exports.Empty = Empty;
function Maybe(child) {
    return Uni(child, Empty());
}
exports.Maybe = Maybe;

},{"./tapes":5}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RenamedTape = exports.TapeCollection = exports.StringTape = exports.NO_CHAR = exports.ANY_CHAR = exports.Token = exports.Tape = exports.MultiTapeOutput = void 0;
const bitset_1 = require("bitset");
/**
 * Outputs
 *
 * The outputs of this algorithm are kept as tries, since that's the natural
 * shape of a set of outputs from a non-deterministic parsing algorithm.  (E.g., if
 * we've already output "fooba", and at the next state we could either output "r" or
 * "z", then just having "r" and "z" point to that previous output is both less effort
 * and less space than copying it twice and concatenating it.  Especially if "z" ends
 * up being a false path and we end up discarding it; that would mean we had copied/
 * concatenated for nothing.)
 *
 * It used to be that we just kept every tape output in one trie (like an output
 * might have characters on different tapes interleaved).  That's fine when it's guaranteed
 * that every concatenation succeeds (like for string concatenation), but when it's something like
 * flag concatenation (which can fail), that means we have to search backwards through the trie
 * to find the most recent output on the relevant tape.  So now, outputs are segregated by tape.
 * A SingleTapeOutput represents the output on a given tape, and then there's a separate object that
 * represents a collection of them (by keeping a pointer to the appropriate output along each tape).
 *
 * TODO: There's currently some conceptual duplication between these Outputs and the various Tape
 * objects, which store *information* about tapes (like their names and vocabs) without storing any
 * actual outputs onto those tapes.  Each Output is associated with a particular Tape, there are collections
 * of both corresponding to each other, etc.  We should eventually refactor these so that there's only
 * one hierarchy of objects, "tapes" to which you can write and also know their own information.
 */
class SingleTapeOutput {
    constructor(tape, token, prev = undefined) {
        this.tape = tape;
        this.token = token;
        this.prev = prev;
    }
    add(tape, token) {
        if (tape.tapeName != this.tape.tapeName) {
            throw new Error(`Incompatible tapes: ${tape.tapeName}, ${this.tape.tapeName}`);
        }
        return new SingleTapeOutput(tape, token, this);
    }
    *getStrings() {
        var prevStrings = [""];
        if (this.prev != undefined) {
            prevStrings = [...this.prev.getStrings()];
        }
        for (const s of prevStrings) {
            for (const c of this.tape.fromBits(this.tape.tapeName, this.token.bits)) {
                yield s + c;
            }
        }
    }
}
/**
 * Multi tape output
 *
 * This stores a collection of outputs on different tapes, by storing a collection of pointers to them.
 * When you add a <tape, char> pair to it (say, <text,b>), you return a new MultiTapeOutput that now
 * points to a new SingleTapeOutput corresponding to "text" -- the new one with "b" added -- and keep
 * all the old pointers the same.
 */
class MultiTapeOutput {
    constructor() {
        this.singleTapeOutputs = new Map();
    }
    add(tape, token) {
        if (tape.numTapes == 0) {
            return this;
        }
        const result = new MultiTapeOutput();
        result.singleTapeOutputs = new Map(this.singleTapeOutputs);
        const prev = this.singleTapeOutputs.get(tape.tapeName);
        const newTape = new SingleTapeOutput(tape, token, prev);
        result.singleTapeOutputs.set(tape.tapeName, newTape);
        return result;
    }
    toStrings() {
        var results = [{}];
        for (const [tapeName, tape] of this.singleTapeOutputs) {
            var newResults = [];
            for (const str of tape.getStrings()) {
                for (const result of results) {
                    const newResult = Object.assign({}, result);
                    newResult[tapeName] = str;
                    newResults.push(newResult);
                }
            }
            results = newResults;
        }
        return results;
    }
}
exports.MultiTapeOutput = MultiTapeOutput;
/**
 * Tape
 *
 * This encapsulates information about a tape or set of tapes (like what its name is, what
 * its possible vocabulary is, what counts as concatenation and matching, etc.).  It doesn't,
 * however, encapsulate a tape in the sense of keeping a sequence of character outputs; that
 * would be encapsulated by the Output objects above.
 *
 * TODO: Refactor Outputs and Tapes so that they're all one kind of object, because currently
 * we're keeping a duplicated hierarchy in which the Output and Tape class hierarchies mirror
 * each other.
 */
class Tape {
    add(str1, str2) {
        throw new Error(`Not implemented`);
    }
    match(str1, str2) {
        throw new Error(`Not implemented`);
    }
    any() {
        throw new Error(`Not implemented`);
    }
    *plus(tapeName, other) {
        throw new Error(`Not implemented`);
    }
    *times(tapeName, other) {
        throw new Error(`Not implemented`);
    }
    tokenize(tapeName, str) {
        throw new Error(`Not implemented`);
    }
}
exports.Tape = Tape;
/**
 * Token
 *
 * This encapsulates a token, so that parsers need not necessarily know how, exactly, a token is implemented.
 * Right now we only have one kind of token, strings implemented as BitSets, but eventually this should be an
 * abstract class with (e.g.) StringToken, maybe FlagToken, ProbToken and/or LogToken (for handling weights),
 * etc.
 *
 */
class Token {
    constructor(bits) {
        this.bits = bits;
    }
    and(other) {
        return new Token(this.bits.and(other.bits));
    }
    andNot(other) {
        return new Token(this.bits.andNot(other.bits));
    }
    isEmpty() {
        return this.bits.isEmpty();
    }
}
exports.Token = Token;
exports.ANY_CHAR = new Token(new bitset_1.BitSet().flip());
exports.NO_CHAR = new Token(new bitset_1.BitSet());
/**
 * A tape containing strings; the basic kind of tape and (right now) the only one we really use.
 * (Besides a TapeCollection, which implements Tape but is really used for a different situation.)
 */
class StringTape extends Tape {
    constructor(tapeName, current = undefined, prev = undefined, strToIndex = new Map(), indexToStr = new Map()) {
        super();
        this.tapeName = tapeName;
        this.current = current;
        this.prev = prev;
        this.strToIndex = strToIndex;
        this.indexToStr = indexToStr;
    }
    get numTapes() {
        return 1;
    }
    /*
    public *plus(tapeName: string, other: BitSet): Gen<Tape> {
        if (tapeName != this.tapeName) {
            return;
        }
        yield new StringTape(this.tapeName, other,
                            this, this.strToIndex, this.indexToStr);
    }

    public *times(tapeName: string, other: BitSet): Gen<Tape> {
        if (tapeName != this.tapeName) {
            return;
        }
        const result = this.current.and(other);
        if (result.isEmpty()) {
            return;
        }
        yield new StringTape(this.tapeName, result, this.prev,
                            this.strToIndex, this.indexToStr);
    }
    */
    append(token) {
        return new StringTape(this.tapeName, token, this, this.strToIndex, this.indexToStr);
    }
    *getStrings() {
        var prevStrings = [""];
        if (this.prev != undefined) {
            prevStrings = [...this.prev.getStrings()];
        }
        if (this.current == undefined) {
            yield* prevStrings;
            return;
        }
        for (const s of prevStrings) {
            for (const c of this.fromBits(this.tapeName, this.current.bits)) {
                yield s + c;
            }
        }
    }
    matchTape(tapeName) {
        return (tapeName == this.tapeName) ? this : undefined;
    }
    any() {
        return new Token(new bitset_1.BitSet().flip());
    }
    add(str1, str2) {
        return [str1 + str2];
    }
    match(str1, str2) {
        return new Token(str1.bits.and(str2.bits));
    }
    tokenize(tapeName, str) {
        if (tapeName != this.tapeName) {
            throw new Error(`Trying to add a character from tape ${tapeName} to tape ${this.tapeName}`);
        }
        const results = [];
        for (const c of str.split("")) {
            var index = this.strToIndex.get(c);
            if (index == undefined) {
                index = this.registerToken(c);
            }
            const newToken = new Token(this.toBits(tapeName, c));
            results.push(newToken);
        }
        return results;
    }
    registerToken(token) {
        const index = this.strToIndex.size;
        this.strToIndex.set(token, index);
        this.indexToStr.set(index, token);
        return index;
    }
    toBits(tapeName, char) {
        if (tapeName != this.tapeName) {
            throw new Error(`Trying to get bits on tape ${tapeName} from tape ${this.tapeName}`);
        }
        const result = new bitset_1.BitSet();
        const index = this.strToIndex.get(char);
        if (index == undefined) {
            return result;
        }
        result.set(index);
        return result;
    }
    fromBits(tapeName, bits) {
        if (tapeName != this.tapeName) {
            throw new Error(`Trying to get bits on tape ${tapeName} from tape ${this.tapeName}`);
        }
        const result = [];
        for (const index of bits.toArray()) {
            const char = this.indexToStr.get(index);
            if (char == undefined) {
                break; // this is crucial, because BitSets are infinite and if
                // one was created by inversion, it could iterate forever here.
            }
            result.push(char);
        }
        return result;
    }
}
exports.StringTape = StringTape;
/**
 * A tape containing flags, roughly identical to a "U" flag in XFST/LEXC.
 * This uses a different method for "add" than a normal string tape; you can
 * always concatenate a string to a string, but trying to add a flag to a different
 * flag will fail.
 *
 * At the moment this isn't used anywhere.
 */
class FlagTape extends StringTape {
    add(oldResults, newResult) {
        if (oldResults == "" || oldResults == newResult) {
            return [newResult];
        }
        return [];
    }
    tokenize(tapeName, str) {
        var index = this.strToIndex.get(str);
        if (index == undefined) {
            index = this.registerToken(str);
        }
        return [new Token(this.toBits(tapeName, str))];
    }
}
/**
 * This contains information about all the tapes.  When we do a "free query" in the state machine,
 * what we're saying is "match anything on any tape".  Eventually, something's going to match on a particular
 * tape, so we have to have that information handy for all tapes.  (That is to say, something like a LiteralState
 * knows what tape it cares about only as a string, say, "text".  In a constrained query, we pass in a normal StringTape
 * object, and if it's the "text" tape, matchTape("text") succeeds and returns itself, and if it doesn't,
 * matchTape("text") fails.  In a free query, we pass in one of these objects, and when we matchTape("text"), we
 * return the StringTape corresponding to "text".  That's why we need an object that collects all of them, so we
 * can return the appropriate one when it's needed.)
 */
class TapeCollection extends Tape {
    constructor() {
        super(...arguments);
        this.tapes = new Map();
    }
    get numTapes() {
        return this.tapes.size;
    }
    addTape(tape) {
        this.tapes.set(tape.tapeName, tape);
    }
    get tapeName() {
        if (this.tapes.size == 0) {
            return "__NO_TAPE__";
        }
        return "__ANY_TAPE__";
    }
    tokenize(tapeName, str) {
        var tape = this.tapes.get(tapeName);
        if (tape == undefined) {
            tape = new StringTape(tapeName);
            this.tapes.set(tapeName, tape);
        }
        return tape.tokenize(tapeName, str);
    }
    matchTape(tapeName) {
        return this.tapes.get(tapeName);
    }
    toBits(tapeName, char) {
        const tape = this.tapes.get(tapeName);
        if (tape == undefined) {
            throw new Error(`Undefined tape: ${tapeName}`);
        }
        return tape.toBits(tapeName, char);
    }
    fromBits(tapeName, bits) {
        const tape = this.tapes.get(tapeName);
        if (tape == undefined) {
            throw new Error(`Undefined tape: ${tapeName}`);
        }
        return tape.fromBits(tapeName, bits);
    }
}
exports.TapeCollection = TapeCollection;
/**
 * RenamedTapes are necessary for RenameStates to work properly.
 *
 * From the point of view of any particular state, it believes that particular
 * tapes have particular names, e.g. "text" or "gloss".  However, because renaming is
 * an operator of our relational algebra, different states may be referred to by different
 * names in different parts of the grammar.
 *
 * (For example, consider a composition between two FSTS, {"up":"lr", "down":"ll"} and
 * {"up":"ll", "down":"lh"}.  In order to express their composition as a "join", we have to make it so that
 * the first "down" and the second "up" have the same name.  Renaming does that.
 *
 * The simplest way to get renaming, so that each state doesn't have to understand the name structure
 * of the larger grammar, is for RenameStates to wrap tapes in a simple adaptor class that makes it seem
 * as if an existing tape has a new name.  That way, any child of a RenameState can (for example) ask for the
 * vocabulary of the tape it thinks is called "down", even if outside of that RenameState the tape is called
 * "text".
 */
class RenamedTape extends Tape {
    constructor(child, fromTape, toTape) {
        super();
        this.child = child;
        this.fromTape = fromTape;
        this.toTape = toTape;
    }
    get tapeName() {
        return this.child.tapeName;
    }
    get numTapes() {
        return this.child.numTapes;
    }
    any() {
        return this.child.any();
    }
    add(str1, str2) {
        return this.child.add(str1, str2);
    }
    match(str1, str2) {
        return this.child.match(str1, str2);
    }
    adjustTapeName(tapeName) {
        return (tapeName == this.fromTape) ? this.toTape : tapeName;
    }
    matchTape(tapeName) {
        tapeName = this.adjustTapeName(tapeName);
        const newChild = this.child.matchTape(tapeName);
        if (newChild == undefined) {
            return undefined;
        }
        return new RenamedTape(newChild, this.fromTape, this.toTape);
    }
    tokenize(tapeName, str) {
        tapeName = this.adjustTapeName(tapeName);
        return this.child.tokenize(tapeName, str);
    }
    toBits(tapeName, char) {
        tapeName = this.adjustTapeName(tapeName);
        return this.child.toBits(tapeName, char);
    }
    fromBits(tapeName, bits) {
        tapeName = this.adjustTapeName(tapeName);
        return this.child.fromBits(tapeName, bits);
    }
}
exports.RenamedTape = RenamedTape;

},{"bitset":1}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setChain = exports.setIntersection = exports.RGBtoString = exports.HSVtoRGB = exports.meanAngleDeg = void 0;
function sum(a) {
    var s = 0;
    for (var i = 0; i < a.length; i++)
        s += a[i];
    return s;
}
function degToRad(a) {
    return Math.PI / 180 * a;
}
function meanAngleDeg(a) {
    return 180 / Math.PI * Math.atan2(sum(a.map(degToRad).map(Math.sin)) / a.length, sum(a.map(degToRad).map(Math.cos)) / a.length);
}
exports.meanAngleDeg = meanAngleDeg;
function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    r = 0;
    g = 0;
    b = 0;
    switch (i % 6) {
        case 0:
            r = v, g = t, b = p;
            break;
        case 1:
            r = q, g = v, b = p;
            break;
        case 2:
            r = p, g = v, b = t;
            break;
        case 3:
            r = p, g = q, b = v;
            break;
        case 4:
            r = t, g = p, b = v;
            break;
        case 5:
            r = v, g = p, b = q;
            break;
    }
    r = Math.round(r * 255);
    g = Math.round(g * 255);
    b = Math.round(b * 255);
    return [r, g, b];
}
exports.HSVtoRGB = HSVtoRGB;
function RGBtoString(r, g, b) {
    return "#" + r.toString(16) + g.toString(16) + b.toString(16);
}
exports.RGBtoString = RGBtoString;
function setIntersection(s1, s2) {
    return new Set([...s1].filter(i => s2.has(i)));
}
exports.setIntersection = setIntersection;
function setChain(sets) {
    const results = new Set();
    for (const set of sets) {
        for (const item of set) {
            results.add(item);
        }
    }
    return results;
}
exports.setChain = setChain;
class Iter {
    constructor(gen) {
        this.gen = gen;
    }
    next(...args) {
        return this.gen.next(...args);
    }
    return(value) {
        return this.gen.return(value);
    }
    throw(e) {
        return this.throw(e);
    }
    [Symbol.iterator]() {
        return this.gen[Symbol.iterator]();
    }
    map(f) {
        return iter(iterMap(this.gen, f));
    }
    map2nd(f) {
        const gen = this.gen;
        return iter(gen).map(([a, b]) => [a, f(b)]);
    }
    product(other) {
        return iter(iterProduct(this.gen, other));
    }
}
function iter(x) {
    return new Iter(x);
}
function iterChain(iters) {
    return iter(function* () {
        for (const iter of iters) {
            yield* iter;
        }
    }());
}
function iterFail() {
    return iter(function* () { }());
}
function* iterProduct(i1, i2) {
    for (const item1 of i1) {
        for (const item2 of i2) {
            yield [item1, item2];
        }
    }
}
function* iterMap(i, f) {
    for (const item of i) {
        yield f(item);
    }
}

},{}]},{},[3])(3)
});