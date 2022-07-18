Coding standards
================

Here are some coding standards/styles we try to adhere to in developing the Gramble interpreter and related tools.

    1. We avoid using exceptions for ordinary/expected errors; an exception means that something has gone seriously wrong (like blowing the stack).  There are some times in the code where we say `throw new Error(msg)` but these should never be thrown; they're an alarm that something is seriously wrong somewhere in the code.

    Errors on the Gramble programmer's part are treated as an ordinary/expected occurence, and no mistake on the programmer's part should cause the Gramble interpreter to throw/crash/etc.  When the programmer expresses something erroneous or impossible, we try to detect that, send an appropriate message to the dev environment, and construct a reasonable placeholder grammar in place of the erroneous grammar.  (Usually this is just EPSILON.)

    For a concrete example of this, consider what happens if the programmer refers to a symbol FOO.BAR and there's no symbol BAR on sheet FOO.  Ordinarily, a reference to a symbol becomes an EmbedGrammar, and then an EmbedExpr, which would (during execution) attempt to find FOO.BAR.  In this case, that would lead to an exception.  We don't let it get to this in the first place.  Instead, if the reference can't be resolved at compile time, it ends up as an UnresolvedEmbedGrammar, and when it's time to create an Expr we signal an error message to the dev environment, then return an EpsilonExpr instead.  If ever we try to find FOO.BAR and this exception throws, something has gone wrong on OUR part: we've somehow created an EmbedExpr where we should have created an UnresolvedEmbedExpr, and we should fix that ASAP.

    2. When possible, we tend towards a more functional/immutable style (e.g. using const, cloning state rather than mutating it, avoiding side effects, etc.).  In the past, when we've kept mutable state around, things got very difficult to reason about, and so the codebase has slowly evolved so that formerly mutable state is increasingly expressed instead by stateless transformations instead, particular in the core interpreter.

    But we're not dogmatic about it, and it's important to realize that JS is not going to support an idiomatically functional style for non-trivial programs. The stack isn't very deep, tail calls aren't optimized away... you can easily blow the stack by trying to recurse down a linked list rather than looping along an array.

    At the level of the individual block we're mostly using imperative style (e.g. for loops and accumulating results in a variable), rather than a more functional style (e.g. `arr.map(x => ...)`).  We think this is just more accessible to more programmers; functional-style JS can be a bit hard to parse if you're not used to it.  But this isn't a hard-and-fast rule, there are plenty of maps and filters in the code.  The rule is more "When it doubt, do what you think is easiest to read in that circumstance."

    3. We use Typescript's types strictly, and avoid using `any`.  When it's possible for a variable/return/etc. to be undefined or null, include this in the type signature.  (E.g., `number | undefined` rather than the un-type-checked possibility of undefined results.)

    4. `let` and `const` rather than `var`.

    5. For the client-facing API, remember that for the most part, clients will be interfacing with the library from vanilla JavaScript.  So don't use TypeScript-specific conventions in client-facing APIs like Interpreter.  (E.g., TS enums compile to something complicated, and programmers of client code shouldn't have to understand the details of that in order to call our APIs.)

Other things to keep in mind:

    1. Don't attempt to construct Expr objects directly (e.g. `new LiteralExpr`); there are "smart constructors" called constructX (e.g. `constructLiteral`) that handle some special cases.  If you don't use these, you can get bugs (particularly due to expressions not simplifying down in ways that they have to, for the algorithm to work properly).  Also, you can't assume that constructX results in an XExpr (for example, asking for a trivial X may result in getting an epsilon or null), that's why these are functions rather than constructors.

    2. When constructing grammars for tests, there's a set of convenience functions Seq, Uni, Rep, etc. for that.  These let you not worry about how the grammars relate to cells and such.  But don't use these when constructing grammars from TSTs (precisely because that's when it's important to relate grammars to cells and such).

    3. Try to express changes to the core as GrammarTransforms, rather than (say) adding a new function to each Grammar/Expr.  Transforms represent stateless tree-to-tree transformations of the grammar, and have proven easier to maintain and less buggy.  They use the Visitor pattern [https://en.wikipedia.org/wiki/Visitor_pattern].  
    
    It's easiest to inherit from IdentityTransform, which does a plain clone of the tree, and only implement transformations to the nodes you care about.  (See any of the other transforms for an example.)  Keep in mind that any internal state is lost every time you transform a tree -- particularly, _tapes.  (This is why most transforms run .calculateTapes() right before they run, it's to make sure the tree has the correct tape information that it needs to make whatever decisions it makes.)

Things we don't have standards for... maybe we should, but currently we're all over the place.

-- We rather variably use interfaces, inheritance, union types, and generics, depending on the circumstance.  (Btw, Google Apps Script (GAS), the dialect of JavaScript used inside GSuite), does not seem to support inheritance between classes defined in different files.  So some places where you might be like "This would be easier with inheritance", that's probably the historical reason why we didn't.)

-- We sometimes use objects (e.g. `{[key:string]: string}`) and sometimes maps (e.g. `Map<string, string>`).

-- We don't enforce any particular syntax/indentation/bracketing/etc. standards.  Do what you prefer but accept that someone else might change it later.

-- Don't worry too much about making things protected/private; it's okay if you want to default to public and worry about visibility later.  Encapsulation isn't our main way of ensuring safety anyway.  (I think the only place we're really using `protected` for safety is in Grammar._tapes... and not coincidentally, that's one of the only really important parts of the code that's still using mutable state.)