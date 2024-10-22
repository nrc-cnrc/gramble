---
id: contains
title: contains
sidebar_label: contains
---

# contains

The ends operator lets you filter a grammar so that only forms where the field contains a particular string/regex are generated.

Like equals/starts/ends, rename, and hide, it applies to the content immediately to its left, but can be chained.

## Usage examples

For example, we could filter **A** only to entries where the text contains "p", "t", or "k":

| **B =** | **embed** | **ends text** |
|----|----|-----|
|    | A | p\|t\|k |

Like `equals`, content below `contains` is interpreted as a regex.

For a negative example, the following filters **A** only to those entries where the text *doesn't* contain "p", "t", or "k".

| **B =** | **embed** | **ends text** |
|----|----|-----|
|    | A | ~(p\|t\|k) |

## Details

The contains operator is a convenience version of the equals operator, that converts the regex given into a more complex one.  For example, in the first example above, it is converted to `.*(p|t|k).*`.  In the second example, it is converted to `~(.*(p|t|k).*)`.

The contains operator has same complications and cautions about negation scope as the `starts` operator, which you can read about [here](starts).