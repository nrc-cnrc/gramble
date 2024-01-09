# `@gramble/interpreter`: The Gramble interpreter

The Gramble interpreter executes programs written in Gramble, a domain-specific programming language (DSL) for linguistic grammars and transducers (e.g. verb conjugators and parsers).  It fits roughly into the same niche as XFST/LEXC, but generalizes input-output transductions to arbitrary database-like queries.

Gramble, unlike most other languages, is a *tabular* programming language: its source code is a spreadsheet-like grid of cells, rather than a plaintext file. 
Why?  Well, 99% of Gramble code/data ends up being tabular in nature: dictionaries of roots, conjugation tables, orthography charts, etc.  Rather than the programmer taking these tables and translating them into low-readability XFST code, these stay as tables.  The tables are the code itself, keeping the programmers and subject-matter experts on the same page.

## Usage

    const interpreter = require('interpreter');

    // TODO: DEMONSTRATE API

Tutorials and documentation
---------------

Gramble tutorials and language documentation can be found [here](https://nrc-cnrc.github.io/gramble/).
 
Copyright
---------

All files in this package are **Copyright © 2020-2024 National Research Council Canada.**

License
-------

All files in this package are released under the MIT licence. See the [LICENSE](LICENSE) file for details.

Privacy
-------

See the [PRIVACY](PRIVACY) file for details.
