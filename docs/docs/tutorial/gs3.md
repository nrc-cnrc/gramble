---
id: gs3
title: Your first Gramble program
sidebar_label: Your first program
---

Okay, let's make a program that does something!  We'll start with a verb conjugator.  This isn't the only kind of program you can make with Gramble, but it's the prototypical one.

## A simple English conjugator 

First, let's use some simple English verbs.  I've chosen *regular* verbs (those that don't change form) to make things easier for now.  Let's model these two verbs, in three conjugations:

|-------|
| calls | 
| calling |
| called |
| jump | 
| jumping | 
| jumped |

When we write a Gramble program, we are building a *model* of the phenomenon in question.  There's no one way to write a model; different models might work completely differently but have the exact same outputs.  We might model the above phenomenon in one of two ways:

1. Just list out every possible form as-is (for example, ``calls``, ``calling``, etc.).
2. Break the words into meaningful pieces (the "roots" ``call`` vs. ``jump``, and the "suffixes" ``s`` vs. ``ing`` vs. ``ed``), specify in what order they occur, and specify any changes they might have to go through in the process (like changing ``y+s`` to ``ies``).

The first option is easy in the short run, because it doesn't really take any planning, but in the long run it ends up being way too much work.  (Programming is the art of being lazy in a precise way!)  You might imagine listing every single verb form for every verb in English -- that's <Highlight color="#25c2a0">doable</Highlight>, at least, some dictionaries do that -- but as we saw in the last lesson it's never going to work for Swahili or other languages with long, complex verbs.