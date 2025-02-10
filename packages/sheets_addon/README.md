# Google Sheets add-on for Gramble

## Deploying the Google Sheets add-on

This package contains scripts to build and deploy a convenient Gramble IDE into Google Sheets.

First, make sure that all dependencies have been installed as per the main README. We use browserify to transpile and bundle the TypeScript into JavaScript, and we use clasp to push the results to a Google AppsScript project.

    npm install

Clasp is a lot like Git, and like Git you have to sign in.  It's a Google product so the signin is your Google account. Follow the prompts in your browser to allow clasp to access your account. (We use an npm script to locate the clasp executable if it is not found in your system `PATH`.)

    npm run clasp login

You will also need to enable the Apps Script API by visiting https://script.google.com/home/usersettings.

From Google's point of view, you'll be the "author" of this script.  (So, for example, when users are asked if they trust the author of the script, they'll be asked if they trust you@gmail.com.)

Next, run the `deploy` script:

    npm run deploy <project-path>

Project path is a path on your machine where the project metadata will be stored (mostly, Google-specific hashes identifying the sheet and the script).  We suggest storing deployment metadata in a separate, private git repo; for example our own is named `gramble_deploy` and is a sister of this repo on my machine, so we run this command as:

    npm run deploy ../../../gramble_deploy/ProjectName

If the ProjectName folder doesn't already exist there, it will create that directory, then create a new Google Sheet named "Gramble (ProjectName)", and then compile and push all the Gramble code to the project space of that sheet.  It'll tell you the link of that new sheet so just click (or ctrl-click) on that link to visit your new sheet.

If the ProjectName already exists, it just updates the existing directory/sheet/project space with the current Gramble code.

The first time you try to run a command from the Gramble menu in your Gramble sheet, you may need to go through a series of prompts to authorize the running of the gramble command scripts.  If it asks "Manifest file has been updated. Do you want to push and overwrite?", say "y".

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
