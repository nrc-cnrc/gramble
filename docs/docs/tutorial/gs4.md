---
id: gs4
title: Adding more fields
sidebar_label: Adding more fields
---

## Acceptor

The program on the [previous page](./gs3.md) only had one field, `text`.  It's not very useful with just one field!  

But it's still *somewhat* useful!  If you had a lot more forms, you could make a spellchecker from it.  The client program could go through every word in a document and ask, "Is this word in my database?", and if yes, it leaves it alone, and if no it underlines it with a red squiggle.

In "finite-state automata" terms we'd call a program like this an "acceptor".  It doesn't turn something into something else (that would be a "transducer"); it can only say, "Yes, that's one of the words I cover," or "Nope, not one of mine."

(Side note: You'll probably often hear us call fields "tapes".  This is using the metaphor of a Turing Machine, picturing computer programs as reading and writing to long strips of tape.  In the finite-state machine world, we often use this metaphor, speaking of our programs as "reading a symbol from the input tape" or "writing a symbol to the output tape".  An acceptor is a "one-tape automaton", it can only read from one tape; a transducer is a "two-tape automaton" reading from one tape and writing to another.)

So let's add another field and turn this into a transducer.

## From acceptor to transducer

Let's take the previous program and add another field, `gloss`.  (By the way, if you don't know this word, "gloss" is what linguists call a labeled breakdown of the parts of a word, like `1-past-pend`.)

We have to decide what our gloss is going to look like, so let's say `jumps` comes out as `jump-3SG.PRES`, `jumped` comes out as `jump-PAST`, etc.  (But there's nothing special about these labels.  I chose linguist-y labels, but you could use any labels you want.  Gramble doesn't understand what `text` or `gloss` or `jump` or `3SG.PRES` mean.) 

(If you're following along in the interface, this is the second example, `2: text<->gloss`, in the `Gramble`->`Tutorial sheets` menu.)

| **Root =** | **text** | **gloss** |
|:--:|:--:|:--:|
|    | call  | call |
|    | jump  | jump |
| &nbsp; |
| **Suffix =&nbsp;** | **text** | **gloss** |
|    | s   | -3SG.PRES |
|    | ed  | -PAST |
|    | ing | -PRES.PROG |
| &nbsp; |
| **Verb =** | **embed** | **embed** |
|            | Root | Suffix |

We added the `gloss` field to each of the `Root` and `Suffix` tables above, associating each piece of `text` with the appropriate piece of `gloss`. So, for example, in the `Root` table, `call` in the `text` field is associated with `call` in the `gloss` field (`{text:call, gloss:call}`), and in the `Suffix` table, `ing` in the text field is associated with `-PRES.PROG` in the `gloss` field (`{text:ing, gloss:-PRES.PROG}`); the `Verb` table contentenates entries from the `Root` and `Suffix` tables, so one of its results would be `calling` in the `text` field, and `call-PRES.PROG` in the `gloss` field (`{text:calling, gloss:call-PRES.PROG}`).

(There's nothing special about that hyphen either, by the way.  It's a character like any other, and I'm just putting it there to split up the gloss because we decided that was how glosses are going to be split up.)

Also, there's a shorthand we can use when a table like `Root` has two fields that are exactly the same, we can join them with a forward slash like so:

| **Root =&nbsp;** | **text/gloss** |
|----|:--:|
|    | call  |
|    | jump  |

That means we don't have to write the same thing twice.  (Writing things twice can be bad because the two versions can sometimes get out-of-sync with each other.  This makes sure they're always the same.)  After all, not-writing-things-a-bunch-of-times is the whole reason we're writing a program!

## Trying out a transduction

Let's put that into your sheet.  After doing so, remember to first **click any cell other than the last cell you edited**.  Then click `Sync & Validate` in the sidebar, which makes the sidebar interface update to use your latest changes.  

`<YourSheetName>.Verb` should still be selected in the dropdown menu, but if not, select it again.  Now if you sample by clicking `Sample here`, you'll see there are *two* fields in the results.  Check that you're generating all six forms, and that the correct gloss is matching up with the correct text!

Now let's look at another part of that interface that we haven't used yet.  Below `<YourSheetName>.Verb` but before the buttons, you can see coloured text input areas labeled with the field names of `Verb`: `gloss` and `text`.  Anything you type into these restricts the generation/sampling -- or put another way, it lets you make a database query.

So type `called` into the coloured input area labelled `text`.  Now if you sample or generate, the only possible result is `{text:called, gloss:call-PAST}`.  We've done a transduction!
