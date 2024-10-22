---
id: rename
title: rename (>)
sidebar_label: rename (>)
---

# rename (>)

The rename operator (which is expressed using >) is a header operator that causes a field inside its scope to have a different name outside its scope.

Like equals/starts/ends/contains and renaming, it applies to the content immediately to its left, but can be chained.

## Usage examples

Say, for example, that the **A** symbol defines the fields `text`, `gloss`, and `class`.  The following code creates a symbol **B** that has the `text` and `gloss` fields of **A**, but where the `class` field is now called `type`.

| **B =** | **embed** | **>type** |
|----|----|-----|
|    | A | class |

## Why would we want to use this?

Renaming is useful when taking different symbols/modules (especially from different programmers) and making them work together.  For example, we might have two symbols that mean something different by the field `class`, and we don't want them just joined/concatenated as if they mean the same thing.  Renaming at least one of them to something else would make it so you can combine these symbols without worrying about the conflation of their class fields.  (You could also, in this instance, [hide](hide) them.  Hiding is really just renaming to a unique secret name.)

You might also use this to massage the field names to something required by a client program.  For example, say we have a client program that expects a morpheme breakdown field to be called `morph`, but the programmer called it `breakdown`.  Do we have to go through the entire program to rename `breakdown` to `morph`?  We don't; we can just rename `breakdown` to `morph` at the very end.  (This is especially useful when we write one grammar that's going to be used with *multiple* client programs that don't agree on what fields need to be named.)

Finally, there's a special pattern known as the Skyra Pattern, after a pair of Gramble programmers (Skyler and Kendra) that first used it.  The idea is that you may have unpredictable suppletive text forms that you want to keep in a table, but you don't yet know which is going to be used in the text.  For example, we might have an A and B form of a verb root that occur when different suffixes are added.  We can keep them in the table as different fields, and rename that field to `text` as necessary:

| **Root =** | **formA** | **formB** | **gloss** |
|----|----|-----|-----|
|    | gar | gr | run |
|    | kapa | kap | jump |
|    | sil | sl | climb |
| &nbsp; |
| **Stem =** | **embed** | **>text** | **text** |
|    | Root | formA | -ti |
|    | Root | formB | -as |
|    | Root | formB | -i |