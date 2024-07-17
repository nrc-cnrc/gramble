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
                     [--output|-o <file>] [--query|-q <str>] <source>

  | | |
  ---|---
  -s, --symbol \<name\> | symbol to start generation. Defaults to 'all', the default symbol
  -o, --output \<file\> | write output to \<file\>
  -f, --format csv\|json | write output in CSV or JSON formats
  -m, --max \<n\> | generate at most \<n\> terms [default: unlimited]
  -v, --verbose | log error and info messages
  -q, --query | restrict the outputs to those matching particular key:value pairs

Symbol strings are dot-separated identifiers to specific symbols in your source files.  For example, if you have a symbol Stem in the file Verbs.csv, you can generate from that symbol using -s Verbs.Stem.

Query strings are formatted as comma-separated key:value pairs, e.g. "text:ninapenda" or "root:pend, subj:1SG, tense:PRES".  

### Sample

Sample a few words from your Gramble grammar:

    gramble sample [--symbol|-s <name>] [--format|-f csv|json] [--num|-n <n>]
                   [--output|-o <file>] [--query|-q <str>] <source>

  | | |
  ---|---
  -s, --symbol \<name\> | symbol to start generation. Defaults to 'all', the default symbol
  -o, --output \<file\> | write output to \<file\>
  -f, --format csv\|json | write output in CSV or JSON formats
  -n, --num \<n\> | sample \<n\> terms [default: 5]
  -v, --verbose | log error and info messages
  -q, --query | restrict the outputs to those matching particular key:value pairs

Symbol strings and query strings are the same as for the generate command, detailed above.

Transitioning from a Google Sheets project to the CLI
--------------

If you have a project using the Gramble plug-in for Google Sheets, and want to transition to generating/sampling using the command-line interface, there are two ways to do it.

One is to just download each relevant sheet as a CSV, put them all in the same directory, and run the generate/sample commands exactly as described above.

However, if you have a project with lots of sheets, this can be cumbersome.  The Gramble plug-in has a special option, "Download source", that bundles all of your sheets together into a single CSV.  Go to the sheet you want to generate or sample from, and click "Download source" in the sidebar.  The result will be named something like "YourSheetName_single.csv".

Now you can run your generate/sample commands using this file, but there's one thing to remember -- there's a new top-level Collection element in this project, named "YourSheetName_single", and so your --symbol/-s option will be relative to this.  So if your symbol option used to be -s Verbs.Stem, remember that it's now -s YourSheetName_single.Verbs.Stem.


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
