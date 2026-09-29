---
id: collection
title: collection
sidebar_label: collection
---

## Description
`collection` is a table operator that lets you group together multiple symbols. They can then be referenced using the format **CollectionName.Symbol** where **CollectionName** is the name of the collection in which **Symbol** is defined. **CollectionName.All** can be used to reference all symbols within a single `collection`.

## Usage Example

Suppose you have a `collection` called **Words** that contains the following tables:
|**Words =&nbsp;**| `collection`:| **Nouns =&nbsp;** | _text_ |
|:--:|:--:|:--:|:--:|
| | | | casa |
| | | | gato |
| | | | sabor |
| | | | animal |
| | | **PossessiveAdjectives =&nbsp;** | _text_ |
| | | | mi |
| | | | tu |
| | | | su |

Now you can defin a symbol **NounPhrases** in which you want to embed **Nouns** and **PossessiveAdjectives** to form noun phrases. To do this, you can reference the `collection` in which **Nouns** and **PossessiveAdjectives** are defined, like so: **Words.Nouns** and **Words.PossessiveAdjectives**. Now you can embed them (we're also adding a pound sign between the two words to stand in for a space, in the _text_ column of the table below)!

| **NounPhrases =&nbsp;** | `embed` | _text_ | `embed` |
|:--:|:--:|:--:|--:|
| | Words.PossessiveAdjectives | \# | Words.Nouns |
