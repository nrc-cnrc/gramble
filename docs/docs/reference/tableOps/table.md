---
id: table
title: table
sidebar_label: table
---

## Description

`table` is a table operator that does not perform any semantic function (it is a "no-op"), but exists for syntactic reasons in order to prevent the mis-interpretation of other table operators as cell content.

## Usage examples

To show why this is needed, consider the following source code:

| **A =&nbsp;** | **text** | **person** |   |
|:--:|:--:|:---:|:---:|
|    | pa | 1sg |
|    | na | 2sg |
|    | i  | 3sg |
| &nbsp; |
|    | **join:** | **person** | **eng** |
|    |           | 1sg        | I       |
|    |           | 2sg        | you     |
|    |           | 3sg        | he/she/it | 

The programmer is trying to `join` the second table to the first.  However, `join:` doesn't get interpreted by the parser as a operator, it gets interpreted as text in the `text` field above. 

Remember, blank lines in Gramble aren't meaningful, they're just ignored.  Everything below `text` here will be interpreted as text until the enclosure of `A` is actually broken by an operator under `A`.  And `join:` is perfectly valid text, there's nothing wrong with text ending in ':'.   (That is to say, being-an-operator and not-being-an-operator are primarily structural, not based on whether a string ends in ':'.)

For `join:` to be interpreted as an operator here, it needs to be under another operator, not under a header like `text`.  That's what `table:` is for; it does not do anything semantically, but fills the syntactic role of the first operator in a chain of sibling operators.

| **A =&nbsp;** | **table:** | **text** | **person** |
|:--:|:--:|:--:|:---:|
|    |    | pa | 1sg |
|    |    | na | 2sg |
|    |    | i  | 3sg |
| &nbsp; |
|    | **join:** | **person** | **eng** |
|    |           | 1sg        | I       |
|    |           | 2sg        | you     |
|    |           | 3sg        | he/she/it | 

## An alternative 

For convenience, all table operators like `join`, `replace`, etc. can also serve as the direct siblings of assignments, with the same semantics as the above.  (That is to say, rather than `table:` be the first operator in a chain of sibling operators, the assignment can be.)

| **A =&nbsp;** | **text** | **person** |
|:--:|:---:|:--:|
|    | pa | 1sg |
|    | na | 2sg |
|    | i  | 3sg |
| &nbsp; |
| **join:** | **person** | **eng** |
|           | 1sg        | I       |
|           | 2sg        | you     |
|           | 3sg        | he/she/it | 

Some programmers prefer this style (because it conserves horizontal space), other programmers prefer the style with `table:` because they find it visually clearer when assignments and operators are in separate columns.
