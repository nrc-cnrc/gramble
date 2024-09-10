---
id: gs3
title: A simple Gramble program
sidebar_label: A simple Gramble program
---

## Enter Gramble

In the previous section, we mentioned that many linguistic databases would be so large and complicated that no human could really maintain them.  Some would even be infinite!  So for some kinds of linguistic phenomena, we handle things not by listing out every possible answer, but by 

*Gramble* is a tabular programming language intended to make it easy to write these kinds of programs.  The neat thing about Gramble is that the programs are both readable *descriptions* of the phenomena in question (e.g., they look like fairly ordinary verb conjugation tables or phoneme conversion charts) as well as being the *code* that turns a query into its correct answers.

You interact with a Gramble program just like you would interact with a database, by inputting queries and getting answers in return.  

For example, the following little Gramble program has the same effect as the Swahili database above:

| **Subject =** | **text** | **person** ||
|----|----|----|---|
|              | ni   | 1 |
|              | u   | 2 |
|              | a   | 3 |
| &nbsp; |
| **Tense =** | **text** | **tense** |
|         | na | present |
|         | li | past |
|         | me | perfect |
| &nbsp; |
| **Root =** | **text/root** |
|         | pend |
|         | ona |
| &nbsp; |
| **Verb =** | **embed** | **embed** | **embed** |
|           | Subject | Tense | Root |


## That seems like MORE work?!?

Yes, maybe, if the database only had 18 forms total.  But these databases tend to grow exponentially.  

Right now we only have 2 roots, 3 tenses, and 3 subjects, and 2 x 3 x 3 = 18.  Swahili has a LOT more than those -- it has about a dozen tenses, many more subject person markers AND object markers, negation, voices, etc.  Every time you add a new category the size of the database tends to double (or more).  Kawennón:nis, the verb conjugator for the Kanyen'keha (Mohawk) language, quickly grew from a few hundred forms to about 2.4 million.

If we were maintaining that all as a giant, human-curated list, adding anything at all would be prohibitively expensive.  Someone might say "Oh, we need to add a new verb root!" and that might add another 10,000 entries!  Or they'd say "We need to add the yes no question form!" and that means another 2.4 million entries.

But when you're dealing with the parts, you just add the new parts.  Like if I needed to add a new root to the Swahili database above, I don't have to add all 9 forms of it, I just have to add one more line in the `Root` table.  And this doesn't change if I have 10,000 forms of each verb, it's still just adding one more line.

## Let's back up and make on for English first.

The above might be a little difficult to understand, because it's describing something you probably don't know (Swahili verbs).  Let's start again with English verbs.

I've chosen "regular" verbs (those that don't change form) to make things easier for now.  Let's model these two verbs, in three conjugations:

| |
|-------|
| calls | 
| calling |
| called |
| jumps | 
| jumping | 
| jumped |

When we write a Gramble program, we are building a *model* of the phenomenon in question.  There's no one way to write a model; different models might work completely differently but have the exact same outputs.  We might model the above phenomenon in one of two ways:

1. Just list out every possible form as-is (for example, ``calls``, ``calling``, etc.).
2. Break the words into meaningful pieces (the "roots" ``call`` vs. ``jump``, and the "suffixes" ``s`` vs. ``ing`` vs. ``ed``), specify in what order they occur, and specify any changes they might have to go through in the process (like changing ``y+s`` to ``ies``).

The first option is easy in the short run, because it doesn't really take any planning, but in the long run it ends up being way too much work.  (Programming is the art of being lazy in a precise way!)  You might imagine listing every single verb form for every verb in English -- that's *doable*, at least, some dictionaries do that -- but as we saw in the last lesson it's never going to work for Swahili or other languages with long, complex verbs.

So let's do (2).

First, let's make a table containing the verb roots, ``call`` and ``jump``.  

| **Root =** | **text** |
|----|----|
|    | call  |
|    | jump  |

By the way, there's nothing special about the field `text` here.  I could call it anything I want.  Gramble lets you name fields almost anything you want (with a few restrictions like they can't have spaces in them, start with a symbol or number, etc).

Then, let's add a table containing the suffixes, ``s``, ``ing``, and ``ed``

| **Suffix =** | **text** |
|----|----|
|    | call  |
|    | jump  |

Now, we make a table that takes every form in the Root table and concatenates it to every form in the Suffix table.  There's a special command that lets you say "every form in the Root table" and that's `embed`.

| **Verb =** | **embed** | **embed** |
|----|----|-----|
|           | Root | Suffix


## Try it out in the Gramble sheet

Go ahead and paste these into a Google Sheet where the Gramble plugin has been installed, or go up to the Gramble menu (it's up towards the top of the screen, to the left of File, Edit, etc.) and choose "Example pages" -> "Example 1".

To check that everything's working properly, go up to the Gramble menu and choose "Show sidebar".  This sidebar interface lets you interact with your Gramble grammar.

Go to the dropdown menu at the top, it'll probably say something like `YourSheetName.Root`.  Choose `YourSheetName.Verb`, because we want to test whether this generates all six forms.  Now, you can generate (either to a new sheet or as a file you can download), or you can just keep clicking "Sample here" to get a single random verb.  You should be able to generate/sample all six possible forms.

Try adding a third root, like `walk`.  The go back to the sidebar and click "Sync & Validate", which will let it see your new changes.  (The sidebar is NOT able to follow your changes automatically.  For security/efficiency reasons, the sidebar doesn't anything without you clicking something; only you can ask it to look at the spreadsheet again to see that you've made changes.)