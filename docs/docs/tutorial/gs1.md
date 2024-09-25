---
id: gs1
title: What is Gramble?
sidebar_label: What is Gramble?
---

Gramble is a programming language for *linguistic programming*: building tools that create or respond to human language words and sentences.  It's meant to be easier to read and write, so that people can make linguistic programs in their languages without necessarily having to have a degree in computer science.

For example, many of the Gramble programs written so far are interactive verb conjugators that generate the correct form of verbs.

Gramble isn't for making the *user interfaces* for these; those we still make in other languages like HTML and JavaScript.  Gramble is just for the linguistic part of those -- it's a way of making a sort of "database" that another program can query when it needs to know an answer like "What's this conjugation of this verb?" or "How is this pronounced?"

This tutorial will take you through a lot of the "background" ideas that you'll need to understand to make language technologies like these, and show you how to make them yourself. 

## Getting started

The easiest way to get started with Gramble is by using our Google Sheets Add-on.  This will let you develop and test Gramble programs without having to download or install anything on your own computer/server.

The Add-on is currently undergoing the approval process to appear on Google Marketplace (verifying that it doesn't do anything inappropriate with the data it's permitted to access, basically).  Hopefully that will be through soon and these instructions will be much easier.

In the meantime, you have two options:

* If you want to use the Google Sheets Add-on, you can actually deploy it inside your own workplaces yourself, without going through the Marketplace.  You can clone our GitHub at http://github.com/nrc-cnrc/gramble, and run `npm run deploy <projectName>`.  Further instructions on how to do that can be found in the README file there.

* If you don't want to use Google Sheets, there's actually nothing Google-specific about the language.  You could program it in LibreOffice or Excel or even a text editor like `vim`.  Clone the GitHub above and then look in the `packages/cli` directory for information on how to use the command-line interface.