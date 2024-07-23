---
id: gs5
title: From transducer to database
sidebar_label: From transducer to database
---

Let's go one further -- not just transducing from an input to an output, but expressing a database with multiple "fields".

Why?  Well, look at our previous transducer.  Say we want to know what the past-tense form of `call` is.  In order to query the transducer, we have to assemble a gloss that expresses this, in this case `call-PAST` -- that is, we have to already know how the pieces are going to fit together.  

That's easy enough in English; they're all suffixes and there are only one of them.  But what if you wanted to know the 1st singular subject, 2nd singular object, past tense, applicative form of the verb `pend` in Swahili.  Do you know what order those are supposed to come in?

In order to make that query, the client program (e.g. the verb conjugator interface) has to know how to put those things in order, and that can actually get rather complicated.  (And it can get much more complicated than Swahili, but in some languages some things come in different orders depending on other factors, like the 3rd person subject might be expressed as a suffix and the 1st and 2nd persons a prefix.  Or in languages that express persons as circumfixes, do you express this in the prefix part, the suffix part, or both?)

So you end up writing a little sub-program in the client that exists solely to put these things in the correct order... and in doing so recapitulate knowledge that's already in the grammar.  That's a big part of what a grammar *does* is tell you what order things come in.   Information that *should* be in one place, in the grammar, is duplicated, and as we've said before duplication is a recipe for bugs.

It also happens in the other direction.  Say we want to parse `nilipenda` and learn things like its tense and person.  But in a transducer, your output is a string -- it's `1-PAST-pend` -- and so you have to parse it, and your parser has to know where the different parts are.  Again, it's knowledge that *should* be expressed in the grammar, but you have to duplicate it in the client program just to be able to work with the grammar.

Now, you might say, "This isn't a huge deal in my situation", and that's totally fine.  You can still make a `nilipenda <-> 1-PAST-pend` transducer just like before and it's fine.  All I'm saying is that Gramble doesn't *require* you to express everything as a `input <-> output` transduction like that, we can be more flexible.

## Adding even more tapes

In the previous chapter, we added a new field to each tape, and it was the same field each time.  But if we wanted, we could make them different, we could have separate `root` and `tense` fields instead.

| **Root =** | **text** | **root** ||
|----|----|----|
|    | call  | call |
|    | jump  | jump |
| &nbsp; |
| **Suffix =** | **text** | **tense** ||
|----|----|-----|
|    | s  | 3SG.PRES |
|    | ed  | PAST |
|    | ing | PRES.PROG |
| &nbsp; |
| **Verb =** | **embed** | **embed** |
|----|----|-----|
|           | Root | Suffix |

(I've gone back to putting `text` and `root` in separate columns just for illustrative clarity, but you're still welcome to do one column with a `text/root` header.)

This is now a three-field database, and you can look things up in any direction.  Try it out in the interface (Gramble -> Tutorial sheets -> Tutorial 3).  You could put `called` in the `text` field and you'll get back all the other fields, or you could put `call` in the `root` field and `PAST` in the `text` field, or any direction you want.

If this is confusing you, just remember that this program is equivalent to the following database:

| **text** | **root** | **tense** ||
|----------|----------|-----------|
| calls    | call     | 3SG.PRES  |
| called   | call     | PAST      |
| calling  | call     | PRES.PROG |
| jumps    | jump     | 3SG.PRES  |
| jumped   | jump     | PAST      |
| jumping  | jump     | PRES.PROG |

Your input can consist of material on any of these fields, and the output will just be "any entry whose fields match every field in the input".

## "Wildcard" queries 
That also means you can do queries that *don't* uniquely identify any single form.  You can just give a query with `jump` on `root` and it'll return all three forms with `jump`.  (This could be useful in, for example, a dictionary app that wants to show the user all the possible conjugations of a verb root.)  You could give a completely empty query, and it would return all six forms.

These are actually quite difficult to do in two-tape transducer languages like XFST.  If you're familiar with that language, imagine putting in a gloss like `jump-*`.  It wouldn't return any outputs, because the input has to be a "sentence" of the gloss language, and `*` simply isn't a part of that language.  In order to generate the whole paradigm, the client program has to generate every possible gloss and then query the system once for each of them.  In order to do that, it needs to know things like what morphemes are possible and what co-occurence restrictions there are -- again, duplicating knowledge that should ideally only be in the grammar.

## Remember that queries don't just return single outputs, but a list of outputs

It's common for people to expect that every input should have one output.  That's what we're used to in regex substitutions in Python, or in "sequence to sequence" neural models.  But that's not true of Gramble, or of related languages like XFST or SQL: in these languages, queries can have multiple results, or no results.

And it's not just "wildcard" queries like the above; we need multiple results to handle ambiguous inputs.  For example, imagine a grammar that has both English nouns and verbs, and the client program asks for an analysis of `calls`.  This could be the plural noun -- "I received a lot of calls" -- or the 3rd singular present form of the verb -- "She calls the office every day."  Because both of these are possible analyses of the text, this grammar would return both entries.

## But I also want a gloss!

You can do that; you can have as many fields as you want.  You can put `root/gloss` and `tense/gloss` and that material will be added to *both* fields.

The only little snag is that we have to decide what to do about hyphenization.  (E.g., when we were constructing a gloss we used `-PAST`, because we wanted to separate it from what came before, whereas when we were just putting it in the tense field we used `PAST`, because it would be really annoying to have to remember to prefix PAST with a hyphen when querying tense.)

One thing you could do is just have these be separate fields; another thing you could do is just put the hyphen in a `gloss` field of its own like so:

| **Suffix =** | **text** | **gloss** | **tense/gloss** ||
|----|----|-----|-------|
|    | s  | - | 3SG.PRES |
|    | ed  | - | PAST |
|    | ing | - | PRES.PROG |

Neither of those is my preference, though; I think it gets a little hard to maintain.  My preference is to do all such morphemes as `[PAST]`.  There's nothing special about the brackets, they're just normal characters just like the hyphens, but they serve to separate the morpheme from the surrounding ones, while also not feeling weird to type into queries the way `-PAST` does.

| **Suffix =** | **text** | **tense** ||
|----|----|-----|
|    | s  | [3SG.PRES] |
|    | ed  | [PAST] |
|    | ing | [PRES.PROG] |

If you'd like to see a full example to play around with, there's one in Gramble -> Tutorial sheets -> Tutorial 4.