#!/usr/bin/env node

const fs = require("fs");
const jsSource = fs.readFileSync("gramble.js");
const wrappedSource = "<script>\n" + jsSource + "</script>";
fs.writeFileSync("grambleWrapped.html", wrappedSource);