#!/usr/bin/env bash

# This script transpiles and deploys Gramble as a GAS project

if [[ $# -eq 0 ]] ; then
    echo 'some message'
    exit 1
fi

# transpile Gramble to javascript and wrap it as HTML
browserify ../packages/parser/src/indexGSuite.ts -p tsify -s gramble -o gramble.js
cat <(echo '<script>') gramble.js <(echo '</script>') >> grambleWrapped.html

# make sure the target directory exists
mkdir -p ../deployments/$1
cp Code.js gramble.js grambleWrapped.html sidebar.html style.html ../deployments/$1
rm gramble.js grambleWrapped.html 

cd ../deployments/$1

# start a Clasp project if it doesn't exist
if [ ! -f ".clasp.json" ]; then
    echo "Choose 'sheets' in the menu below"
    clasp create --title "Gramble ($1)"
fi

# push to Google
clasp push