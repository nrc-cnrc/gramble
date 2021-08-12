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
exports.Hide = exports.Ns = exports.Not = exports.Rename = exports.MatchFrom = exports.MatchDotStar2 = exports.MatchDotStar = exports.MatchDotRep2 = exports.MatchDotRep = exports.MatchDot = exports.Dot = exports.Match = exports.Embed = exports.Null = exports.Epsilon = exports.Rep = exports.Contains = exports.EndsWith = exports.StartsWith = exports.Join = exports.Filter = exports.Intersect = exports.Any = exports.Lit = exports.Maybe = exports.Uni = exports.Seq = exports.Root = exports.AstEmbed = exports.AstNamespace = exports.AstMatch = exports.AstHide = exports.AstNegation = exports.AstRepeat = exports.AstRename = exports.AstUnary = exports.AstContains = exports.AstEndsWith = exports.AstStartsWith = exports.AstFilter = exports.AstJoin = exports.AstIntersection = exports.AstAlternation = exports.AstSequence = exports.AstDot = exports.AstLiteral = exports.AstEpsilon = exports.AstComponent = exports.Expr = exports.CounterStack = void 0;
exports.Replace = void 0;
const derivs_1 = require("./derivs");
Object.defineProperty(exports, "CounterStack", { enumerable: true, get: function () { return derivs_1.CounterStack; } });
Object.defineProperty(exports, "Expr", { enumerable: true, get: function () { return derivs_1.Expr; } });
const tapes_1 = require("./tapes");
const util_1 = require("./util");
/**
 * Abstract syntax tree (AST) components are responsible for the following
 * operations:
 *
 *   * qualifying and resolving symbol names (e.g., figuring out that
 *     a particular reference to VERB refers to, say, the VERB symbol in the
 *     IntransitiveVerbs namespace, and qualifying that reference so that it
 *     uniquely identifies that symbol (e.g. "IntransitiveVerb.VERB")
 *
 *   * working out what tapes a particular component refers to.  This is
 *     necessary for some complex operations (like "startswith embed:X");
 *     it's too early to infer tapes when the sheet is parsed (X might refer
 *     to a symbol that hasn't been parsed at all yet), but it still has to
 *     done before expressions are generated because otherwise we don't
 *     always know what expressions to generate.
 *
 *   * sanity-checking and generating certain errors/warnings, like
 *     whether a symbol X actually has a defined referent, whether a
 *     filter refers to tapes that the component it's filtering doesn't, etc.
 *
 *   * finally, generating the Brzozowski expression corresponding to each
 *     component.
 */
class AstComponent {
    constructor(cell) {
        this.cell = cell;
        this.tapes = undefined;
    }
    /**
     * Collects all explicitly mentioned characters in the grammar for all tapes.
     *
     * @param tapes A TapeCollection for holding found characters
     * @param stack What symbols we've already collected from, to prevent inappropriate recursion
     * @returns vocab
     */
    collectVocab(tapes, stack = []) {
        for (const child of this.getChildren()) {
            child.collectVocab(tapes, stack);
        }
    }
    calculateTapes(stack) {
        if (this.tapes == undefined) {
            const childTapes = this.getChildren().map(s => s.calculateTapes(stack));
            this.tapes = new Set(util_1.flatten(childTapes));
        }
        return this.tapes;
    }
    qualifyNames(nsStack = []) {
        return util_1.flatten(this.getChildren().map(c => c.qualifyNames(nsStack)));
    }
    getAllTapes() {
        const tapes = new tapes_1.TapeCollection();
        this.collectVocab(tapes, []);
        return tapes;
    }
    getRoot() {
        this.qualifyNames();
        const stack = new derivs_1.CounterStack(2);
        const tapes = this.calculateTapes(stack);
        const root = new Root();
        const expr = this.constructExpr(root);
        root.addComponent("__MAIN__", this);
        root.addSymbol("__MAIN__", expr);
        root.addTapes("__MAIN__", tapes);
        return root;
    }
}
exports.AstComponent = AstComponent;
class AstAtomic extends AstComponent {
    getChildren() { return []; }
}
class AstEpsilon extends AstAtomic {
    calculateTapes(stack) {
        if (this.tapes == undefined) {
            this.tapes = new Set();
        }
        return this.tapes;
    }
    constructExpr(ns) {
        return derivs_1.EPSILON;
    }
}
exports.AstEpsilon = AstEpsilon;
class AstNull extends AstAtomic {
    calculateTapes(stack) {
        if (this.tapes == undefined) {
            this.tapes = new Set();
        }
        return this.tapes;
    }
    constructExpr(ns) {
        return derivs_1.NULL;
    }
}
class AstLiteral extends AstAtomic {
    constructor(cell, tape, text) {
        super(cell);
        this.tape = tape;
        this.text = text;
    }
    collectVocab(tapes, stack = []) {
        tapes.tokenize(this.tape, this.text);
    }
    calculateTapes(stack) {
        if (this.tapes == undefined) {
            this.tapes = new Set([this.tape]);
        }
        return this.tapes;
    }
    constructExpr(ns) {
        return derivs_1.constructLiteral(this.tape, this.text);
    }
}
exports.AstLiteral = AstLiteral;
class AstDot extends AstAtomic {
    constructor(cell, tape) {
        super(cell);
        this.tape = tape;
    }
    collectVocab(tapes, stack = []) {
        tapes.tokenize(this.tape, "");
    }
    calculateTapes(stack) {
        if (this.tapes == undefined) {
            this.tapes = new Set([this.tape]);
        }
        return this.tapes;
    }
    constructExpr(ns) {
        return derivs_1.constructDot(this.tape);
    }
}
exports.AstDot = AstDot;
class AstNAry extends AstComponent {
    constructor(cell, children) {
        super(cell);
        this.children = children;
    }
    getChildren() {
        return this.children;
    }
}
class AstSequence extends AstNAry {
    constructExpr(ns) {
        const childExprs = this.children.map(s => s.constructExpr(ns));
        return derivs_1.constructSequence(...childExprs);
    }
    finalChild() {
        if (this.children.length == 0) {
            // shouldn't be possible so long as client used constructX methods,
            // but just in case
            return new AstEpsilon(DUMMY_CELL);
        }
        return this.children[this.children.length - 1];
    }
    nonFinalChildren() {
        if (this.children.length <= 1) {
            // shouldn't be possible so long as client used constructX methods,
            // but just in case
            return [];
        }
        return this.children.slice(0, this.children.length - 1);
    }
}
exports.AstSequence = AstSequence;
class AstAlternation extends AstNAry {
    constructExpr(ns) {
        const childExprs = this.children.map(s => s.constructExpr(ns));
        return derivs_1.constructAlternation(...childExprs);
    }
}
exports.AstAlternation = AstAlternation;
class AstBinary extends AstComponent {
    constructor(cell, child1, child2) {
        super(cell);
        this.child1 = child1;
        this.child2 = child2;
    }
    getChildren() {
        return [this.child1, this.child2];
    }
}
class AstIntersection extends AstBinary {
    constructExpr(ns) {
        const left = this.child1.constructExpr(ns);
        const right = this.child2.constructExpr(ns);
        return derivs_1.constructIntersection(left, right);
    }
}
exports.AstIntersection = AstIntersection;
function fillOutWithDotStar(state, tapes) {
    for (const tape of tapes) {
        const dot = derivs_1.constructDot(tape);
        const dotStar = derivs_1.constructStar(dot);
        state = derivs_1.constructBinaryConcat(state, dotStar);
    }
    return state;
}
class AstJoin extends AstBinary {
    constructExpr(ns) {
        if (this.child1.tapes == undefined || this.child2.tapes == undefined) {
            throw new Error("Getting Brz expression with undefined tapes");
        }
        const child1OnlyTapes = util_1.setDifference(this.child1.tapes, this.child2.tapes);
        const child2OnlyTapes = util_1.setDifference(this.child2.tapes, this.child1.tapes);
        const child1 = this.child1.constructExpr(ns);
        const child1Etc = fillOutWithDotStar(child1, child2OnlyTapes);
        const child2 = this.child2.constructExpr(ns);
        const child2Etc = fillOutWithDotStar(child2, child1OnlyTapes);
        return derivs_1.constructIntersection(child1Etc, child2Etc);
    }
}
exports.AstJoin = AstJoin;
class AstFilter extends AstBinary {
    constructExpr(ns) {
        if (this.child1.tapes == undefined || this.child2.tapes == undefined) {
            throw new Error("Getting Brz expression with undefined tapes");
        }
        const child1OnlyTapes = util_1.setDifference(this.child1.tapes, this.child2.tapes);
        const child1 = this.child1.constructExpr(ns);
        const child2 = this.child2.constructExpr(ns);
        const child2Etc = fillOutWithDotStar(child2, child1OnlyTapes);
        return derivs_1.constructIntersection(child1, child2Etc);
    }
}
exports.AstFilter = AstFilter;
class AstStartsWith extends AstBinary {
    constructExpr(ns) {
        if (this.child1.tapes == undefined || this.child2.tapes == undefined) {
            throw new Error("Getting Brz expression with undefined tapes");
        }
        const child1OnlyTapes = util_1.setDifference(this.child1.tapes, this.child2.tapes);
        const child1 = this.child1.constructExpr(ns);
        var child2 = this.child2.constructExpr(ns);
        for (const tape of this.child2.tapes) {
            const dot = derivs_1.constructDot(tape);
            const dotStar = derivs_1.constructStar(dot);
            child2 = derivs_1.constructBinaryConcat(child2, dotStar);
        }
        const child2Etc = fillOutWithDotStar(child2, child1OnlyTapes);
        return derivs_1.constructIntersection(child1, child2Etc);
    }
}
exports.AstStartsWith = AstStartsWith;
class AstEndsWith extends AstBinary {
    constructExpr(ns) {
        if (this.child1.tapes == undefined || this.child2.tapes == undefined) {
            throw new Error("Getting Brz expression with undefined tapes");
        }
        const child1OnlyTapes = util_1.setDifference(this.child1.tapes, this.child2.tapes);
        const child1 = this.child1.constructExpr(ns);
        var child2 = this.child2.constructExpr(ns);
        for (const tape of this.child2.tapes) {
            const dot = derivs_1.constructDot(tape);
            const dotStar = derivs_1.constructStar(dot);
            child2 = derivs_1.constructBinaryConcat(dotStar, child2);
        }
        const child2Etc = fillOutWithDotStar(child2, child1OnlyTapes);
        return derivs_1.constructIntersection(child1, child2Etc);
    }
}
exports.AstEndsWith = AstEndsWith;
class AstContains extends AstBinary {
    constructExpr(ns) {
        if (this.child1.tapes == undefined || this.child2.tapes == undefined) {
            throw new Error("Getting Brz expression with undefined tapes");
        }
        const child1OnlyTapes = util_1.setDifference(this.child1.tapes, this.child2.tapes);
        const child1 = this.child1.constructExpr(ns);
        var child2 = this.child2.constructExpr(ns);
        for (const tape of this.child2.tapes) {
            const dot = derivs_1.constructDot(tape);
            const dotStar = derivs_1.constructStar(dot);
            child2 = derivs_1.constructSequence(dotStar, child2, dotStar);
        }
        const child2Etc = fillOutWithDotStar(child2, child1OnlyTapes);
        return derivs_1.constructIntersection(child1, child2Etc);
    }
}
exports.AstContains = AstContains;
class AstUnary extends AstComponent {
    constructor(cell, child) {
        super(cell);
        this.child = child;
    }
    getChildren() {
        return [this.child];
    }
}
exports.AstUnary = AstUnary;
class AstRename extends AstUnary {
    constructor(cell, child, fromTape, toTape) {
        super(cell, child);
        this.fromTape = fromTape;
        this.toTape = toTape;
    }
    collectVocab(tapes, stack = []) {
        tapes = new tapes_1.RenamedTape(tapes, this.fromTape, this.toTape);
        this.child.collectVocab(tapes, stack);
    }
    calculateTapes(stack) {
        if (this.tapes == undefined) {
            this.tapes = new Set();
            for (const tapeName of this.child.calculateTapes(stack)) {
                if (tapeName == this.fromTape) {
                    this.tapes.add(this.toTape);
                }
                else {
                    this.tapes.add(tapeName);
                }
            }
        }
        return this.tapes;
    }
    constructExpr(ns) {
        const childExpr = this.child.constructExpr(ns);
        return derivs_1.constructRename(childExpr, this.fromTape, this.toTape);
    }
}
exports.AstRename = AstRename;
class AstRepeat extends AstUnary {
    constructor(cell, child, minReps = 0, maxReps = Infinity) {
        super(cell, child);
        this.minReps = minReps;
        this.maxReps = maxReps;
    }
    constructExpr(ns) {
        const childExpr = this.child.constructExpr(ns);
        return derivs_1.constructRepeat(childExpr, this.minReps, this.maxReps);
    }
}
exports.AstRepeat = AstRepeat;
class AstNegation extends AstUnary {
    constructExpr(ns) {
        if (this.child.tapes == undefined) {
            throw new Error("Getting Brz expression with undefined tapes");
        }
        const childExpr = this.child.constructExpr(ns);
        return derivs_1.constructNegation(childExpr, this.child.tapes);
    }
}
exports.AstNegation = AstNegation;
let HIDE_INDEX = 0;
class AstHide extends AstUnary {
    constructor(cell, child, tape, name = "") {
        super(cell, child);
        this.tape = tape;
        if (name == "") {
            name = `HIDDEN${HIDE_INDEX}`;
            HIDE_INDEX++;
        }
        this.toTape = `__${name}_${tape}`;
    }
    collectVocab(tapes, stack = []) {
        tapes = new tapes_1.RenamedTape(tapes, this.tape, this.toTape);
        this.child.collectVocab(tapes, stack);
    }
    calculateTapes(stack) {
        if (this.tapes == undefined) {
            this.tapes = new Set();
            for (const tapeName of this.child.calculateTapes(stack)) {
                if (tapeName == this.tape) {
                    this.tapes.add(this.toTape);
                }
                else {
                    this.tapes.add(tapeName);
                }
            }
        }
        return this.tapes;
    }
    constructExpr(ns) {
        if (this.child.tapes == undefined) {
            throw new Error("Trying to construct an expression before tapes are calculated");
        }
        if (!this.child.tapes.has(this.tape)) {
            if (this.cell != undefined) {
                this.cell.markError("error", "Hiding missing tape", `The grammar to the left does not contain the tape ${this.tape}. Available tapes: [${[...this.child.tapes]}]`);
            }
        }
        const childExpr = this.child.constructExpr(ns);
        return derivs_1.constructRename(childExpr, this.tape, this.toTape);
    }
}
exports.AstHide = AstHide;
class AstMatch extends AstUnary {
    constructor(cell, child, relevantTapes) {
        super(cell, child);
        this.relevantTapes = relevantTapes;
    }
    constructExpr(ns) {
        const childExpr = this.child.constructExpr(ns);
        return derivs_1.constructMatch(childExpr, this.relevantTapes);
    }
}
exports.AstMatch = AstMatch;
class AstNamespace extends AstComponent {
    constructor(cell, name) {
        super(cell);
        this.name = name;
        this.qualifiedNames = new Map();
        this.symbols = new Map();
        this.default = new AstEpsilon(DUMMY_CELL);
    }
    addSymbol(symbolName, component) {
        if (symbolName.indexOf(".") != -1) {
            throw new Error(`Symbol names cannot have . in them`);
        }
        const symbol = this.resolveNameLocal(symbolName);
        if (symbol != undefined) {
            throw new Error(`Symbol ${symbolName} already defined.`);
        }
        this.symbols.set(symbolName, component);
    }
    getSymbol(symbolName) {
        return this.symbols.get(symbolName);
    }
    allSymbols() {
        return [...this.symbols.keys()];
    }
    getChildren() {
        const results = [];
        for (const referent of this.symbols.values()) {
            if (results.indexOf(referent) == -1) {
                results.push(referent);
            }
        }
        return results;
    }
    calculateQualifiedName(name, nsStack) {
        const namePrefixes = nsStack.map(n => n.name).filter(s => s.length > 0);
        return [...namePrefixes, name].join(".");
    }
    qualifyNames(nsStack = []) {
        let unqualifiedNames = [];
        const newStack = [...nsStack, this];
        for (const [symbolName, referent] of this.symbols) {
            const newName = this.calculateQualifiedName(symbolName, newStack);
            this.qualifiedNames.set(symbolName, newName);
            unqualifiedNames = unqualifiedNames.concat(referent.qualifyNames(newStack));
        }
        return unqualifiedNames;
    }
    /**
     * Looks up an unqualified name in this namespace's symbol table,
     * case-insensitive.
     */
    resolveNameLocal(name) {
        for (const symbolName of this.symbols.keys()) {
            if (name.toLowerCase() == symbolName.toLowerCase()) {
                const referent = this.symbols.get(symbolName);
                if (referent == undefined) {
                    return undefined;
                } // can't happen, just for linting
                return [symbolName, referent];
            }
        }
        return undefined;
    }
    resolveName(unqualifiedName, nsStack) {
        // split into (potentially) namespace prefix(es) and symbol name
        const namePieces = unqualifiedName.split(".");
        // it's got no namespace prefix, it's a symbol name
        if (namePieces.length == 1) {
            const localResult = this.resolveNameLocal(unqualifiedName);
            if (localResult == undefined) {
                // it's not a symbol assigned in this namespace
                return undefined;
            }
            // it IS a symbol defined in this namespace,
            // so get the fully-qualified name.  we can't just grab this
            // from this.qualifiedNames because that may not have been
            // filled out yet
            const [localName, referent] = localResult;
            const newName = this.calculateQualifiedName(localName, nsStack);
            return [newName, referent];
        }
        // it's got a namespace prefix
        const child = this.resolveNameLocal(namePieces[0]);
        if (child == undefined) {
            // but it's not a child of this namespace
            return undefined;
        }
        const [localName, referent] = child;
        if (!(referent instanceof AstNamespace)) {
            // if symbol X isn't a namespace, "X.Y" can't refer to anything real
            return undefined;
        }
        // this namespace has a child of the correct name
        const remnant = namePieces.slice(1).join(".");
        const newStack = [...nsStack, referent];
        return referent.resolveName(remnant, newStack); // try the child
    }
    /**
     * Although an AstNamespace contains many children,
     * upon evaluation it acts as if it's its last-defined
     * symbol -- so its tapes are the tapes of the last symbol,
     * rather than the union of its children's tapes.
     */
    calculateTapes(stack) {
        if (this.tapes == undefined) {
            this.tapes = new Set();
            for (const [name, referent] of this.symbols) {
                const tapes = referent.calculateTapes(stack);
                this.tapes = tapes;
            }
        }
        return this.tapes;
    }
    /**
     * The same as calculateTapes and constructExpr, we only count
     * the last-defined symbol for this calculation
     */
    collectVocab(tapes, stack = []) {
        const children = [...this.symbols.values()];
        if (children.length == 0) {
            return;
        }
        const lastChild = children[children.length - 1];
        lastChild.collectVocab(tapes, stack);
    }
    /**
     * The Brz expression for a Namespace object is that of
     * its last-defined child.  (Note that JS Maps are ordered;
     * you can rely on the last-entered entry to be the last
     * entry when you iterate.)
     */
    constructExpr(ns) {
        let expr = derivs_1.EPSILON;
        for (const [name, referent] of this.symbols) {
            const qualifiedName = this.qualifiedNames.get(name);
            if (qualifiedName == undefined) {
                throw new Error("Getting Brz expressions without having qualified names yet");
            }
            if (referent.tapes == undefined) {
                throw new Error("Getting Brz expressions without having calculated tapes");
            }
            expr = referent.constructExpr(ns);
            // memoize every expr
            expr = derivs_1.constructMemo(expr);
            ns.addComponent(qualifiedName, referent);
            ns.addSymbol(qualifiedName, expr);
            ns.addTapes(qualifiedName, referent.tapes);
        }
        return expr;
    }
}
exports.AstNamespace = AstNamespace;
class AstEmbed extends AstAtomic {
    constructor(cell, name) {
        super(cell);
        this.name = name;
        this.referent = undefined;
        this.qualifiedName = name;
    }
    qualifyNames(nsStack = []) {
        let resolution = undefined;
        for (let i = nsStack.length - 1; i >= 0; i--) {
            // we go down the stack asking each to resolve it
            const subStack = nsStack.slice(0, i + 1);
            resolution = nsStack[i].resolveName(this.name, subStack);
            if (resolution != undefined) {
                const [qualifiedName, referent] = resolution;
                this.qualifiedName = qualifiedName;
                this.referent = referent;
                break;
            }
        }
        if (resolution == undefined) {
            return [this.name];
        }
        return [];
    }
    calculateTapes(stack) {
        if (this.tapes == undefined) {
            if (stack.exceedsMax(this.qualifiedName) || this.referent == undefined) {
                this.tapes = new Set();
            }
            else {
                const newStack = stack.add(this.qualifiedName);
                this.tapes = this.referent.calculateTapes(newStack);
            }
        }
        return this.tapes;
    }
    collectVocab(tapes, stack = []) {
        if (this.referent == undefined) {
            return; // failed to find the referent, so it's epsilon
        }
        if (stack.indexOf(this.qualifiedName) != -1) {
            return;
        }
        const newStack = [...stack, this.qualifiedName];
        this.referent.collectVocab(tapes, newStack);
    }
    constructExpr(ns) {
        if (this.referent == undefined) {
            if (this.cell != undefined) {
                this.cell.markError("error", "Unknown symbol", `Undefined symbol ${this.name}`);
            }
            return derivs_1.EPSILON;
        }
        return derivs_1.constructEmbed(this.qualifiedName, ns);
    }
}
exports.AstEmbed = AstEmbed;
class Root {
    constructor(components = new Map(), exprs = new Map(), tapes = new Map()) {
        this.components = components;
        this.exprs = exprs;
        this.tapes = tapes;
        /**
         * If we're memoizing results, something has to keep track of the
         * tapes (and thus vocab) between invocations of generate, or else
         * those results will potentially be nonsense on later invocations.
         */
        this.allTapes = undefined;
    }
    addComponent(name, comp) {
        this.components.set(name, comp);
    }
    addSymbol(name, state) {
        this.exprs.set(name, state);
    }
    addTapes(name, tapes) {
        this.tapes.set(name, tapes);
    }
    register(symbolName) { }
    getSymbol(name, stack = undefined) {
        return this.exprs.get(name);
    }
    getComponent(name) {
        return this.components.get(name);
    }
    allSymbols() {
        return [...this.exprs.keys()];
    }
    getTapes(name) {
        const tapes = this.tapes.get(name);
        if (tapes == undefined) {
            return new Set();
        }
        return tapes;
    }
    compileSymbol(name, allTapes, stack, compileLevel) { }
    *generate(symbolName = "__MAIN__", query = undefined, random = false, maxRecursion = 4, maxChars = 1000) {
        let component = this.components.get(symbolName);
        if (component == undefined) {
            throw new Error(`Cannot generate from undefined symbol ${symbolName}`);
        }
        if (this.allTapes == undefined) {
            this.allTapes = new tapes_1.TapeCollection();
            component.collectVocab(this.allTapes);
        }
        if (query != undefined) {
            // create the query, if applicable
            const queryLiterals = [];
            for (const tapeName in query) {
                const value = query[tapeName];
                const inputLiteral = new AstLiteral(DUMMY_CELL, tapeName, value);
                queryLiterals.push(inputLiteral);
            }
            const queryComponent = new AstSequence(DUMMY_CELL, queryLiterals);
            // in case there's extra vocab in the query, add it to the tapes/vocab
            queryComponent.collectVocab(this.allTapes);
            // filter the grammar with the query
            component = new AstFilter(DUMMY_CELL, component, queryComponent);
            // make sure the new grammar has tapes
            const stack = new derivs_1.CounterStack(2);
            const t = component.calculateTapes(stack);
        }
        const expr = component.constructExpr(this);
        yield* expr.generate(this.allTapes, random, maxRecursion, maxChars);
    }
}
exports.Root = Root;
const DUMMY_CELL = new util_1.DummyCell();
function Seq(...children) {
    return new AstSequence(DUMMY_CELL, children);
}
exports.Seq = Seq;
function Uni(...children) {
    return new AstAlternation(DUMMY_CELL, children);
}
exports.Uni = Uni;
function Maybe(child) {
    return Uni(child, Epsilon());
}
exports.Maybe = Maybe;
function Lit(tape, text) {
    return new AstLiteral(DUMMY_CELL, tape, text);
}
exports.Lit = Lit;
function Any(tape) {
    return new AstDot(DUMMY_CELL, tape);
}
exports.Any = Any;
function Intersect(child1, child2) {
    return new AstIntersection(DUMMY_CELL, child1, child2);
}
exports.Intersect = Intersect;
function Filter(child1, child2) {
    return new AstFilter(DUMMY_CELL, child1, child2);
}
exports.Filter = Filter;
function Join(child1, child2) {
    return new AstJoin(DUMMY_CELL, child1, child2);
}
exports.Join = Join;
function StartsWith(child1, child2) {
    return new AstStartsWith(DUMMY_CELL, child1, child2);
}
exports.StartsWith = StartsWith;
function EndsWith(child1, child2) {
    return new AstEndsWith(DUMMY_CELL, child1, child2);
}
exports.EndsWith = EndsWith;
function Contains(child1, child2) {
    return new AstContains(DUMMY_CELL, child1, child2);
}
exports.Contains = Contains;
function Rep(child, minReps = 0, maxReps = Infinity) {
    return new AstRepeat(DUMMY_CELL, child, minReps, maxReps);
}
exports.Rep = Rep;
function Epsilon() {
    return new AstEpsilon(DUMMY_CELL);
}
exports.Epsilon = Epsilon;
function Null() {
    return new AstNull(DUMMY_CELL);
}
exports.Null = Null;
function Embed(name) {
    return new AstEmbed(DUMMY_CELL, name);
}
exports.Embed = Embed;
function Match(child, ...tapes) {
    return new AstMatch(DUMMY_CELL, child, new Set(tapes));
}
exports.Match = Match;
function Dot(...tapes) {
    return Seq(...tapes.map(t => Any(t)));
}
exports.Dot = Dot;
function MatchDot(...tapes) {
    return Match(Dot(...tapes), ...tapes);
}
exports.MatchDot = MatchDot;
function MatchDotRep(minReps = 0, maxReps = Infinity, ...tapes) {
    return Match(Rep(Dot(...tapes), minReps, maxReps), ...tapes);
}
exports.MatchDotRep = MatchDotRep;
function MatchDotRep2(minReps = 0, maxReps = Infinity, ...tapes) {
    return Match(Seq(...tapes.map((t) => Rep(Any(t), minReps, maxReps))), ...tapes);
}
exports.MatchDotRep2 = MatchDotRep2;
function MatchDotStar(...tapes) {
    return MatchDotRep(0, Infinity, ...tapes);
}
exports.MatchDotStar = MatchDotStar;
function MatchDotStar2(...tapes) {
    return MatchDotRep2(0, Infinity, ...tapes);
}
exports.MatchDotStar2 = MatchDotStar2;
function MatchFrom(firstTape, secondTape, state) {
    return Match(Seq(state, Rename(state, firstTape, secondTape)), firstTape, secondTape);
}
exports.MatchFrom = MatchFrom;
function Rename(child, fromTape, toTape) {
    return new AstRename(DUMMY_CELL, child, fromTape, toTape);
}
exports.Rename = Rename;
function Not(child) {
    return new AstNegation(DUMMY_CELL, child);
}
exports.Not = Not;
function Ns(name, symbols = {}) {
    const result = new AstNamespace(DUMMY_CELL, name);
    for (const [symbolName, component] of Object.entries(symbols)) {
        result.addSymbol(symbolName, component);
    }
    return result;
}
exports.Ns = Ns;
function Hide(child, tape, name = "") {
    return new AstHide(DUMMY_CELL, child, tape, name);
}
exports.Hide = Hide;
/**
  * Replace implements general phonological replacement rules.
  *
  * fromTapeName: name of the input (target) tape
  * toTapeName: name of the output (change) tape
  * fromState: input (target) State (on fromTape)
  * toState: output (change) State (on toTape)
  * preContext: context to match before the target fromState (on fromTape)
  * postContext: context to match after the target fromState (on fromTape)
  * beginsWith: set to True to match at the start of fromTape
  * endsWith: set to True to match at the end of fromTape
  * minReps: minimum number of times the replace rule is applied; normally 0.
  * maxReps: maximum number of times the replace rule is applied
  * maxExtraChars: a character limiter for extra characters at start/end
  * repetitionPatch: if True, expand replacement repetition using Uni
  *     repetitionPatch is a workaround for a bug resulting in a bad interaction
  *         between the old ConcatState and RepetitionState.
  *     Note: repetitionPatch may not be true if maxReps > 100
*/
function Replace(fromTapeName, toTapeName, fromState, toState, preContext, postContext, beginsWith = false, endsWith = false, minReps = 0, maxReps = Infinity, maxExtraChars = 100, repetitionPatch = false) {
    if (beginsWith || endsWith) {
        maxReps = Math.max(1, maxReps);
        minReps = Math.min(minReps, maxReps);
    }
    var states = [];
    if (preContext != undefined)
        states.push(MatchFrom(fromTapeName, toTapeName, preContext));
    states.push(fromState, toState);
    if (postContext != undefined)
        states.push(MatchFrom(fromTapeName, toTapeName, postContext));
    // Determine if the vocabulary for fromTape is a subset of the vocabulary
    // of toTape, in which case toTape could match the target replacement pattern.
    // sameVocab is used to determine what matchAnythingElse should match, but
    // is not needed if replacing at the start or end of text.
    var sameVocab = false;
    var replaceState = Seq(...states);
    const tapeCollection = replaceState.getAllTapes();
    const fromTape = tapeCollection.matchTape(fromTapeName);
    if (fromTape != undefined) {
        const fromVocab = fromTape.fromToken(fromTapeName, fromTape.any()).join('');
        sameVocab = tapeCollection.inVocab(toTapeName, fromVocab);
    }
    console.log(`same vocab = ${sameVocab}`);
    function matchAnythingElse(replaceNone = false) {
        const dotStar = Rep(Any(fromTapeName), 0, maxExtraChars);
        // 1. If the fromTape vocab for the replacement operation contains some
        //    characters that are not in the corresponding toTape vocab, then
        //    extra text matched before and after the replacement cannot possibly
        //    contain the from replacement pattern. Furthermore, we don't want to
        //    add those characters to the toTape vocab, so instead we match .*
        // 2. If we are matching an instance at the start of text (beginsWith),
        //    or end of text (endsWith) then matchAnythingElse needs to match any
        //    other instances of the replacement pattern, so we need to match .*
        if (!sameVocab || (beginsWith && !replaceNone) || (endsWith && !replaceNone)) {
            console.log("simple match from");
            return MatchFrom(fromTapeName, toTapeName, dotStar);
        }
        var fromInstance = [];
        if (preContext != undefined)
            fromInstance.push(preContext);
        fromInstance.push(fromState);
        if (postContext != undefined)
            fromInstance.push(postContext);
        var notState;
        if (beginsWith && replaceNone)
            notState = Not(Seq(...fromInstance, dotStar)); //, maxExtraChars);
        else if (endsWith && replaceNone)
            notState = Not(Seq(dotStar, ...fromInstance)); //, maxExtraChars);
        else
            notState = Not(Seq(dotStar, ...fromInstance, dotStar)); //, maxExtraChars);
        return MatchFrom(fromTapeName, toTapeName, notState);
    }
    if (!endsWith)
        states.push(matchAnythingElse());
    const replaceOne = Seq(...states);
    var replaceMultiple = Rep(replaceOne, minReps, maxReps);
    if (repetitionPatch && maxReps <= 100) {
        var multiples = [];
        for (let n = Math.max(1, minReps); n < maxReps + 1; n++) {
            multiples.push(Seq(...Array.from({ length: n }).map(x => replaceOne)));
        }
        replaceMultiple = Uni(...multiples);
    }
    if (beginsWith)
        replaceState = replaceOne;
    else if (endsWith)
        replaceState = Seq(matchAnythingElse(), replaceOne);
    else
        replaceState = Seq(matchAnythingElse(), replaceMultiple);
    if (minReps > 0)
        return replaceState;
    // ??? NOTE: matchAnythingElse(true) with beginsWith can result in an
    // "infinite" loop when generate is called (especially if maxChars is
    // high) because the match on notState is not respecting maxExtraChars
    // for some reason.
    return (Uni(matchAnythingElse(true), replaceState));
}
exports.Replace = Replace;

},{"./derivs":4,"./tapes":10,"./util":12}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseBooleanCell = exports.CPAlternation = exports.CPNegation = exports.CPUnreserved = void 0;
const miniParser_1 = require("./miniParser");
class CPUnreserved {
    constructor(text) {
        this.text = text;
        this.text = text.trim();
    }
}
exports.CPUnreserved = CPUnreserved;
class CPNegation {
    constructor(child) {
        this.child = child;
    }
}
exports.CPNegation = CPNegation;
class CPAlternation {
    constructor(child1, child2) {
        this.child1 = child1;
        this.child2 = child2;
    }
}
exports.CPAlternation = CPAlternation;
var EXPR = miniParser_1.MPDelay(() => miniParser_1.MPAlternation(NEGATION, ALTERNATION, SUBEXPR));
var SUBEXPR = miniParser_1.MPDelay(() => miniParser_1.MPAlternation(UNRESERVED, PARENS));
const RESERVED = new Set(["(", ")", "~", "|"]);
const UNRESERVED = miniParser_1.MPUnreserved(RESERVED, (s) => new CPUnreserved(s));
const PARENS = miniParser_1.MPSequence(["(", EXPR, ")"], (child) => child);
const NEGATION = miniParser_1.MPSequence(["~", EXPR], (child) => new CPNegation(child));
const ALTERNATION = miniParser_1.MPSequence([SUBEXPR, "|", EXPR], (c1, c2) => new CPAlternation(c1, c2));
const tokenizer = new RegExp("(" +
    [...RESERVED].map(s => "\\" + s).join("|") +
    ")");
function tokenize(text) {
    return text.split(tokenizer).filter((s) => s !== undefined && s !== '');
}
function parseBooleanCell(text) {
    return miniParser_1.miniParse(tokenize, EXPR, text);
}
exports.parseBooleanCell = parseBooleanCell;

},{"./miniParser":8}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.constructMemo = exports.constructRename = exports.constructMatch = exports.constructUniverse = exports.constructDotStar = exports.constructNegation = exports.constructEmbed = exports.constructRepeat = exports.constructStar = exports.constructMaybe = exports.constructIntersection = exports.constructAlternation = exports.constructSequence = exports.constructBinaryUnion = exports.constructBinaryConcat = exports.constructListExpr = exports.constructDot = exports.constructLiteral = exports.NULL = exports.EPSILON = exports.MatchExpr = exports.UnionExpr = exports.BinaryExpr = exports.NullExpr = exports.EpsilonExpr = exports.Expr = exports.CounterStack = void 0;
const util_1 = require("./util");
const tapes_1 = require("./tapes");
/**
 * This is the parsing/generation engine that underlies Gramble.
 * It generalizes Brzozowski derivatives (Brzozowski, 1964) to
 * multi-tape languages.
 *
 *      - "Multi-tape" means that there are multiple "tapes"
 *      (in the Turing machine sense) from/to which the machine
 *      can read/write.  Finite-state acceptors are one-tape automata,
 *      they read in from one tape and either succeed or fail.  Finite-
 *      state transducers are two-tape automata, reading from one and
 *      writing to another.  This system allows any number of tapes, and
 *      reading/writing from them in any combination.  (E.g. you could have
 *      five tapes A,B,C,D,E, have the input tapes be B and C and the outputs
 *      be A,D,E.  You don't need to specify this in advance, the grammar just
 *      expresses a relationship between tapes, not the direction
 *      of the "parse".)
 *
 * The basic idea of a Brzozowski derivative is easy.  Consider a language that
 * only consists of the following six words
 *
 *    L = { "apple", "avocado", "banana", "blueberry", "cherry", "date" }
 *
 * The Brzozowski derivative with respect to the character "b" of the above is
 *
 *    D_b(L) = { "anana", "lueberry" }
 *
 * Easy, no?  But we can also do this for languages that we haven't written out in
 * full like this -- languages that we've only expressed in terms of a grammar.  For
 * example, here are the rules for union (| here) and the
 * Kleene star with respect to some character c:
 *
 *    D_c(A|B) = D_c(A) | D_c(B)
 *    D_c(A*) = D_c(A) + A*
 *
 * In other words, we can distribute the derivative operation to the components of each grammar
 * element, depending on which grammar element it is, and eventually down to atomic elements like
 * literals.
 *
 *   D_c("banana") = "anana" if c == "b"
 *                   0 otherwise
 *
 * There is also an operation 𝛿 that checks if the grammar contains the empty string; if
 * so, it returns the set containing the empty string, otherwise it returns 0.
 *
 *   L2 = { "", "abc", "de", "f" }
 *   𝛿(L2) = {""}
 *
 *   L2 = { "abc", "de", "f" }
 *   𝛿(L2) = 0
 *
 * Brzozowski proved that all regular grammars have only finitely many derivatives (even if
 * the grammar itself generates infinitely).
 *
 * You can generate from a grammar L by trying each possible letter for c, and then, for
 * each derivative L' in D_c(L), trying each possible letter again to get L'' in D_c(L'), etc.
 * If you put those letters c into a tree, you've got L again, but this time in trie form.
 * That's basically what we're doing!  Except it'd be silly to actually iterate through all the possible
 * letters; instead we represent our vocabulary of possible letters as a set of bits and do bitwise
 * operations on them.
 *
 * A lot of our implementation of this algorithm uses the metaphor that these are states in a state
 * machine that has not been fully constructed yet.  You can picture the process of taking a Brz.
 * derivative as moving from a state to a state along an edge labeled "c", but where instead of the state
 * graph already being constructed and in memory, each state constructing its successors on demand.
 * Since states corresponding to (say) a particular position within a literal construct their successors
 * differently than those that (say) start off a subgraph corresponding to a Union, they belong to different
 * classes here: there's a LiteralExpr, a UnionExpr, etc. that differ in how they construct
 * their successors, and what information they need to keep track of to do so.  LiteralExprs, for example,
 * need to keep track of what that literal is and how far along they are within it.
 *
 * Brzozowski derivatives can be applied to grammars beyond regular ones -- they're well-defined
 * on context-free grammars, and here we generalize them to multi-tape grammars.  Much of the complexity
 * here isn't in constructing the derivative (which is often easy) but in bookkeeping the multiple tapes,
 * dealing with sampling randomly from a grammar or compiling it into a more efficient grammar, etc.
 *
 * Although an unoptimized Brzozowski-style algorithm has poor runtime complexity, the benefit of it to
 * us is that it gives us an easy-to-conceptualize flexibility between top-down parsing (poor runtime
 * complexity, good space complexity) and compiling a grammar to a state graph (good runtime complexity,
 * poor space complexity).  The reason for this is we can use the Brz. algorithm to actually
 * construct the state graph, but then still use the Brz. algorithm on that state graph (the Brz. derivative
 * of a language expressed as a state graph is easy, just follow that edge labeled "c").  That is to say,
 * compiling the state graph is just pre-running the algorithm.  This gives us a way to think about the
 * _partial_ compilation of a grammar, and lets us decide things like where we want to allocate a potentially
 * limited compilation budget to the places it's going to matter the most at runtime.
 */
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
        this.id = "ground";
    }
    add(key) {
        const result = new CounterStack(this.max);
        result.stack[key] = 0;
        Object.assign(result.stack, this.stack);
        result.stack[key] += 1;
        result.id = key + result.stack[key];
        return result;
    }
    get(key) {
        return (key in this.stack) ? this.stack[key] : 0;
    }
    exceedsMax(key) {
        return this.get(key) >= this.max;
    }
    tostring() {
        return JSON.stringify(this.stack);
    }
}
exports.CounterStack = CounterStack;
/**
 * Expr
 *
 * Expr is the basic class of the parser; it represents a symbolic
 * expression like A|B or epsilon+(C&D).  These expressions also represent
 * "states" or "nodes" in a (potentially abstract) state graph; this class was
 * originally called "State".  (You can think of Brzozowski's algorithm as
 * simultaneously constructing and traversing a FSA.  Calculating the Brz. derivative of
 * expression A with respect to some character "c" can be conceptualized as following
 * the transition, labeled "c", between a node corresponding to A and a node
 * corresponding to its derivative expression.)
 *
 * There are three kinds of "transitions" that we can follow:
 *
 *    deriv(T, c): The basic derivative function; it calculates the derivative
 *            w.r.t. character set c on tape T, but it doesn't guarantee that the
 *            results are disjoint.  (In other words, this will only create an
 *            abstract NDFSA, here nd (non-deterministic).)
 *
 *    disjointDeriv(T, c): Determinizes the derivative; in our case that means that making
 *            sure the returned character sets are disjoint.  This is necessary for
 *            getting negation right, and we also call this at the highest level to
 *            collapse trivially-identical results.
 *
 *    delta(T): A derivative w.r.t. epsilon: it returns only those languages where the
 *            contents of tape T are epsilon.
 */
class Expr {
    /**
     * Calculates the derivative so that the results are deterministic (or more accurately, so that all returned
     * transitions are disjoint).
     *
     * This looks a bit complicated (and it kind of is) but what it's doing is handing off the calculation to
     * deriv(), then combining results so that there's no overlap between the tokens.  For example, say deriv() yields
     * two tokens X and Y, and they have no intersection.  Then we're good, we just yield those.  But if they
     * do have an intersection, we need to return three paths:
     *
     *    X&Y (leading to the UnionExpr of the exprs X and Y would have led to)
     *    X-Y (leading to the expr X would have led to)
     *    Y-X (leading to the expr Y would have led to)
     *
     * @param nextTape A Tape object identifying the name/type/vocabulary of the relevant tape
     * @param target A Token identifying what characters we need to match
     * @param stack A [CounterStack] that keeps track of symbols (for embedding grammars), used for preventing infinite recursion
     * @returns A tuple [tape, match, next], where:
     *      * tape is the tape we matched on,
     *      * match is the intersection of the original target and our match,
     *      * next is the derivative expression
     */
    *disjointDeriv(tape, target, stack) {
        var results = [];
        var nextExprs = [...this.deriv(tape, target, stack)];
        for (var [nextTape, nextBits, next] of nextExprs) {
            var newResults = [];
            for (var [otherTape, otherBits, otherNext] of results) {
                if (nextTape.tapeName != otherTape.tapeName) {
                    newResults.push([otherTape, otherBits, otherNext]);
                    continue;
                }
                // they both matched
                const intersection = nextBits.and(otherBits);
                if (!intersection.isEmpty()) {
                    // there's something in the intersection
                    const union = constructBinaryUnion(next, otherNext);
                    newResults.push([nextTape, intersection, union]);
                }
                nextBits = nextBits.andNot(intersection);
                otherBits = otherBits.andNot(intersection);
                // there's something left over
                if (!otherBits.isEmpty()) {
                    newResults.push([otherTape, otherBits, otherNext]);
                }
            }
            results = newResults;
            if (!nextBits.isEmpty()) {
                results.push([nextTape, nextBits, next]);
            }
        }
        yield* results;
    }
    /**
     * Performs a breadth-first traversal of the graph.  This will be the function that most
     * clients will be calling.
     *
     * Even parsing is just calling generate.  (It's a separate function only because of a
     * complication with compilation.)  To do parses, we
     * join the grammar with a grammar corresponding to the query.  E.g., if we wanted to parse
     * { text: "foo" } in grammar X, we would construct JoinExpr(LiteralExpr("text", "foo"), X).
     * The reason for this is that it allows us a diverse collection of query types for free, by
     * choosing an appropriate "query grammar" to join X with.
     *
     * @param [maxRecursion] The maximum number of times the grammar can recurse; for infinite recursion pass Infinity.
     * @param [maxChars] The maximum number of steps any one traversal can take (roughly == the total number of characters
     *                    output to all tapes)
     * @returns a generator of { tape: string } dictionaries, one for each successful traversal.
     */
    *generate(allTapes, random = false, maxRecursion = 4, maxChars = 1000) {
        const stack = new CounterStack(maxRecursion);
        if (random) {
            yield* this.generateRandom(allTapes, stack, maxChars);
            return;
        }
        yield* this.generateBreadthFirst(allTapes, stack, maxChars);
    }
    *generateBreadthFirst(allTapes, stack, maxChars = 1000) {
        const initialOutput = new tapes_1.MultiTapeOutput();
        const startingTapes = [...allTapes.tapes.values()];
        var stateQueue = [[startingTapes, initialOutput, this, 0]];
        while (stateQueue.length > 0) {
            let nextQueue = [];
            for (let [tapes, prevOutput, prevExpr, chars] of stateQueue) {
                //console.log(`prevExpr is ${prevExpr.id}`);
                if (chars >= maxChars) {
                    continue;
                }
                if (prevExpr instanceof EpsilonExpr) {
                    yield* prevOutput.toStrings(false);
                    continue;
                }
                if (tapes.length == 0) {
                    //console.log(`no tapes left`);
                    continue;
                }
                // rotate the tapes so that we don't keep trying the same one every time
                tapes = [...tapes.slice(1), tapes[0]];
                const tapeToTry = tapes[0];
                for (const [cTape, cTarget, cNext] of prevExpr.disjointDeriv(tapeToTry, tapes_1.ANY_CHAR, stack)) {
                    const nextOutput = prevOutput.add(cTape, cTarget);
                    nextQueue.push([tapes, nextOutput, cNext, chars + 1]);
                    //console.log(`D^${cTape.tapeName} is ${cNext.id}`);
                }
                const delta = prevExpr.delta(tapeToTry, stack);
                //console.log(`d^${tapeToTry.tapeName} is ${delta.id}`);
                if (!(delta instanceof NullExpr)) {
                    const newTapes = tapes.slice(1);
                    nextQueue.push([newTapes, prevOutput, delta, chars]);
                }
            }
            stateQueue = nextQueue;
        }
    }
    *generateRandom(allTapes, stack, maxChars = 1000) {
        const initialOutput = new tapes_1.MultiTapeOutput();
        const startingTapes = [...allTapes.tapes.values()];
        var stateStack = [[startingTapes, initialOutput, this, 0]];
        const candidates = [];
        while (stateStack.length > 0) {
            // first, see if it's time to randomly emit a result
            if (Math.random() < 0.1 && candidates.length > 0) {
                const candidateIndex = Math.floor(Math.random() * candidates.length);
                const candidateOutput = candidates.splice(candidateIndex, 1)[0];
                yield* candidateOutput.toStrings(true);
            }
            let nexts = [];
            let prev = stateStack.pop();
            if (prev == undefined) {
                break; // won't happen if stateStack.length > 0 anyway, just for linting
            }
            let [tapes, prevOutput, prevExpr, chars] = prev;
            if (chars >= maxChars) {
                continue;
            }
            if (prevExpr instanceof EpsilonExpr) {
                candidates.push(prevOutput);
                continue;
            }
            if (tapes.length == 0) {
                continue;
            }
            // rotate the tapes so that we don't keep trying the same one every time
            tapes = [...tapes.slice(1), tapes[0]];
            const tapeToTry = tapes[0];
            for (const [cTape, cTarget, cNext] of prevExpr.disjointDeriv(tapeToTry, tapes_1.ANY_CHAR, stack)) {
                const nextOutput = prevOutput.add(cTape, cTarget);
                nexts.push([tapes, nextOutput, cNext, chars + 1]);
            }
            const delta = prevExpr.delta(tapeToTry, stack);
            if (!(delta instanceof NullExpr)) {
                const newTapes = tapes.slice(1);
                nexts.push([newTapes, prevOutput, delta, chars]);
            }
            util_1.shuffleArray(nexts);
            stateStack = stateStack.concat(nexts);
        }
        if (candidates.length == 0) {
            return;
        }
        const candidateIndex = Math.floor(Math.random() * candidates.length);
        const candidateOutput = candidates.splice(candidateIndex, 1)[0];
        yield* candidateOutput.toStrings(true);
    }
}
exports.Expr = Expr;
/**
 * An expression denoting the language with one entry, that's epsilon on all tapes.
 */
class EpsilonExpr extends Expr {
    get id() {
        return "ε";
    }
    delta(tape, stack) {
        return this;
    }
    *deriv(tape, target, stack) { }
}
exports.EpsilonExpr = EpsilonExpr;
/**
 * An expression denoting the empty language {}
 */
class NullExpr extends Expr {
    get id() {
        return "∅";
    }
    delta(tape, stack) {
        return this;
    }
    *deriv(tape, target, stack) { }
}
exports.NullExpr = NullExpr;
/**
 * The state that recognizes/emits any character on a specific tape;
 * implements the "dot" in regular expressions.
 */
class DotExpr extends Expr {
    constructor(tapeName) {
        super();
        this.tapeName = tapeName;
    }
    get id() {
        return `${this.tapeName}:.`;
    }
    delta(tape, stack) {
        const matchedTape = tape.matchTape(this.tapeName);
        if (matchedTape == undefined) {
            return this;
        }
        return exports.NULL;
    }
    *deriv(tape, target, stack) {
        const matchedTape = tape.matchTape(this.tapeName);
        if (matchedTape == undefined) {
            return;
        }
        yield [matchedTape, target, exports.EPSILON];
    }
}
/**
 * Recognizes/emits a literal string on a particular tape.
 * Inside, it's just a string like "foo"; upon successfully
 * matching "f" we construct a successor state looking for
 * "oo", and so on.
 */
class LiteralExpr extends Expr {
    constructor(tapeName, text, index = 0) {
        super();
        this.tapeName = tapeName;
        this.text = text;
        this.index = index;
    }
    get id() {
        const index = this.index > 0 ? `[${this.index}]` : "";
        return `${this.tapeName}:${this.text}${index}`;
    }
    getText() {
        // Return the remaining text for this LiteralState.
        return this.text.slice(this.index);
    }
    delta(tape, stack) {
        const matchedTape = tape.matchTape(this.tapeName);
        if (matchedTape == undefined) {
            return this;
        }
        if (this.index >= this.text.length) {
            return exports.EPSILON;
        }
        return exports.NULL;
    }
    collectVocab(tapes, stack) {
        tapes.tokenize(this.tapeName, this.text);
    }
    getToken(tape) {
        return tape.tokenize(tape.tapeName, this.text[this.index])[0];
    }
    *deriv(tape, target, stack) {
        if (this.index >= this.text.length) {
            return;
        }
        const matchedTape = tape.matchTape(this.tapeName);
        if (matchedTape == undefined) {
            return;
        }
        const bits = this.getToken(matchedTape);
        const result = matchedTape.match(bits, target);
        if (result.isEmpty()) {
            return;
        }
        const nextExpr = new LiteralExpr(this.tapeName, this.text, this.index + 1);
        yield [matchedTape, result, nextExpr];
    }
}
/**
 * The abstract base class of all Exprs with two state children
 * (e.g. [JoinExpr]).
 */
class BinaryExpr extends Expr {
    constructor(child1, child2) {
        super();
        this.child1 = child1;
        this.child2 = child2;
    }
    get id() {
        return `${this.constructor.name}(${this.child1.id},${this.child2.id})`;
    }
}
exports.BinaryExpr = BinaryExpr;
class ConcatExpr extends BinaryExpr {
    get id() {
        return `(${this.child1.id}+${this.child2.id})`;
    }
    delta(tape, stack) {
        return constructBinaryConcat(this.child1.delta(tape, stack), this.child2.delta(tape, stack));
    }
    *deriv(tape, target, stack) {
        for (const [c1tape, c1target, c1next] of this.child1.deriv(tape, target, stack)) {
            yield [c1tape, c1target,
                constructBinaryConcat(c1next, this.child2)];
        }
        const c1next = this.child1.delta(tape, stack);
        for (const [c2tape, c2target, c2next] of this.child2.deriv(tape, target, stack)) {
            const successor = constructBinaryConcat(c1next, c2next);
            yield [c2tape, c2target, successor];
        }
    }
}
class UnionExpr extends BinaryExpr {
    get id() {
        return `(${this.child1.id}|${this.child2.id})`;
    }
    delta(tape, stack) {
        return constructBinaryUnion(this.child1.delta(tape, stack), this.child2.delta(tape, stack));
    }
    *deriv(tape, target, stack) {
        yield* this.child1.deriv(tape, target, stack);
        yield* this.child2.deriv(tape, target, stack);
    }
}
exports.UnionExpr = UnionExpr;
class IntersectExpr extends BinaryExpr {
    get id() {
        return `(${this.child1.id}&${this.child2.id})`;
    }
    delta(tape, stack) {
        return constructIntersection(this.child1.delta(tape, stack), this.child2.delta(tape, stack));
    }
    *deriv(tape, target, stack) {
        for (const [c1tape, c1target, c1next] of this.child1.deriv(tape, target, stack)) {
            for (const [c2tape, c2target, c2next] of this.child2.deriv(c1tape, c1target, stack)) {
                const successor = constructIntersection(c1next, c2next);
                yield [c2tape, c2target, successor];
            }
        }
    }
}
/**
 * The parser that handles arbitrary subgrammars referred to by a symbol name; this is what makes
 * recursion possible.
 *
 * Like most such implementations, EmbedExpr's machinery serves to delay the construction of a child
 * state, since this child may be the EmbedExpr itself, or refer to this EmbedExpr by indirect recursion.
 * So instead of having a child at the start, it just has a symbol name and a reference to a symbol table.
 *
 * The successor states of the EmbedExpr may have an explicit child, though: the successors of that initial
 * child state.  (If we got the child from the symbol table every time, we'd just end up trying to match its
 * first letter again and again.)  We keep track of that through the _child member, which is initially undefined
 * but which we specify when constructing EmbedExpr's successor.
 */
class EmbedExpr extends Expr {
    constructor(symbolName, namespace, _child = undefined) {
        super();
        this.symbolName = symbolName;
        this.namespace = namespace;
        this._child = _child;
    }
    get id() {
        return `${this.constructor.name}(${this.symbolName})`;
    }
    getChild(stack = undefined) {
        if (this._child == undefined) {
            const child = this.namespace.getSymbol(this.symbolName, stack);
            if (child == undefined) {
                // this is an error, due to the programmer referring to an undefined
                // symbol, but now is not the time to complain. 
                return exports.EPSILON;
            }
            this._child = child;
        }
        return this._child;
    }
    delta(tape, stack) {
        if (stack.exceedsMax(this.symbolName)) {
            return exports.NULL;
        }
        const newStack = stack.add(this.symbolName);
        return this.getChild(newStack).delta(tape, newStack);
    }
    *deriv(tape, target, stack) {
        if (stack.exceedsMax(this.symbolName)) {
            return;
        }
        stack = stack.add(this.symbolName);
        let child = this.getChild(stack);
        for (const [childchildTape, childTarget, childNext] of child.deriv(tape, target, stack)) {
            const successor = new EmbedExpr(this.symbolName, this.namespace, childNext);
            yield [childchildTape, childTarget, successor];
        }
    }
}
/**
 * Abstract base class for states with only one child state.  Typically, UnaryExprs
 * handle derivatives by forwarding on the call to their child, and doing something special
 * before or after.  For example, [EmbedExprs] do a check a stack of symbol names to see
 * whether they've passed the allowable recursion limit, and [RenameExpr]s change what
 * the different tapes are named.
 *
 * Note that [UnaryExpr.child] is a getter, rather than storing an actual child.  This is
 * because [EmbedExpr] doesn't actually store its child, it grabs it from a symbol table instead.
 * (If it tried to take it as a param, or construct it during its own construction, this wouldn't
 * work, because the EmbedExpr's child can be that EmbedExpr itself.)
 */
class UnaryExpr extends Expr {
    constructor(child) {
        super();
        this.child = child;
    }
    get id() {
        return `${this.constructor.name}(${this.child.id})`;
    }
}
class MemoExpr extends UnaryExpr {
    constructor() {
        super(...arguments);
        this.acceptingOnStart = {};
        this.transitionsByTape = {};
    }
    addTransition(queryTape, resultTape, token, next) {
        if (!(queryTape.tapeName in this.transitionsByTape)) {
            this.transitionsByTape[queryTape.tapeName] = [];
        }
        this.transitionsByTape[queryTape.tapeName].push([resultTape, token, next]);
    }
    delta(tape, stack) {
        const childNext = this.child.delta(tape, stack);
        return constructMemo(childNext);
    }
    *deriv(tape, target, stack) {
        var transitions = this.transitionsByTape[tape.tapeName];
        if (transitions == undefined) {
            this.transitionsByTape[tape.tapeName] = [];
            transitions = [];
        }
        var remainder = new tapes_1.Token(target.bits.clone());
        // first we go through results we've tried before
        for (const [origResultTape, token, next] of transitions) {
            /*if (origResultTape.isTrivial) { // no vocab, so no possible results
                yield [origResultTape, token, next];
                return;
            } */
            if (next instanceof NullExpr) {
                break;
            }
            const matchedTape = tape.matchTape(origResultTape.tapeName);
            if (matchedTape == undefined) {
                throw new Error(`Failed to match ${tape.tapeName} to ${origResultTape.tapeName}..?`);
            }
            const resultToken = matchedTape.match(token, target);
            if (resultToken.isEmpty()) {
                continue;
            }
            yield [matchedTape, resultToken, next];
            remainder = remainder.andNot(resultToken);
            if (remainder.isEmpty()) {
                return;
            }
        }
        if (remainder.isEmpty()) {
            return;
        }
        // if we get here, remainder is non-empty
        for (const [cTape, cTarget, cNext] of this.child.disjointDeriv(tape, remainder, stack)) {
            if (cNext instanceof NullExpr) {
                continue;
            }
            const shared = cTarget.and(remainder);
            const successor = constructMemo(cNext);
            yield [cTape, shared, successor];
            this.addTransition(tape, cTape, shared, successor);
            remainder = remainder.andNot(shared);
            if (remainder.isEmpty()) {
                return;
            }
        }
        if (remainder.isEmpty()) {
            return;
        }
        // if we get here, there are characters that don't match any result.  we don't
        // want to forever keep querying the child for characters we know don't have any 
        // result, so we remember that they're Null
        this.addTransition(tape, tape, remainder, exports.NULL);
    }
}
class StarExpr extends UnaryExpr {
    get id() {
        return `${this.child.id}*`;
    }
    delta(tape, stack) {
        return constructStar(this.child.delta(tape, stack));
    }
    *deriv(tape, target, stack) {
        for (const [cTape, cTarget, cNext] of this.child.deriv(tape, target, stack)) {
            const successor = constructBinaryConcat(cNext, this);
            yield [cTape, cTarget, successor];
        }
    }
}
/**
 * Implements the Rename operation from relational algebra.
 */
class RenameExpr extends UnaryExpr {
    constructor(child, fromTape, toTape) {
        super(child);
        this.fromTape = fromTape;
        this.toTape = toTape;
    }
    delta(tape, stack) {
        tape = new tapes_1.RenamedTape(tape, this.fromTape, this.toTape);
        const newChild = this.child.delta(tape, stack);
        return constructRename(newChild, this.fromTape, this.toTape);
    }
    *deriv(tape, target, stack) {
        if (tape.tapeName == this.fromTape) {
            return;
        }
        tape = new tapes_1.RenamedTape(tape, this.fromTape, this.toTape);
        for (var [childTape, childTarget, childNext] of this.child.deriv(tape, target, stack)) {
            if (childTape instanceof tapes_1.RenamedTape) {
                childTape = childTape.child;
            }
            yield [childTape, childTarget, new RenameExpr(childNext, this.fromTape, this.toTape)];
        }
    }
}
class NegationExpr extends UnaryExpr {
    constructor(child, tapes) {
        super(child);
        this.tapes = tapes;
    }
    delta(tape, stack) {
        const childDelta = this.child.delta(tape, stack);
        const remainingTapes = util_1.setDifference(this.tapes, new Set([tape.tapeName]));
        return constructNegation(childDelta, remainingTapes);
    }
    *deriv(tape, target, stack) {
        if (!this.tapes.has(tape.tapeName)) {
            return;
        }
        var remainder = new tapes_1.Token(target.bits.clone());
        for (const [childTape, childText, childNext] of this.child.disjointDeriv(tape, target, stack)) {
            remainder = remainder.andNot(childText);
            const successor = constructNegation(childNext, this.tapes);
            yield [childTape, childText, successor];
        }
        if (remainder.isEmpty()) {
            return;
        }
        // any chars not yet consumed by the above represent
        // cases where we've (in FSA terms) "fallen off" the graph,
        // and are now at a special consume-anything state that always
        // succeeds.
        yield [tape, remainder, constructUniverse(this.tapes)];
    }
}
class MatchExpr extends UnaryExpr {
    constructor(child, tapes, buffers = {}) {
        super(child);
        this.tapes = tapes;
        this.buffers = buffers;
    }
    get id() {
        return `Match(${Object.values(this.buffers).map(b => b.id).join("+")},${this.child.id}`;
    }
    delta(tape, stack) {
        if (!this.tapes.has(tape.tapeName)) {
            // not a tape we care about, our result is just wrapping child.delta
            const childDelta = this.child.delta(tape, stack);
            return constructMatch(childDelta, this.tapes, this.buffers);
        }
        const newBuffers = {};
        Object.assign(newBuffers, this.buffers);
        const buffer = this.buffers[tape.tapeName];
        if (buffer != undefined) {
            const deltaBuffer = buffer.delta(tape, stack);
            if (!(deltaBuffer instanceof EpsilonExpr)) {
                return exports.NULL;
            }
            newBuffers[tape.tapeName] = deltaBuffer;
        }
        var result = this.child;
        for (const mTapeName of this.tapes) {
            const mTape = tape.getTape(mTapeName);
            if (mTape == undefined) {
                throw new Error(`Cannot find tape ${mTape}`);
            }
            result = result.delta(mTape, stack);
        }
        if (!(result instanceof NullExpr)) {
            return constructSequence(...Object.values(newBuffers), result);
        }
        else {
            return exports.NULL;
        }
    }
    *deriv(tape, target, symbolStack) {
        for (const [c1tape, c1target, c1next] of this.child.deriv(tape, target, symbolStack)) {
            if (!this.tapes.has(c1tape.tapeName)) {
                yield [c1tape, c1target, constructMatch(c1next, this.tapes, this.buffers)];
                continue;
            }
            // We need to match each character separately.
            for (const c of c1tape.fromToken(c1tape.tapeName, c1target)) {
                // cTarget: Token = c1tape.tokenize(c1tape.tapeName, c)[0]
                const cTarget = c1tape.toToken(c1tape.tapeName, c);
                // STEP A: Are we matching something already buffered?
                const c1buffer = this.buffers[c1tape.tapeName];
                var c1bufMatched = false;
                if (c1buffer instanceof LiteralExpr) {
                    // that means we already matched a character on a different
                    // tape previously and now need to make sure it also matches
                    // this character on this tape
                    for (const [bufTape, bufTarget, bufNext] of c1buffer.deriv(c1tape, cTarget, symbolStack)) {
                        c1bufMatched = true;
                    }
                }
                // STEP B: If not, constrain my successors to match this on other tapes
                const newBuffers = {};
                //Object.assign(newBuffers, this.buffers);
                if (!c1bufMatched) {
                    for (const tapeName of this.tapes.keys()) {
                        const buffer = this.buffers[tapeName];
                        if (tapeName == c1tape.tapeName) {
                            // we're going to match it in a moment, don't need to match
                            // it again!
                            if (buffer != undefined) {
                                newBuffers[tapeName] = buffer;
                            }
                            continue;
                        }
                        var prevText = "";
                        if (buffer instanceof LiteralExpr) {
                            // that means we already found stuff we needed to match,
                            // so we add to that
                            prevText = buffer.getText();
                        }
                        newBuffers[tapeName] = new LiteralExpr(tapeName, prevText + c);
                    }
                }
                // STEP C: Match the buffer
                if (c1buffer instanceof LiteralExpr) {
                    // that means we already matched a character on a different tape
                    // previously and now need to make sure it also matches on this
                    // tape
                    for (const [bufTape, bufTarget, bufNext] of c1buffer.deriv(c1tape, cTarget, symbolStack)) {
                        // We expect at most one match here.
                        // We expect bufTape == c1Tape,
                        //   bufTape == c1Tape
                        //   bufTarget == cTarget
                        //   bufMatched == c1Matched
                        //assert(bufTape == c1tape, "tape does not match");
                        //assert(bufTarget == cTarget, "target does not match");
                        //assert(bufMatched == c1matched, "matched does not match");
                        newBuffers[c1tape.tapeName] = bufNext;
                        yield [c1tape, cTarget, constructMatch(c1next, this.tapes, newBuffers)];
                    }
                }
                else {
                    // my predecessors have not previously required me to match
                    // anything in particular on this tape
                    yield [c1tape, cTarget, constructMatch(c1next, this.tapes, newBuffers)];
                }
            }
        }
    }
}
exports.MatchExpr = MatchExpr;
/* CONVENIENCE FUNCTIONS */
exports.EPSILON = new EpsilonExpr();
exports.NULL = new NullExpr();
//export const UNIVERSE = new UniverseExpr();
function constructLiteral(tape, text) {
    return new LiteralExpr(tape, text);
}
exports.constructLiteral = constructLiteral;
function constructDot(tape) {
    return new DotExpr(tape);
}
exports.constructDot = constructDot;
function constructListExpr(children, constr, nullResult) {
    if (children.length == 0) {
        return nullResult;
    }
    if (children.length == 1) {
        return children[0];
    }
    const head = children[0];
    const tail = constructListExpr(children.slice(1), constr, nullResult);
    return constr(head, tail);
}
exports.constructListExpr = constructListExpr;
function constructBinaryConcat(c1, c2) {
    if (c1 instanceof EpsilonExpr) {
        return c2;
    }
    if (c2 instanceof EpsilonExpr) {
        return c1;
    }
    if (c1 instanceof NullExpr) {
        return c1;
    }
    if (c2 instanceof NullExpr) {
        return c2;
    }
    if (c1 instanceof ConcatExpr) {
        const head = c1.child1;
        const tail = constructBinaryConcat(c1.child2, c2);
        return constructBinaryConcat(head, tail);
    }
    return new ConcatExpr(c1, c2);
}
exports.constructBinaryConcat = constructBinaryConcat;
function constructBinaryUnion(c1, c2) {
    if (c1 instanceof NullExpr) {
        return c2;
    }
    if (c2 instanceof NullExpr) {
        return c1;
    }
    if (c1 instanceof EpsilonExpr && c2 instanceof EpsilonExpr) {
        return c1;
    }
    if (c1 instanceof UnionExpr) {
        const head = c1.child1;
        const tail = constructBinaryUnion(c1.child2, c2);
        return constructBinaryUnion(head, tail);
    }
    return new UnionExpr(c1, c2);
}
exports.constructBinaryUnion = constructBinaryUnion;
function constructSequence(...children) {
    return constructListExpr(children, constructBinaryConcat, exports.EPSILON);
}
exports.constructSequence = constructSequence;
function constructAlternation(...children) {
    return constructListExpr(children, constructBinaryUnion, exports.NULL);
}
exports.constructAlternation = constructAlternation;
function constructIntersection(c1, c2) {
    if (c1 instanceof NullExpr) {
        return c1;
    }
    if (c2 instanceof NullExpr) {
        return c2;
    }
    if (c1 instanceof EpsilonExpr && c2 instanceof EpsilonExpr) {
        return c1;
    }
    if (c1 instanceof IntersectExpr) {
        const head = c1.child1;
        const tail = constructIntersection(c1.child2, c2);
        return constructIntersection(head, tail);
    }
    return new IntersectExpr(c1, c2);
}
exports.constructIntersection = constructIntersection;
function constructMaybe(child) {
    return constructAlternation(child, exports.EPSILON);
}
exports.constructMaybe = constructMaybe;
/**
 * Creates A* from A.  Distinguished from createRepeat
 * in that that works for any range of reps, where as this
 * is only zero through infinity reps.
 */
function constructStar(child) {
    if (child instanceof EpsilonExpr) {
        return child;
    }
    if (child instanceof NullExpr) {
        return exports.EPSILON;
    }
    if (child instanceof StarExpr) {
        return child;
    }
    return new StarExpr(child);
}
exports.constructStar = constructStar;
/**
 * Creates A{min,max} from A.  Distinguished from createStar
 * in that that only works for A{0,infinity}, whereas this
 * works for any values of {min,max}.
 */
function constructRepeat(child, minReps = 0, maxReps = Infinity) {
    if (maxReps < 0 || minReps > maxReps) {
        return exports.NULL;
    }
    if (maxReps == 0) {
        return exports.EPSILON;
    }
    if (minReps > 0) {
        const head = constructSequence(...Array(minReps).fill(child));
        const tail = constructRepeat(child, 0, maxReps - minReps);
        return constructSequence(head, tail);
    }
    if (maxReps == Infinity) {
        return constructStar(child);
    }
    const tail = constructRepeat(child, 0, maxReps - 1);
    return constructMaybe(constructSequence(child, tail));
}
exports.constructRepeat = constructRepeat;
function constructEmbed(symbolName, ns) {
    const symbol = ns.getSymbol(symbolName, undefined);
    if (symbol instanceof EpsilonExpr) {
        return symbol;
    }
    return new EmbedExpr(symbolName, ns);
}
exports.constructEmbed = constructEmbed;
function constructNegation(child, tapes) {
    if (child instanceof NullExpr) {
        return constructUniverse(tapes);
    }
    if (child instanceof NegationExpr) {
        return child.child;
    }
    return new NegationExpr(child, tapes);
}
exports.constructNegation = constructNegation;
function constructDotStar(tape) {
    return constructStar(constructDot(tape));
}
exports.constructDotStar = constructDotStar;
function constructUniverse(tapes) {
    return constructSequence(...[...tapes].map(t => constructDotStar(t)));
}
exports.constructUniverse = constructUniverse;
function constructMatch(child, tapes, buffers = {}) {
    if (child instanceof EpsilonExpr && Object.values(buffers).every(b => b instanceof EpsilonExpr)) {
        return child;
    }
    if (child instanceof NullExpr) {
        return child;
    }
    return new MatchExpr(child, tapes, buffers);
}
exports.constructMatch = constructMatch;
function constructRename(child, fromTape, toTape) {
    if (child instanceof EpsilonExpr) {
        return child;
    }
    if (child instanceof NullExpr) {
        return child;
    }
    return new RenameExpr(child, fromTape, toTape);
}
exports.constructRename = constructRename;
function constructMemo(child) {
    if (child instanceof EpsilonExpr) {
        return child;
    }
    if (child instanceof NullExpr) {
        return child;
    }
    return new MemoExpr(child);
}
exports.constructMemo = constructMemo;

},{"./tapes":10,"./util":12}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Gramble = void 0;
const ast_1 = require("./ast");
const util_1 = require("./util");
const sheets_1 = require("./sheets");
const headers_1 = require("./headers");
/**
 * A Gramble object acts as a Facade (in the GoF sense) for the client to interact with, so that they
 * don't necessarily have to understand the ways DevEnvironments, Sheet objects, TSTs, ASTs, and deriv objects
 * all interact.
 */
class Gramble {
    constructor(devEnv, mainSheetName) {
        this.devEnv = devEnv;
        this.mainSheetName = mainSheetName;
        this.root = undefined;
        this.sheetProject = new sheets_1.SheetProject(devEnv, mainSheetName);
    }
    addSheet(sheetName) {
        this.sheetProject.addSheet(sheetName);
    }
    allSymbols() {
        return this.getRoot().allSymbols();
    }
    getSymbol(symbolName) {
        return this.getRoot().getComponent(symbolName);
    }
    getErrors() {
        return this.devEnv.getErrorMessages().map(([sheet, row, col, msg, level]) => { return { sheet: sheet, row: row, col: col, msg: msg, level: level }; });
    }
    getTapeNames(symbolName) {
        const startState = this.getRoot().getComponent(symbolName);
        if (startState == undefined) {
            throw new Error(`Cannot find symbol ${symbolName}`);
        }
        const results = [];
        const stack = new ast_1.CounterStack(2);
        for (const tapeName of startState.calculateTapes(stack)) {
            const header = headers_1.parseHeaderCell(tapeName);
            results.push([tapeName, header.getColor(0.2, 1.0)]);
        }
        return results;
    }
    getRoot() {
        if (this.root == undefined) {
            const tst = this.sheetProject.toTST();
            const ast = tst.toAST();
            this.root = ast.getRoot();
        }
        return this.root;
    }
    generate(symbolName = "", restriction = {}, maxResults = Infinity, maxRecursion = 4, maxChars = 1000) {
        const gen = this.getRoot().generate(symbolName, restriction, false, maxRecursion, maxChars);
        //const gen = startState.parse(inputs, false, maxRecursion, maxChars);
        return util_1.iterTake(gen, maxResults);
    }
    stripHiddenFields(entries) {
        const results = [];
        for (const entry of entries) {
            const result = {};
            for (const [key, value] of Object.entries(entry)) {
                if (!key.startsWith("__")) {
                    result[key] = value;
                }
            }
            results.push(result);
        }
        return results;
    }
    sample(symbolName = "", numSamples = 1, restriction = {}, maxTries = 1000, maxRecursion = 4, maxChars = 1000) {
        let results = [];
        for (let i = 0; i < maxTries; i++) {
            const gen = this.getRoot().generate(symbolName, restriction, true, maxRecursion, maxChars);
            results = results.concat(util_1.iterTake(gen, 1));
            if (results.length >= numSamples) {
                break;
            }
        }
        return results;
    }
}
exports.Gramble = Gramble;

},{"./ast":2,"./headers":6,"./sheets":9,"./util":12}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseHeaderCell = exports.RESERVED_WORDS = exports.RESERVED_OPS = exports.BINARY_OPS = exports.RESERVED_HEADERS = exports.ReservedErrorHeader = exports.ErrorHeader = exports.SlashHeader = exports.ContainsHeader = exports.EndsWithHeader = exports.StartsWithHeader = exports.EqualsHeader = exports.LogicHeader = exports.MaybeHeader = exports.CommentHeader = exports.LiteralHeader = exports.HideHeader = exports.EmbedHeader = exports.Header = exports.DEFAULT_VALUE = exports.DEFAULT_SATURATION = void 0;
const ast_1 = require("./ast");
const cellParser_1 = require("./cellParser");
const miniParser_1 = require("./miniParser");
const util_1 = require("./util");
exports.DEFAULT_SATURATION = 0.1;
exports.DEFAULT_VALUE = 1.0;
/**
 * A Header is a cell in the top row of a table, consisting of one of
 *
 * * the name of a tape, like "text" or "gloss"
 * * an atomic operator like "embed" or "hide"
 * * a unary operator like "maybe" followed by a valid Header (e.g. "maybe text")
 * * two valid Headers joined by a slash (e.g. "text/gloss")
 * * a valid Header in parentheses (e.g. "(text)")
 * * a comment (e.g. "% text")
 *
 * (We treat commented-out headers specially, because they turn everything
 * in their column into no-ops.)
 *
 * Header objects are responsible for:
 *
 * * compiling the text of the cells beneath them into [AstComponent]s, and merging them (usually by
 *   concatenation) with cells to their left.
 *
 * * calculating the appropriate background color for their cells and the cells in their column.
 *
 * Headers are parsed using the "miniParser" engine, a simple parser/combinator engine.
 */
class Header {
}
exports.Header = Header;
/**
 * AtomicHeader is the ancestor class of all single-token headers, like "embed" and
 * literals (e.g. "text").
 */
class AtomicHeader extends Header {
    getColor(saturation = exports.DEFAULT_SATURATION, value = exports.DEFAULT_VALUE) {
        return util_1.RGBtoString(...util_1.HSVtoRGB(this.hue, saturation, value));
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
}
/**
 * EmbedHeaders lead to the complilation of EmbedStates.
 */
class EmbedHeader extends AtomicHeader {
    get text() {
        return "embed";
    }
    toAST(left, text, content) {
        const cellAST = new ast_1.AstEmbed(content, text);
        cellAST.cell = content;
        return new ast_1.AstSequence(content, [left, cellAST]);
    }
}
exports.EmbedHeader = EmbedHeader;
/**
 * HideHeader is an atomic header "hide:T" that takes the grammar
 * to the left and mangles the name of tape T outside of that grammar,
 * so that the field cannot be referenced outside of it.  This allows
 * programmers to use additional fields without necessarily overwhelming
 * the "public" interface to the grammar with fields that are only
 * internally-relevant, and avoid unexpected behavior when joining two classes
 * that define same-named fields internally for different purposes.
 */
class HideHeader extends AtomicHeader {
    get text() {
        return "hide";
    }
    toAST(left, text, content) {
        var result = left;
        for (const tape of text.split("/")) {
            result = new ast_1.AstHide(content, result, tape.trim());
            result.cell = content;
        }
        return result;
    }
}
exports.HideHeader = HideHeader;
/**
 * LiteralHeaders are references to a particular tape name (e.g. "text")
 */
class LiteralHeader extends AtomicHeader {
    constructor(text) {
        super();
        this.text = text;
    }
    toAST(left, text, content) {
        const ast = new ast_1.AstLiteral(content, this.text, text);
        return new ast_1.AstSequence(content, [left, ast]);
    }
}
exports.LiteralHeader = LiteralHeader;
/**
 * Commented-out headers also comment out any cells below them; the cells just act as
 * Empty() states.
 */
class CommentHeader extends Header {
    get hue() {
        return 0;
    }
    getColor(saturation = exports.DEFAULT_SATURATION, value = exports.DEFAULT_VALUE) {
        return "#FFFFFF";
    }
    toAST(left, text) {
        return left;
    }
}
exports.CommentHeader = CommentHeader;
/**
 * The ancestor class of unary header operators like "maybe", "not", "@"
 * (the joining operator that we use to implement flags), and ">" (the rename
 * operator)
 */
class UnaryHeader extends Header {
    constructor(child) {
        super();
        this.child = child;
    }
    getColor(saturation = exports.DEFAULT_SATURATION, value = exports.DEFAULT_VALUE) {
        return this.child.getColor(saturation, value);
    }
}
/**
 * Header that constructs optional parsers, e.g. "maybe text"
 */
class MaybeHeader extends UnaryHeader {
    toAST(left, text, content) {
        const childAST = this.child.toAST(new ast_1.AstEpsilon(content), text, content);
        const ast = new ast_1.AstAlternation(content, [childAST, new ast_1.AstEpsilon(content)]);
        return new ast_1.AstSequence(content, [left, ast]);
    }
}
exports.MaybeHeader = MaybeHeader;
/**
 * Header that constructs renames
 */
class RenameHeader extends UnaryHeader {
    toAST(left, text, content) {
        if (!(this.child instanceof LiteralHeader)) {
            content.markError("error", "Renaming error", "Rename (>) needs to have a tape name after it");
            return new ast_1.AstEpsilon(content);
        }
        const ast = new ast_1.AstRename(content, left, text, this.child.text);
        return ast;
    }
}
/**
 * The command "logic X:Y" allows the use of ~ and | in the cell
 * to mean "not" and "or" respectively, rather than have their literal usage.
 *
 * e.g. "~(A|B)" is interpreted as "neither A nor B" rather than this literal string.
 *
 * This is also the ancestor class of all other headers (e.g. "equals",
 * startsWith", etc.) that allow and parse boolean-algebra expressions
 * in their fields.
 */
class LogicHeader extends UnaryHeader {
    merge(left, ast, content) {
        if (left == undefined) {
            return ast;
        }
        return new ast_1.AstSequence(content, [left, ast]);
    }
    toAstPiece(parsedText, content) {
        if (parsedText instanceof cellParser_1.CPUnreserved) {
            return this.child.toAST(new ast_1.AstEpsilon(content), parsedText.text, content);
        }
        if (parsedText instanceof cellParser_1.CPNegation) {
            const childAst = this.toAstPiece(parsedText.child, content);
            return new ast_1.AstNegation(content, childAst);
        }
        if (parsedText instanceof cellParser_1.CPAlternation) {
            const child1Ast = this.toAstPiece(parsedText.child1, content);
            const child2Ast = this.toAstPiece(parsedText.child2, content);
            return new ast_1.AstAlternation(content, [child1Ast, child2Ast]);
        }
        throw new Error(`Error constructing boolean expression: ${parsedText}`);
    }
    toAST(left, text, content) {
        if (text.length == 0) {
            return left;
        }
        const parsedText = cellParser_1.parseBooleanCell(text);
        const c = this.toAstPiece(parsedText, content);
        return this.merge(left, c, content);
    }
}
exports.LogicHeader = LogicHeader;
/**
 * EqualsHeader puts a constraint on the state of the immediately preceding cell (call this state N)
 * that Filter(N, X) -- that is, it filters the results of N such that every surviving record is a
 * superset of X.
 *
 * This is also the superclass of [StartsWithHeader], [EndsWithHeader], and [ContainsHeader].
 * These constrain N to either start with X (that is, Filter(N, X.*)) or end with X
 * (that is, Filter(N, .*X)), or contain X (Filter(N, .*X.*)).
 */
class EqualsHeader extends LogicHeader {
    merge(leftNeighbor, state, content) {
        if (leftNeighbor == undefined) {
            content.markError("error", "Filtering empty grammar", "'equals/startswith/endswith/contains' requires content to its left.");
            return new ast_1.AstEpsilon(content);
        }
        if (leftNeighbor instanceof ast_1.AstSequence) {
            // if your left neighbor is a concat state we have to do something a little special,
            // because startswith only scopes over the cell immediately to the left.  (if you let
            // it be a join with EVERYTHING to the left, you end up catching prefixes that you're
            // specifying in the same row, rather than the embedded thing you're trying to catch.)
            const lastChild = leftNeighbor.finalChild();
            const filter = this.constructFilter(lastChild, state, content);
            const remainingChildren = leftNeighbor.nonFinalChildren();
            return new ast_1.AstSequence(content, [...remainingChildren, filter]);
        }
        return this.constructFilter(leftNeighbor, state, content);
    }
    constructFilter(leftNeighbor, condition, content) {
        return new ast_1.AstFilter(content, leftNeighbor, condition);
    }
}
exports.EqualsHeader = EqualsHeader;
/**
 * StartsWithHeader is a special kind of EqualsHeader that only requires its predecessor (call it N) to
 * start with X (that is, Filter(N, X.*))
 */
class StartsWithHeader extends EqualsHeader {
    constructFilter(leftNeighbor, condition, content) {
        return new ast_1.AstStartsWith(content, leftNeighbor, condition);
    }
}
exports.StartsWithHeader = StartsWithHeader;
/**
 * EndsWithHeader is a special kind of EqualsHeader that only requires its predecessor (call it N) to
 * end with X (that is, Filter(N, .*X))
 */
class EndsWithHeader extends EqualsHeader {
    constructFilter(leftNeighbor, condition, content) {
        return new ast_1.AstEndsWith(content, leftNeighbor, condition);
    }
}
exports.EndsWithHeader = EndsWithHeader;
/**
 * ContainsHeader is a special kind of EqualsHeader that only requires its predecessor (call it N) to
 * contain X (that is, Filter(N, .*X.*))
 */
class ContainsHeader extends EqualsHeader {
    constructFilter(leftNeighbor, condition, content) {
        return new ast_1.AstContains(content, leftNeighbor, condition);
    }
}
exports.ContainsHeader = ContainsHeader;
class BinaryHeader extends Header {
    constructor(child1, child2) {
        super();
        this.child1 = child1;
        this.child2 = child2;
    }
    getColor(saturation = exports.DEFAULT_SATURATION, value = exports.DEFAULT_VALUE) {
        return this.child1.getColor(saturation, value);
    }
}
class SlashHeader extends BinaryHeader {
    constructor(child1, child2) {
        super(child1, child2);
        this.child1 = child1;
        this.child2 = child2;
    }
    toAST(left, text, content) {
        const childAst1 = this.child1.toAST(left, text, content);
        return this.child2.toAST(childAst1, text, content);
    }
}
exports.SlashHeader = SlashHeader;
class ErrorHeader extends LiteralHeader {
    toAST(left, text, content) {
        content.markError("warning", `Invalid header: ${this.text}`, `This content is associated with an invalid header above, ignoring`);
        return new ast_1.AstEpsilon(content);
    }
}
exports.ErrorHeader = ErrorHeader;
class ReservedErrorHeader extends ErrorHeader {
    toAST(left, text, content) {
        content.markError("warning", `Invalid header: ${this.text}`, `This content is associated with an invalid header above, ignoring`);
        return new ast_1.AstEpsilon(content);
    }
}
exports.ReservedErrorHeader = ReservedErrorHeader;
/**
 * What follows is a grammar and parser for the mini-language inside headers, e.g.
 * "text", "text/gloss", "startswith text", etc.
 *
 * It uses the mini-parser library in miniParser.ts to construct a recursive-descent
 * parser for the grammar.
 */
const SYMBOL = ["(", ")", "%", "/", ">", ":"];
exports.RESERVED_HEADERS = [
    "embed",
    "maybe",
    //"not", 
    "hide",
    //"reveal", 
    "equals",
    "startswith",
    "endswith",
    "contains"
];
exports.BINARY_OPS = {
    "or": (cell, c1, c2) => new ast_1.AstAlternation(cell, [c1, c2]),
    "concat": (cell, c1, c2) => new ast_1.AstSequence(cell, [c1, c2]),
    "join": (cell, c1, c2) => new ast_1.AstJoin(cell, c1, c2),
};
exports.RESERVED_OPS = new Set([...Object.keys(exports.BINARY_OPS), "table", "test", "testnot"]);
exports.RESERVED_WORDS = new Set([...SYMBOL, ...exports.RESERVED_HEADERS, ...exports.RESERVED_OPS]);
const tokenizer = new RegExp("\\s+|(" +
    SYMBOL.map(s => "\\" + s).join("|") +
    ")");
function tokenize(text) {
    return text.split(tokenizer).filter((s) => s !== undefined && s !== '');
}
var HP_NON_COMMENT_EXPR = miniParser_1.MPDelay(() => miniParser_1.MPAlternation(HP_MAYBE, HP_SLASH, HP_RENAME, HP_EQUALS, HP_STARTSWITH, HP_ENDSWITH, HP_CONTAINS, HP_SUBEXPR));
var HP_SUBEXPR = miniParser_1.MPDelay(() => miniParser_1.MPAlternation(HP_UNRESERVED, HP_EMBED, HP_HIDE, 
//HP_REVEAL, 
HP_LOGIC, HP_PARENS, HP_RESERVED_OP));
const HP_COMMENT = miniParser_1.MPComment('%', (s) => new CommentHeader());
const HP_UNRESERVED = miniParser_1.MPUnreserved(exports.RESERVED_WORDS, (s) => new LiteralHeader(s));
const HP_RESERVED_OP = miniParser_1.MPReserved(exports.RESERVED_OPS, (s) => new ReservedErrorHeader(s));
const HP_EMBED = miniParser_1.MPSequence(["embed"], () => new EmbedHeader());
const HP_HIDE = miniParser_1.MPSequence(["hide"], () => new HideHeader());
/*
const HP_REVEAL = MPSequence<Header>(
    ["reveal"],
    () => new RevealHeader("reveal")
);
*/
const HP_MAYBE = miniParser_1.MPSequence(["maybe", HP_NON_COMMENT_EXPR], (child) => new MaybeHeader(child));
const HP_LOGIC = miniParser_1.MPSequence(["logic", HP_NON_COMMENT_EXPR], (child) => new LogicHeader(child));
const HP_SLASH = miniParser_1.MPSequence([HP_SUBEXPR, "/", HP_NON_COMMENT_EXPR], (child1, child2) => new SlashHeader(child1, child2));
const HP_RENAME = miniParser_1.MPSequence([">", HP_UNRESERVED], (child) => new RenameHeader(child));
const HP_PARENS = miniParser_1.MPSequence(["(", HP_NON_COMMENT_EXPR, ")"], (child) => child);
const HP_EQUALS = miniParser_1.MPSequence(["equals", HP_NON_COMMENT_EXPR], (child) => new EqualsHeader(child));
const HP_STARTSWITH = miniParser_1.MPSequence(["startswith", HP_NON_COMMENT_EXPR], (child) => new StartsWithHeader(child));
const HP_ENDSWITH = miniParser_1.MPSequence(["endswith", HP_NON_COMMENT_EXPR], (child) => new EndsWithHeader(child));
const HP_CONTAINS = miniParser_1.MPSequence(["contains", HP_NON_COMMENT_EXPR], (child) => new ContainsHeader(child));
var HP_EXPR = miniParser_1.MPAlternation(HP_COMMENT, HP_NON_COMMENT_EXPR);
function parseHeaderCell(text) {
    try {
        return miniParser_1.miniParse(tokenize, HP_EXPR, text);
    }
    catch (e) {
        return new ErrorHeader(text);
    }
}
exports.parseHeaderCell = parseHeaderCell;

},{"./ast":2,"./cellParser":3,"./miniParser":8,"./util":12}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Gramble = void 0;
const gramble_1 = require("./gramble");
Object.defineProperty(exports, "Gramble", { enumerable: true, get: function () { return gramble_1.Gramble; } });

},{"./gramble":5}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.miniParse = exports.MPAlternation = exports.MPSequence = exports.MPComment = exports.MPUnreserved = exports.MPReserved = exports.MPDelay = void 0;
/**
 * Delay the evaluation of a parser X to allow reference to a parser before it's defined (e.g. for
 * grammars that recurse).  You probably don't need this if your parsers are defined "function X(...){...}",
 * because hoisting should take care of that, but if they're defined as variables/constants like
 * "const X = ...", you need this to allow the expression of recursive grammars.
 */
function MPDelay(child) {
    return function* (input) {
        yield* child()(input);
    };
}
exports.MPDelay = MPDelay;
/**
 * Recognizes any word in the "reserved" string set.
 */
function MPReserved(reserved, constr, caseSensitive = false) {
    return function* (input) {
        const firstToken = caseSensitive ? input[0]
            : input[0].toLowerCase();
        if (input.length == 0 || !reserved.has(firstToken)) {
            return;
        }
        yield [constr(input[0]), input.slice(1)];
    };
}
exports.MPReserved = MPReserved;
/**
 * Recognizes any word that is NOT in the "reserved" string set.
 */
function MPUnreserved(reserved, constr, caseSensitive = false) {
    return function* (input) {
        const firstToken = caseSensitive ? input[0]
            : input[0].toLowerCase();
        if (input.length == 0 || reserved.has(firstToken)) {
            return;
        }
        yield [constr(input[0]), input.slice(1)];
    };
}
exports.MPUnreserved = MPUnreserved;
/**
 * Recognizes a string that begins with commentStarter (e.g. "%" in a header)
 */
function MPComment(commentStarter, constr) {
    return function* (input) {
        if (input.length == 0 || input[0] != commentStarter) {
            return;
        }
        yield [constr(input[0]), []];
    };
}
exports.MPComment = MPComment;
/**
 * Recognizes a sequence of grammar elements and (for convenience) literal strings.  The function constr
 * should have as many elements as the non-strings in your array.  (That is to say, it will pass all
 * non-strings it finds to the constructor, and ignore any literal strings.  If for some reason you need
 * that literal string to be a result object and passed to the constructor, wrap it in an MPReserved.)
 */
function MPSequence(children, constr, caseSensitive = false) {
    return function* (input) {
        var results = [[[], input]];
        for (const child of children) {
            var newResults = [];
            for (const [existingOutputs, existingRemnant] of results) {
                if (typeof child == "string") {
                    if (existingRemnant.length == 0) {
                        continue;
                    }
                    const remnantTestForm = caseSensitive ? existingRemnant[0]
                        : existingRemnant[0].toLowerCase();
                    const childTestForm = caseSensitive ? child
                        : child.toLowerCase();
                    if (remnantTestForm == childTestForm) {
                        newResults.push([existingOutputs, existingRemnant.slice(1)]);
                    }
                    continue;
                }
                for (const [output2, remnant2] of child(existingRemnant)) {
                    const newOutput = [...existingOutputs, output2];
                    newResults.push([newOutput, remnant2]);
                }
            }
            results = newResults;
        }
        for (const [output, remnant] of results) {
            yield [constr(...output), remnant];
        }
    };
}
exports.MPSequence = MPSequence;
/**
 * The result of MPAlternation(A, B)(X) is just the union of the results of applying A(X) and B(X).
 */
function MPAlternation(...children) {
    return function* (input) {
        for (const child of children) {
            yield* child(input);
        }
    };
}
exports.MPAlternation = MPAlternation;
/**
 * A convenience function to tokenize, parse, throw out incomplete results, and fail when the
 * number of results isn't exactly equal to one.
 *
 * If you're parsing a grammar that's genuinely ambiguous (can have multiple valid parses
 * for the same string) then you don't want to use this function.  All of our mini-grammars
 * are deterministic so it really is an error if we get multiple parses.
 */
function miniParse(tokenizer, grammar, text) {
    const pieces = tokenizer(text);
    var result = [...grammar(pieces)];
    // result is a list of [header, remaining_tokens] pairs.  
    // we only want results where there are no remaining tokens.
    result = result.filter(([t, r]) => r.length == 0);
    if (result.length == 0) {
        // if there are no results, the programmer made a syntax error
        throw new Error(`Cannot parse: ${text}`);
    }
    if (result.length > 1) {
        throw new Error(`Ambiguous, cannot uniquely parse: ${text}.`);
    }
    return result[0][0];
}
exports.miniParse = miniParse;

},{}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SheetCell = exports.Sheet = exports.SheetProject = void 0;
const headers_1 = require("./headers");
const tsts_1 = require("./tsts");
const util_1 = require("./util");
/**
 * Determines whether a line is empty
 * @param row A list of strings, representing the cell text along that row
 * @returns True if the line is empty
 */
function isLineEmpty(row) {
    if (row.length == 0) {
        return true;
    }
    for (let cellText of row) {
        if (cellText.trim().length != 0) {
            return false;
        }
    }
    return true;
}
function constructOp(cell) {
    var newEnclosure;
    if (!cell.text.endsWith(":")) {
        throw new Error("Tried to construct an op that didn't end with ':'");
    }
    const trimmedText = cell.text.slice(0, cell.text.length - 1).trim();
    const trimmedTextLower = trimmedText.toLowerCase();
    if (trimmedTextLower in headers_1.BINARY_OPS) {
        newEnclosure = new tsts_1.TstBinaryOp(cell);
    }
    else if (trimmedTextLower == "table") {
        newEnclosure = new tsts_1.TstTableOp(cell);
    }
    else if (trimmedTextLower == "test") {
        newEnclosure = new tsts_1.TstTestSuite(cell);
    }
    else if (trimmedTextLower == "testnot") {
        newEnclosure = new tsts_1.TstTestNotSuite(cell);
    }
    else if (cell.pos.col == 0) {
        // if it's none of these special operators, it's an assignment,
        // but note that assignments can only occur in column 0.  if an 
        // unknown word appears elsewhere in the tree, it's an error.
        newEnclosure = new tsts_1.TstAssignment(cell);
    }
    else {
        // this is an error, flag it for the programmer.  EnclosureComponent
        // defines some useful default behavior in case of this kind of error,
        // like making sure that the child and/or sibling are compiled and 
        // checked for errors.
        newEnclosure = new tsts_1.TstEnclosure(cell);
        cell.markError("error", "Unknown operator", `Operator ${trimmedText} not recognized.`);
    }
    newEnclosure.mark();
    return newEnclosure;
}
class SheetProject {
    constructor(devEnv, mainSheetName) {
        this.devEnv = devEnv;
        this.mainSheetName = mainSheetName;
        this.sheets = {};
        this.addSheet(mainSheetName);
    }
    hasSheet(name) {
        return name in this.sheets;
    }
    addSheet(sheetName) {
        if (this.hasSheet(sheetName)) {
            // already loaded it, don't have to do anything
            return;
        }
        if (!this.devEnv.hasSource(sheetName)) {
            // this is probably a programmer error, in which they've attempted
            // to reference a non-existant symbol, and we're trying to load it as
            // a possible source file.  we don't freak out about it here, though;
            // that symbol will generate an error message at the appropriate place.
            return;
        }
        const cells = this.devEnv.loadSource(sheetName);
        const sheet = new Sheet(this, sheetName, cells);
        this.sheets[sheetName] = sheet;
        const tst = this.toTST();
        const ast = tst.toAST();
        // check to see if any names didn't get resolved
        const unresolvedNames = new Set();
        for (const name of ast.qualifyNames()) {
            const firstPart = name.split(".")[0];
            unresolvedNames.add(firstPart);
        }
        for (const possibleSheetName of unresolvedNames) {
            this.addSheet(possibleSheetName);
        }
        return;
    }
    toTST() {
        const result = new tsts_1.TstProject();
        for (const [sheetName, sheet] of Object.entries(this.sheets)) {
            if (sheetName == this.mainSheetName) {
                continue; // save this for last
            }
            const tstSheet = sheet.toTST();
            result.addSheet(tstSheet);
        }
        if (!(this.mainSheetName in this.sheets)) {
            return result; // unset or incorrect main sheet name
        }
        const mainTstSheet = this.sheets[this.mainSheetName].toTST();
        result.addSheet(mainTstSheet);
        return result;
    }
    markError(sheet, row, col, shortMsg, longMsg, severity) {
        this.devEnv.markError(sheet, row, col, shortMsg, longMsg, severity);
    }
    markComment(sheet, row, col) {
        this.devEnv.markComment(sheet, row, col);
    }
    markCommand(sheet, row, col) {
        this.devEnv.markCommand(sheet, row, col);
    }
    markHeader(name, row, col, color) {
        this.devEnv.markHeader(name, row, col, color);
    }
    markContent(name, row, col, color) {
        this.devEnv.markContent(name, row, col, color);
    }
}
exports.SheetProject = SheetProject;
class Sheet {
    constructor(project, name, cells) {
        this.project = project;
        this.name = name;
        this.cells = cells;
    }
    //public cells: SheetCell[][] = [];
    markError(row, col, severity, shortMsg, longMsg) {
        this.project.markError(this.name, row, col, shortMsg, longMsg, severity);
    }
    markHeader(row, col, color) {
        this.project.markHeader(this.name, row, col, color);
    }
    markContent(row, col, color) {
        this.project.markContent(this.name, row, col, color);
    }
    markComment(row, col) {
        this.project.markComment(this.name, row, col);
    }
    markCommand(row, col) {
        this.project.markCommand(this.name, row, col);
    }
    /**
     * Parses a grid of cells into a syntax tree -- specifically, a "Tabular Syntax Tree (TST)" that
     * represents structures in the tabular syntax.
     *
     * This is probably the least-intuitive algorithm in the whole engine, but here's the rough idea:
     *
     * We conceptualize the grid as a nested set of "enclosures", objects representing a cell (like
     * the cell labeled "2" below) that "encloses" a rectangular region of cells to its right and
     * below.  "2" below encloses all the cells labeled A.  Enclosures can contain enclosures; 2 and
     * 3 below are both enclosed by 1.
     *
        
        * 1: 2: A  A  A  A  A
        *       A  A  A  A  A
        *       A  A  A  A  A
        *    3: B  B  B  B  B
        *       B  B  B  B  B
        * 4: C  C  C  C  C  C
        *    C  C  C  C  C  C
    
     * Since they can contain each other, the parse algorithm below maintains a stack of them.  When
     * parsing that first A, for example, the state of the stack would be [1,2].
     *
     * Enclosures are defined as enclosing until there's something in the cell below them, or
     * below and to the left, at which point the enclosure is popped off the stack and we start
     * a new enclosure.  For example, 3 finishes 2, and 4 finishes both 3 and 1.
     *
     * Along with the enclosure object, the stack also stores the top row of that enclosure, and the column
     * index that will pop the enclosure off the stack (if we encounter a filled cell less-than-or-
     * equal-to it).  This isn't always the same as the column it originally started in.  There's a
     * component called [TstTable] that represents just that rectangle alone -- just the A's, for
     * example -- and its critical column is the one just to the left of its first cell.  (If this weren't
     * the case, the first A in the second row would pop off the table it was supposed to be added to.)
     * The critical column info used to be stored by each enclosure object itself, but in the end I
     * felt that was information not relevant to the object itself.  It's only relevant to this algorithm,
     * so it should just stay here.
     */
    toTST() {
        // sheets are treated as having an invisible cell containing "__START__" at 0, -1
        var startCell = new SheetCell(this, "__START__", 0, -1);
        var result = new tsts_1.TstSheet(this.name, startCell);
        var stack = [{ tst: result, row: 0, col: -1 }];
        // Now iterate through the cells, left-to-right top-to-bottom
        for (var rowIndex = 0; rowIndex < this.cells.length; rowIndex++) {
            if (isLineEmpty(this.cells[rowIndex])) {
                continue;
            }
            const rowIsComment = this.cells[rowIndex][0].trim().startsWith('%%');
            for (var colIndex = 0; colIndex < this.cells[rowIndex].length; colIndex++) {
                const cellText = this.cells[rowIndex][colIndex].trim();
                const cell = new SheetCell(this, cellText, rowIndex, colIndex);
                if (rowIsComment) {
                    const comment = new tsts_1.TstComment(cell);
                    comment.mark();
                    continue;
                }
                let top = stack[stack.length - 1];
                // next check if the current cell pops anything off the stack.  keep popping
                // until the top of the stack is allowed to add this cell as a child op, header,
                // or content
                if (cell.text != "" && rowIndex > top.row) {
                    while (colIndex <= top.col) {
                        stack.pop();
                        top = stack[stack.length - 1];
                    }
                }
                // next check if this is "content" -- that is, something to the lower left
                // of the topmost op.  NB: This is the only kind of operation we'll do on 
                // empty cells, so that, if appropriate, we can mark them for syntax highlighting.
                if (top.tst instanceof tsts_1.TstTable && colIndex >= top.col && rowIndex > top.row) {
                    top.tst.addContent(cell);
                    continue;
                }
                // all of the following steps require there to be some explicit content
                if (cellText.length == 0) {
                    continue;
                }
                // either we're still in the spec row, or there's no spec row yet
                if (cellText.endsWith(":")) {
                    // it's an operation, which starts a new enclosure
                    const newOp = constructOp(cell);
                    try {
                        top.tst.addChild(newOp);
                        const newTop = { tst: newOp, row: rowIndex, col: colIndex };
                        stack.push(newTop);
                    }
                    catch (e) {
                        cell.markError("error", `Unexpected operator: ${cell.text}`, "This looks like an operator, but only a header can follow a header.");
                    }
                    continue;
                }
                // it's a header
                try {
                    const headerCell = new tsts_1.TstHeader(cell);
                    headerCell.mark();
                    if (!(top.tst instanceof tsts_1.TstTable)) {
                        const newTable = new tsts_1.TstTable(cell);
                        top.tst.addChild(newTable);
                        top = { tst: newTable, row: rowIndex, col: colIndex - 1 };
                        stack.push(top);
                    }
                    top.tst.addHeader(headerCell);
                }
                catch (e) {
                    cell.markError("error", `Invalid header: ${cell.text}`, e.message);
                }
            }
        }
        return result;
    }
}
exports.Sheet = Sheet;
class SheetCell {
    constructor(sheet, text, row, col) {
        this.sheet = sheet;
        this.text = text;
        this.row = row;
        this.col = col;
    }
    markHeader(color) {
        this.sheet.markHeader(this.row, this.col, color);
    }
    markContent(color) {
        this.sheet.markContent(this.row, this.col, color);
    }
    markError(severity, shortMsg, longMsg) {
        this.sheet.markError(this.row, this.col, severity, shortMsg, longMsg);
    }
    markComment() {
        this.sheet.markComment(this.pos.row, this.pos.col);
    }
    markCommand() {
        this.sheet.markCommand(this.pos.row, this.pos.col);
    }
    get pos() {
        return new util_1.CellPos(this.sheet.name, this.row, this.col);
    }
}
exports.SheetCell = SheetCell;

},{"./headers":6,"./tsts":11,"./util":12}],10:[function(require,module,exports){
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
    *getStrings(random = false) {
        var results = [""];
        var currentTape = this;
        // step backward through the current object and its prevs, building the output strings from
        // right to left.  (you might think this would be more elegant to be done recursively, but it blows
        // the stack when stringifying long outputs.)
        while (currentTape != undefined) {
            const newResults = [];
            let possibleChars = currentTape.tape.fromBits(currentTape.tape.tapeName, currentTape.token.bits);
            if (random) {
                // if we're randomizing, just choose one possible char
                possibleChars = [possibleChars[Math.floor(Math.random() * possibleChars.length)]];
            }
            for (const c of possibleChars) {
                for (const existingResult of results) {
                    newResults.push(c + existingResult);
                }
            }
            results = newResults;
            currentTape = currentTape.prev;
        }
        yield* results;
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
        if (tape.isTrivial) {
            return this;
        }
        const result = new MultiTapeOutput();
        result.singleTapeOutputs = new Map(this.singleTapeOutputs);
        const prev = this.singleTapeOutputs.get(tape.tapeName);
        const newTape = new SingleTapeOutput(tape, token, prev);
        result.singleTapeOutputs.set(tape.tapeName, newTape);
        return result;
    }
    toStrings(random = false) {
        var results = [{}];
        for (const [tapeName, tape] of this.singleTapeOutputs) {
            var newResults = [];
            for (const str of tape.getStrings(random)) {
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
    constructor(parent = undefined) {
        this.parent = parent;
    }
    getTape(tapeName) {
        if (this.parent == undefined) {
            return undefined;
        }
        return this.parent.getTape(tapeName);
    }
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
    get vocabSize() {
        return 0;
    }
    toToken(tapeName, char) {
        return new Token(this.toBits(tapeName, char));
    }
    fromToken(tapeName, token) {
        return this.fromBits(tapeName, token.bits);
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
    stringify(tape) {
        return tape.fromBits(tape.tapeName, this.bits).join("|");
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
    constructor(parent, tapeName, current = undefined, prev = undefined, strToIndex = new Map(), indexToStr = new Map()) {
        super(parent);
        this.tapeName = tapeName;
        this.current = current;
        this.prev = prev;
        this.strToIndex = strToIndex;
        this.indexToStr = indexToStr;
    }
    get isTrivial() {
        return false;
    }
    get vocabSize() {
        return this.strToIndex.size;
    }
    getTapeNames() {
        return new Set([this.tapeName]);
    }
    inVocab(tapeName, str) {
        if (tapeName != this.tapeName) {
            throw new Error(`Trying to check vocab for tape ${tapeName} on tape ${this.tapeName}`);
        }
        for (const c of str.split("")) {
            var index = this.strToIndex.get(c);
            if (index == undefined) {
                return false;
            }
        }
        return true;
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
    /*
    public append(token: Token) {
        return new StringTape(this.tapeName, token,
                this, this.strToIndex, this.indexToStr);
    } */
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
    get isTrivial() {
        return this.tapes.size == 0;
    }
    inVocab(tapeName, str) {
        var tape = this.tapes.get(tapeName);
        if (tape == undefined) {
            return false;
        }
        return tape.inVocab(tapeName, str);
    }
    /*
    public addTape(tape: Tape): void {
        this.tapes.set(tape.tapeName, tape);
    } */
    getTapeNames() {
        return new Set(this.tapes.keys());
    }
    getTape(tapeName) {
        return this.tapes.get(tapeName);
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
            tape = new StringTape(this, tapeName);
            this.tapes.set(tapeName, tape);
        }
        return tape.tokenize(tapeName, str);
    }
    matchTape(tapeName) {
        return this.tapes.get(tapeName);
    }
    split(tapeNames) {
        const wheat = new TapeCollection();
        const chaff = new TapeCollection();
        for (const [tapeName, tape] of this.tapes.entries()) {
            if (tapeNames.has(tapeName)) {
                wheat.tapes.set(tapeName, tape);
                continue;
            }
            chaff.tapes.set(tapeName, tape);
        }
        return [wheat, chaff];
    }
    get size() {
        return this.tapes.size;
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
    any() {
        return exports.ANY_CHAR;
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
        const childName = this.child.tapeName;
        if (childName == this.toTape) {
            return this.fromTape;
        }
        return childName;
    }
    inVocab(tapeName, str) {
        tapeName = this.adjustTapeName(tapeName);
        return this.child.inVocab(tapeName, str);
    }
    get isTrivial() {
        return this.child.isTrivial;
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
    getTapeNames() {
        const result = [...this.child.getTapeNames()]
            .filter(s => this.adjustTapeName(s));
        return new Set(result);
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
    getTape(tapeName) {
        if (this.parent == undefined) {
            return undefined;
        }
        tapeName = this.adjustTapeName(tapeName);
        return this.parent.getTape(tapeName);
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

},{"bitset":1}],11:[function(require,module,exports){
"use strict";
/**
 * This file describes the parser that turns spreadsheets into abstract
 * syntax trees -- [AstComponent]s from ast.ts -- which are in turn transformed
 * into the expressions that the parse/generation engine actually operates on.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TstTable = exports.TstProject = exports.TstSheet = exports.TstAssignment = exports.TstTestNotSuite = exports.TstTestSuite = exports.TstTableOp = exports.TstApply = exports.TstBinaryOp = exports.TstEnclosure = exports.TstComment = exports.TstHeadedCell = exports.TstHeader = exports.TstComponent = void 0;
const ast_1 = require("./ast");
const util_1 = require("./util");
const headers_1 = require("./headers");
class TstComponent {
    constructor(cell) {
        this.cell = cell;
    }
    get text() {
        return this.cell.text;
    }
    get pos() {
        return this.cell.pos;
    }
    mark() { }
    markError(shortMsg, msg) {
        this.cell.markError("error", shortMsg, msg);
    }
    markWarning(shortMsg, msg) {
        this.cell.markError("warning", shortMsg, msg);
    }
}
exports.TstComponent = TstComponent;
class TstHeader extends TstComponent {
    constructor(cell) {
        super(cell);
        this.header = headers_1.parseHeaderCell(cell.text);
        if (this.header instanceof headers_1.ReservedErrorHeader) {
            this.cell.markError("error", `Reserved word in header`, `This header contains a reserved word in an invalid position`);
        }
        else if (this.header instanceof headers_1.ErrorHeader) {
            this.cell.markError("error", `Invalid header`, `This header cannot be parsed.`);
        }
    }
    mark() {
        const color = this.getColor(0.1);
        this.cell.markHeader(color);
    }
    getColor(saturation = headers_1.DEFAULT_SATURATION, value = headers_1.DEFAULT_VALUE) {
        return this.header.getColor(saturation, value);
    }
    headerToAST(left, content) {
        const ast = this.header.toAST(left, content.text, content);
        ast.cell = content;
        return ast;
    }
}
exports.TstHeader = TstHeader;
class TstHeadedCell extends TstComponent {
    constructor(prev, header, content) {
        super(content);
        this.prev = prev;
        this.header = header;
    }
    mark() {
        const color = this.header.getColor(0.1);
        this.cell.markContent(color);
    }
    toAST() {
        let prevAst = new ast_1.AstEpsilon(this.cell);
        if (this.prev != undefined) {
            prevAst = this.prev.toAST();
        }
        if (this.cell.text.length == 0) {
            return prevAst;
        }
        return this.header.headerToAST(prevAst, this.cell);
    }
}
exports.TstHeadedCell = TstHeadedCell;
class TstComment extends TstComponent {
    mark() {
        this.cell.markComment();
    }
    toAST() {
        return new ast_1.AstEpsilon(this.cell);
    }
}
exports.TstComment = TstComment;
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
 */
class TstEnclosure extends TstComponent {
    constructor(cell) {
        super(cell);
        this.specRow = -1;
        /**
         * The previous sibling of the component (i.e. the component that shares
         * the same parent, but appeared before this component, usually directly
         * above this one).
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
        this.specRow = cell.pos.row;
    }
    mark() {
        this.cell.markCommand();
    }
    toAST() {
        // we only ever end up in this base EncloseComponent compile if it wasn't
        // a known operator.  this is an error, but we flag it for the programmer
        // elsewhere.
        // in order to fail gracefully, we define the State of this component as 
        // its sibling's state (if a sibling is present), and if not, as its child's 
        // state (if present), and if not, the empty grammar.
        let result = new ast_1.AstEpsilon(this.cell);
        if (this.child != undefined) {
            result = this.child.toAST();
        }
        if (this.sibling != undefined) {
            result = this.sibling.toAST();
        }
        return result;
    }
    addChild(child) {
        if (this.child != undefined &&
            this.child.pos.col != child.pos.col) {
            child.markWarning("Unexpected operator", "This operator is in an unexpected column.  Did you mean for it " +
                `to be in column ${this.child.pos.col}, ` +
                `so that it's under the operator in cell ${this.child.pos}?`);
        }
        child.sibling = this.child;
        this.child = child;
        return child;
    }
}
exports.TstEnclosure = TstEnclosure;
class TstBinaryOp extends TstEnclosure {
    toAST() {
        const trimmedText = this.text.slice(0, this.text.length - 1).trim();
        const op = headers_1.BINARY_OPS[trimmedText];
        let childAst = new ast_1.AstEpsilon(this.cell);
        let siblingAst = new ast_1.AstEpsilon(this.cell);
        if (this.child == undefined) {
            this.markError(`Missing argument to '${trimmedText}'`, `'${trimmedText}' is missing a second argument; ` +
                "something should be in the cell to the right.");
        }
        else {
            childAst = this.child.toAST();
        }
        if (this.sibling == undefined) {
            this.markError(`Missing argument to '${trimmedText}'`, `'${trimmedText}' is missing a first argument; ` +
                "something should be in a cell above this.");
        }
        else {
            siblingAst = this.sibling.toAST();
        }
        return op(this.cell, siblingAst, childAst);
    }
}
exports.TstBinaryOp = TstBinaryOp;
class TstApply extends TstEnclosure {
}
exports.TstApply = TstApply;
class TstTableOp extends TstEnclosure {
    toAST() {
        if (this.sibling != undefined) {
            // TODO: Content obliteration warning
            this.sibling.toAST();
        }
        if (this.child == undefined) {
            this.markWarning("Empty table", "'table' seems to be missing a table; " +
                "something should be in the cell to the right.");
            return new ast_1.AstEpsilon(this.cell);
        }
        return this.child.toAST();
    }
}
exports.TstTableOp = TstTableOp;
class TstAbstractTestSuite extends TstEnclosure {
    constructor() {
        super(...arguments);
        this.tests = [];
    }
    /**
     * "test" is an operator that takes two tables, one above (spatially speaking)
     * and one to the right, and makes sure that each line of the one to the right
     * has an output when filtering the table above.
     *
     * Test doesn't make any change to the State it returns; adding a "test" below
     * a grammar returns the exact same grammar as otherwise.
     */
    toAST() {
        if (this.sibling == undefined) {
            this.markError("Wayward test", "There should be something above this 'test' command for us to test");
            return new ast_1.AstEpsilon(this.cell);
        }
        const siblingAst = this.sibling.toAST();
        if (this.child == undefined) {
            this.markWarning("Empty test", "'test' seems to be missing something to test; " +
                "something should be in the cell to the right.");
            return siblingAst; // whereas usually we result in the 
            // empty grammar upon erroring, in this case
            // we don't want to let a flubbed "test" command 
            // obliterate the grammar it was meant to test!
        }
        if (!(this.child instanceof TstTable)) {
            this.markError("Cannot execute tests", "You can't nest another operator to the right of a test block, " +
                "it has to be a content table.");
            return siblingAst;
        }
        this.tests = this.child.rows;
        return siblingAst;
    }
}
class TstTestSuite extends TstAbstractTestSuite {
}
exports.TstTestSuite = TstTestSuite;
class TstTestNotSuite extends TstAbstractTestSuite {
}
exports.TstTestNotSuite = TstTestNotSuite;
class TstAssignment extends TstEnclosure {
    assign(ns, ast) {
        // determine what symbol you're assigning to
        const trimmedText = this.text.slice(0, this.text.length - 1).trim();
        const trimmedTextLower = trimmedText.toLowerCase();
        if (headers_1.RESERVED_WORDS.has(trimmedTextLower)) {
            // oops, assigning to a reserved word
            this.markError("Assignment to reserved word", "This cell has to be a symbol name for an assignment statement, but you're assigning to the " +
                `reserved word ${trimmedText}.  Choose a different symbol name.`);
        }
        if (this.child == undefined) {
            // oops, empty "right side" of the assignment!
            this.markWarning("Empty assignment", `This looks like an assignment to a symbol ${trimmedText}, ` +
                "but there's nothing to the right of it.");
            return;
        }
        try {
            ns.addSymbol(trimmedText, ast);
        }
        catch (e) {
            this.markError('Invalid assignment', e.message);
        }
    }
    toAST() {
        if (this.child != undefined) {
            return this.child.toAST();
        }
        return new ast_1.AstEpsilon(this.cell);
    }
}
exports.TstAssignment = TstAssignment;
class TstSheet extends TstEnclosure {
    constructor(name, cell) {
        super(cell);
        this.name = name;
    }
    getChildren() {
        let children = [];
        let c = this.child;
        while (c != undefined) {
            children = [c, ...children];
            c = c.sibling;
        }
        return children;
    }
    toAST() {
        const ns = new ast_1.AstNamespace(this.cell, this.name);
        if (this.child == undefined) {
            return ns;
        }
        let child = undefined;
        let ast = undefined;
        for (child of this.getChildren()) {
            ast = child.toAST();
            if (child instanceof TstAssignment) {
                child.assign(ns, ast);
            }
        }
        // The last child of a sheet is its "default" value; if you refer to 
        // a sheet without naming any particular symbol defined in that sheet, 
        // its value is the value of the last expression on the sheet.  This
        // last expression does not necessarily have to be an assignment, but it 
        // still has to be called *something* in order to be stored in the namespace;
        // we call it "__DEFAULT__".  We never actually call it by that name anywhere, 
        // although you could.
        if (child != undefined && ast != undefined && !(child instanceof TstAssignment)) {
            ns.addSymbol("__DEFAULT__", ast);
        }
        return ns;
    }
}
exports.TstSheet = TstSheet;
class TstProject {
    constructor() {
        this.sheets = {};
    }
    addSheet(sheet) {
        this.sheets[sheet.name] = sheet;
    }
    toAST() {
        const ns = new ast_1.AstNamespace(new util_1.DummyCell(), "");
        for (const [name, sheet] of Object.entries(this.sheets)) {
            const ast = sheet.toAST();
            ns.addSymbol(name, ast);
        }
        return ns;
    }
}
exports.TstProject = TstProject;
/**
 * A TstTable is a rectangular region of the grid consisting of a header row
 * and cells beneath each header.  For example,
 *
 *      text, gloss
 *      foo, run
 *      moo, jump
 *      goo, climb
 *
 * Each header indicates how each cell beneath it should be interpreted; "foo"
 * should be interpret as "text".  Note that these are not necessarily
 * well-formed database tables; it's not uncommon to get tables where the same
 * header appears multiple times.
 */
class TstTable extends TstEnclosure {
    constructor() {
        super(...arguments);
        /**
         * We need to remember headers by column number,
         * because that's how we know which cells are associated
         * with which headers
         */
        this.headersByCol = {};
        /**
         * Each row is represented by the last cell in that row
         */
        this.rows = [];
    }
    addHeader(headerCell) {
        this.headersByCol[headerCell.pos.col] = headerCell;
    }
    addContent(cell) {
        // make sure we have a header
        const headerCell = this.headersByCol[cell.pos.col];
        if (headerCell == undefined) {
            if (cell.text.length != 0) {
                cell.markError("warning", `Ignoring cell: ${cell.text}`, "Cannot associate this cell with any valid header above; ignoring.");
            }
            return;
        }
        if (this.rows.length == 0 || cell.pos.row != this.rows[this.rows.length - 1].pos.row) {
            // we need to start an new row, make a new cell with no prev sibling
            const newRow = new TstHeadedCell(undefined, headerCell, cell);
            newRow.mark();
            this.rows.push(newRow);
            return;
        }
        // we're continuing an old row, use the last one as the previous sibling
        const lastRow = this.rows[this.rows.length - 1];
        const newRow = new TstHeadedCell(lastRow, headerCell, cell);
        newRow.mark();
        this.rows[this.rows.length - 1] = newRow;
    }
    addChild(newChild) {
        throw new Error("TstTables cannot have children");
    }
    toAST() {
        if (this.sibling != undefined) {
            this.sibling.toAST();
        }
        var rowStates = this.rows.map(row => row.toAST())
            .filter(ast => !(ast instanceof ast_1.AstEpsilon));
        return new ast_1.AstAlternation(this.cell, rowStates);
    }
}
exports.TstTable = TstTable;

},{"./ast":2,"./headers":6,"./util":12}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setChain = exports.setDifference = exports.setIntersection = exports.flatten = exports.setUnion = exports.RGBtoString = exports.HSVtoRGB = exports.iterTake = exports.shuffleArray = exports.meanAngleDeg = exports.DUMMY_POSITION = exports.DummyCell = exports.CellPos = void 0;
/**
 * A convenience class encapsulating information about where a cell
 * is.  Every component of the abstract syntax tree has one of these;
 * if it's a cell, that's just its position on a spreadsheet; if it's a
 * complex component, it's the position of its first cell.
 *
 * By convention we treat the spreadsheet itself as a component with
 * its first cell at -1, -1.
 */
class CellPos {
    constructor(sheet = "?", row = -1, col = -1) {
        this.sheet = sheet;
        this.row = row;
        this.col = col;
    }
    toString() {
        return `${this.sheet}:${this.row}:${this.col}`;
    }
}
exports.CellPos = CellPos;
class DummyCell {
    markHeader(color) { }
    markError(severity, shortMsg, longMsg) { }
    markComment() { }
    markCommand() { }
}
exports.DummyCell = DummyCell;
exports.DUMMY_POSITION = new CellPos("?", -1, -1);
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
/* Randomize array in-place using Durstenfeld shuffle algorithm */
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}
exports.shuffleArray = shuffleArray;
function iterTake(gen, n) {
    var i = 1;
    const results = [];
    if (n <= 0) {
        throw new Error("Invalid index");
    }
    for (const value of gen) {
        results.push(value);
        if (i++ == n) {
            break;
        }
    }
    return results;
}
exports.iterTake = iterTake;
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
function setUnion(s1, s2) {
    return new Set([...s1, ...s2]);
}
exports.setUnion = setUnion;
function flatten(ss) {
    var results = [];
    for (const s of ss) {
        results = results.concat(...s);
    }
    return results;
}
exports.flatten = flatten;
function setIntersection(s1, s2) {
    return new Set([...s1].filter(i => s2.has(i)));
}
exports.setIntersection = setIntersection;
function setDifference(s1, s2) {
    return new Set([...s1].filter(x => !s2.has(x)));
}
exports.setDifference = setDifference;
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

},{}]},{},[7])(7)
});
