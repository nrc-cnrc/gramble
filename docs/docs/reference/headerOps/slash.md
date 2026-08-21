---
id: slash
title: slash (/)
sidebar_label: slash (/)
---

## Description

The `slash` operator (which is expressed using `/`) is a header operator that can be used when two or more fields contain the same forms, to avoid writing out all of the forms multiple times.

Unlike other operators, which precede the field name, the slash operator is inserted between two or more field names in a single column header.

## Usage examples
For the table **Root** below, we have two fields (_text_ and _gloss_) that are identical (i.e., contain exactly the same forms):

| **Root =&nbsp;** | _text_ | _gloss_ |
|----|:--:|:--:|
|    | call  | call  |
|    | jump  | jump  |

We can wewrite this using the `slash` operator to join the two field names in the header (_text_`/`_gloss_):

| **Root =&nbsp;** | _text_`/`_gloss_ |
|----|:--:|
|    | call  |
|    | jump  |

If you had a third field, _word_ (also identical), you could write _text_`/`_gloss_`/`_word_.

## Why would we want to use this?

That means we don't have to write the same thing twice.  (Writing things twice can be bad because the two versions can sometimes get out-of-sync with each other.  This makes sure they're always the same.)  After all, not-writing-things-a-bunch-of-times is the whole reason we're writing a program!