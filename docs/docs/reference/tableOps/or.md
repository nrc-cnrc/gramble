---
id: or
title: or
sidebar_label: or
---

## Description

`or` is a table operator that creates an alternation between its sibling (the content above it) and its child (the content immediately to its right).

## Usage examples

In general, alternation in Gramble is handled by just adding another row to a table.  However, this can get ugly when the two tables you wish to alternate each have a different set of fields.  `or:` is a way of declaring a new row of field headers when necessary.

Say, for example, that there's a class of reduplicated verbs that require many more fields than ordinary verbs.  You *could* put all of these fields in the main table (and just leave the cells below them mostly blank), but you could also keep the main table simple and introduce those new fields with an "or".

| **A =&nbsp;** | **table:** | **text** | **gloss** | | | | |
|:--:|:--:|:---:|:---:|:--:|:--:|:--:|:--:|
|    |    | ipa | walk |
|    |    | zar | eat |
| &nbsp; |
|    | **or:** | **class** | **subclass** | **text** | **reduplicant** | **gl** | **mood** |
|    |         | R         | 1 | ipa | pa | run    | cont |
|    |         | R         | 2 | zar | za | devour | cont |

An alternative to this is to explicitly assign both to symbols (say, `VerbRoot` and `VerbRootRedup`), and embed/alternate them somewhere else, but sometimes programmers don't want to name every variation.  Again, it's a stylistic choice; it's entirely possible to write a Gramble grammar without `or:`, but some programmers prefer this style.

As another example, we might have a part of a paradigm where the constituent morphemes occur in a very different order.  While, again, we could put these all into one table with a more complex sequence of headers (e.g., one with repeated headers and empty cells where necessary), it can sometimes be clearer to separate these out into different tables and combine them with `or:`.

Note that, like all table operators, it is also possible to make the `or` a direct sibling of an assignment, like so:

| **A =&nbsp;** | **text** | **gloss** | | | | |
|:--:|:---:|:---:|:--:|:--:|:--:|:--:|
|    | ipa | walk |
|    | zar | eat |
| &nbsp; |
| **or:** | **class** | **subclass** | **text** | **reduplicant** | **gl** | **mood** |
|         | R         | 1 | ipa | pa | run    | cont |
|         | R         | 2 | zar | za | devour | cont |
