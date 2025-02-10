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

PATH="$PWD"/../../node_modules/.bin:$PATH

IFS='/' read -ra ADDR <<< "$1"
for i in "${ADDR[@]}"; do
    PROJ_NAME="$i"
done

TARGET_DIR="$INIT_CWD/$1"

# make sure the target directory exists, 
mkdir -p $TARGET_DIR

# Create a single Gramble javascript file and wrap it as HTML
echo "Rolling up Gramble into a single file..." >&2
rollup ../interpreter/dist/indexGSuite.js -c --file $TARGET_DIR/gramble1.js --format cjs
echo "Browserifying gramble.js..." >&2
browserify --extension=.js -s gramble -o $TARGET_DIR/gramble.js $TARGET_DIR/gramble1.js
rm $TARGET_DIR/gramble1.js
if [[ ! -f $TARGET_DIR/gramble.js ]]; then
    echo "Error: gramble.js file does not exist" >&2
    exit 1
fi
cat <(echo '<script>') $TARGET_DIR/gramble.js <(echo '</script>') >> $TARGET_DIR/grambleWrapped.html

# copy the project files to the target dir
echo "Copying project files to $TARGET_DIR" >&2
cp Code.js sidebar.html style.html appsscript.json $TARGET_DIR

cd $TARGET_DIR

# start a Clasp project if it doesn't exist
if [[ ! -f ".clasp.json" ]]; then
    echo "Creating Clasp project 'Gramble ($PROJ_NAME)'" >&2
    clasp create --title "Gramble ($PROJ_NAME)" --type sheets
fi

# push to Google
echo "Pushing project 'Gramble ($PROJ_NAME)' to Google" >&2
clasp push
