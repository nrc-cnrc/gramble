---
id: equals
title: equals
sidebar_label: equals
---

## Description

The `equals` operator (used with a given field name) lets you filter a grammar so that an entry can only be generated if the form in the given field is equal to a particular string or matches a particular regex.

`equals` applies to the content immediately to its left, but can be [chained](chaining).

## Usage examples

Say, for example, that the **A** symbol defines the fields _text_ and _group_, and _group_ can be either "ER", "IR", or "OTHER".  The following code creates a symbol **B** that only contains entries where the _group_ equals "OTHER".
| **A =&nbsp;** | _text_ | _group_ |
|:--:|:--:|:--:|
| | manger | ER |
| | aller | OTHER |
| | choisir | IR |
| | vendre | OTHER |
| | pouvoir | OTHER |
| **B =&nbsp;** | `embed` | `equals` _group_ |
|    | A  | OTHER |

Below an `equals` operator, content is interpreted as a regex.
For example, we could filter **A** only to entries where the text starts with "p", "t", or "k":

| **B =&nbsp;** | `embed` | `equals` _text_ |
|:--:|:--:|:--:|
|    | A  | (p\|t\|k).* |

(There is also a special convenience operator for this, `starts`, which you can read about on the [starts page](starts), that auto-generates a regex and would suffice for this particular use-case.  However, if you have a more complex regex you wish to filter on, we recommend using `equals` and being explicit about which regex you want to match.)
