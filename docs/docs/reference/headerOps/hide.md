---
id: hide
title: hide
sidebar_label: hide
---

## Description

`hide` is a header operator that makes one or more fields invisible outside of its scope.

`hide` applies to the content immediately to its left, but can be [chained](chaining).

## Usage examples

Say, for example, that the **A** symbol defines the fields _text_, _gloss_, and _group_.  The following code creates a symbol **B** that has the _text_ and _gloss_ fields of **A** but not the _group_ field. 
| **A =&nbsp;** | _text_ | _gloss_ | _group_ |
|:--:|:--:|:--:|:--:|
| | manger | eat | ER |
| | aller | go | OTHER |
| | choisir | choose | IR |
| | vendre | sell | OTHER |
| | savoir | know | OTHER |
| **B =&nbsp;** | `embed` | `hide` |
|    | A  | group |

You can also hide multiple fields using a forward slash (`/`).

| **B =&nbsp;** | `embed` | `hide` |
|:--:|:--:|:--:|
|    | A  | gloss/group |


## Why would you want to use this?

Hiding fields is one of the mechanisms that Gramble uses to provide "encapsulation": the ability for different modules to contain content that is calculated within that module, but which is not visible/accessible outside of it.  We might, for example, have a _group_ field in the root, and use that to make decisions about which classes of suffixes to add to it, but this field is irrelevant outside of the verb module.  Hiding _group_ outside of the verb module is a way to make sure that this irrelevant information doesn't get misused for some other purpose (e.g., being conflated with some other _group_ field elsewhere), or just "cleans up" the programmer's view of the verb output so that it doesn't contain dozens of special purpose fields.

This is also useful when there is some property that can vary as the word is built.  Transitivity is a good example: a verb root might have a field _transitivity_ with the form "trans", but when you add a reflexive suffix it needs to become _transitivity_ with the form "intrans" instead.  And say we don't want to call these two different fields (e.g., _rootTransitivity_ vs. _stemTransitivity_), because you have other operations later that only care about transitivity and don't care how it got there.

How do we do that?  Fields aren't *variables*, you can't re-assign to them.  Instead, we need to think of that root and the reflexive stem as having two different _transitivity_ fields: one "inside" and describing the root, and one "outside" and describing the whole stem.  In order to not have these two fields be confused, we have to hide the one inside.

| **Stem =&nbsp;** | `embed` | `equals` _transitivity_ | `hide` | _text_ | _gloss_ | _transitivity_ |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
|    | Root | trans | transitivity | -ba | -REFL | intrans |

Let's step through this one in detail.  First, this suffix only applies to transitive roots, so we're filtering it with an `equals`.  Having done that, we `hide` that field, because we don't want it to interact with the new `transitivity` value we're about to have.  Then we add the _text_ and _gloss_ of the reflexive morpheme, and finally we add the new `transitivity` value.

## Details

Within the scope of the `hide` operator, the field still exists and is calculated like normal.  In the reflexive example above, the _transitivity_ field still exists in **Root**; if it didn't, we couldn't filter on it in the next cell.

Instead, what's really happening is that the `hide` operator is renaming this field to a unique, secret name, that won't clash with any other field names in the program, and won't be shown to the programmer.  (This is called [Name Mangling](https://en.wikipedia.org/wiki/Name_mangling); you may be familiar with it from Python.)
