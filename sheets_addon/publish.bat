CALL browserify ..\packages\parser\src\sheetParser.ts -p tsify -s gramble -o gramble.js
CALL node wrapJS.js
CALL clasp push