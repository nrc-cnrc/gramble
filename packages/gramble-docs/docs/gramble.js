(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.gramble = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/*!
 * assertion-error
 * Copyright(c) 2013 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * Return a function that will copy properties from
 * one object to another excluding any originally
 * listed. Returned function will create a new `{}`.
 *
 * @param {String} excluded properties ...
 * @return {Function}
 */

function exclude () {
  var excludes = [].slice.call(arguments);

  function excludeProps (res, obj) {
    Object.keys(obj).forEach(function (key) {
      if (!~excludes.indexOf(key)) res[key] = obj[key];
    });
  }

  return function extendExclude () {
    var args = [].slice.call(arguments)
      , i = 0
      , res = {};

    for (; i < args.length; i++) {
      excludeProps(res, args[i]);
    }

    return res;
  };
};

/*!
 * Primary Exports
 */

module.exports = AssertionError;

/**
 * ### AssertionError
 *
 * An extension of the JavaScript `Error` constructor for
 * assertion and validation scenarios.
 *
 * @param {String} message
 * @param {Object} properties to include (optional)
 * @param {callee} start stack function (optional)
 */

function AssertionError (message, _props, ssf) {
  var extend = exclude('name', 'message', 'stack', 'constructor', 'toJSON')
    , props = extend(_props || {});

  // default values
  this.message = message || 'Unspecified AssertionError';
  this.showDiff = false;

  // copy from properties
  for (var key in props) {
    this[key] = props[key];
  }

  // capture stack trace
  ssf = ssf || AssertionError;
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, ssf);
  } else {
    try {
      throw new Error();
    } catch(e) {
      this.stack = e.stack;
    }
  }
}

/*!
 * Inherit from Error.prototype
 */

AssertionError.prototype = Object.create(Error.prototype);

/*!
 * Statically set name
 */

AssertionError.prototype.name = 'AssertionError';

/*!
 * Ensure correct constructor
 */

AssertionError.prototype.constructor = AssertionError;

/**
 * Allow errors to be converted to JSON for static transfer.
 *
 * @param {Boolean} include stack (default: `true`)
 * @return {Object} object that can be `JSON.stringify`
 */

AssertionError.prototype.toJSON = function (stack) {
  var extend = exclude('constructor', 'toJSON', 'stack')
    , props = extend({ name: this.name }, this);

  // include stack if exists and not turned off
  if (false !== stack && this.stack) {
    props.stack = this.stack;
  }

  return props;
};

},{}],2:[function(require,module,exports){
module.exports = require('./lib/chai');

},{"./lib/chai":3}],3:[function(require,module,exports){
/*!
 * chai
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var used = [];

/*!
 * Chai version
 */

exports.version = '4.2.0';

/*!
 * Assertion Error
 */

exports.AssertionError = require('assertion-error');

/*!
 * Utils for plugins (not exported)
 */

var util = require('./chai/utils');

/**
 * # .use(function)
 *
 * Provides a way to extend the internals of Chai.
 *
 * @param {Function}
 * @returns {this} for chaining
 * @api public
 */

exports.use = function (fn) {
  if (!~used.indexOf(fn)) {
    fn(exports, util);
    used.push(fn);
  }

  return exports;
};

/*!
 * Utility Functions
 */

exports.util = util;

/*!
 * Configuration
 */

var config = require('./chai/config');
exports.config = config;

/*!
 * Primary `Assertion` prototype
 */

var assertion = require('./chai/assertion');
exports.use(assertion);

/*!
 * Core Assertions
 */

var core = require('./chai/core/assertions');
exports.use(core);

/*!
 * Expect interface
 */

var expect = require('./chai/interface/expect');
exports.use(expect);

/*!
 * Should interface
 */

var should = require('./chai/interface/should');
exports.use(should);

/*!
 * Assert interface
 */

var assert = require('./chai/interface/assert');
exports.use(assert);

},{"./chai/assertion":4,"./chai/config":5,"./chai/core/assertions":6,"./chai/interface/assert":7,"./chai/interface/expect":8,"./chai/interface/should":9,"./chai/utils":23,"assertion-error":1}],4:[function(require,module,exports){
/*!
 * chai
 * http://chaijs.com
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var config = require('./config');

module.exports = function (_chai, util) {
  /*!
   * Module dependencies.
   */

  var AssertionError = _chai.AssertionError
    , flag = util.flag;

  /*!
   * Module export.
   */

  _chai.Assertion = Assertion;

  /*!
   * Assertion Constructor
   *
   * Creates object for chaining.
   *
   * `Assertion` objects contain metadata in the form of flags. Three flags can
   * be assigned during instantiation by passing arguments to this constructor:
   *
   * - `object`: This flag contains the target of the assertion. For example, in
   *   the assertion `expect(numKittens).to.equal(7);`, the `object` flag will
   *   contain `numKittens` so that the `equal` assertion can reference it when
   *   needed.
   *
   * - `message`: This flag contains an optional custom error message to be
   *   prepended to the error message that's generated by the assertion when it
   *   fails.
   *
   * - `ssfi`: This flag stands for "start stack function indicator". It
   *   contains a function reference that serves as the starting point for
   *   removing frames from the stack trace of the error that's created by the
   *   assertion when it fails. The goal is to provide a cleaner stack trace to
   *   end users by removing Chai's internal functions. Note that it only works
   *   in environments that support `Error.captureStackTrace`, and only when
   *   `Chai.config.includeStack` hasn't been set to `false`.
   *
   * - `lockSsfi`: This flag controls whether or not the given `ssfi` flag
   *   should retain its current value, even as assertions are chained off of
   *   this object. This is usually set to `true` when creating a new assertion
   *   from within another assertion. It's also temporarily set to `true` before
   *   an overwritten assertion gets called by the overwriting assertion.
   *
   * @param {Mixed} obj target of the assertion
   * @param {String} msg (optional) custom error message
   * @param {Function} ssfi (optional) starting point for removing stack frames
   * @param {Boolean} lockSsfi (optional) whether or not the ssfi flag is locked
   * @api private
   */

  function Assertion (obj, msg, ssfi, lockSsfi) {
    flag(this, 'ssfi', ssfi || Assertion);
    flag(this, 'lockSsfi', lockSsfi);
    flag(this, 'object', obj);
    flag(this, 'message', msg);

    return util.proxify(this);
  }

  Object.defineProperty(Assertion, 'includeStack', {
    get: function() {
      console.warn('Assertion.includeStack is deprecated, use chai.config.includeStack instead.');
      return config.includeStack;
    },
    set: function(value) {
      console.warn('Assertion.includeStack is deprecated, use chai.config.includeStack instead.');
      config.includeStack = value;
    }
  });

  Object.defineProperty(Assertion, 'showDiff', {
    get: function() {
      console.warn('Assertion.showDiff is deprecated, use chai.config.showDiff instead.');
      return config.showDiff;
    },
    set: function(value) {
      console.warn('Assertion.showDiff is deprecated, use chai.config.showDiff instead.');
      config.showDiff = value;
    }
  });

  Assertion.addProperty = function (name, fn) {
    util.addProperty(this.prototype, name, fn);
  };

  Assertion.addMethod = function (name, fn) {
    util.addMethod(this.prototype, name, fn);
  };

  Assertion.addChainableMethod = function (name, fn, chainingBehavior) {
    util.addChainableMethod(this.prototype, name, fn, chainingBehavior);
  };

  Assertion.overwriteProperty = function (name, fn) {
    util.overwriteProperty(this.prototype, name, fn);
  };

  Assertion.overwriteMethod = function (name, fn) {
    util.overwriteMethod(this.prototype, name, fn);
  };

  Assertion.overwriteChainableMethod = function (name, fn, chainingBehavior) {
    util.overwriteChainableMethod(this.prototype, name, fn, chainingBehavior);
  };

  /**
   * ### .assert(expression, message, negateMessage, expected, actual, showDiff)
   *
   * Executes an expression and check expectations. Throws AssertionError for reporting if test doesn't pass.
   *
   * @name assert
   * @param {Philosophical} expression to be tested
   * @param {String|Function} message or function that returns message to display if expression fails
   * @param {String|Function} negatedMessage or function that returns negatedMessage to display if negated expression fails
   * @param {Mixed} expected value (remember to check for negation)
   * @param {Mixed} actual (optional) will default to `this.obj`
   * @param {Boolean} showDiff (optional) when set to `true`, assert will display a diff in addition to the message if expression fails
   * @api private
   */

  Assertion.prototype.assert = function (expr, msg, negateMsg, expected, _actual, showDiff) {
    var ok = util.test(this, arguments);
    if (false !== showDiff) showDiff = true;
    if (undefined === expected && undefined === _actual) showDiff = false;
    if (true !== config.showDiff) showDiff = false;

    if (!ok) {
      msg = util.getMessage(this, arguments);
      var actual = util.getActual(this, arguments);
      throw new AssertionError(msg, {
          actual: actual
        , expected: expected
        , showDiff: showDiff
      }, (config.includeStack) ? this.assert : flag(this, 'ssfi'));
    }
  };

  /*!
   * ### ._obj
   *
   * Quick reference to stored `actual` value for plugin developers.
   *
   * @api private
   */

  Object.defineProperty(Assertion.prototype, '_obj',
    { get: function () {
        return flag(this, 'object');
      }
    , set: function (val) {
        flag(this, 'object', val);
      }
  });
};

},{"./config":5}],5:[function(require,module,exports){
module.exports = {

  /**
   * ### config.includeStack
   *
   * User configurable property, influences whether stack trace
   * is included in Assertion error message. Default of false
   * suppresses stack trace in the error message.
   *
   *     chai.config.includeStack = true;  // enable stack on error
   *
   * @param {Boolean}
   * @api public
   */

  includeStack: false,

  /**
   * ### config.showDiff
   *
   * User configurable property, influences whether or not
   * the `showDiff` flag should be included in the thrown
   * AssertionErrors. `false` will always be `false`; `true`
   * will be true when the assertion has requested a diff
   * be shown.
   *
   * @param {Boolean}
   * @api public
   */

  showDiff: true,

  /**
   * ### config.truncateThreshold
   *
   * User configurable property, sets length threshold for actual and
   * expected values in assertion errors. If this threshold is exceeded, for
   * example for large data structures, the value is replaced with something
   * like `[ Array(3) ]` or `{ Object (prop1, prop2) }`.
   *
   * Set it to zero if you want to disable truncating altogether.
   *
   * This is especially userful when doing assertions on arrays: having this
   * set to a reasonable large value makes the failure messages readily
   * inspectable.
   *
   *     chai.config.truncateThreshold = 0;  // disable truncating
   *
   * @param {Number}
   * @api public
   */

  truncateThreshold: 40,

  /**
   * ### config.useProxy
   *
   * User configurable property, defines if chai will use a Proxy to throw
   * an error when a non-existent property is read, which protects users
   * from typos when using property-based assertions.
   *
   * Set it to false if you want to disable this feature.
   *
   *     chai.config.useProxy = false;  // disable use of Proxy
   *
   * This feature is automatically disabled regardless of this config value
   * in environments that don't support proxies.
   *
   * @param {Boolean}
   * @api public
   */

  useProxy: true,

  /**
   * ### config.proxyExcludedKeys
   *
   * User configurable property, defines which properties should be ignored
   * instead of throwing an error if they do not exist on the assertion.
   * This is only applied if the environment Chai is running in supports proxies and
   * if the `useProxy` configuration setting is enabled.
   * By default, `then` and `inspect` will not throw an error if they do not exist on the
   * assertion object because the `.inspect` property is read by `util.inspect` (for example, when
   * using `console.log` on the assertion object) and `.then` is necessary for promise type-checking.
   *
   *     // By default these keys will not throw an error if they do not exist on the assertion object
   *     chai.config.proxyExcludedKeys = ['then', 'inspect'];
   *
   * @param {Array}
   * @api public
   */

  proxyExcludedKeys: ['then', 'catch', 'inspect', 'toJSON']
};

},{}],6:[function(require,module,exports){
/*!
 * chai
 * http://chaijs.com
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

module.exports = function (chai, _) {
  var Assertion = chai.Assertion
    , AssertionError = chai.AssertionError
    , flag = _.flag;

  /**
   * ### Language Chains
   *
   * The following are provided as chainable getters to improve the readability
   * of your assertions.
   *
   * **Chains**
   *
   * - to
   * - be
   * - been
   * - is
   * - that
   * - which
   * - and
   * - has
   * - have
   * - with
   * - at
   * - of
   * - same
   * - but
   * - does
   * - still
   *
   * @name language chains
   * @namespace BDD
   * @api public
   */

  [ 'to', 'be', 'been', 'is'
  , 'and', 'has', 'have', 'with'
  , 'that', 'which', 'at', 'of'
  , 'same', 'but', 'does', 'still' ].forEach(function (chain) {
    Assertion.addProperty(chain);
  });

  /**
   * ### .not
   *
   * Negates all assertions that follow in the chain.
   *
   *     expect(function () {}).to.not.throw();
   *     expect({a: 1}).to.not.have.property('b');
   *     expect([1, 2]).to.be.an('array').that.does.not.include(3);
   *
   * Just because you can negate any assertion with `.not` doesn't mean you
   * should. With great power comes great responsibility. It's often best to
   * assert that the one expected output was produced, rather than asserting
   * that one of countless unexpected outputs wasn't produced. See individual
   * assertions for specific guidance.
   *
   *     expect(2).to.equal(2); // Recommended
   *     expect(2).to.not.equal(1); // Not recommended
   *
   * @name not
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('not', function () {
    flag(this, 'negate', true);
  });

  /**
   * ### .deep
   *
   * Causes all `.equal`, `.include`, `.members`, `.keys`, and `.property`
   * assertions that follow in the chain to use deep equality instead of strict
   * (`===`) equality. See the `deep-eql` project page for info on the deep
   * equality algorithm: https://github.com/chaijs/deep-eql.
   *
   *     // Target object deeply (but not strictly) equals `{a: 1}`
   *     expect({a: 1}).to.deep.equal({a: 1});
   *     expect({a: 1}).to.not.equal({a: 1});
   *
   *     // Target array deeply (but not strictly) includes `{a: 1}`
   *     expect([{a: 1}]).to.deep.include({a: 1});
   *     expect([{a: 1}]).to.not.include({a: 1});
   *
   *     // Target object deeply (but not strictly) includes `x: {a: 1}`
   *     expect({x: {a: 1}}).to.deep.include({x: {a: 1}});
   *     expect({x: {a: 1}}).to.not.include({x: {a: 1}});
   *
   *     // Target array deeply (but not strictly) has member `{a: 1}`
   *     expect([{a: 1}]).to.have.deep.members([{a: 1}]);
   *     expect([{a: 1}]).to.not.have.members([{a: 1}]);
   *
   *     // Target set deeply (but not strictly) has key `{a: 1}`
   *     expect(new Set([{a: 1}])).to.have.deep.keys([{a: 1}]);
   *     expect(new Set([{a: 1}])).to.not.have.keys([{a: 1}]);
   *
   *     // Target object deeply (but not strictly) has property `x: {a: 1}`
   *     expect({x: {a: 1}}).to.have.deep.property('x', {a: 1});
   *     expect({x: {a: 1}}).to.not.have.property('x', {a: 1});
   *
   * @name deep
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('deep', function () {
    flag(this, 'deep', true);
  });

  /**
   * ### .nested
   *
   * Enables dot- and bracket-notation in all `.property` and `.include`
   * assertions that follow in the chain.
   *
   *     expect({a: {b: ['x', 'y']}}).to.have.nested.property('a.b[1]');
   *     expect({a: {b: ['x', 'y']}}).to.nested.include({'a.b[1]': 'y'});
   *
   * If `.` or `[]` are part of an actual property name, they can be escaped by
   * adding two backslashes before them.
   *
   *     expect({'.a': {'[b]': 'x'}}).to.have.nested.property('\\.a.\\[b\\]');
   *     expect({'.a': {'[b]': 'x'}}).to.nested.include({'\\.a.\\[b\\]': 'x'});
   *
   * `.nested` cannot be combined with `.own`.
   *
   * @name nested
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('nested', function () {
    flag(this, 'nested', true);
  });

  /**
   * ### .own
   *
   * Causes all `.property` and `.include` assertions that follow in the chain
   * to ignore inherited properties.
   *
   *     Object.prototype.b = 2;
   *
   *     expect({a: 1}).to.have.own.property('a');
   *     expect({a: 1}).to.have.property('b');
   *     expect({a: 1}).to.not.have.own.property('b');
   *
   *     expect({a: 1}).to.own.include({a: 1});
   *     expect({a: 1}).to.include({b: 2}).but.not.own.include({b: 2});
   *
   * `.own` cannot be combined with `.nested`.
   *
   * @name own
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('own', function () {
    flag(this, 'own', true);
  });

  /**
   * ### .ordered
   *
   * Causes all `.members` assertions that follow in the chain to require that
   * members be in the same order.
   *
   *     expect([1, 2]).to.have.ordered.members([1, 2])
   *       .but.not.have.ordered.members([2, 1]);
   *
   * When `.include` and `.ordered` are combined, the ordering begins at the
   * start of both arrays.
   *
   *     expect([1, 2, 3]).to.include.ordered.members([1, 2])
   *       .but.not.include.ordered.members([2, 3]);
   *
   * @name ordered
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('ordered', function () {
    flag(this, 'ordered', true);
  });

  /**
   * ### .any
   *
   * Causes all `.keys` assertions that follow in the chain to only require that
   * the target have at least one of the given keys. This is the opposite of
   * `.all`, which requires that the target have all of the given keys.
   *
   *     expect({a: 1, b: 2}).to.not.have.any.keys('c', 'd');
   *
   * See the `.keys` doc for guidance on when to use `.any` or `.all`.
   *
   * @name any
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('any', function () {
    flag(this, 'any', true);
    flag(this, 'all', false);
  });

  /**
   * ### .all
   *
   * Causes all `.keys` assertions that follow in the chain to require that the
   * target have all of the given keys. This is the opposite of `.any`, which
   * only requires that the target have at least one of the given keys.
   *
   *     expect({a: 1, b: 2}).to.have.all.keys('a', 'b');
   *
   * Note that `.all` is used by default when neither `.all` nor `.any` are
   * added earlier in the chain. However, it's often best to add `.all` anyway
   * because it improves readability.
   *
   * See the `.keys` doc for guidance on when to use `.any` or `.all`.
   *
   * @name all
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('all', function () {
    flag(this, 'all', true);
    flag(this, 'any', false);
  });

  /**
   * ### .a(type[, msg])
   *
   * Asserts that the target's type is equal to the given string `type`. Types
   * are case insensitive. See the `type-detect` project page for info on the
   * type detection algorithm: https://github.com/chaijs/type-detect.
   *
   *     expect('foo').to.be.a('string');
   *     expect({a: 1}).to.be.an('object');
   *     expect(null).to.be.a('null');
   *     expect(undefined).to.be.an('undefined');
   *     expect(new Error).to.be.an('error');
   *     expect(Promise.resolve()).to.be.a('promise');
   *     expect(new Float32Array).to.be.a('float32array');
   *     expect(Symbol()).to.be.a('symbol');
   *
   * `.a` supports objects that have a custom type set via `Symbol.toStringTag`.
   *
   *     var myObj = {
   *       [Symbol.toStringTag]: 'myCustomType'
   *     };
   *
   *     expect(myObj).to.be.a('myCustomType').but.not.an('object');
   *
   * It's often best to use `.a` to check a target's type before making more
   * assertions on the same target. That way, you avoid unexpected behavior from
   * any assertion that does different things based on the target's type.
   *
   *     expect([1, 2, 3]).to.be.an('array').that.includes(2);
   *     expect([]).to.be.an('array').that.is.empty;
   *
   * Add `.not` earlier in the chain to negate `.a`. However, it's often best to
   * assert that the target is the expected type, rather than asserting that it
   * isn't one of many unexpected types.
   *
   *     expect('foo').to.be.a('string'); // Recommended
   *     expect('foo').to.not.be.an('array'); // Not recommended
   *
   * `.a` accepts an optional `msg` argument which is a custom error message to
   * show when the assertion fails. The message can also be given as the second
   * argument to `expect`.
   *
   *     expect(1).to.be.a('string', 'nooo why fail??');
   *     expect(1, 'nooo why fail??').to.be.a('string');
   *
   * `.a` can also be used as a language chain to improve the readability of
   * your assertions.
   *
   *     expect({b: 2}).to.have.a.property('b');
   *
   * The alias `.an` can be used interchangeably with `.a`.
   *
   * @name a
   * @alias an
   * @param {String} type
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function an (type, msg) {
    if (msg) flag(this, 'message', msg);
    type = type.toLowerCase();
    var obj = flag(this, 'object')
      , article = ~[ 'a', 'e', 'i', 'o', 'u' ].indexOf(type.charAt(0)) ? 'an ' : 'a ';

    this.assert(
        type === _.type(obj).toLowerCase()
      , 'expected #{this} to be ' + article + type
      , 'expected #{this} not to be ' + article + type
    );
  }

  Assertion.addChainableMethod('an', an);
  Assertion.addChainableMethod('a', an);

  /**
   * ### .include(val[, msg])
   *
   * When the target is a string, `.include` asserts that the given string `val`
   * is a substring of the target.
   *
   *     expect('foobar').to.include('foo');
   *
   * When the target is an array, `.include` asserts that the given `val` is a
   * member of the target.
   *
   *     expect([1, 2, 3]).to.include(2);
   *
   * When the target is an object, `.include` asserts that the given object
   * `val`'s properties are a subset of the target's properties.
   *
   *     expect({a: 1, b: 2, c: 3}).to.include({a: 1, b: 2});
   *
   * When the target is a Set or WeakSet, `.include` asserts that the given `val` is a
   * member of the target. SameValueZero equality algorithm is used.
   *
   *     expect(new Set([1, 2])).to.include(2);
   *
   * When the target is a Map, `.include` asserts that the given `val` is one of
   * the values of the target. SameValueZero equality algorithm is used.
   *
   *     expect(new Map([['a', 1], ['b', 2]])).to.include(2);
   *
   * Because `.include` does different things based on the target's type, it's
   * important to check the target's type before using `.include`. See the `.a`
   * doc for info on testing a target's type.
   *
   *     expect([1, 2, 3]).to.be.an('array').that.includes(2);
   *
   * By default, strict (`===`) equality is used to compare array members and
   * object properties. Add `.deep` earlier in the chain to use deep equality
   * instead (WeakSet targets are not supported). See the `deep-eql` project
   * page for info on the deep equality algorithm: https://github.com/chaijs/deep-eql.
   *
   *     // Target array deeply (but not strictly) includes `{a: 1}`
   *     expect([{a: 1}]).to.deep.include({a: 1});
   *     expect([{a: 1}]).to.not.include({a: 1});
   *
   *     // Target object deeply (but not strictly) includes `x: {a: 1}`
   *     expect({x: {a: 1}}).to.deep.include({x: {a: 1}});
   *     expect({x: {a: 1}}).to.not.include({x: {a: 1}});
   *
   * By default, all of the target's properties are searched when working with
   * objects. This includes properties that are inherited and/or non-enumerable.
   * Add `.own` earlier in the chain to exclude the target's inherited
   * properties from the search.
   *
   *     Object.prototype.b = 2;
   *
   *     expect({a: 1}).to.own.include({a: 1});
   *     expect({a: 1}).to.include({b: 2}).but.not.own.include({b: 2});
   *
   * Note that a target object is always only searched for `val`'s own
   * enumerable properties.
   *
   * `.deep` and `.own` can be combined.
   *
   *     expect({a: {b: 2}}).to.deep.own.include({a: {b: 2}});
   *
   * Add `.nested` earlier in the chain to enable dot- and bracket-notation when
   * referencing nested properties.
   *
   *     expect({a: {b: ['x', 'y']}}).to.nested.include({'a.b[1]': 'y'});
   *
   * If `.` or `[]` are part of an actual property name, they can be escaped by
   * adding two backslashes before them.
   *
   *     expect({'.a': {'[b]': 2}}).to.nested.include({'\\.a.\\[b\\]': 2});
   *
   * `.deep` and `.nested` can be combined.
   *
   *     expect({a: {b: [{c: 3}]}}).to.deep.nested.include({'a.b[0]': {c: 3}});
   *
   * `.own` and `.nested` cannot be combined.
   *
   * Add `.not` earlier in the chain to negate `.include`.
   *
   *     expect('foobar').to.not.include('taco');
   *     expect([1, 2, 3]).to.not.include(4);
   *
   * However, it's dangerous to negate `.include` when the target is an object.
   * The problem is that it creates uncertain expectations by asserting that the
   * target object doesn't have all of `val`'s key/value pairs but may or may
   * not have some of them. It's often best to identify the exact output that's
   * expected, and then write an assertion that only accepts that exact output.
   *
   * When the target object isn't even expected to have `val`'s keys, it's
   * often best to assert exactly that.
   *
   *     expect({c: 3}).to.not.have.any.keys('a', 'b'); // Recommended
   *     expect({c: 3}).to.not.include({a: 1, b: 2}); // Not recommended
   *
   * When the target object is expected to have `val`'s keys, it's often best to
   * assert that each of the properties has its expected value, rather than
   * asserting that each property doesn't have one of many unexpected values.
   *
   *     expect({a: 3, b: 4}).to.include({a: 3, b: 4}); // Recommended
   *     expect({a: 3, b: 4}).to.not.include({a: 1, b: 2}); // Not recommended
   *
   * `.include` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`.
   *
   *     expect([1, 2, 3]).to.include(4, 'nooo why fail??');
   *     expect([1, 2, 3], 'nooo why fail??').to.include(4);
   *
   * `.include` can also be used as a language chain, causing all `.members` and
   * `.keys` assertions that follow in the chain to require the target to be a
   * superset of the expected set, rather than an identical set. Note that
   * `.members` ignores duplicates in the subset when `.include` is added.
   *
   *     // Target object's keys are a superset of ['a', 'b'] but not identical
   *     expect({a: 1, b: 2, c: 3}).to.include.all.keys('a', 'b');
   *     expect({a: 1, b: 2, c: 3}).to.not.have.all.keys('a', 'b');
   *
   *     // Target array is a superset of [1, 2] but not identical
   *     expect([1, 2, 3]).to.include.members([1, 2]);
   *     expect([1, 2, 3]).to.not.have.members([1, 2]);
   *
   *     // Duplicates in the subset are ignored
   *     expect([1, 2, 3]).to.include.members([1, 2, 2, 2]);
   *
   * Note that adding `.any` earlier in the chain causes the `.keys` assertion
   * to ignore `.include`.
   *
   *     // Both assertions are identical
   *     expect({a: 1}).to.include.any.keys('a', 'b');
   *     expect({a: 1}).to.have.any.keys('a', 'b');
   *
   * The aliases `.includes`, `.contain`, and `.contains` can be used
   * interchangeably with `.include`.
   *
   * @name include
   * @alias contain
   * @alias includes
   * @alias contains
   * @param {Mixed} val
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function SameValueZero(a, b) {
    return (_.isNaN(a) && _.isNaN(b)) || a === b;
  }

  function includeChainingBehavior () {
    flag(this, 'contains', true);
  }

  function include (val, msg) {
    if (msg) flag(this, 'message', msg);

    var obj = flag(this, 'object')
      , objType = _.type(obj).toLowerCase()
      , flagMsg = flag(this, 'message')
      , negate = flag(this, 'negate')
      , ssfi = flag(this, 'ssfi')
      , isDeep = flag(this, 'deep')
      , descriptor = isDeep ? 'deep ' : '';

    flagMsg = flagMsg ? flagMsg + ': ' : '';

    var included = false;

    switch (objType) {
      case 'string':
        included = obj.indexOf(val) !== -1;
        break;

      case 'weakset':
        if (isDeep) {
          throw new AssertionError(
            flagMsg + 'unable to use .deep.include with WeakSet',
            undefined,
            ssfi
          );
        }

        included = obj.has(val);
        break;

      case 'map':
        var isEql = isDeep ? _.eql : SameValueZero;
        obj.forEach(function (item) {
          included = included || isEql(item, val);
        });
        break;

      case 'set':
        if (isDeep) {
          obj.forEach(function (item) {
            included = included || _.eql(item, val);
          });
        } else {
          included = obj.has(val);
        }
        break;

      case 'array':
        if (isDeep) {
          included = obj.some(function (item) {
            return _.eql(item, val);
          })
        } else {
          included = obj.indexOf(val) !== -1;
        }
        break;

      default:
        // This block is for asserting a subset of properties in an object.
        // `_.expectTypes` isn't used here because `.include` should work with
        // objects with a custom `@@toStringTag`.
        if (val !== Object(val)) {
          throw new AssertionError(
            flagMsg + 'object tested must be an array, a map, an object,'
              + ' a set, a string, or a weakset, but ' + objType + ' given',
            undefined,
            ssfi
          );
        }

        var props = Object.keys(val)
          , firstErr = null
          , numErrs = 0;

        props.forEach(function (prop) {
          var propAssertion = new Assertion(obj);
          _.transferFlags(this, propAssertion, true);
          flag(propAssertion, 'lockSsfi', true);

          if (!negate || props.length === 1) {
            propAssertion.property(prop, val[prop]);
            return;
          }

          try {
            propAssertion.property(prop, val[prop]);
          } catch (err) {
            if (!_.checkError.compatibleConstructor(err, AssertionError)) {
              throw err;
            }
            if (firstErr === null) firstErr = err;
            numErrs++;
          }
        }, this);

        // When validating .not.include with multiple properties, we only want
        // to throw an assertion error if all of the properties are included,
        // in which case we throw the first property assertion error that we
        // encountered.
        if (negate && props.length > 1 && numErrs === props.length) {
          throw firstErr;
        }
        return;
    }

    // Assert inclusion in collection or substring in a string.
    this.assert(
      included
      , 'expected #{this} to ' + descriptor + 'include ' + _.inspect(val)
      , 'expected #{this} to not ' + descriptor + 'include ' + _.inspect(val));
  }

  Assertion.addChainableMethod('include', include, includeChainingBehavior);
  Assertion.addChainableMethod('contain', include, includeChainingBehavior);
  Assertion.addChainableMethod('contains', include, includeChainingBehavior);
  Assertion.addChainableMethod('includes', include, includeChainingBehavior);

  /**
   * ### .ok
   *
   * Asserts that the target is a truthy value (considered `true` in boolean context).
   * However, it's often best to assert that the target is strictly (`===`) or
   * deeply equal to its expected value.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.be.ok; // Not recommended
   *
   *     expect(true).to.be.true; // Recommended
   *     expect(true).to.be.ok; // Not recommended
   *
   * Add `.not` earlier in the chain to negate `.ok`.
   *
   *     expect(0).to.equal(0); // Recommended
   *     expect(0).to.not.be.ok; // Not recommended
   *
   *     expect(false).to.be.false; // Recommended
   *     expect(false).to.not.be.ok; // Not recommended
   *
   *     expect(null).to.be.null; // Recommended
   *     expect(null).to.not.be.ok; // Not recommended
   *
   *     expect(undefined).to.be.undefined; // Recommended
   *     expect(undefined).to.not.be.ok; // Not recommended
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect(false, 'nooo why fail??').to.be.ok;
   *
   * @name ok
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('ok', function () {
    this.assert(
        flag(this, 'object')
      , 'expected #{this} to be truthy'
      , 'expected #{this} to be falsy');
  });

  /**
   * ### .true
   *
   * Asserts that the target is strictly (`===`) equal to `true`.
   *
   *     expect(true).to.be.true;
   *
   * Add `.not` earlier in the chain to negate `.true`. However, it's often best
   * to assert that the target is equal to its expected value, rather than not
   * equal to `true`.
   *
   *     expect(false).to.be.false; // Recommended
   *     expect(false).to.not.be.true; // Not recommended
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.not.be.true; // Not recommended
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect(false, 'nooo why fail??').to.be.true;
   *
   * @name true
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('true', function () {
    this.assert(
        true === flag(this, 'object')
      , 'expected #{this} to be true'
      , 'expected #{this} to be false'
      , flag(this, 'negate') ? false : true
    );
  });

  /**
   * ### .false
   *
   * Asserts that the target is strictly (`===`) equal to `false`.
   *
   *     expect(false).to.be.false;
   *
   * Add `.not` earlier in the chain to negate `.false`. However, it's often
   * best to assert that the target is equal to its expected value, rather than
   * not equal to `false`.
   *
   *     expect(true).to.be.true; // Recommended
   *     expect(true).to.not.be.false; // Not recommended
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.not.be.false; // Not recommended
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect(true, 'nooo why fail??').to.be.false;
   *
   * @name false
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('false', function () {
    this.assert(
        false === flag(this, 'object')
      , 'expected #{this} to be false'
      , 'expected #{this} to be true'
      , flag(this, 'negate') ? true : false
    );
  });

  /**
   * ### .null
   *
   * Asserts that the target is strictly (`===`) equal to `null`.
   *
   *     expect(null).to.be.null;
   *
   * Add `.not` earlier in the chain to negate `.null`. However, it's often best
   * to assert that the target is equal to its expected value, rather than not
   * equal to `null`.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.not.be.null; // Not recommended
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect(42, 'nooo why fail??').to.be.null;
   *
   * @name null
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('null', function () {
    this.assert(
        null === flag(this, 'object')
      , 'expected #{this} to be null'
      , 'expected #{this} not to be null'
    );
  });

  /**
   * ### .undefined
   *
   * Asserts that the target is strictly (`===`) equal to `undefined`.
   *
   *     expect(undefined).to.be.undefined;
   *
   * Add `.not` earlier in the chain to negate `.undefined`. However, it's often
   * best to assert that the target is equal to its expected value, rather than
   * not equal to `undefined`.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.not.be.undefined; // Not recommended
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect(42, 'nooo why fail??').to.be.undefined;
   *
   * @name undefined
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('undefined', function () {
    this.assert(
        undefined === flag(this, 'object')
      , 'expected #{this} to be undefined'
      , 'expected #{this} not to be undefined'
    );
  });

  /**
   * ### .NaN
   *
   * Asserts that the target is exactly `NaN`.
   *
   *     expect(NaN).to.be.NaN;
   *
   * Add `.not` earlier in the chain to negate `.NaN`. However, it's often best
   * to assert that the target is equal to its expected value, rather than not
   * equal to `NaN`.
   *
   *     expect('foo').to.equal('foo'); // Recommended
   *     expect('foo').to.not.be.NaN; // Not recommended
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect(42, 'nooo why fail??').to.be.NaN;
   *
   * @name NaN
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('NaN', function () {
    this.assert(
        _.isNaN(flag(this, 'object'))
        , 'expected #{this} to be NaN'
        , 'expected #{this} not to be NaN'
    );
  });

  /**
   * ### .exist
   *
   * Asserts that the target is not strictly (`===`) equal to either `null` or
   * `undefined`. However, it's often best to assert that the target is equal to
   * its expected value.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.exist; // Not recommended
   *
   *     expect(0).to.equal(0); // Recommended
   *     expect(0).to.exist; // Not recommended
   *
   * Add `.not` earlier in the chain to negate `.exist`.
   *
   *     expect(null).to.be.null; // Recommended
   *     expect(null).to.not.exist; // Not recommended
   *
   *     expect(undefined).to.be.undefined; // Recommended
   *     expect(undefined).to.not.exist; // Not recommended
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect(null, 'nooo why fail??').to.exist;
   *
   * @name exist
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('exist', function () {
    var val = flag(this, 'object');
    this.assert(
        val !== null && val !== undefined
      , 'expected #{this} to exist'
      , 'expected #{this} to not exist'
    );
  });

  /**
   * ### .empty
   *
   * When the target is a string or array, `.empty` asserts that the target's
   * `length` property is strictly (`===`) equal to `0`.
   *
   *     expect([]).to.be.empty;
   *     expect('').to.be.empty;
   *
   * When the target is a map or set, `.empty` asserts that the target's `size`
   * property is strictly equal to `0`.
   *
   *     expect(new Set()).to.be.empty;
   *     expect(new Map()).to.be.empty;
   *
   * When the target is a non-function object, `.empty` asserts that the target
   * doesn't have any own enumerable properties. Properties with Symbol-based
   * keys are excluded from the count.
   *
   *     expect({}).to.be.empty;
   *
   * Because `.empty` does different things based on the target's type, it's
   * important to check the target's type before using `.empty`. See the `.a`
   * doc for info on testing a target's type.
   *
   *     expect([]).to.be.an('array').that.is.empty;
   *
   * Add `.not` earlier in the chain to negate `.empty`. However, it's often
   * best to assert that the target contains its expected number of values,
   * rather than asserting that it's not empty.
   *
   *     expect([1, 2, 3]).to.have.lengthOf(3); // Recommended
   *     expect([1, 2, 3]).to.not.be.empty; // Not recommended
   *
   *     expect(new Set([1, 2, 3])).to.have.property('size', 3); // Recommended
   *     expect(new Set([1, 2, 3])).to.not.be.empty; // Not recommended
   *
   *     expect(Object.keys({a: 1})).to.have.lengthOf(1); // Recommended
   *     expect({a: 1}).to.not.be.empty; // Not recommended
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect([1, 2, 3], 'nooo why fail??').to.be.empty;
   *
   * @name empty
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('empty', function () {
    var val = flag(this, 'object')
      , ssfi = flag(this, 'ssfi')
      , flagMsg = flag(this, 'message')
      , itemsCount;

    flagMsg = flagMsg ? flagMsg + ': ' : '';

    switch (_.type(val).toLowerCase()) {
      case 'array':
      case 'string':
        itemsCount = val.length;
        break;
      case 'map':
      case 'set':
        itemsCount = val.size;
        break;
      case 'weakmap':
      case 'weakset':
        throw new AssertionError(
          flagMsg + '.empty was passed a weak collection',
          undefined,
          ssfi
        );
      case 'function':
        var msg = flagMsg + '.empty was passed a function ' + _.getName(val);
        throw new AssertionError(msg.trim(), undefined, ssfi);
      default:
        if (val !== Object(val)) {
          throw new AssertionError(
            flagMsg + '.empty was passed non-string primitive ' + _.inspect(val),
            undefined,
            ssfi
          );
        }
        itemsCount = Object.keys(val).length;
    }

    this.assert(
        0 === itemsCount
      , 'expected #{this} to be empty'
      , 'expected #{this} not to be empty'
    );
  });

  /**
   * ### .arguments
   *
   * Asserts that the target is an `arguments` object.
   *
   *     function test () {
   *       expect(arguments).to.be.arguments;
   *     }
   *
   *     test();
   *
   * Add `.not` earlier in the chain to negate `.arguments`. However, it's often
   * best to assert which type the target is expected to be, rather than
   * asserting that its not an `arguments` object.
   *
   *     expect('foo').to.be.a('string'); // Recommended
   *     expect('foo').to.not.be.arguments; // Not recommended
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect({}, 'nooo why fail??').to.be.arguments;
   *
   * The alias `.Arguments` can be used interchangeably with `.arguments`.
   *
   * @name arguments
   * @alias Arguments
   * @namespace BDD
   * @api public
   */

  function checkArguments () {
    var obj = flag(this, 'object')
      , type = _.type(obj);
    this.assert(
        'Arguments' === type
      , 'expected #{this} to be arguments but got ' + type
      , 'expected #{this} to not be arguments'
    );
  }

  Assertion.addProperty('arguments', checkArguments);
  Assertion.addProperty('Arguments', checkArguments);

  /**
   * ### .equal(val[, msg])
   *
   * Asserts that the target is strictly (`===`) equal to the given `val`.
   *
   *     expect(1).to.equal(1);
   *     expect('foo').to.equal('foo');
   *
   * Add `.deep` earlier in the chain to use deep equality instead. See the
   * `deep-eql` project page for info on the deep equality algorithm:
   * https://github.com/chaijs/deep-eql.
   *
   *     // Target object deeply (but not strictly) equals `{a: 1}`
   *     expect({a: 1}).to.deep.equal({a: 1});
   *     expect({a: 1}).to.not.equal({a: 1});
   *
   *     // Target array deeply (but not strictly) equals `[1, 2]`
   *     expect([1, 2]).to.deep.equal([1, 2]);
   *     expect([1, 2]).to.not.equal([1, 2]);
   *
   * Add `.not` earlier in the chain to negate `.equal`. However, it's often
   * best to assert that the target is equal to its expected value, rather than
   * not equal to one of countless unexpected values.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.not.equal(2); // Not recommended
   *
   * `.equal` accepts an optional `msg` argument which is a custom error message
   * to show when the assertion fails. The message can also be given as the
   * second argument to `expect`.
   *
   *     expect(1).to.equal(2, 'nooo why fail??');
   *     expect(1, 'nooo why fail??').to.equal(2);
   *
   * The aliases `.equals` and `eq` can be used interchangeably with `.equal`.
   *
   * @name equal
   * @alias equals
   * @alias eq
   * @param {Mixed} val
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertEqual (val, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    if (flag(this, 'deep')) {
      var prevLockSsfi = flag(this, 'lockSsfi');
      flag(this, 'lockSsfi', true);
      this.eql(val);
      flag(this, 'lockSsfi', prevLockSsfi);
    } else {
      this.assert(
          val === obj
        , 'expected #{this} to equal #{exp}'
        , 'expected #{this} to not equal #{exp}'
        , val
        , this._obj
        , true
      );
    }
  }

  Assertion.addMethod('equal', assertEqual);
  Assertion.addMethod('equals', assertEqual);
  Assertion.addMethod('eq', assertEqual);

  /**
   * ### .eql(obj[, msg])
   *
   * Asserts that the target is deeply equal to the given `obj`. See the
   * `deep-eql` project page for info on the deep equality algorithm:
   * https://github.com/chaijs/deep-eql.
   *
   *     // Target object is deeply (but not strictly) equal to {a: 1}
   *     expect({a: 1}).to.eql({a: 1}).but.not.equal({a: 1});
   *
   *     // Target array is deeply (but not strictly) equal to [1, 2]
   *     expect([1, 2]).to.eql([1, 2]).but.not.equal([1, 2]);
   *
   * Add `.not` earlier in the chain to negate `.eql`. However, it's often best
   * to assert that the target is deeply equal to its expected value, rather
   * than not deeply equal to one of countless unexpected values.
   *
   *     expect({a: 1}).to.eql({a: 1}); // Recommended
   *     expect({a: 1}).to.not.eql({b: 2}); // Not recommended
   *
   * `.eql` accepts an optional `msg` argument which is a custom error message
   * to show when the assertion fails. The message can also be given as the
   * second argument to `expect`.
   *
   *     expect({a: 1}).to.eql({b: 2}, 'nooo why fail??');
   *     expect({a: 1}, 'nooo why fail??').to.eql({b: 2});
   *
   * The alias `.eqls` can be used interchangeably with `.eql`.
   *
   * The `.deep.equal` assertion is almost identical to `.eql` but with one
   * difference: `.deep.equal` causes deep equality comparisons to also be used
   * for any other assertions that follow in the chain.
   *
   * @name eql
   * @alias eqls
   * @param {Mixed} obj
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertEql(obj, msg) {
    if (msg) flag(this, 'message', msg);
    this.assert(
        _.eql(obj, flag(this, 'object'))
      , 'expected #{this} to deeply equal #{exp}'
      , 'expected #{this} to not deeply equal #{exp}'
      , obj
      , this._obj
      , true
    );
  }

  Assertion.addMethod('eql', assertEql);
  Assertion.addMethod('eqls', assertEql);

  /**
   * ### .above(n[, msg])
   *
   * Asserts that the target is a number or a date greater than the given number or date `n` respectively.
   * However, it's often best to assert that the target is equal to its expected
   * value.
   *
   *     expect(2).to.equal(2); // Recommended
   *     expect(2).to.be.above(1); // Not recommended
   *
   * Add `.lengthOf` earlier in the chain to assert that the target's `length`
   * or `size` is greater than the given number `n`.
   *
   *     expect('foo').to.have.lengthOf(3); // Recommended
   *     expect('foo').to.have.lengthOf.above(2); // Not recommended
   *
   *     expect([1, 2, 3]).to.have.lengthOf(3); // Recommended
   *     expect([1, 2, 3]).to.have.lengthOf.above(2); // Not recommended
   *
   * Add `.not` earlier in the chain to negate `.above`.
   *
   *     expect(2).to.equal(2); // Recommended
   *     expect(1).to.not.be.above(2); // Not recommended
   *
   * `.above` accepts an optional `msg` argument which is a custom error message
   * to show when the assertion fails. The message can also be given as the
   * second argument to `expect`.
   *
   *     expect(1).to.be.above(2, 'nooo why fail??');
   *     expect(1, 'nooo why fail??').to.be.above(2);
   *
   * The aliases `.gt` and `.greaterThan` can be used interchangeably with
   * `.above`.
   *
   * @name above
   * @alias gt
   * @alias greaterThan
   * @param {Number} n
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertAbove (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , doLength = flag(this, 'doLength')
      , flagMsg = flag(this, 'message')
      , msgPrefix = ((flagMsg) ? flagMsg + ': ' : '')
      , ssfi = flag(this, 'ssfi')
      , objType = _.type(obj).toLowerCase()
      , nType = _.type(n).toLowerCase()
      , errorMessage
      , shouldThrow = true;

    if (doLength && objType !== 'map' && objType !== 'set') {
      new Assertion(obj, flagMsg, ssfi, true).to.have.property('length');
    }

    if (!doLength && (objType === 'date' && nType !== 'date')) {
      errorMessage = msgPrefix + 'the argument to above must be a date';
    } else if (nType !== 'number' && (doLength || objType === 'number')) {
      errorMessage = msgPrefix + 'the argument to above must be a number';
    } else if (!doLength && (objType !== 'date' && objType !== 'number')) {
      var printObj = (objType === 'string') ? "'" + obj + "'" : obj;
      errorMessage = msgPrefix + 'expected ' + printObj + ' to be a number or a date';
    } else {
      shouldThrow = false;
    }

    if (shouldThrow) {
      throw new AssertionError(errorMessage, undefined, ssfi);
    }

    if (doLength) {
      var descriptor = 'length'
        , itemsCount;
      if (objType === 'map' || objType === 'set') {
        descriptor = 'size';
        itemsCount = obj.size;
      } else {
        itemsCount = obj.length;
      }
      this.assert(
          itemsCount > n
        , 'expected #{this} to have a ' + descriptor + ' above #{exp} but got #{act}'
        , 'expected #{this} to not have a ' + descriptor + ' above #{exp}'
        , n
        , itemsCount
      );
    } else {
      this.assert(
          obj > n
        , 'expected #{this} to be above #{exp}'
        , 'expected #{this} to be at most #{exp}'
        , n
      );
    }
  }

  Assertion.addMethod('above', assertAbove);
  Assertion.addMethod('gt', assertAbove);
  Assertion.addMethod('greaterThan', assertAbove);

  /**
   * ### .least(n[, msg])
   *
   * Asserts that the target is a number or a date greater than or equal to the given
   * number or date `n` respectively. However, it's often best to assert that the target is equal to
   * its expected value.
   *
   *     expect(2).to.equal(2); // Recommended
   *     expect(2).to.be.at.least(1); // Not recommended
   *     expect(2).to.be.at.least(2); // Not recommended
   *
   * Add `.lengthOf` earlier in the chain to assert that the target's `length`
   * or `size` is greater than or equal to the given number `n`.
   *
   *     expect('foo').to.have.lengthOf(3); // Recommended
   *     expect('foo').to.have.lengthOf.at.least(2); // Not recommended
   *
   *     expect([1, 2, 3]).to.have.lengthOf(3); // Recommended
   *     expect([1, 2, 3]).to.have.lengthOf.at.least(2); // Not recommended
   *
   * Add `.not` earlier in the chain to negate `.least`.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.not.be.at.least(2); // Not recommended
   *
   * `.least` accepts an optional `msg` argument which is a custom error message
   * to show when the assertion fails. The message can also be given as the
   * second argument to `expect`.
   *
   *     expect(1).to.be.at.least(2, 'nooo why fail??');
   *     expect(1, 'nooo why fail??').to.be.at.least(2);
   *
   * The alias `.gte` can be used interchangeably with `.least`.
   *
   * @name least
   * @alias gte
   * @param {Number} n
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertLeast (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , doLength = flag(this, 'doLength')
      , flagMsg = flag(this, 'message')
      , msgPrefix = ((flagMsg) ? flagMsg + ': ' : '')
      , ssfi = flag(this, 'ssfi')
      , objType = _.type(obj).toLowerCase()
      , nType = _.type(n).toLowerCase()
      , errorMessage
      , shouldThrow = true;

    if (doLength && objType !== 'map' && objType !== 'set') {
      new Assertion(obj, flagMsg, ssfi, true).to.have.property('length');
    }

    if (!doLength && (objType === 'date' && nType !== 'date')) {
      errorMessage = msgPrefix + 'the argument to least must be a date';
    } else if (nType !== 'number' && (doLength || objType === 'number')) {
      errorMessage = msgPrefix + 'the argument to least must be a number';
    } else if (!doLength && (objType !== 'date' && objType !== 'number')) {
      var printObj = (objType === 'string') ? "'" + obj + "'" : obj;
      errorMessage = msgPrefix + 'expected ' + printObj + ' to be a number or a date';
    } else {
      shouldThrow = false;
    }

    if (shouldThrow) {
      throw new AssertionError(errorMessage, undefined, ssfi);
    }

    if (doLength) {
      var descriptor = 'length'
        , itemsCount;
      if (objType === 'map' || objType === 'set') {
        descriptor = 'size';
        itemsCount = obj.size;
      } else {
        itemsCount = obj.length;
      }
      this.assert(
          itemsCount >= n
        , 'expected #{this} to have a ' + descriptor + ' at least #{exp} but got #{act}'
        , 'expected #{this} to have a ' + descriptor + ' below #{exp}'
        , n
        , itemsCount
      );
    } else {
      this.assert(
          obj >= n
        , 'expected #{this} to be at least #{exp}'
        , 'expected #{this} to be below #{exp}'
        , n
      );
    }
  }

  Assertion.addMethod('least', assertLeast);
  Assertion.addMethod('gte', assertLeast);

  /**
   * ### .below(n[, msg])
   *
   * Asserts that the target is a number or a date less than the given number or date `n` respectively.
   * However, it's often best to assert that the target is equal to its expected
   * value.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.be.below(2); // Not recommended
   *
   * Add `.lengthOf` earlier in the chain to assert that the target's `length`
   * or `size` is less than the given number `n`.
   *
   *     expect('foo').to.have.lengthOf(3); // Recommended
   *     expect('foo').to.have.lengthOf.below(4); // Not recommended
   *
   *     expect([1, 2, 3]).to.have.length(3); // Recommended
   *     expect([1, 2, 3]).to.have.lengthOf.below(4); // Not recommended
   *
   * Add `.not` earlier in the chain to negate `.below`.
   *
   *     expect(2).to.equal(2); // Recommended
   *     expect(2).to.not.be.below(1); // Not recommended
   *
   * `.below` accepts an optional `msg` argument which is a custom error message
   * to show when the assertion fails. The message can also be given as the
   * second argument to `expect`.
   *
   *     expect(2).to.be.below(1, 'nooo why fail??');
   *     expect(2, 'nooo why fail??').to.be.below(1);
   *
   * The aliases `.lt` and `.lessThan` can be used interchangeably with
   * `.below`.
   *
   * @name below
   * @alias lt
   * @alias lessThan
   * @param {Number} n
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertBelow (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , doLength = flag(this, 'doLength')
      , flagMsg = flag(this, 'message')
      , msgPrefix = ((flagMsg) ? flagMsg + ': ' : '')
      , ssfi = flag(this, 'ssfi')
      , objType = _.type(obj).toLowerCase()
      , nType = _.type(n).toLowerCase()
      , errorMessage
      , shouldThrow = true;

    if (doLength && objType !== 'map' && objType !== 'set') {
      new Assertion(obj, flagMsg, ssfi, true).to.have.property('length');
    }

    if (!doLength && (objType === 'date' && nType !== 'date')) {
      errorMessage = msgPrefix + 'the argument to below must be a date';
    } else if (nType !== 'number' && (doLength || objType === 'number')) {
      errorMessage = msgPrefix + 'the argument to below must be a number';
    } else if (!doLength && (objType !== 'date' && objType !== 'number')) {
      var printObj = (objType === 'string') ? "'" + obj + "'" : obj;
      errorMessage = msgPrefix + 'expected ' + printObj + ' to be a number or a date';
    } else {
      shouldThrow = false;
    }

    if (shouldThrow) {
      throw new AssertionError(errorMessage, undefined, ssfi);
    }

    if (doLength) {
      var descriptor = 'length'
        , itemsCount;
      if (objType === 'map' || objType === 'set') {
        descriptor = 'size';
        itemsCount = obj.size;
      } else {
        itemsCount = obj.length;
      }
      this.assert(
          itemsCount < n
        , 'expected #{this} to have a ' + descriptor + ' below #{exp} but got #{act}'
        , 'expected #{this} to not have a ' + descriptor + ' below #{exp}'
        , n
        , itemsCount
      );
    } else {
      this.assert(
          obj < n
        , 'expected #{this} to be below #{exp}'
        , 'expected #{this} to be at least #{exp}'
        , n
      );
    }
  }

  Assertion.addMethod('below', assertBelow);
  Assertion.addMethod('lt', assertBelow);
  Assertion.addMethod('lessThan', assertBelow);

  /**
   * ### .most(n[, msg])
   *
   * Asserts that the target is a number or a date less than or equal to the given number
   * or date `n` respectively. However, it's often best to assert that the target is equal to its
   * expected value.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.be.at.most(2); // Not recommended
   *     expect(1).to.be.at.most(1); // Not recommended
   *
   * Add `.lengthOf` earlier in the chain to assert that the target's `length`
   * or `size` is less than or equal to the given number `n`.
   *
   *     expect('foo').to.have.lengthOf(3); // Recommended
   *     expect('foo').to.have.lengthOf.at.most(4); // Not recommended
   *
   *     expect([1, 2, 3]).to.have.lengthOf(3); // Recommended
   *     expect([1, 2, 3]).to.have.lengthOf.at.most(4); // Not recommended
   *
   * Add `.not` earlier in the chain to negate `.most`.
   *
   *     expect(2).to.equal(2); // Recommended
   *     expect(2).to.not.be.at.most(1); // Not recommended
   *
   * `.most` accepts an optional `msg` argument which is a custom error message
   * to show when the assertion fails. The message can also be given as the
   * second argument to `expect`.
   *
   *     expect(2).to.be.at.most(1, 'nooo why fail??');
   *     expect(2, 'nooo why fail??').to.be.at.most(1);
   *
   * The alias `.lte` can be used interchangeably with `.most`.
   *
   * @name most
   * @alias lte
   * @param {Number} n
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertMost (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , doLength = flag(this, 'doLength')
      , flagMsg = flag(this, 'message')
      , msgPrefix = ((flagMsg) ? flagMsg + ': ' : '')
      , ssfi = flag(this, 'ssfi')
      , objType = _.type(obj).toLowerCase()
      , nType = _.type(n).toLowerCase()
      , errorMessage
      , shouldThrow = true;

    if (doLength && objType !== 'map' && objType !== 'set') {
      new Assertion(obj, flagMsg, ssfi, true).to.have.property('length');
    }

    if (!doLength && (objType === 'date' && nType !== 'date')) {
      errorMessage = msgPrefix + 'the argument to most must be a date';
    } else if (nType !== 'number' && (doLength || objType === 'number')) {
      errorMessage = msgPrefix + 'the argument to most must be a number';
    } else if (!doLength && (objType !== 'date' && objType !== 'number')) {
      var printObj = (objType === 'string') ? "'" + obj + "'" : obj;
      errorMessage = msgPrefix + 'expected ' + printObj + ' to be a number or a date';
    } else {
      shouldThrow = false;
    }

    if (shouldThrow) {
      throw new AssertionError(errorMessage, undefined, ssfi);
    }

    if (doLength) {
      var descriptor = 'length'
        , itemsCount;
      if (objType === 'map' || objType === 'set') {
        descriptor = 'size';
        itemsCount = obj.size;
      } else {
        itemsCount = obj.length;
      }
      this.assert(
          itemsCount <= n
        , 'expected #{this} to have a ' + descriptor + ' at most #{exp} but got #{act}'
        , 'expected #{this} to have a ' + descriptor + ' above #{exp}'
        , n
        , itemsCount
      );
    } else {
      this.assert(
          obj <= n
        , 'expected #{this} to be at most #{exp}'
        , 'expected #{this} to be above #{exp}'
        , n
      );
    }
  }

  Assertion.addMethod('most', assertMost);
  Assertion.addMethod('lte', assertMost);

  /**
   * ### .within(start, finish[, msg])
   *
   * Asserts that the target is a number or a date greater than or equal to the given
   * number or date `start`, and less than or equal to the given number or date `finish` respectively.
   * However, it's often best to assert that the target is equal to its expected
   * value.
   *
   *     expect(2).to.equal(2); // Recommended
   *     expect(2).to.be.within(1, 3); // Not recommended
   *     expect(2).to.be.within(2, 3); // Not recommended
   *     expect(2).to.be.within(1, 2); // Not recommended
   *
   * Add `.lengthOf` earlier in the chain to assert that the target's `length`
   * or `size` is greater than or equal to the given number `start`, and less
   * than or equal to the given number `finish`.
   *
   *     expect('foo').to.have.lengthOf(3); // Recommended
   *     expect('foo').to.have.lengthOf.within(2, 4); // Not recommended
   *
   *     expect([1, 2, 3]).to.have.lengthOf(3); // Recommended
   *     expect([1, 2, 3]).to.have.lengthOf.within(2, 4); // Not recommended
   *
   * Add `.not` earlier in the chain to negate `.within`.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.not.be.within(2, 4); // Not recommended
   *
   * `.within` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`.
   *
   *     expect(4).to.be.within(1, 3, 'nooo why fail??');
   *     expect(4, 'nooo why fail??').to.be.within(1, 3);
   *
   * @name within
   * @param {Number} start lower bound inclusive
   * @param {Number} finish upper bound inclusive
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  Assertion.addMethod('within', function (start, finish, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , doLength = flag(this, 'doLength')
      , flagMsg = flag(this, 'message')
      , msgPrefix = ((flagMsg) ? flagMsg + ': ' : '')
      , ssfi = flag(this, 'ssfi')
      , objType = _.type(obj).toLowerCase()
      , startType = _.type(start).toLowerCase()
      , finishType = _.type(finish).toLowerCase()
      , errorMessage
      , shouldThrow = true
      , range = (startType === 'date' && finishType === 'date')
          ? start.toUTCString() + '..' + finish.toUTCString()
          : start + '..' + finish;

    if (doLength && objType !== 'map' && objType !== 'set') {
      new Assertion(obj, flagMsg, ssfi, true).to.have.property('length');
    }

    if (!doLength && (objType === 'date' && (startType !== 'date' || finishType !== 'date'))) {
      errorMessage = msgPrefix + 'the arguments to within must be dates';
    } else if ((startType !== 'number' || finishType !== 'number') && (doLength || objType === 'number')) {
      errorMessage = msgPrefix + 'the arguments to within must be numbers';
    } else if (!doLength && (objType !== 'date' && objType !== 'number')) {
      var printObj = (objType === 'string') ? "'" + obj + "'" : obj;
      errorMessage = msgPrefix + 'expected ' + printObj + ' to be a number or a date';
    } else {
      shouldThrow = false;
    }

    if (shouldThrow) {
      throw new AssertionError(errorMessage, undefined, ssfi);
    }

    if (doLength) {
      var descriptor = 'length'
        , itemsCount;
      if (objType === 'map' || objType === 'set') {
        descriptor = 'size';
        itemsCount = obj.size;
      } else {
        itemsCount = obj.length;
      }
      this.assert(
          itemsCount >= start && itemsCount <= finish
        , 'expected #{this} to have a ' + descriptor + ' within ' + range
        , 'expected #{this} to not have a ' + descriptor + ' within ' + range
      );
    } else {
      this.assert(
          obj >= start && obj <= finish
        , 'expected #{this} to be within ' + range
        , 'expected #{this} to not be within ' + range
      );
    }
  });

  /**
   * ### .instanceof(constructor[, msg])
   *
   * Asserts that the target is an instance of the given `constructor`.
   *
   *     function Cat () { }
   *
   *     expect(new Cat()).to.be.an.instanceof(Cat);
   *     expect([1, 2]).to.be.an.instanceof(Array);
   *
   * Add `.not` earlier in the chain to negate `.instanceof`.
   *
   *     expect({a: 1}).to.not.be.an.instanceof(Array);
   *
   * `.instanceof` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`.
   *
   *     expect(1).to.be.an.instanceof(Array, 'nooo why fail??');
   *     expect(1, 'nooo why fail??').to.be.an.instanceof(Array);
   *
   * Due to limitations in ES5, `.instanceof` may not always work as expected
   * when using a transpiler such as Babel or TypeScript. In particular, it may
   * produce unexpected results when subclassing built-in object such as
   * `Array`, `Error`, and `Map`. See your transpiler's docs for details:
   *
   * - ([Babel](https://babeljs.io/docs/usage/caveats/#classes))
   * - ([TypeScript](https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work))
   *
   * The alias `.instanceOf` can be used interchangeably with `.instanceof`.
   *
   * @name instanceof
   * @param {Constructor} constructor
   * @param {String} msg _optional_
   * @alias instanceOf
   * @namespace BDD
   * @api public
   */

  function assertInstanceOf (constructor, msg) {
    if (msg) flag(this, 'message', msg);

    var target = flag(this, 'object')
    var ssfi = flag(this, 'ssfi');
    var flagMsg = flag(this, 'message');

    try {
      var isInstanceOf = target instanceof constructor;
    } catch (err) {
      if (err instanceof TypeError) {
        flagMsg = flagMsg ? flagMsg + ': ' : '';
        throw new AssertionError(
          flagMsg + 'The instanceof assertion needs a constructor but '
            + _.type(constructor) + ' was given.',
          undefined,
          ssfi
        );
      }
      throw err;
    }

    var name = _.getName(constructor);
    if (name === null) {
      name = 'an unnamed constructor';
    }

    this.assert(
        isInstanceOf
      , 'expected #{this} to be an instance of ' + name
      , 'expected #{this} to not be an instance of ' + name
    );
  };

  Assertion.addMethod('instanceof', assertInstanceOf);
  Assertion.addMethod('instanceOf', assertInstanceOf);

  /**
   * ### .property(name[, val[, msg]])
   *
   * Asserts that the target has a property with the given key `name`.
   *
   *     expect({a: 1}).to.have.property('a');
   *
   * When `val` is provided, `.property` also asserts that the property's value
   * is equal to the given `val`.
   *
   *     expect({a: 1}).to.have.property('a', 1);
   *
   * By default, strict (`===`) equality is used. Add `.deep` earlier in the
   * chain to use deep equality instead. See the `deep-eql` project page for
   * info on the deep equality algorithm: https://github.com/chaijs/deep-eql.
   *
   *     // Target object deeply (but not strictly) has property `x: {a: 1}`
   *     expect({x: {a: 1}}).to.have.deep.property('x', {a: 1});
   *     expect({x: {a: 1}}).to.not.have.property('x', {a: 1});
   *
   * The target's enumerable and non-enumerable properties are always included
   * in the search. By default, both own and inherited properties are included.
   * Add `.own` earlier in the chain to exclude inherited properties from the
   * search.
   *
   *     Object.prototype.b = 2;
   *
   *     expect({a: 1}).to.have.own.property('a');
   *     expect({a: 1}).to.have.own.property('a', 1);
   *     expect({a: 1}).to.have.property('b');
   *     expect({a: 1}).to.not.have.own.property('b');
   *
   * `.deep` and `.own` can be combined.
   *
   *     expect({x: {a: 1}}).to.have.deep.own.property('x', {a: 1});
   *
   * Add `.nested` earlier in the chain to enable dot- and bracket-notation when
   * referencing nested properties.
   *
   *     expect({a: {b: ['x', 'y']}}).to.have.nested.property('a.b[1]');
   *     expect({a: {b: ['x', 'y']}}).to.have.nested.property('a.b[1]', 'y');
   *
   * If `.` or `[]` are part of an actual property name, they can be escaped by
   * adding two backslashes before them.
   *
   *     expect({'.a': {'[b]': 'x'}}).to.have.nested.property('\\.a.\\[b\\]');
   *
   * `.deep` and `.nested` can be combined.
   *
   *     expect({a: {b: [{c: 3}]}})
   *       .to.have.deep.nested.property('a.b[0]', {c: 3});
   *
   * `.own` and `.nested` cannot be combined.
   *
   * Add `.not` earlier in the chain to negate `.property`.
   *
   *     expect({a: 1}).to.not.have.property('b');
   *
   * However, it's dangerous to negate `.property` when providing `val`. The
   * problem is that it creates uncertain expectations by asserting that the
   * target either doesn't have a property with the given key `name`, or that it
   * does have a property with the given key `name` but its value isn't equal to
   * the given `val`. It's often best to identify the exact output that's
   * expected, and then write an assertion that only accepts that exact output.
   *
   * When the target isn't expected to have a property with the given key
   * `name`, it's often best to assert exactly that.
   *
   *     expect({b: 2}).to.not.have.property('a'); // Recommended
   *     expect({b: 2}).to.not.have.property('a', 1); // Not recommended
   *
   * When the target is expected to have a property with the given key `name`,
   * it's often best to assert that the property has its expected value, rather
   * than asserting that it doesn't have one of many unexpected values.
   *
   *     expect({a: 3}).to.have.property('a', 3); // Recommended
   *     expect({a: 3}).to.not.have.property('a', 1); // Not recommended
   *
   * `.property` changes the target of any assertions that follow in the chain
   * to be the value of the property from the original target object.
   *
   *     expect({a: 1}).to.have.property('a').that.is.a('number');
   *
   * `.property` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`. When not providing `val`, only use the
   * second form.
   *
   *     // Recommended
   *     expect({a: 1}).to.have.property('a', 2, 'nooo why fail??');
   *     expect({a: 1}, 'nooo why fail??').to.have.property('a', 2);
   *     expect({a: 1}, 'nooo why fail??').to.have.property('b');
   *
   *     // Not recommended
   *     expect({a: 1}).to.have.property('b', undefined, 'nooo why fail??');
   *
   * The above assertion isn't the same thing as not providing `val`. Instead,
   * it's asserting that the target object has a `b` property that's equal to
   * `undefined`.
   *
   * The assertions `.ownProperty` and `.haveOwnProperty` can be used
   * interchangeably with `.own.property`.
   *
   * @name property
   * @param {String} name
   * @param {Mixed} val (optional)
   * @param {String} msg _optional_
   * @returns value of property for chaining
   * @namespace BDD
   * @api public
   */

  function assertProperty (name, val, msg) {
    if (msg) flag(this, 'message', msg);

    var isNested = flag(this, 'nested')
      , isOwn = flag(this, 'own')
      , flagMsg = flag(this, 'message')
      , obj = flag(this, 'object')
      , ssfi = flag(this, 'ssfi')
      , nameType = typeof name;

    flagMsg = flagMsg ? flagMsg + ': ' : '';

    if (isNested) {
      if (nameType !== 'string') {
        throw new AssertionError(
          flagMsg + 'the argument to property must be a string when using nested syntax',
          undefined,
          ssfi
        );
      }
    } else {
      if (nameType !== 'string' && nameType !== 'number' && nameType !== 'symbol') {
        throw new AssertionError(
          flagMsg + 'the argument to property must be a string, number, or symbol',
          undefined,
          ssfi
        );
      }
    }

    if (isNested && isOwn) {
      throw new AssertionError(
        flagMsg + 'The "nested" and "own" flags cannot be combined.',
        undefined,
        ssfi
      );
    }

    if (obj === null || obj === undefined) {
      throw new AssertionError(
        flagMsg + 'Target cannot be null or undefined.',
        undefined,
        ssfi
      );
    }

    var isDeep = flag(this, 'deep')
      , negate = flag(this, 'negate')
      , pathInfo = isNested ? _.getPathInfo(obj, name) : null
      , value = isNested ? pathInfo.value : obj[name];

    var descriptor = '';
    if (isDeep) descriptor += 'deep ';
    if (isOwn) descriptor += 'own ';
    if (isNested) descriptor += 'nested ';
    descriptor += 'property ';

    var hasProperty;
    if (isOwn) hasProperty = Object.prototype.hasOwnProperty.call(obj, name);
    else if (isNested) hasProperty = pathInfo.exists;
    else hasProperty = _.hasProperty(obj, name);

    // When performing a negated assertion for both name and val, merely having
    // a property with the given name isn't enough to cause the assertion to
    // fail. It must both have a property with the given name, and the value of
    // that property must equal the given val. Therefore, skip this assertion in
    // favor of the next.
    if (!negate || arguments.length === 1) {
      this.assert(
          hasProperty
        , 'expected #{this} to have ' + descriptor + _.inspect(name)
        , 'expected #{this} to not have ' + descriptor + _.inspect(name));
    }

    if (arguments.length > 1) {
      this.assert(
          hasProperty && (isDeep ? _.eql(val, value) : val === value)
        , 'expected #{this} to have ' + descriptor + _.inspect(name) + ' of #{exp}, but got #{act}'
        , 'expected #{this} to not have ' + descriptor + _.inspect(name) + ' of #{act}'
        , val
        , value
      );
    }

    flag(this, 'object', value);
  }

  Assertion.addMethod('property', assertProperty);

  function assertOwnProperty (name, value, msg) {
    flag(this, 'own', true);
    assertProperty.apply(this, arguments);
  }

  Assertion.addMethod('ownProperty', assertOwnProperty);
  Assertion.addMethod('haveOwnProperty', assertOwnProperty);

  /**
   * ### .ownPropertyDescriptor(name[, descriptor[, msg]])
   *
   * Asserts that the target has its own property descriptor with the given key
   * `name`. Enumerable and non-enumerable properties are included in the
   * search.
   *
   *     expect({a: 1}).to.have.ownPropertyDescriptor('a');
   *
   * When `descriptor` is provided, `.ownPropertyDescriptor` also asserts that
   * the property's descriptor is deeply equal to the given `descriptor`. See
   * the `deep-eql` project page for info on the deep equality algorithm:
   * https://github.com/chaijs/deep-eql.
   *
   *     expect({a: 1}).to.have.ownPropertyDescriptor('a', {
   *       configurable: true,
   *       enumerable: true,
   *       writable: true,
   *       value: 1,
   *     });
   *
   * Add `.not` earlier in the chain to negate `.ownPropertyDescriptor`.
   *
   *     expect({a: 1}).to.not.have.ownPropertyDescriptor('b');
   *
   * However, it's dangerous to negate `.ownPropertyDescriptor` when providing
   * a `descriptor`. The problem is that it creates uncertain expectations by
   * asserting that the target either doesn't have a property descriptor with
   * the given key `name`, or that it does have a property descriptor with the
   * given key `name` but its not deeply equal to the given `descriptor`. It's
   * often best to identify the exact output that's expected, and then write an
   * assertion that only accepts that exact output.
   *
   * When the target isn't expected to have a property descriptor with the given
   * key `name`, it's often best to assert exactly that.
   *
   *     // Recommended
   *     expect({b: 2}).to.not.have.ownPropertyDescriptor('a');
   *
   *     // Not recommended
   *     expect({b: 2}).to.not.have.ownPropertyDescriptor('a', {
   *       configurable: true,
   *       enumerable: true,
   *       writable: true,
   *       value: 1,
   *     });
   *
   * When the target is expected to have a property descriptor with the given
   * key `name`, it's often best to assert that the property has its expected
   * descriptor, rather than asserting that it doesn't have one of many
   * unexpected descriptors.
   *
   *     // Recommended
   *     expect({a: 3}).to.have.ownPropertyDescriptor('a', {
   *       configurable: true,
   *       enumerable: true,
   *       writable: true,
   *       value: 3,
   *     });
   *
   *     // Not recommended
   *     expect({a: 3}).to.not.have.ownPropertyDescriptor('a', {
   *       configurable: true,
   *       enumerable: true,
   *       writable: true,
   *       value: 1,
   *     });
   *
   * `.ownPropertyDescriptor` changes the target of any assertions that follow
   * in the chain to be the value of the property descriptor from the original
   * target object.
   *
   *     expect({a: 1}).to.have.ownPropertyDescriptor('a')
   *       .that.has.property('enumerable', true);
   *
   * `.ownPropertyDescriptor` accepts an optional `msg` argument which is a
   * custom error message to show when the assertion fails. The message can also
   * be given as the second argument to `expect`. When not providing
   * `descriptor`, only use the second form.
   *
   *     // Recommended
   *     expect({a: 1}).to.have.ownPropertyDescriptor('a', {
   *       configurable: true,
   *       enumerable: true,
   *       writable: true,
   *       value: 2,
   *     }, 'nooo why fail??');
   *
   *     // Recommended
   *     expect({a: 1}, 'nooo why fail??').to.have.ownPropertyDescriptor('a', {
   *       configurable: true,
   *       enumerable: true,
   *       writable: true,
   *       value: 2,
   *     });
   *
   *     // Recommended
   *     expect({a: 1}, 'nooo why fail??').to.have.ownPropertyDescriptor('b');
   *
   *     // Not recommended
   *     expect({a: 1})
   *       .to.have.ownPropertyDescriptor('b', undefined, 'nooo why fail??');
   *
   * The above assertion isn't the same thing as not providing `descriptor`.
   * Instead, it's asserting that the target object has a `b` property
   * descriptor that's deeply equal to `undefined`.
   *
   * The alias `.haveOwnPropertyDescriptor` can be used interchangeably with
   * `.ownPropertyDescriptor`.
   *
   * @name ownPropertyDescriptor
   * @alias haveOwnPropertyDescriptor
   * @param {String} name
   * @param {Object} descriptor _optional_
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertOwnPropertyDescriptor (name, descriptor, msg) {
    if (typeof descriptor === 'string') {
      msg = descriptor;
      descriptor = null;
    }
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    var actualDescriptor = Object.getOwnPropertyDescriptor(Object(obj), name);
    if (actualDescriptor && descriptor) {
      this.assert(
          _.eql(descriptor, actualDescriptor)
        , 'expected the own property descriptor for ' + _.inspect(name) + ' on #{this} to match ' + _.inspect(descriptor) + ', got ' + _.inspect(actualDescriptor)
        , 'expected the own property descriptor for ' + _.inspect(name) + ' on #{this} to not match ' + _.inspect(descriptor)
        , descriptor
        , actualDescriptor
        , true
      );
    } else {
      this.assert(
          actualDescriptor
        , 'expected #{this} to have an own property descriptor for ' + _.inspect(name)
        , 'expected #{this} to not have an own property descriptor for ' + _.inspect(name)
      );
    }
    flag(this, 'object', actualDescriptor);
  }

  Assertion.addMethod('ownPropertyDescriptor', assertOwnPropertyDescriptor);
  Assertion.addMethod('haveOwnPropertyDescriptor', assertOwnPropertyDescriptor);

  /**
   * ### .lengthOf(n[, msg])
   *
   * Asserts that the target's `length` or `size` is equal to the given number
   * `n`.
   *
   *     expect([1, 2, 3]).to.have.lengthOf(3);
   *     expect('foo').to.have.lengthOf(3);
   *     expect(new Set([1, 2, 3])).to.have.lengthOf(3);
   *     expect(new Map([['a', 1], ['b', 2], ['c', 3]])).to.have.lengthOf(3);
   *
   * Add `.not` earlier in the chain to negate `.lengthOf`. However, it's often
   * best to assert that the target's `length` property is equal to its expected
   * value, rather than not equal to one of many unexpected values.
   *
   *     expect('foo').to.have.lengthOf(3); // Recommended
   *     expect('foo').to.not.have.lengthOf(4); // Not recommended
   *
   * `.lengthOf` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`.
   *
   *     expect([1, 2, 3]).to.have.lengthOf(2, 'nooo why fail??');
   *     expect([1, 2, 3], 'nooo why fail??').to.have.lengthOf(2);
   *
   * `.lengthOf` can also be used as a language chain, causing all `.above`,
   * `.below`, `.least`, `.most`, and `.within` assertions that follow in the
   * chain to use the target's `length` property as the target. However, it's
   * often best to assert that the target's `length` property is equal to its
   * expected length, rather than asserting that its `length` property falls
   * within some range of values.
   *
   *     // Recommended
   *     expect([1, 2, 3]).to.have.lengthOf(3);
   *
   *     // Not recommended
   *     expect([1, 2, 3]).to.have.lengthOf.above(2);
   *     expect([1, 2, 3]).to.have.lengthOf.below(4);
   *     expect([1, 2, 3]).to.have.lengthOf.at.least(3);
   *     expect([1, 2, 3]).to.have.lengthOf.at.most(3);
   *     expect([1, 2, 3]).to.have.lengthOf.within(2,4);
   *
   * Due to a compatibility issue, the alias `.length` can't be chained directly
   * off of an uninvoked method such as `.a`. Therefore, `.length` can't be used
   * interchangeably with `.lengthOf` in every situation. It's recommended to
   * always use `.lengthOf` instead of `.length`.
   *
   *     expect([1, 2, 3]).to.have.a.length(3); // incompatible; throws error
   *     expect([1, 2, 3]).to.have.a.lengthOf(3);  // passes as expected
   *
   * @name lengthOf
   * @alias length
   * @param {Number} n
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertLengthChain () {
    flag(this, 'doLength', true);
  }

  function assertLength (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , objType = _.type(obj).toLowerCase()
      , flagMsg = flag(this, 'message')
      , ssfi = flag(this, 'ssfi')
      , descriptor = 'length'
      , itemsCount;

    switch (objType) {
      case 'map':
      case 'set':
        descriptor = 'size';
        itemsCount = obj.size;
        break;
      default:
        new Assertion(obj, flagMsg, ssfi, true).to.have.property('length');
        itemsCount = obj.length;
    }

    this.assert(
        itemsCount == n
      , 'expected #{this} to have a ' + descriptor + ' of #{exp} but got #{act}'
      , 'expected #{this} to not have a ' + descriptor + ' of #{act}'
      , n
      , itemsCount
    );
  }

  Assertion.addChainableMethod('length', assertLength, assertLengthChain);
  Assertion.addChainableMethod('lengthOf', assertLength, assertLengthChain);

  /**
   * ### .match(re[, msg])
   *
   * Asserts that the target matches the given regular expression `re`.
   *
   *     expect('foobar').to.match(/^foo/);
   *
   * Add `.not` earlier in the chain to negate `.match`.
   *
   *     expect('foobar').to.not.match(/taco/);
   *
   * `.match` accepts an optional `msg` argument which is a custom error message
   * to show when the assertion fails. The message can also be given as the
   * second argument to `expect`.
   *
   *     expect('foobar').to.match(/taco/, 'nooo why fail??');
   *     expect('foobar', 'nooo why fail??').to.match(/taco/);
   *
   * The alias `.matches` can be used interchangeably with `.match`.
   *
   * @name match
   * @alias matches
   * @param {RegExp} re
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */
  function assertMatch(re, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    this.assert(
        re.exec(obj)
      , 'expected #{this} to match ' + re
      , 'expected #{this} not to match ' + re
    );
  }

  Assertion.addMethod('match', assertMatch);
  Assertion.addMethod('matches', assertMatch);

  /**
   * ### .string(str[, msg])
   *
   * Asserts that the target string contains the given substring `str`.
   *
   *     expect('foobar').to.have.string('bar');
   *
   * Add `.not` earlier in the chain to negate `.string`.
   *
   *     expect('foobar').to.not.have.string('taco');
   *
   * `.string` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`.
   *
   *     expect('foobar').to.have.string('taco', 'nooo why fail??');
   *     expect('foobar', 'nooo why fail??').to.have.string('taco');
   *
   * @name string
   * @param {String} str
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  Assertion.addMethod('string', function (str, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , flagMsg = flag(this, 'message')
      , ssfi = flag(this, 'ssfi');
    new Assertion(obj, flagMsg, ssfi, true).is.a('string');

    this.assert(
        ~obj.indexOf(str)
      , 'expected #{this} to contain ' + _.inspect(str)
      , 'expected #{this} to not contain ' + _.inspect(str)
    );
  });

  /**
   * ### .keys(key1[, key2[, ...]])
   *
   * Asserts that the target object, array, map, or set has the given keys. Only
   * the target's own inherited properties are included in the search.
   *
   * When the target is an object or array, keys can be provided as one or more
   * string arguments, a single array argument, or a single object argument. In
   * the latter case, only the keys in the given object matter; the values are
   * ignored.
   *
   *     expect({a: 1, b: 2}).to.have.all.keys('a', 'b');
   *     expect(['x', 'y']).to.have.all.keys(0, 1);
   *
   *     expect({a: 1, b: 2}).to.have.all.keys(['a', 'b']);
   *     expect(['x', 'y']).to.have.all.keys([0, 1]);
   *
   *     expect({a: 1, b: 2}).to.have.all.keys({a: 4, b: 5}); // ignore 4 and 5
   *     expect(['x', 'y']).to.have.all.keys({0: 4, 1: 5}); // ignore 4 and 5
   *
   * When the target is a map or set, each key must be provided as a separate
   * argument.
   *
   *     expect(new Map([['a', 1], ['b', 2]])).to.have.all.keys('a', 'b');
   *     expect(new Set(['a', 'b'])).to.have.all.keys('a', 'b');
   *
   * Because `.keys` does different things based on the target's type, it's
   * important to check the target's type before using `.keys`. See the `.a` doc
   * for info on testing a target's type.
   *
   *     expect({a: 1, b: 2}).to.be.an('object').that.has.all.keys('a', 'b');
   *
   * By default, strict (`===`) equality is used to compare keys of maps and
   * sets. Add `.deep` earlier in the chain to use deep equality instead. See
   * the `deep-eql` project page for info on the deep equality algorithm:
   * https://github.com/chaijs/deep-eql.
   *
   *     // Target set deeply (but not strictly) has key `{a: 1}`
   *     expect(new Set([{a: 1}])).to.have.all.deep.keys([{a: 1}]);
   *     expect(new Set([{a: 1}])).to.not.have.all.keys([{a: 1}]);
   *
   * By default, the target must have all of the given keys and no more. Add
   * `.any` earlier in the chain to only require that the target have at least
   * one of the given keys. Also, add `.not` earlier in the chain to negate
   * `.keys`. It's often best to add `.any` when negating `.keys`, and to use
   * `.all` when asserting `.keys` without negation.
   *
   * When negating `.keys`, `.any` is preferred because `.not.any.keys` asserts
   * exactly what's expected of the output, whereas `.not.all.keys` creates
   * uncertain expectations.
   *
   *     // Recommended; asserts that target doesn't have any of the given keys
   *     expect({a: 1, b: 2}).to.not.have.any.keys('c', 'd');
   *
   *     // Not recommended; asserts that target doesn't have all of the given
   *     // keys but may or may not have some of them
   *     expect({a: 1, b: 2}).to.not.have.all.keys('c', 'd');
   *
   * When asserting `.keys` without negation, `.all` is preferred because
   * `.all.keys` asserts exactly what's expected of the output, whereas
   * `.any.keys` creates uncertain expectations.
   *
   *     // Recommended; asserts that target has all the given keys
   *     expect({a: 1, b: 2}).to.have.all.keys('a', 'b');
   *
   *     // Not recommended; asserts that target has at least one of the given
   *     // keys but may or may not have more of them
   *     expect({a: 1, b: 2}).to.have.any.keys('a', 'b');
   *
   * Note that `.all` is used by default when neither `.all` nor `.any` appear
   * earlier in the chain. However, it's often best to add `.all` anyway because
   * it improves readability.
   *
   *     // Both assertions are identical
   *     expect({a: 1, b: 2}).to.have.all.keys('a', 'b'); // Recommended
   *     expect({a: 1, b: 2}).to.have.keys('a', 'b'); // Not recommended
   *
   * Add `.include` earlier in the chain to require that the target's keys be a
   * superset of the expected keys, rather than identical sets.
   *
   *     // Target object's keys are a superset of ['a', 'b'] but not identical
   *     expect({a: 1, b: 2, c: 3}).to.include.all.keys('a', 'b');
   *     expect({a: 1, b: 2, c: 3}).to.not.have.all.keys('a', 'b');
   *
   * However, if `.any` and `.include` are combined, only the `.any` takes
   * effect. The `.include` is ignored in this case.
   *
   *     // Both assertions are identical
   *     expect({a: 1}).to.have.any.keys('a', 'b');
   *     expect({a: 1}).to.include.any.keys('a', 'b');
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect({a: 1}, 'nooo why fail??').to.have.key('b');
   *
   * The alias `.key` can be used interchangeably with `.keys`.
   *
   * @name keys
   * @alias key
   * @param {...String|Array|Object} keys
   * @namespace BDD
   * @api public
   */

  function assertKeys (keys) {
    var obj = flag(this, 'object')
      , objType = _.type(obj)
      , keysType = _.type(keys)
      , ssfi = flag(this, 'ssfi')
      , isDeep = flag(this, 'deep')
      , str
      , deepStr = ''
      , actual
      , ok = true
      , flagMsg = flag(this, 'message');

    flagMsg = flagMsg ? flagMsg + ': ' : '';
    var mixedArgsMsg = flagMsg + 'when testing keys against an object or an array you must give a single Array|Object|String argument or multiple String arguments';

    if (objType === 'Map' || objType === 'Set') {
      deepStr = isDeep ? 'deeply ' : '';
      actual = [];

      // Map and Set '.keys' aren't supported in IE 11. Therefore, use .forEach.
      obj.forEach(function (val, key) { actual.push(key) });

      if (keysType !== 'Array') {
        keys = Array.prototype.slice.call(arguments);
      }
    } else {
      actual = _.getOwnEnumerableProperties(obj);

      switch (keysType) {
        case 'Array':
          if (arguments.length > 1) {
            throw new AssertionError(mixedArgsMsg, undefined, ssfi);
          }
          break;
        case 'Object':
          if (arguments.length > 1) {
            throw new AssertionError(mixedArgsMsg, undefined, ssfi);
          }
          keys = Object.keys(keys);
          break;
        default:
          keys = Array.prototype.slice.call(arguments);
      }

      // Only stringify non-Symbols because Symbols would become "Symbol()"
      keys = keys.map(function (val) {
        return typeof val === 'symbol' ? val : String(val);
      });
    }

    if (!keys.length) {
      throw new AssertionError(flagMsg + 'keys required', undefined, ssfi);
    }

    var len = keys.length
      , any = flag(this, 'any')
      , all = flag(this, 'all')
      , expected = keys;

    if (!any && !all) {
      all = true;
    }

    // Has any
    if (any) {
      ok = expected.some(function(expectedKey) {
        return actual.some(function(actualKey) {
          if (isDeep) {
            return _.eql(expectedKey, actualKey);
          } else {
            return expectedKey === actualKey;
          }
        });
      });
    }

    // Has all
    if (all) {
      ok = expected.every(function(expectedKey) {
        return actual.some(function(actualKey) {
          if (isDeep) {
            return _.eql(expectedKey, actualKey);
          } else {
            return expectedKey === actualKey;
          }
        });
      });

      if (!flag(this, 'contains')) {
        ok = ok && keys.length == actual.length;
      }
    }

    // Key string
    if (len > 1) {
      keys = keys.map(function(key) {
        return _.inspect(key);
      });
      var last = keys.pop();
      if (all) {
        str = keys.join(', ') + ', and ' + last;
      }
      if (any) {
        str = keys.join(', ') + ', or ' + last;
      }
    } else {
      str = _.inspect(keys[0]);
    }

    // Form
    str = (len > 1 ? 'keys ' : 'key ') + str;

    // Have / include
    str = (flag(this, 'contains') ? 'contain ' : 'have ') + str;

    // Assertion
    this.assert(
        ok
      , 'expected #{this} to ' + deepStr + str
      , 'expected #{this} to not ' + deepStr + str
      , expected.slice(0).sort(_.compareByInspect)
      , actual.sort(_.compareByInspect)
      , true
    );
  }

  Assertion.addMethod('keys', assertKeys);
  Assertion.addMethod('key', assertKeys);

  /**
   * ### .throw([errorLike], [errMsgMatcher], [msg])
   *
   * When no arguments are provided, `.throw` invokes the target function and
   * asserts that an error is thrown.
   *
   *     var badFn = function () { throw new TypeError('Illegal salmon!'); };
   *
   *     expect(badFn).to.throw();
   *
   * When one argument is provided, and it's an error constructor, `.throw`
   * invokes the target function and asserts that an error is thrown that's an
   * instance of that error constructor.
   *
   *     var badFn = function () { throw new TypeError('Illegal salmon!'); };
   *
   *     expect(badFn).to.throw(TypeError);
   *
   * When one argument is provided, and it's an error instance, `.throw` invokes
   * the target function and asserts that an error is thrown that's strictly
   * (`===`) equal to that error instance.
   *
   *     var err = new TypeError('Illegal salmon!');
   *     var badFn = function () { throw err; };
   *
   *     expect(badFn).to.throw(err);
   *
   * When one argument is provided, and it's a string, `.throw` invokes the
   * target function and asserts that an error is thrown with a message that
   * contains that string.
   *
   *     var badFn = function () { throw new TypeError('Illegal salmon!'); };
   *
   *     expect(badFn).to.throw('salmon');
   *
   * When one argument is provided, and it's a regular expression, `.throw`
   * invokes the target function and asserts that an error is thrown with a
   * message that matches that regular expression.
   *
   *     var badFn = function () { throw new TypeError('Illegal salmon!'); };
   *
   *     expect(badFn).to.throw(/salmon/);
   *
   * When two arguments are provided, and the first is an error instance or
   * constructor, and the second is a string or regular expression, `.throw`
   * invokes the function and asserts that an error is thrown that fulfills both
   * conditions as described above.
   *
   *     var err = new TypeError('Illegal salmon!');
   *     var badFn = function () { throw err; };
   *
   *     expect(badFn).to.throw(TypeError, 'salmon');
   *     expect(badFn).to.throw(TypeError, /salmon/);
   *     expect(badFn).to.throw(err, 'salmon');
   *     expect(badFn).to.throw(err, /salmon/);
   *
   * Add `.not` earlier in the chain to negate `.throw`.
   *
   *     var goodFn = function () {};
   *
   *     expect(goodFn).to.not.throw();
   *
   * However, it's dangerous to negate `.throw` when providing any arguments.
   * The problem is that it creates uncertain expectations by asserting that the
   * target either doesn't throw an error, or that it throws an error but of a
   * different type than the given type, or that it throws an error of the given
   * type but with a message that doesn't include the given string. It's often
   * best to identify the exact output that's expected, and then write an
   * assertion that only accepts that exact output.
   *
   * When the target isn't expected to throw an error, it's often best to assert
   * exactly that.
   *
   *     var goodFn = function () {};
   *
   *     expect(goodFn).to.not.throw(); // Recommended
   *     expect(goodFn).to.not.throw(ReferenceError, 'x'); // Not recommended
   *
   * When the target is expected to throw an error, it's often best to assert
   * that the error is of its expected type, and has a message that includes an
   * expected string, rather than asserting that it doesn't have one of many
   * unexpected types, and doesn't have a message that includes some string.
   *
   *     var badFn = function () { throw new TypeError('Illegal salmon!'); };
   *
   *     expect(badFn).to.throw(TypeError, 'salmon'); // Recommended
   *     expect(badFn).to.not.throw(ReferenceError, 'x'); // Not recommended
   *
   * `.throw` changes the target of any assertions that follow in the chain to
   * be the error object that's thrown.
   *
   *     var err = new TypeError('Illegal salmon!');
   *     err.code = 42;
   *     var badFn = function () { throw err; };
   *
   *     expect(badFn).to.throw(TypeError).with.property('code', 42);
   *
   * `.throw` accepts an optional `msg` argument which is a custom error message
   * to show when the assertion fails. The message can also be given as the
   * second argument to `expect`. When not providing two arguments, always use
   * the second form.
   *
   *     var goodFn = function () {};
   *
   *     expect(goodFn).to.throw(TypeError, 'x', 'nooo why fail??');
   *     expect(goodFn, 'nooo why fail??').to.throw();
   *
   * Due to limitations in ES5, `.throw` may not always work as expected when
   * using a transpiler such as Babel or TypeScript. In particular, it may
   * produce unexpected results when subclassing the built-in `Error` object and
   * then passing the subclassed constructor to `.throw`. See your transpiler's
   * docs for details:
   *
   * - ([Babel](https://babeljs.io/docs/usage/caveats/#classes))
   * - ([TypeScript](https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work))
   *
   * Beware of some common mistakes when using the `throw` assertion. One common
   * mistake is to accidentally invoke the function yourself instead of letting
   * the `throw` assertion invoke the function for you. For example, when
   * testing if a function named `fn` throws, provide `fn` instead of `fn()` as
   * the target for the assertion.
   *
   *     expect(fn).to.throw();     // Good! Tests `fn` as desired
   *     expect(fn()).to.throw();   // Bad! Tests result of `fn()`, not `fn`
   *
   * If you need to assert that your function `fn` throws when passed certain
   * arguments, then wrap a call to `fn` inside of another function.
   *
   *     expect(function () { fn(42); }).to.throw();  // Function expression
   *     expect(() => fn(42)).to.throw();             // ES6 arrow function
   *
   * Another common mistake is to provide an object method (or any stand-alone
   * function that relies on `this`) as the target of the assertion. Doing so is
   * problematic because the `this` context will be lost when the function is
   * invoked by `.throw`; there's no way for it to know what `this` is supposed
   * to be. There are two ways around this problem. One solution is to wrap the
   * method or function call inside of another function. Another solution is to
   * use `bind`.
   *
   *     expect(function () { cat.meow(); }).to.throw();  // Function expression
   *     expect(() => cat.meow()).to.throw();             // ES6 arrow function
   *     expect(cat.meow.bind(cat)).to.throw();           // Bind
   *
   * Finally, it's worth mentioning that it's a best practice in JavaScript to
   * only throw `Error` and derivatives of `Error` such as `ReferenceError`,
   * `TypeError`, and user-defined objects that extend `Error`. No other type of
   * value will generate a stack trace when initialized. With that said, the
   * `throw` assertion does technically support any type of value being thrown,
   * not just `Error` and its derivatives.
   *
   * The aliases `.throws` and `.Throw` can be used interchangeably with
   * `.throw`.
   *
   * @name throw
   * @alias throws
   * @alias Throw
   * @param {Error|ErrorConstructor} errorLike
   * @param {String|RegExp} errMsgMatcher error message
   * @param {String} msg _optional_
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
   * @returns error for chaining (null if no error)
   * @namespace BDD
   * @api public
   */

  function assertThrows (errorLike, errMsgMatcher, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , ssfi = flag(this, 'ssfi')
      , flagMsg = flag(this, 'message')
      , negate = flag(this, 'negate') || false;
    new Assertion(obj, flagMsg, ssfi, true).is.a('function');

    if (errorLike instanceof RegExp || typeof errorLike === 'string') {
      errMsgMatcher = errorLike;
      errorLike = null;
    }

    var caughtErr;
    try {
      obj();
    } catch (err) {
      caughtErr = err;
    }

    // If we have the negate flag enabled and at least one valid argument it means we do expect an error
    // but we want it to match a given set of criteria
    var everyArgIsUndefined = errorLike === undefined && errMsgMatcher === undefined;

    // If we've got the negate flag enabled and both args, we should only fail if both aren't compatible
    // See Issue #551 and PR #683@GitHub
    var everyArgIsDefined = Boolean(errorLike && errMsgMatcher);
    var errorLikeFail = false;
    var errMsgMatcherFail = false;

    // Checking if error was thrown
    if (everyArgIsUndefined || !everyArgIsUndefined && !negate) {
      // We need this to display results correctly according to their types
      var errorLikeString = 'an error';
      if (errorLike instanceof Error) {
        errorLikeString = '#{exp}';
      } else if (errorLike) {
        errorLikeString = _.checkError.getConstructorName(errorLike);
      }

      this.assert(
          caughtErr
        , 'expected #{this} to throw ' + errorLikeString
        , 'expected #{this} to not throw an error but #{act} was thrown'
        , errorLike && errorLike.toString()
        , (caughtErr instanceof Error ?
            caughtErr.toString() : (typeof caughtErr === 'string' ? caughtErr : caughtErr &&
                                    _.checkError.getConstructorName(caughtErr)))
      );
    }

    if (errorLike && caughtErr) {
      // We should compare instances only if `errorLike` is an instance of `Error`
      if (errorLike instanceof Error) {
        var isCompatibleInstance = _.checkError.compatibleInstance(caughtErr, errorLike);

        if (isCompatibleInstance === negate) {
          // These checks were created to ensure we won't fail too soon when we've got both args and a negate
          // See Issue #551 and PR #683@GitHub
          if (everyArgIsDefined && negate) {
            errorLikeFail = true;
          } else {
            this.assert(
                negate
              , 'expected #{this} to throw #{exp} but #{act} was thrown'
              , 'expected #{this} to not throw #{exp}' + (caughtErr && !negate ? ' but #{act} was thrown' : '')
              , errorLike.toString()
              , caughtErr.toString()
            );
          }
        }
      }

      var isCompatibleConstructor = _.checkError.compatibleConstructor(caughtErr, errorLike);
      if (isCompatibleConstructor === negate) {
        if (everyArgIsDefined && negate) {
            errorLikeFail = true;
        } else {
          this.assert(
              negate
            , 'expected #{this} to throw #{exp} but #{act} was thrown'
            , 'expected #{this} to not throw #{exp}' + (caughtErr ? ' but #{act} was thrown' : '')
            , (errorLike instanceof Error ? errorLike.toString() : errorLike && _.checkError.getConstructorName(errorLike))
            , (caughtErr instanceof Error ? caughtErr.toString() : caughtErr && _.checkError.getConstructorName(caughtErr))
          );
        }
      }
    }

    if (caughtErr && errMsgMatcher !== undefined && errMsgMatcher !== null) {
      // Here we check compatible messages
      var placeholder = 'including';
      if (errMsgMatcher instanceof RegExp) {
        placeholder = 'matching'
      }

      var isCompatibleMessage = _.checkError.compatibleMessage(caughtErr, errMsgMatcher);
      if (isCompatibleMessage === negate) {
        if (everyArgIsDefined && negate) {
            errMsgMatcherFail = true;
        } else {
          this.assert(
            negate
            , 'expected #{this} to throw error ' + placeholder + ' #{exp} but got #{act}'
            , 'expected #{this} to throw error not ' + placeholder + ' #{exp}'
            ,  errMsgMatcher
            ,  _.checkError.getMessage(caughtErr)
          );
        }
      }
    }

    // If both assertions failed and both should've matched we throw an error
    if (errorLikeFail && errMsgMatcherFail) {
      this.assert(
        negate
        , 'expected #{this} to throw #{exp} but #{act} was thrown'
        , 'expected #{this} to not throw #{exp}' + (caughtErr ? ' but #{act} was thrown' : '')
        , (errorLike instanceof Error ? errorLike.toString() : errorLike && _.checkError.getConstructorName(errorLike))
        , (caughtErr instanceof Error ? caughtErr.toString() : caughtErr && _.checkError.getConstructorName(caughtErr))
      );
    }

    flag(this, 'object', caughtErr);
  };

  Assertion.addMethod('throw', assertThrows);
  Assertion.addMethod('throws', assertThrows);
  Assertion.addMethod('Throw', assertThrows);

  /**
   * ### .respondTo(method[, msg])
   *
   * When the target is a non-function object, `.respondTo` asserts that the
   * target has a method with the given name `method`. The method can be own or
   * inherited, and it can be enumerable or non-enumerable.
   *
   *     function Cat () {}
   *     Cat.prototype.meow = function () {};
   *
   *     expect(new Cat()).to.respondTo('meow');
   *
   * When the target is a function, `.respondTo` asserts that the target's
   * `prototype` property has a method with the given name `method`. Again, the
   * method can be own or inherited, and it can be enumerable or non-enumerable.
   *
   *     function Cat () {}
   *     Cat.prototype.meow = function () {};
   *
   *     expect(Cat).to.respondTo('meow');
   *
   * Add `.itself` earlier in the chain to force `.respondTo` to treat the
   * target as a non-function object, even if it's a function. Thus, it asserts
   * that the target has a method with the given name `method`, rather than
   * asserting that the target's `prototype` property has a method with the
   * given name `method`.
   *
   *     function Cat () {}
   *     Cat.prototype.meow = function () {};
   *     Cat.hiss = function () {};
   *
   *     expect(Cat).itself.to.respondTo('hiss').but.not.respondTo('meow');
   *
   * When not adding `.itself`, it's important to check the target's type before
   * using `.respondTo`. See the `.a` doc for info on checking a target's type.
   *
   *     function Cat () {}
   *     Cat.prototype.meow = function () {};
   *
   *     expect(new Cat()).to.be.an('object').that.respondsTo('meow');
   *
   * Add `.not` earlier in the chain to negate `.respondTo`.
   *
   *     function Dog () {}
   *     Dog.prototype.bark = function () {};
   *
   *     expect(new Dog()).to.not.respondTo('meow');
   *
   * `.respondTo` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`.
   *
   *     expect({}).to.respondTo('meow', 'nooo why fail??');
   *     expect({}, 'nooo why fail??').to.respondTo('meow');
   *
   * The alias `.respondsTo` can be used interchangeably with `.respondTo`.
   *
   * @name respondTo
   * @alias respondsTo
   * @param {String} method
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function respondTo (method, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , itself = flag(this, 'itself')
      , context = ('function' === typeof obj && !itself)
        ? obj.prototype[method]
        : obj[method];

    this.assert(
        'function' === typeof context
      , 'expected #{this} to respond to ' + _.inspect(method)
      , 'expected #{this} to not respond to ' + _.inspect(method)
    );
  }

  Assertion.addMethod('respondTo', respondTo);
  Assertion.addMethod('respondsTo', respondTo);

  /**
   * ### .itself
   *
   * Forces all `.respondTo` assertions that follow in the chain to behave as if
   * the target is a non-function object, even if it's a function. Thus, it
   * causes `.respondTo` to assert that the target has a method with the given
   * name, rather than asserting that the target's `prototype` property has a
   * method with the given name.
   *
   *     function Cat () {}
   *     Cat.prototype.meow = function () {};
   *     Cat.hiss = function () {};
   *
   *     expect(Cat).itself.to.respondTo('hiss').but.not.respondTo('meow');
   *
   * @name itself
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('itself', function () {
    flag(this, 'itself', true);
  });

  /**
   * ### .satisfy(matcher[, msg])
   *
   * Invokes the given `matcher` function with the target being passed as the
   * first argument, and asserts that the value returned is truthy.
   *
   *     expect(1).to.satisfy(function(num) {
   *       return num > 0;
   *     });
   *
   * Add `.not` earlier in the chain to negate `.satisfy`.
   *
   *     expect(1).to.not.satisfy(function(num) {
   *       return num > 2;
   *     });
   *
   * `.satisfy` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`.
   *
   *     expect(1).to.satisfy(function(num) {
   *       return num > 2;
   *     }, 'nooo why fail??');
   *
   *     expect(1, 'nooo why fail??').to.satisfy(function(num) {
   *       return num > 2;
   *     });
   *
   * The alias `.satisfies` can be used interchangeably with `.satisfy`.
   *
   * @name satisfy
   * @alias satisfies
   * @param {Function} matcher
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function satisfy (matcher, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    var result = matcher(obj);
    this.assert(
        result
      , 'expected #{this} to satisfy ' + _.objDisplay(matcher)
      , 'expected #{this} to not satisfy' + _.objDisplay(matcher)
      , flag(this, 'negate') ? false : true
      , result
    );
  }

  Assertion.addMethod('satisfy', satisfy);
  Assertion.addMethod('satisfies', satisfy);

  /**
   * ### .closeTo(expected, delta[, msg])
   *
   * Asserts that the target is a number that's within a given +/- `delta` range
   * of the given number `expected`. However, it's often best to assert that the
   * target is equal to its expected value.
   *
   *     // Recommended
   *     expect(1.5).to.equal(1.5);
   *
   *     // Not recommended
   *     expect(1.5).to.be.closeTo(1, 0.5);
   *     expect(1.5).to.be.closeTo(2, 0.5);
   *     expect(1.5).to.be.closeTo(1, 1);
   *
   * Add `.not` earlier in the chain to negate `.closeTo`.
   *
   *     expect(1.5).to.equal(1.5); // Recommended
   *     expect(1.5).to.not.be.closeTo(3, 1); // Not recommended
   *
   * `.closeTo` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`.
   *
   *     expect(1.5).to.be.closeTo(3, 1, 'nooo why fail??');
   *     expect(1.5, 'nooo why fail??').to.be.closeTo(3, 1);
   *
   * The alias `.approximately` can be used interchangeably with `.closeTo`.
   *
   * @name closeTo
   * @alias approximately
   * @param {Number} expected
   * @param {Number} delta
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function closeTo(expected, delta, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , flagMsg = flag(this, 'message')
      , ssfi = flag(this, 'ssfi');

    new Assertion(obj, flagMsg, ssfi, true).is.a('number');
    if (typeof expected !== 'number' || typeof delta !== 'number') {
      flagMsg = flagMsg ? flagMsg + ': ' : '';
      throw new AssertionError(
          flagMsg + 'the arguments to closeTo or approximately must be numbers',
          undefined,
          ssfi
      );
    }

    this.assert(
        Math.abs(obj - expected) <= delta
      , 'expected #{this} to be close to ' + expected + ' +/- ' + delta
      , 'expected #{this} not to be close to ' + expected + ' +/- ' + delta
    );
  }

  Assertion.addMethod('closeTo', closeTo);
  Assertion.addMethod('approximately', closeTo);

  // Note: Duplicates are ignored if testing for inclusion instead of sameness.
  function isSubsetOf(subset, superset, cmp, contains, ordered) {
    if (!contains) {
      if (subset.length !== superset.length) return false;
      superset = superset.slice();
    }

    return subset.every(function(elem, idx) {
      if (ordered) return cmp ? cmp(elem, superset[idx]) : elem === superset[idx];

      if (!cmp) {
        var matchIdx = superset.indexOf(elem);
        if (matchIdx === -1) return false;

        // Remove match from superset so not counted twice if duplicate in subset.
        if (!contains) superset.splice(matchIdx, 1);
        return true;
      }

      return superset.some(function(elem2, matchIdx) {
        if (!cmp(elem, elem2)) return false;

        // Remove match from superset so not counted twice if duplicate in subset.
        if (!contains) superset.splice(matchIdx, 1);
        return true;
      });
    });
  }

  /**
   * ### .members(set[, msg])
   *
   * Asserts that the target array has the same members as the given array
   * `set`.
   *
   *     expect([1, 2, 3]).to.have.members([2, 1, 3]);
   *     expect([1, 2, 2]).to.have.members([2, 1, 2]);
   *
   * By default, members are compared using strict (`===`) equality. Add `.deep`
   * earlier in the chain to use deep equality instead. See the `deep-eql`
   * project page for info on the deep equality algorithm:
   * https://github.com/chaijs/deep-eql.
   *
   *     // Target array deeply (but not strictly) has member `{a: 1}`
   *     expect([{a: 1}]).to.have.deep.members([{a: 1}]);
   *     expect([{a: 1}]).to.not.have.members([{a: 1}]);
   *
   * By default, order doesn't matter. Add `.ordered` earlier in the chain to
   * require that members appear in the same order.
   *
   *     expect([1, 2, 3]).to.have.ordered.members([1, 2, 3]);
   *     expect([1, 2, 3]).to.have.members([2, 1, 3])
   *       .but.not.ordered.members([2, 1, 3]);
   *
   * By default, both arrays must be the same size. Add `.include` earlier in
   * the chain to require that the target's members be a superset of the
   * expected members. Note that duplicates are ignored in the subset when
   * `.include` is added.
   *
   *     // Target array is a superset of [1, 2] but not identical
   *     expect([1, 2, 3]).to.include.members([1, 2]);
   *     expect([1, 2, 3]).to.not.have.members([1, 2]);
   *
   *     // Duplicates in the subset are ignored
   *     expect([1, 2, 3]).to.include.members([1, 2, 2, 2]);
   *
   * `.deep`, `.ordered`, and `.include` can all be combined. However, if
   * `.include` and `.ordered` are combined, the ordering begins at the start of
   * both arrays.
   *
   *     expect([{a: 1}, {b: 2}, {c: 3}])
   *       .to.include.deep.ordered.members([{a: 1}, {b: 2}])
   *       .but.not.include.deep.ordered.members([{b: 2}, {c: 3}]);
   *
   * Add `.not` earlier in the chain to negate `.members`. However, it's
   * dangerous to do so. The problem is that it creates uncertain expectations
   * by asserting that the target array doesn't have all of the same members as
   * the given array `set` but may or may not have some of them. It's often best
   * to identify the exact output that's expected, and then write an assertion
   * that only accepts that exact output.
   *
   *     expect([1, 2]).to.not.include(3).and.not.include(4); // Recommended
   *     expect([1, 2]).to.not.have.members([3, 4]); // Not recommended
   *
   * `.members` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`.
   *
   *     expect([1, 2]).to.have.members([1, 2, 3], 'nooo why fail??');
   *     expect([1, 2], 'nooo why fail??').to.have.members([1, 2, 3]);
   *
   * @name members
   * @param {Array} set
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  Assertion.addMethod('members', function (subset, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , flagMsg = flag(this, 'message')
      , ssfi = flag(this, 'ssfi');

    new Assertion(obj, flagMsg, ssfi, true).to.be.an('array');
    new Assertion(subset, flagMsg, ssfi, true).to.be.an('array');

    var contains = flag(this, 'contains');
    var ordered = flag(this, 'ordered');

    var subject, failMsg, failNegateMsg;

    if (contains) {
      subject = ordered ? 'an ordered superset' : 'a superset';
      failMsg = 'expected #{this} to be ' + subject + ' of #{exp}';
      failNegateMsg = 'expected #{this} to not be ' + subject + ' of #{exp}';
    } else {
      subject = ordered ? 'ordered members' : 'members';
      failMsg = 'expected #{this} to have the same ' + subject + ' as #{exp}';
      failNegateMsg = 'expected #{this} to not have the same ' + subject + ' as #{exp}';
    }

    var cmp = flag(this, 'deep') ? _.eql : undefined;

    this.assert(
        isSubsetOf(subset, obj, cmp, contains, ordered)
      , failMsg
      , failNegateMsg
      , subset
      , obj
      , true
    );
  });

  /**
   * ### .oneOf(list[, msg])
   *
   * Asserts that the target is a member of the given array `list`. However,
   * it's often best to assert that the target is equal to its expected value.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.be.oneOf([1, 2, 3]); // Not recommended
   *
   * Comparisons are performed using strict (`===`) equality.
   *
   * Add `.not` earlier in the chain to negate `.oneOf`.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.not.be.oneOf([2, 3, 4]); // Not recommended
   *
   * `.oneOf` accepts an optional `msg` argument which is a custom error message
   * to show when the assertion fails. The message can also be given as the
   * second argument to `expect`.
   *
   *     expect(1).to.be.oneOf([2, 3, 4], 'nooo why fail??');
   *     expect(1, 'nooo why fail??').to.be.oneOf([2, 3, 4]);
   *
   * @name oneOf
   * @param {Array<*>} list
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function oneOf (list, msg) {
    if (msg) flag(this, 'message', msg);
    var expected = flag(this, 'object')
      , flagMsg = flag(this, 'message')
      , ssfi = flag(this, 'ssfi');
    new Assertion(list, flagMsg, ssfi, true).to.be.an('array');

    this.assert(
        list.indexOf(expected) > -1
      , 'expected #{this} to be one of #{exp}'
      , 'expected #{this} to not be one of #{exp}'
      , list
      , expected
    );
  }

  Assertion.addMethod('oneOf', oneOf);

  /**
   * ### .change(subject[, prop[, msg]])
   *
   * When one argument is provided, `.change` asserts that the given function
   * `subject` returns a different value when it's invoked before the target
   * function compared to when it's invoked afterward. However, it's often best
   * to assert that `subject` is equal to its expected value.
   *
   *     var dots = ''
   *       , addDot = function () { dots += '.'; }
   *       , getDots = function () { return dots; };
   *
   *     // Recommended
   *     expect(getDots()).to.equal('');
   *     addDot();
   *     expect(getDots()).to.equal('.');
   *
   *     // Not recommended
   *     expect(addDot).to.change(getDots);
   *
   * When two arguments are provided, `.change` asserts that the value of the
   * given object `subject`'s `prop` property is different before invoking the
   * target function compared to afterward.
   *
   *     var myObj = {dots: ''}
   *       , addDot = function () { myObj.dots += '.'; };
   *
   *     // Recommended
   *     expect(myObj).to.have.property('dots', '');
   *     addDot();
   *     expect(myObj).to.have.property('dots', '.');
   *
   *     // Not recommended
   *     expect(addDot).to.change(myObj, 'dots');
   *
   * Strict (`===`) equality is used to compare before and after values.
   *
   * Add `.not` earlier in the chain to negate `.change`.
   *
   *     var dots = ''
   *       , noop = function () {}
   *       , getDots = function () { return dots; };
   *
   *     expect(noop).to.not.change(getDots);
   *
   *     var myObj = {dots: ''}
   *       , noop = function () {};
   *
   *     expect(noop).to.not.change(myObj, 'dots');
   *
   * `.change` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`. When not providing two arguments, always
   * use the second form.
   *
   *     var myObj = {dots: ''}
   *       , addDot = function () { myObj.dots += '.'; };
   *
   *     expect(addDot).to.not.change(myObj, 'dots', 'nooo why fail??');
   *
   *     var dots = ''
   *       , addDot = function () { dots += '.'; }
   *       , getDots = function () { return dots; };
   *
   *     expect(addDot, 'nooo why fail??').to.not.change(getDots);
   *
   * `.change` also causes all `.by` assertions that follow in the chain to
   * assert how much a numeric subject was increased or decreased by. However,
   * it's dangerous to use `.change.by`. The problem is that it creates
   * uncertain expectations by asserting that the subject either increases by
   * the given delta, or that it decreases by the given delta. It's often best
   * to identify the exact output that's expected, and then write an assertion
   * that only accepts that exact output.
   *
   *     var myObj = {val: 1}
   *       , addTwo = function () { myObj.val += 2; }
   *       , subtractTwo = function () { myObj.val -= 2; };
   *
   *     expect(addTwo).to.increase(myObj, 'val').by(2); // Recommended
   *     expect(addTwo).to.change(myObj, 'val').by(2); // Not recommended
   *
   *     expect(subtractTwo).to.decrease(myObj, 'val').by(2); // Recommended
   *     expect(subtractTwo).to.change(myObj, 'val').by(2); // Not recommended
   *
   * The alias `.changes` can be used interchangeably with `.change`.
   *
   * @name change
   * @alias changes
   * @param {String} subject
   * @param {String} prop name _optional_
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertChanges (subject, prop, msg) {
    if (msg) flag(this, 'message', msg);
    var fn = flag(this, 'object')
      , flagMsg = flag(this, 'message')
      , ssfi = flag(this, 'ssfi');
    new Assertion(fn, flagMsg, ssfi, true).is.a('function');

    var initial;
    if (!prop) {
      new Assertion(subject, flagMsg, ssfi, true).is.a('function');
      initial = subject();
    } else {
      new Assertion(subject, flagMsg, ssfi, true).to.have.property(prop);
      initial = subject[prop];
    }

    fn();

    var final = prop === undefined || prop === null ? subject() : subject[prop];
    var msgObj = prop === undefined || prop === null ? initial : '.' + prop;

    // This gets flagged because of the .by(delta) assertion
    flag(this, 'deltaMsgObj', msgObj);
    flag(this, 'initialDeltaValue', initial);
    flag(this, 'finalDeltaValue', final);
    flag(this, 'deltaBehavior', 'change');
    flag(this, 'realDelta', final !== initial);

    this.assert(
      initial !== final
      , 'expected ' + msgObj + ' to change'
      , 'expected ' + msgObj + ' to not change'
    );
  }

  Assertion.addMethod('change', assertChanges);
  Assertion.addMethod('changes', assertChanges);

  /**
   * ### .increase(subject[, prop[, msg]])
   *
   * When one argument is provided, `.increase` asserts that the given function
   * `subject` returns a greater number when it's invoked after invoking the
   * target function compared to when it's invoked beforehand. `.increase` also
   * causes all `.by` assertions that follow in the chain to assert how much
   * greater of a number is returned. It's often best to assert that the return
   * value increased by the expected amount, rather than asserting it increased
   * by any amount.
   *
   *     var val = 1
   *       , addTwo = function () { val += 2; }
   *       , getVal = function () { return val; };
   *
   *     expect(addTwo).to.increase(getVal).by(2); // Recommended
   *     expect(addTwo).to.increase(getVal); // Not recommended
   *
   * When two arguments are provided, `.increase` asserts that the value of the
   * given object `subject`'s `prop` property is greater after invoking the
   * target function compared to beforehand.
   *
   *     var myObj = {val: 1}
   *       , addTwo = function () { myObj.val += 2; };
   *
   *     expect(addTwo).to.increase(myObj, 'val').by(2); // Recommended
   *     expect(addTwo).to.increase(myObj, 'val'); // Not recommended
   *
   * Add `.not` earlier in the chain to negate `.increase`. However, it's
   * dangerous to do so. The problem is that it creates uncertain expectations
   * by asserting that the subject either decreases, or that it stays the same.
   * It's often best to identify the exact output that's expected, and then
   * write an assertion that only accepts that exact output.
   *
   * When the subject is expected to decrease, it's often best to assert that it
   * decreased by the expected amount.
   *
   *     var myObj = {val: 1}
   *       , subtractTwo = function () { myObj.val -= 2; };
   *
   *     expect(subtractTwo).to.decrease(myObj, 'val').by(2); // Recommended
   *     expect(subtractTwo).to.not.increase(myObj, 'val'); // Not recommended
   *
   * When the subject is expected to stay the same, it's often best to assert
   * exactly that.
   *
   *     var myObj = {val: 1}
   *       , noop = function () {};
   *
   *     expect(noop).to.not.change(myObj, 'val'); // Recommended
   *     expect(noop).to.not.increase(myObj, 'val'); // Not recommended
   *
   * `.increase` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`. When not providing two arguments, always
   * use the second form.
   *
   *     var myObj = {val: 1}
   *       , noop = function () {};
   *
   *     expect(noop).to.increase(myObj, 'val', 'nooo why fail??');
   *
   *     var val = 1
   *       , noop = function () {}
   *       , getVal = function () { return val; };
   *
   *     expect(noop, 'nooo why fail??').to.increase(getVal);
   *
   * The alias `.increases` can be used interchangeably with `.increase`.
   *
   * @name increase
   * @alias increases
   * @param {String|Function} subject
   * @param {String} prop name _optional_
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertIncreases (subject, prop, msg) {
    if (msg) flag(this, 'message', msg);
    var fn = flag(this, 'object')
      , flagMsg = flag(this, 'message')
      , ssfi = flag(this, 'ssfi');
    new Assertion(fn, flagMsg, ssfi, true).is.a('function');

    var initial;
    if (!prop) {
      new Assertion(subject, flagMsg, ssfi, true).is.a('function');
      initial = subject();
    } else {
      new Assertion(subject, flagMsg, ssfi, true).to.have.property(prop);
      initial = subject[prop];
    }

    // Make sure that the target is a number
    new Assertion(initial, flagMsg, ssfi, true).is.a('number');

    fn();

    var final = prop === undefined || prop === null ? subject() : subject[prop];
    var msgObj = prop === undefined || prop === null ? initial : '.' + prop;

    flag(this, 'deltaMsgObj', msgObj);
    flag(this, 'initialDeltaValue', initial);
    flag(this, 'finalDeltaValue', final);
    flag(this, 'deltaBehavior', 'increase');
    flag(this, 'realDelta', final - initial);

    this.assert(
      final - initial > 0
      , 'expected ' + msgObj + ' to increase'
      , 'expected ' + msgObj + ' to not increase'
    );
  }

  Assertion.addMethod('increase', assertIncreases);
  Assertion.addMethod('increases', assertIncreases);

  /**
   * ### .decrease(subject[, prop[, msg]])
   *
   * When one argument is provided, `.decrease` asserts that the given function
   * `subject` returns a lesser number when it's invoked after invoking the
   * target function compared to when it's invoked beforehand. `.decrease` also
   * causes all `.by` assertions that follow in the chain to assert how much
   * lesser of a number is returned. It's often best to assert that the return
   * value decreased by the expected amount, rather than asserting it decreased
   * by any amount.
   *
   *     var val = 1
   *       , subtractTwo = function () { val -= 2; }
   *       , getVal = function () { return val; };
   *
   *     expect(subtractTwo).to.decrease(getVal).by(2); // Recommended
   *     expect(subtractTwo).to.decrease(getVal); // Not recommended
   *
   * When two arguments are provided, `.decrease` asserts that the value of the
   * given object `subject`'s `prop` property is lesser after invoking the
   * target function compared to beforehand.
   *
   *     var myObj = {val: 1}
   *       , subtractTwo = function () { myObj.val -= 2; };
   *
   *     expect(subtractTwo).to.decrease(myObj, 'val').by(2); // Recommended
   *     expect(subtractTwo).to.decrease(myObj, 'val'); // Not recommended
   *
   * Add `.not` earlier in the chain to negate `.decrease`. However, it's
   * dangerous to do so. The problem is that it creates uncertain expectations
   * by asserting that the subject either increases, or that it stays the same.
   * It's often best to identify the exact output that's expected, and then
   * write an assertion that only accepts that exact output.
   *
   * When the subject is expected to increase, it's often best to assert that it
   * increased by the expected amount.
   *
   *     var myObj = {val: 1}
   *       , addTwo = function () { myObj.val += 2; };
   *
   *     expect(addTwo).to.increase(myObj, 'val').by(2); // Recommended
   *     expect(addTwo).to.not.decrease(myObj, 'val'); // Not recommended
   *
   * When the subject is expected to stay the same, it's often best to assert
   * exactly that.
   *
   *     var myObj = {val: 1}
   *       , noop = function () {};
   *
   *     expect(noop).to.not.change(myObj, 'val'); // Recommended
   *     expect(noop).to.not.decrease(myObj, 'val'); // Not recommended
   *
   * `.decrease` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`. When not providing two arguments, always
   * use the second form.
   *
   *     var myObj = {val: 1}
   *       , noop = function () {};
   *
   *     expect(noop).to.decrease(myObj, 'val', 'nooo why fail??');
   *
   *     var val = 1
   *       , noop = function () {}
   *       , getVal = function () { return val; };
   *
   *     expect(noop, 'nooo why fail??').to.decrease(getVal);
   *
   * The alias `.decreases` can be used interchangeably with `.decrease`.
   *
   * @name decrease
   * @alias decreases
   * @param {String|Function} subject
   * @param {String} prop name _optional_
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertDecreases (subject, prop, msg) {
    if (msg) flag(this, 'message', msg);
    var fn = flag(this, 'object')
      , flagMsg = flag(this, 'message')
      , ssfi = flag(this, 'ssfi');
    new Assertion(fn, flagMsg, ssfi, true).is.a('function');

    var initial;
    if (!prop) {
      new Assertion(subject, flagMsg, ssfi, true).is.a('function');
      initial = subject();
    } else {
      new Assertion(subject, flagMsg, ssfi, true).to.have.property(prop);
      initial = subject[prop];
    }

    // Make sure that the target is a number
    new Assertion(initial, flagMsg, ssfi, true).is.a('number');

    fn();

    var final = prop === undefined || prop === null ? subject() : subject[prop];
    var msgObj = prop === undefined || prop === null ? initial : '.' + prop;

    flag(this, 'deltaMsgObj', msgObj);
    flag(this, 'initialDeltaValue', initial);
    flag(this, 'finalDeltaValue', final);
    flag(this, 'deltaBehavior', 'decrease');
    flag(this, 'realDelta', initial - final);

    this.assert(
      final - initial < 0
      , 'expected ' + msgObj + ' to decrease'
      , 'expected ' + msgObj + ' to not decrease'
    );
  }

  Assertion.addMethod('decrease', assertDecreases);
  Assertion.addMethod('decreases', assertDecreases);

  /**
   * ### .by(delta[, msg])
   *
   * When following an `.increase` assertion in the chain, `.by` asserts that
   * the subject of the `.increase` assertion increased by the given `delta`.
   *
   *     var myObj = {val: 1}
   *       , addTwo = function () { myObj.val += 2; };
   *
   *     expect(addTwo).to.increase(myObj, 'val').by(2);
   *
   * When following a `.decrease` assertion in the chain, `.by` asserts that the
   * subject of the `.decrease` assertion decreased by the given `delta`.
   *
   *     var myObj = {val: 1}
   *       , subtractTwo = function () { myObj.val -= 2; };
   *
   *     expect(subtractTwo).to.decrease(myObj, 'val').by(2);
   *
   * When following a `.change` assertion in the chain, `.by` asserts that the
   * subject of the `.change` assertion either increased or decreased by the
   * given `delta`. However, it's dangerous to use `.change.by`. The problem is
   * that it creates uncertain expectations. It's often best to identify the
   * exact output that's expected, and then write an assertion that only accepts
   * that exact output.
   *
   *     var myObj = {val: 1}
   *       , addTwo = function () { myObj.val += 2; }
   *       , subtractTwo = function () { myObj.val -= 2; };
   *
   *     expect(addTwo).to.increase(myObj, 'val').by(2); // Recommended
   *     expect(addTwo).to.change(myObj, 'val').by(2); // Not recommended
   *
   *     expect(subtractTwo).to.decrease(myObj, 'val').by(2); // Recommended
   *     expect(subtractTwo).to.change(myObj, 'val').by(2); // Not recommended
   *
   * Add `.not` earlier in the chain to negate `.by`. However, it's often best
   * to assert that the subject changed by its expected delta, rather than
   * asserting that it didn't change by one of countless unexpected deltas.
   *
   *     var myObj = {val: 1}
   *       , addTwo = function () { myObj.val += 2; };
   *
   *     // Recommended
   *     expect(addTwo).to.increase(myObj, 'val').by(2);
   *
   *     // Not recommended
   *     expect(addTwo).to.increase(myObj, 'val').but.not.by(3);
   *
   * `.by` accepts an optional `msg` argument which is a custom error message to
   * show when the assertion fails. The message can also be given as the second
   * argument to `expect`.
   *
   *     var myObj = {val: 1}
   *       , addTwo = function () { myObj.val += 2; };
   *
   *     expect(addTwo).to.increase(myObj, 'val').by(3, 'nooo why fail??');
   *     expect(addTwo, 'nooo why fail??').to.increase(myObj, 'val').by(3);
   *
   * @name by
   * @param {Number} delta
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertDelta(delta, msg) {
    if (msg) flag(this, 'message', msg);

    var msgObj = flag(this, 'deltaMsgObj');
    var initial = flag(this, 'initialDeltaValue');
    var final = flag(this, 'finalDeltaValue');
    var behavior = flag(this, 'deltaBehavior');
    var realDelta = flag(this, 'realDelta');

    var expression;
    if (behavior === 'change') {
      expression = Math.abs(final - initial) === Math.abs(delta);
    } else {
      expression = realDelta === Math.abs(delta);
    }

    this.assert(
      expression
      , 'expected ' + msgObj + ' to ' + behavior + ' by ' + delta
      , 'expected ' + msgObj + ' to not ' + behavior + ' by ' + delta
    );
  }

  Assertion.addMethod('by', assertDelta);

  /**
   * ### .extensible
   *
   * Asserts that the target is extensible, which means that new properties can
   * be added to it. Primitives are never extensible.
   *
   *     expect({a: 1}).to.be.extensible;
   *
   * Add `.not` earlier in the chain to negate `.extensible`.
   *
   *     var nonExtensibleObject = Object.preventExtensions({})
   *       , sealedObject = Object.seal({})
   *       , frozenObject = Object.freeze({});
   *
   *     expect(nonExtensibleObject).to.not.be.extensible;
   *     expect(sealedObject).to.not.be.extensible;
   *     expect(frozenObject).to.not.be.extensible;
   *     expect(1).to.not.be.extensible;
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect(1, 'nooo why fail??').to.be.extensible;
   *
   * @name extensible
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('extensible', function() {
    var obj = flag(this, 'object');

    // In ES5, if the argument to this method is a primitive, then it will cause a TypeError.
    // In ES6, a non-object argument will be treated as if it was a non-extensible ordinary object, simply return false.
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/isExtensible
    // The following provides ES6 behavior for ES5 environments.

    var isExtensible = obj === Object(obj) && Object.isExtensible(obj);

    this.assert(
      isExtensible
      , 'expected #{this} to be extensible'
      , 'expected #{this} to not be extensible'
    );
  });

  /**
   * ### .sealed
   *
   * Asserts that the target is sealed, which means that new properties can't be
   * added to it, and its existing properties can't be reconfigured or deleted.
   * However, it's possible that its existing properties can still be reassigned
   * to different values. Primitives are always sealed.
   *
   *     var sealedObject = Object.seal({});
   *     var frozenObject = Object.freeze({});
   *
   *     expect(sealedObject).to.be.sealed;
   *     expect(frozenObject).to.be.sealed;
   *     expect(1).to.be.sealed;
   *
   * Add `.not` earlier in the chain to negate `.sealed`.
   *
   *     expect({a: 1}).to.not.be.sealed;
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect({a: 1}, 'nooo why fail??').to.be.sealed;
   *
   * @name sealed
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('sealed', function() {
    var obj = flag(this, 'object');

    // In ES5, if the argument to this method is a primitive, then it will cause a TypeError.
    // In ES6, a non-object argument will be treated as if it was a sealed ordinary object, simply return true.
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/isSealed
    // The following provides ES6 behavior for ES5 environments.

    var isSealed = obj === Object(obj) ? Object.isSealed(obj) : true;

    this.assert(
      isSealed
      , 'expected #{this} to be sealed'
      , 'expected #{this} to not be sealed'
    );
  });

  /**
   * ### .frozen
   *
   * Asserts that the target is frozen, which means that new properties can't be
   * added to it, and its existing properties can't be reassigned to different
   * values, reconfigured, or deleted. Primitives are always frozen.
   *
   *     var frozenObject = Object.freeze({});
   *
   *     expect(frozenObject).to.be.frozen;
   *     expect(1).to.be.frozen;
   *
   * Add `.not` earlier in the chain to negate `.frozen`.
   *
   *     expect({a: 1}).to.not.be.frozen;
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect({a: 1}, 'nooo why fail??').to.be.frozen;
   *
   * @name frozen
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('frozen', function() {
    var obj = flag(this, 'object');

    // In ES5, if the argument to this method is a primitive, then it will cause a TypeError.
    // In ES6, a non-object argument will be treated as if it was a frozen ordinary object, simply return true.
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/isFrozen
    // The following provides ES6 behavior for ES5 environments.

    var isFrozen = obj === Object(obj) ? Object.isFrozen(obj) : true;

    this.assert(
      isFrozen
      , 'expected #{this} to be frozen'
      , 'expected #{this} to not be frozen'
    );
  });

  /**
   * ### .finite
   *
   * Asserts that the target is a number, and isn't `NaN` or positive/negative
   * `Infinity`.
   *
   *     expect(1).to.be.finite;
   *
   * Add `.not` earlier in the chain to negate `.finite`. However, it's
   * dangerous to do so. The problem is that it creates uncertain expectations
   * by asserting that the subject either isn't a number, or that it's `NaN`, or
   * that it's positive `Infinity`, or that it's negative `Infinity`. It's often
   * best to identify the exact output that's expected, and then write an
   * assertion that only accepts that exact output.
   *
   * When the target isn't expected to be a number, it's often best to assert
   * that it's the expected type, rather than asserting that it isn't one of
   * many unexpected types.
   *
   *     expect('foo').to.be.a('string'); // Recommended
   *     expect('foo').to.not.be.finite; // Not recommended
   *
   * When the target is expected to be `NaN`, it's often best to assert exactly
   * that.
   *
   *     expect(NaN).to.be.NaN; // Recommended
   *     expect(NaN).to.not.be.finite; // Not recommended
   *
   * When the target is expected to be positive infinity, it's often best to
   * assert exactly that.
   *
   *     expect(Infinity).to.equal(Infinity); // Recommended
   *     expect(Infinity).to.not.be.finite; // Not recommended
   *
   * When the target is expected to be negative infinity, it's often best to
   * assert exactly that.
   *
   *     expect(-Infinity).to.equal(-Infinity); // Recommended
   *     expect(-Infinity).to.not.be.finite; // Not recommended
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect('foo', 'nooo why fail??').to.be.finite;
   *
   * @name finite
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('finite', function(msg) {
    var obj = flag(this, 'object');

    this.assert(
        typeof obj === 'number' && isFinite(obj)
      , 'expected #{this} to be a finite number'
      , 'expected #{this} to not be a finite number'
    );
  });
};

},{}],7:[function(require,module,exports){
/*!
 * chai
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

module.exports = function (chai, util) {
  /*!
   * Chai dependencies.
   */

  var Assertion = chai.Assertion
    , flag = util.flag;

  /*!
   * Module export.
   */

  /**
   * ### assert(expression, message)
   *
   * Write your own test expressions.
   *
   *     assert('foo' !== 'bar', 'foo is not bar');
   *     assert(Array.isArray([]), 'empty arrays are arrays');
   *
   * @param {Mixed} expression to test for truthiness
   * @param {String} message to display on error
   * @name assert
   * @namespace Assert
   * @api public
   */

  var assert = chai.assert = function (express, errmsg) {
    var test = new Assertion(null, null, chai.assert, true);
    test.assert(
        express
      , errmsg
      , '[ negation message unavailable ]'
    );
  };

  /**
   * ### .fail([message])
   * ### .fail(actual, expected, [message], [operator])
   *
   * Throw a failure. Node.js `assert` module-compatible.
   *
   *     assert.fail();
   *     assert.fail("custom error message");
   *     assert.fail(1, 2);
   *     assert.fail(1, 2, "custom error message");
   *     assert.fail(1, 2, "custom error message", ">");
   *     assert.fail(1, 2, undefined, ">");
   *
   * @name fail
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @param {String} operator
   * @namespace Assert
   * @api public
   */

  assert.fail = function (actual, expected, message, operator) {
    if (arguments.length < 2) {
        // Comply with Node's fail([message]) interface

        message = actual;
        actual = undefined;
    }

    message = message || 'assert.fail()';
    throw new chai.AssertionError(message, {
        actual: actual
      , expected: expected
      , operator: operator
    }, assert.fail);
  };

  /**
   * ### .isOk(object, [message])
   *
   * Asserts that `object` is truthy.
   *
   *     assert.isOk('everything', 'everything is ok');
   *     assert.isOk(false, 'this will fail');
   *
   * @name isOk
   * @alias ok
   * @param {Mixed} object to test
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isOk = function (val, msg) {
    new Assertion(val, msg, assert.isOk, true).is.ok;
  };

  /**
   * ### .isNotOk(object, [message])
   *
   * Asserts that `object` is falsy.
   *
   *     assert.isNotOk('everything', 'this will fail');
   *     assert.isNotOk(false, 'this will pass');
   *
   * @name isNotOk
   * @alias notOk
   * @param {Mixed} object to test
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotOk = function (val, msg) {
    new Assertion(val, msg, assert.isNotOk, true).is.not.ok;
  };

  /**
   * ### .equal(actual, expected, [message])
   *
   * Asserts non-strict equality (`==`) of `actual` and `expected`.
   *
   *     assert.equal(3, '3', '== coerces values to strings');
   *
   * @name equal
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.equal = function (act, exp, msg) {
    var test = new Assertion(act, msg, assert.equal, true);

    test.assert(
        exp == flag(test, 'object')
      , 'expected #{this} to equal #{exp}'
      , 'expected #{this} to not equal #{act}'
      , exp
      , act
      , true
    );
  };

  /**
   * ### .notEqual(actual, expected, [message])
   *
   * Asserts non-strict inequality (`!=`) of `actual` and `expected`.
   *
   *     assert.notEqual(3, 4, 'these numbers are not equal');
   *
   * @name notEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notEqual = function (act, exp, msg) {
    var test = new Assertion(act, msg, assert.notEqual, true);

    test.assert(
        exp != flag(test, 'object')
      , 'expected #{this} to not equal #{exp}'
      , 'expected #{this} to equal #{act}'
      , exp
      , act
      , true
    );
  };

  /**
   * ### .strictEqual(actual, expected, [message])
   *
   * Asserts strict equality (`===`) of `actual` and `expected`.
   *
   *     assert.strictEqual(true, true, 'these booleans are strictly equal');
   *
   * @name strictEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.strictEqual = function (act, exp, msg) {
    new Assertion(act, msg, assert.strictEqual, true).to.equal(exp);
  };

  /**
   * ### .notStrictEqual(actual, expected, [message])
   *
   * Asserts strict inequality (`!==`) of `actual` and `expected`.
   *
   *     assert.notStrictEqual(3, '3', 'no coercion for strict equality');
   *
   * @name notStrictEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notStrictEqual = function (act, exp, msg) {
    new Assertion(act, msg, assert.notStrictEqual, true).to.not.equal(exp);
  };

  /**
   * ### .deepEqual(actual, expected, [message])
   *
   * Asserts that `actual` is deeply equal to `expected`.
   *
   *     assert.deepEqual({ tea: 'green' }, { tea: 'green' });
   *
   * @name deepEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @alias deepStrictEqual
   * @namespace Assert
   * @api public
   */

  assert.deepEqual = assert.deepStrictEqual = function (act, exp, msg) {
    new Assertion(act, msg, assert.deepEqual, true).to.eql(exp);
  };

  /**
   * ### .notDeepEqual(actual, expected, [message])
   *
   * Assert that `actual` is not deeply equal to `expected`.
   *
   *     assert.notDeepEqual({ tea: 'green' }, { tea: 'jasmine' });
   *
   * @name notDeepEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notDeepEqual = function (act, exp, msg) {
    new Assertion(act, msg, assert.notDeepEqual, true).to.not.eql(exp);
  };

   /**
   * ### .isAbove(valueToCheck, valueToBeAbove, [message])
   *
   * Asserts `valueToCheck` is strictly greater than (>) `valueToBeAbove`.
   *
   *     assert.isAbove(5, 2, '5 is strictly greater than 2');
   *
   * @name isAbove
   * @param {Mixed} valueToCheck
   * @param {Mixed} valueToBeAbove
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isAbove = function (val, abv, msg) {
    new Assertion(val, msg, assert.isAbove, true).to.be.above(abv);
  };

   /**
   * ### .isAtLeast(valueToCheck, valueToBeAtLeast, [message])
   *
   * Asserts `valueToCheck` is greater than or equal to (>=) `valueToBeAtLeast`.
   *
   *     assert.isAtLeast(5, 2, '5 is greater or equal to 2');
   *     assert.isAtLeast(3, 3, '3 is greater or equal to 3');
   *
   * @name isAtLeast
   * @param {Mixed} valueToCheck
   * @param {Mixed} valueToBeAtLeast
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isAtLeast = function (val, atlst, msg) {
    new Assertion(val, msg, assert.isAtLeast, true).to.be.least(atlst);
  };

   /**
   * ### .isBelow(valueToCheck, valueToBeBelow, [message])
   *
   * Asserts `valueToCheck` is strictly less than (<) `valueToBeBelow`.
   *
   *     assert.isBelow(3, 6, '3 is strictly less than 6');
   *
   * @name isBelow
   * @param {Mixed} valueToCheck
   * @param {Mixed} valueToBeBelow
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isBelow = function (val, blw, msg) {
    new Assertion(val, msg, assert.isBelow, true).to.be.below(blw);
  };

   /**
   * ### .isAtMost(valueToCheck, valueToBeAtMost, [message])
   *
   * Asserts `valueToCheck` is less than or equal to (<=) `valueToBeAtMost`.
   *
   *     assert.isAtMost(3, 6, '3 is less than or equal to 6');
   *     assert.isAtMost(4, 4, '4 is less than or equal to 4');
   *
   * @name isAtMost
   * @param {Mixed} valueToCheck
   * @param {Mixed} valueToBeAtMost
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isAtMost = function (val, atmst, msg) {
    new Assertion(val, msg, assert.isAtMost, true).to.be.most(atmst);
  };

  /**
   * ### .isTrue(value, [message])
   *
   * Asserts that `value` is true.
   *
   *     var teaServed = true;
   *     assert.isTrue(teaServed, 'the tea has been served');
   *
   * @name isTrue
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isTrue = function (val, msg) {
    new Assertion(val, msg, assert.isTrue, true).is['true'];
  };

  /**
   * ### .isNotTrue(value, [message])
   *
   * Asserts that `value` is not true.
   *
   *     var tea = 'tasty chai';
   *     assert.isNotTrue(tea, 'great, time for tea!');
   *
   * @name isNotTrue
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotTrue = function (val, msg) {
    new Assertion(val, msg, assert.isNotTrue, true).to.not.equal(true);
  };

  /**
   * ### .isFalse(value, [message])
   *
   * Asserts that `value` is false.
   *
   *     var teaServed = false;
   *     assert.isFalse(teaServed, 'no tea yet? hmm...');
   *
   * @name isFalse
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isFalse = function (val, msg) {
    new Assertion(val, msg, assert.isFalse, true).is['false'];
  };

  /**
   * ### .isNotFalse(value, [message])
   *
   * Asserts that `value` is not false.
   *
   *     var tea = 'tasty chai';
   *     assert.isNotFalse(tea, 'great, time for tea!');
   *
   * @name isNotFalse
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotFalse = function (val, msg) {
    new Assertion(val, msg, assert.isNotFalse, true).to.not.equal(false);
  };

  /**
   * ### .isNull(value, [message])
   *
   * Asserts that `value` is null.
   *
   *     assert.isNull(err, 'there was no error');
   *
   * @name isNull
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNull = function (val, msg) {
    new Assertion(val, msg, assert.isNull, true).to.equal(null);
  };

  /**
   * ### .isNotNull(value, [message])
   *
   * Asserts that `value` is not null.
   *
   *     var tea = 'tasty chai';
   *     assert.isNotNull(tea, 'great, time for tea!');
   *
   * @name isNotNull
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotNull = function (val, msg) {
    new Assertion(val, msg, assert.isNotNull, true).to.not.equal(null);
  };

  /**
   * ### .isNaN
   *
   * Asserts that value is NaN.
   *
   *     assert.isNaN(NaN, 'NaN is NaN');
   *
   * @name isNaN
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNaN = function (val, msg) {
    new Assertion(val, msg, assert.isNaN, true).to.be.NaN;
  };

  /**
   * ### .isNotNaN
   *
   * Asserts that value is not NaN.
   *
   *     assert.isNotNaN(4, '4 is not NaN');
   *
   * @name isNotNaN
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */
  assert.isNotNaN = function (val, msg) {
    new Assertion(val, msg, assert.isNotNaN, true).not.to.be.NaN;
  };

  /**
   * ### .exists
   *
   * Asserts that the target is neither `null` nor `undefined`.
   *
   *     var foo = 'hi';
   *
   *     assert.exists(foo, 'foo is neither `null` nor `undefined`');
   *
   * @name exists
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.exists = function (val, msg) {
    new Assertion(val, msg, assert.exists, true).to.exist;
  };

  /**
   * ### .notExists
   *
   * Asserts that the target is either `null` or `undefined`.
   *
   *     var bar = null
   *       , baz;
   *
   *     assert.notExists(bar);
   *     assert.notExists(baz, 'baz is either null or undefined');
   *
   * @name notExists
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notExists = function (val, msg) {
    new Assertion(val, msg, assert.notExists, true).to.not.exist;
  };

  /**
   * ### .isUndefined(value, [message])
   *
   * Asserts that `value` is `undefined`.
   *
   *     var tea;
   *     assert.isUndefined(tea, 'no tea defined');
   *
   * @name isUndefined
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isUndefined = function (val, msg) {
    new Assertion(val, msg, assert.isUndefined, true).to.equal(undefined);
  };

  /**
   * ### .isDefined(value, [message])
   *
   * Asserts that `value` is not `undefined`.
   *
   *     var tea = 'cup of chai';
   *     assert.isDefined(tea, 'tea has been defined');
   *
   * @name isDefined
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isDefined = function (val, msg) {
    new Assertion(val, msg, assert.isDefined, true).to.not.equal(undefined);
  };

  /**
   * ### .isFunction(value, [message])
   *
   * Asserts that `value` is a function.
   *
   *     function serveTea() { return 'cup of tea'; };
   *     assert.isFunction(serveTea, 'great, we can have tea now');
   *
   * @name isFunction
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isFunction = function (val, msg) {
    new Assertion(val, msg, assert.isFunction, true).to.be.a('function');
  };

  /**
   * ### .isNotFunction(value, [message])
   *
   * Asserts that `value` is _not_ a function.
   *
   *     var serveTea = [ 'heat', 'pour', 'sip' ];
   *     assert.isNotFunction(serveTea, 'great, we have listed the steps');
   *
   * @name isNotFunction
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotFunction = function (val, msg) {
    new Assertion(val, msg, assert.isNotFunction, true).to.not.be.a('function');
  };

  /**
   * ### .isObject(value, [message])
   *
   * Asserts that `value` is an object of type 'Object' (as revealed by `Object.prototype.toString`).
   * _The assertion does not match subclassed objects._
   *
   *     var selection = { name: 'Chai', serve: 'with spices' };
   *     assert.isObject(selection, 'tea selection is an object');
   *
   * @name isObject
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isObject = function (val, msg) {
    new Assertion(val, msg, assert.isObject, true).to.be.a('object');
  };

  /**
   * ### .isNotObject(value, [message])
   *
   * Asserts that `value` is _not_ an object of type 'Object' (as revealed by `Object.prototype.toString`).
   *
   *     var selection = 'chai'
   *     assert.isNotObject(selection, 'tea selection is not an object');
   *     assert.isNotObject(null, 'null is not an object');
   *
   * @name isNotObject
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotObject = function (val, msg) {
    new Assertion(val, msg, assert.isNotObject, true).to.not.be.a('object');
  };

  /**
   * ### .isArray(value, [message])
   *
   * Asserts that `value` is an array.
   *
   *     var menu = [ 'green', 'chai', 'oolong' ];
   *     assert.isArray(menu, 'what kind of tea do we want?');
   *
   * @name isArray
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isArray = function (val, msg) {
    new Assertion(val, msg, assert.isArray, true).to.be.an('array');
  };

  /**
   * ### .isNotArray(value, [message])
   *
   * Asserts that `value` is _not_ an array.
   *
   *     var menu = 'green|chai|oolong';
   *     assert.isNotArray(menu, 'what kind of tea do we want?');
   *
   * @name isNotArray
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotArray = function (val, msg) {
    new Assertion(val, msg, assert.isNotArray, true).to.not.be.an('array');
  };

  /**
   * ### .isString(value, [message])
   *
   * Asserts that `value` is a string.
   *
   *     var teaOrder = 'chai';
   *     assert.isString(teaOrder, 'order placed');
   *
   * @name isString
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isString = function (val, msg) {
    new Assertion(val, msg, assert.isString, true).to.be.a('string');
  };

  /**
   * ### .isNotString(value, [message])
   *
   * Asserts that `value` is _not_ a string.
   *
   *     var teaOrder = 4;
   *     assert.isNotString(teaOrder, 'order placed');
   *
   * @name isNotString
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotString = function (val, msg) {
    new Assertion(val, msg, assert.isNotString, true).to.not.be.a('string');
  };

  /**
   * ### .isNumber(value, [message])
   *
   * Asserts that `value` is a number.
   *
   *     var cups = 2;
   *     assert.isNumber(cups, 'how many cups');
   *
   * @name isNumber
   * @param {Number} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNumber = function (val, msg) {
    new Assertion(val, msg, assert.isNumber, true).to.be.a('number');
  };

  /**
   * ### .isNotNumber(value, [message])
   *
   * Asserts that `value` is _not_ a number.
   *
   *     var cups = '2 cups please';
   *     assert.isNotNumber(cups, 'how many cups');
   *
   * @name isNotNumber
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotNumber = function (val, msg) {
    new Assertion(val, msg, assert.isNotNumber, true).to.not.be.a('number');
  };

   /**
   * ### .isFinite(value, [message])
   *
   * Asserts that `value` is a finite number. Unlike `.isNumber`, this will fail for `NaN` and `Infinity`.
   *
   *     var cups = 2;
   *     assert.isFinite(cups, 'how many cups');
   *
   *     assert.isFinite(NaN); // throws
   *
   * @name isFinite
   * @param {Number} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isFinite = function (val, msg) {
    new Assertion(val, msg, assert.isFinite, true).to.be.finite;
  };

  /**
   * ### .isBoolean(value, [message])
   *
   * Asserts that `value` is a boolean.
   *
   *     var teaReady = true
   *       , teaServed = false;
   *
   *     assert.isBoolean(teaReady, 'is the tea ready');
   *     assert.isBoolean(teaServed, 'has tea been served');
   *
   * @name isBoolean
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isBoolean = function (val, msg) {
    new Assertion(val, msg, assert.isBoolean, true).to.be.a('boolean');
  };

  /**
   * ### .isNotBoolean(value, [message])
   *
   * Asserts that `value` is _not_ a boolean.
   *
   *     var teaReady = 'yep'
   *       , teaServed = 'nope';
   *
   *     assert.isNotBoolean(teaReady, 'is the tea ready');
   *     assert.isNotBoolean(teaServed, 'has tea been served');
   *
   * @name isNotBoolean
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotBoolean = function (val, msg) {
    new Assertion(val, msg, assert.isNotBoolean, true).to.not.be.a('boolean');
  };

  /**
   * ### .typeOf(value, name, [message])
   *
   * Asserts that `value`'s type is `name`, as determined by
   * `Object.prototype.toString`.
   *
   *     assert.typeOf({ tea: 'chai' }, 'object', 'we have an object');
   *     assert.typeOf(['chai', 'jasmine'], 'array', 'we have an array');
   *     assert.typeOf('tea', 'string', 'we have a string');
   *     assert.typeOf(/tea/, 'regexp', 'we have a regular expression');
   *     assert.typeOf(null, 'null', 'we have a null');
   *     assert.typeOf(undefined, 'undefined', 'we have an undefined');
   *
   * @name typeOf
   * @param {Mixed} value
   * @param {String} name
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.typeOf = function (val, type, msg) {
    new Assertion(val, msg, assert.typeOf, true).to.be.a(type);
  };

  /**
   * ### .notTypeOf(value, name, [message])
   *
   * Asserts that `value`'s type is _not_ `name`, as determined by
   * `Object.prototype.toString`.
   *
   *     assert.notTypeOf('tea', 'number', 'strings are not numbers');
   *
   * @name notTypeOf
   * @param {Mixed} value
   * @param {String} typeof name
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notTypeOf = function (val, type, msg) {
    new Assertion(val, msg, assert.notTypeOf, true).to.not.be.a(type);
  };

  /**
   * ### .instanceOf(object, constructor, [message])
   *
   * Asserts that `value` is an instance of `constructor`.
   *
   *     var Tea = function (name) { this.name = name; }
   *       , chai = new Tea('chai');
   *
   *     assert.instanceOf(chai, Tea, 'chai is an instance of tea');
   *
   * @name instanceOf
   * @param {Object} object
   * @param {Constructor} constructor
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.instanceOf = function (val, type, msg) {
    new Assertion(val, msg, assert.instanceOf, true).to.be.instanceOf(type);
  };

  /**
   * ### .notInstanceOf(object, constructor, [message])
   *
   * Asserts `value` is not an instance of `constructor`.
   *
   *     var Tea = function (name) { this.name = name; }
   *       , chai = new String('chai');
   *
   *     assert.notInstanceOf(chai, Tea, 'chai is not an instance of tea');
   *
   * @name notInstanceOf
   * @param {Object} object
   * @param {Constructor} constructor
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notInstanceOf = function (val, type, msg) {
    new Assertion(val, msg, assert.notInstanceOf, true)
      .to.not.be.instanceOf(type);
  };

  /**
   * ### .include(haystack, needle, [message])
   *
   * Asserts that `haystack` includes `needle`. Can be used to assert the
   * inclusion of a value in an array, a substring in a string, or a subset of
   * properties in an object.
   *
   *     assert.include([1,2,3], 2, 'array contains value');
   *     assert.include('foobar', 'foo', 'string contains substring');
   *     assert.include({ foo: 'bar', hello: 'universe' }, { foo: 'bar' }, 'object contains property');
   *
   * Strict equality (===) is used. When asserting the inclusion of a value in
   * an array, the array is searched for an element that's strictly equal to the
   * given value. When asserting a subset of properties in an object, the object
   * is searched for the given property keys, checking that each one is present
   * and strictly equal to the given property value. For instance:
   *
   *     var obj1 = {a: 1}
   *       , obj2 = {b: 2};
   *     assert.include([obj1, obj2], obj1);
   *     assert.include({foo: obj1, bar: obj2}, {foo: obj1});
   *     assert.include({foo: obj1, bar: obj2}, {foo: obj1, bar: obj2});
   *
   * @name include
   * @param {Array|String} haystack
   * @param {Mixed} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.include = function (exp, inc, msg) {
    new Assertion(exp, msg, assert.include, true).include(inc);
  };

  /**
   * ### .notInclude(haystack, needle, [message])
   *
   * Asserts that `haystack` does not include `needle`. Can be used to assert
   * the absence of a value in an array, a substring in a string, or a subset of
   * properties in an object.
   *
   *     assert.notInclude([1,2,3], 4, "array doesn't contain value");
   *     assert.notInclude('foobar', 'baz', "string doesn't contain substring");
   *     assert.notInclude({ foo: 'bar', hello: 'universe' }, { foo: 'baz' }, 'object doesn't contain property');
   *
   * Strict equality (===) is used. When asserting the absence of a value in an
   * array, the array is searched to confirm the absence of an element that's
   * strictly equal to the given value. When asserting a subset of properties in
   * an object, the object is searched to confirm that at least one of the given
   * property keys is either not present or not strictly equal to the given
   * property value. For instance:
   *
   *     var obj1 = {a: 1}
   *       , obj2 = {b: 2};
   *     assert.notInclude([obj1, obj2], {a: 1});
   *     assert.notInclude({foo: obj1, bar: obj2}, {foo: {a: 1}});
   *     assert.notInclude({foo: obj1, bar: obj2}, {foo: obj1, bar: {b: 2}});
   *
   * @name notInclude
   * @param {Array|String} haystack
   * @param {Mixed} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notInclude = function (exp, inc, msg) {
    new Assertion(exp, msg, assert.notInclude, true).not.include(inc);
  };

  /**
   * ### .deepInclude(haystack, needle, [message])
   *
   * Asserts that `haystack` includes `needle`. Can be used to assert the
   * inclusion of a value in an array or a subset of properties in an object.
   * Deep equality is used.
   *
   *     var obj1 = {a: 1}
   *       , obj2 = {b: 2};
   *     assert.deepInclude([obj1, obj2], {a: 1});
   *     assert.deepInclude({foo: obj1, bar: obj2}, {foo: {a: 1}});
   *     assert.deepInclude({foo: obj1, bar: obj2}, {foo: {a: 1}, bar: {b: 2}});
   *
   * @name deepInclude
   * @param {Array|String} haystack
   * @param {Mixed} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.deepInclude = function (exp, inc, msg) {
    new Assertion(exp, msg, assert.deepInclude, true).deep.include(inc);
  };

  /**
   * ### .notDeepInclude(haystack, needle, [message])
   *
   * Asserts that `haystack` does not include `needle`. Can be used to assert
   * the absence of a value in an array or a subset of properties in an object.
   * Deep equality is used.
   *
   *     var obj1 = {a: 1}
   *       , obj2 = {b: 2};
   *     assert.notDeepInclude([obj1, obj2], {a: 9});
   *     assert.notDeepInclude({foo: obj1, bar: obj2}, {foo: {a: 9}});
   *     assert.notDeepInclude({foo: obj1, bar: obj2}, {foo: {a: 1}, bar: {b: 9}});
   *
   * @name notDeepInclude
   * @param {Array|String} haystack
   * @param {Mixed} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notDeepInclude = function (exp, inc, msg) {
    new Assertion(exp, msg, assert.notDeepInclude, true).not.deep.include(inc);
  };

  /**
   * ### .nestedInclude(haystack, needle, [message])
   *
   * Asserts that 'haystack' includes 'needle'.
   * Can be used to assert the inclusion of a subset of properties in an
   * object.
   * Enables the use of dot- and bracket-notation for referencing nested
   * properties.
   * '[]' and '.' in property names can be escaped using double backslashes.
   *
   *     assert.nestedInclude({'.a': {'b': 'x'}}, {'\\.a.[b]': 'x'});
   *     assert.nestedInclude({'a': {'[b]': 'x'}}, {'a.\\[b\\]': 'x'});
   *
   * @name nestedInclude
   * @param {Object} haystack
   * @param {Object} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.nestedInclude = function (exp, inc, msg) {
    new Assertion(exp, msg, assert.nestedInclude, true).nested.include(inc);
  };

  /**
   * ### .notNestedInclude(haystack, needle, [message])
   *
   * Asserts that 'haystack' does not include 'needle'.
   * Can be used to assert the absence of a subset of properties in an
   * object.
   * Enables the use of dot- and bracket-notation for referencing nested
   * properties.
   * '[]' and '.' in property names can be escaped using double backslashes.
   *
   *     assert.notNestedInclude({'.a': {'b': 'x'}}, {'\\.a.b': 'y'});
   *     assert.notNestedInclude({'a': {'[b]': 'x'}}, {'a.\\[b\\]': 'y'});
   *
   * @name notNestedInclude
   * @param {Object} haystack
   * @param {Object} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notNestedInclude = function (exp, inc, msg) {
    new Assertion(exp, msg, assert.notNestedInclude, true)
      .not.nested.include(inc);
  };

  /**
   * ### .deepNestedInclude(haystack, needle, [message])
   *
   * Asserts that 'haystack' includes 'needle'.
   * Can be used to assert the inclusion of a subset of properties in an
   * object while checking for deep equality.
   * Enables the use of dot- and bracket-notation for referencing nested
   * properties.
   * '[]' and '.' in property names can be escaped using double backslashes.
   *
   *     assert.deepNestedInclude({a: {b: [{x: 1}]}}, {'a.b[0]': {x: 1}});
   *     assert.deepNestedInclude({'.a': {'[b]': {x: 1}}}, {'\\.a.\\[b\\]': {x: 1}});
   *
   * @name deepNestedInclude
   * @param {Object} haystack
   * @param {Object} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.deepNestedInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert.deepNestedInclude, true)
      .deep.nested.include(inc);
  };

  /**
   * ### .notDeepNestedInclude(haystack, needle, [message])
   *
   * Asserts that 'haystack' does not include 'needle'.
   * Can be used to assert the absence of a subset of properties in an
   * object while checking for deep equality.
   * Enables the use of dot- and bracket-notation for referencing nested
   * properties.
   * '[]' and '.' in property names can be escaped using double backslashes.
   *
   *     assert.notDeepNestedInclude({a: {b: [{x: 1}]}}, {'a.b[0]': {y: 1}})
   *     assert.notDeepNestedInclude({'.a': {'[b]': {x: 1}}}, {'\\.a.\\[b\\]': {y: 2}});
   *
   * @name notDeepNestedInclude
   * @param {Object} haystack
   * @param {Object} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notDeepNestedInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert.notDeepNestedInclude, true)
      .not.deep.nested.include(inc);
  };

  /**
   * ### .ownInclude(haystack, needle, [message])
   *
   * Asserts that 'haystack' includes 'needle'.
   * Can be used to assert the inclusion of a subset of properties in an
   * object while ignoring inherited properties.
   *
   *     assert.ownInclude({ a: 1 }, { a: 1 });
   *
   * @name ownInclude
   * @param {Object} haystack
   * @param {Object} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.ownInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert.ownInclude, true).own.include(inc);
  };

  /**
   * ### .notOwnInclude(haystack, needle, [message])
   *
   * Asserts that 'haystack' includes 'needle'.
   * Can be used to assert the absence of a subset of properties in an
   * object while ignoring inherited properties.
   *
   *     Object.prototype.b = 2;
   *
   *     assert.notOwnInclude({ a: 1 }, { b: 2 });
   *
   * @name notOwnInclude
   * @param {Object} haystack
   * @param {Object} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notOwnInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert.notOwnInclude, true).not.own.include(inc);
  };

  /**
   * ### .deepOwnInclude(haystack, needle, [message])
   *
   * Asserts that 'haystack' includes 'needle'.
   * Can be used to assert the inclusion of a subset of properties in an
   * object while ignoring inherited properties and checking for deep equality.
   *
   *      assert.deepOwnInclude({a: {b: 2}}, {a: {b: 2}});
   *
   * @name deepOwnInclude
   * @param {Object} haystack
   * @param {Object} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.deepOwnInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert.deepOwnInclude, true)
      .deep.own.include(inc);
  };

   /**
   * ### .notDeepOwnInclude(haystack, needle, [message])
   *
   * Asserts that 'haystack' includes 'needle'.
   * Can be used to assert the absence of a subset of properties in an
   * object while ignoring inherited properties and checking for deep equality.
   *
   *      assert.notDeepOwnInclude({a: {b: 2}}, {a: {c: 3}});
   *
   * @name notDeepOwnInclude
   * @param {Object} haystack
   * @param {Object} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notDeepOwnInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert.notDeepOwnInclude, true)
      .not.deep.own.include(inc);
  };

  /**
   * ### .match(value, regexp, [message])
   *
   * Asserts that `value` matches the regular expression `regexp`.
   *
   *     assert.match('foobar', /^foo/, 'regexp matches');
   *
   * @name match
   * @param {Mixed} value
   * @param {RegExp} regexp
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.match = function (exp, re, msg) {
    new Assertion(exp, msg, assert.match, true).to.match(re);
  };

  /**
   * ### .notMatch(value, regexp, [message])
   *
   * Asserts that `value` does not match the regular expression `regexp`.
   *
   *     assert.notMatch('foobar', /^foo/, 'regexp does not match');
   *
   * @name notMatch
   * @param {Mixed} value
   * @param {RegExp} regexp
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notMatch = function (exp, re, msg) {
    new Assertion(exp, msg, assert.notMatch, true).to.not.match(re);
  };

  /**
   * ### .property(object, property, [message])
   *
   * Asserts that `object` has a direct or inherited property named by
   * `property`.
   *
   *     assert.property({ tea: { green: 'matcha' }}, 'tea');
   *     assert.property({ tea: { green: 'matcha' }}, 'toString');
   *
   * @name property
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.property = function (obj, prop, msg) {
    new Assertion(obj, msg, assert.property, true).to.have.property(prop);
  };

  /**
   * ### .notProperty(object, property, [message])
   *
   * Asserts that `object` does _not_ have a direct or inherited property named
   * by `property`.
   *
   *     assert.notProperty({ tea: { green: 'matcha' }}, 'coffee');
   *
   * @name notProperty
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notProperty = function (obj, prop, msg) {
    new Assertion(obj, msg, assert.notProperty, true)
      .to.not.have.property(prop);
  };

  /**
   * ### .propertyVal(object, property, value, [message])
   *
   * Asserts that `object` has a direct or inherited property named by
   * `property` with a value given by `value`. Uses a strict equality check
   * (===).
   *
   *     assert.propertyVal({ tea: 'is good' }, 'tea', 'is good');
   *
   * @name propertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.propertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg, assert.propertyVal, true)
      .to.have.property(prop, val);
  };

  /**
   * ### .notPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` does _not_ have a direct or inherited property named
   * by `property` with value given by `value`. Uses a strict equality check
   * (===).
   *
   *     assert.notPropertyVal({ tea: 'is good' }, 'tea', 'is bad');
   *     assert.notPropertyVal({ tea: 'is good' }, 'coffee', 'is good');
   *
   * @name notPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notPropertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg, assert.notPropertyVal, true)
      .to.not.have.property(prop, val);
  };

  /**
   * ### .deepPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` has a direct or inherited property named by
   * `property` with a value given by `value`. Uses a deep equality check.
   *
   *     assert.deepPropertyVal({ tea: { green: 'matcha' } }, 'tea', { green: 'matcha' });
   *
   * @name deepPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.deepPropertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg, assert.deepPropertyVal, true)
      .to.have.deep.property(prop, val);
  };

  /**
   * ### .notDeepPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` does _not_ have a direct or inherited property named
   * by `property` with value given by `value`. Uses a deep equality check.
   *
   *     assert.notDeepPropertyVal({ tea: { green: 'matcha' } }, 'tea', { black: 'matcha' });
   *     assert.notDeepPropertyVal({ tea: { green: 'matcha' } }, 'tea', { green: 'oolong' });
   *     assert.notDeepPropertyVal({ tea: { green: 'matcha' } }, 'coffee', { green: 'matcha' });
   *
   * @name notDeepPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notDeepPropertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg, assert.notDeepPropertyVal, true)
      .to.not.have.deep.property(prop, val);
  };

  /**
   * ### .ownProperty(object, property, [message])
   *
   * Asserts that `object` has a direct property named by `property`. Inherited
   * properties aren't checked.
   *
   *     assert.ownProperty({ tea: { green: 'matcha' }}, 'tea');
   *
   * @name ownProperty
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @api public
   */

  assert.ownProperty = function (obj, prop, msg) {
    new Assertion(obj, msg, assert.ownProperty, true)
      .to.have.own.property(prop);
  };

  /**
   * ### .notOwnProperty(object, property, [message])
   *
   * Asserts that `object` does _not_ have a direct property named by
   * `property`. Inherited properties aren't checked.
   *
   *     assert.notOwnProperty({ tea: { green: 'matcha' }}, 'coffee');
   *     assert.notOwnProperty({}, 'toString');
   *
   * @name notOwnProperty
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @api public
   */

  assert.notOwnProperty = function (obj, prop, msg) {
    new Assertion(obj, msg, assert.notOwnProperty, true)
      .to.not.have.own.property(prop);
  };

  /**
   * ### .ownPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` has a direct property named by `property` and a value
   * equal to the provided `value`. Uses a strict equality check (===).
   * Inherited properties aren't checked.
   *
   *     assert.ownPropertyVal({ coffee: 'is good'}, 'coffee', 'is good');
   *
   * @name ownPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.ownPropertyVal = function (obj, prop, value, msg) {
    new Assertion(obj, msg, assert.ownPropertyVal, true)
      .to.have.own.property(prop, value);
  };

  /**
   * ### .notOwnPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` does _not_ have a direct property named by `property`
   * with a value equal to the provided `value`. Uses a strict equality check
   * (===). Inherited properties aren't checked.
   *
   *     assert.notOwnPropertyVal({ tea: 'is better'}, 'tea', 'is worse');
   *     assert.notOwnPropertyVal({}, 'toString', Object.prototype.toString);
   *
   * @name notOwnPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.notOwnPropertyVal = function (obj, prop, value, msg) {
    new Assertion(obj, msg, assert.notOwnPropertyVal, true)
      .to.not.have.own.property(prop, value);
  };

  /**
   * ### .deepOwnPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` has a direct property named by `property` and a value
   * equal to the provided `value`. Uses a deep equality check. Inherited
   * properties aren't checked.
   *
   *     assert.deepOwnPropertyVal({ tea: { green: 'matcha' } }, 'tea', { green: 'matcha' });
   *
   * @name deepOwnPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.deepOwnPropertyVal = function (obj, prop, value, msg) {
    new Assertion(obj, msg, assert.deepOwnPropertyVal, true)
      .to.have.deep.own.property(prop, value);
  };

  /**
   * ### .notDeepOwnPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` does _not_ have a direct property named by `property`
   * with a value equal to the provided `value`. Uses a deep equality check.
   * Inherited properties aren't checked.
   *
   *     assert.notDeepOwnPropertyVal({ tea: { green: 'matcha' } }, 'tea', { black: 'matcha' });
   *     assert.notDeepOwnPropertyVal({ tea: { green: 'matcha' } }, 'tea', { green: 'oolong' });
   *     assert.notDeepOwnPropertyVal({ tea: { green: 'matcha' } }, 'coffee', { green: 'matcha' });
   *     assert.notDeepOwnPropertyVal({}, 'toString', Object.prototype.toString);
   *
   * @name notDeepOwnPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.notDeepOwnPropertyVal = function (obj, prop, value, msg) {
    new Assertion(obj, msg, assert.notDeepOwnPropertyVal, true)
      .to.not.have.deep.own.property(prop, value);
  };

  /**
   * ### .nestedProperty(object, property, [message])
   *
   * Asserts that `object` has a direct or inherited property named by
   * `property`, which can be a string using dot- and bracket-notation for
   * nested reference.
   *
   *     assert.nestedProperty({ tea: { green: 'matcha' }}, 'tea.green');
   *
   * @name nestedProperty
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.nestedProperty = function (obj, prop, msg) {
    new Assertion(obj, msg, assert.nestedProperty, true)
      .to.have.nested.property(prop);
  };

  /**
   * ### .notNestedProperty(object, property, [message])
   *
   * Asserts that `object` does _not_ have a property named by `property`, which
   * can be a string using dot- and bracket-notation for nested reference. The
   * property cannot exist on the object nor anywhere in its prototype chain.
   *
   *     assert.notNestedProperty({ tea: { green: 'matcha' }}, 'tea.oolong');
   *
   * @name notNestedProperty
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notNestedProperty = function (obj, prop, msg) {
    new Assertion(obj, msg, assert.notNestedProperty, true)
      .to.not.have.nested.property(prop);
  };

  /**
   * ### .nestedPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` has a property named by `property` with value given
   * by `value`. `property` can use dot- and bracket-notation for nested
   * reference. Uses a strict equality check (===).
   *
   *     assert.nestedPropertyVal({ tea: { green: 'matcha' }}, 'tea.green', 'matcha');
   *
   * @name nestedPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.nestedPropertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg, assert.nestedPropertyVal, true)
      .to.have.nested.property(prop, val);
  };

  /**
   * ### .notNestedPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` does _not_ have a property named by `property` with
   * value given by `value`. `property` can use dot- and bracket-notation for
   * nested reference. Uses a strict equality check (===).
   *
   *     assert.notNestedPropertyVal({ tea: { green: 'matcha' }}, 'tea.green', 'konacha');
   *     assert.notNestedPropertyVal({ tea: { green: 'matcha' }}, 'coffee.green', 'matcha');
   *
   * @name notNestedPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notNestedPropertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg, assert.notNestedPropertyVal, true)
      .to.not.have.nested.property(prop, val);
  };

  /**
   * ### .deepNestedPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` has a property named by `property` with a value given
   * by `value`. `property` can use dot- and bracket-notation for nested
   * reference. Uses a deep equality check.
   *
   *     assert.deepNestedPropertyVal({ tea: { green: { matcha: 'yum' } } }, 'tea.green', { matcha: 'yum' });
   *
   * @name deepNestedPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.deepNestedPropertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg, assert.deepNestedPropertyVal, true)
      .to.have.deep.nested.property(prop, val);
  };

  /**
   * ### .notDeepNestedPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` does _not_ have a property named by `property` with
   * value given by `value`. `property` can use dot- and bracket-notation for
   * nested reference. Uses a deep equality check.
   *
   *     assert.notDeepNestedPropertyVal({ tea: { green: { matcha: 'yum' } } }, 'tea.green', { oolong: 'yum' });
   *     assert.notDeepNestedPropertyVal({ tea: { green: { matcha: 'yum' } } }, 'tea.green', { matcha: 'yuck' });
   *     assert.notDeepNestedPropertyVal({ tea: { green: { matcha: 'yum' } } }, 'tea.black', { matcha: 'yum' });
   *
   * @name notDeepNestedPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notDeepNestedPropertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg, assert.notDeepNestedPropertyVal, true)
      .to.not.have.deep.nested.property(prop, val);
  }

  /**
   * ### .lengthOf(object, length, [message])
   *
   * Asserts that `object` has a `length` or `size` with the expected value.
   *
   *     assert.lengthOf([1,2,3], 3, 'array has length of 3');
   *     assert.lengthOf('foobar', 6, 'string has length of 6');
   *     assert.lengthOf(new Set([1,2,3]), 3, 'set has size of 3');
   *     assert.lengthOf(new Map([['a',1],['b',2],['c',3]]), 3, 'map has size of 3');
   *
   * @name lengthOf
   * @param {Mixed} object
   * @param {Number} length
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.lengthOf = function (exp, len, msg) {
    new Assertion(exp, msg, assert.lengthOf, true).to.have.lengthOf(len);
  };

  /**
   * ### .hasAnyKeys(object, [keys], [message])
   *
   * Asserts that `object` has at least one of the `keys` provided.
   * You can also provide a single object instead of a `keys` array and its keys
   * will be used as the expected set of keys.
   *
   *     assert.hasAnyKeys({foo: 1, bar: 2, baz: 3}, ['foo', 'iDontExist', 'baz']);
   *     assert.hasAnyKeys({foo: 1, bar: 2, baz: 3}, {foo: 30, iDontExist: 99, baz: 1337});
   *     assert.hasAnyKeys(new Map([[{foo: 1}, 'bar'], ['key', 'value']]), [{foo: 1}, 'key']);
   *     assert.hasAnyKeys(new Set([{foo: 'bar'}, 'anotherKey']), [{foo: 'bar'}, 'anotherKey']);
   *
   * @name hasAnyKeys
   * @param {Mixed} object
   * @param {Array|Object} keys
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.hasAnyKeys = function (obj, keys, msg) {
    new Assertion(obj, msg, assert.hasAnyKeys, true).to.have.any.keys(keys);
  }

  /**
   * ### .hasAllKeys(object, [keys], [message])
   *
   * Asserts that `object` has all and only all of the `keys` provided.
   * You can also provide a single object instead of a `keys` array and its keys
   * will be used as the expected set of keys.
   *
   *     assert.hasAllKeys({foo: 1, bar: 2, baz: 3}, ['foo', 'bar', 'baz']);
   *     assert.hasAllKeys({foo: 1, bar: 2, baz: 3}, {foo: 30, bar: 99, baz: 1337]);
   *     assert.hasAllKeys(new Map([[{foo: 1}, 'bar'], ['key', 'value']]), [{foo: 1}, 'key']);
   *     assert.hasAllKeys(new Set([{foo: 'bar'}, 'anotherKey'], [{foo: 'bar'}, 'anotherKey']);
   *
   * @name hasAllKeys
   * @param {Mixed} object
   * @param {String[]} keys
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.hasAllKeys = function (obj, keys, msg) {
    new Assertion(obj, msg, assert.hasAllKeys, true).to.have.all.keys(keys);
  }

  /**
   * ### .containsAllKeys(object, [keys], [message])
   *
   * Asserts that `object` has all of the `keys` provided but may have more keys not listed.
   * You can also provide a single object instead of a `keys` array and its keys
   * will be used as the expected set of keys.
   *
   *     assert.containsAllKeys({foo: 1, bar: 2, baz: 3}, ['foo', 'baz']);
   *     assert.containsAllKeys({foo: 1, bar: 2, baz: 3}, ['foo', 'bar', 'baz']);
   *     assert.containsAllKeys({foo: 1, bar: 2, baz: 3}, {foo: 30, baz: 1337});
   *     assert.containsAllKeys({foo: 1, bar: 2, baz: 3}, {foo: 30, bar: 99, baz: 1337});
   *     assert.containsAllKeys(new Map([[{foo: 1}, 'bar'], ['key', 'value']]), [{foo: 1}]);
   *     assert.containsAllKeys(new Map([[{foo: 1}, 'bar'], ['key', 'value']]), [{foo: 1}, 'key']);
   *     assert.containsAllKeys(new Set([{foo: 'bar'}, 'anotherKey'], [{foo: 'bar'}]);
   *     assert.containsAllKeys(new Set([{foo: 'bar'}, 'anotherKey'], [{foo: 'bar'}, 'anotherKey']);
   *
   * @name containsAllKeys
   * @param {Mixed} object
   * @param {String[]} keys
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.containsAllKeys = function (obj, keys, msg) {
    new Assertion(obj, msg, assert.containsAllKeys, true)
      .to.contain.all.keys(keys);
  }

  /**
   * ### .doesNotHaveAnyKeys(object, [keys], [message])
   *
   * Asserts that `object` has none of the `keys` provided.
   * You can also provide a single object instead of a `keys` array and its keys
   * will be used as the expected set of keys.
   *
   *     assert.doesNotHaveAnyKeys({foo: 1, bar: 2, baz: 3}, ['one', 'two', 'example']);
   *     assert.doesNotHaveAnyKeys({foo: 1, bar: 2, baz: 3}, {one: 1, two: 2, example: 'foo'});
   *     assert.doesNotHaveAnyKeys(new Map([[{foo: 1}, 'bar'], ['key', 'value']]), [{one: 'two'}, 'example']);
   *     assert.doesNotHaveAnyKeys(new Set([{foo: 'bar'}, 'anotherKey'], [{one: 'two'}, 'example']);
   *
   * @name doesNotHaveAnyKeys
   * @param {Mixed} object
   * @param {String[]} keys
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.doesNotHaveAnyKeys = function (obj, keys, msg) {
    new Assertion(obj, msg, assert.doesNotHaveAnyKeys, true)
      .to.not.have.any.keys(keys);
  }

  /**
   * ### .doesNotHaveAllKeys(object, [keys], [message])
   *
   * Asserts that `object` does not have at least one of the `keys` provided.
   * You can also provide a single object instead of a `keys` array and its keys
   * will be used as the expected set of keys.
   *
   *     assert.doesNotHaveAllKeys({foo: 1, bar: 2, baz: 3}, ['one', 'two', 'example']);
   *     assert.doesNotHaveAllKeys({foo: 1, bar: 2, baz: 3}, {one: 1, two: 2, example: 'foo'});
   *     assert.doesNotHaveAllKeys(new Map([[{foo: 1}, 'bar'], ['key', 'value']]), [{one: 'two'}, 'example']);
   *     assert.doesNotHaveAllKeys(new Set([{foo: 'bar'}, 'anotherKey'], [{one: 'two'}, 'example']);
   *
   * @name doesNotHaveAllKeys
   * @param {Mixed} object
   * @param {String[]} keys
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.doesNotHaveAllKeys = function (obj, keys, msg) {
    new Assertion(obj, msg, assert.doesNotHaveAllKeys, true)
      .to.not.have.all.keys(keys);
  }

  /**
   * ### .hasAnyDeepKeys(object, [keys], [message])
   *
   * Asserts that `object` has at least one of the `keys` provided.
   * Since Sets and Maps can have objects as keys you can use this assertion to perform
   * a deep comparison.
   * You can also provide a single object instead of a `keys` array and its keys
   * will be used as the expected set of keys.
   *
   *     assert.hasAnyDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [1, 2]]), {one: 'one'});
   *     assert.hasAnyDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [1, 2]]), [{one: 'one'}, {two: 'two'}]);
   *     assert.hasAnyDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [{two: 'two'}, 'valueTwo']]), [{one: 'one'}, {two: 'two'}]);
   *     assert.hasAnyDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), {one: 'one'});
   *     assert.hasAnyDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), [{one: 'one'}, {three: 'three'}]);
   *     assert.hasAnyDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), [{one: 'one'}, {two: 'two'}]);
   *
   * @name doesNotHaveAllKeys
   * @param {Mixed} object
   * @param {Array|Object} keys
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.hasAnyDeepKeys = function (obj, keys, msg) {
    new Assertion(obj, msg, assert.hasAnyDeepKeys, true)
      .to.have.any.deep.keys(keys);
  }

 /**
   * ### .hasAllDeepKeys(object, [keys], [message])
   *
   * Asserts that `object` has all and only all of the `keys` provided.
   * Since Sets and Maps can have objects as keys you can use this assertion to perform
   * a deep comparison.
   * You can also provide a single object instead of a `keys` array and its keys
   * will be used as the expected set of keys.
   *
   *     assert.hasAllDeepKeys(new Map([[{one: 'one'}, 'valueOne']]), {one: 'one'});
   *     assert.hasAllDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [{two: 'two'}, 'valueTwo']]), [{one: 'one'}, {two: 'two'}]);
   *     assert.hasAllDeepKeys(new Set([{one: 'one'}]), {one: 'one'});
   *     assert.hasAllDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), [{one: 'one'}, {two: 'two'}]);
   *
   * @name hasAllDeepKeys
   * @param {Mixed} object
   * @param {Array|Object} keys
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.hasAllDeepKeys = function (obj, keys, msg) {
    new Assertion(obj, msg, assert.hasAllDeepKeys, true)
      .to.have.all.deep.keys(keys);
  }

 /**
   * ### .containsAllDeepKeys(object, [keys], [message])
   *
   * Asserts that `object` contains all of the `keys` provided.
   * Since Sets and Maps can have objects as keys you can use this assertion to perform
   * a deep comparison.
   * You can also provide a single object instead of a `keys` array and its keys
   * will be used as the expected set of keys.
   *
   *     assert.containsAllDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [1, 2]]), {one: 'one'});
   *     assert.containsAllDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [{two: 'two'}, 'valueTwo']]), [{one: 'one'}, {two: 'two'}]);
   *     assert.containsAllDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), {one: 'one'});
   *     assert.containsAllDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), [{one: 'one'}, {two: 'two'}]);
   *
   * @name containsAllDeepKeys
   * @param {Mixed} object
   * @param {Array|Object} keys
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.containsAllDeepKeys = function (obj, keys, msg) {
    new Assertion(obj, msg, assert.containsAllDeepKeys, true)
      .to.contain.all.deep.keys(keys);
  }

 /**
   * ### .doesNotHaveAnyDeepKeys(object, [keys], [message])
   *
   * Asserts that `object` has none of the `keys` provided.
   * Since Sets and Maps can have objects as keys you can use this assertion to perform
   * a deep comparison.
   * You can also provide a single object instead of a `keys` array and its keys
   * will be used as the expected set of keys.
   *
   *     assert.doesNotHaveAnyDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [1, 2]]), {thisDoesNot: 'exist'});
   *     assert.doesNotHaveAnyDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [{two: 'two'}, 'valueTwo']]), [{twenty: 'twenty'}, {fifty: 'fifty'}]);
   *     assert.doesNotHaveAnyDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), {twenty: 'twenty'});
   *     assert.doesNotHaveAnyDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), [{twenty: 'twenty'}, {fifty: 'fifty'}]);
   *
   * @name doesNotHaveAnyDeepKeys
   * @param {Mixed} object
   * @param {Array|Object} keys
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.doesNotHaveAnyDeepKeys = function (obj, keys, msg) {
    new Assertion(obj, msg, assert.doesNotHaveAnyDeepKeys, true)
      .to.not.have.any.deep.keys(keys);
  }

 /**
   * ### .doesNotHaveAllDeepKeys(object, [keys], [message])
   *
   * Asserts that `object` does not have at least one of the `keys` provided.
   * Since Sets and Maps can have objects as keys you can use this assertion to perform
   * a deep comparison.
   * You can also provide a single object instead of a `keys` array and its keys
   * will be used as the expected set of keys.
   *
   *     assert.doesNotHaveAllDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [1, 2]]), {thisDoesNot: 'exist'});
   *     assert.doesNotHaveAllDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [{two: 'two'}, 'valueTwo']]), [{twenty: 'twenty'}, {one: 'one'}]);
   *     assert.doesNotHaveAllDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), {twenty: 'twenty'});
   *     assert.doesNotHaveAllDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), [{one: 'one'}, {fifty: 'fifty'}]);
   *
   * @name doesNotHaveAllDeepKeys
   * @param {Mixed} object
   * @param {Array|Object} keys
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.doesNotHaveAllDeepKeys = function (obj, keys, msg) {
    new Assertion(obj, msg, assert.doesNotHaveAllDeepKeys, true)
      .to.not.have.all.deep.keys(keys);
  }

 /**
   * ### .throws(fn, [errorLike/string/regexp], [string/regexp], [message])
   *
   * If `errorLike` is an `Error` constructor, asserts that `fn` will throw an error that is an
   * instance of `errorLike`.
   * If `errorLike` is an `Error` instance, asserts that the error thrown is the same
   * instance as `errorLike`.
   * If `errMsgMatcher` is provided, it also asserts that the error thrown will have a
   * message matching `errMsgMatcher`.
   *
   *     assert.throws(fn, 'Error thrown must have this msg');
   *     assert.throws(fn, /Error thrown must have a msg that matches this/);
   *     assert.throws(fn, ReferenceError);
   *     assert.throws(fn, errorInstance);
   *     assert.throws(fn, ReferenceError, 'Error thrown must be a ReferenceError and have this msg');
   *     assert.throws(fn, errorInstance, 'Error thrown must be the same errorInstance and have this msg');
   *     assert.throws(fn, ReferenceError, /Error thrown must be a ReferenceError and match this/);
   *     assert.throws(fn, errorInstance, /Error thrown must be the same errorInstance and match this/);
   *
   * @name throws
   * @alias throw
   * @alias Throw
   * @param {Function} fn
   * @param {ErrorConstructor|Error} errorLike
   * @param {RegExp|String} errMsgMatcher
   * @param {String} message
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
   * @namespace Assert
   * @api public
   */

  assert.throws = function (fn, errorLike, errMsgMatcher, msg) {
    if ('string' === typeof errorLike || errorLike instanceof RegExp) {
      errMsgMatcher = errorLike;
      errorLike = null;
    }

    var assertErr = new Assertion(fn, msg, assert.throws, true)
      .to.throw(errorLike, errMsgMatcher);
    return flag(assertErr, 'object');
  };

  /**
   * ### .doesNotThrow(fn, [errorLike/string/regexp], [string/regexp], [message])
   *
   * If `errorLike` is an `Error` constructor, asserts that `fn` will _not_ throw an error that is an
   * instance of `errorLike`.
   * If `errorLike` is an `Error` instance, asserts that the error thrown is _not_ the same
   * instance as `errorLike`.
   * If `errMsgMatcher` is provided, it also asserts that the error thrown will _not_ have a
   * message matching `errMsgMatcher`.
   *
   *     assert.doesNotThrow(fn, 'Any Error thrown must not have this message');
   *     assert.doesNotThrow(fn, /Any Error thrown must not match this/);
   *     assert.doesNotThrow(fn, Error);
   *     assert.doesNotThrow(fn, errorInstance);
   *     assert.doesNotThrow(fn, Error, 'Error must not have this message');
   *     assert.doesNotThrow(fn, errorInstance, 'Error must not have this message');
   *     assert.doesNotThrow(fn, Error, /Error must not match this/);
   *     assert.doesNotThrow(fn, errorInstance, /Error must not match this/);
   *
   * @name doesNotThrow
   * @param {Function} fn
   * @param {ErrorConstructor} errorLike
   * @param {RegExp|String} errMsgMatcher
   * @param {String} message
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
   * @namespace Assert
   * @api public
   */

  assert.doesNotThrow = function (fn, errorLike, errMsgMatcher, msg) {
    if ('string' === typeof errorLike || errorLike instanceof RegExp) {
      errMsgMatcher = errorLike;
      errorLike = null;
    }

    new Assertion(fn, msg, assert.doesNotThrow, true)
      .to.not.throw(errorLike, errMsgMatcher);
  };

  /**
   * ### .operator(val1, operator, val2, [message])
   *
   * Compares two values using `operator`.
   *
   *     assert.operator(1, '<', 2, 'everything is ok');
   *     assert.operator(1, '>', 2, 'this will fail');
   *
   * @name operator
   * @param {Mixed} val1
   * @param {String} operator
   * @param {Mixed} val2
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.operator = function (val, operator, val2, msg) {
    var ok;
    switch(operator) {
      case '==':
        ok = val == val2;
        break;
      case '===':
        ok = val === val2;
        break;
      case '>':
        ok = val > val2;
        break;
      case '>=':
        ok = val >= val2;
        break;
      case '<':
        ok = val < val2;
        break;
      case '<=':
        ok = val <= val2;
        break;
      case '!=':
        ok = val != val2;
        break;
      case '!==':
        ok = val !== val2;
        break;
      default:
        msg = msg ? msg + ': ' : msg;
        throw new chai.AssertionError(
          msg + 'Invalid operator "' + operator + '"',
          undefined,
          assert.operator
        );
    }
    var test = new Assertion(ok, msg, assert.operator, true);
    test.assert(
        true === flag(test, 'object')
      , 'expected ' + util.inspect(val) + ' to be ' + operator + ' ' + util.inspect(val2)
      , 'expected ' + util.inspect(val) + ' to not be ' + operator + ' ' + util.inspect(val2) );
  };

  /**
   * ### .closeTo(actual, expected, delta, [message])
   *
   * Asserts that the target is equal `expected`, to within a +/- `delta` range.
   *
   *     assert.closeTo(1.5, 1, 0.5, 'numbers are close');
   *
   * @name closeTo
   * @param {Number} actual
   * @param {Number} expected
   * @param {Number} delta
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.closeTo = function (act, exp, delta, msg) {
    new Assertion(act, msg, assert.closeTo, true).to.be.closeTo(exp, delta);
  };

  /**
   * ### .approximately(actual, expected, delta, [message])
   *
   * Asserts that the target is equal `expected`, to within a +/- `delta` range.
   *
   *     assert.approximately(1.5, 1, 0.5, 'numbers are close');
   *
   * @name approximately
   * @param {Number} actual
   * @param {Number} expected
   * @param {Number} delta
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.approximately = function (act, exp, delta, msg) {
    new Assertion(act, msg, assert.approximately, true)
      .to.be.approximately(exp, delta);
  };

  /**
   * ### .sameMembers(set1, set2, [message])
   *
   * Asserts that `set1` and `set2` have the same members in any order. Uses a
   * strict equality check (===).
   *
   *     assert.sameMembers([ 1, 2, 3 ], [ 2, 1, 3 ], 'same members');
   *
   * @name sameMembers
   * @param {Array} set1
   * @param {Array} set2
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.sameMembers = function (set1, set2, msg) {
    new Assertion(set1, msg, assert.sameMembers, true)
      .to.have.same.members(set2);
  }

  /**
   * ### .notSameMembers(set1, set2, [message])
   *
   * Asserts that `set1` and `set2` don't have the same members in any order.
   * Uses a strict equality check (===).
   *
   *     assert.notSameMembers([ 1, 2, 3 ], [ 5, 1, 3 ], 'not same members');
   *
   * @name notSameMembers
   * @param {Array} set1
   * @param {Array} set2
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notSameMembers = function (set1, set2, msg) {
    new Assertion(set1, msg, assert.notSameMembers, true)
      .to.not.have.same.members(set2);
  }

  /**
   * ### .sameDeepMembers(set1, set2, [message])
   *
   * Asserts that `set1` and `set2` have the same members in any order. Uses a
   * deep equality check.
   *
   *     assert.sameDeepMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [{ b: 2 }, { a: 1 }, { c: 3 }], 'same deep members');
   *
   * @name sameDeepMembers
   * @param {Array} set1
   * @param {Array} set2
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.sameDeepMembers = function (set1, set2, msg) {
    new Assertion(set1, msg, assert.sameDeepMembers, true)
      .to.have.same.deep.members(set2);
  }

  /**
   * ### .notSameDeepMembers(set1, set2, [message])
   *
   * Asserts that `set1` and `set2` don't have the same members in any order.
   * Uses a deep equality check.
   *
   *     assert.notSameDeepMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [{ b: 2 }, { a: 1 }, { f: 5 }], 'not same deep members');
   *
   * @name notSameDeepMembers
   * @param {Array} set1
   * @param {Array} set2
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notSameDeepMembers = function (set1, set2, msg) {
    new Assertion(set1, msg, assert.notSameDeepMembers, true)
      .to.not.have.same.deep.members(set2);
  }

  /**
   * ### .sameOrderedMembers(set1, set2, [message])
   *
   * Asserts that `set1` and `set2` have the same members in the same order.
   * Uses a strict equality check (===).
   *
   *     assert.sameOrderedMembers([ 1, 2, 3 ], [ 1, 2, 3 ], 'same ordered members');
   *
   * @name sameOrderedMembers
   * @param {Array} set1
   * @param {Array} set2
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.sameOrderedMembers = function (set1, set2, msg) {
    new Assertion(set1, msg, assert.sameOrderedMembers, true)
      .to.have.same.ordered.members(set2);
  }

  /**
   * ### .notSameOrderedMembers(set1, set2, [message])
   *
   * Asserts that `set1` and `set2` don't have the same members in the same
   * order. Uses a strict equality check (===).
   *
   *     assert.notSameOrderedMembers([ 1, 2, 3 ], [ 2, 1, 3 ], 'not same ordered members');
   *
   * @name notSameOrderedMembers
   * @param {Array} set1
   * @param {Array} set2
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notSameOrderedMembers = function (set1, set2, msg) {
    new Assertion(set1, msg, assert.notSameOrderedMembers, true)
      .to.not.have.same.ordered.members(set2);
  }

  /**
   * ### .sameDeepOrderedMembers(set1, set2, [message])
   *
   * Asserts that `set1` and `set2` have the same members in the same order.
   * Uses a deep equality check.
   *
   * assert.sameDeepOrderedMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { a: 1 }, { b: 2 }, { c: 3 } ], 'same deep ordered members');
   *
   * @name sameDeepOrderedMembers
   * @param {Array} set1
   * @param {Array} set2
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.sameDeepOrderedMembers = function (set1, set2, msg) {
    new Assertion(set1, msg, assert.sameDeepOrderedMembers, true)
      .to.have.same.deep.ordered.members(set2);
  }

  /**
   * ### .notSameDeepOrderedMembers(set1, set2, [message])
   *
   * Asserts that `set1` and `set2` don't have the same members in the same
   * order. Uses a deep equality check.
   *
   * assert.notSameDeepOrderedMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { a: 1 }, { b: 2 }, { z: 5 } ], 'not same deep ordered members');
   * assert.notSameDeepOrderedMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { b: 2 }, { a: 1 }, { c: 3 } ], 'not same deep ordered members');
   *
   * @name notSameDeepOrderedMembers
   * @param {Array} set1
   * @param {Array} set2
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notSameDeepOrderedMembers = function (set1, set2, msg) {
    new Assertion(set1, msg, assert.notSameDeepOrderedMembers, true)
      .to.not.have.same.deep.ordered.members(set2);
  }

  /**
   * ### .includeMembers(superset, subset, [message])
   *
   * Asserts that `subset` is included in `superset` in any order. Uses a
   * strict equality check (===). Duplicates are ignored.
   *
   *     assert.includeMembers([ 1, 2, 3 ], [ 2, 1, 2 ], 'include members');
   *
   * @name includeMembers
   * @param {Array} superset
   * @param {Array} subset
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.includeMembers = function (superset, subset, msg) {
    new Assertion(superset, msg, assert.includeMembers, true)
      .to.include.members(subset);
  }

  /**
   * ### .notIncludeMembers(superset, subset, [message])
   *
   * Asserts that `subset` isn't included in `superset` in any order. Uses a
   * strict equality check (===). Duplicates are ignored.
   *
   *     assert.notIncludeMembers([ 1, 2, 3 ], [ 5, 1 ], 'not include members');
   *
   * @name notIncludeMembers
   * @param {Array} superset
   * @param {Array} subset
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notIncludeMembers = function (superset, subset, msg) {
    new Assertion(superset, msg, assert.notIncludeMembers, true)
      .to.not.include.members(subset);
  }

  /**
   * ### .includeDeepMembers(superset, subset, [message])
   *
   * Asserts that `subset` is included in `superset` in any order. Uses a deep
   * equality check. Duplicates are ignored.
   *
   *     assert.includeDeepMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { b: 2 }, { a: 1 }, { b: 2 } ], 'include deep members');
   *
   * @name includeDeepMembers
   * @param {Array} superset
   * @param {Array} subset
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.includeDeepMembers = function (superset, subset, msg) {
    new Assertion(superset, msg, assert.includeDeepMembers, true)
      .to.include.deep.members(subset);
  }

  /**
   * ### .notIncludeDeepMembers(superset, subset, [message])
   *
   * Asserts that `subset` isn't included in `superset` in any order. Uses a
   * deep equality check. Duplicates are ignored.
   *
   *     assert.notIncludeDeepMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { b: 2 }, { f: 5 } ], 'not include deep members');
   *
   * @name notIncludeDeepMembers
   * @param {Array} superset
   * @param {Array} subset
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notIncludeDeepMembers = function (superset, subset, msg) {
    new Assertion(superset, msg, assert.notIncludeDeepMembers, true)
      .to.not.include.deep.members(subset);
  }

  /**
   * ### .includeOrderedMembers(superset, subset, [message])
   *
   * Asserts that `subset` is included in `superset` in the same order
   * beginning with the first element in `superset`. Uses a strict equality
   * check (===).
   *
   *     assert.includeOrderedMembers([ 1, 2, 3 ], [ 1, 2 ], 'include ordered members');
   *
   * @name includeOrderedMembers
   * @param {Array} superset
   * @param {Array} subset
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.includeOrderedMembers = function (superset, subset, msg) {
    new Assertion(superset, msg, assert.includeOrderedMembers, true)
      .to.include.ordered.members(subset);
  }

  /**
   * ### .notIncludeOrderedMembers(superset, subset, [message])
   *
   * Asserts that `subset` isn't included in `superset` in the same order
   * beginning with the first element in `superset`. Uses a strict equality
   * check (===).
   *
   *     assert.notIncludeOrderedMembers([ 1, 2, 3 ], [ 2, 1 ], 'not include ordered members');
   *     assert.notIncludeOrderedMembers([ 1, 2, 3 ], [ 2, 3 ], 'not include ordered members');
   *
   * @name notIncludeOrderedMembers
   * @param {Array} superset
   * @param {Array} subset
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notIncludeOrderedMembers = function (superset, subset, msg) {
    new Assertion(superset, msg, assert.notIncludeOrderedMembers, true)
      .to.not.include.ordered.members(subset);
  }

  /**
   * ### .includeDeepOrderedMembers(superset, subset, [message])
   *
   * Asserts that `subset` is included in `superset` in the same order
   * beginning with the first element in `superset`. Uses a deep equality
   * check.
   *
   *     assert.includeDeepOrderedMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { a: 1 }, { b: 2 } ], 'include deep ordered members');
   *
   * @name includeDeepOrderedMembers
   * @param {Array} superset
   * @param {Array} subset
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.includeDeepOrderedMembers = function (superset, subset, msg) {
    new Assertion(superset, msg, assert.includeDeepOrderedMembers, true)
      .to.include.deep.ordered.members(subset);
  }

  /**
   * ### .notIncludeDeepOrderedMembers(superset, subset, [message])
   *
   * Asserts that `subset` isn't included in `superset` in the same order
   * beginning with the first element in `superset`. Uses a deep equality
   * check.
   *
   *     assert.notIncludeDeepOrderedMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { a: 1 }, { f: 5 } ], 'not include deep ordered members');
   *     assert.notIncludeDeepOrderedMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { b: 2 }, { a: 1 } ], 'not include deep ordered members');
   *     assert.notIncludeDeepOrderedMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { b: 2 }, { c: 3 } ], 'not include deep ordered members');
   *
   * @name notIncludeDeepOrderedMembers
   * @param {Array} superset
   * @param {Array} subset
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notIncludeDeepOrderedMembers = function (superset, subset, msg) {
    new Assertion(superset, msg, assert.notIncludeDeepOrderedMembers, true)
      .to.not.include.deep.ordered.members(subset);
  }

  /**
   * ### .oneOf(inList, list, [message])
   *
   * Asserts that non-object, non-array value `inList` appears in the flat array `list`.
   *
   *     assert.oneOf(1, [ 2, 1 ], 'Not found in list');
   *
   * @name oneOf
   * @param {*} inList
   * @param {Array<*>} list
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.oneOf = function (inList, list, msg) {
    new Assertion(inList, msg, assert.oneOf, true).to.be.oneOf(list);
  }

  /**
   * ### .changes(function, object, property, [message])
   *
   * Asserts that a function changes the value of a property.
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 22 };
   *     assert.changes(fn, obj, 'val');
   *
   * @name changes
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.changes = function (fn, obj, prop, msg) {
    if (arguments.length === 3 && typeof obj === 'function') {
      msg = prop;
      prop = null;
    }

    new Assertion(fn, msg, assert.changes, true).to.change(obj, prop);
  }

   /**
   * ### .changesBy(function, object, property, delta, [message])
   *
   * Asserts that a function changes the value of a property by an amount (delta).
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val += 2 };
   *     assert.changesBy(fn, obj, 'val', 2);
   *
   * @name changesBy
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {Number} change amount (delta)
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.changesBy = function (fn, obj, prop, delta, msg) {
    if (arguments.length === 4 && typeof obj === 'function') {
      var tmpMsg = delta;
      delta = prop;
      msg = tmpMsg;
    } else if (arguments.length === 3) {
      delta = prop;
      prop = null;
    }

    new Assertion(fn, msg, assert.changesBy, true)
      .to.change(obj, prop).by(delta);
  }

   /**
   * ### .doesNotChange(function, object, property, [message])
   *
   * Asserts that a function does not change the value of a property.
   *
   *     var obj = { val: 10 };
   *     var fn = function() { console.log('foo'); };
   *     assert.doesNotChange(fn, obj, 'val');
   *
   * @name doesNotChange
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.doesNotChange = function (fn, obj, prop, msg) {
    if (arguments.length === 3 && typeof obj === 'function') {
      msg = prop;
      prop = null;
    }

    return new Assertion(fn, msg, assert.doesNotChange, true)
      .to.not.change(obj, prop);
  }

  /**
   * ### .changesButNotBy(function, object, property, delta, [message])
   *
   * Asserts that a function does not change the value of a property or of a function's return value by an amount (delta)
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val += 10 };
   *     assert.changesButNotBy(fn, obj, 'val', 5);
   *
   * @name changesButNotBy
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {Number} change amount (delta)
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.changesButNotBy = function (fn, obj, prop, delta, msg) {
    if (arguments.length === 4 && typeof obj === 'function') {
      var tmpMsg = delta;
      delta = prop;
      msg = tmpMsg;
    } else if (arguments.length === 3) {
      delta = prop;
      prop = null;
    }

    new Assertion(fn, msg, assert.changesButNotBy, true)
      .to.change(obj, prop).but.not.by(delta);
  }

  /**
   * ### .increases(function, object, property, [message])
   *
   * Asserts that a function increases a numeric object property.
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 13 };
   *     assert.increases(fn, obj, 'val');
   *
   * @name increases
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.increases = function (fn, obj, prop, msg) {
    if (arguments.length === 3 && typeof obj === 'function') {
      msg = prop;
      prop = null;
    }

    return new Assertion(fn, msg, assert.increases, true)
      .to.increase(obj, prop);
  }

  /**
   * ### .increasesBy(function, object, property, delta, [message])
   *
   * Asserts that a function increases a numeric object property or a function's return value by an amount (delta).
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val += 10 };
   *     assert.increasesBy(fn, obj, 'val', 10);
   *
   * @name increasesBy
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {Number} change amount (delta)
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.increasesBy = function (fn, obj, prop, delta, msg) {
    if (arguments.length === 4 && typeof obj === 'function') {
      var tmpMsg = delta;
      delta = prop;
      msg = tmpMsg;
    } else if (arguments.length === 3) {
      delta = prop;
      prop = null;
    }

    new Assertion(fn, msg, assert.increasesBy, true)
      .to.increase(obj, prop).by(delta);
  }

  /**
   * ### .doesNotIncrease(function, object, property, [message])
   *
   * Asserts that a function does not increase a numeric object property.
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 8 };
   *     assert.doesNotIncrease(fn, obj, 'val');
   *
   * @name doesNotIncrease
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.doesNotIncrease = function (fn, obj, prop, msg) {
    if (arguments.length === 3 && typeof obj === 'function') {
      msg = prop;
      prop = null;
    }

    return new Assertion(fn, msg, assert.doesNotIncrease, true)
      .to.not.increase(obj, prop);
  }

  /**
   * ### .increasesButNotBy(function, object, property, [message])
   *
   * Asserts that a function does not increase a numeric object property or function's return value by an amount (delta).
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 15 };
   *     assert.increasesButNotBy(fn, obj, 'val', 10);
   *
   * @name increasesButNotBy
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {Number} change amount (delta)
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.increasesButNotBy = function (fn, obj, prop, delta, msg) {
    if (arguments.length === 4 && typeof obj === 'function') {
      var tmpMsg = delta;
      delta = prop;
      msg = tmpMsg;
    } else if (arguments.length === 3) {
      delta = prop;
      prop = null;
    }

    new Assertion(fn, msg, assert.increasesButNotBy, true)
      .to.increase(obj, prop).but.not.by(delta);
  }

  /**
   * ### .decreases(function, object, property, [message])
   *
   * Asserts that a function decreases a numeric object property.
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 5 };
   *     assert.decreases(fn, obj, 'val');
   *
   * @name decreases
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.decreases = function (fn, obj, prop, msg) {
    if (arguments.length === 3 && typeof obj === 'function') {
      msg = prop;
      prop = null;
    }

    return new Assertion(fn, msg, assert.decreases, true)
      .to.decrease(obj, prop);
  }

  /**
   * ### .decreasesBy(function, object, property, delta, [message])
   *
   * Asserts that a function decreases a numeric object property or a function's return value by an amount (delta)
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val -= 5 };
   *     assert.decreasesBy(fn, obj, 'val', 5);
   *
   * @name decreasesBy
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {Number} change amount (delta)
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.decreasesBy = function (fn, obj, prop, delta, msg) {
    if (arguments.length === 4 && typeof obj === 'function') {
      var tmpMsg = delta;
      delta = prop;
      msg = tmpMsg;
    } else if (arguments.length === 3) {
      delta = prop;
      prop = null;
    }

    new Assertion(fn, msg, assert.decreasesBy, true)
      .to.decrease(obj, prop).by(delta);
  }

  /**
   * ### .doesNotDecrease(function, object, property, [message])
   *
   * Asserts that a function does not decreases a numeric object property.
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 15 };
   *     assert.doesNotDecrease(fn, obj, 'val');
   *
   * @name doesNotDecrease
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.doesNotDecrease = function (fn, obj, prop, msg) {
    if (arguments.length === 3 && typeof obj === 'function') {
      msg = prop;
      prop = null;
    }

    return new Assertion(fn, msg, assert.doesNotDecrease, true)
      .to.not.decrease(obj, prop);
  }

  /**
   * ### .doesNotDecreaseBy(function, object, property, delta, [message])
   *
   * Asserts that a function does not decreases a numeric object property or a function's return value by an amount (delta)
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 5 };
   *     assert.doesNotDecreaseBy(fn, obj, 'val', 1);
   *
   * @name doesNotDecrease
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {Number} change amount (delta)
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.doesNotDecreaseBy = function (fn, obj, prop, delta, msg) {
    if (arguments.length === 4 && typeof obj === 'function') {
      var tmpMsg = delta;
      delta = prop;
      msg = tmpMsg;
    } else if (arguments.length === 3) {
      delta = prop;
      prop = null;
    }

    return new Assertion(fn, msg, assert.doesNotDecreaseBy, true)
      .to.not.decrease(obj, prop).by(delta);
  }

  /**
   * ### .decreasesButNotBy(function, object, property, delta, [message])
   *
   * Asserts that a function does not decreases a numeric object property or a function's return value by an amount (delta)
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 5 };
   *     assert.decreasesButNotBy(fn, obj, 'val', 1);
   *
   * @name decreasesButNotBy
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {Number} change amount (delta)
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.decreasesButNotBy = function (fn, obj, prop, delta, msg) {
    if (arguments.length === 4 && typeof obj === 'function') {
      var tmpMsg = delta;
      delta = prop;
      msg = tmpMsg;
    } else if (arguments.length === 3) {
      delta = prop;
      prop = null;
    }

    new Assertion(fn, msg, assert.decreasesButNotBy, true)
      .to.decrease(obj, prop).but.not.by(delta);
  }

  /*!
   * ### .ifError(object)
   *
   * Asserts if value is not a false value, and throws if it is a true value.
   * This is added to allow for chai to be a drop-in replacement for Node's
   * assert class.
   *
   *     var err = new Error('I am a custom error');
   *     assert.ifError(err); // Rethrows err!
   *
   * @name ifError
   * @param {Object} object
   * @namespace Assert
   * @api public
   */

  assert.ifError = function (val) {
    if (val) {
      throw(val);
    }
  };

  /**
   * ### .isExtensible(object)
   *
   * Asserts that `object` is extensible (can have new properties added to it).
   *
   *     assert.isExtensible({});
   *
   * @name isExtensible
   * @alias extensible
   * @param {Object} object
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.isExtensible = function (obj, msg) {
    new Assertion(obj, msg, assert.isExtensible, true).to.be.extensible;
  };

  /**
   * ### .isNotExtensible(object)
   *
   * Asserts that `object` is _not_ extensible.
   *
   *     var nonExtensibleObject = Object.preventExtensions({});
   *     var sealedObject = Object.seal({});
   *     var frozenObject = Object.freeze({});
   *
   *     assert.isNotExtensible(nonExtensibleObject);
   *     assert.isNotExtensible(sealedObject);
   *     assert.isNotExtensible(frozenObject);
   *
   * @name isNotExtensible
   * @alias notExtensible
   * @param {Object} object
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.isNotExtensible = function (obj, msg) {
    new Assertion(obj, msg, assert.isNotExtensible, true).to.not.be.extensible;
  };

  /**
   * ### .isSealed(object)
   *
   * Asserts that `object` is sealed (cannot have new properties added to it
   * and its existing properties cannot be removed).
   *
   *     var sealedObject = Object.seal({});
   *     var frozenObject = Object.seal({});
   *
   *     assert.isSealed(sealedObject);
   *     assert.isSealed(frozenObject);
   *
   * @name isSealed
   * @alias sealed
   * @param {Object} object
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.isSealed = function (obj, msg) {
    new Assertion(obj, msg, assert.isSealed, true).to.be.sealed;
  };

  /**
   * ### .isNotSealed(object)
   *
   * Asserts that `object` is _not_ sealed.
   *
   *     assert.isNotSealed({});
   *
   * @name isNotSealed
   * @alias notSealed
   * @param {Object} object
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.isNotSealed = function (obj, msg) {
    new Assertion(obj, msg, assert.isNotSealed, true).to.not.be.sealed;
  };

  /**
   * ### .isFrozen(object)
   *
   * Asserts that `object` is frozen (cannot have new properties added to it
   * and its existing properties cannot be modified).
   *
   *     var frozenObject = Object.freeze({});
   *     assert.frozen(frozenObject);
   *
   * @name isFrozen
   * @alias frozen
   * @param {Object} object
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.isFrozen = function (obj, msg) {
    new Assertion(obj, msg, assert.isFrozen, true).to.be.frozen;
  };

  /**
   * ### .isNotFrozen(object)
   *
   * Asserts that `object` is _not_ frozen.
   *
   *     assert.isNotFrozen({});
   *
   * @name isNotFrozen
   * @alias notFrozen
   * @param {Object} object
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.isNotFrozen = function (obj, msg) {
    new Assertion(obj, msg, assert.isNotFrozen, true).to.not.be.frozen;
  };

  /**
   * ### .isEmpty(target)
   *
   * Asserts that the target does not contain any values.
   * For arrays and strings, it checks the `length` property.
   * For `Map` and `Set` instances, it checks the `size` property.
   * For non-function objects, it gets the count of own
   * enumerable string keys.
   *
   *     assert.isEmpty([]);
   *     assert.isEmpty('');
   *     assert.isEmpty(new Map);
   *     assert.isEmpty({});
   *
   * @name isEmpty
   * @alias empty
   * @param {Object|Array|String|Map|Set} target
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.isEmpty = function(val, msg) {
    new Assertion(val, msg, assert.isEmpty, true).to.be.empty;
  };

  /**
   * ### .isNotEmpty(target)
   *
   * Asserts that the target contains values.
   * For arrays and strings, it checks the `length` property.
   * For `Map` and `Set` instances, it checks the `size` property.
   * For non-function objects, it gets the count of own
   * enumerable string keys.
   *
   *     assert.isNotEmpty([1, 2]);
   *     assert.isNotEmpty('34');
   *     assert.isNotEmpty(new Set([5, 6]));
   *     assert.isNotEmpty({ key: 7 });
   *
   * @name isNotEmpty
   * @alias notEmpty
   * @param {Object|Array|String|Map|Set} target
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.isNotEmpty = function(val, msg) {
    new Assertion(val, msg, assert.isNotEmpty, true).to.not.be.empty;
  };

  /*!
   * Aliases.
   */

  (function alias(name, as){
    assert[as] = assert[name];
    return alias;
  })
  ('isOk', 'ok')
  ('isNotOk', 'notOk')
  ('throws', 'throw')
  ('throws', 'Throw')
  ('isExtensible', 'extensible')
  ('isNotExtensible', 'notExtensible')
  ('isSealed', 'sealed')
  ('isNotSealed', 'notSealed')
  ('isFrozen', 'frozen')
  ('isNotFrozen', 'notFrozen')
  ('isEmpty', 'empty')
  ('isNotEmpty', 'notEmpty');
};

},{}],8:[function(require,module,exports){
/*!
 * chai
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

module.exports = function (chai, util) {
  chai.expect = function (val, message) {
    return new chai.Assertion(val, message);
  };

  /**
   * ### .fail([message])
   * ### .fail(actual, expected, [message], [operator])
   *
   * Throw a failure.
   *
   *     expect.fail();
   *     expect.fail("custom error message");
   *     expect.fail(1, 2);
   *     expect.fail(1, 2, "custom error message");
   *     expect.fail(1, 2, "custom error message", ">");
   *     expect.fail(1, 2, undefined, ">");
   *
   * @name fail
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @param {String} operator
   * @namespace BDD
   * @api public
   */

  chai.expect.fail = function (actual, expected, message, operator) {
    if (arguments.length < 2) {
        message = actual;
        actual = undefined;
    }

    message = message || 'expect.fail()';
    throw new chai.AssertionError(message, {
        actual: actual
      , expected: expected
      , operator: operator
    }, chai.expect.fail);
  };
};

},{}],9:[function(require,module,exports){
/*!
 * chai
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

module.exports = function (chai, util) {
  var Assertion = chai.Assertion;

  function loadShould () {
    // explicitly define this method as function as to have it's name to include as `ssfi`
    function shouldGetter() {
      if (this instanceof String
          || this instanceof Number
          || this instanceof Boolean
          || typeof Symbol === 'function' && this instanceof Symbol) {
        return new Assertion(this.valueOf(), null, shouldGetter);
      }
      return new Assertion(this, null, shouldGetter);
    }
    function shouldSetter(value) {
      // See https://github.com/chaijs/chai/issues/86: this makes
      // `whatever.should = someValue` actually set `someValue`, which is
      // especially useful for `global.should = require('chai').should()`.
      //
      // Note that we have to use [[DefineProperty]] instead of [[Put]]
      // since otherwise we would trigger this very setter!
      Object.defineProperty(this, 'should', {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    }
    // modify Object.prototype to have `should`
    Object.defineProperty(Object.prototype, 'should', {
      set: shouldSetter
      , get: shouldGetter
      , configurable: true
    });

    var should = {};

    /**
     * ### .fail([message])
     * ### .fail(actual, expected, [message], [operator])
     *
     * Throw a failure.
     *
     *     should.fail();
     *     should.fail("custom error message");
     *     should.fail(1, 2);
     *     should.fail(1, 2, "custom error message");
     *     should.fail(1, 2, "custom error message", ">");
     *     should.fail(1, 2, undefined, ">");
     *
     *
     * @name fail
     * @param {Mixed} actual
     * @param {Mixed} expected
     * @param {String} message
     * @param {String} operator
     * @namespace BDD
     * @api public
     */

    should.fail = function (actual, expected, message, operator) {
      if (arguments.length < 2) {
          message = actual;
          actual = undefined;
      }

      message = message || 'should.fail()';
      throw new chai.AssertionError(message, {
          actual: actual
        , expected: expected
        , operator: operator
      }, should.fail);
    };

    /**
     * ### .equal(actual, expected, [message])
     *
     * Asserts non-strict equality (`==`) of `actual` and `expected`.
     *
     *     should.equal(3, '3', '== coerces values to strings');
     *
     * @name equal
     * @param {Mixed} actual
     * @param {Mixed} expected
     * @param {String} message
     * @namespace Should
     * @api public
     */

    should.equal = function (val1, val2, msg) {
      new Assertion(val1, msg).to.equal(val2);
    };

    /**
     * ### .throw(function, [constructor/string/regexp], [string/regexp], [message])
     *
     * Asserts that `function` will throw an error that is an instance of
     * `constructor`, or alternately that it will throw an error with message
     * matching `regexp`.
     *
     *     should.throw(fn, 'function throws a reference error');
     *     should.throw(fn, /function throws a reference error/);
     *     should.throw(fn, ReferenceError);
     *     should.throw(fn, ReferenceError, 'function throws a reference error');
     *     should.throw(fn, ReferenceError, /function throws a reference error/);
     *
     * @name throw
     * @alias Throw
     * @param {Function} function
     * @param {ErrorConstructor} constructor
     * @param {RegExp} regexp
     * @param {String} message
     * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
     * @namespace Should
     * @api public
     */

    should.Throw = function (fn, errt, errs, msg) {
      new Assertion(fn, msg).to.Throw(errt, errs);
    };

    /**
     * ### .exist
     *
     * Asserts that the target is neither `null` nor `undefined`.
     *
     *     var foo = 'hi';
     *
     *     should.exist(foo, 'foo exists');
     *
     * @name exist
     * @namespace Should
     * @api public
     */

    should.exist = function (val, msg) {
      new Assertion(val, msg).to.exist;
    }

    // negation
    should.not = {}

    /**
     * ### .not.equal(actual, expected, [message])
     *
     * Asserts non-strict inequality (`!=`) of `actual` and `expected`.
     *
     *     should.not.equal(3, 4, 'these numbers are not equal');
     *
     * @name not.equal
     * @param {Mixed} actual
     * @param {Mixed} expected
     * @param {String} message
     * @namespace Should
     * @api public
     */

    should.not.equal = function (val1, val2, msg) {
      new Assertion(val1, msg).to.not.equal(val2);
    };

    /**
     * ### .throw(function, [constructor/regexp], [message])
     *
     * Asserts that `function` will _not_ throw an error that is an instance of
     * `constructor`, or alternately that it will not throw an error with message
     * matching `regexp`.
     *
     *     should.not.throw(fn, Error, 'function does not throw');
     *
     * @name not.throw
     * @alias not.Throw
     * @param {Function} function
     * @param {ErrorConstructor} constructor
     * @param {RegExp} regexp
     * @param {String} message
     * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
     * @namespace Should
     * @api public
     */

    should.not.Throw = function (fn, errt, errs, msg) {
      new Assertion(fn, msg).to.not.Throw(errt, errs);
    };

    /**
     * ### .not.exist
     *
     * Asserts that the target is neither `null` nor `undefined`.
     *
     *     var bar = null;
     *
     *     should.not.exist(bar, 'bar does not exist');
     *
     * @name not.exist
     * @namespace Should
     * @api public
     */

    should.not.exist = function (val, msg) {
      new Assertion(val, msg).to.not.exist;
    }

    should['throw'] = should['Throw'];
    should.not['throw'] = should.not['Throw'];

    return should;
  };

  chai.should = loadShould;
  chai.Should = loadShould;
};

},{}],10:[function(require,module,exports){
/*!
 * Chai - addChainingMethod utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var addLengthGuard = require('./addLengthGuard');
var chai = require('../../chai');
var flag = require('./flag');
var proxify = require('./proxify');
var transferFlags = require('./transferFlags');

/*!
 * Module variables
 */

// Check whether `Object.setPrototypeOf` is supported
var canSetPrototype = typeof Object.setPrototypeOf === 'function';

// Without `Object.setPrototypeOf` support, this module will need to add properties to a function.
// However, some of functions' own props are not configurable and should be skipped.
var testFn = function() {};
var excludeNames = Object.getOwnPropertyNames(testFn).filter(function(name) {
  var propDesc = Object.getOwnPropertyDescriptor(testFn, name);

  // Note: PhantomJS 1.x includes `callee` as one of `testFn`'s own properties,
  // but then returns `undefined` as the property descriptor for `callee`. As a
  // workaround, we perform an otherwise unnecessary type-check for `propDesc`,
  // and then filter it out if it's not an object as it should be.
  if (typeof propDesc !== 'object')
    return true;

  return !propDesc.configurable;
});

// Cache `Function` properties
var call  = Function.prototype.call,
    apply = Function.prototype.apply;

/**
 * ### .addChainableMethod(ctx, name, method, chainingBehavior)
 *
 * Adds a method to an object, such that the method can also be chained.
 *
 *     utils.addChainableMethod(chai.Assertion.prototype, 'foo', function (str) {
 *       var obj = utils.flag(this, 'object');
 *       new chai.Assertion(obj).to.be.equal(str);
 *     });
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.addChainableMethod('foo', fn, chainingBehavior);
 *
 * The result can then be used as both a method assertion, executing both `method` and
 * `chainingBehavior`, or as a language chain, which only executes `chainingBehavior`.
 *
 *     expect(fooStr).to.be.foo('bar');
 *     expect(fooStr).to.be.foo.equal('foo');
 *
 * @param {Object} ctx object to which the method is added
 * @param {String} name of method to add
 * @param {Function} method function to be used for `name`, when called
 * @param {Function} chainingBehavior function to be called every time the property is accessed
 * @namespace Utils
 * @name addChainableMethod
 * @api public
 */

module.exports = function addChainableMethod(ctx, name, method, chainingBehavior) {
  if (typeof chainingBehavior !== 'function') {
    chainingBehavior = function () { };
  }

  var chainableBehavior = {
      method: method
    , chainingBehavior: chainingBehavior
  };

  // save the methods so we can overwrite them later, if we need to.
  if (!ctx.__methods) {
    ctx.__methods = {};
  }
  ctx.__methods[name] = chainableBehavior;

  Object.defineProperty(ctx, name,
    { get: function chainableMethodGetter() {
        chainableBehavior.chainingBehavior.call(this);

        var chainableMethodWrapper = function () {
          // Setting the `ssfi` flag to `chainableMethodWrapper` causes this
          // function to be the starting point for removing implementation
          // frames from the stack trace of a failed assertion.
          //
          // However, we only want to use this function as the starting point if
          // the `lockSsfi` flag isn't set.
          //
          // If the `lockSsfi` flag is set, then this assertion is being
          // invoked from inside of another assertion. In this case, the `ssfi`
          // flag has already been set by the outer assertion.
          //
          // Note that overwriting a chainable method merely replaces the saved
          // methods in `ctx.__methods` instead of completely replacing the
          // overwritten assertion. Therefore, an overwriting assertion won't
          // set the `ssfi` or `lockSsfi` flags.
          if (!flag(this, 'lockSsfi')) {
            flag(this, 'ssfi', chainableMethodWrapper);
          }

          var result = chainableBehavior.method.apply(this, arguments);
          if (result !== undefined) {
            return result;
          }

          var newAssertion = new chai.Assertion();
          transferFlags(this, newAssertion);
          return newAssertion;
        };

        addLengthGuard(chainableMethodWrapper, name, true);

        // Use `Object.setPrototypeOf` if available
        if (canSetPrototype) {
          // Inherit all properties from the object by replacing the `Function` prototype
          var prototype = Object.create(this);
          // Restore the `call` and `apply` methods from `Function`
          prototype.call = call;
          prototype.apply = apply;
          Object.setPrototypeOf(chainableMethodWrapper, prototype);
        }
        // Otherwise, redefine all properties (slow!)
        else {
          var asserterNames = Object.getOwnPropertyNames(ctx);
          asserterNames.forEach(function (asserterName) {
            if (excludeNames.indexOf(asserterName) !== -1) {
              return;
            }

            var pd = Object.getOwnPropertyDescriptor(ctx, asserterName);
            Object.defineProperty(chainableMethodWrapper, asserterName, pd);
          });
        }

        transferFlags(this, chainableMethodWrapper);
        return proxify(chainableMethodWrapper);
      }
    , configurable: true
  });
};

},{"../../chai":3,"./addLengthGuard":11,"./flag":16,"./proxify":31,"./transferFlags":33}],11:[function(require,module,exports){
var fnLengthDesc = Object.getOwnPropertyDescriptor(function () {}, 'length');

/*!
 * Chai - addLengthGuard utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .addLengthGuard(fn, assertionName, isChainable)
 *
 * Define `length` as a getter on the given uninvoked method assertion. The
 * getter acts as a guard against chaining `length` directly off of an uninvoked
 * method assertion, which is a problem because it references `function`'s
 * built-in `length` property instead of Chai's `length` assertion. When the
 * getter catches the user making this mistake, it throws an error with a
 * helpful message.
 *
 * There are two ways in which this mistake can be made. The first way is by
 * chaining the `length` assertion directly off of an uninvoked chainable
 * method. In this case, Chai suggests that the user use `lengthOf` instead. The
 * second way is by chaining the `length` assertion directly off of an uninvoked
 * non-chainable method. Non-chainable methods must be invoked prior to
 * chaining. In this case, Chai suggests that the user consult the docs for the
 * given assertion.
 *
 * If the `length` property of functions is unconfigurable, then return `fn`
 * without modification.
 *
 * Note that in ES6, the function's `length` property is configurable, so once
 * support for legacy environments is dropped, Chai's `length` property can
 * replace the built-in function's `length` property, and this length guard will
 * no longer be necessary. In the mean time, maintaining consistency across all
 * environments is the priority.
 *
 * @param {Function} fn
 * @param {String} assertionName
 * @param {Boolean} isChainable
 * @namespace Utils
 * @name addLengthGuard
 */

module.exports = function addLengthGuard (fn, assertionName, isChainable) {
  if (!fnLengthDesc.configurable) return fn;

  Object.defineProperty(fn, 'length', {
    get: function () {
      if (isChainable) {
        throw Error('Invalid Chai property: ' + assertionName + '.length. Due' +
          ' to a compatibility issue, "length" cannot directly follow "' +
          assertionName + '". Use "' + assertionName + '.lengthOf" instead.');
      }

      throw Error('Invalid Chai property: ' + assertionName + '.length. See' +
        ' docs for proper usage of "' + assertionName + '".');
    }
  });

  return fn;
};

},{}],12:[function(require,module,exports){
/*!
 * Chai - addMethod utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var addLengthGuard = require('./addLengthGuard');
var chai = require('../../chai');
var flag = require('./flag');
var proxify = require('./proxify');
var transferFlags = require('./transferFlags');

/**
 * ### .addMethod(ctx, name, method)
 *
 * Adds a method to the prototype of an object.
 *
 *     utils.addMethod(chai.Assertion.prototype, 'foo', function (str) {
 *       var obj = utils.flag(this, 'object');
 *       new chai.Assertion(obj).to.be.equal(str);
 *     });
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.addMethod('foo', fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(fooStr).to.be.foo('bar');
 *
 * @param {Object} ctx object to which the method is added
 * @param {String} name of method to add
 * @param {Function} method function to be used for name
 * @namespace Utils
 * @name addMethod
 * @api public
 */

module.exports = function addMethod(ctx, name, method) {
  var methodWrapper = function () {
    // Setting the `ssfi` flag to `methodWrapper` causes this function to be the
    // starting point for removing implementation frames from the stack trace of
    // a failed assertion.
    //
    // However, we only want to use this function as the starting point if the
    // `lockSsfi` flag isn't set.
    //
    // If the `lockSsfi` flag is set, then either this assertion has been
    // overwritten by another assertion, or this assertion is being invoked from
    // inside of another assertion. In the first case, the `ssfi` flag has
    // already been set by the overwriting assertion. In the second case, the
    // `ssfi` flag has already been set by the outer assertion.
    if (!flag(this, 'lockSsfi')) {
      flag(this, 'ssfi', methodWrapper);
    }

    var result = method.apply(this, arguments);
    if (result !== undefined)
      return result;

    var newAssertion = new chai.Assertion();
    transferFlags(this, newAssertion);
    return newAssertion;
  };

  addLengthGuard(methodWrapper, name, false);
  ctx[name] = proxify(methodWrapper, name);
};

},{"../../chai":3,"./addLengthGuard":11,"./flag":16,"./proxify":31,"./transferFlags":33}],13:[function(require,module,exports){
/*!
 * Chai - addProperty utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var chai = require('../../chai');
var flag = require('./flag');
var isProxyEnabled = require('./isProxyEnabled');
var transferFlags = require('./transferFlags');

/**
 * ### .addProperty(ctx, name, getter)
 *
 * Adds a property to the prototype of an object.
 *
 *     utils.addProperty(chai.Assertion.prototype, 'foo', function () {
 *       var obj = utils.flag(this, 'object');
 *       new chai.Assertion(obj).to.be.instanceof(Foo);
 *     });
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.addProperty('foo', fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(myFoo).to.be.foo;
 *
 * @param {Object} ctx object to which the property is added
 * @param {String} name of property to add
 * @param {Function} getter function to be used for name
 * @namespace Utils
 * @name addProperty
 * @api public
 */

module.exports = function addProperty(ctx, name, getter) {
  getter = getter === undefined ? function () {} : getter;

  Object.defineProperty(ctx, name,
    { get: function propertyGetter() {
        // Setting the `ssfi` flag to `propertyGetter` causes this function to
        // be the starting point for removing implementation frames from the
        // stack trace of a failed assertion.
        //
        // However, we only want to use this function as the starting point if
        // the `lockSsfi` flag isn't set and proxy protection is disabled.
        //
        // If the `lockSsfi` flag is set, then either this assertion has been
        // overwritten by another assertion, or this assertion is being invoked
        // from inside of another assertion. In the first case, the `ssfi` flag
        // has already been set by the overwriting assertion. In the second
        // case, the `ssfi` flag has already been set by the outer assertion.
        //
        // If proxy protection is enabled, then the `ssfi` flag has already been
        // set by the proxy getter.
        if (!isProxyEnabled() && !flag(this, 'lockSsfi')) {
          flag(this, 'ssfi', propertyGetter);
        }

        var result = getter.call(this);
        if (result !== undefined)
          return result;

        var newAssertion = new chai.Assertion();
        transferFlags(this, newAssertion);
        return newAssertion;
      }
    , configurable: true
  });
};

},{"../../chai":3,"./flag":16,"./isProxyEnabled":26,"./transferFlags":33}],14:[function(require,module,exports){
/*!
 * Chai - compareByInspect utility
 * Copyright(c) 2011-2016 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var inspect = require('./inspect');

/**
 * ### .compareByInspect(mixed, mixed)
 *
 * To be used as a compareFunction with Array.prototype.sort. Compares elements
 * using inspect instead of default behavior of using toString so that Symbols
 * and objects with irregular/missing toString can still be sorted without a
 * TypeError.
 *
 * @param {Mixed} first element to compare
 * @param {Mixed} second element to compare
 * @returns {Number} -1 if 'a' should come before 'b'; otherwise 1
 * @name compareByInspect
 * @namespace Utils
 * @api public
 */

module.exports = function compareByInspect(a, b) {
  return inspect(a) < inspect(b) ? -1 : 1;
};

},{"./inspect":24}],15:[function(require,module,exports){
/*!
 * Chai - expectTypes utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .expectTypes(obj, types)
 *
 * Ensures that the object being tested against is of a valid type.
 *
 *     utils.expectTypes(this, ['array', 'object', 'string']);
 *
 * @param {Mixed} obj constructed Assertion
 * @param {Array} type A list of allowed types for this assertion
 * @namespace Utils
 * @name expectTypes
 * @api public
 */

var AssertionError = require('assertion-error');
var flag = require('./flag');
var type = require('type-detect');

module.exports = function expectTypes(obj, types) {
  var flagMsg = flag(obj, 'message');
  var ssfi = flag(obj, 'ssfi');

  flagMsg = flagMsg ? flagMsg + ': ' : '';

  obj = flag(obj, 'object');
  types = types.map(function (t) { return t.toLowerCase(); });
  types.sort();

  // Transforms ['lorem', 'ipsum'] into 'a lorem, or an ipsum'
  var str = types.map(function (t, index) {
    var art = ~[ 'a', 'e', 'i', 'o', 'u' ].indexOf(t.charAt(0)) ? 'an' : 'a';
    var or = types.length > 1 && index === types.length - 1 ? 'or ' : '';
    return or + art + ' ' + t;
  }).join(', ');

  var objType = type(obj).toLowerCase();

  if (!types.some(function (expected) { return objType === expected; })) {
    throw new AssertionError(
      flagMsg + 'object tested must be ' + str + ', but ' + objType + ' given',
      undefined,
      ssfi
    );
  }
};

},{"./flag":16,"assertion-error":1,"type-detect":38}],16:[function(require,module,exports){
/*!
 * Chai - flag utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .flag(object, key, [value])
 *
 * Get or set a flag value on an object. If a
 * value is provided it will be set, else it will
 * return the currently set value or `undefined` if
 * the value is not set.
 *
 *     utils.flag(this, 'foo', 'bar'); // setter
 *     utils.flag(this, 'foo'); // getter, returns `bar`
 *
 * @param {Object} object constructed Assertion
 * @param {String} key
 * @param {Mixed} value (optional)
 * @namespace Utils
 * @name flag
 * @api private
 */

module.exports = function flag(obj, key, value) {
  var flags = obj.__flags || (obj.__flags = Object.create(null));
  if (arguments.length === 3) {
    flags[key] = value;
  } else {
    return flags[key];
  }
};

},{}],17:[function(require,module,exports){
/*!
 * Chai - getActual utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .getActual(object, [actual])
 *
 * Returns the `actual` value for an Assertion.
 *
 * @param {Object} object (constructed Assertion)
 * @param {Arguments} chai.Assertion.prototype.assert arguments
 * @namespace Utils
 * @name getActual
 */

module.exports = function getActual(obj, args) {
  return args.length > 4 ? args[4] : obj._obj;
};

},{}],18:[function(require,module,exports){
/*!
 * Chai - getEnumerableProperties utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .getEnumerableProperties(object)
 *
 * This allows the retrieval of enumerable property names of an object,
 * inherited or not.
 *
 * @param {Object} object
 * @returns {Array}
 * @namespace Utils
 * @name getEnumerableProperties
 * @api public
 */

module.exports = function getEnumerableProperties(object) {
  var result = [];
  for (var name in object) {
    result.push(name);
  }
  return result;
};

},{}],19:[function(require,module,exports){
/*!
 * Chai - message composition utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var flag = require('./flag')
  , getActual = require('./getActual')
  , objDisplay = require('./objDisplay');

/**
 * ### .getMessage(object, message, negateMessage)
 *
 * Construct the error message based on flags
 * and template tags. Template tags will return
 * a stringified inspection of the object referenced.
 *
 * Message template tags:
 * - `#{this}` current asserted object
 * - `#{act}` actual value
 * - `#{exp}` expected value
 *
 * @param {Object} object (constructed Assertion)
 * @param {Arguments} chai.Assertion.prototype.assert arguments
 * @namespace Utils
 * @name getMessage
 * @api public
 */

module.exports = function getMessage(obj, args) {
  var negate = flag(obj, 'negate')
    , val = flag(obj, 'object')
    , expected = args[3]
    , actual = getActual(obj, args)
    , msg = negate ? args[2] : args[1]
    , flagMsg = flag(obj, 'message');

  if(typeof msg === "function") msg = msg();
  msg = msg || '';
  msg = msg
    .replace(/#\{this\}/g, function () { return objDisplay(val); })
    .replace(/#\{act\}/g, function () { return objDisplay(actual); })
    .replace(/#\{exp\}/g, function () { return objDisplay(expected); });

  return flagMsg ? flagMsg + ': ' + msg : msg;
};

},{"./flag":16,"./getActual":17,"./objDisplay":27}],20:[function(require,module,exports){
/*!
 * Chai - getOwnEnumerableProperties utility
 * Copyright(c) 2011-2016 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var getOwnEnumerablePropertySymbols = require('./getOwnEnumerablePropertySymbols');

/**
 * ### .getOwnEnumerableProperties(object)
 *
 * This allows the retrieval of directly-owned enumerable property names and
 * symbols of an object. This function is necessary because Object.keys only
 * returns enumerable property names, not enumerable property symbols.
 *
 * @param {Object} object
 * @returns {Array}
 * @namespace Utils
 * @name getOwnEnumerableProperties
 * @api public
 */

module.exports = function getOwnEnumerableProperties(obj) {
  return Object.keys(obj).concat(getOwnEnumerablePropertySymbols(obj));
};

},{"./getOwnEnumerablePropertySymbols":21}],21:[function(require,module,exports){
/*!
 * Chai - getOwnEnumerablePropertySymbols utility
 * Copyright(c) 2011-2016 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .getOwnEnumerablePropertySymbols(object)
 *
 * This allows the retrieval of directly-owned enumerable property symbols of an
 * object. This function is necessary because Object.getOwnPropertySymbols
 * returns both enumerable and non-enumerable property symbols.
 *
 * @param {Object} object
 * @returns {Array}
 * @namespace Utils
 * @name getOwnEnumerablePropertySymbols
 * @api public
 */

module.exports = function getOwnEnumerablePropertySymbols(obj) {
  if (typeof Object.getOwnPropertySymbols !== 'function') return [];

  return Object.getOwnPropertySymbols(obj).filter(function (sym) {
    return Object.getOwnPropertyDescriptor(obj, sym).enumerable;
  });
};

},{}],22:[function(require,module,exports){
/*!
 * Chai - getProperties utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .getProperties(object)
 *
 * This allows the retrieval of property names of an object, enumerable or not,
 * inherited or not.
 *
 * @param {Object} object
 * @returns {Array}
 * @namespace Utils
 * @name getProperties
 * @api public
 */

module.exports = function getProperties(object) {
  var result = Object.getOwnPropertyNames(object);

  function addProperty(property) {
    if (result.indexOf(property) === -1) {
      result.push(property);
    }
  }

  var proto = Object.getPrototypeOf(object);
  while (proto !== null) {
    Object.getOwnPropertyNames(proto).forEach(addProperty);
    proto = Object.getPrototypeOf(proto);
  }

  return result;
};

},{}],23:[function(require,module,exports){
/*!
 * chai
 * Copyright(c) 2011 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Dependencies that are used for multiple exports are required here only once
 */

var pathval = require('pathval');

/*!
 * test utility
 */

exports.test = require('./test');

/*!
 * type utility
 */

exports.type = require('type-detect');

/*!
 * expectTypes utility
 */
exports.expectTypes = require('./expectTypes');

/*!
 * message utility
 */

exports.getMessage = require('./getMessage');

/*!
 * actual utility
 */

exports.getActual = require('./getActual');

/*!
 * Inspect util
 */

exports.inspect = require('./inspect');

/*!
 * Object Display util
 */

exports.objDisplay = require('./objDisplay');

/*!
 * Flag utility
 */

exports.flag = require('./flag');

/*!
 * Flag transferring utility
 */

exports.transferFlags = require('./transferFlags');

/*!
 * Deep equal utility
 */

exports.eql = require('deep-eql');

/*!
 * Deep path info
 */

exports.getPathInfo = pathval.getPathInfo;

/*!
 * Check if a property exists
 */

exports.hasProperty = pathval.hasProperty;

/*!
 * Function name
 */

exports.getName = require('get-func-name');

/*!
 * add Property
 */

exports.addProperty = require('./addProperty');

/*!
 * add Method
 */

exports.addMethod = require('./addMethod');

/*!
 * overwrite Property
 */

exports.overwriteProperty = require('./overwriteProperty');

/*!
 * overwrite Method
 */

exports.overwriteMethod = require('./overwriteMethod');

/*!
 * Add a chainable method
 */

exports.addChainableMethod = require('./addChainableMethod');

/*!
 * Overwrite chainable method
 */

exports.overwriteChainableMethod = require('./overwriteChainableMethod');

/*!
 * Compare by inspect method
 */

exports.compareByInspect = require('./compareByInspect');

/*!
 * Get own enumerable property symbols method
 */

exports.getOwnEnumerablePropertySymbols = require('./getOwnEnumerablePropertySymbols');

/*!
 * Get own enumerable properties method
 */

exports.getOwnEnumerableProperties = require('./getOwnEnumerableProperties');

/*!
 * Checks error against a given set of criteria
 */

exports.checkError = require('check-error');

/*!
 * Proxify util
 */

exports.proxify = require('./proxify');

/*!
 * addLengthGuard util
 */

exports.addLengthGuard = require('./addLengthGuard');

/*!
 * isProxyEnabled helper
 */

exports.isProxyEnabled = require('./isProxyEnabled');

/*!
 * isNaN method
 */

exports.isNaN = require('./isNaN');

},{"./addChainableMethod":10,"./addLengthGuard":11,"./addMethod":12,"./addProperty":13,"./compareByInspect":14,"./expectTypes":15,"./flag":16,"./getActual":17,"./getMessage":19,"./getOwnEnumerableProperties":20,"./getOwnEnumerablePropertySymbols":21,"./inspect":24,"./isNaN":25,"./isProxyEnabled":26,"./objDisplay":27,"./overwriteChainableMethod":28,"./overwriteMethod":29,"./overwriteProperty":30,"./proxify":31,"./test":32,"./transferFlags":33,"check-error":34,"deep-eql":35,"get-func-name":36,"pathval":37,"type-detect":38}],24:[function(require,module,exports){
// This is (almost) directly from Node.js utils
// https://github.com/joyent/node/blob/f8c335d0caf47f16d31413f89aa28eda3878e3aa/lib/util.js

var getName = require('get-func-name');
var getProperties = require('./getProperties');
var getEnumerableProperties = require('./getEnumerableProperties');
var config = require('../config');

module.exports = inspect;

/**
 * ### .inspect(obj, [showHidden], [depth], [colors])
 *
 * Echoes the value of a value. Tries to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Boolean} showHidden Flag that shows hidden (not enumerable)
 *    properties of objects. Default is false.
 * @param {Number} depth Depth in which to descend in object. Default is 2.
 * @param {Boolean} colors Flag to turn on ANSI escape codes to color the
 *    output. Default is false (no coloring).
 * @namespace Utils
 * @name inspect
 */
function inspect(obj, showHidden, depth, colors) {
  var ctx = {
    showHidden: showHidden,
    seen: [],
    stylize: function (str) { return str; }
  };
  return formatValue(ctx, obj, (typeof depth === 'undefined' ? 2 : depth));
}

// Returns true if object is a DOM element.
var isDOMElement = function (object) {
  if (typeof HTMLElement === 'object') {
    return object instanceof HTMLElement;
  } else {
    return object &&
      typeof object === 'object' &&
      'nodeType' in object &&
      object.nodeType === 1 &&
      typeof object.nodeName === 'string';
  }
};

function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (value && typeof value.inspect === 'function' &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (typeof ret !== 'string') {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // If this is a DOM element, try to get the outer HTML.
  if (isDOMElement(value)) {
    if ('outerHTML' in value) {
      return value.outerHTML;
      // This value does not have an outerHTML attribute,
      //   it could still be an XML element
    } else {
      // Attempt to serialize it
      try {
        if (document.xmlVersion) {
          var xmlSerializer = new XMLSerializer();
          return xmlSerializer.serializeToString(value);
        } else {
          // Firefox 11- do not support outerHTML
          //   It does, however, support innerHTML
          //   Use the following to render the element
          var ns = "http://www.w3.org/1999/xhtml";
          var container = document.createElementNS(ns, '_');

          container.appendChild(value.cloneNode(false));
          var html = container.innerHTML
            .replace('><', '>' + value.innerHTML + '<');
          container.innerHTML = '';
          return html;
        }
      } catch (err) {
        // This could be a non-native DOM implementation,
        //   continue with the normal flow:
        //   printing the element as if it is an object.
      }
    }
  }

  // Look up the keys of the object.
  var visibleKeys = getEnumerableProperties(value);
  var keys = ctx.showHidden ? getProperties(value) : visibleKeys;

  var name, nameSuffix;

  // Some type of object without properties can be shortcut.
  // In IE, errors have a single `stack` property, or if they are vanilla `Error`,
  // a `stack` plus `description` property; ignore those for consistency.
  if (keys.length === 0 || (isError(value) && (
      (keys.length === 1 && keys[0] === 'stack') ||
      (keys.length === 2 && keys[0] === 'description' && keys[1] === 'stack')
     ))) {
    if (typeof value === 'function') {
      name = getName(value);
      nameSuffix = name ? ': ' + name : '';
      return ctx.stylize('[Function' + nameSuffix + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toUTCString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = ''
    , array = false
    , typedArray = false
    , braces = ['{', '}'];

  if (isTypedArray(value)) {
    typedArray = true;
    braces = ['[', ']'];
  }

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (typeof value === 'function') {
    name = getName(value);
    nameSuffix = name ? ': ' + name : '';
    base = ' [Function' + nameSuffix + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    return formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else if (typedArray) {
    return formatTypedArray(value);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}

function formatPrimitive(ctx, value) {
  switch (typeof value) {
    case 'undefined':
      return ctx.stylize('undefined', 'undefined');

    case 'string':
      var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                               .replace(/'/g, "\\'")
                                               .replace(/\\"/g, '"') + '\'';
      return ctx.stylize(simple, 'string');

    case 'number':
      if (value === 0 && (1/value) === -Infinity) {
        return ctx.stylize('-0', 'number');
      }
      return ctx.stylize('' + value, 'number');

    case 'boolean':
      return ctx.stylize('' + value, 'boolean');

    case 'symbol':
      return ctx.stylize(value.toString(), 'symbol');
  }
  // For some reason typeof null is "object", so special case here.
  if (value === null) {
    return ctx.stylize('null', 'null');
  }
}

function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}

function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (Object.prototype.hasOwnProperty.call(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }

  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}

function formatTypedArray(value) {
  var str = '[ ';

  for (var i = 0; i < value.length; ++i) {
    if (str.length >= config.truncateThreshold - 7) {
      str += '...';
      break;
    }
    str += value[i] + ', ';
  }
  str += ' ]';

  // Removing trailing `, ` if the array was not truncated
  if (str.indexOf(',  ]') !== -1) {
    str = str.replace(',  ]', ' ]');
  }

  return str;
}

function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name;
  var propDescriptor = Object.getOwnPropertyDescriptor(value, key);
  var str;

  if (propDescriptor) {
    if (propDescriptor.get) {
      if (propDescriptor.set) {
        str = ctx.stylize('[Getter/Setter]', 'special');
      } else {
        str = ctx.stylize('[Getter]', 'special');
      }
    } else {
      if (propDescriptor.set) {
        str = ctx.stylize('[Setter]', 'special');
      }
    }
  }
  if (visibleKeys.indexOf(key) < 0) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(value[key]) < 0) {
      if (recurseTimes === null) {
        str = formatValue(ctx, value[key], null);
      } else {
        str = formatValue(ctx, value[key], recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (typeof name === 'undefined') {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}

function reduceToSingleString(output, base, braces) {
  var length = output.reduce(function(prev, cur) {
    return prev + cur.length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}

function isTypedArray(ar) {
  // Unfortunately there's no way to check if an object is a TypedArray
  // We have to check if it's one of these types
  return (typeof ar === 'object' && /\w+Array]$/.test(objectToString(ar)));
}

function isArray(ar) {
  return Array.isArray(ar) ||
         (typeof ar === 'object' && objectToString(ar) === '[object Array]');
}

function isRegExp(re) {
  return typeof re === 'object' && objectToString(re) === '[object RegExp]';
}

function isDate(d) {
  return typeof d === 'object' && objectToString(d) === '[object Date]';
}

function isError(e) {
  return typeof e === 'object' && objectToString(e) === '[object Error]';
}

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

},{"../config":5,"./getEnumerableProperties":18,"./getProperties":22,"get-func-name":36}],25:[function(require,module,exports){
/*!
 * Chai - isNaN utility
 * Copyright(c) 2012-2015 Sakthipriyan Vairamani <thechargingvolcano@gmail.com>
 * MIT Licensed
 */

/**
 * ### .isNaN(value)
 *
 * Checks if the given value is NaN or not.
 *
 *     utils.isNaN(NaN); // true
 *
 * @param {Value} The value which has to be checked if it is NaN
 * @name isNaN
 * @api private
 */

function isNaN(value) {
  // Refer http://www.ecma-international.org/ecma-262/6.0/#sec-isnan-number
  // section's NOTE.
  return value !== value;
}

// If ECMAScript 6's Number.isNaN is present, prefer that.
module.exports = Number.isNaN || isNaN;

},{}],26:[function(require,module,exports){
var config = require('../config');

/*!
 * Chai - isProxyEnabled helper
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .isProxyEnabled()
 *
 * Helper function to check if Chai's proxy protection feature is enabled. If
 * proxies are unsupported or disabled via the user's Chai config, then return
 * false. Otherwise, return true.
 *
 * @namespace Utils
 * @name isProxyEnabled
 */

module.exports = function isProxyEnabled() {
  return config.useProxy &&
    typeof Proxy !== 'undefined' &&
    typeof Reflect !== 'undefined';
};

},{"../config":5}],27:[function(require,module,exports){
/*!
 * Chai - flag utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var inspect = require('./inspect');
var config = require('../config');

/**
 * ### .objDisplay(object)
 *
 * Determines if an object or an array matches
 * criteria to be inspected in-line for error
 * messages or should be truncated.
 *
 * @param {Mixed} javascript object to inspect
 * @name objDisplay
 * @namespace Utils
 * @api public
 */

module.exports = function objDisplay(obj) {
  var str = inspect(obj)
    , type = Object.prototype.toString.call(obj);

  if (config.truncateThreshold && str.length >= config.truncateThreshold) {
    if (type === '[object Function]') {
      return !obj.name || obj.name === ''
        ? '[Function]'
        : '[Function: ' + obj.name + ']';
    } else if (type === '[object Array]') {
      return '[ Array(' + obj.length + ') ]';
    } else if (type === '[object Object]') {
      var keys = Object.keys(obj)
        , kstr = keys.length > 2
          ? keys.splice(0, 2).join(', ') + ', ...'
          : keys.join(', ');
      return '{ Object (' + kstr + ') }';
    } else {
      return str;
    }
  } else {
    return str;
  }
};

},{"../config":5,"./inspect":24}],28:[function(require,module,exports){
/*!
 * Chai - overwriteChainableMethod utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var chai = require('../../chai');
var transferFlags = require('./transferFlags');

/**
 * ### .overwriteChainableMethod(ctx, name, method, chainingBehavior)
 *
 * Overwrites an already existing chainable method
 * and provides access to the previous function or
 * property.  Must return functions to be used for
 * name.
 *
 *     utils.overwriteChainableMethod(chai.Assertion.prototype, 'lengthOf',
 *       function (_super) {
 *       }
 *     , function (_super) {
 *       }
 *     );
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.overwriteChainableMethod('foo', fn, fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(myFoo).to.have.lengthOf(3);
 *     expect(myFoo).to.have.lengthOf.above(3);
 *
 * @param {Object} ctx object whose method / property is to be overwritten
 * @param {String} name of method / property to overwrite
 * @param {Function} method function that returns a function to be used for name
 * @param {Function} chainingBehavior function that returns a function to be used for property
 * @namespace Utils
 * @name overwriteChainableMethod
 * @api public
 */

module.exports = function overwriteChainableMethod(ctx, name, method, chainingBehavior) {
  var chainableBehavior = ctx.__methods[name];

  var _chainingBehavior = chainableBehavior.chainingBehavior;
  chainableBehavior.chainingBehavior = function overwritingChainableMethodGetter() {
    var result = chainingBehavior(_chainingBehavior).call(this);
    if (result !== undefined) {
      return result;
    }

    var newAssertion = new chai.Assertion();
    transferFlags(this, newAssertion);
    return newAssertion;
  };

  var _method = chainableBehavior.method;
  chainableBehavior.method = function overwritingChainableMethodWrapper() {
    var result = method(_method).apply(this, arguments);
    if (result !== undefined) {
      return result;
    }

    var newAssertion = new chai.Assertion();
    transferFlags(this, newAssertion);
    return newAssertion;
  };
};

},{"../../chai":3,"./transferFlags":33}],29:[function(require,module,exports){
/*!
 * Chai - overwriteMethod utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var addLengthGuard = require('./addLengthGuard');
var chai = require('../../chai');
var flag = require('./flag');
var proxify = require('./proxify');
var transferFlags = require('./transferFlags');

/**
 * ### .overwriteMethod(ctx, name, fn)
 *
 * Overwrites an already existing method and provides
 * access to previous function. Must return function
 * to be used for name.
 *
 *     utils.overwriteMethod(chai.Assertion.prototype, 'equal', function (_super) {
 *       return function (str) {
 *         var obj = utils.flag(this, 'object');
 *         if (obj instanceof Foo) {
 *           new chai.Assertion(obj.value).to.equal(str);
 *         } else {
 *           _super.apply(this, arguments);
 *         }
 *       }
 *     });
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.overwriteMethod('foo', fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(myFoo).to.equal('bar');
 *
 * @param {Object} ctx object whose method is to be overwritten
 * @param {String} name of method to overwrite
 * @param {Function} method function that returns a function to be used for name
 * @namespace Utils
 * @name overwriteMethod
 * @api public
 */

module.exports = function overwriteMethod(ctx, name, method) {
  var _method = ctx[name]
    , _super = function () {
      throw new Error(name + ' is not a function');
    };

  if (_method && 'function' === typeof _method)
    _super = _method;

  var overwritingMethodWrapper = function () {
    // Setting the `ssfi` flag to `overwritingMethodWrapper` causes this
    // function to be the starting point for removing implementation frames from
    // the stack trace of a failed assertion.
    //
    // However, we only want to use this function as the starting point if the
    // `lockSsfi` flag isn't set.
    //
    // If the `lockSsfi` flag is set, then either this assertion has been
    // overwritten by another assertion, or this assertion is being invoked from
    // inside of another assertion. In the first case, the `ssfi` flag has
    // already been set by the overwriting assertion. In the second case, the
    // `ssfi` flag has already been set by the outer assertion.
    if (!flag(this, 'lockSsfi')) {
      flag(this, 'ssfi', overwritingMethodWrapper);
    }

    // Setting the `lockSsfi` flag to `true` prevents the overwritten assertion
    // from changing the `ssfi` flag. By this point, the `ssfi` flag is already
    // set to the correct starting point for this assertion.
    var origLockSsfi = flag(this, 'lockSsfi');
    flag(this, 'lockSsfi', true);
    var result = method(_super).apply(this, arguments);
    flag(this, 'lockSsfi', origLockSsfi);

    if (result !== undefined) {
      return result;
    }

    var newAssertion = new chai.Assertion();
    transferFlags(this, newAssertion);
    return newAssertion;
  }

  addLengthGuard(overwritingMethodWrapper, name, false);
  ctx[name] = proxify(overwritingMethodWrapper, name);
};

},{"../../chai":3,"./addLengthGuard":11,"./flag":16,"./proxify":31,"./transferFlags":33}],30:[function(require,module,exports){
/*!
 * Chai - overwriteProperty utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var chai = require('../../chai');
var flag = require('./flag');
var isProxyEnabled = require('./isProxyEnabled');
var transferFlags = require('./transferFlags');

/**
 * ### .overwriteProperty(ctx, name, fn)
 *
 * Overwrites an already existing property getter and provides
 * access to previous value. Must return function to use as getter.
 *
 *     utils.overwriteProperty(chai.Assertion.prototype, 'ok', function (_super) {
 *       return function () {
 *         var obj = utils.flag(this, 'object');
 *         if (obj instanceof Foo) {
 *           new chai.Assertion(obj.name).to.equal('bar');
 *         } else {
 *           _super.call(this);
 *         }
 *       }
 *     });
 *
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.overwriteProperty('foo', fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(myFoo).to.be.ok;
 *
 * @param {Object} ctx object whose property is to be overwritten
 * @param {String} name of property to overwrite
 * @param {Function} getter function that returns a getter function to be used for name
 * @namespace Utils
 * @name overwriteProperty
 * @api public
 */

module.exports = function overwriteProperty(ctx, name, getter) {
  var _get = Object.getOwnPropertyDescriptor(ctx, name)
    , _super = function () {};

  if (_get && 'function' === typeof _get.get)
    _super = _get.get

  Object.defineProperty(ctx, name,
    { get: function overwritingPropertyGetter() {
        // Setting the `ssfi` flag to `overwritingPropertyGetter` causes this
        // function to be the starting point for removing implementation frames
        // from the stack trace of a failed assertion.
        //
        // However, we only want to use this function as the starting point if
        // the `lockSsfi` flag isn't set and proxy protection is disabled.
        //
        // If the `lockSsfi` flag is set, then either this assertion has been
        // overwritten by another assertion, or this assertion is being invoked
        // from inside of another assertion. In the first case, the `ssfi` flag
        // has already been set by the overwriting assertion. In the second
        // case, the `ssfi` flag has already been set by the outer assertion.
        //
        // If proxy protection is enabled, then the `ssfi` flag has already been
        // set by the proxy getter.
        if (!isProxyEnabled() && !flag(this, 'lockSsfi')) {
          flag(this, 'ssfi', overwritingPropertyGetter);
        }

        // Setting the `lockSsfi` flag to `true` prevents the overwritten
        // assertion from changing the `ssfi` flag. By this point, the `ssfi`
        // flag is already set to the correct starting point for this assertion.
        var origLockSsfi = flag(this, 'lockSsfi');
        flag(this, 'lockSsfi', true);
        var result = getter(_super).call(this);
        flag(this, 'lockSsfi', origLockSsfi);

        if (result !== undefined) {
          return result;
        }

        var newAssertion = new chai.Assertion();
        transferFlags(this, newAssertion);
        return newAssertion;
      }
    , configurable: true
  });
};

},{"../../chai":3,"./flag":16,"./isProxyEnabled":26,"./transferFlags":33}],31:[function(require,module,exports){
var config = require('../config');
var flag = require('./flag');
var getProperties = require('./getProperties');
var isProxyEnabled = require('./isProxyEnabled');

/*!
 * Chai - proxify utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .proxify(object)
 *
 * Return a proxy of given object that throws an error when a non-existent
 * property is read. By default, the root cause is assumed to be a misspelled
 * property, and thus an attempt is made to offer a reasonable suggestion from
 * the list of existing properties. However, if a nonChainableMethodName is
 * provided, then the root cause is instead a failure to invoke a non-chainable
 * method prior to reading the non-existent property.
 *
 * If proxies are unsupported or disabled via the user's Chai config, then
 * return object without modification.
 *
 * @param {Object} obj
 * @param {String} nonChainableMethodName
 * @namespace Utils
 * @name proxify
 */

var builtins = ['__flags', '__methods', '_obj', 'assert'];

module.exports = function proxify(obj, nonChainableMethodName) {
  if (!isProxyEnabled()) return obj;

  return new Proxy(obj, {
    get: function proxyGetter(target, property) {
      // This check is here because we should not throw errors on Symbol properties
      // such as `Symbol.toStringTag`.
      // The values for which an error should be thrown can be configured using
      // the `config.proxyExcludedKeys` setting.
      if (typeof property === 'string' &&
          config.proxyExcludedKeys.indexOf(property) === -1 &&
          !Reflect.has(target, property)) {
        // Special message for invalid property access of non-chainable methods.
        if (nonChainableMethodName) {
          throw Error('Invalid Chai property: ' + nonChainableMethodName + '.' +
            property + '. See docs for proper usage of "' +
            nonChainableMethodName + '".');
        }

        // If the property is reasonably close to an existing Chai property,
        // suggest that property to the user. Only suggest properties with a
        // distance less than 4.
        var suggestion = null;
        var suggestionDistance = 4;
        getProperties(target).forEach(function(prop) {
          if (
            !Object.prototype.hasOwnProperty(prop) &&
            builtins.indexOf(prop) === -1
          ) {
            var dist = stringDistanceCapped(
              property,
              prop,
              suggestionDistance
            );
            if (dist < suggestionDistance) {
              suggestion = prop;
              suggestionDistance = dist;
            }
          }
        });

        if (suggestion !== null) {
          throw Error('Invalid Chai property: ' + property +
            '. Did you mean "' + suggestion + '"?');
        } else {
          throw Error('Invalid Chai property: ' + property);
        }
      }

      // Use this proxy getter as the starting point for removing implementation
      // frames from the stack trace of a failed assertion. For property
      // assertions, this prevents the proxy getter from showing up in the stack
      // trace since it's invoked before the property getter. For method and
      // chainable method assertions, this flag will end up getting changed to
      // the method wrapper, which is good since this frame will no longer be in
      // the stack once the method is invoked. Note that Chai builtin assertion
      // properties such as `__flags` are skipped since this is only meant to
      // capture the starting point of an assertion. This step is also skipped
      // if the `lockSsfi` flag is set, thus indicating that this assertion is
      // being called from within another assertion. In that case, the `ssfi`
      // flag is already set to the outer assertion's starting point.
      if (builtins.indexOf(property) === -1 && !flag(target, 'lockSsfi')) {
        flag(target, 'ssfi', proxyGetter);
      }

      return Reflect.get(target, property);
    }
  });
};

/**
 * # stringDistanceCapped(strA, strB, cap)
 * Return the Levenshtein distance between two strings, but no more than cap.
 * @param {string} strA
 * @param {string} strB
 * @param {number} number
 * @return {number} min(string distance between strA and strB, cap)
 * @api private
 */

function stringDistanceCapped(strA, strB, cap) {
  if (Math.abs(strA.length - strB.length) >= cap) {
    return cap;
  }

  var memo = [];
  // `memo` is a two-dimensional array containing distances.
  // memo[i][j] is the distance between strA.slice(0, i) and
  // strB.slice(0, j).
  for (var i = 0; i <= strA.length; i++) {
    memo[i] = Array(strB.length + 1).fill(0);
    memo[i][0] = i;
  }
  for (var j = 0; j < strB.length; j++) {
    memo[0][j] = j;
  }

  for (var i = 1; i <= strA.length; i++) {
    var ch = strA.charCodeAt(i - 1);
    for (var j = 1; j <= strB.length; j++) {
      if (Math.abs(i - j) >= cap) {
        memo[i][j] = cap;
        continue;
      }
      memo[i][j] = Math.min(
        memo[i - 1][j] + 1,
        memo[i][j - 1] + 1,
        memo[i - 1][j - 1] +
          (ch === strB.charCodeAt(j - 1) ? 0 : 1)
      );
    }
  }

  return memo[strA.length][strB.length];
}

},{"../config":5,"./flag":16,"./getProperties":22,"./isProxyEnabled":26}],32:[function(require,module,exports){
/*!
 * Chai - test utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var flag = require('./flag');

/**
 * ### .test(object, expression)
 *
 * Test and object for expression.
 *
 * @param {Object} object (constructed Assertion)
 * @param {Arguments} chai.Assertion.prototype.assert arguments
 * @namespace Utils
 * @name test
 */

module.exports = function test(obj, args) {
  var negate = flag(obj, 'negate')
    , expr = args[0];
  return negate ? !expr : expr;
};

},{"./flag":16}],33:[function(require,module,exports){
/*!
 * Chai - transferFlags utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .transferFlags(assertion, object, includeAll = true)
 *
 * Transfer all the flags for `assertion` to `object`. If
 * `includeAll` is set to `false`, then the base Chai
 * assertion flags (namely `object`, `ssfi`, `lockSsfi`,
 * and `message`) will not be transferred.
 *
 *
 *     var newAssertion = new Assertion();
 *     utils.transferFlags(assertion, newAssertion);
 *
 *     var anotherAssertion = new Assertion(myObj);
 *     utils.transferFlags(assertion, anotherAssertion, false);
 *
 * @param {Assertion} assertion the assertion to transfer the flags from
 * @param {Object} object the object to transfer the flags to; usually a new assertion
 * @param {Boolean} includeAll
 * @namespace Utils
 * @name transferFlags
 * @api private
 */

module.exports = function transferFlags(assertion, object, includeAll) {
  var flags = assertion.__flags || (assertion.__flags = Object.create(null));

  if (!object.__flags) {
    object.__flags = Object.create(null);
  }

  includeAll = arguments.length === 3 ? includeAll : true;

  for (var flag in flags) {
    if (includeAll ||
        (flag !== 'object' && flag !== 'ssfi' && flag !== 'lockSsfi' && flag != 'message')) {
      object.__flags[flag] = flags[flag];
    }
  }
};

},{}],34:[function(require,module,exports){
'use strict';

/* !
 * Chai - checkError utility
 * Copyright(c) 2012-2016 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .checkError
 *
 * Checks that an error conforms to a given set of criteria and/or retrieves information about it.
 *
 * @api public
 */

/**
 * ### .compatibleInstance(thrown, errorLike)
 *
 * Checks if two instances are compatible (strict equal).
 * Returns false if errorLike is not an instance of Error, because instances
 * can only be compatible if they're both error instances.
 *
 * @name compatibleInstance
 * @param {Error} thrown error
 * @param {Error|ErrorConstructor} errorLike object to compare against
 * @namespace Utils
 * @api public
 */

function compatibleInstance(thrown, errorLike) {
  return errorLike instanceof Error && thrown === errorLike;
}

/**
 * ### .compatibleConstructor(thrown, errorLike)
 *
 * Checks if two constructors are compatible.
 * This function can receive either an error constructor or
 * an error instance as the `errorLike` argument.
 * Constructors are compatible if they're the same or if one is
 * an instance of another.
 *
 * @name compatibleConstructor
 * @param {Error} thrown error
 * @param {Error|ErrorConstructor} errorLike object to compare against
 * @namespace Utils
 * @api public
 */

function compatibleConstructor(thrown, errorLike) {
  if (errorLike instanceof Error) {
    // If `errorLike` is an instance of any error we compare their constructors
    return thrown.constructor === errorLike.constructor || thrown instanceof errorLike.constructor;
  } else if (errorLike.prototype instanceof Error || errorLike === Error) {
    // If `errorLike` is a constructor that inherits from Error, we compare `thrown` to `errorLike` directly
    return thrown.constructor === errorLike || thrown instanceof errorLike;
  }

  return false;
}

/**
 * ### .compatibleMessage(thrown, errMatcher)
 *
 * Checks if an error's message is compatible with a matcher (String or RegExp).
 * If the message contains the String or passes the RegExp test,
 * it is considered compatible.
 *
 * @name compatibleMessage
 * @param {Error} thrown error
 * @param {String|RegExp} errMatcher to look for into the message
 * @namespace Utils
 * @api public
 */

function compatibleMessage(thrown, errMatcher) {
  var comparisonString = typeof thrown === 'string' ? thrown : thrown.message;
  if (errMatcher instanceof RegExp) {
    return errMatcher.test(comparisonString);
  } else if (typeof errMatcher === 'string') {
    return comparisonString.indexOf(errMatcher) !== -1; // eslint-disable-line no-magic-numbers
  }

  return false;
}

/**
 * ### .getFunctionName(constructorFn)
 *
 * Returns the name of a function.
 * This also includes a polyfill function if `constructorFn.name` is not defined.
 *
 * @name getFunctionName
 * @param {Function} constructorFn
 * @namespace Utils
 * @api private
 */

var functionNameMatch = /\s*function(?:\s|\s*\/\*[^(?:*\/)]+\*\/\s*)*([^\(\/]+)/;
function getFunctionName(constructorFn) {
  var name = '';
  if (typeof constructorFn.name === 'undefined') {
    // Here we run a polyfill if constructorFn.name is not defined
    var match = String(constructorFn).match(functionNameMatch);
    if (match) {
      name = match[1];
    }
  } else {
    name = constructorFn.name;
  }

  return name;
}

/**
 * ### .getConstructorName(errorLike)
 *
 * Gets the constructor name for an Error instance or constructor itself.
 *
 * @name getConstructorName
 * @param {Error|ErrorConstructor} errorLike
 * @namespace Utils
 * @api public
 */

function getConstructorName(errorLike) {
  var constructorName = errorLike;
  if (errorLike instanceof Error) {
    constructorName = getFunctionName(errorLike.constructor);
  } else if (typeof errorLike === 'function') {
    // If `err` is not an instance of Error it is an error constructor itself or another function.
    // If we've got a common function we get its name, otherwise we may need to create a new instance
    // of the error just in case it's a poorly-constructed error. Please see chaijs/chai/issues/45 to know more.
    constructorName = getFunctionName(errorLike).trim() ||
        getFunctionName(new errorLike()); // eslint-disable-line new-cap
  }

  return constructorName;
}

/**
 * ### .getMessage(errorLike)
 *
 * Gets the error message from an error.
 * If `err` is a String itself, we return it.
 * If the error has no message, we return an empty string.
 *
 * @name getMessage
 * @param {Error|String} errorLike
 * @namespace Utils
 * @api public
 */

function getMessage(errorLike) {
  var msg = '';
  if (errorLike && errorLike.message) {
    msg = errorLike.message;
  } else if (typeof errorLike === 'string') {
    msg = errorLike;
  }

  return msg;
}

module.exports = {
  compatibleInstance: compatibleInstance,
  compatibleConstructor: compatibleConstructor,
  compatibleMessage: compatibleMessage,
  getMessage: getMessage,
  getConstructorName: getConstructorName,
};

},{}],35:[function(require,module,exports){
'use strict';
/* globals Symbol: false, Uint8Array: false, WeakMap: false */
/*!
 * deep-eql
 * Copyright(c) 2013 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var type = require('type-detect');
function FakeMap() {
  this._key = 'chai/deep-eql__' + Math.random() + Date.now();
}

FakeMap.prototype = {
  get: function getMap(key) {
    return key[this._key];
  },
  set: function setMap(key, value) {
    if (Object.isExtensible(key)) {
      Object.defineProperty(key, this._key, {
        value: value,
        configurable: true,
      });
    }
  },
};

var MemoizeMap = typeof WeakMap === 'function' ? WeakMap : FakeMap;
/*!
 * Check to see if the MemoizeMap has recorded a result of the two operands
 *
 * @param {Mixed} leftHandOperand
 * @param {Mixed} rightHandOperand
 * @param {MemoizeMap} memoizeMap
 * @returns {Boolean|null} result
*/
function memoizeCompare(leftHandOperand, rightHandOperand, memoizeMap) {
  // Technically, WeakMap keys can *only* be objects, not primitives.
  if (!memoizeMap || isPrimitive(leftHandOperand) || isPrimitive(rightHandOperand)) {
    return null;
  }
  var leftHandMap = memoizeMap.get(leftHandOperand);
  if (leftHandMap) {
    var result = leftHandMap.get(rightHandOperand);
    if (typeof result === 'boolean') {
      return result;
    }
  }
  return null;
}

/*!
 * Set the result of the equality into the MemoizeMap
 *
 * @param {Mixed} leftHandOperand
 * @param {Mixed} rightHandOperand
 * @param {MemoizeMap} memoizeMap
 * @param {Boolean} result
*/
function memoizeSet(leftHandOperand, rightHandOperand, memoizeMap, result) {
  // Technically, WeakMap keys can *only* be objects, not primitives.
  if (!memoizeMap || isPrimitive(leftHandOperand) || isPrimitive(rightHandOperand)) {
    return;
  }
  var leftHandMap = memoizeMap.get(leftHandOperand);
  if (leftHandMap) {
    leftHandMap.set(rightHandOperand, result);
  } else {
    leftHandMap = new MemoizeMap();
    leftHandMap.set(rightHandOperand, result);
    memoizeMap.set(leftHandOperand, leftHandMap);
  }
}

/*!
 * Primary Export
 */

module.exports = deepEqual;
module.exports.MemoizeMap = MemoizeMap;

/**
 * Assert deeply nested sameValue equality between two objects of any type.
 *
 * @param {Mixed} leftHandOperand
 * @param {Mixed} rightHandOperand
 * @param {Object} [options] (optional) Additional options
 * @param {Array} [options.comparator] (optional) Override default algorithm, determining custom equality.
 * @param {Array} [options.memoize] (optional) Provide a custom memoization object which will cache the results of
    complex objects for a speed boost. By passing `false` you can disable memoization, but this will cause circular
    references to blow the stack.
 * @return {Boolean} equal match
 */
function deepEqual(leftHandOperand, rightHandOperand, options) {
  // If we have a comparator, we can't assume anything; so bail to its check first.
  if (options && options.comparator) {
    return extensiveDeepEqual(leftHandOperand, rightHandOperand, options);
  }

  var simpleResult = simpleEqual(leftHandOperand, rightHandOperand);
  if (simpleResult !== null) {
    return simpleResult;
  }

  // Deeper comparisons are pushed through to a larger function
  return extensiveDeepEqual(leftHandOperand, rightHandOperand, options);
}

/**
 * Many comparisons can be canceled out early via simple equality or primitive checks.
 * @param {Mixed} leftHandOperand
 * @param {Mixed} rightHandOperand
 * @return {Boolean|null} equal match
 */
function simpleEqual(leftHandOperand, rightHandOperand) {
  // Equal references (except for Numbers) can be returned early
  if (leftHandOperand === rightHandOperand) {
    // Handle +-0 cases
    return leftHandOperand !== 0 || 1 / leftHandOperand === 1 / rightHandOperand;
  }

  // handle NaN cases
  if (
    leftHandOperand !== leftHandOperand && // eslint-disable-line no-self-compare
    rightHandOperand !== rightHandOperand // eslint-disable-line no-self-compare
  ) {
    return true;
  }

  // Anything that is not an 'object', i.e. symbols, functions, booleans, numbers,
  // strings, and undefined, can be compared by reference.
  if (isPrimitive(leftHandOperand) || isPrimitive(rightHandOperand)) {
    // Easy out b/c it would have passed the first equality check
    return false;
  }
  return null;
}

/*!
 * The main logic of the `deepEqual` function.
 *
 * @param {Mixed} leftHandOperand
 * @param {Mixed} rightHandOperand
 * @param {Object} [options] (optional) Additional options
 * @param {Array} [options.comparator] (optional) Override default algorithm, determining custom equality.
 * @param {Array} [options.memoize] (optional) Provide a custom memoization object which will cache the results of
    complex objects for a speed boost. By passing `false` you can disable memoization, but this will cause circular
    references to blow the stack.
 * @return {Boolean} equal match
*/
function extensiveDeepEqual(leftHandOperand, rightHandOperand, options) {
  options = options || {};
  options.memoize = options.memoize === false ? false : options.memoize || new MemoizeMap();
  var comparator = options && options.comparator;

  // Check if a memoized result exists.
  var memoizeResultLeft = memoizeCompare(leftHandOperand, rightHandOperand, options.memoize);
  if (memoizeResultLeft !== null) {
    return memoizeResultLeft;
  }
  var memoizeResultRight = memoizeCompare(rightHandOperand, leftHandOperand, options.memoize);
  if (memoizeResultRight !== null) {
    return memoizeResultRight;
  }

  // If a comparator is present, use it.
  if (comparator) {
    var comparatorResult = comparator(leftHandOperand, rightHandOperand);
    // Comparators may return null, in which case we want to go back to default behavior.
    if (comparatorResult === false || comparatorResult === true) {
      memoizeSet(leftHandOperand, rightHandOperand, options.memoize, comparatorResult);
      return comparatorResult;
    }
    // To allow comparators to override *any* behavior, we ran them first. Since it didn't decide
    // what to do, we need to make sure to return the basic tests first before we move on.
    var simpleResult = simpleEqual(leftHandOperand, rightHandOperand);
    if (simpleResult !== null) {
      // Don't memoize this, it takes longer to set/retrieve than to just compare.
      return simpleResult;
    }
  }

  var leftHandType = type(leftHandOperand);
  if (leftHandType !== type(rightHandOperand)) {
    memoizeSet(leftHandOperand, rightHandOperand, options.memoize, false);
    return false;
  }

  // Temporarily set the operands in the memoize object to prevent blowing the stack
  memoizeSet(leftHandOperand, rightHandOperand, options.memoize, true);

  var result = extensiveDeepEqualByType(leftHandOperand, rightHandOperand, leftHandType, options);
  memoizeSet(leftHandOperand, rightHandOperand, options.memoize, result);
  return result;
}

function extensiveDeepEqualByType(leftHandOperand, rightHandOperand, leftHandType, options) {
  switch (leftHandType) {
    case 'String':
    case 'Number':
    case 'Boolean':
    case 'Date':
      // If these types are their instance types (e.g. `new Number`) then re-deepEqual against their values
      return deepEqual(leftHandOperand.valueOf(), rightHandOperand.valueOf());
    case 'Promise':
    case 'Symbol':
    case 'function':
    case 'WeakMap':
    case 'WeakSet':
    case 'Error':
      return leftHandOperand === rightHandOperand;
    case 'Arguments':
    case 'Int8Array':
    case 'Uint8Array':
    case 'Uint8ClampedArray':
    case 'Int16Array':
    case 'Uint16Array':
    case 'Int32Array':
    case 'Uint32Array':
    case 'Float32Array':
    case 'Float64Array':
    case 'Array':
      return iterableEqual(leftHandOperand, rightHandOperand, options);
    case 'RegExp':
      return regexpEqual(leftHandOperand, rightHandOperand);
    case 'Generator':
      return generatorEqual(leftHandOperand, rightHandOperand, options);
    case 'DataView':
      return iterableEqual(new Uint8Array(leftHandOperand.buffer), new Uint8Array(rightHandOperand.buffer), options);
    case 'ArrayBuffer':
      return iterableEqual(new Uint8Array(leftHandOperand), new Uint8Array(rightHandOperand), options);
    case 'Set':
      return entriesEqual(leftHandOperand, rightHandOperand, options);
    case 'Map':
      return entriesEqual(leftHandOperand, rightHandOperand, options);
    default:
      return objectEqual(leftHandOperand, rightHandOperand, options);
  }
}

/*!
 * Compare two Regular Expressions for equality.
 *
 * @param {RegExp} leftHandOperand
 * @param {RegExp} rightHandOperand
 * @return {Boolean} result
 */

function regexpEqual(leftHandOperand, rightHandOperand) {
  return leftHandOperand.toString() === rightHandOperand.toString();
}

/*!
 * Compare two Sets/Maps for equality. Faster than other equality functions.
 *
 * @param {Set} leftHandOperand
 * @param {Set} rightHandOperand
 * @param {Object} [options] (Optional)
 * @return {Boolean} result
 */

function entriesEqual(leftHandOperand, rightHandOperand, options) {
  // IE11 doesn't support Set#entries or Set#@@iterator, so we need manually populate using Set#forEach
  if (leftHandOperand.size !== rightHandOperand.size) {
    return false;
  }
  if (leftHandOperand.size === 0) {
    return true;
  }
  var leftHandItems = [];
  var rightHandItems = [];
  leftHandOperand.forEach(function gatherEntries(key, value) {
    leftHandItems.push([ key, value ]);
  });
  rightHandOperand.forEach(function gatherEntries(key, value) {
    rightHandItems.push([ key, value ]);
  });
  return iterableEqual(leftHandItems.sort(), rightHandItems.sort(), options);
}

/*!
 * Simple equality for flat iterable objects such as Arrays, TypedArrays or Node.js buffers.
 *
 * @param {Iterable} leftHandOperand
 * @param {Iterable} rightHandOperand
 * @param {Object} [options] (Optional)
 * @return {Boolean} result
 */

function iterableEqual(leftHandOperand, rightHandOperand, options) {
  var length = leftHandOperand.length;
  if (length !== rightHandOperand.length) {
    return false;
  }
  if (length === 0) {
    return true;
  }
  var index = -1;
  while (++index < length) {
    if (deepEqual(leftHandOperand[index], rightHandOperand[index], options) === false) {
      return false;
    }
  }
  return true;
}

/*!
 * Simple equality for generator objects such as those returned by generator functions.
 *
 * @param {Iterable} leftHandOperand
 * @param {Iterable} rightHandOperand
 * @param {Object} [options] (Optional)
 * @return {Boolean} result
 */

function generatorEqual(leftHandOperand, rightHandOperand, options) {
  return iterableEqual(getGeneratorEntries(leftHandOperand), getGeneratorEntries(rightHandOperand), options);
}

/*!
 * Determine if the given object has an @@iterator function.
 *
 * @param {Object} target
 * @return {Boolean} `true` if the object has an @@iterator function.
 */
function hasIteratorFunction(target) {
  return typeof Symbol !== 'undefined' &&
    typeof target === 'object' &&
    typeof Symbol.iterator !== 'undefined' &&
    typeof target[Symbol.iterator] === 'function';
}

/*!
 * Gets all iterator entries from the given Object. If the Object has no @@iterator function, returns an empty array.
 * This will consume the iterator - which could have side effects depending on the @@iterator implementation.
 *
 * @param {Object} target
 * @returns {Array} an array of entries from the @@iterator function
 */
function getIteratorEntries(target) {
  if (hasIteratorFunction(target)) {
    try {
      return getGeneratorEntries(target[Symbol.iterator]());
    } catch (iteratorError) {
      return [];
    }
  }
  return [];
}

/*!
 * Gets all entries from a Generator. This will consume the generator - which could have side effects.
 *
 * @param {Generator} target
 * @returns {Array} an array of entries from the Generator.
 */
function getGeneratorEntries(generator) {
  var generatorResult = generator.next();
  var accumulator = [ generatorResult.value ];
  while (generatorResult.done === false) {
    generatorResult = generator.next();
    accumulator.push(generatorResult.value);
  }
  return accumulator;
}

/*!
 * Gets all own and inherited enumerable keys from a target.
 *
 * @param {Object} target
 * @returns {Array} an array of own and inherited enumerable keys from the target.
 */
function getEnumerableKeys(target) {
  var keys = [];
  for (var key in target) {
    keys.push(key);
  }
  return keys;
}

/*!
 * Determines if two objects have matching values, given a set of keys. Defers to deepEqual for the equality check of
 * each key. If any value of the given key is not equal, the function will return false (early).
 *
 * @param {Mixed} leftHandOperand
 * @param {Mixed} rightHandOperand
 * @param {Array} keys An array of keys to compare the values of leftHandOperand and rightHandOperand against
 * @param {Object} [options] (Optional)
 * @return {Boolean} result
 */
function keysEqual(leftHandOperand, rightHandOperand, keys, options) {
  var length = keys.length;
  if (length === 0) {
    return true;
  }
  for (var i = 0; i < length; i += 1) {
    if (deepEqual(leftHandOperand[keys[i]], rightHandOperand[keys[i]], options) === false) {
      return false;
    }
  }
  return true;
}

/*!
 * Recursively check the equality of two Objects. Once basic sameness has been established it will defer to `deepEqual`
 * for each enumerable key in the object.
 *
 * @param {Mixed} leftHandOperand
 * @param {Mixed} rightHandOperand
 * @param {Object} [options] (Optional)
 * @return {Boolean} result
 */

function objectEqual(leftHandOperand, rightHandOperand, options) {
  var leftHandKeys = getEnumerableKeys(leftHandOperand);
  var rightHandKeys = getEnumerableKeys(rightHandOperand);
  if (leftHandKeys.length && leftHandKeys.length === rightHandKeys.length) {
    leftHandKeys.sort();
    rightHandKeys.sort();
    if (iterableEqual(leftHandKeys, rightHandKeys) === false) {
      return false;
    }
    return keysEqual(leftHandOperand, rightHandOperand, leftHandKeys, options);
  }

  var leftHandEntries = getIteratorEntries(leftHandOperand);
  var rightHandEntries = getIteratorEntries(rightHandOperand);
  if (leftHandEntries.length && leftHandEntries.length === rightHandEntries.length) {
    leftHandEntries.sort();
    rightHandEntries.sort();
    return iterableEqual(leftHandEntries, rightHandEntries, options);
  }

  if (leftHandKeys.length === 0 &&
      leftHandEntries.length === 0 &&
      rightHandKeys.length === 0 &&
      rightHandEntries.length === 0) {
    return true;
  }

  return false;
}

/*!
 * Returns true if the argument is a primitive.
 *
 * This intentionally returns true for all objects that can be compared by reference,
 * including functions and symbols.
 *
 * @param {Mixed} value
 * @return {Boolean} result
 */
function isPrimitive(value) {
  return value === null || typeof value !== 'object';
}

},{"type-detect":38}],36:[function(require,module,exports){
'use strict';

/* !
 * Chai - getFuncName utility
 * Copyright(c) 2012-2016 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .getFuncName(constructorFn)
 *
 * Returns the name of a function.
 * When a non-function instance is passed, returns `null`.
 * This also includes a polyfill function if `aFunc.name` is not defined.
 *
 * @name getFuncName
 * @param {Function} funct
 * @namespace Utils
 * @api public
 */

var toString = Function.prototype.toString;
var functionNameMatch = /\s*function(?:\s|\s*\/\*[^(?:*\/)]+\*\/\s*)*([^\s\(\/]+)/;
function getFuncName(aFunc) {
  if (typeof aFunc !== 'function') {
    return null;
  }

  var name = '';
  if (typeof Function.prototype.name === 'undefined' && typeof aFunc.name === 'undefined') {
    // Here we run a polyfill if Function does not support the `name` property and if aFunc.name is not defined
    var match = toString.call(aFunc).match(functionNameMatch);
    if (match) {
      name = match[1];
    }
  } else {
    // If we've got a `name` property we just use it
    name = aFunc.name;
  }

  return name;
}

module.exports = getFuncName;

},{}],37:[function(require,module,exports){
'use strict';

/* !
 * Chai - pathval utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * @see https://github.com/logicalparadox/filtr
 * MIT Licensed
 */

/**
 * ### .hasProperty(object, name)
 *
 * This allows checking whether an object has own
 * or inherited from prototype chain named property.
 *
 * Basically does the same thing as the `in`
 * operator but works properly with null/undefined values
 * and other primitives.
 *
 *     var obj = {
 *         arr: ['a', 'b', 'c']
 *       , str: 'Hello'
 *     }
 *
 * The following would be the results.
 *
 *     hasProperty(obj, 'str');  // true
 *     hasProperty(obj, 'constructor');  // true
 *     hasProperty(obj, 'bar');  // false
 *
 *     hasProperty(obj.str, 'length'); // true
 *     hasProperty(obj.str, 1);  // true
 *     hasProperty(obj.str, 5);  // false
 *
 *     hasProperty(obj.arr, 'length');  // true
 *     hasProperty(obj.arr, 2);  // true
 *     hasProperty(obj.arr, 3);  // false
 *
 * @param {Object} object
 * @param {String|Symbol} name
 * @returns {Boolean} whether it exists
 * @namespace Utils
 * @name hasProperty
 * @api public
 */

function hasProperty(obj, name) {
  if (typeof obj === 'undefined' || obj === null) {
    return false;
  }

  // The `in` operator does not work with primitives.
  return name in Object(obj);
}

/* !
 * ## parsePath(path)
 *
 * Helper function used to parse string object
 * paths. Use in conjunction with `internalGetPathValue`.
 *
 *      var parsed = parsePath('myobject.property.subprop');
 *
 * ### Paths:
 *
 * * Can be infinitely deep and nested.
 * * Arrays are also valid using the formal `myobject.document[3].property`.
 * * Literal dots and brackets (not delimiter) must be backslash-escaped.
 *
 * @param {String} path
 * @returns {Object} parsed
 * @api private
 */

function parsePath(path) {
  var str = path.replace(/([^\\])\[/g, '$1.[');
  var parts = str.match(/(\\\.|[^.]+?)+/g);
  return parts.map(function mapMatches(value) {
    var regexp = /^\[(\d+)\]$/;
    var mArr = regexp.exec(value);
    var parsed = null;
    if (mArr) {
      parsed = { i: parseFloat(mArr[1]) };
    } else {
      parsed = { p: value.replace(/\\([.\[\]])/g, '$1') };
    }

    return parsed;
  });
}

/* !
 * ## internalGetPathValue(obj, parsed[, pathDepth])
 *
 * Helper companion function for `.parsePath` that returns
 * the value located at the parsed address.
 *
 *      var value = getPathValue(obj, parsed);
 *
 * @param {Object} object to search against
 * @param {Object} parsed definition from `parsePath`.
 * @param {Number} depth (nesting level) of the property we want to retrieve
 * @returns {Object|Undefined} value
 * @api private
 */

function internalGetPathValue(obj, parsed, pathDepth) {
  var temporaryValue = obj;
  var res = null;
  pathDepth = (typeof pathDepth === 'undefined' ? parsed.length : pathDepth);

  for (var i = 0; i < pathDepth; i++) {
    var part = parsed[i];
    if (temporaryValue) {
      if (typeof part.p === 'undefined') {
        temporaryValue = temporaryValue[part.i];
      } else {
        temporaryValue = temporaryValue[part.p];
      }

      if (i === (pathDepth - 1)) {
        res = temporaryValue;
      }
    }
  }

  return res;
}

/* !
 * ## internalSetPathValue(obj, value, parsed)
 *
 * Companion function for `parsePath` that sets
 * the value located at a parsed address.
 *
 *  internalSetPathValue(obj, 'value', parsed);
 *
 * @param {Object} object to search and define on
 * @param {*} value to use upon set
 * @param {Object} parsed definition from `parsePath`
 * @api private
 */

function internalSetPathValue(obj, val, parsed) {
  var tempObj = obj;
  var pathDepth = parsed.length;
  var part = null;
  // Here we iterate through every part of the path
  for (var i = 0; i < pathDepth; i++) {
    var propName = null;
    var propVal = null;
    part = parsed[i];

    // If it's the last part of the path, we set the 'propName' value with the property name
    if (i === (pathDepth - 1)) {
      propName = typeof part.p === 'undefined' ? part.i : part.p;
      // Now we set the property with the name held by 'propName' on object with the desired val
      tempObj[propName] = val;
    } else if (typeof part.p !== 'undefined' && tempObj[part.p]) {
      tempObj = tempObj[part.p];
    } else if (typeof part.i !== 'undefined' && tempObj[part.i]) {
      tempObj = tempObj[part.i];
    } else {
      // If the obj doesn't have the property we create one with that name to define it
      var next = parsed[i + 1];
      // Here we set the name of the property which will be defined
      propName = typeof part.p === 'undefined' ? part.i : part.p;
      // Here we decide if this property will be an array or a new object
      propVal = typeof next.p === 'undefined' ? [] : {};
      tempObj[propName] = propVal;
      tempObj = tempObj[propName];
    }
  }
}

/**
 * ### .getPathInfo(object, path)
 *
 * This allows the retrieval of property info in an
 * object given a string path.
 *
 * The path info consists of an object with the
 * following properties:
 *
 * * parent - The parent object of the property referenced by `path`
 * * name - The name of the final property, a number if it was an array indexer
 * * value - The value of the property, if it exists, otherwise `undefined`
 * * exists - Whether the property exists or not
 *
 * @param {Object} object
 * @param {String} path
 * @returns {Object} info
 * @namespace Utils
 * @name getPathInfo
 * @api public
 */

function getPathInfo(obj, path) {
  var parsed = parsePath(path);
  var last = parsed[parsed.length - 1];
  var info = {
    parent: parsed.length > 1 ? internalGetPathValue(obj, parsed, parsed.length - 1) : obj,
    name: last.p || last.i,
    value: internalGetPathValue(obj, parsed),
  };
  info.exists = hasProperty(info.parent, info.name);

  return info;
}

/**
 * ### .getPathValue(object, path)
 *
 * This allows the retrieval of values in an
 * object given a string path.
 *
 *     var obj = {
 *         prop1: {
 *             arr: ['a', 'b', 'c']
 *           , str: 'Hello'
 *         }
 *       , prop2: {
 *             arr: [ { nested: 'Universe' } ]
 *           , str: 'Hello again!'
 *         }
 *     }
 *
 * The following would be the results.
 *
 *     getPathValue(obj, 'prop1.str'); // Hello
 *     getPathValue(obj, 'prop1.att[2]'); // b
 *     getPathValue(obj, 'prop2.arr[0].nested'); // Universe
 *
 * @param {Object} object
 * @param {String} path
 * @returns {Object} value or `undefined`
 * @namespace Utils
 * @name getPathValue
 * @api public
 */

function getPathValue(obj, path) {
  var info = getPathInfo(obj, path);
  return info.value;
}

/**
 * ### .setPathValue(object, path, value)
 *
 * Define the value in an object at a given string path.
 *
 * ```js
 * var obj = {
 *     prop1: {
 *         arr: ['a', 'b', 'c']
 *       , str: 'Hello'
 *     }
 *   , prop2: {
 *         arr: [ { nested: 'Universe' } ]
 *       , str: 'Hello again!'
 *     }
 * };
 * ```
 *
 * The following would be acceptable.
 *
 * ```js
 * var properties = require('tea-properties');
 * properties.set(obj, 'prop1.str', 'Hello Universe!');
 * properties.set(obj, 'prop1.arr[2]', 'B');
 * properties.set(obj, 'prop2.arr[0].nested.value', { hello: 'universe' });
 * ```
 *
 * @param {Object} object
 * @param {String} path
 * @param {Mixed} value
 * @api private
 */

function setPathValue(obj, path, val) {
  var parsed = parsePath(path);
  internalSetPathValue(obj, val, parsed);
  return obj;
}

module.exports = {
  hasProperty: hasProperty,
  getPathInfo: getPathInfo,
  getPathValue: getPathValue,
  setPathValue: setPathValue,
};

},{}],38:[function(require,module,exports){
(function (global){
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.typeDetect = factory());
}(this, (function () { 'use strict';

/* !
 * type-detect
 * Copyright(c) 2013 jake luer <jake@alogicalparadox.com>
 * MIT Licensed
 */
var promiseExists = typeof Promise === 'function';

/* eslint-disable no-undef */
var globalObject = typeof self === 'object' ? self : global; // eslint-disable-line id-blacklist

var symbolExists = typeof Symbol !== 'undefined';
var mapExists = typeof Map !== 'undefined';
var setExists = typeof Set !== 'undefined';
var weakMapExists = typeof WeakMap !== 'undefined';
var weakSetExists = typeof WeakSet !== 'undefined';
var dataViewExists = typeof DataView !== 'undefined';
var symbolIteratorExists = symbolExists && typeof Symbol.iterator !== 'undefined';
var symbolToStringTagExists = symbolExists && typeof Symbol.toStringTag !== 'undefined';
var setEntriesExists = setExists && typeof Set.prototype.entries === 'function';
var mapEntriesExists = mapExists && typeof Map.prototype.entries === 'function';
var setIteratorPrototype = setEntriesExists && Object.getPrototypeOf(new Set().entries());
var mapIteratorPrototype = mapEntriesExists && Object.getPrototypeOf(new Map().entries());
var arrayIteratorExists = symbolIteratorExists && typeof Array.prototype[Symbol.iterator] === 'function';
var arrayIteratorPrototype = arrayIteratorExists && Object.getPrototypeOf([][Symbol.iterator]());
var stringIteratorExists = symbolIteratorExists && typeof String.prototype[Symbol.iterator] === 'function';
var stringIteratorPrototype = stringIteratorExists && Object.getPrototypeOf(''[Symbol.iterator]());
var toStringLeftSliceLength = 8;
var toStringRightSliceLength = -1;
/**
 * ### typeOf (obj)
 *
 * Uses `Object.prototype.toString` to determine the type of an object,
 * normalising behaviour across engine versions & well optimised.
 *
 * @param {Mixed} object
 * @return {String} object type
 * @api public
 */
function typeDetect(obj) {
  /* ! Speed optimisation
   * Pre:
   *   string literal     x 3,039,035 ops/sec ±1.62% (78 runs sampled)
   *   boolean literal    x 1,424,138 ops/sec ±4.54% (75 runs sampled)
   *   number literal     x 1,653,153 ops/sec ±1.91% (82 runs sampled)
   *   undefined          x 9,978,660 ops/sec ±1.92% (75 runs sampled)
   *   function           x 2,556,769 ops/sec ±1.73% (77 runs sampled)
   * Post:
   *   string literal     x 38,564,796 ops/sec ±1.15% (79 runs sampled)
   *   boolean literal    x 31,148,940 ops/sec ±1.10% (79 runs sampled)
   *   number literal     x 32,679,330 ops/sec ±1.90% (78 runs sampled)
   *   undefined          x 32,363,368 ops/sec ±1.07% (82 runs sampled)
   *   function           x 31,296,870 ops/sec ±0.96% (83 runs sampled)
   */
  var typeofObj = typeof obj;
  if (typeofObj !== 'object') {
    return typeofObj;
  }

  /* ! Speed optimisation
   * Pre:
   *   null               x 28,645,765 ops/sec ±1.17% (82 runs sampled)
   * Post:
   *   null               x 36,428,962 ops/sec ±1.37% (84 runs sampled)
   */
  if (obj === null) {
    return 'null';
  }

  /* ! Spec Conformance
   * Test: `Object.prototype.toString.call(window)``
   *  - Node === "[object global]"
   *  - Chrome === "[object global]"
   *  - Firefox === "[object Window]"
   *  - PhantomJS === "[object Window]"
   *  - Safari === "[object Window]"
   *  - IE 11 === "[object Window]"
   *  - IE Edge === "[object Window]"
   * Test: `Object.prototype.toString.call(this)``
   *  - Chrome Worker === "[object global]"
   *  - Firefox Worker === "[object DedicatedWorkerGlobalScope]"
   *  - Safari Worker === "[object DedicatedWorkerGlobalScope]"
   *  - IE 11 Worker === "[object WorkerGlobalScope]"
   *  - IE Edge Worker === "[object WorkerGlobalScope]"
   */
  if (obj === globalObject) {
    return 'global';
  }

  /* ! Speed optimisation
   * Pre:
   *   array literal      x 2,888,352 ops/sec ±0.67% (82 runs sampled)
   * Post:
   *   array literal      x 22,479,650 ops/sec ±0.96% (81 runs sampled)
   */
  if (
    Array.isArray(obj) &&
    (symbolToStringTagExists === false || !(Symbol.toStringTag in obj))
  ) {
    return 'Array';
  }

  // Not caching existence of `window` and related properties due to potential
  // for `window` to be unset before tests in quasi-browser environments.
  if (typeof window === 'object' && window !== null) {
    /* ! Spec Conformance
     * (https://html.spec.whatwg.org/multipage/browsers.html#location)
     * WhatWG HTML$7.7.3 - The `Location` interface
     * Test: `Object.prototype.toString.call(window.location)``
     *  - IE <=11 === "[object Object]"
     *  - IE Edge <=13 === "[object Object]"
     */
    if (typeof window.location === 'object' && obj === window.location) {
      return 'Location';
    }

    /* ! Spec Conformance
     * (https://html.spec.whatwg.org/#document)
     * WhatWG HTML$3.1.1 - The `Document` object
     * Note: Most browsers currently adher to the W3C DOM Level 2 spec
     *       (https://www.w3.org/TR/DOM-Level-2-HTML/html.html#ID-26809268)
     *       which suggests that browsers should use HTMLTableCellElement for
     *       both TD and TH elements. WhatWG separates these.
     *       WhatWG HTML states:
     *         > For historical reasons, Window objects must also have a
     *         > writable, configurable, non-enumerable property named
     *         > HTMLDocument whose value is the Document interface object.
     * Test: `Object.prototype.toString.call(document)``
     *  - Chrome === "[object HTMLDocument]"
     *  - Firefox === "[object HTMLDocument]"
     *  - Safari === "[object HTMLDocument]"
     *  - IE <=10 === "[object Document]"
     *  - IE 11 === "[object HTMLDocument]"
     *  - IE Edge <=13 === "[object HTMLDocument]"
     */
    if (typeof window.document === 'object' && obj === window.document) {
      return 'Document';
    }

    if (typeof window.navigator === 'object') {
      /* ! Spec Conformance
       * (https://html.spec.whatwg.org/multipage/webappapis.html#mimetypearray)
       * WhatWG HTML$8.6.1.5 - Plugins - Interface MimeTypeArray
       * Test: `Object.prototype.toString.call(navigator.mimeTypes)``
       *  - IE <=10 === "[object MSMimeTypesCollection]"
       */
      if (typeof window.navigator.mimeTypes === 'object' &&
          obj === window.navigator.mimeTypes) {
        return 'MimeTypeArray';
      }

      /* ! Spec Conformance
       * (https://html.spec.whatwg.org/multipage/webappapis.html#pluginarray)
       * WhatWG HTML$8.6.1.5 - Plugins - Interface PluginArray
       * Test: `Object.prototype.toString.call(navigator.plugins)``
       *  - IE <=10 === "[object MSPluginsCollection]"
       */
      if (typeof window.navigator.plugins === 'object' &&
          obj === window.navigator.plugins) {
        return 'PluginArray';
      }
    }

    if ((typeof window.HTMLElement === 'function' ||
        typeof window.HTMLElement === 'object') &&
        obj instanceof window.HTMLElement) {
      /* ! Spec Conformance
      * (https://html.spec.whatwg.org/multipage/webappapis.html#pluginarray)
      * WhatWG HTML$4.4.4 - The `blockquote` element - Interface `HTMLQuoteElement`
      * Test: `Object.prototype.toString.call(document.createElement('blockquote'))``
      *  - IE <=10 === "[object HTMLBlockElement]"
      */
      if (obj.tagName === 'BLOCKQUOTE') {
        return 'HTMLQuoteElement';
      }

      /* ! Spec Conformance
       * (https://html.spec.whatwg.org/#htmltabledatacellelement)
       * WhatWG HTML$4.9.9 - The `td` element - Interface `HTMLTableDataCellElement`
       * Note: Most browsers currently adher to the W3C DOM Level 2 spec
       *       (https://www.w3.org/TR/DOM-Level-2-HTML/html.html#ID-82915075)
       *       which suggests that browsers should use HTMLTableCellElement for
       *       both TD and TH elements. WhatWG separates these.
       * Test: Object.prototype.toString.call(document.createElement('td'))
       *  - Chrome === "[object HTMLTableCellElement]"
       *  - Firefox === "[object HTMLTableCellElement]"
       *  - Safari === "[object HTMLTableCellElement]"
       */
      if (obj.tagName === 'TD') {
        return 'HTMLTableDataCellElement';
      }

      /* ! Spec Conformance
       * (https://html.spec.whatwg.org/#htmltableheadercellelement)
       * WhatWG HTML$4.9.9 - The `td` element - Interface `HTMLTableHeaderCellElement`
       * Note: Most browsers currently adher to the W3C DOM Level 2 spec
       *       (https://www.w3.org/TR/DOM-Level-2-HTML/html.html#ID-82915075)
       *       which suggests that browsers should use HTMLTableCellElement for
       *       both TD and TH elements. WhatWG separates these.
       * Test: Object.prototype.toString.call(document.createElement('th'))
       *  - Chrome === "[object HTMLTableCellElement]"
       *  - Firefox === "[object HTMLTableCellElement]"
       *  - Safari === "[object HTMLTableCellElement]"
       */
      if (obj.tagName === 'TH') {
        return 'HTMLTableHeaderCellElement';
      }
    }
  }

  /* ! Speed optimisation
  * Pre:
  *   Float64Array       x 625,644 ops/sec ±1.58% (80 runs sampled)
  *   Float32Array       x 1,279,852 ops/sec ±2.91% (77 runs sampled)
  *   Uint32Array        x 1,178,185 ops/sec ±1.95% (83 runs sampled)
  *   Uint16Array        x 1,008,380 ops/sec ±2.25% (80 runs sampled)
  *   Uint8Array         x 1,128,040 ops/sec ±2.11% (81 runs sampled)
  *   Int32Array         x 1,170,119 ops/sec ±2.88% (80 runs sampled)
  *   Int16Array         x 1,176,348 ops/sec ±5.79% (86 runs sampled)
  *   Int8Array          x 1,058,707 ops/sec ±4.94% (77 runs sampled)
  *   Uint8ClampedArray  x 1,110,633 ops/sec ±4.20% (80 runs sampled)
  * Post:
  *   Float64Array       x 7,105,671 ops/sec ±13.47% (64 runs sampled)
  *   Float32Array       x 5,887,912 ops/sec ±1.46% (82 runs sampled)
  *   Uint32Array        x 6,491,661 ops/sec ±1.76% (79 runs sampled)
  *   Uint16Array        x 6,559,795 ops/sec ±1.67% (82 runs sampled)
  *   Uint8Array         x 6,463,966 ops/sec ±1.43% (85 runs sampled)
  *   Int32Array         x 5,641,841 ops/sec ±3.49% (81 runs sampled)
  *   Int16Array         x 6,583,511 ops/sec ±1.98% (80 runs sampled)
  *   Int8Array          x 6,606,078 ops/sec ±1.74% (81 runs sampled)
  *   Uint8ClampedArray  x 6,602,224 ops/sec ±1.77% (83 runs sampled)
  */
  var stringTag = (symbolToStringTagExists && obj[Symbol.toStringTag]);
  if (typeof stringTag === 'string') {
    return stringTag;
  }

  var objPrototype = Object.getPrototypeOf(obj);
  /* ! Speed optimisation
  * Pre:
  *   regex literal      x 1,772,385 ops/sec ±1.85% (77 runs sampled)
  *   regex constructor  x 2,143,634 ops/sec ±2.46% (78 runs sampled)
  * Post:
  *   regex literal      x 3,928,009 ops/sec ±0.65% (78 runs sampled)
  *   regex constructor  x 3,931,108 ops/sec ±0.58% (84 runs sampled)
  */
  if (objPrototype === RegExp.prototype) {
    return 'RegExp';
  }

  /* ! Speed optimisation
  * Pre:
  *   date               x 2,130,074 ops/sec ±4.42% (68 runs sampled)
  * Post:
  *   date               x 3,953,779 ops/sec ±1.35% (77 runs sampled)
  */
  if (objPrototype === Date.prototype) {
    return 'Date';
  }

  /* ! Spec Conformance
   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-promise.prototype-@@tostringtag)
   * ES6$25.4.5.4 - Promise.prototype[@@toStringTag] should be "Promise":
   * Test: `Object.prototype.toString.call(Promise.resolve())``
   *  - Chrome <=47 === "[object Object]"
   *  - Edge <=20 === "[object Object]"
   *  - Firefox 29-Latest === "[object Promise]"
   *  - Safari 7.1-Latest === "[object Promise]"
   */
  if (promiseExists && objPrototype === Promise.prototype) {
    return 'Promise';
  }

  /* ! Speed optimisation
  * Pre:
  *   set                x 2,222,186 ops/sec ±1.31% (82 runs sampled)
  * Post:
  *   set                x 4,545,879 ops/sec ±1.13% (83 runs sampled)
  */
  if (setExists && objPrototype === Set.prototype) {
    return 'Set';
  }

  /* ! Speed optimisation
  * Pre:
  *   map                x 2,396,842 ops/sec ±1.59% (81 runs sampled)
  * Post:
  *   map                x 4,183,945 ops/sec ±6.59% (82 runs sampled)
  */
  if (mapExists && objPrototype === Map.prototype) {
    return 'Map';
  }

  /* ! Speed optimisation
  * Pre:
  *   weakset            x 1,323,220 ops/sec ±2.17% (76 runs sampled)
  * Post:
  *   weakset            x 4,237,510 ops/sec ±2.01% (77 runs sampled)
  */
  if (weakSetExists && objPrototype === WeakSet.prototype) {
    return 'WeakSet';
  }

  /* ! Speed optimisation
  * Pre:
  *   weakmap            x 1,500,260 ops/sec ±2.02% (78 runs sampled)
  * Post:
  *   weakmap            x 3,881,384 ops/sec ±1.45% (82 runs sampled)
  */
  if (weakMapExists && objPrototype === WeakMap.prototype) {
    return 'WeakMap';
  }

  /* ! Spec Conformance
   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-dataview.prototype-@@tostringtag)
   * ES6$24.2.4.21 - DataView.prototype[@@toStringTag] should be "DataView":
   * Test: `Object.prototype.toString.call(new DataView(new ArrayBuffer(1)))``
   *  - Edge <=13 === "[object Object]"
   */
  if (dataViewExists && objPrototype === DataView.prototype) {
    return 'DataView';
  }

  /* ! Spec Conformance
   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-%mapiteratorprototype%-@@tostringtag)
   * ES6$23.1.5.2.2 - %MapIteratorPrototype%[@@toStringTag] should be "Map Iterator":
   * Test: `Object.prototype.toString.call(new Map().entries())``
   *  - Edge <=13 === "[object Object]"
   */
  if (mapExists && objPrototype === mapIteratorPrototype) {
    return 'Map Iterator';
  }

  /* ! Spec Conformance
   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-%setiteratorprototype%-@@tostringtag)
   * ES6$23.2.5.2.2 - %SetIteratorPrototype%[@@toStringTag] should be "Set Iterator":
   * Test: `Object.prototype.toString.call(new Set().entries())``
   *  - Edge <=13 === "[object Object]"
   */
  if (setExists && objPrototype === setIteratorPrototype) {
    return 'Set Iterator';
  }

  /* ! Spec Conformance
   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-%arrayiteratorprototype%-@@tostringtag)
   * ES6$22.1.5.2.2 - %ArrayIteratorPrototype%[@@toStringTag] should be "Array Iterator":
   * Test: `Object.prototype.toString.call([][Symbol.iterator]())``
   *  - Edge <=13 === "[object Object]"
   */
  if (arrayIteratorExists && objPrototype === arrayIteratorPrototype) {
    return 'Array Iterator';
  }

  /* ! Spec Conformance
   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-%stringiteratorprototype%-@@tostringtag)
   * ES6$21.1.5.2.2 - %StringIteratorPrototype%[@@toStringTag] should be "String Iterator":
   * Test: `Object.prototype.toString.call(''[Symbol.iterator]())``
   *  - Edge <=13 === "[object Object]"
   */
  if (stringIteratorExists && objPrototype === stringIteratorPrototype) {
    return 'String Iterator';
  }

  /* ! Speed optimisation
  * Pre:
  *   object from null   x 2,424,320 ops/sec ±1.67% (76 runs sampled)
  * Post:
  *   object from null   x 5,838,000 ops/sec ±0.99% (84 runs sampled)
  */
  if (objPrototype === null) {
    return 'Object';
  }

  return Object
    .prototype
    .toString
    .call(obj)
    .slice(toStringLeftSliceLength, toStringRightSliceLength);
}

return typeDetect;

})));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],39:[function(require,module,exports){
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

},{}],40:[function(require,module,exports){
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

},{"./miniParser":43}],41:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleDevEnvironment = exports.cellSplit = exports.posToStr = void 0;
function posToStr(sheet, row, col) {
    return `${sheet}:${row}:${col}`;
}
exports.posToStr = posToStr;
function cellSplit(s) {
    return s.split("\n").map((line) => line.split(","));
}
exports.cellSplit = cellSplit;
class SimpleDevEnvironment {
    constructor() {
        this.sources = {};
        this.errors = {};
    }
    hasSource(sheet) {
        return sheet in this.sources;
    }
    loadSource(sheet) {
        if (!(sheet in this.sources)) {
            throw new Error(`Source not found for ${sheet}`);
        }
        return this.sources[sheet];
    }
    addSourceAsText(sheetName, text) {
        const cells = cellSplit(text);
        this.addSourceAsCells(sheetName, cells);
    }
    addSourceAsCells(sheetName, cells) {
        this.sources[sheetName] = cells;
    }
    markError(sheet, row, col, shortMsg, msg, level = "error") {
        const key = posToStr(sheet, row, col);
        if (!(key in this.errors)) {
            this.errors[key] = [];
        }
        const error = [sheet, row, col, msg, level];
        this.errors[key].push(error);
    }
    logErrors() {
        for (const error of Object.values(this.errors)) {
            for (const [sheet, row, col, msg, lev] of error) {
                console.log(`${sheet}:${row}:${col}: ${lev.toUpperCase()}:${msg}`);
            }
        }
    }
    getErrorMessages() {
        var results = [];
        for (const errors of Object.values(this.errors)) {
            results = results.concat(errors);
        }
        return results;
    }
    getErrors(sheet, row, col) {
        const key = posToStr(sheet, row, col);
        const results = [];
        if (!(key in this.errors)) {
            return [];
        }
        return this.errors[key].map(e => e.toString());
    }
    numErrors(level) {
        var result = 0;
        for (const error of Object.values(this.errors)) {
            for (const [sheet, row, col, msg, lev] of error) {
                if (level == "any" && lev != "info" || lev == level) {
                    result++;
                }
            }
        }
        return result;
    }
    markContent(sheet, row, col, tier) { }
    markComment(sheet, row, col) { }
    markHeader(sheet, row, col, color) { }
    markCommand(sheet, row, col) { }
    markSymbol(sheet, row, col) { }
    setColor(tierName, color) { }
    highlight() { }
    alert(msg) { }
}
exports.SimpleDevEnvironment = SimpleDevEnvironment;

},{}],42:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Empty = exports.Rep = exports.Emb = exports.Rename = exports.Drop = exports.Proj = exports.Not = exports.Semijoin = exports.Join = exports.Uni = exports.Seq = exports.Lit = exports.State = exports.SimpleDevEnvironment = exports.Project = void 0;
const stateMachine_1 = require("./stateMachine");
Object.defineProperty(exports, "State", { enumerable: true, get: function () { return stateMachine_1.State; } });
Object.defineProperty(exports, "Lit", { enumerable: true, get: function () { return stateMachine_1.Lit; } });
Object.defineProperty(exports, "Seq", { enumerable: true, get: function () { return stateMachine_1.Seq; } });
Object.defineProperty(exports, "Uni", { enumerable: true, get: function () { return stateMachine_1.Uni; } });
Object.defineProperty(exports, "Join", { enumerable: true, get: function () { return stateMachine_1.Join; } });
Object.defineProperty(exports, "Semijoin", { enumerable: true, get: function () { return stateMachine_1.Semijoin; } });
Object.defineProperty(exports, "Not", { enumerable: true, get: function () { return stateMachine_1.Not; } });
Object.defineProperty(exports, "Proj", { enumerable: true, get: function () { return stateMachine_1.Proj; } });
Object.defineProperty(exports, "Drop", { enumerable: true, get: function () { return stateMachine_1.Drop; } });
Object.defineProperty(exports, "Rename", { enumerable: true, get: function () { return stateMachine_1.Rename; } });
Object.defineProperty(exports, "Emb", { enumerable: true, get: function () { return stateMachine_1.Emb; } });
Object.defineProperty(exports, "Rep", { enumerable: true, get: function () { return stateMachine_1.Rep; } });
Object.defineProperty(exports, "Empty", { enumerable: true, get: function () { return stateMachine_1.Empty; } });
const project_1 = require("./project");
Object.defineProperty(exports, "Project", { enumerable: true, get: function () { return project_1.Project; } });
const devEnv_1 = require("./devEnv");
Object.defineProperty(exports, "SimpleDevEnvironment", { enumerable: true, get: function () { return devEnv_1.SimpleDevEnvironment; } });

},{"./devEnv":41,"./project":44,"./stateMachine":46}],43:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.miniParse = exports.MPAlternation = exports.MPSequence = exports.MPComment = exports.MPUnreserved = exports.MPDelay = void 0;
function MPDelay(child) {
    return function* (input) {
        yield* child()(input);
    };
}
exports.MPDelay = MPDelay;
function MPUnreserved(reserved, constr) {
    return function* (input) {
        if (input.length == 0 || reserved.has(input[0])) {
            return;
        }
        yield [constr(input[0]), input.slice(1)];
    };
}
exports.MPUnreserved = MPUnreserved;
function MPComment(commentStarter, constr) {
    return function* (input) {
        if (input.length == 0 || input[0] != commentStarter) {
            return;
        }
        yield [constr(input[0]), []];
    };
}
exports.MPComment = MPComment;
function MPSequence(children, constr) {
    return function* (input) {
        var results = [[[], input]];
        for (const child of children) {
            var newResults = [];
            for (const [existingOutputs, existingRemnant] of results) {
                if (typeof child == "string") {
                    if (existingRemnant.length > 0 && existingRemnant[0] == child) {
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
function MPAlternation(...children) {
    return function* (input) {
        for (const child of children) {
            yield* child(input);
        }
    };
}
exports.MPAlternation = MPAlternation;
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

},{}],44:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Project = void 0;
const devEnv_1 = require("./devEnv");
const stateMachine_1 = require("./stateMachine");
const util_1 = require("./util");
const sheetParser_1 = require("./sheetParser");
/**
 * A Project does two things:
 *
 *   (1) Holds multiple SheetComponents (worksheets parsed into a syntax tree and associated
 *       with States) and a global namespace.
 *
 *   (2) Acts as a Facade (in the GoF sense) for the client to interact with, so that they
 *       don't necessarily have to understand the ways DevEnvironments, SheetComponents, Namespaces,
 *       and States are related and interact.
 */
class Project {
    constructor(devEnv = new devEnv_1.SimpleDevEnvironment()) {
        this.devEnv = devEnv;
        this.globalNamespace = new stateMachine_1.Namespace();
        this.defaultSheetName = '';
        this.sheets = {};
    }
    allSymbols() {
        return this.globalNamespace.allSymbols();
    }
    getSymbol(symbolName) {
        return this.globalNamespace.getSymbol(symbolName, new stateMachine_1.CounterStack(4));
    }
    getErrors() {
        return this.devEnv.getErrorMessages().map(([sheet, row, col, msg, level]) => { return { sheet: sheet, row: row, col: col, msg: msg, level: level }; });
    }
    getTapeNames(symbolName) {
        const startState = this.globalNamespace.getSymbol(symbolName);
        if (startState == undefined) {
            throw new Error(`Cannot find symbol ${symbolName}`);
        }
        const results = [];
        const stack = new stateMachine_1.CounterStack(2);
        for (const tapeName of startState.getRelevantTapes(stack)) {
            const header = sheetParser_1.parseHeaderCell(tapeName, new util_1.CellPosition("?", -1, -1));
            results.push([tapeName, header.getColor(0.2)]);
        }
        return results;
    }
    compile(symbolName, compileLevel = 1) {
        const symbol = this.globalNamespace.getSymbol(symbolName);
        if (symbol == undefined) {
            throw new Error(`Cannot find symbol ${symbolName} to compile it`);
        }
        const allTapes = symbol.getAllTapes();
        this.globalNamespace.compileSymbol(symbolName, allTapes, new stateMachine_1.CounterStack(4), compileLevel);
    }
    generate(symbolName = "", inputs = {}, maxResults = Infinity, maxRecursion = 4, maxChars = 1000) {
        var startState = this.getSymbol(symbolName);
        if (startState == undefined) {
            throw new Error(`Project does not define a symbol named "${symbolName}"`);
        }
        const gen = startState.parse(inputs, false, maxRecursion, maxChars);
        return util_1.iterTake(gen, maxResults);
    }
    sample(symbolName = "", numSamples = 1, restriction = {}, maxTries = 1000, maxRecursion = 4, maxChars = 1000) {
        var startState = this.getSymbol(symbolName);
        if (startState == undefined) {
            throw new Error(`Project does not define a symbol named "${symbolName}"`);
        }
        return startState.sample(restriction, numSamples, maxTries, maxRecursion, maxChars);
    }
    addSheetAux(sheetName) {
        if (sheetName in this.sheets) {
            // already loaded it, don't have to do anything
            return;
        }
        if (!this.devEnv.hasSource(sheetName)) {
            // this might or might not be an error.  most of the time, it
            // just means that an embed in some sheet referred to a symbol
            // of this name, and we're checking to see if it refers to a 
            // sheet.  Even if we can't find that sheet, we're probably good,
            // it's probably just a symbol name.
            //
            // if this is indeed a programmer error, don't freak out about it here.
            // it's too early to know what and what isn't an error.
            // later on, we'll put errors on any cells for which we can't
            // resolve the reference.
            return;
        }
        const cells = this.devEnv.loadSource(sheetName);
        // parse the cells into an abstract syntax tree
        const sheetComponent = sheetParser_1.parseCells(sheetName, cells, this.devEnv);
        // put the raw cells into the sheetComponent, for interfaces
        // that need them (like the sidebar of the GSuite add-on)
        // Create a new namespace for this sheet and add it to the 
        // global namespace
        const sheetNamespace = new stateMachine_1.Namespace();
        this.globalNamespace.addLocalNamespace(sheetName, sheetNamespace);
        // Compile it
        sheetComponent.compile(sheetNamespace, this.devEnv);
        // Store it in .sheets
        this.sheets[sheetName] = sheetComponent;
        for (const requiredSheet of this.globalNamespace.requiredNamespaces) {
            this.addSheetAux(requiredSheet);
        }
    }
    addSheet(sheetName) {
        // add this sheet and any sheets that it refers to
        this.addSheetAux(sheetName);
        this.globalNamespace.setDefaultNamespaceName(sheetName);
        this.defaultSheetName = sheetName;
    }
    addSheetAsText(sheetName, text) {
        this.devEnv.addSourceAsText(sheetName, text);
        this.addSheet(sheetName);
    }
    addSheetAsCells(sheetName, cells) {
        this.devEnv.addSourceAsCells(sheetName, cells);
        this.addSheet(sheetName);
    }
    runChecks() {
        for (const sheetName of Object.keys(this.sheets)) {
            const localNamespace = this.globalNamespace.getLocalNamespace(sheetName);
            if (localNamespace == undefined) {
                throw new Error(`Trying to find local namespace ${sheetName} but can't.`);
            }
            this.sheets[sheetName].runChecks(localNamespace, this.devEnv);
        }
    }
    getSheet(sheetName) {
        if (!(sheetName in this.sheets)) {
            throw new Error(`Sheet ${sheetName} not found in project`);
        }
        return this.sheets[sheetName];
    }
    getDefaultSheet() {
        if (this.defaultSheetName == '') {
            throw new Error("Asking for the default sheet of a project to which no sheets have been added");
        }
        return this.getSheet(this.defaultSheetName);
    }
}
exports.Project = Project;

},{"./devEnv":41,"./sheetParser":45,"./stateMachine":46,"./util":48}],45:[function(require,module,exports){
"use strict";
/**
 * This file describes the parser that turns spreadsheets into abstract
 * syntax trees, for later compilation into formulas of a programming language.
 * It's agnostic as to exactly what that programming language is; to adapt
 * it to a particular language, implement Compiler<T> where T is the base class
 * of formulas in that language.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCells = exports.SheetComponent = exports.GrammarComponent = exports.parseHeaderCell = exports.SlashHeader = exports.ContainsHeader = exports.EndsWithHeader = exports.StartsWithHeader = exports.EqualsHeader = exports.JoinHeader = exports.MaybeHeader = exports.CommentHeader = exports.LiteralHeader = exports.DropHeader = exports.EmbedHeader = exports.Header = void 0;
const chai_1 = require("chai");
const cellParser_1 = require("./cellParser");
const miniParser_1 = require("./miniParser");
const stateMachine_1 = require("./stateMachine");
const util_1 = require("./util");
const DEFAULT_SATURATION = 0.1;
const DEFAULT_VALUE = 1.0;
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
 *
 * Header objects are responsible for:
 *
 * * compiling the cells beneath them into States, and merging them (usually by
 *   concatenation) with cells to their right.
 *
 * * knowing what colors the foreground and background of the header cell should be
 */
class Header extends util_1.TabularComponent {
    constructor(text) {
        super(text, util_1.DUMMY_POSITION);
    }
    getColor(saturation = DEFAULT_SATURATION, value = DEFAULT_VALUE) {
        return util_1.RGBtoString(...util_1.HSVtoRGB(this.hue, saturation, value));
    }
    mark(devEnv) {
        const color = this.getColor(0.1);
        devEnv.markHeader(this.position.sheet, this.position.row, this.position.col, color);
    }
    compile(cell, namespace, devEnv) {
        throw new Error('Not implemented');
    }
    merge(leftNeighbor, state) {
        if (leftNeighbor == undefined) {
            return state;
        }
        return stateMachine_1.Seq(leftNeighbor, state);
    }
    compileAndMerge(cell, namespace, devEnv, leftNeighbor) {
        const compiledCell = this.compile(cell, namespace, devEnv);
        compiledCell.state = this.merge(leftNeighbor, compiledCell.state);
        return compiledCell;
    }
}
exports.Header = Header;
/**
 * AtomicHeader is the ancestor class of all single-token headers, like "embed" and
 * literals (e.g. "text").
 */
class AtomicHeader extends Header {
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
    compile(cell, namespace, devEnv) {
        const compiledCell = new EmbedComponent(this, cell);
        compiledCell.state = stateMachine_1.Emb(cell.text, namespace);
        return compiledCell;
    }
}
exports.EmbedHeader = EmbedHeader;
/**
 * DropHeaders lead to the complilation of DropStates.
 */
class DropHeader extends AtomicHeader {
    compileAndMerge(cell, namespace, devEnv, leftNeighbor) {
        const compiledCell = new DropComponent(this, cell);
        if (leftNeighbor == undefined) {
            compiledCell.markError(devEnv, "Wayward drop", '"Drop" has to have something to the left of it, to drop from.');
            return compiledCell;
        }
        compiledCell.state = stateMachine_1.Drop(leftNeighbor, cell.text);
        return compiledCell;
    }
}
exports.DropHeader = DropHeader;
/**
 * LiteralHeaders are references to a particular tape name (e.g. "text")
 */
class LiteralHeader extends AtomicHeader {
    compile(cell, namespace, devEnv) {
        const compiledCell = new HeadedCellComponent(this, cell);
        compiledCell.state = stateMachine_1.Lit(this.text, cell.text);
        return compiledCell;
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
    mark(devEnv) {
        devEnv.markComment(this.position.sheet, this.position.row, this.position.col);
    }
    compile(cell, namespace, devEnv) {
        return new CommentComponent(cell);
    }
}
exports.CommentHeader = CommentHeader;
/**
 * The ancestor class of unary header operators like "maybe", "not", "@"
 * (the joining operator that we use to implement flags), and ">" (the rename
 * operator)
 */
class UnaryHeader extends Header {
    constructor(text, child) {
        super(text);
        this.child = child;
    }
    get hue() {
        return this.child.hue;
    }
    compile(cell, namespace, devEnv) {
        const childCell = this.child.compile(cell, namespace, devEnv);
        const compiledCell = new UnaryHeadedCellComponent(this, cell, childCell);
        compiledCell.state = childCell.state;
        return compiledCell;
    }
}
/**
 * Header that constructs optional parsers, e.g. "maybe text"
 */
class MaybeHeader extends UnaryHeader {
    compile(cell, namespace, devEnv) {
        const childCell = this.child.compile(cell, namespace, devEnv);
        const compiledCell = new UnaryHeadedCellComponent(this, cell, childCell);
        compiledCell.state = stateMachine_1.Maybe(childCell.state);
        return compiledCell;
    }
}
exports.MaybeHeader = MaybeHeader;
/**
 * Header that constructs negations, e.g. "not text"
 */
class NotHeader extends UnaryHeader {
    compile(cell, namespace, devEnv) {
        const childCell = this.child.compile(cell, namespace, devEnv);
        const compiledCell = new UnaryHeadedCellComponent(this, cell, childCell);
        compiledCell.state = stateMachine_1.Not(childCell.state);
        return compiledCell;
    }
}
/**
 * Header that constructs negations, e.g. "not text"
 */
class RenameHeader extends UnaryHeader {
    compile(cell, namespace, devEnv) {
        const childCell = this.child.compile(cell, namespace, devEnv);
        const compiledCell = new RenameComponent(this, cell, childCell);
        compiledCell.state = childCell.state;
        return compiledCell;
    }
    merge(leftNeighbor, state) {
        if (leftNeighbor == undefined) {
            return state;
        }
        if (!(state instanceof stateMachine_1.LiteralState)) {
            throw new Error("Rename (>) of a non-literal");
        }
        return stateMachine_1.Rename(leftNeighbor, state.text, state.tapeName);
    }
}
/**
 * A JoinHeader handles headers like "@x"; it joins x:X with whatever
 * follows rather than concatenating it.
 *
 * Note that JoinHeader binds more tightly than other unary operators,
 * e.g. while "maybe" in "maybe text/gloss" has "text/gloss" as its child,
 * "@" in "@text/gloss" only has "@" as its child.
 *
 * JoinHeader are also the ancestor of all Headers that
 * allow and parse boolean-algebra expressions in their fields (e.g. "~(A|B)").
 */
class JoinHeader extends UnaryHeader {
    merge(leftNeighbor, state) {
        if (leftNeighbor == undefined) {
            return state;
        }
        return stateMachine_1.Join(leftNeighbor, state);
    }
    compileLiteral(parsedText, cell, namespace, devEnv) {
        const newCell = new CellComponent(parsedText.text, cell.position);
        const childCell = this.child.compile(newCell, namespace, devEnv);
        return childCell;
    }
    compilePiece(parsedText, cell, namespace, devEnv) {
        if (parsedText instanceof cellParser_1.CPUnreserved) {
            const newCell = new CellComponent(parsedText.text, cell.position);
            const childCell = this.child.compile(newCell, namespace, devEnv);
            return this.compileLiteral(parsedText, cell, namespace, devEnv);
        }
        if (parsedText instanceof cellParser_1.CPNegation) {
            const childCell = this.compilePiece(parsedText.child, cell, namespace, devEnv);
            const compiledCell = new UnaryHeadedCellComponent(this, cell, childCell);
            compiledCell.state = stateMachine_1.Not(childCell.state);
            return compiledCell;
        }
        if (parsedText instanceof cellParser_1.CPAlternation) {
            const child1Cell = this.compilePiece(parsedText.child1, cell, namespace, devEnv);
            const child2Cell = this.compilePiece(parsedText.child2, cell, namespace, devEnv);
            const compiledCell = new NAryHeadedCellComponent(this, cell, [child1Cell, child2Cell]);
            compiledCell.state = stateMachine_1.Uni(child1Cell.state, child2Cell.state);
            return compiledCell;
        }
        throw new Error(`Error constructing boolean expression in cell ${cell.position}`);
    }
    compile(cell, namespace, devEnv) {
        if (cell.text.length == 0) {
            return super.compile(cell, namespace, devEnv);
        }
        const parsedText = cellParser_1.parseBooleanCell(cell.text);
        const compiledCell = this.compilePiece(parsedText, cell, namespace, devEnv);
        return compiledCell;
    }
}
exports.JoinHeader = JoinHeader;
/**
 * EqualsHeader puts a constraint on the state of the immediately preceding cell (call this state N)
 * that Semijoin(N, X) -- that is, it filters the results of N such that every surviving record is a
 * superset of X.
 *
 * This is also the superclass of [StartsWithHeader] and [EndsWithHeader].  These constrain N to either
 * start with X (that is, Semijoin(N, X.*)) or end with X (that is, Semijoin(N, .*X)).
 */
class EqualsHeader extends JoinHeader {
    merge(leftNeighbor, state) {
        if (leftNeighbor == undefined) {
            throw new Error("'startswith' requires content to its left.");
        }
        if (leftNeighbor instanceof stateMachine_1.ConcatState) {
            // if your left neighbor is a concat state we have to do something a little special,
            // because startswith only scopes over the cell immediately to the left.  (if you let
            // it be a join with EVERYTHING to the left, you end up catching prefixes that you're
            // specifying in the same row, rather than the embedded thing you're trying to catch.)
            const immediateLeftNeighbor = leftNeighbor.child2; // taking advantage of the fact that
            // these are constructed to be left-branching
            const remnant = leftNeighbor.child1;
            return stateMachine_1.Seq(remnant, stateMachine_1.Semijoin(immediateLeftNeighbor, state));
        }
        return stateMachine_1.Semijoin(leftNeighbor, state);
    }
}
exports.EqualsHeader = EqualsHeader;
class PartialEqualsHeader extends EqualsHeader {
    compileLiteral(parsedText, cell, namespace, devEnv) {
        const newCell = new CellComponent(parsedText.text, cell.position);
        const result = this.child.compile(newCell, namespace, devEnv);
        const symbolStack = new stateMachine_1.CounterStack(4);
        const relevantTapes = result.state.getRelevantTapes(symbolStack);
        for (const tape of relevantTapes) {
            result.state = this.formSequence(result.state, tape);
        }
        return result;
    }
}
/**
 * StartsWithHeader is a special kind of EqualsHeader that only requires its predecessor (call it N) to
 * start with X (that is, Semijoin(N, X.*))
 */
class StartsWithHeader extends PartialEqualsHeader {
    formSequence(state, tapeName) {
        const anychars = stateMachine_1.Rep(stateMachine_1.Any(tapeName));
        return stateMachine_1.Seq(state, anychars);
    }
}
exports.StartsWithHeader = StartsWithHeader;
/**
 * EndsWithHeader is a special kind of EqualsHeader that only requires its predecessor (call it N) to
 * end with X (that is, Semijoin(N, .*X))
 */
class EndsWithHeader extends PartialEqualsHeader {
    formSequence(state, tapeName) {
        const anychars = stateMachine_1.Rep(stateMachine_1.Any(tapeName));
        return stateMachine_1.Seq(anychars, state);
    }
}
exports.EndsWithHeader = EndsWithHeader;
/**
 * ContainsHeader is a special kind of EqualsHeader that only requires its predecessor (call it N) to
 * contain X (that is, Semijoin(N, .*X.*))
 */
class ContainsHeader extends PartialEqualsHeader {
    formSequence(state, tapeName) {
        const anychars = stateMachine_1.Rep(stateMachine_1.Any(tapeName));
        return stateMachine_1.Seq(anychars, state, anychars);
    }
}
exports.ContainsHeader = ContainsHeader;
class BinaryHeader extends Header {
    constructor(text, child1, child2) {
        super(text);
        this.child1 = child1;
        this.child2 = child2;
    }
    get hue() {
        return this.child1.hue;
    }
}
class SlashHeader extends BinaryHeader {
    constructor(child1, child2) {
        super("/", child1, child2);
        this.child1 = child1;
        this.child2 = child2;
    }
    /**
     * This isn't ordinarily called, usually compileAndMerge handles compilation
     * of SlashHeader.  But
     * when another header has a SlashHeader child, like "@(x/y)", this would
     * be called.
     */
    compile(cell, namespace, devEnv) {
        const childCell1 = this.child1.compile(cell, namespace, devEnv);
        const childCell2 = this.child2.compile(cell, namespace, devEnv);
        const compiledCell = new BinaryHeadedCellComponent(this, cell, childCell1, childCell2);
        compiledCell.state = stateMachine_1.Seq(childCell1.state, childCell2.state);
        return compiledCell;
    }
    compileAndMerge(cell, namespace, devEnv, leftNeighbor) {
        const childCell1 = this.child1.compileAndMerge(cell, namespace, devEnv, leftNeighbor);
        const childCell2 = this.child2.compileAndMerge(cell, namespace, devEnv, childCell1.state);
        const compiledCell = new BinaryHeadedCellComponent(this, cell, childCell1, childCell2);
        compiledCell.state = childCell2.state;
        return compiledCell;
    }
}
exports.SlashHeader = SlashHeader;
/**
 * What follows is a grammar and parser for the mini-language inside headers, e.g.
 * "text", "text/gloss", "startswith text", etc.
 *
 * It uses the mini-parser library in miniParser.ts to construct a recursive-descent
 * parser for the grammar.
 */
const SYMBOL = ["(", ")", "%", "/", '@', ">", ":"];
const RESERVED_HEADERS = ["embed", "maybe", "not", "drop", "equals", "startswith", "endswith", "contains"];
const BINARY_OPS = {
    "or": stateMachine_1.Uni,
    "concat": stateMachine_1.Seq,
    "join": stateMachine_1.Join,
};
const RESERVED_OPS = [...Object.keys(BINARY_OPS), "table", "test", "testnot"];
const RESERVED_WORDS = new Set([...SYMBOL, ...RESERVED_HEADERS, ...RESERVED_OPS]);
const tokenizer = new RegExp("\\s+|(" +
    SYMBOL.map(s => "\\" + s).join("|") +
    ")");
function tokenize(text) {
    return text.split(tokenizer).filter((s) => s !== undefined && s !== '');
}
var HP_NON_COMMENT_EXPR = miniParser_1.MPDelay(() => miniParser_1.MPAlternation(HP_MAYBE, HP_SLASH, HP_RENAME, HP_EQUALS, HP_STARTSWITH, HP_ENDSWITH, HP_CONTAINS, HP_SUBEXPR));
var HP_SUBEXPR = miniParser_1.MPDelay(() => miniParser_1.MPAlternation(HP_UNRESERVED, HP_EMBED, HP_DROP, HP_JOIN, HP_PARENS));
const HP_COMMENT = miniParser_1.MPComment('%', (s) => new CommentHeader(s));
const HP_UNRESERVED = miniParser_1.MPUnreserved(RESERVED_WORDS, (s) => new LiteralHeader(s));
const HP_EMBED = miniParser_1.MPSequence(["embed"], () => new EmbedHeader("embed"));
const HP_DROP = miniParser_1.MPSequence(["drop"], () => new DropHeader("drop"));
const HP_JOIN = miniParser_1.MPSequence(["@", HP_SUBEXPR], (child) => new JoinHeader("@", child));
const HP_MAYBE = miniParser_1.MPSequence(["maybe", HP_NON_COMMENT_EXPR], (child) => new MaybeHeader("maybe", child));
const HP_SLASH = miniParser_1.MPSequence([HP_SUBEXPR, "/", HP_NON_COMMENT_EXPR], (child1, child2) => new SlashHeader(child1, child2));
const HP_RENAME = miniParser_1.MPSequence([">", HP_UNRESERVED], (child) => new RenameHeader(">", child));
const HP_PARENS = miniParser_1.MPSequence(["(", HP_NON_COMMENT_EXPR, ")"], (child) => child);
const HP_EQUALS = miniParser_1.MPSequence(["equals", HP_NON_COMMENT_EXPR], (child) => new EqualsHeader("equals", child));
const HP_STARTSWITH = miniParser_1.MPSequence(["startswith", HP_NON_COMMENT_EXPR], (child) => new StartsWithHeader("startswith", child));
const HP_ENDSWITH = miniParser_1.MPSequence(["endswith", HP_NON_COMMENT_EXPR], (child) => new EndsWithHeader("endswith", child));
const HP_CONTAINS = miniParser_1.MPSequence(["contains", HP_NON_COMMENT_EXPR], (child) => new ContainsHeader("contains", child));
var HP_EXPR = miniParser_1.MPAlternation(HP_COMMENT, HP_NON_COMMENT_EXPR);
function parseHeaderCell(text, pos = util_1.DUMMY_POSITION) {
    const result = miniParser_1.miniParse(tokenize, HP_EXPR, text);
    result.position = pos;
    return result;
}
exports.parseHeaderCell = parseHeaderCell;
class CellComponent extends util_1.TabularComponent {
    constructor(text, position) {
        super(text, position);
    }
    toString() {
        return `${this.text}:${this.position}`;
    }
}
/**
 * A GrammarComponent is a component of our tabular syntax tree
 * that is associated with a grammar -- that is, a [State] of the
 * state machine.
 *
 * At construction, GrammarComponents do not have any specific state
 * yet, they're all associated with [TrivialState]s until they compile()
 * is called on them, at which point their state is calculated.  (This is
 * because GrammarComponents are constructed as soon as their first cell is,
 * but the grammar they represent typically depends on cells to the right
 * and below them.)
 */
class GrammarComponent extends util_1.TabularComponent {
    constructor() {
        super(...arguments);
        this.state = stateMachine_1.Empty();
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
    compile(namespace, devEnv) { }
    runChecks(namespace, devEnv) {
        if (this.sibling != undefined) {
            this.sibling.runChecks(namespace, devEnv);
        }
        if (this.child != undefined) {
            this.child.runChecks(namespace, devEnv);
        }
    }
}
exports.GrammarComponent = GrammarComponent;
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
class EnclosureComponent extends GrammarComponent {
    constructor(startCell) {
        super(startCell.text, startCell.position);
        this.startCell = startCell;
        this.specRow = -1;
        this.parent = undefined;
        this.specRow = startCell.position.row;
    }
    /**
     * Every enclosure has a "break" column number.  When cell text occurs in this
     * column, or to the left of it, the enclosure is considered complete, we can
     * no longer add to it, and we pop it off the stack.  For most types of enclosures,
     * this is the column in which the operator (e.g. "table:") occurs.
     */
    get breakColumn() {
        return this.position.col;
    }
    /**
     * Is this enclosure broken (i.e., considered complete and popped off the stack?)
     * by the given cell?
     */
    isBrokenBy(cell) {
        if (cell.text == "") {
            return false; // empty cells never break you
        }
        if (cell.position.row <= this.position.row) {
            return false; // only cells below you can break you
        }
        if (cell.position.col > this.breakColumn) {
            return false; // this cell is within your enclosure
        }
        return true;
    }
    mark(devEnv) {
        devEnv.markCommand(this.position.sheet, this.position.row, this.position.col);
    }
    compile(namespace, devEnv) {
        // we only ever end up in this base EncloseComponent compile if it wasn't
        // a known operator.  this is an error, but we flag it for the programmer
        // elsewhere.
        // in order to fail gracefully, we define the State of this component as 
        // its sibling's state (if a sibling is present), and if not, as its child's 
        // state (if present), and if not, the empty grammar.
        if (this.child != undefined) {
            this.child.compile(namespace, devEnv);
            this.state = this.child.state;
        }
        if (this.sibling != undefined) {
            this.sibling.compile(namespace, devEnv);
            this.state = this.sibling.state;
        }
    }
    addChild(child, devEnv) {
        if (this.child instanceof ContentsComponent) {
            throw new Error("Can't add an operator to a line that already has headers." +
                "I'm not sure how you even did this.");
        }
        if (this.child != undefined && this.child.position.col != child.position.col) {
            child.markWarning(devEnv, "Unexpected operator", "This operator is in an unexpected column.  Did you mean for it " +
                `to be in column ${this.child.position.col}, ` +
                `so that it's under the operator in cell ${this.child.position}?`);
        }
        child.parent = this;
        child.sibling = this.child;
        this.child = child;
        return child;
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
class AssignmentComponent extends EnclosureComponent {
    compile(namespace, devEnv) {
        // first compile the previous sibling.
        if (this.sibling != undefined) {
            this.sibling.compile(namespace, devEnv);
        }
        // determine what symbol you're assigning to
        const trimmedText = this.text.slice(0, this.text.length - 1).trim();
        if (RESERVED_WORDS.has(trimmedText)) {
            // oops, assigning to a reserved word
            this.markError(devEnv, "Assignment to reserved word", "This cell has to be a symbol name for an assignment statement, but you're assigning to the " +
                `reserved word ${trimmedText}.  Choose a different symbol name.`);
            if (this.child != undefined) {
                // compile the child just in case there are useful errors to display
                this.child.compile(namespace, devEnv);
            }
            return;
        }
        if (this.child == undefined) {
            // oops, empty "right side" of the assignment!
            this.markWarning(devEnv, "Empty assignment", `This looks like an assignment to a symbol ${trimmedText}, ` +
                "but there's nothing to the right of it.");
            return;
        }
        this.child.compile(namespace, devEnv);
        this.state = this.child.state;
        if (namespace.hasSymbol(trimmedText)) {
            // oops, trying to assign to a symbol that already is assigned to!
            this.markError(devEnv, "Redefining existing symbol", `You've already assigned something to the symbol ${trimmedText}`);
            return;
        }
        namespace.addSymbol(trimmedText, this.state);
    }
}
class BinaryOpComponent extends EnclosureComponent {
    compile(namespace, devEnv) {
        const trimmedText = this.text.slice(0, this.text.length - 1).trim();
        const op = BINARY_OPS[trimmedText];
        if (this.child == undefined) {
            this.markError(devEnv, `Missing argument to '${trimmedText}'`, `'${this.text}' is missing a second argument; ` +
                "something should be in the cell to the right.");
            return;
        }
        if (this.sibling == undefined) {
            this.markError(devEnv, `Missing argument to '${trimmedText}'`, `'${trimmedText}' is missing a first argument; ` +
                "something should be in a cell above this.");
            return;
        }
        this.sibling.compile(namespace, devEnv);
        this.child.compile(namespace, devEnv);
        this.state = op(this.sibling.state, this.child.state);
    }
}
class ApplyComponent extends EnclosureComponent {
}
class TableComponent extends EnclosureComponent {
    compile(namespace, devEnv) {
        if (this.child == undefined) {
            this.markWarning(devEnv, "Empty table", "'table' seems to be missing a table; " +
                "something should be in the cell to the right.");
            return;
        }
        if (this.sibling != undefined) {
            this.sibling.compile(namespace, devEnv);
        }
        this.child.compile(namespace, devEnv);
        this.state = this.child.state;
    }
}
class AbstractTestSuiteComponent extends EnclosureComponent {
    constructor() {
        super(...arguments);
        this.tests = [];
    }
    /**
     * "test" is an operator that takes two tables, one above (spatially speaking)
     * and one to the right, and makes sure that each line of the one to the right
     * has an output when semijoined to the table above.
     *
     * Test doesn't make any change to the State it returns; adding a "test" below
     * a grammar returns the exact same grammar as otherwise.
     */
    compile(namespace, devEnv) {
        if (this.sibling == undefined) {
            this.markError(devEnv, "Wayward test", "There should be something above this 'test' command for us to test");
            return;
        }
        const sibling = this.sibling.compile(namespace, devEnv);
        if (this.child == undefined) {
            this.markWarning(devEnv, "Empty test", "'test' seems to be missing something to test; " +
                "something should be in the cell to the right.");
            this.state = this.sibling.state;
            return; // whereas usually we result in the empty grammar upon erroring, in this case
            // we don't want to let a flubbed "test" command obliterate the grammar
            // it was meant to test!
        }
        if (!(this.child instanceof ContentsComponent)) {
            this.markError(devEnv, "Cannot execute tests", "You can't nest another operator to the right of a test block, " +
                "it has to be a content table.");
            this.state = this.sibling.state;
            return;
        }
        this.child.compile(namespace, devEnv);
        this.tests = this.child.rows;
        this.state = this.sibling.state;
    }
}
class TestSuiteComponent extends AbstractTestSuiteComponent {
    runChecks(namespace, devEnv) {
        super.runChecks(namespace, devEnv);
        for (const test of this.tests) {
            // the appropriate operation here is the left semijoin between my state
            // and the test's state
            if (!this.state.runUnitTest(test.state)) {
                test.markError(devEnv, `Test failed: ${test.text}`, "Test failed: This row cannot be generated by the grammar above.");
            }
            test.markInfo(devEnv, `Test succeeded: ${test.text}`, "Test succeeded: This row can be generated by the grammar above.");
        }
    }
}
class TestNotSuiteComponent extends AbstractTestSuiteComponent {
    constructor() {
        super(...arguments);
        this.tests = [];
    }
    runChecks(namespace, devEnv) {
        super.runChecks(namespace, devEnv);
        for (const test of this.tests) {
            // the appropriate operation here is the left semijoin between my state
            // and the test's state
            if (this.state.runUnitTest(test.state)) {
                // opposite of TestSuiteComponent: mark an error if the test succeeds
                test.markError(devEnv, `Test failed: ${test.text}`, "Test failed: This row can be generated by the grammar above.");
                continue;
            }
            test.markInfo(devEnv, `Test succeeded: ${test.text}`, "Test succeeded: This row cannot be generated by the grammar above.");
        }
    }
}
/**
 * A [SheetComponent] is basically an EnclosureComponent without
 * a parent component; a sheet is always the outermost component of
 * any component tree.
 */
class SheetComponent extends EnclosureComponent {
    constructor(name) {
        super(new CellComponent(name, new util_1.CellPosition(name, 0, -1)));
        this.name = name;
    }
    /*
    public addHeader(header: CellComponent): void {
        throw new Error("This appears to be a header, but what is it a header for?");
    } */
    compile(namespace, devEnv) {
        if (this.child == undefined) {
            return;
        }
        this.child.compile(namespace, devEnv);
        this.state = this.child.state;
        // We automatically assign the last child enclosure to the symbol
        // __MAIN__, which will serve as the default State when this sheet
        // is referred to without an overt symbol name.  (That is to say, if
        // you have a sheet named "MySheet", you could refer to symbols on it like
        // "MySheet.VERB", but you can also refer to "MySheet", which will give you
        // the last defined symbol whatever it is.)  This lets us have "no boilerplace"
        // sheets, letting us incorporate many non-Gramble CSVs as
        // databases without having to add Gramble-style assignment syntax.
        if (namespace.hasSymbol("__MAIN__")) {
            // It's not forbidden for programmers to assign to __MAIN__.  If they 
            // already have defined __MAIN__, respect that and don't
            // reassign it.
            return;
        }
        namespace.addSymbol("__MAIN__", this.state);
    }
    get sheet() {
        return this;
    }
}
exports.SheetComponent = SheetComponent;
/**
 * A ContentsComponent is a rectangular region of the grid consisting of a header row
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
class ContentsComponent extends EnclosureComponent {
    constructor() {
        super(...arguments);
        this.headersByCol = {};
        this.rows = [];
    }
    get breakColumn() {
        return this.position.col - 1;
    }
    canAddContent(cell) {
        return cell.position.col >= this.position.col &&
            cell.position.row > this.specRow;
    }
    addHeader(header, devEnv) {
        // remember it by its column number, because that's how content
        // cells will be asking for it.
        this.headersByCol[header.position.col] = header;
    }
    addContent(cell, devEnv) {
        // make sure we have a header
        const header = this.headersByCol[cell.position.col];
        if (header == undefined) {
            if (cell.text.length != 0) {
                cell.markWarning(devEnv, `Ignoring cell: ${cell.text}`, "Cannot associate this cell with any valid header above; ignoring.");
            }
            return;
        }
        // make a table row if we need one
        if (this.rows.length == 0 ||
            cell.position.row != this.rows[this.rows.length - 1].position.row) {
            const newRow = new RowComponent(cell.text, cell.position);
            this.rows.push(newRow);
        }
        // add the content
        const lastRow = this.rows[this.rows.length - 1];
        lastRow.addContent(header, cell);
    }
    addChild(child, devEnv) {
        child.markError(devEnv, "Wayward operator", "Cannot add an operator here; I'm not even sure how you did this.");
        // still add it as your child, so you can run checks on it and such
        child.parent = this;
        child.sibling = this.child;
        this.child = child;
        return child;
    }
    compile(namespace, devEnv) {
        if (this.sibling != undefined) {
            this.sibling.compile(namespace, devEnv);
        }
        this.rows.map(row => row.compile(namespace, devEnv));
        var rowStates = this.rows.map(row => row.state);
        rowStates = rowStates.filter(state => !(state instanceof stateMachine_1.TrivialState));
        this.state = stateMachine_1.Uni(...rowStates);
    }
    runChecks(ns, devEnv) {
        this.rows.map(row => row.runChecks(ns, devEnv));
    }
    toString() {
        return `Table(${this.position})`;
    }
}
class RowComponent extends GrammarComponent {
    constructor() {
        super(...arguments);
        this.uncompiledCells = [];
        this.compiledCells = [];
    }
    compile(namespace, devEnv) {
        var resultState = undefined;
        //for (var i = this.uncompiledCells.length-1; i >= 0; i--) {
        for (const [header, cell] of this.uncompiledCells) {
            //const [header, cell] = this.uncompiledCells[i];
            const compiledCell = header.compileAndMerge(cell, namespace, devEnv, resultState);
            compiledCell.mark(devEnv);
            // if it was zero, ignore the result of the merge   
            if (cell.text.length > 0 && !(compiledCell.state instanceof stateMachine_1.TrivialState)) {
                resultState = compiledCell.state;
            }
            this.compiledCells = [compiledCell, ...this.compiledCells];
        }
        if (resultState == undefined) {
            // everything was comments or empty
            resultState = stateMachine_1.Empty();
        }
        this.state = resultState;
    }
    addContent(header, cell) {
        this.uncompiledCells.push([header, cell]);
    }
    runChecks(ns, devEnv) {
        this.compiledCells.map(cell => cell.runChecks(ns, devEnv));
    }
}
class SingleCellComponent extends GrammarComponent {
    constructor(cell) {
        super(cell.text, cell.position);
        this.cell = cell;
    }
}
class HeadedCellComponent extends SingleCellComponent {
    constructor(header, cell) {
        super(cell);
        this.header = header;
    }
    mark(devEnv) {
        const color = this.header.getColor(0.1);
        devEnv.markContent(this.position.sheet, this.position.row, this.position.col, color);
    }
    compile(namespace, devEnv) {
        throw new Error("Not implemented; shouldn't be calling this.");
    }
}
class CommentComponent extends SingleCellComponent {
    mark(devEnv) {
        devEnv.markComment(this.position.sheet, this.position.row, this.position.col);
    }
    compile(namespace, devEnv) { }
}
class UnaryHeadedCellComponent extends HeadedCellComponent {
    constructor(header, cell, child) {
        super(header, cell);
        this.child = child;
    }
    runChecks(ns, devEnv) {
        this.child.runChecks(ns, devEnv);
    }
}
class BinaryHeadedCellComponent extends HeadedCellComponent {
    constructor(header, cell, child1, child2) {
        super(header, cell);
        this.child1 = child1;
        this.child2 = child2;
    }
    runChecks(ns, devEnv) {
        this.child1.runChecks(ns, devEnv);
        this.child2.runChecks(ns, devEnv);
        if (this.child1 instanceof EmbedComponent || this.child2 instanceof EmbedComponent) {
            this.cell.markWarning(devEnv, "Embed inside slash header", "Why are you putting an 'embed' inside a slash header? That's weird.");
        }
    }
}
class NAryHeadedCellComponent extends HeadedCellComponent {
    constructor(header, cell, children) {
        super(header, cell);
        this.children = children;
    }
    runChecks(ns, devEnv) {
        for (const child of this.children) {
            child.runChecks(ns, devEnv);
        }
    }
}
class EmbedComponent extends HeadedCellComponent {
    runChecks(ns, devEnv) {
        if (this.text.length == 0) {
            return;
        }
        const symbol = ns.getSymbol(this.cell.text);
        if (symbol == undefined) {
            this.cell.markError(devEnv, `Cannot find symbol ${this.cell.text}`, `Cannot find symbol ${this.cell.text}.`);
        }
    }
}
class DropComponent extends HeadedCellComponent {
    runChecks(ns, devEnv) {
        if (!(this.state instanceof stateMachine_1.DropState)) {
            return;
        }
        if (this.state.droppedTape == "") {
            return;
        }
        const symbolStack = new stateMachine_1.CounterStack(2);
        const childTapes = this.state.child.getRelevantTapes(symbolStack);
        if (!(childTapes.has(this.state.droppedTape))) {
            this.markError(devEnv, `Inaccessible tape: ${this.state.droppedTape}`, `This cell refers to a tape ${this.state.droppedTape},` +
                ` but the content to its left only defines tape(s) ${[...childTapes].join(", ")}.`);
        }
    }
}
class RenameComponent extends HeadedCellComponent {
    constructor(header, cell, child) {
        super(header, cell);
        this.child = child;
    }
    runChecks(ns, devEnv) {
        if (!(this.state instanceof stateMachine_1.RenameState)) {
            return;
        }
        if (this.state.fromTape == "") {
            return;
        }
        const symbolStack = new stateMachine_1.CounterStack(2);
        const childTapes = this.state.child.getRelevantTapes(symbolStack);
        if (!(childTapes.has(this.state.fromTape))) {
            this.markError(devEnv, `Inaccessible tape: ${this.state.fromTape}`, `This cell refers to a tape ${this.state.fromTape},` +
                ` but the content to its left only defines tape(s) ${[...childTapes].join(", ")}.`);
        }
    }
}
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
function constructOp(cell, devEnv) {
    var newEnclosure;
    chai_1.assert(cell.text.endsWith(":"), "Tried to construct an op that didn't end with ':'");
    const trimmedText = cell.text.slice(0, cell.text.length - 1).trim();
    if (trimmedText in BINARY_OPS) {
        newEnclosure = new BinaryOpComponent(cell);
    }
    else if (trimmedText == "table") {
        newEnclosure = new TableComponent(cell);
    }
    else if (trimmedText == "test") {
        newEnclosure = new TestSuiteComponent(cell);
    }
    else if (trimmedText == "testnot") {
        newEnclosure = new TestNotSuiteComponent(cell);
    }
    else if (cell.position.col == 0) {
        // if it's none of these special operators, it's an assignment,
        // but note that assignments can only occur in column 0.  if an 
        // unknown word appears elsewhere in the tree, it's an error.
        newEnclosure = new AssignmentComponent(cell);
    }
    else {
        // this is an error, flag it for the programmer.  EnclosureComponent
        // defines some useful default behavior in case of this kind of error,
        // like making sure that the child and/or sibling are compiled and 
        // checked for errors.
        newEnclosure = new EnclosureComponent(cell);
        cell.markError(devEnv, "Unknown operator", `Operator ${trimmedText} not recognized.`);
    }
    newEnclosure.mark(devEnv);
    return newEnclosure;
}
function parseCells(sheetName, cells, devEnv) {
    // topEnclosure refers to whatever enclosure is currently on top 
    // of the stack.  Since each enclosure knows what its parent is, we 
    // don't explicitly have to maintain a stack structure, we can just
    // use the .parent property of the current topEnclosure when we need
    // to pop.  We start with the one big enclosure that encompasses the 
    // whole sheet, with startCell (-1,-1)
    var topEnclosure = new SheetComponent(sheetName);
    // Now iterate through the cells, left-to-right top-to-bottom
    for (var rowIndex = 0; rowIndex < cells.length; rowIndex++) {
        const row = cells[rowIndex];
        if (isLineEmpty(row)) {
            continue;
        }
        const rowIsComment = row[0].trim().startsWith('%%');
        for (var colIndex = 0; colIndex < row.length; colIndex++) {
            const cellText = row[colIndex].trim();
            const position = new util_1.CellPosition(sheetName, rowIndex, colIndex);
            const cell = new CellComponent(cellText, position);
            if (rowIsComment) {
                const comment = new CommentComponent(cell);
                comment.mark(devEnv);
                continue;
            }
            while (topEnclosure.isBrokenBy(cell)) {
                // it breaks the previous enclosure; pop that off
                if (topEnclosure.parent == undefined) {
                    throw new Error("The enclosure stack is empty somehow; " +
                        "something has gone very wrong.");
                }
                topEnclosure = topEnclosure.parent;
                topEnclosure.specRow = rowIndex;
            }
            if (topEnclosure instanceof ContentsComponent && topEnclosure.canAddContent(cell)) {
                // we're inside an enclosure, after the header row
                topEnclosure.addContent(cell, devEnv);
                continue;
            }
            if (cellText.length == 0) {
                // all of the following steps require there to be some explicit content
                continue;
            }
            // either we're still in the spec row, or there's no spec row yet
            if (cellText.endsWith(":")) {
                // it's an operation, which starts a new enclosure
                const newEnclosure = constructOp(cell, devEnv);
                try {
                    topEnclosure = topEnclosure.addChild(newEnclosure, devEnv);
                }
                catch (e) {
                    cell.markError(devEnv, `Unexpected operator: ${cell.text}`, "This looks like an operator, but only a header can follow a header.");
                }
                continue;
            }
            // it's a header
            try {
                // parse the header into a Header object
                const header = parseHeaderCell(cell.text, cell.position);
                // color it properly in the interface
                header.mark(devEnv);
                if (!(topEnclosure instanceof ContentsComponent)) {
                    const newEnclosure = new ContentsComponent(header);
                    topEnclosure = topEnclosure.addChild(newEnclosure, devEnv);
                }
                topEnclosure.addHeader(header, devEnv);
            }
            catch (e) {
                cell.markError(devEnv, `Invalid header: ${cell.text}`, `Attempted to parse "${cell.text}" as a header, but could not.`);
            }
        }
    }
    return topEnclosure.sheet;
}
exports.parseCells = parseCells;

},{"./cellParser":40,"./miniParser":43,"./stateMachine":46,"./util":48,"chai":2}],46:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Maybe = exports.Empty = exports.Rep = exports.Any = exports.Rename = exports.Drop = exports.Proj = exports.Emb = exports.Not = exports.Semijoin = exports.Join = exports.Uni = exports.Seq = exports.Literalizer = exports.Lit = exports.NegationState = exports.RenameState = exports.DropState = exports.ProjectionState = exports.EmbedState = exports.RepetitionState = exports.JoinState = exports.UnionState = exports.ConcatState = exports.TrivialState = exports.LiteralState = exports.AnyCharState = exports.State = exports.Namespace = exports.CounterStack = void 0;
const util_1 = require("./util");
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
        this.defaultNamespaceName = "";
        this.defaultSymbolName = "";
        this.registeredSymbolNames = [];
    }
    hasSymbol(name) {
        return name in this.symbols;
    }
    addSymbol(name, state) {
        if (name.indexOf(".") != -1) {
            throw new Error(`Symbol names may not contain a period: ${name}`);
        }
        if (name in this.symbols) {
            throw new Error(`Redefining symbol ${name}`);
        }
        this.symbols[name] = state;
        this.defaultSymbolName = name;
    }
    resolveName(name, tryParent = true) {
        const pieces = name.split(".", 2);
        if (pieces.length == 1) {
            // it's either a local symbol name, or a local namespace name with the default symbol name,
            // or in our default namespace
            const symbol = this.symbols[name];
            if (symbol != undefined) {
                return [this, name]; // it's a local symbol
            }
            const ns = this.getLocalNamespace(name);
            if (ns != undefined && ns.defaultSymbolName != "") {
                return [ns, ns.defaultSymbolName]; // it's a local namespace name with the default symbol
            }
            if (this.defaultNamespaceName != "") {
                const ns = this.getLocalNamespace(this.defaultNamespaceName);
                if (ns != undefined) {
                    const result = ns.symbols[name];
                    if (result != undefined) {
                        return [ns, name]; // it's a symbol in our default namespace
                    }
                }
            }
        }
        else {
            // there is more than one name piece, so this is a name qualified by a namespace. look
            // for the namespace locally, and ask for that one
            const ns = this.getLocalNamespace(pieces[0]);
            if (ns != undefined) {
                const remnant = pieces.slice(1).join("");
                const result = ns.resolveName(remnant, false);
                if (result != undefined) {
                    return result;
                }
            }
        }
        // if you still can't find it, see if your parent can resolve it
        if (this.parent != undefined && tryParent) {
            const result = this.parent.resolveName(name);
            if (result != undefined) {
                return result;
            }
        }
        return undefined;
    }
    compileSymbol(name, allTapes, symbolStack, compileLevel) {
        const resolution = this.resolveName(name);
        if (resolution == undefined) {
            // this is an error due to an undefined symbol, but now isn't the time
            // to raise a fuss.  this error will be caught elsewhere and the programmer
            // will be notified
            return;
        }
        const [ns, symbolName] = resolution;
        ns.compileLocalSymbol(symbolName, allTapes, symbolStack, compileLevel);
    }
    compileLocalSymbol(name, allTapes, symbolStack, compileLevel) {
        if (name.indexOf(".") != -1) {
            throw new Error(`Trying to locally compile a qualified name ${name}; ` +
                " this should have been resolved in symbol resolution");
        }
        const compiledName = name + "@@@" + symbolStack.id;
        if (compiledName in this.symbols) {
            // already compiled it
            return;
        }
        const state = this.symbols[name];
        const compiledState = state.compileAux(allTapes, symbolStack, compileLevel);
        this.symbols[compiledName] = compiledState;
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
    addLocalNamespace(name, namespace) {
        if (name.indexOf(".") != -1) {
            throw new Error(`Namespace names may not contain a period: ${name}`);
        }
        if (name in this.childNamespaces) {
            throw new Error(`Redefining namespace ${name}`);
        }
        this.childNamespaces[name] = namespace;
        namespace.parent = this;
    }
    setDefaultNamespaceName(name) {
        if (!(name in this.childNamespaces)) {
            throw new Error(`Trying to set ${name} to the default namespace, but it doesn't exist yet.`);
        }
        this.defaultNamespaceName = name;
    }
    /**
     * Gets a namespace by name, but only local ones (i.e. children of this namespace)
     */
    getLocalNamespace(name) {
        return this.childNamespaces[name];
    }
    getLocalSymbol(name, symbolStack = undefined) {
        if (symbolStack != undefined) {
            const compiledName = this.getCompiledName(name, symbolStack);
            if (compiledName in this.symbols) {
                return this.symbols[compiledName];
            }
        }
        return this.symbols[name];
    }
    getCompiledName(symbolName, symbolStack) {
        return symbolName + "@@@" + symbolStack.id;
    }
    getSymbol(name, symbolStack = undefined) {
        const resolution = this.resolveName(name);
        if (resolution == undefined) {
            return undefined;
        }
        const [ns, localName] = resolution;
        return ns.getLocalSymbol(localName, symbolStack);
    }
    /**
     * When an EmbedState is constructed, it needs to "register" the symbol
     * name it is going to want later, so that we can (if necessary) load and
     * parse the source file that contains that symbol.
     */
    register(symbolName) {
        const pieces = symbolName.split(".");
        if (pieces.length > 2) {
            // At some point we may want to allow registration of
            // symbols with nested namespaces, but right now that's
            // a whole can of worms.
            throw new Error(`${symbolName} is not a valid reference, ` +
                " because nested namespaces (e.g. X.Y.Z) are not currently supported.");
        }
        if (this.parent == undefined) {
            // this doesn't happen in real projects, but it can happen when unit testing.
            return;
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
    constructor() {
        /**
         * Due to complications involved in compilation, States sometimes have to keep reference
         * to the vocabulary with which they were originally compiled.  (You can't run a compiled
         * state graph using a different vocab, after all, and running the collectVocab() algorithm
         * on the compiled graph might result in a different vocab.) So the following property/getter/setter
         * handles stored TapeCollections (which are the object that keeps the vocabulary for all
         * tapes).
         *
         * Not all States will actually define this property; generally it will only be the "root"
         * state of a grammar, or a state that was at some point a root state of a grammar that a
         * caller was manupulating as a reference.  (That is, for this to be defined, this State
         * was probably referenced as a variable and someone called generate() or compile() on it.)
         */
        this.allTapes = undefined;
        this.relevantTapes = undefined;
    }
    getAllTapes() {
        if (this.allTapes == undefined) {
            this.allTapes = new tapes_1.TapeCollection();
            this.collectVocab(this.allTapes, []);
        }
        return this.allTapes;
    }
    setAllTapes(tapes) {
        this.allTapes = tapes;
    }
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
    accepting(random, symbolStack) {
        return false;
    }
    resetRandom() { }
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
     * @param nextTape A Tape object identifying the name/type/vocabulary of the relevant tape
     * @param target A Token identifying what characters we need to match
     * @param symbolStack A [CounterStack] that keeps track of symbols (for embedding grammars), used for preventing infinite recursion
     * @returns A tuple <tape, match, matched, nextState>, where:
     *      * tape is the tape we matched on,
     *      * match is the intersection of the original target and our match,
     *      * matched is whether we actually made a match or ignored it (for being on the wrong tape)
     *      * nextState is the state the matched transition leads to
     */
    *dQuery(tape, target, random, symbolStack) {
        var results = [];
        var nextStates = [...this.ndQuery(tape, target, random, symbolStack)];
        for (var [nextTape, nextBits, nextMatched, next] of nextStates) {
            if (nextTape.isTrivial || !nextMatched) {
                results.push([nextTape, nextBits, nextMatched, next]);
                continue;
            }
            var newResults = [];
            for (var [otherTape, otherBits, otherMatched, otherNext] of results) {
                if (nextTape.tapeName != otherTape.tapeName || !otherMatched) {
                    newResults.push([otherTape, otherBits, otherMatched, otherNext]);
                    continue;
                }
                // they both matched
                const intersection = nextBits.and(otherBits);
                if (!intersection.isEmpty()) {
                    // there's something in the intersection
                    const union = new UnionState([next, otherNext]);
                    newResults.push([nextTape, intersection, true, union]);
                }
                nextBits = nextBits.andNot(intersection);
                otherBits = otherBits.andNot(intersection);
                // there's something left over
                if (!otherBits.isEmpty()) {
                    newResults.push([otherTape, otherBits, otherMatched, otherNext]);
                }
            }
            results = newResults;
            if (!nextBits.isEmpty()) {
                results.push([nextTape, nextBits, nextMatched, next]);
            }
        }
        yield* results;
    }
    runUnitTest(test) {
        const testingState = Semijoin(this, test);
        const tapeCollection = this.getAllTapes(); // see the commentary on .parse() for why we have
        test.collectVocab(tapeCollection, []); // to do something special with the tapes.
        testingState.allTapes = tapeCollection;
        const results = [...testingState.generate()];
        return (results.length != 0);
    }
    *parse(inputs, randomize = false, maxRecursion = 4, maxChars = 1000) {
        const inputLiterals = [];
        for (const tapeName in inputs) {
            const value = inputs[tapeName];
            const inputLiteral = Lit(tapeName, value);
            inputLiterals.push(inputLiteral);
        }
        var startState = this;
        if (inputLiterals.length > 0) {
            const inputSeq = Seq(...inputLiterals);
            startState = Semijoin(startState, inputSeq);
            const tapeCollection = this.getAllTapes(); // in case this state has already
            // been compiled, we need to start the algorithm with the same vocab.
            // if it hasn't been compiled, .allTapes always starts as undefined anyway,
            // so it's no change.
            inputSeq.collectVocab(tapeCollection, []);
            // add any new characters in the inputs to the vocab
            //  this would actually happen automatically
            // anyway, but I'd rather do it explicitly here 
            // than rely on an undocumented side-effect
            startState.allTapes = tapeCollection;
        }
        yield* startState.generate(randomize, maxRecursion, maxChars);
    }
    sample(restriction, numSamples = 1, maxTries = 1000, maxRecursion = 4, maxChars = 1000) {
        var results = [];
        var tries = 0;
        while (results.length < numSamples && tries < maxTries) {
            const gen = this.parse(restriction, true, maxRecursion, maxChars);
            const firstResult = util_1.iterTake(gen, 1);
            results = results.concat(firstResult);
            tries++;
        }
        return results;
    }
    /**
     * Performs a breadth-first traversal of the graph.  This will be the function that most
     * clients will be calling.
     *
     * Even parsing is just calling generate.  (It's a separate function only because of a
     * complication with compilation.)  To do parses, we
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
    *generate(randomize = false, maxRecursion = 4, maxChars = 1000) {
        const symbolStack = new CounterStack(maxRecursion);
        var startState = this;
        const allTapes = this.getAllTapes();
        const initialOutput = new tapes_1.MultiTapeOutput();
        if (randomize) {
            this.resetRandom(); // just in case there are leftover random children from
        } // a previous call to generate()
        var stateQueue = [[initialOutput, startState]];
        var chars = 0;
        while (stateQueue.length > 0 && chars < maxChars) {
            var nextQueue = [];
            for (const [prevOutput, prevState] of stateQueue) {
                if (prevState.accepting(randomize, symbolStack)) {
                    yield* prevOutput.toStrings(randomize);
                }
                for (const [tape, c, matched, newState] of prevState.dQuery(allTapes, tapes_1.ANY_CHAR, randomize, symbolStack)) {
                    if (!matched) {
                        throw new Error("Something went wrong, got all the way through without a match");
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
    /**
     * Collects the names of all tapes relevant to this state.  The names are those
     * that this state would "see" (that is, if this state refers to a RenameState,
     * it uses the renamed tape name, not whatever that tape is referred to "inside"
     * the RenameState).
     *
     * This will be the same result as if we called "collectVocab" on this state with an empty
     * TapeCollection, but we don't go to the trouble of collecting the character vocabulary.
     */
    getRelevantTapes(stateStack) {
        if (this.relevantTapes == undefined) {
            this.relevantTapes = new Set();
        }
        return this.relevantTapes;
    }
    caresAbout(tape) {
        if (tape.tapeName == "__ANY_TAPE__")
            return true;
        const symbolStack = new CounterStack(2);
        return this.getRelevantTapes(symbolStack).has(tape.tapeName);
    }
    compileAux(allTapes, symbolStack, compileLevel) {
        return this;
    }
    compile(compileLevel, maxRecursion = 4) {
        const allTapes = this.getAllTapes();
        return this.compileAux(allTapes, new CounterStack(maxRecursion), compileLevel);
    }
}
exports.State = State;
class CompiledState extends State {
    constructor(originalState, allTapes, symbolStack, compileLevel) {
        super();
        this.transitionsByTape = {};
        this.id = `compiled(${originalState.id}@${symbolStack.id})`;
        // your relevant states, and your accepting status, are inherited from the original
        this.relevantTapes = originalState.getRelevantTapes(symbolStack);
        this.acceptingOnStart = originalState.accepting(false, symbolStack);
        // then run dQuery and remember the results
        const tapes = [allTapes, ...allTapes.tapes.values()];
        for (const tape of tapes) {
            for (const [resTape, resToken, resMatched, resNext] of originalState.dQuery(tape, tape.any(), false, symbolStack)) {
                const compiledNext = resNext.compileAux(allTapes, symbolStack, compileLevel - 1);
                this.addTransition(tape, resTape, resToken, resMatched, compiledNext);
            }
        }
        this.allTapes = allTapes;
    }
    addTransition(queryTape, resultTape, token, matched, next) {
        if (!(queryTape.tapeName in this.transitionsByTape)) {
            this.transitionsByTape[queryTape.tapeName] = [];
        }
        this.transitionsByTape[queryTape.tapeName].push([resultTape, token, matched, next]);
    }
    accepting(random, symbolStack) {
        return this.acceptingOnStart;
    }
    /**
     * For CompiledState, query results are already deterministic (in the sense of dQuery;
     * they might not be unique), because they themselves are the result of calling dQuery.
     * So it's not necessary to determinize them again; we just yield ndQuery.
     */
    *dQuery(tape, target, random, symbolStack) {
        yield* this.ndQuery(tape, target, random, symbolStack);
    }
    *ndQuery(tape, target, random, symbolStack) {
        const transitions = this.transitionsByTape[tape.tapeName];
        if (transitions == undefined) {
            // no transitions were recording for this tape, it must have failed for all possibilities
            return;
        }
        for (const [origResultTape, token, matched, next] of transitions) {
            if (origResultTape.isTrivial) { // result was hidden by a Projection or Drop
                yield [origResultTape, token, matched, next];
                return;
            }
            const matchedTape = tape.matchTape(origResultTape.tapeName);
            if (matchedTape == undefined) {
                throw new Error(`Failed to match ${tape.tapeName} to ${origResultTape.tapeName}..?`);
            }
            const resultToken = matchedTape.match(token, target);
            if (resultToken.isEmpty()) {
                continue;
            }
            yield [matchedTape, resultToken, matched, next];
        }
    }
}
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
    *ndQuery(tape, target, random, symbolStack) {
        const matchedTape = tape.matchTape(this.tapeName);
        if (matchedTape == undefined) {
            yield [tape, target, false, this];
            return;
        }
        if (this.accepting(random, symbolStack)) {
            return;
        }
        const bits = this.getToken(matchedTape);
        const result = matchedTape.match(bits, target);
        if (result.isEmpty()) {
            return;
        }
        const nextState = this.successor();
        yield [matchedTape, result, true, nextState];
    }
    getRelevantTapes(stateStack) {
        if (this.relevantTapes == undefined) {
            this.relevantTapes = new Set([this.tapeName]);
        }
        return this.relevantTapes;
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
    getToken(tape) {
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
    constructor(tape, text, index = 0) {
        super(tape);
        this.text = text;
        this.index = index;
    }
    get id() {
        return `${this.tapeName}:${this.text}[${this.index}]`;
    }
    accepting(random, symbolStack) {
        return this.index >= this.text.length;
    }
    collectVocab(tapes, stateStack) {
        tapes.tokenize(this.tapeName, this.text);
    }
    getToken(tape) {
        return tape.tokenize(tape.tapeName, this.text[this.index])[0];
    }
    successor() {
        const newText = this.text;
        return new LiteralState(this.tapeName, this.text, this.index + 1);
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
    accepting(random, symbolStack) {
        return true;
    }
    *ndQuery(tape, target, random, symbolStack) { }
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
    constructor(child1, child2, relevantTapes = undefined) {
        super();
        this.child1 = child1;
        this.child2 = child2;
        this.relevantTapes = relevantTapes;
    }
    collectVocab(tapes, stateStack) {
        this.child1.collectVocab(tapes, stateStack);
        this.child2.collectVocab(tapes, stateStack);
    }
    resetRandom() {
        this.child1.resetRandom();
        this.child2.resetRandom();
    }
    getRelevantTapes(stateStack) {
        if (this.relevantTapes == undefined) {
            const child1tapes = this.child1.getRelevantTapes(stateStack);
            const child2tapes = this.child2.getRelevantTapes(stateStack);
            this.relevantTapes = new Set([...child1tapes, ...child2tapes]);
        }
        return this.relevantTapes;
    }
    get id() {
        return `${this.constructor.name}(${this.child1.id},${this.child2.id})`;
    }
    accepting(random, symbolStack) {
        return this.child1.accepting(random, symbolStack) && this.child2.accepting(random, symbolStack);
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
    constructor(child1, child2, child1Done = false, relevantTapes = undefined) {
        super(child1, child2, relevantTapes);
        this.child1Done = child1Done;
    }
    compileAux(allTapes, symbolStack, compileLevel) {
        if (compileLevel <= 0) {
            return this;
        }
        const newChild1 = this.child1.compileAux(allTapes, symbolStack, compileLevel);
        const newChild2 = this.child2.compileAux(allTapes, symbolStack, compileLevel);
        const newThis = new ConcatState(newChild1, newChild2, this.child1Done, this.relevantTapes);
        return new CompiledState(newThis, allTapes, symbolStack, compileLevel);
    }
    *ndQuery(tape, target, random, symbolStack) {
        if (!this.caresAbout(tape)) {
            // if neither child cares, just short circuit this rather than bother with all the rest
            yield [tape, target, false, this];
            return;
        }
        if (this.child1Done) {
            if (!this.child2.caresAbout(tape)) {
                return;
            }
            for (const [c2tape, c2text, c2matched, c2next] of this.child2.dQuery(tape, target, random, symbolStack)) {
                const successor = new ConcatState(this.child1, c2next, true, this.relevantTapes);
                yield [c2tape, c2text, c2matched, successor];
            }
            return;
        }
        var yieldedAlready = false;
        if (this.child1.accepting(random, symbolStack)) {
            const successor = new ConcatState(this.child1, this.child2, true);
            yield* successor.dQuery(tape, target, random, symbolStack);
            yieldedAlready = true;
        }
        if (this.child1.caresAbout(tape)) {
            for (const [c1tape, c1text, c1matched, c1next] of this.child1.dQuery(tape, target, random, symbolStack)) {
                const successor = new ConcatState(c1next, this.child2, false, this.relevantTapes);
                yield [c1tape, c1text, c1matched, successor];
            }
            return;
        }
        if (yieldedAlready == true) {
            return;
        }
        // child2 must care, otherwise one of the previous conditions would have triggered
        for (const [c2tape, c2text, c2matched, c2next] of this.child2.dQuery(tape, target, random, symbolStack)) {
            const successor = new ConcatState(this.child1, c2next, false, this.relevantTapes);
            yield [c2tape, c2text, c2matched, successor];
        }
    }
}
exports.ConcatState = ConcatState;
class UnionState extends State {
    constructor(children) {
        super();
        this.children = children;
        this.randomChild = null;
    }
    compileAux(allTapes, symbolStack, compileLevel) {
        if (compileLevel <= 0) {
            return this;
        }
        const newChildren = this.children.map(c => c.compileAux(allTapes, symbolStack, compileLevel));
        const newThis = new UnionState(newChildren);
        return new CompiledState(newThis, allTapes, symbolStack, compileLevel);
    }
    resetRandom() {
        this.randomChild = null;
        for (const child of this.children) {
            child.resetRandom();
        }
    }
    collectVocab(tapes, stateStack) {
        for (const child of this.children) {
            child.collectVocab(tapes, stateStack);
        }
    }
    getRelevantTapes(stateStack) {
        if (this.relevantTapes == undefined) {
            this.relevantTapes = new Set();
            for (const child of this.children) {
                const childTapes = child.getRelevantTapes(stateStack);
                this.relevantTapes = new Set([...this.relevantTapes, ...childTapes]);
            }
        }
        return this.relevantTapes;
    }
    get id() {
        return `${this.constructor.name}(${this.children.map(c => c.id).join("|")})`;
    }
    getRandomChild() {
        if (this.randomChild == null) {
            this.randomChild = this.children[Math.floor(Math.random() * this.children.length)];
        }
        return this.randomChild;
    }
    accepting(random, symbolStack) {
        if (random) {
            return this.getRandomChild().accepting(random, symbolStack);
        }
        for (const child of this.children) {
            if (child.accepting(random, symbolStack)) {
                return true;
            }
        }
        return false;
    }
    *ndQuery(tape, target, random, symbolStack) {
        if (random) {
            yield* this.getRandomChild().dQuery(tape, target, random, symbolStack);
            return;
        }
        for (const child of this.children) {
            yield* child.dQuery(tape, target, random, symbolStack);
        }
    }
}
exports.UnionState = UnionState;
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
 * Implements a left semijoin (which we use for unit testing).
 *
 * To test that an entry E is in the grammar G, we execute
 *
 *      Semijoin(G, E)
 *
 * This requires that there be an entry in G that matches every field in E.
 * (There could be additional fields in the relevant entries in G that you don't
 * care about.  In practice it's difficult to anticipate all the different
 * fields that G might have in a complex grammar, to make sure E has all of them.)
 */
class SemijoinState extends BinaryState {
    /**
     * Because .successor() on both this and its descendent JoinState are
     * so simple, we only have to write one compileAux() for both
     */
    compileAux(allTapes, symbolStack, compileLevel) {
        if (compileLevel <= 0) {
            return this;
        }
        const newChild1 = this.child1.compileAux(allTapes, symbolStack, compileLevel);
        const newChild2 = this.child2.compileAux(allTapes, symbolStack, compileLevel);
        const newThis = this.successor(newChild1, newChild2);
        return new CompiledState(newThis, allTapes, symbolStack, compileLevel);
    }
    resetRandom() {
        this.child1.resetRandom();
        this.child2.resetRandom();
    }
    /**
    * We factor out the logic into a separate function (one that doesn't specifically
    * refer to the child1/child2 properties of this object) because it's the same algorithm
    * used twice in a descendent class, JoinState.  A join is just the priority union of the
    * left and right semijoins, and the right semijoin is just the left semijoin with the
    * children reversed.  So we let the caller decide which child is "c1" and which is "c2" for
    * the purposes of the semijoin.
    */
    *ndQueryLeft(tape, target, c1, c2, random, symbolStack) {
        for (const [c1tape, c1target, c1matched, c1next] of c1.dQuery(tape, target, random, symbolStack)) {
            if (c1tape.isTrivial) {
                // c1 contained a ProjectionState that hides the original tape; move on without
                // asking c2 to match anything.
                const successor = this.successor(c1next, c2);
                yield [c1tape, c1target, c1matched, successor];
                continue;
            }
            /*
            if (!c2.caresAbout(c1tape)) {
                const successor = this.successor(c1next, c2);
                yield [c1tape, c1target, c1matched, successor];
                continue;
            } */
            /**
             * Even if we're random, we don't ask the other side to randomize; this
             * would end up having surprising effects.
             */
            for (const [c2tape, c2target, c2matched, c2next] of c2.dQuery(c1tape, c1target, false, symbolStack)) {
                const successor = this.successor(c1next, c2next);
                yield [c2tape, c2target, c1matched || c2matched, successor];
            }
        }
    }
    successor(newChild1, newChild2) {
        return new SemijoinState(newChild1, newChild2, this.relevantTapes);
    }
    *ndQuery(tape, target, random, symbolStack) {
        yield* this.ndQueryLeft(tape, target, this.child1, this.child2, random, symbolStack);
    }
    accepting(random, symbolStack) {
        return this.child1.accepting(random, symbolStack) && this.child2.accepting(false, symbolStack);
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
class JoinState extends SemijoinState {
    successor(newChild1, newChild2) {
        return new JoinState(newChild1, newChild2, this.relevantTapes);
    }
    accepting(random, symbolStack) {
        return this.child1.accepting(random, symbolStack) && this.child2.accepting(random, symbolStack);
    }
    *ndQuery(tape, target, random, symbolStack) {
        const leftJoin = this.ndQueryLeft(tape, target, this.child1, this.child2, random, symbolStack);
        const rightJoin = this.ndQueryLeft(tape, target, this.child2, this.child1, random, symbolStack);
        if (this.child1.accepting(random, symbolStack)) {
            yield* iterPriorityUnion(rightJoin, leftJoin);
            return;
        }
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
    resetRandom() {
        this.child.resetRandom();
    }
    get id() {
        return `${this.constructor.name}(${this.child.id})`;
    }
    collectVocab(tapes, stateStack) {
        this.child.collectVocab(tapes, stateStack);
    }
    getRelevantTapes(stateStack) {
        if (this.relevantTapes == undefined) {
            this.relevantTapes = this.child.getRelevantTapes(stateStack);
        }
        return this.relevantTapes;
    }
    accepting(random, symbolStack) {
        return this.child.accepting(random, symbolStack);
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
    constructor(child, minReps = 0, maxReps = Infinity, index = 0, initialChild) {
        super();
        this.child = child;
        this.minReps = minReps;
        this.maxReps = maxReps;
        this.index = index;
        this.initialChild = initialChild;
        this.randomReps = null;
    }
    compileAux(allTapes, symbolStack, compileLevel) {
        if (compileLevel <= 0) {
            return this;
        }
        const newInitialChild = this.initialChild.compileAux(allTapes, symbolStack, compileLevel);
        const newThis = new RepetitionState(this.child, this.minReps, this.maxReps, this.index, newInitialChild);
        return new CompiledState(newThis, allTapes, symbolStack, compileLevel);
    }
    collectVocab(tapes, stateStack) {
        this.initialChild.collectVocab(tapes, stateStack);
    }
    resetRandom() {
        this.randomReps = null;
        this.child.resetRandom();
        this.initialChild.resetRandom();
    }
    getRelevantTapes(stateStack) {
        if (this.relevantTapes == undefined) {
            this.relevantTapes = this.initialChild.getRelevantTapes(stateStack);
        }
        return this.relevantTapes;
    }
    accepting(random, symbolStack) {
        if (random) {
            return this.index == this.getRandomReps() &&
                this.child.accepting(random, symbolStack);
        }
        return this.index >= this.minReps &&
            this.index <= this.maxReps &&
            this.child.accepting(random, symbolStack);
    }
    getRandomReps() {
        if (this.randomReps == null) {
            if (this.minReps > this.maxReps) {
                this.randomReps = -1;
                return this.randomReps;
            }
            if (this.minReps == this.maxReps) {
                this.randomReps = this.minReps;
                return this.randomReps;
            }
            const maxReps = (this.maxReps != Infinity) ? this.maxReps : 10;
            const range = maxReps - this.minReps + 1;
            this.randomReps = this.minReps + Math.floor(Math.random() * range);
        }
        return this.randomReps;
    }
    successor(nextChild, newIndex, random) {
        if (random) {
            const randomReps = this.getRandomReps();
            return new RepetitionState(nextChild, randomReps, randomReps, newIndex, this.initialChild);
        }
        return new RepetitionState(nextChild, this.minReps, this.maxReps, newIndex, this.initialChild);
    }
    *ndQuery(tape, target, random, symbolStack) {
        if (this.index > this.maxReps) {
            return;
        }
        var yieldedAlready = false;
        if (this.child.accepting(random, symbolStack)) {
            // we just started, or the child is accepting, so our successor increases its index
            // and starts again with child.
            const successor = this.successor(this.initialChild, this.index + 1, random);
            for (const result of successor.dQuery(tape, target, random, symbolStack)) {
                yield result;
                yieldedAlready = true;
            }
        }
        if (yieldedAlready) {
            return;
        }
        for (const [childTape, childText, childMatched, childNext] of this.child.dQuery(tape, target, random, symbolStack)) {
            if (!childMatched) { // child doesn't care, neither do we
                yield [childTape, childText, false, this];
                continue;
            }
            const successor = this.successor(childNext, this.index, random);
            yield [childTape, childText, childMatched, successor];
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
class EmbedState extends State {
    constructor(symbolName, namespace, _child = undefined, relevantTapes = undefined) {
        super();
        this.symbolName = symbolName;
        this.namespace = namespace;
        this._child = _child;
        // need to register our symbol name with the namespace, in case
        // the referred-to symbol is defined in a file we haven't yet loaded.
        namespace.register(symbolName);
        this.relevantTapes = relevantTapes;
    }
    get id() {
        return `${this.constructor.name}(${this.symbolName})`;
    }
    compileAux(allTapes, symbolStack, compileLevel) {
        if (compileLevel <= 0) {
            return this;
        }
        if (symbolStack.exceedsMax(this.symbolName)) {
            return this;
        }
        const newStack = symbolStack.add(this.symbolName);
        this.namespace.compileSymbol(this.symbolName, allTapes, newStack, compileLevel);
        return new CompiledState(this, allTapes, symbolStack, compileLevel);
    }
    collectVocab(tapes, stateStack) {
        if (stateStack.indexOf(this.symbolName) != -1) {
            return;
        }
        const newStack = [...stateStack, this.symbolName];
        this.getChild().collectVocab(tapes, newStack);
    }
    getRelevantTapes(stateStack) {
        if (this.relevantTapes == undefined) {
            if (stateStack.exceedsMax(this.symbolName)) {
                this.relevantTapes = new Set();
            }
            else {
                const newStack = stateStack.add(this.symbolName);
                this.relevantTapes = this.getChild(newStack).getRelevantTapes(newStack);
            }
        }
        return this.relevantTapes;
    }
    /*
    public get child(): State {
        if (this._child == undefined) {
            this._child = this.namespace.getSymbol(this.symbolName);
            if (this._child == undefined) {
                // this is an error, typically caused by programmer error,
                // but now is not when we notify the programmer.  just
                // fail gracefully by treating the child as the empty grammar
                this._child = Empty();
            }
        }
        return this._child;
    } */
    getChild(symbolStack = undefined) {
        if (this._child == undefined) {
            const child = this.namespace.getSymbol(this.symbolName, symbolStack);
            if (child == undefined) {
                // this is an error, due to the programmer referring to an undefined
                // symbol, but now is not the time to complain.  it'll be caught elsewhere
                // and the programmer will be notified.  just fail gracefully by treating
                // the child as the empty grammar
                return Empty();
            }
            return child;
        }
        return this._child;
    }
    accepting(random, symbolStack) {
        if (symbolStack.exceedsMax(this.symbolName)) {
            return false;
        }
        const newStack = symbolStack.add(this.symbolName);
        return this.getChild(newStack).accepting(random, newStack);
    }
    *ndQuery(tape, target, random, symbolStack) {
        if (symbolStack.exceedsMax(this.symbolName)) {
            return;
        }
        symbolStack = symbolStack.add(this.symbolName);
        const child = this.getChild(symbolStack);
        if (random) {
            child.resetRandom();
        }
        for (const [childchildTape, childTarget, childMatched, childNext] of child.dQuery(tape, target, random, symbolStack)) {
            const successor = new EmbedState(this.symbolName, this.namespace, childNext, this.relevantTapes);
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
    compileAux(allTapes, symbolStack, compileLevel) {
        if (compileLevel <= 0) {
            return this;
        }
        const newChild = this.child.compileAux(allTapes, symbolStack, compileLevel);
        const newThis = new ProjectionState(newChild, this.tapeRestriction);
        return new CompiledState(newThis, allTapes, symbolStack, compileLevel);
    }
    getRelevantTapes(stateStack) {
        if (this.relevantTapes == undefined) {
            this.relevantTapes = this.tapeRestriction;
        }
        return this.relevantTapes;
    }
    *ndQuery(tape, target, random, symbolStack) {
        if (tape.tapeName != "__ANY_TAPE__" && !this.tapeRestriction.has(tape.tapeName)) {
            // if it's not a tape we care about, go nowhere
            yield [tape, target, false, this];
            return;
        }
        for (var [childTape, childTarget, childMatch, childNext] of this.child.dQuery(tape, target, random, symbolStack)) {
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
 * This is the opposite of ProjectionState; in which you specify what you drop rather than what you keep.
 * Either is sufficient to implement relational algebra; you only really need one of these.
 */
class DropState extends UnaryState {
    constructor(child, droppedTape) {
        super();
        this.child = child;
        this.droppedTape = droppedTape;
    }
    getRelevantTapes(stateStack) {
        const result = new Set([...this.child.getRelevantTapes(stateStack)]);
        result.delete(this.droppedTape);
        return result;
    }
    compileAux(allTapes, symbolStack, compileLevel) {
        if (compileLevel <= 0) {
            return this;
        }
        const newChild = this.child.compileAux(allTapes, symbolStack, compileLevel);
        const newThis = new DropState(newChild, this.droppedTape);
        return new CompiledState(newThis, allTapes, symbolStack, compileLevel);
    }
    *ndQuery(tape, target, random, symbolStack) {
        if (tape.tapeName == this.droppedTape) {
            // don't pass it on, just stay here
            yield [tape, target, false, this];
            return;
        }
        for (var [childTape, childTarget, childMatch, childNext] of this.child.dQuery(tape, target, random, symbolStack)) {
            if (childTape.tapeName == this.droppedTape) {
                // even if our child yields content on a restricted tape, 
                // we don't let our own parent know about it
                childTape = new tapes_1.TapeCollection();
                childTarget = tapes_1.NO_CHAR;
            }
            yield [childTape, childTarget, childMatch,
                new DropState(childNext, this.droppedTape)];
        }
    }
}
exports.DropState = DropState;
/**
 * Implements the Rename operation from relational algebra.
 *
 */
class RenameState extends UnaryState {
    constructor(child, fromTape, toTape, relevantTapes = undefined) {
        super();
        this.child = child;
        this.fromTape = fromTape;
        this.toTape = toTape;
        this.relevantTapes = relevantTapes;
    }
    collectVocab(tapes, stateStack) {
        tapes = new tapes_1.RenamedTape(tapes, this.fromTape, this.toTape);
        this.child.collectVocab(tapes, stateStack);
    }
    getRelevantTapes(stateStack) {
        if (this.relevantTapes == undefined) {
            this.relevantTapes = new Set();
            for (const tapeName of this.child.getRelevantTapes(stateStack)) {
                if (tapeName == this.fromTape) {
                    this.relevantTapes.add(this.toTape);
                }
                else {
                    this.relevantTapes.add(tapeName);
                }
            }
        }
        return this.relevantTapes;
    }
    *ndQuery(tape, target, random, symbolStack) {
        var rememberToUnwrapTape = false;
        if (tape.tapeName == this.toTape || tape.tapeName == "__ANY_TAPE__") {
            tape = new tapes_1.RenamedTape(tape, this.fromTape, this.toTape);
            rememberToUnwrapTape = true;
        }
        for (var [childTape, childTarget, childMatched, childNext] of this.child.dQuery(tape, target, random, symbolStack)) {
            if (rememberToUnwrapTape && childTape instanceof tapes_1.RenamedTape) {
                childTape = childTape.child;
            }
            yield [childTape, childTarget, childMatched, new RenameState(childNext, this.fromTape, this.toTape, this.relevantTapes)];
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
    constructor(child, relevantTapes = undefined) {
        super();
        this.child = child;
        this.relevantTapes = relevantTapes;
    }
    compileAux(allTapes, symbolStack, compileLevel) {
        if (compileLevel <= 0) {
            return this;
        }
        var newChild = this.child;
        if (newChild != undefined) {
            newChild = newChild.compileAux(allTapes, symbolStack, compileLevel);
        }
        const newThis = new NegationState(newChild, this.relevantTapes);
        return new CompiledState(newThis, allTapes, symbolStack, compileLevel);
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
    getRelevantTapes(stateStack) {
        if (this.relevantTapes == undefined) {
            if (this.child == undefined) {
                this.relevantTapes = new Set();
            }
            else {
                this.relevantTapes = this.child.getRelevantTapes(stateStack);
            }
            if (this.relevantTapes.size > 1) {
                throw new Error("We do not currently support negations of grammars that reference 2+ tapes");
            }
        }
        return this.relevantTapes;
    }
    accepting(random, symbolStack) {
        if (this.child == undefined) {
            return true;
        }
        return !this.child.accepting(random, symbolStack);
    }
    *ndQuery(tape, target, random, symbolStack) {
        if (random) {
            console.log("Warning, querying a negation randomly");
        }
        var remainderTapeName = [...this.getRelevantTapes(symbolStack)][0];
        var remainderTape = tape.matchTape(remainderTapeName);
        if (remainderTape == undefined) { // we don't care about this
            yield [tape, target, false, this];
            return;
        }
        if (this.child == undefined) { // we've can't possibly match the child, so we're basically .* from now on
            yield [remainderTape, target, true, this];
            return;
        }
        var remainder = new tapes_1.Token(target.bits.clone());
        for (const [childTape, childText, childMatched, childNext] of this.child.dQuery(tape, target, random, symbolStack)) {
            remainder = remainder.andNot(childText);
            yield [childTape, childText, childMatched, new NegationState(childNext, this.relevantTapes)];
        }
        yield [remainderTape, remainder, true, new NegationState(undefined, this.relevantTapes)];
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
        return Empty();
    }
    if (children.length == 1) {
        return children[0];
    }
    return new ConcatState(children[0], Seq(...children.slice(1)));
}
exports.Seq = Seq;
function Uni(...children) {
    if (children.length == 0) {
        return Empty();
    }
    return new UnionState(children);
    /*
    if (children.length == 1) {
        return children[0];
    }

    return new UnionState(children[0], Uni(...children.slice(1))); */
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
function Semijoin(child1, child2) {
    return new SemijoinState(child1, child2);
}
exports.Semijoin = Semijoin;
function Not(child) {
    return new NegationState(child);
}
exports.Not = Not;
function Emb(symbolName, namespace) {
    return new EmbedState(symbolName, namespace);
}
exports.Emb = Emb;
function Proj(child, ...tape) {
    return new ProjectionState(child, new Set(tape));
}
exports.Proj = Proj;
function Drop(child, tape) {
    return new DropState(child, tape);
}
exports.Drop = Drop;
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

},{"./tapes":47,"./util":48}],47:[function(require,module,exports){
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
    constructor(tapeName, current = undefined, prev = undefined, strToIndex = new Map(), indexToStr = new Map()) {
        super();
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
    get isTrivial() {
        return this.tapes.size == 0;
    }
    /*
    public addTape(tape: Tape): void {
        this.tapes.set(tape.tapeName, tape);
    } */
    getTapeNames() {
        return [...this.tapes.keys()];
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

},{"bitset":39}],48:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setChain = exports.setIntersection = exports.RGBtoString = exports.HSVtoRGB = exports.iterTake = exports.shuffleArray = exports.meanAngleDeg = exports.DUMMY_POSITION = exports.TabularComponent = exports.CellPosition = void 0;
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
class TabularComponent {
    constructor(text, position) {
        this.text = text;
        this.position = position;
    }
    mark(devEnv) { }
    markError(devEnv, shortMsg, msg) {
        devEnv.markError(this.position.sheet, this.position.row, this.position.col, shortMsg, msg, "error");
    }
    markWarning(devEnv, shortMsg, msg) {
        devEnv.markError(this.position.sheet, this.position.row, this.position.col, shortMsg, msg, "warning");
    }
    markInfo(devEnv, shortMsg, msg) {
        devEnv.markError(this.position.sheet, this.position.row, this.position.col, shortMsg, msg, "info");
    }
}
exports.TabularComponent = TabularComponent;
exports.DUMMY_POSITION = new CellPosition("?", -1, -1);
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

},{}]},{},[42])(42)
});