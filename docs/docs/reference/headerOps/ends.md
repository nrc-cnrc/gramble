---
id: ends
title: ends
sidebar_label: ends
---

## Description

The `ends` operator (used with a given field name) lets you filter a grammar so that an entry can only be generated if the form in the given field contains a particular string or regex.

Like `equals`/`starts`/`contains`, `rename` and `hide`, `ends` applies to the content immediately to its left, but can be chained.

## Usage examples

For example, we could filter **A** only to entries where the text ends with "p", "t", or "k":

| **B =&nbsp;** | **embed** | **ends text** |
|:--:|:--:|:--:|
|    | A  | p\|t\|k |

Like `equals`, content below `ends` is interpreted as a regex.

For a negative example, the following filters **A** only to those entries where the text *doesn't* end with "p", "t", or "k".

| **B =&nbsp;** | **embed** | **ends text** |
|:--:|:--:|:--:|
|    | A  | ~(p\|t\|k) |

## Details

The `ends` operator is a convenience version of the `equals` operator, that converts the regex given into a more complex one.  For example, in the first example above, it is converted to `.*(p|t|k)`.  In the second example, it is converted to `~(.*(p|t|k))`.

The `ends` operator has the same complications and cautions about negation scope as the `starts` operator, which you can read about [here](starts).
