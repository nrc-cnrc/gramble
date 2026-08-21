---
id: columncomment
title: column comment (%)
sidebar_label: column comment (%)
---

## Description

The `column comment` operator (which is expressed using `%`) is a header operator that can be used to comment out a column.

A column that is commented out will be ignored. Unlike row comments, which comment out an entire spreadsheet row, the scope of column comments ranges from the header row of the given table (or table-like structure, like `join` or `or`) to the spreadsheet row above the next table or table-like structure's headers (inclusive); see example below.

## Usage examples
For the table **Root** below, we have added a commented-out column `% description` that contains a note that the grammar-writer is leaving for themselves or other users (in this case disambiguating multiple senses of a word).

| **Root =&nbsp;** | _text_ | _translation_ | `%` _description_ |
|----|:--:|:--:|:--:|
|    | call  | appel | noun, telephone call |
|    | bank  | banque | noun, financial institution |
|    | bank  | berge | noun, side of a river |
| **Ending =&nbsp;** | _text_ | _gloss_ | _class_ |
|    | s  | PLURAL | REGULAR |
|    |   | SINGULAR  | ALL |
| **Noun =&nbsp;** | `embed` | `embed` | 
|    | Root | Ending |

The grammar produced by **Noun** contains six entries: `{
    "translation": "berge",
    "text": "bank",
    "class": "ALL",
    "gloss": "SINGULAR"
  }`,
  `{
    "translation": "banque",
    "text": "bank",
    "class": "ALL",
    "gloss": "SINGULAR"
  }`,
  `{
    "translation": "appel",
    "text": "call",
    "class": "ALL",
    "gloss": "SINGULAR"
  }`,
  `{
    "translation": "berge",
    "text": "banks",
    "class": "REGULAR",
    "gloss": "PLURAL"
  }`,
  `{
    "translation": "banque",
    "text": "banks",
    "class": "REGULAR",
    "gloss": "PLURAL"
  }`,
 `{
    "translation": "appel",
    "text": "calls",
    "class": "REGULAR",
    "gloss": "PLURAL"
  }`; none of these show the commented out description.


Importantly, if you type text in a commented-out column without anything in the other columns (as shown below with the text "THIS TEXT IS COMMENTED OUT"), this will result in the database generated containing an entry where all the fields are the empty string.
| **Root =&nbsp;** | _text_ | _translation_ | `%` _description_ |
|----|:--:|:--:|:--:|
|    | call  | appel | noun, telephone call |
|    | bank  | banque | noun, financial institution |
|    | bank  | berge | noun, side of a river |
|    |   |  | THIS TEXT IS COMMENTED OUT |
| **Ending =&nbsp;** | _text_ | _gloss_ | _class_ |
|    | s  | PLURAL | REGULAR |
|    |   | SINGULAR  | ALL |
| **Noun =&nbsp;** | `embed` | `embed` | 
|    | Root | Ending |

The consequence of this is that the grammar produced by **Noun** here would contain the same six entries we saw above plus an additional two entries: `{
    "class": "ALL",
    "gloss": "SINGULAR"
  }`,
  `{
    "text": "s",
    "class": "REGULAR",
    "gloss": "PLURAL"
  }`.

## Why would we want to use this?

This can be used to leave explanatory notes, or to comment out fields for debugging purposes.