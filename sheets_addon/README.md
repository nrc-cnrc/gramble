# Deploying the Google Sheets add-on

This directory contains scripts to build and deploy a convenient Gramble IDE into Google Sheets.

First, make sure that browserify and clasp are installed globally.  (I don't think installing Gramble itself installs those globally, so you have to do so yourself.)  We use browserify to transpile and bundle the TypeScript into JavaScript, and we use clasp to push the results to a Google AppsScript project.

`npm install browserify -g`
`npm install @google/clasp -g`

Clasp is a lot like Git, and like Git you have to sign in.  It's a Google product so the signin is your Google account.

`clasp login`

From Google's point of view, you'll be the "author" of this script.  (So, for example, when users are asked if they trust the author of the script, they'll be asked if they trust you@gmail.com.)

Next, choose a project name and run:

`./deploy.sh <projectName>`

This will do a bunch of things.  First it compiles and bundles Gramble to JavaScript.

If the projectName doesn't already exist, it then creates a directory `../deployments/projectName` to house the project information.  (`deployments` is in our .gitignore by the way, so none of the information gets saved to GitHub.)  It then creates a new Google Sheet named "Gramble (projectName)", and pushes all the Gramble code to the project space of that sheet.  It'll tell you the link of that new sheet so just click (or ctrl-click) on that link to visit your new sheet.

If the projectName already exists, it just updates the existing directory/sheet/project space with the current Gramble code.