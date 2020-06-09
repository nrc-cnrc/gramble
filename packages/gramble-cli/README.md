# `@gramble/cli`

> Run your Gramble spreadsheets!

Install
-------

    npm install -g @gramble/cli

Usage
-----

Gramble has a few subcommands:

 1. generate
 2. parse
 3. sample

For general help, type

    gramble help

For help for a **specific command**, type

    gramble help <command>


### Generate

Generate all words from your Gramble grammar:

    gramble generate [--max=n][--otier=tier] [--output|-o file] <source>

### Parse

Parse or analyze forms using your Gramble grammar:

    gramble parse --itier=tier [--otier=tier] [--random] [--max=n] <source>
    gramble parse --tokenize --itier=tier --otier=tier [--random] <source>

### Sample

Sample a few words from your Gramble grammar:

    gramble sample [--output|-o file] <source>
