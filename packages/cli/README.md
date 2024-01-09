# `@gramble/cli`: A Gramble Command Line Interface

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
