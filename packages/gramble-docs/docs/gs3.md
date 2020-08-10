---
id: gs3
title: Your first Gramble program
sidebar_label: Your first program
---

Okay, let's make a program that does something!  We'll start with a verb conjugator.  This isn't the only kind of program you can make with Gramble, but it's the prototypical one.

## A simple English conjugator 

First, let's use some simple English verbs.  I've chosen *regular* verbs (those that don't change form) to make things easier for now.  Let's model these two verbs, in three conjugations:

[]() |
|-------|----------|------|
| calls | calling | called |
| jump | jumping | jumped |

When we write a Gramble program, we a building a *model* of the phenomenon in question.  There's no one way to write a model; different models might work completely differently but have the exact same outputs.  We might model the above phenomenon in one of two ways:

1. Just list out every possible form as-is (for example, ``calls``, ``calling``, etc.).
2. Break the words into meaningful pieces (the "roots" ``call`` vs. ``jump``, and the "suffixes" ``s`` vs. ``ing`` vs. ``ed``), specify in what order they occur, and specify any changes they might have to go through in the process (like changing ``y+s`` to ``ies``).

The first option is easy in the short run, because it doesn't really take any planning, but in the long run it ends up being way too much work.  (Programming is the art of being lazy in a precise way!)  You might imagine listing every single verb form for every verb in English -- that's *doable*, at least -- but as we saw in the last lesson it's never going to work for Swahili or other languages with long, complex verbs.

But to begin, let's actually do it the first way, just to show you how a *very* simple Gramble model works.  I'll step you through step-by-step what's happening.  You're probably going to say "This is really boring", and you're right, but understanding the step-by-step process now will help you later once things get complicated.  If you want to see the second way instead, go onto the next lesson, but I recommend coming back here later to understand what's really going on underneath.

## Structure of a Gramble table 

[]() |
|------|-----|-------|------|
| **MAIN** | **add** | **text** | **gloss** |
|      |     | calls | call-3SG |
|      |     | calling | call-PROG |
|      |     | called | call-PAST |
|      |     | jumps | jump-3SG |
|      |     | jumping | jump-PROG |
|      |     | jumped | jump-PAST |

This is a complete Gramble program that can, for example, turn ``calling`` into ``call-PROG``, or turn ``call-PROG`` into ``calling``.  Let's look at its parts:

* The first cell defines a variable called ``MAIN``.  Variables can be named almost anything: you could call it ``VERB`` or ``V`` or ``verb`` or ``Bob`` or ``EnglishVerb`` or ``ENGLISH_VERB``.  By naming something as a variable, we can refer to it as a unit later on.  

    * By convention we don't use spaces in variable names, but that's not actually a requirement.  It might become a requirement in the future, though, so avoid it for now.

    * ``MAIN`` is a special variable name, though; Gramble by default assumes that the variable named ``MAIN`` is the one you care about overall.  If you start a Gramble program without specifying a different variable, it'll assume you intend to start with ``MAIN``.

* ``add`` indicates that you want to add a table to the preceding variable, in this case ``MAIN``.

* The two cells that follow, ``text``, ``gloss``, are called "Tiers".  By "tier" we mean a level of linguistic representation; in this case, ``text`` describes the way the word actually looks, and ``gloss`` describes the verb form in terms of its parts, like the verb root (``call``) plus the 3rd singular suffix (``-3SG``).  

    * Your tiers can be anything you want, and you can have any number of them.  If you come from the world of "finite state transducers" (FSTs), you're used to only being allowed two tiers, but that's not a restriction on Gramble models.  

* The cells under each tier header represent linguistic material on that tier.  For example, the third row says there is material ``calling`` on the ``text`` tier, followed by material ``call-PROG`` on the ``gloss`` tier.  (I'll often abbreviate this in my explanation as ``text: calling`` and ``gloss: call-PROG``.)  The combination of a tier header like ``text`` and a cell below it like ``calling`` makes what we call an *atomic transducer*.  ("Atomic" here just means that you can't break this unit down into smaller parts.)

* When two or more atomic transducer occur in a row (like ``text: calling`` and ``gloss: call-PROG``), we call that a *concatenation*.  Transducers in concatenation with each other happen one after another, in a particular order.  By the way, it's entirely permissible to concatenate two atomic transducers on the same tier.  For example, we could have written the above like this, if we wanted to separate out the root and the suffix.  It'd have the exact same effect.

| MAIN | add | text | gloss | gloss |
|------|-----|------|------|------|
|      |     | calls | call | -3SG |
|      |     | calling | call | -PROG |
|      |     | called | call | -PAST |

* When two or more concatenations are stacked on top of one another, we call that an *alternation*.  For example, the row ``text: calls``+``gloss: call-3SG`` is in alternation with ``text: calling``+``gloss: call-PROG`` (and the other four rows as well).

Okay, that's the basics.  Now, a Gramble program is interpreted by passing in a *query*, which consists of particular pieces of linguistic material (like ``calling``) on particular tiers (like ``text``).  The correct response of a Gramble program is to return all the linguistic material on *any* tier that is compatible with that query.  (So for example, asking for ``text: calling`` should get a response like ``{text: calling, gloss: call-PROG}``, since those, and only those, are compatible with ``text: calling``.)

## The algorithm 

Here's exactly how it works.  The Gramble interpreter steps through each cell of the table, left-to-right and top-to-down checking to see if the material in the cell matches the query.  Three things can happen:

* The material matches the query, like the cell is looking for ``text: calling`` and the query is ``text: calling``.  That's a success!  It's also okay if the query *begins* with the content of the cell, that's also a success.  Upon succeeding, we remove ``calling`` from the beginning of the query, put the contents of the cell (``text: calling``) into the output, and move onto the next cell to the right.  (In this case, removing ``calling`` from ``calling`` leaves us with nothing.  That's fine -- consuming all the material from the query is what we want in the end anyway.)

* There's a mismatch between what the cell is looking for and what's in the query.  For example, if the cell is looking for ``text: calling``, but the query is actually ``text: jumped`` or ``text: hi mom``, then this parse fails.  We throw out any output we've accumulated so far on this row, and start anew on the next row.

* The cell and the query just refer to different tiers altogether, like the cell is looking for a ``gloss`` but the query was a  ``text``.  Whenever this happens, just put the cell's content into the output regardless.  Note that this isn't a failure!  Failure only happens when there's incompatible material on the *same* tier.  

    * This might worry you, like what if it's the wrong gloss for this text?  Why are we putting it into the output regardless?  But don't worry: if we're not on the correct row, we've either already failed (and so we never get to this cell), or we're going to fail later on the same row (with the result that this output will be thrown out anyway).  It's the job of ``text`` transducers to check ``text``, the ``gloss`` transducers are just along for the ride.  If we were going the other way, from glosses to text, then it would be job of the ``gloss`` transducers to check ``gloss``, and the ``text`` transducers would just be along for the ride.

Okay, so to recap, we're visiting each cell in a row, putting material into the output until we hit a contradiction.  When we hit a contradition, we give up on that output and start again on a new row.  In the end, the output will be the content of all rows that didn't hit a contradiction.  In this case, only one row didn't hit a contradition, the second row, meaning that there's one valid output, ``{text: calling, gloss: call-PROG}``.

It's entirely possible that multiple rows are compatible, however.  An ambiguous word, like "unionize", might have two different valid parses ("union-ize", in the sense of to form a union, and "un-ion-ize", in the sense of undoing the forming of an ion).  The output of a Gramble program is always a *list* of valid results.  Even if the parse fails, the result is still a list, it's just a list with zero entries.  If we put ``text: flying`` into the Gramble program above, the result will be a list with no entries, because there's no row in the above program where ``text: flying`` can pass through without contradiction.

* Side note: I'm being a bit misleading by suggesting here that there's a one-to-one relationship between rows and potential outputs.  Later on we'll see how one row can actually be associated with multiple outputs.  But for now, think of each row as "working on" one output at a time.

# Leftover material

Actually, there's one more requirement for a successful result: at the end of the program, we throw out *any* result where there's *any* leftover material in the query.  That is to say, if we didn't manage to consume the whole query by the end of the program, then it's not really a match.  

Consider the following Gramble program:

| MAIN | add | text | gloss |
|      |     | call | call |
|      |     | calls | call-3SG |
|      |     | calling | call-PROG |
|      |     | called | call-PAST |
|      |     | jump | jump |
|      |     | jumps | jump-3SG |
|      |     | jumping | jump-PROG |
|      |     | jumped | jump-PAST |

Say we put in ``text: calling``.  There are actually *two* rows that match, here: the first row (with ``text: call``) and the third row (with ``text: caling``).  

* Remember that you only have to match the *beginning* of the query!  You'll see in on the next page that this is essential to the operation of the algorithm in general... without it, we would never be able to process a query piece-by-piece.

When the program ends, we have two results:

* The result from the first line ``{text: call, gloss: call}``, but in that case we've got leftover material in the query, ``text: ing``.  That's what we got by removing ``call`` from the ``calling``.

* The result from the third line, ``{text: calling, gloss: call-PROG}``.  In that case there's no leftover material in the query, it's just ``text: <nothing>``, because we removed ``calling`` from ``calling``.

Because the first result hasn't completely consumed the query, we throw it out, leaving us with only one result.  

I should note here that it's not that we throw out this result at the end of the *row*.  It's fine to have rows that don't completely consume their input.  (If that wasn't true, we'd never be able to put a morpheme on its own row, and we'll need to do that later.)  We only throw out results at the end, those that are associated with queries that haven't completely been consumed.

