---
id: gs7
title: Circumfixes and other long-distance morphology
sidebar_label: Circumfixes
---

When word formation requires you do add both a prefix and suffix at the same time, that's sometimes called a circumfix.  The existence of circumfixes in English are debatable, but consider something like "enliven": there's a root "live" and then an "en- -en" surrounding it.  This one isn't the greatest example because we can also say this was formed "live -> liven -> enliven", but there are languages where this step-by-step approach doesn't work, where BOTH affixes have to be put on together or else the word is meaningless, or where their presence together has a different meaning contribution than you'd predict from their individual meanings.

## A Swahili example

I was a little hand-wavey earlier with what "-a" meant at the end of Swahili verbs.  I treated it as a part of the root, or said it just meant that something was a verb, but that's not quite true.  In *most* conjugations of verbs, the verb ends with "-a", but there are many where it doesn't.  

I call this "tense" below but it's not exactly tense in the linguistic sense, it's tied up with mood and negation and various other meanings.  But plenty of sources just call this "tense" for convenience, and so will I.

| **Root =** | **text** | **root** | |  |
| -------------| ---- | ----- |------|---|
|              | pend | love |
| &nbsp; |
| **Stem =** | **text** | **embed** | **text** | **tense** |
|              | na   | Root  | a    | present.continuous |
|              | li   | Root  | a    | past |
|              | me   | Root  | a    | past.perfect |
|              | ka   | Root  | a    | narrative | 
|              |      | Root  | e    | subjunctive |
|              | ka   | Root  | e    | expeditious |
|              | ha   | Root  | i    | negative.present | 
|              | si   | Root  | e    | negative.subjunctive |
|              | si   | Root  | a    | relative.negative |

When you look at the whole chart (and this isn't the whole chart, there are about two dozen of these), it becomes hard to pin down exactly "where" the idea of negation or subjunctivity rests -- there's not *one* morpheme that's present if and only if something is negative, or subjunctive.  It's only by the combination of the two that pins down the tense.  

Note that there's nothing special here about any particular morpheme here.  In the "expeditious" row, for example, you're just adding "ka" to the text field, then embedding the Root (meaning adding "pend" to the text field and "love" to the root field), then addding "e" to the text field.  There's nothing saying that this is a special case of "ka" or "e" compared to the usual uses, or that this "ka" and "e" are related in some way; these are just instructions about what gets added where.  They're "related" only in the sense that there's a derivational path through this grammar that puts "ka" and "e" on some verbs and these also have "expeditious" in the tense field.

Also, side note, you'll see in the subjunctive row that there's a blank cell.  That's fine, that just means "don't add anything here".

## An Anishinaabemowin example

For another example, "kizāgihin", meaning "I love you" in Anishinaabemowin, consists of the stem "sāgih" (here it's pronounced "zāgih") and two additional morphemes, "ki-" and "-in".  However, it's not like one of them means "1SG.SUBJ" and the other one means "2SG.OBJ", it's only the two of them together that add these meanings.  (The "ki-" definitely has a 2nd person singular meaning... but not necessarily the *object*.  Like "kizāgihi" means "You love me".  The "-in" vs. "-i" helps tell you whether to interpret "ki-" as representing the subject or object.  Anyway, it's complicated and you don't have to understand what's really going on here, all we need here is a real-world example of when you need to add two morphemes at once to get the meaning correct.)

Handling these is straightforward in Gramble; you just put both morphemes onto the same line.

| **Root =** | **text** | **root** | | | |
| -------------| ---- | ----- |--|--|--|
|              | zāgih | love |
| &nbsp; |
| **Stem =** | **text** | **embed** | **text** | **subj** | **obj** |
|              | ki   | Root  | in   | 1SG | 2SG |
|              | ki   | Root  | i    | 2SG | 1SG |

Again, there's nothing special about this "ki", all we're doing in the fifth line, for example, is adding "ki" to text, embedding the Root (meaning adding "zāgih" to text, and "love" to root), then adding "in" to text, and so on for the subject and object.

## You can have the same header twice?

You may have noticed that "text" appeared twice, and thought, "Wait, thinking of this as a database table, that makes no sense.  Does the text field contain 'ki' or 'in'?"

Good catch, and the truth is these aren't database tables.  Think of them more like instructions on how to build a database, step-by-step.  We designed them so that the two looked very similar, so that many data-description spreadsheets your team might come up with are -- TA-DA! -- magically also working Gramble source code.  But the same isn't true in the other direction; tables in Gramble source code aren't necessarily valid when interpreted as database tables.