Gramble
=======

[![Build Status](https://travis-ci.org/littell/gramble_ts.svg?branch=master)](https://travis-ci.org/littell/gramble_ts)

> /ˈɡɹæmˌbɫ̣/ (_GRAMM-bl_)

Write your grammar as a spreadsheet!

<!-- TODO: put an animated GIF here, showing it off! -->

For maintainers
---------------

This repo is managed using [Lerna]. We use Lerna to manage multiple,
interdependent packages. The biggest change between using Lerna and
using npm is **you can no longer run `npm install` within packages**.
Instead, always run `npm run bootstrap` from the root directory of the
repository.

[Lerna]: https://lerna.js.org/

### Installing dependencies

First, make sure Lerna is installed:

    npm install

Then,

    npm run bootstrap

### Building

The TypeScript code must be compiled:

    npm run build

### Running

To use the Gramble on the command line (using the latest version in this
repo), use the following:

    npx gramble

### Testing

    npm test

### Updating dependencies

    npm run bootstrap

### Adding new dependencies

    npx lerna add <package> path/to/subpackage

License
-------

2020 © Patrick Littell. MIT Licensed. See LICENSE for details.
