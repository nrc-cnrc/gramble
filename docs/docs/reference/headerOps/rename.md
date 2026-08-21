---
id: rename
title: rename (>)
sidebar_label: rename (>)
---

## Description

The `rename` operator (which is expressed using `>`) is a header operator that causes a field inside its scope to have a different name outside its scope.

`rename` applies to the content immediately to its left, but can be [chained](chaining).

## Usage examples

Say, for example, that the **A** symbol defines the fields _text_, _gloss_, and _group_.  The following code creates a symbol **B** that has the _text_ and _gloss_ fields of **A**, but where the _group_ field is now called _type_.
| **A =&nbsp;** | _text_ | _gloss_ | _group_ |
|:--:|:--:|:--:|:--:|
| | manger | eat | ER |
| | aller | go | OTHER |
| | choisir | choose | IR |
| | vendre | sell | OTHER |
| | savoir | know | OTHER |
| **B =&nbsp;** | `embed` | `>`_type_ | |
|    | A  | class | |

## Why would we want to use this?

Renaming is useful when taking different symbols/modules (especially from different programmers) and making them work together.  For example, we might have two symbols that mean something different by the field _group_, and we don't want them just joined/concatenated as if they mean the same thing.  Renaming at least one of them to something else would make it so you can combine these symbols without worrying about the conflation of their _group_ fields.  (You could also, in this instance, [hide](hide) them.  Hiding is really just renaming to a unique secret name.)

You might also use this to massage the field names to something required by a client program.  For example, say we have a client program that expects a morpheme breakdown field to be called _morph_, but the programmer called it _breakdown_.  Do we have to go through the entire program to rename _breakdown_ to _morph_?  We don't; we can just rename _breakdown_ to _morph_ at the very end.  (This is especially useful when we write one grammar that's going to be used with *multiple* client programs that don't agree on what fields need to be named.)

Finally, there's a special pattern known as the Skyra Pattern, after a pair of Gramble programmers (Skyler and Kendra) who first used it.  The idea is that you may have unpredictable suppletive text forms that you want to keep in a table, but you don't yet know which is going to be used in the text.  For example, we might have an A and B form of a verb root that occur when different suffixes are added.  We can keep them in the table as different fields, and rename that field to _text_ as necessary:

| **Root =&nbsp;** | _formA_ | _formB_ | _gloss_ |
|:--:|:----:|:---:|:---:|
|    | gar  | gr  | run |
|    | kapa | kap | jump |
|    | sil  | sl  | climb |
| &nbsp; |
| **Stem =** | `embed` | `>`_text_ | _text_ |
|    | Root | formA | -ti |
|    | Root | formB | -as |
|    | Root | formB | -i |
