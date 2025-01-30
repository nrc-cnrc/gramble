---
id: join
title: join
sidebar_label: join
---

## Description

`join` is a table operator that performs a natural join between its sibling (the content above it) and its child (the content immediately to its right).

## Usage examples

The following example is somewhat trival, since it's only joining two literal tables, but it illustrates a common usage of `join`.  

| **A =&nbsp;** | **table:** | **text** | **person** |
|:--:|:--:|:--:|:--:|
|    |    | pa | 1sg |
|    |    | na | 2sg |
|    |    | i  | 3sg |
| &nbsp; |
|    | **join:** | **person** | **eng** |
|    |           | 1sg        | I       |
|    |           | 2sg        | you     |
|    |           | 3sg        | he/she/it | 

We might want, in the client program, rough English labels for every pronominal affix, in addition to "1sg", "2sg", etc..  But there might be (unlike the simple example above) dozens of pronominal affixes in (say) different tenses.  It can get overly verbose to add "I", "you", etc. to every single one, and this doesn't add any new information if we've already specified them as "1sg", etc.  

Doing a join between a grammar and a "legend" table that associates each existing "1sg" with "I" can be a concise way of adding this information.

Note that, like all table operators, it is also possible to make the `join` a direct sibling of an assignment, like so:

| **A =&nbsp;** | **text** | **person** |
|:--:|:--:|:--:|
|    | pa | 1sg |
|    | na | 2sg |
|    | i  | 3sg |
| &nbsp; |
| **join:** | **person** | **eng** |
|    | 1sg        | I       |
|    | 2sg        | you     |
|    | 3sg        | he/she/it | 

