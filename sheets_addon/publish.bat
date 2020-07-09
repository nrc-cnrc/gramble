CALL copy ..\packages\gramble\src\transducers.ts .
CALL copy ..\packages\gramble\src\spreadsheet.ts .
CALL copy ..\packages\gramble\src\util.ts .
CALL copy ..\packages\gramble\src\tierParser.ts .
CALL clasp push
CALL del transducers.ts spreadsheet.ts util.ts tierParser.ts