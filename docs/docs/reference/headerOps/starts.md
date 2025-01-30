---
id: starts
title: starts
sidebar_label: starts
---

## Description

The `starts` operator lets you filter a grammar so that only forms where the field starting with a particular string/regex are generated.

Like `equals`/`ends`/`contains`, `rename` and hide, `starts` applies to the content immediately to its left, but can be chained.

## Usage examples

For example, we could filter **A** only to entries where the text starts with "p", "t", or "k":

| **B =&nbsp;** | **embed** | **starts text** |
|:--:|:--:|:--:|
|    | A  | p\|t\|k |


Like `equals`, content below `starts` is interpreted as a regex.

For a negative example, the following filters **A** only to those entries where the text *doesn't* start with "p", "t", or "k".

| **B =&nbsp;** | **embed** | **starts text** |
|:--:|:--:|:--:|
|    | A  | ~(p\|t\|k) |

## Details

The `starts` operator is a convenience version of the `equals` operator, that converts the regex given into a more complex one.  For example, in the first example above, it is converted to `(p|t|k).*`.  In the second example, it is converted to `~((p|t|k).*)`.

Note the scope of the negation and the dot-star in the latter example.  The `starts` operator does not simply tack on a dot-star to the programmer's original regex, because this would not give the meaning that the programmer probably expects.  `~p.*` means "Starts with the complement of p", but that's not actually what we want.  The complement of `p` is *any* string that isn't `p`, and this includes strings like `pp` and the empty string.  Every string starts with the empty string, so filtering with `~p.*` wouldn't do anything.  Instead, the appropriate regex is `~(p.*)` -- "The complement of [strings starting with p]" rather than "Strings starting with [the complement of p]".  

If you put a complex regex under `starts`, it's possible that the result of this transformation does not mean exactly what you expect it to.  In that case, we suggest using the `equals` operator instead and writing the regex filter that you really want, rather than relying on this convenience operator.
