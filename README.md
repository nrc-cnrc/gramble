Gramble
=======

[![Build Status](https://travis-ci.org/littell/gramble_ts.svg?branch=master)](https://travis-ci.org/littell/gramble_ts)

Gramble is a domain-specific programming language (DSL) for linguistic grammars and transducers (e.g. verb conjugators and parsers).  It fits roughly into the same niche as XFST/LEXC, but generalizes input-output transductions to arbitrary database-like queries.  

Handwritten grammars like FSTs underlie a lot of our team's products, and since switching to Gramble we've experienced huge productivity increases.  We estimate we write these about 10x faster (at least at in the early stages); we find that many new Gramble programmers have a working prototype of their system in 1-2 days rather than a few months.  Granted, we're biased!  But we really encourage you to give it a try.

![alt text](images/gramble3.png)

The other twist of Gramble is that, unlike most other languages, it is a *tabular* programming language: its source code is a spreadsheet-like grid of cells, rather than a plaintext file.  Well, 99% of Gramble code/data ends up being tabular in nature: dictionaries of roots, conjugation tables, orthography charts, etc.  Rather than the programmer taking these tables and translating them into low-readability XFST code, these stay as tables.  The tables are the code itself, keeping the programmers and subject-matter experts on the same page.

To better support programmer/expert collaboration, we've also made a plug-in to Google Sheets (in `/sheets_addon`), letting you use Sheets as a multi-user IDE for Gramble programming.  It's not yet in the GSuite add-on "store", but in the meantime you can install it in your own Sheets using `clasp`.

For maintainers
---------------

This repo is managed using [Lerna]. We use Lerna to manage multiple,
interdependent packages.

[Lerna]: https://lerna.js.org/

### Building and installing

First, make sure Lerna is installed:

    npm install lerna -g

Then:

    npm run build
    npm install

### Testing

    npm test

### Adding new dependencies

    npx lerna add <package> path/to/subpackage

Copyright
---------

All files in this repository are **Copyright (C) 2020 National Research Council Canada.**

License
-------

All files in this repository are released under the MIT licence. See the [LICENSE](LICENSE) file for details.
