# Google Sheets add-on for Gramble

## Deploying the Google Sheets add-on

This package contains scripts to build and deploy a convenient Gramble IDE into Google Sheets.

First, make sure that all dependencies have been installed as per the main README. 

    npm install

We use browserify to transpile and bundle the TypeScript into JavaScript, and we use [clasp](https://developers.google.com/apps-script/guides/clasp) to push the results to a Google AppsScript project.

Clasp is a lot like Git, and has some of the same basic commands (e.g., "push", "clone").  What it does is sync files between a directory on your local computer and a special Google AppsScript project directory on Google's servers.  Each Google Sheet has a unique project directory behind-the-scenes, where advanced users can program special macros and adapt the behavior of the interface.  The Gramble add-on uses that to embed a Google interpreter into the Sheets interface, so you can interact with your grammar right in the browser.

Like Git you have to sign in.  It's a Google product so the signin is your Google account. Follow the prompts in your browser to allow clasp to access your account. (We use an npm script to locate the clasp executable if it is not found in your system `PATH`.)

    npm run clasp login

You will also need to enable the Apps Script API by visiting https://script.google.com/home/usersettings.

From Google's point of view, you'll be the "author" of this script.  (So, for example, when users are asked if they trust the author of the script, they'll be asked if they trust you@gmail.com.)

Next, run the `deploy` script:

    npm run deploy <project-path>

Project path is a path on your machine where the project metadata will be stored (mostly, Google-specific hashes identifying the sheet and the script).  We suggest storing deployment metadata in a separate, private git repo; for example our own is named `gramble_deploy` and is a sister of this repo on my machine, so (assuming our present working directory is the main gramble directory) we run this command as:

    npm run deploy ../gramble_deploy/ProjectName

If the ProjectName folder doesn't already exist there, it will create that directory, then create a new Google Sheet named "Gramble (ProjectName)", and then compile and push all the Gramble code to the project space of that sheet.  It'll tell you the link of that new sheet so just click (or ctrl-click) on that link to visit your new sheet.

If the ProjectName already exists, it just updates the existing directory/sheet/project space with the current Gramble code.

The first time you try to run a command from the Gramble menu in your Gramble sheet, you may need to go through a series of prompts to authorize the running of the gramble command scripts.  If it asks "Manifest file has been updated. Do you want to push and overwrite?", say "y".

Deploying Gramble to a pre-existing Google Sheet.
----------------

You may want to add Gramble features to a Google Sheets workbook that you've already started, or you want to make a copy of an existing workbook (for example, to make a separate version of a project, or make a scratch space to test a new feature).  

When you start a new Google Sheets workbook, then obviously it doesn't have a Gramble features yet, and you'll need to deploy Gramble to it.  When you make a *copy* a workbook with Gramble in it (i.e., go to the File menu and choose "Make a copy"), the new sheet actually does get a copy of Gramble automatically.  However, this is a new copy of the Gramble code, and if you re-deploy to your original project (in order to update the Gramble code), this new copy will NOT be updated.  There's a one-to-one relationship between Google Sheets workbooks and Google Apps Script project spaces.

In either case, clasp doesn't yet know about this new project; it's not yet associated with any directory or metadata on your own computer.  So we'll have to use the `clasp clone` functionality to associate a new local directory with the project on Google's servers, before deployment.

First, you need the script-id of the new sheet's project.  In the Google Sheets interface, go to Extensions -> Apps Script.  This will open a new tab, letting you see the Apps Script project behind-the-scenes of your sheet.  Go to Project Settings (it's the gear icon on the left of the page), scroll down to the script-id, and copy it.

Next, go to the command line, and make a new directory where you want to house the metadata for this project.  Cd to this directory and execute `clasp clone <script-id>`.  This will clone the project from Google's project space into your directory, and also set up the metadata correctly.

Now you can go back to your Gramble source code directory and run `npm run deploy <path-to-project-dir>`, just like you did in the previous section. 

Tutorials and documentation
---------------

Gramble tutorials and language documentation can be found [here](https://nrc-cnrc.github.io/gramble/).
 
Copyright
---------

All files in this package are **Copyright © 2020-2024 National Research Council Canada.**

License
-------

All files in this package are released under the MIT licence. See the [LICENSE](LICENSE) file for details.

Privacy
-------

See the [PRIVACY](PRIVACY) file for details.
