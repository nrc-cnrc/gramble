#!/usr/bin/env bash

# This script transpiles and deploys Gramble as a Google Apps Script project
USAGE='Usage: ./deploy.sh <project-name>'
if [[ $# != 1 ]] ; then
    echo "Error: Expected exactly 1 argument, but found $#." >&2
    echo "$USAGE" >&2
    exit 1
fi

if [[ $1 == "-h" || $1 == "--help" ]]; then
    echo "$USAGE" >&2
    exit 0
fi

# make sure we are in the sheets_on folder
if [[ $(basename "$PWD") != sheets_addon ]]; then
    if [[ ! -d packages/sheets_addon ]]; then
        echo "Error: Unable to locate packages/sheets_addon" >&2
        exit 1
    fi
    cd packages/sheets_addon
fi

PATH="$PWD"/../../node_modules/.bin:$PATH

PROJ_NAME=$1
TARGET_DIR=../../deployments/$PROJ_NAME

# transpile Gramble to javascript and wrap it as HTML
echo "Transpiling Gramble to JavaScript..." >&2
browserify ../parser/src/indexGSuite.ts -p tsify -s gramble -o gramble.js
cat <(echo '<script>') gramble.js <(echo '</script>') >> grambleWrapped.html

# make sure the target directory exists, and copy the project files to it
echo "Copying project files to '$PWD'/$TARGET_DIR" >&2
mkdir -p $TARGET_DIR
cp Code.js gramble.js grambleWrapped.html sidebar.html style.html $TARGET_DIR
rm gramble.js grambleWrapped.html 

cd $TARGET_DIR

# start a Clasp project if it doesn't exist
if [[ ! -f ".clasp.json" ]]; then
    echo "Creating Clasp project 'Gramble ($PROJ_NAME)'" >&2
    clasp create --title "Gramble ($PROJ_NAME)" --type sheets
fi

# push to Google
echo "Pushing project 'Gramble ($PROJ_NAME)' to Google" >&2
clasp push
