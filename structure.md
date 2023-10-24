Structure of the interpreter
============================

You can view the interpreter as transforming one or more sheets (that is, CSV files or spreadsheets inside Google Sheets) into a very complicated regex-like formula, and then running a particular algorithm (Brzozowski's algorithm) on that formula to generate/parse/sample entries from it.

Interpreters (interpreter.ts) serve as an Facade (https://en.wikipedia.org/wiki/Facade_pattern) to the more complex operations below.  You just instantiate one with some sheets or a grammar object, and ask it to generate/parse/sample.

Interpreter shepherds the sheets through four levels of representation:

1. Source: raw grids of cells, as written by the programmer. 

A stack-based parsing algorithm steps through these sheets cell-by-cell and creates:

2. TSTs (Tabular syntax trees; tsts.ts), which represent the basic syntactic units of the program (operations, blocks, headers/content, etc.).  These are not all in a one-to-one relationship with linguistic structure yet (e.g., some horizontal rows will later be interpreted as sequences of morphemes, and others as filters).  

    Within the individual cells there are also "mini-languages" that specify complex headers (headers.ts), complex operations (ops.ts), regexes (regex.ts), etc.  Cell text is also parsed into appropriate objects (e.g. Headers and Ops and Regexes) during this step.

TSTs/headers/regexes are transformed recursively into:

3. Grammars (grammars.ts), which represent the high-level linguistic structure of the program (e.g., sequences, alternations, replacement rules, filters, etc.).  This level is where we do most of the static analysis: do all of the symbols the programmer refers to exist?  Does the grammar they're expressing make sense?  

    GrammarTransforms are stateless tree-to-tree transformations, from Grammars to Grammars, often to fix errors or express complex grammars (like starts/ends filters) in terms of simpler ones.  They're the only part of this process that results in the same kind of representation it started with.

Finally, these grammars are recursively transformed into:

4. Exprs (exprs.ts), formulae of low-level atomic units on which we run Brzozowski's algorithm.  They're a little more lightweight than Grammars (e.g. they aren't associated with any particular cells in the grammar, don't know their "tapes" unless they have to, etc.).

    There are three basic pieces to our implementation of Brzozowski's algorithm.

    * The formula itself, expressed as a tree of Exprs.

    * A generator (generator.ts), which performs a depth-first search through a space of "derivatives" of the formula.  Every time we find a derivative with a certain property, that corresponds to one or more output records, so we yield that.  Sampling is searching at random until you find one, generation is doing an exhaustive search.
    
    * A namespace of information about "tapes" (abstract buffers to which exprs can write), in tapes.ts.  You can think of tapes like database fields.  The main thing this namespace does is keep track of the "global" name of each tape, and the local name at any given point during the calculation.  This isn't where we actually write outputs to, though.
