---
id: multiTier
title: Why multiple tiers?
sidebar_label: Multiple tiers
---

A lot of the original motivation for Gramble (or, to be precise, the systems that preceded Gramble) is that we needed systems that could express relationships between more than two tiers.

## Case study #1

For example, we were once writing a pre-processing system for the Uyghur language (for the system described in Littell et al. 2017), but a lot of other teams of people wanted to use the output, and each team wanted a different kind of output representation.

* The machine translation team just wanted the root of each word (so that a word like ``kishilerning`` would come out as ``kishi``.  (They also sometimes wanted all the word parts, like ``kishi``, ``ler``, and ``ning``.)

* The event detection team (who wanted to know things like whether the event was currently happening or in the past) wanted all the component parts with labels, like ``people``, ``PLURAL``, ``GENITIVE``.  That way they could just look for things like ``PAST`` without having to know exactly how the past tense looks in this language.

* A team of humans, overseeing the whole process and wanting to make sure that all system outputs were basically reasonable, wanted a rough, human-readable English rendering like ``of multiple people``.

This caused a dilemma, because a conventional finite state transducer (FST) system only allows for the specification of two levels of representation.  One of these has to be the actual text form (like ``kishilerning``), but what should the second form be?  

We could have built four systems, one for each output.  Or we could build a chain of three systems: one system that turns ``kishilerning`` into ``kishi, ler, ning``, one that turns that into ``people, PLURAL, GENITIVE``, and one that turns that into ``of multiple people``.  But that would involve a lot of duplication of knowledge: what parts mean what, how they can be ordered with respect to each other, etc., and this was a system that was *very rapidly* evolving in a chaotic work environment.  (We only had about 36 hours to develop the first iteration of this system!)  There was basically no way to engineer four systems at once and keep them in sync.

So instead, we wrote a system from scratch (that is, without any pre-existing parser library) that could generate multiple different kinds of outputs at once.

## Case study #2

Going in the other direction, let's consider a verb conjugator app, like the one described in Kazantseva et al. 2018.  The user has to choose several pieces of information: what verb they want to conjugate, its tense/mood (e.g. past, habitual, etc.), and who the subject and object are (e.g., first person subject, second person object).  

Underneath the app, there's an FST that converts a gloss (for example, go-2OBJ-PAST-3SUB) into a real word in the target language.  However, there's one slight snag, in that the FST expects that gloss to be in a specific order, but the user of the app has input several unordered pieces of information.  This means that the app has to know how to order them in the way that the FST expects, or else the FST simply won't have any output.

The order that the FST expects these elements isn't something that we can usually specify to be universal across all languages; it depends on the language and how the FST's author decided to order the elements in their code.  (Often that's the order they come in, in the target language, but not always.)  So in practice, the user interface has to know, *for a particular language model*, what order the morphemes should come in.  That's usually fairly straightforward, but not necessarily: there are languages where, for example, 3rd singular subjects are expressed as suffixes while 1st and 2nd subjects are expressed as prefixes, or languages where particular combinations of subject and object combine into one unit.  

You can probably see the issue: to order the input units, the user interface has to have some kind of language-specific ordering model that's potentially almost as complex as the FST itself.  But ideally, we shouldn't have to model the language *twice*... that information about morpheme ordering is already in the FST!  It's just that the FST software itself expects just one input representation and one output representation. 

What we really need here is a system that allows *multiple* input representations, un-ordered with respect to each other.  For example, we input ``go`` on the root tier, ``2`` on the object tier, ``PAST`` on the tense tier, and ``3`` on the subject tier.  We don't specify the relative order that these will actually occur in; we don't have to know in advance.  We just ask the system ``Give me the possible words where these elements occur on the appropriate tiers, whatever order they happen to come in``.

So in conclusion, a lot of linguistic modeling tasks are inherently between multiple levels of representation.  When this is the case, but we can only choose two levels of representation to build into the FST, we often end up in a situation where aspects of the target language have to be modeled *outside* of the FST, whereas ideally everything about the language should be modeled in a single place.  

In Gramble, the multiple tiers are implemented using *typed transducer combinators*.