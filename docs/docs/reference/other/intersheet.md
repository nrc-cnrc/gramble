---
id: intersheet
title: Intersheet Reference
sidebar_label: Intersheet Reference
---

## Description
Intersheet references let you refer to symbols that appear on a different sheet. They are referenced using the format **SheetName.Symbol** where **SheetName** is the name of the sheet where **Symbol** is defined.

## Usage Example

Suppose you have a sheet called **Words** that contains the following tables:
| **Nouns =&nbsp;** | _text_ |
|:--:|:--:|
| | casa |
| | gato |
| | sabor |
| | animal |
| **PossessiveAdjectives =&nbsp;** | _text_ |
| | mi |
| | tu |
| | su |

In another sheet called **Phrases**, you've defined a symbol **NounPhrases** and you want to embed **Nouns** and **PossessiveAdjectives** to form noun phrases. To do this, you'll have to reference the sheet in which **Nouns** and **PossessiveAdjectives** are defined, like so: **Words.Nouns** and **Words.PossessiveAdjectives**. Now you can embed them (we're also adding a pound sign between the two words to stand in for a space, in the _text_ column of the table below)!

| **NounPhrases =&nbsp;** | `embed` | _text_ | `embed` |
|:--:|:--:|:--:|--:|
| | Words.PossessiveAdjectives | \# | Words.Nouns |

