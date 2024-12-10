---
id: optional
title: optional
sidebar_label: optional
---

# optional

`optional` is a header operator allowing the expression of "add \<something\> to field \<F\>", or add nothing".  E.g., `optional F:x` is equivalent to adding the alternation of `F:x` with the empty grammar.

## Usage examples

Just for illustration, consider the following grammar.  

| **A =** | **gloss** | **optional text** |
|----|----|-----|
|    | past | ba |

This produces two entries: `{gloss:past, text:ba}` and `{gloss:past}`, because `optional text:ba` can either add `ba` to `text` or just add the empty string.  

## Why would we want to use this?

The above is not the usual use case (it'd be more readable just to add another line to the table rather than use `optional`); `optional` is usually used with `embed` to express the possible absence of a morpheme.  For example, consider this grammar:

| **Root =** | **text** | **gloss** | 
|----|----|-----|
|    | gan | run |
|    | ik | jump |
| &nbsp; |
| **Evid =** | **text** | **gloss** |
|    | a | direct |
|    | ba | hearsay |
|    | tsu | infer |
| &nbsp; |
| **Stem =** | **embed** | **optional embed** |
|         | Root | Evid |

In this grammar, `optional embed: Evid` is a way of expressing that the evidentiality morpheme is optional.  (In this simple example, yes, we could have just added another line to the `Stem` symbol, but in a more complex grammar we might not want to double the number of lines in `Stem` just for this.  When the column is always optional, it's best to express this in a columnar way with `optional` rather than adding rows.)

Also note that, by the rules of Gramble syntax, we can't express the ability to leave out evidentiality by adding a line to `Evid` that's empty in every field -- it would just be interpreted as an empty line and ignored.  `optional` lets you get around that.
