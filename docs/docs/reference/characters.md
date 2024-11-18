---
id: characters
title: characters
sidebar_label: characters
---

# Characters

Some aspects of programming languages operate on single characters (for example, the "dot" operator . of a regular expression).

Gramble characters are slightly larger than the "characters" you might be used to in other programming languages.  Instead of dividing a string like "pʰaːt͡ʃ" into seven units ("p", "ʰ", "a", "ː", "t", "͡", "ʃ") like (say) Python would, it divides it into three units ("pʰ", "aː", "t͡ʃ"), just like you would if dividing an IPA into phonemes.

More specifically, they're a variant of Unicode grapheme clusters, but to explain those we need to discuss Unicode in more detail.

## A more in-depth explanation

Characters (letters, numerals, punctuation marks, etc.) are represented inside computers as numbers.  For example, we might associate "A" with 65, "B" with 66, etc.  That association is called an "encoding".  If we're just representing English, then it's pretty straightforward to associate each letter with a single number, and that's that.  If you want to ask, "How many letters are in 'hello', you can look at the sequence of numbers, count them, and respond "Five".  If you want to ask "What's the second letter of 'hello'?", you look at the second number in that sequence, see that it's 69, look that up, and say "It's 'e'."

Things get much more complicated, however, if we need to represent *any* word in *any* language.  For example, we need to represent letters with diacritics, or even multiple 
diacritics like Vietnamese "ầ" or "ệ".  We don't want to represent every possible combination; that would end up being too many letters.  (For example, there are something like 90,000 valid combinations of IPA letters and diacritics.)  To be able to represent any of these, we represent each of their component parts as individual numbers (U+0065, U+0323, U+0302) -- call those "codepoints" -- and the text rendering program looks up what shapes that corresponds to and arranges them in an appropriate way on the screen.

However, this raises a question.  What's the right answer to the question, "How many letters are in 'Việt'?"  How about "What's the third letter of 'Việt'?"  If we just bite the bullet and say "One character = one codepoint", then there are five letters in "Việt" and its third letter is "e", just plain "e" with no diacritics.  That might feel a bit counterintuitive, but it's how a lot of programming languages work.  In Python, `len("Việt")` equals 6 and `"Việt"[2]` = "e".

But things get more complicated than that.  There are also composed characters, like there's a special "ệ" that's only one codepoint (U+1EC6).  If you're working on a major world language like French or Vietnamese, there are probably composed versions of most or all characters.  And you can convert back and forth, so you can choose to treat "ệ" as one character or three depending on your needs.

But you can see how this can lead to surprises.  Not every language has this privilege, and in order to guess whether something has a combined form -- and therefore the answer to 
questions like "What's the third letter of this word?" isn't easily answerable unless you know a lot about the history of encodings.  "à" has a one-codepoint version and a two-codepoint version, because it's in French and its codepoint was inherited from the old `latin_1` encoding.  "æ̀" does not have a one-codepoint version, only two.

Why is this important for Gramble?  Well, consider a grammar like this:

| **Root =** | text | gloss |
|---------|-------|----------|
|         | aba   | run |
|         | àri    | eat |
| X = | embed | starts text |
|---------|-------|----------|
|         | VerbStem | a |

Does this `starts` operator filter out "àri" or not?  If Gramble had the notion that "character = codepoint", it might or might not.  If "àri" uses the decomposed version, then "àri" still starts with "a" -- it's a four-character string starting with "a".  If "àri" uses the composed version, then it doesn't start with "a" -- it's a three-character string starting with "à", which isn't the same codepoint as "a".  And this might be different for different characters -- "æ̀" would always start with "æ" because there's no composed version of that.

So Gramble doesn't use the idea "character = codepoint" like Python does; it uses a different notion of character.

## Unicode grapheme clusters

The Unicode standard also defines a larger unit, the "Unicode grapheme cluster" (UGC), that is meant to avoid this problem and hews more closely to what most people think of as a "letter", even if that letter happens to consist of multiple Unicode codepoints.  "à" and "æ̀" and "ệ" are all just one UGC in length.  Regardless of whether we are using the one-codepoint version of "ệ" or its three-codepoint version, both are exactly one UGC in length.

Gramble characters are UGCs (or strictly speaking, a variant of them), and are treated as atomic (that is, they are treated as having no further internal structure).  "a" and "à" are treated as completely different letters with nothing in common.

The algorithm for dividing a word into Gramble characters is pretty simple.  Roughly, step through a word's codepoints from the beginning to end.  If there's a letter, numeral, or punctuation, that starts a new UGC, but when you come across a diacritic, add it to the previous UGC.  (Every Unicode codepoint belongs to a class like Letter (L), Punctuation (P), etc.  Gramble doesn't know whether each codepoint is a letter or punctuation or diacritic in any particular language's orthography; all it's doing is looking at this class in the codepoint's Unicode data.  This might differ from how *your* language thinks of a codepoint as a letter; see Gotcha #1 below for some more discussion.)

## Differences between Gramble characters and UGCs

Unicode defines a particular algorithm for UGCs, while accepting that many applications or languages might need to vary it someone for their particular purposes.  Gramble takes advantage of this freedom to hew somewhat closer to what a linguist would expect working with the IPA.

For example, modifier letters like the superscript "ʷ" are counted as their own UGCs, so a sequence like "kʷ" is two UGCs long.  This isn't the way a linguist would typically segment phonemes, though; they'll typically want to treat "kʷ" as one unit.  So in Gramble, modifier letters are treated as if they're diacritics -- added to the previous UGC rather than starting a new one.

Also, Gramble respects the IPA tie bar.  If you put a tie bar character in between two characters, like "t͡ʃ", Gramble will treat them as one unit.  This isn't part of the normal UGC algorithm; Gramble treats them specially because the normal UGC algorithm would segment this into two UGCs, "t͡" and "ʃ", which is a counterintuitive division given the IPA semantics of tie bars.  So Gramble departs from the normal UGC algorithm here: when it encounters a tie bar, it adds both the tie bar AND the next character to the previous unit.  

## Gotcha #1

For convenience, many text representations of languages use punctuation characters as phonetic diacritics -- apostrophes for ejectives, colons for length, etc.  Gramble can't know that, however; as mentioned above it just looks at the Unicode character class of each codepoint, and for apostrophes and colons it will see class P for Punctuation and treat these as new units, rather than belonging to the previous unit.

The "proper" thing to do, for punctuation-as-diacritics, is to find the corresponding actual combining/modifier letter in Unicode.  Rather than use the apostrophe on the keyboard, use ʼ U+02BC: MODIFIER LETTER APOSTROPHE.  Rather than use the colon on the keyboard, use the IPA length macron ː (U+02D0: MODIFIER LETTER TRIANGULAR COLON).  This lets text processing applications (Gramble included) understand your intentions better -- not adding punctuation to a word, but adding phonetic content.

## Gotcha #2

Another gotcha to note is that, just like the UGC algorithm, Gramble will only combine codepoints into units when the diacritic is to the *right* of the main character.  Things like pre-aspiration (ʰt) or pre-glottalization (ˀn) won't combine into units properly -- that ʰ will attach to whatever unit is before it (or, if nothing is before it, become its own unit).

What to do here?  In general, I've found it considerably easier, when working with IPA-like orthographies, to represent pre-diacritics as post-diacritics (that is, by putting all modifiers to the right of the character, even if they happen to precede it phonetically).  Not just in Gramble; I also recommend this when working in any programming language.  It's simply easier to parse unambiguously, and when it comes time to display the string to the user you can fix it up so that it's in the proper order as specified by the orthography.  

For example, some languages have both ejective stops like [tʼ] and preglottalized resonants like [ʼw].  But what if you see a sequence like [tʼw] -- does that represent [tʼ] followed by [w] or [t] followed by [ʼw]?  If we always put the apostrophe after the letter it modifies, this is no longer ambiguous: the former is now represented [tʼw] and the latter is represented [twʼ].  That latter one isn't *orthographically* correct, but unambiguous representations like this make it easier for a computer program to make the right decisions about its processing.  We can switch the [wʼ] back to [ʼw] after everything is done to present it to the user in the orthographically-correct manner.
gramble_tutorial_characters.txt
Displaying gramble_tutorial_characters.txt.