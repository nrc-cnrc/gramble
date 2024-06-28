---
id: gs1
title: What is Gramble?
sidebar_label: What is Gramble?
---

Gramble is a programming language for *linguistic programming*: building tools that create or respond to human language words and sentences.  It's meant to be easier to read and write, so that people can make linguistic programs in their languages without necessarily having to have a degree in computer science.

Some of the tools you can easily make using Gramble include:

* Verb conjugators
* Writing system conversion tools (for example, turning "ᓄᓇᕗᑦ" into "nunavut", or the other way around)
* Pronunciation guides for computer systems that generate or respond to speech
* "Mad-lib"-style text generators ("I'm so proud of my ______ for ________!")

This tutorial will take you through a lot of the "background" ideas that you'll need to understand to make language technologies like these, and show you how to make them yourself. 

COMING SOON: If you're an experienced "linguist-programmer" (for example, if you already know a toolkit like XFST), we're writing a different version of this specifically for you, outlining the differences between languages like XFST and this language.

## Getting started

The easiest way to get started with Gramble is by using our Google Sheets Add-on.  This will let you develop and test Gramble programs without having to download or install anything on your own computer/server.

The Add-on is currently undergoing the approval process to appear on Google Marketplace (verifying that it doesn't do anything inappropriate with the data it's permitted to access, basically).  Hopefully that will be through soon and these instructions will be much easier.

In the meantime, you have two options:

* If you want to use the Google Sheets Add-on, you can actually deploy it inside your own workplaces yourself, without going through the Marketplace.  You can clone our GitHub at http://github.com/nrc-cnrc/gramble, and run `npm run deploy <projectName>`.  Further instructions on how to do that can be found in the README file there.

* If you don't want to use Google Sheets, there's actually nothing Google-specific about the language.  You could program it in LibreOffice or Excel or even a text editor like `vim`.  Clone the GitHub above and then look in the `packages/cli` directory for information on how to use the command-line interface.