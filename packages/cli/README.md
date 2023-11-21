# `@gramble/cli`

> Run your Gramble spreadsheets!

Install
-------

    npm install -g @gramble/cli

Usage
-----

Gramble has a few subcommands:

 1. help
 2. generate
 3. sample

### Help

For general help, type

    gramble help

For help for a **specific command**, type

    gramble help <command>


### Generate

Generate all words from your Gramble grammar:

    gramble generate [--symbol|-s <name>] [--format|-f csv|json] [--max|-m <n>]
                     [--output|-o <file>] <source>

  | | |
  ---|---
  -s, --symbol \<name\> | symbol to start generation. Defaults to 'all', the default symbol
  -o, --output \<file\> | write output to \<file\>
  -f, --format csv\|json | write output in CSV or JSON formats
  -m, --max \<n\> | generate at most \<n\> terms [default: unlimited]
  -v, --verbose | log error and info messages

### Sample

Sample a few words from your Gramble grammar:

    gramble sample [--symbol|-s <name>] [--format|-f csv|json] [--num|-n <n>]
                   [--output|-o <file>] <source>

  | | |
  ---|---
  -s, --symbol \<name\> | symbol to start generation. Defaults to 'all', the default symbol
  -o, --output \<file\> | write output to \<file\>
  -f, --format csv\|json | write output in CSV or JSON formats
  -n, --num \<n\> | sample \<n\> terms [default: 5]
  -v, --verbose | log error and info messages
