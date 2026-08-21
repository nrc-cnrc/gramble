---
id: replace
title: replace
sidebar_label: replace
---

## Description

`replace` is a table operator that performs replacement operations on the forms in a given field of its sibling (the content above it). Replace is used along with a field name and uses three special headers: `from`, `to`, and `context` (these column headers are interpreted specially in this context; it is not a problem if your Gramble has fields that share a name with them). The `context` header is optional (if you wish to perform the replacement in any context, you can omit it).

The character `#` is used in the `context` column of `replace` rules to mark a boundary of the form to which the rules are being applied, while the `_` character represents the location of what is being replaced. `#_` replaces occurrences as the start of a form, while `_#` replaces occurrences at the end of a form.

Both `from` and `context` can contain strings or regular expressions. If you have defined a grammar with just one field (for example, a grammar **VOWEL** with a single field, containing a list of the language's vowels), you can use that in regular expressions in replace rules, for example if you want to replace something only in the context where it appears between two vowels: `{VOWEL}_{VOWEL}`.

## Usage examples

As an example, let's consider a very simple Gramble program for taking English verb roots and producing their past tense forms. (Note: this would fail if "flee" were one of the forms in our **VERB_ROOT** table! There are better ways to build a grammar for the past tense of English verbs.)

| **VERB_ROOT =&nbsp;** | `table:` | _text_ | | |
|:--:|:--:|:--:|:--:|:--:|
|    |    | cook | | |
|    |    | bake | | |
|    |    | need | | |
|  &nbsp;  |    |  | | |
| **PAST_TENSE =&nbsp;** | `table:` | `embed` | _text_ | |
|    |    | VERB_ROOT | ed | |
|  &nbsp;  |    |  |  | |
|    | `replace` _text:_ | `from` | `to` | `context` |
|    |           | eed        | ed       | \_\# |

In this example, just adding "ed" to the end of a verb sometimes produces "eed", which we'd like to replace with the correct string. We start with `replace` _text:_ (indicating that the field where the replacement should happen is _text_), followed by `from` (what we want to replace, "eed"), then `to` (what we want to replace it with, "ed"), and the `context` in which we want the replacement to occur (here, `_#`, with `#` meaning the end of the form).

You can have multiple replace rules within a single block, but be aware that these are not guaranteed to be run in order. If you have replace rules where the order matters, rather than writing them within a single block, like so (with the intention that the text be transformed from "bakeed" to "baked" to "raked" to its final returned form as "faked") :

| **PAST_TENSE =&nbsp;** | `table:` | `embed` | _text_ | |
|:--:|:--:|:--:|:--:|:--:|
|    |    | VERB_ROOT | ed | |
|  &nbsp;  |    |  |  | |
|    | `replace` _text:_ | `from` | `to` | `context` |
|    |           | eed        | ed       | \_# |
|    |           | b        | r       | #_ |
|    |           | r        | f       | #_ |


you should instead write them in separate blocks in the order you would like them to be applied (from top to bottom), like so (separating the two order-dependent rules into separate blocks):

| **PAST_TENSE =&nbsp;** | `table:` | `embed` | _text_ | |
|:--:|:--:|:--:|:--:|:--:|
|    |    | VERB_ROOT | ed | |
|  &nbsp;  |    |  |  | |
|    | `replace` _text:_ | `from` | `to` | `context` |
|    |           | eed        | ed       | \_\# |
|    |           | b        | r       | \#\_ |
|    | `replace` _text:_ | `from` | `to` | `context` |
|    |           | r        | f       | \#\_ |


Note that, like all table operators, it is also possible to make the `replace` a direct sibling of an assignment (see the example in [join](join)).
