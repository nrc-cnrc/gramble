CALL browserify ..\packages\parser\src\index.ts -p tsify -s gramble -o gramble.js
CALL node wrapGramble.jscript
CALL clasp push