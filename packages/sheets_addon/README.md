# Deploying the Google Sheets add-on

This directory contains scripts to build and deploy a convenient Gramble IDE into Google Sheets.

First, make sure that project dependencies have been installed as per the main README. We use browserify to transpile and bundle the TypeScript into JavaScript, and we use clasp to push the results to a Google AppsScript project.

    npm install

Clasp is a lot like Git, and like Git you have to sign in.  It's a Google product so the signin is your Google account. Follow the prompts in your browser to allow clasp to access your account. (We use an npm script to locate the clasp executable if it is not found in your system `PATH`.)

    npm run clasp login

You will also need to enable the Apps Script API by visiting https://script.google.com/home/usersettings.

From Google's point of view, you'll be the "author" of this script.  (So, for example, when users are asked if they trust the author of the script, they'll be asked if they trust you@gmail.com.)

Next, choose a project name and run the `deploy` script:

    npm run deploy <projectName>

This will do a bunch of things.  First it compiles and bundles Gramble to JavaScript.

If the projectName doesn't already exist, it then creates a directory `deployments/projectName` in the Gramble root to house the project information.  (`deployments` is in our .gitignore by the way, so none of the information gets saved to GitHub.)  It then creates a new Google Sheet named "Gramble (projectName)", and pushes all the Gramble code to the project space of that sheet.  It'll tell you the link of that new sheet so just click (or ctrl-click) on that link to visit your new sheet.

If the projectName already exists, it just updates the existing directory/sheet/project space with the current Gramble code.

The first time you try to run a command from the Gramble menu in your Gramble sheet, you may need to go through a series of prompts to authorize the running of the gramble command scripts.
