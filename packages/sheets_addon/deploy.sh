#!/usr/bin/env bash

# This script transpiles and deploys Gramble as a Google Apps Script project
USAGE='Usage: ./deploy.sh <project-path>'
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

TARGET_DIR=$1

IFS='/' read -ra ADDR <<< "$1"
for i in "${ADDR[@]}"; do
    PROJ_NAME="$i"
done

# Create a single Gramble javascript file and wrap it as HTML
echo "Rolling up Gramble into a single file..." >&2
rollup ../interpreter/dist/indexGSuite.js -c --file gramble1.js --format cjs
echo "Browserifying gramble.js..." >&2
browserify --extension=.js -s gramble -o gramble.js gramble1.js
if [[ ! -f gramble.js ]]; then
    echo "Error: gramble.js file does not exist" >&2
    exit 1
fi
cat <(echo '<script>') gramble.js <(echo '</script>') >> grambleWrapped.html

# make sure the target directory exists, and copy the project files to it
echo "Copying project files to '$PWD'/$TARGET_DIR" >&2
mkdir -p $TARGET_DIR
cp Code.js gramble.js grambleWrapped.html sidebar.html style.html appsscript.json $TARGET_DIR
rm gramble1.js gramble.js grambleWrapped.html 

cd $TARGET_DIR

# start a Clasp project if it doesn't exist
if [[ ! -f ".clasp.json" ]]; then
    echo "Creating Clasp project 'Gramble ($PROJ_NAME)'" >&2
    clasp create --title "Gramble ($PROJ_NAME)" --type sheets
fi

# push to Google
echo "Pushing project 'Gramble ($PROJ_NAME)' to Google" >&2
clasp push
