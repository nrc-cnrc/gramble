CALL copy ..\packages\gramble\src\transducers.ts .
CALL copy ..\packages\gramble\src\spreadsheet.ts .
CALL copy ..\packages\gramble\src\util.ts .
CALL clasp push
CALL del transducers.ts spreadsheet.ts utils.ts