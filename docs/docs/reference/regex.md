---
id: regex
title: Regular Expressions
sidebar_label: Regular Expressions
---

# Regular expressions

Some header operators -- `equals`, `starts`, `ends`, `contains`, `from`, and `context` -- cause the cells below them to be interpreted as regular expressions.

Gramble supports the following regex operations:

* Match any single character `.`
* Match zero or more characters `*`
* Match one or more characters `+`
* Match zero or one character `?`
* Negation `~`
* Single-character negation `!`
* Alternation `|`
* Intersection `&`
* Parentheses `(`, `)`

Gramble also allows embedding an existing symbol via the syntax `{X}`.  For example, rather than type `a|e|i|o|u` all the time, you could define a symbol `Vowels` with this denotation and then embed it as `{Vowels}`.  However, this only works with symbols containing only a single field -- these are only single-"tape" regular expressions, and it would not make sense to embed a multi-field grammar in them.

## Regular vs. extended regular expressions

Many programming languages allow "regular expressions" with additional operators such as lookahead.  These are more properly termed *extended* regular expressions; the languages they denote are not regular in Kleene's sense.  Gramble does not yet support these.

## Notes about negation

### What is the negation of a grammar?

The negation of grammars can be counter-intuitive.  Remember that a grammar denotes some language (in the formal sense, so just a set of strings), and the negation of a language is 
its complement -- the set of strings *not* in that language.  So the complement of `{a}` isn't just `{b,c,d,...}` etc., it also contains `aa`, `aaaaaaa`, the empty string, etc.

It's important to remember that the empty string can be part of a negated language.  For example, you may want to write a regular expression that means "doesn't start with 'a'", and your first attempt is `~a.*`  But upon running this, this regex lets through words like "apple".  Why?  Well, it's because `~a` includes the empty string, meaning that this will end up matching `.*` -- any string at all!  The appropriate regex was `~(a.*)` where the negation scopes over the whole thing: "the complement of the set of strings that start with 'a'" rather than "the set of strings that starts with the complement of 'a'."

(Because this is such a common need in grammars, the `starts`, `ends`, and `contains` headers actually do this switch for you.  If you put `~a` under a `starts` header, it creates the regex `~(a.*)` for you; it doesn't just naively construct `~a.*`.)

### What is the alphabet of a negation?

The alphabet of a negated grammar is the same as that grammar -- that is, if the alphabet of the field in question is `{a,b,c}`, then only these characters will occur in its negation.  For example, if we have a grammar `ab|aba|cb`, which has an alphabet containing only `{a,b,c}`, then its negation will contain strings like `aaaa` and `b` and `abcabc`, but won't contain `d` or `xyz`.

### Single-character negation

Gramble also does provide an operator where you can negate single characters (e.g., where the negation of `a` really does result in `{b,c,d,...}`); it's `!a`.  (This is equivalent to `.&~a` -- the intersection of a single character and the complement of `a`.)

The syntax is the same as for regular negation -- e.g., you say `!(a|b|c)`, not `[!abc]` or `[^abc]`, like you might be used to from other regular expression languages.   The reason for this more explicit syntax is because, unlike the ASCII characters these regex languages were intended for, it's easier to make a mistake about what counts as a single Gramble character.  If were were to say [^pʰaːt͡ʃ], are you the programmer sure that Gramble is dividing that up into single characters the same way you intended?  Gramble's character-tokenization algorithm is deterministic, but we don't want to rely on the programmer having a complete understanding of it just to use single-character negation.  So we chose a syntax with explicit dividers so there are no surprises.  Gramble will warn you if the thing you seperated out as a "single character" here actually isn't.
