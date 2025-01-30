---
id: equals
title: equals
sidebar_label: equals
---

## Description

The `equals` operator lets you filter a grammar so that only forms where the field matches a particular regex are generated.

Like `starts`/`ends`/`contains`, `rename` and `hide`, `equals` applies to the content immediately to its left, but can be chained.

## Usage examples

Say, for example, that the **A** symbol defines the fields `text`, `gloss` and `class`, and `class` can be either `X`, `C1`, or `C2`.  The following code creates a symbol **B** that only contains entries where the `class` equals `C1`.

| **B =&nbsp;** | **embed** | **equals class** |
|:--:|:--:|:--:|
|    | A  | C1 |

Below an `equals` operator, content is interpreted as a regex.
For example, we could filter **A** only to entries where the text starts with "p", "t", or "k":

| **B =&nbsp;** | **embed** | **equals text** |
|:--:|:--:|:--:|
|    | A  | (p\|t\|k).* |

(There is also a special convenience operator for this, `starts`, that auto-generates a regex and would suffice for this particular use-case.  However, if you have a more complex regex you wish to filter on, we recommend using `equals` and being explicit about which regex you want to match.)
