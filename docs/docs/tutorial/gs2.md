---
id: gs2
title: Linguistic programs as databases
sidebar_label: Linguistic programs as databases
---

A Gramble program is a way of specifying a *linguistic database* in an efficient manner, without having to list out every possible entry.  This is useful for very complex languages like Swahili or Kanyen'keha (in which there are millions of possible verb forms), or for syntactic phenomena like sentences (where we can't possibly list every possible sentence), or for procedures like Romanization where you want to produce a Roman-alphabet version of any user input, even if it's not a word you've ever seen before.

* There are lots of programming languages in which we could specify this, from special-purpose languages like XFST to general-purpose programming languages like Python.

* We think that Gramble is the easiest and fastest way to do it, though; that's why we made it.  (Fastest in terms of development time, at least, and amount of time learning the programming language.  The actual database queries might be faster or slower, depending on a lot of factors.)

## What's a database?  

In the abstract sense, a database is an organized collection of entries, stored on a computer, that you can access ("query") in various ways.  

For example, imagine the following *very* simple and incomplete database of Swahili verb conjugations, along with the tense (past, present), person (first, second, or third), and verb root that they express.  ("Pend" means "love", if you're wondering, and "ona" means "see".  "Ninapenda" means "I love him/her/it".)

| verb  | person | tense | root |
|-----------|--------|-------|-----|
| ninapenda | 1 | present | pend |
| unapenda | 2 | present |  pend |
| anapenda | 3 | present |  pend |
| nilipenda | 1 | past |  pend |
| ulipenda | 2 | past |  pend |
| alipenda | 3 | past | pend |
| nimependa | 1 | perfect | pend |
| umependa | 2 | perfect | pend |
| amependa | 3 | perfect | pend |
| ninaona | 1 | present | ona |
| unaona | 2 | present |  ona |
| anaona| 3 | present |  ona |
| niliona | 1 | past |  ona |
| uliona | 2 | past |  ona |
| aliona | 3 | past | ona |
| nimeona | 1 | perfect | ona |
| umeona | 2 | perfect | ona |
| ameona | 3 | perfect | ona |

With a database like this, if you know the verb *nilipenda* exists and want to know its details, you could make a query like ``verb: nilipenda``.  What you'd receive in response is a list of entries that are compatible with it; in this database, one entry is compatible with it:

| verb  | person | tense | root |
|-----------|--------|-------|-----|
| nilipenda | 1 | past |  pend |

Or say you *didn't* know that word, but you want to know the 1st person past form of the root *pend*.  You can make a more complex query consisting of ``person: 1``, ``tense: past``, and ``root: pend``.  What you'd receive in response is a list of entries that are compatible with that -- in this case, the same entry as above.

| verb  | person | tense | root |
|-----------|--------|-------|-----|
| nilipenda | 1 | past |  pend |

So you could use a database like this to *parse* a known word into meaningful components, or also *generate* an unknown word from its meaningful components.  You can also make queries that give you multiple results, like asking for all the past-tense forms by just asking ``tense: past``, and receiving:

| verb  | person | tense | root |
|-----------|--------|-------|-----|
| nilipenda | 1 | past |  pend |
| ulipenda | 2 | past |  pend |
| alipenda | 3 | past | pend |
| niliona | 1 | past |  ona |
| uliona | 2 | past |  ona |
| aliona | 3 | past | ona |

## I thought this was basically a finite-state transducer language like XFST, that takes an input string and gives you an output string.  This seems more like a database language like SQL.

(If you don't understand this question, that's okay, move on to the next question.  This is just to address a common question we get.)

Yes, you can kind of think of Gramble as the baby of XFST and SQL.

But stepping back a little further, you can think of any transducer as a (potentially infinite) database, just a database with only two fields.  In FST-land we often refer to the input as 'up' and 'down', so I'll use that convention here.  

Say you made an FST from a gloss like `1-past-pend` to a word like `nilipenda`.  When making an FST we often think of that as a process, but you could also think of that as a giant database, like:

| up | down |
|-----------|
| 1-past-pend | nilipenda |
| 2-past-pend | ulipenda |
| 3-past-pend | alipenda |
| etc... |

And then instead of saying "I put in `1-past-pend` and got `nilipenda`", in database terms we might say "I made a query to select all rows where `up='1-past-pend`, and got one result: `{up:1-past-pend, down:nilipenda}`."  Same information in, same information out, we're just thinking about it in a different way.

Why would we want to think more like a database?  Well, it's quite frequent that we want to ask for more complex queries, like "Give me everything with the root 'pend', but only in past or present tense, and only in this dialect".  Or we want more information in the result.  Or, when making the database in the first place, we are trying to program complex linguistic phenomena, where this suffix has a particular form only when the mood is subjunctive and the subject is first-singular.  All of those can get complicated to do when we limit the number of "fields" in our database to two.

So Gramble is like XFST, except it doesn't have the two-field restriction; it lets you do transductions but isn't limited to things with one input field and one output field.  That sort of "generalized transduction" already has a whole rich vocabulary associated with it -- it's a database query! -- and so we often use database language when talking about Gramble programs.  But it's not a fundamentally different thing than a transduction, a transduction is just a special case of a bigger idea.


## How do we make one?

That's all well and good, but in reality there are so many possible Swahili verbs forms (thousands of them for every verb) that writing this database by hand would be effectively impossble.  There aren't just three persons and three tenses, there are more than a dozen persons (for both subjects and objects) and more than a dozen tenses, and thousands of verb roots, as well as a lot of other verb suffixes.  You simply can't specify them all, not by writing out each possible form.

So what you really need to do is write a *program* that generates Swahili verbs from their component parts ("ni" and "u" and "a" and "li" etc.), while associating the parts with their appropriate labels/meanings, specifying any changes that they undergo during combination, etc. 

A lot of linguistic phenomena are like that, not just verb conjugation.  For another example, we might want to convert words between different writing systems (like converting "ᓄᓇᕗᑦ" from Canadian Aboriginal Syllabics into its Roman form "nunavut"), or words into their pronunciation in the International Phonetic Alphabet.  You can't specify every possible Canadian Aboriginal Syllabics word as a list; the user might input a word you've never even heard of.  Rather, you have to write a program for how to do it.
