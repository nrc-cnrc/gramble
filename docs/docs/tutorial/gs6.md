---
id: gs6
title: Flat vs. nested structure
sidebar_label: Flat vs. nested
---

## Flat vs. nested: What's the difference?

The previous examples used a structure where we define each morpheme (e.g., that the root can be "call" or "jump", that the suffix can be "s" or "ing" or "ed", etc.) and then at the end we concatenate all the morphemes together.  Let's call that a "*flat*" structure.  (You might also call it a "templatic" structure, but I'm going to avoid that term here because it can mean a lot of things.  You might be modeling a language that linguists say has "templatic morphology", but you might not want to structure your *grammar* that way.)

But there's another way of doing this, where we build up the structure piece-by-piece.  It barely matters for an English verb because they're so simple, but for illustration let's consider the noun "counter-reformation".  The intuitive way of talking about how this word is formed is by saying we start with "form", then add a piece to get "reform", then add another piece to get "reformation", then finally another piece to get "counter-reformation".  It might seem more complex at first (because we're going from inside-out, rather than left-to-right), but some things are just easier to express from the inside-out.

For example, certain phonological rules might only apply at particular stages of the construction, and that's hard to express if we're assembling everything at the end, left-to-right, in one fell swoop.

## Example: Swahili verbs

We'll use Swahili verbs for illustration.  Swahili is the first or second language for more than 100 million people in East Africa, and serves as a regional *lingua franca*.  Swahili verbs are fairly complex overall, but there *are* parts of the verb system that are relatively straightforward, and we'll start with those.  

The first thing to do before you start writing a program is **understand exactly what phenonemon you want to model** so that you can make a plan.  Let's say our goal is modeling Swahili verbs in the present, perfect, and past tenses, with 1st, 2nd, and 3rd person (I, you, he/she/it) singular subjects.  They look like this:

| **text** | **subj** | **tense** | **root** |
|-----------|:------:|-------|----|
| ninapenda | 1 | pres | love |
| unapenda | 2 | pres |  love |
| anapenda | 3 | pres |  love |
| nilipenda | 1 | past |  love |
| ulipenda | 2 | past |  love |
| alipenda | 3 | past | love |
| nimependa | 1 | perf | love |
| umependa | 2 | perf | love |
| amependa | 3 | perf | love |
| ninaona | 1 | pres | see |
| unaona | 2 | pres |  see |
| anaona | 3 | pres |  see |
| niliona | 1 | past |  see |
| uliona | 2 | past |  see |
| aliona | 3 | past |  see |
| nimeona | 1 | perf | see |
| umeona | 2 | perf |  see |
| ameona | 3 | perf | see |

Study the table for a few minutes to get a good sense of what we need to model.  Do you notice any patterns?  Here are three patterns we can notice:

* All the 1st person subject forms start with ``ni``, all the 2nd person forms start with ``u``, and all the 3rd person forms start with ``a``.  
* After these subject markers, you find ``na`` in all the present forms, ``li`` in all the past forms, and ``me`` in all the perfect forms.
* All of the forms with "love" contain ``penda``, so presumably that means ``love``.  (Actually it's ``pend``, and it happens that all of these verb forms have a suffix ``a`` at the end.  Most verb forms end in ``a``, although a few root/conjugations combinations end in other vowels.  We'll ignore that for now, though, and pretend the root is ``penda``.)  Meanwhile all the forms with "see" contain ``ona``.

## The *flat* grammar

Here's the "flat" style of grammar that we've been using so far:

| **Person =&nbsp;** | **text** | **subj** |   |
|:--:|:--:|:--:|:---:|
|    | ni | 1 |
|    | u  | 2 |
|    | a  | 3 |
| &nbsp; |
| **Tense =** | **text** | **tense** |
|    | na | pres |
|    | li | past |
|    | me | perf |
| &nbsp; |
| **Root =** | **text** | **root** |
|    | penda | love |
|    | ona   | see |
| &nbsp; |
| **Verb =** | **embed** | **embed** | **embed** |
|           | Person | Tense | Root |

Remember that an `embed` header causes the cell below it (say, `Person`) to be interpreted as containing any form generated by the `Person` table.  That's 3 forms, and then those are concatenated with any of the 3 forms from the `Tense` table, for 9 possible forms.  Then those 9 forms are concatenated with any of the 2 forms from the `Verb` table.  That's 3 x 3 x 2 = 18 possible forms, total... and that's exactly how many forms were in the original table above.

## The *nested* grammar

Here's another way of structuring the same grammar, by building up the stem bit by bit.  For example, to build "ninapenda", we would start with the Root `penda`, then build a TenseStem `napenda` by adding a tense prefix, and finally building a Verb `ninapenda` by adding a person prefix.

| **Root =** | **text** | **root** | |
|:--:|:--:|:--:|:--:| 
|    | penda | love |
|    | ona   | see |
| &nbsp; |
| **TenseStem =&nbsp;** | **text** | **tense** | **embed** |
|    | na | pres | Root |
|    | li | past | Root |
|    | me | perf | Root |
| &nbsp; |
| **Verb =** | **text** | **subj** | **embed** |
|    | ni | 1 | TenseStem |
|    | u  | 2 | TenseStem |
|    | a  | 3 | TenseStem |

Note that there's nothing special about the order we wrote these in, we could also have listed `Verb` first and `Root` last.  The important part is the structure of the `embeds`.  Each `Verb` line embeds the `TenseStem` table, each `TenseStem` line embeds the `Root` table.

Let's look closely at what the first line of the `TenseStem` table is doing.  We'll step through it left-to-right.  It's adding `text:na` to the output, then adding `tense:pres` to the output, giving us the result `{text:na, tense:pres}`.  And then it hits `embed: Root`. This cell has two possibilities, so it does both, it takes the current output and adds `{text:penda, root:love}`, giving us `{text:napenda, tense:pres, root:love}`, and it **ALSO** takes the current output and adds `{text:ona, root:see}`, giving us another output `{text:naona, tense:pres, root:see}`.

So this line has two outputs, and so do the other lines in `TenseStem`, so `TenseStem` has 2 x 3 = 6 outputs.

The same kind of thing is happening in the `Verb` table.  Each line embeds `TenseStem` (with 6 outputs), and there are 3 lines again, so that's 6 x 3 = 18 outputs -- same as the "flat" grammar, and same as the original table.

## Why nested?

This structure is a little more complicated, so why would we want to do it?  

* It's often simpler to describe the construction of words as an inward-out, nested process (like "counter-reformation" above)

* As mentioned, sometimes phonological rules only apply at certain stages of the construction process.  By giving those stages names like TenseStem, we can apply phonological rules to that unit alone (rather than to the whole word).

* Also, we can apply tests to those units alone.  For example, test that unit *can* generate the form `waona` but can't generate the incorrect form `uona`.  Being able to test individual units is often easier than testing whole words (because many things can go wrong in a whole word, besides what you're testing for).  

* It lets us handle circumfixes and certain kinds of long-distance dependencies more easily... more on that in the next chapter!
