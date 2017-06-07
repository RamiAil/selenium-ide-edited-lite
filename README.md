This is the source code for a Selenium IDE edited plugin plus a python formatter to "record" user actions (e.g., opening URLs,
clicking buttons, interacting with web forms...), and to translate them into a Selenium script (in python) that works with TestREx Selenium Wrapper.

This IDE Can support:

* Working with plain HTML
* Handles iFrames
* Records assertions
* Handles JavaScript (simple)
* Records assertions from JavaScript
* Has automatic installer

The Automatic installing scripts are "run.sh" and "run2.sh" and can be found in this repository.
After cloning this repository just run the "run.sh"/"run2.sh" and you should get:
1- Mozilla Firefox ESR version 52.1.2 is downloaded and unzipped in the working directory
2- The Selenium IDE add-on is installed in Firefox
3- The "TestREx Formatter" is installed as a plugin in the Selenium IDE add-on

The difference between run.sh and run2.sh is if there's an already installed Firefox on your machine:

* run.sh will install a new one with a new TestREx Firefox profile (about Firefox profiles: https://support.mozilla.org/en-US/kb/profiles-where-firefox-stores-user-data) without uninstalling the original Firefox.
* run2.sh will uninstall your old Firefox and install a new one with the IDE add-on


The Selenium IDE add-on installation/Execution file is called "selenium-ide.xpi" and is found in "/build/ide/main/", this add-on is compiled from the source
found in "Selenium IDE Edited Lite/ide/main/". If in the future you want to update/change the code and compile a new "selenium-ide.xpi",
you should run this compilation command from the main directory:
./go //ide/main:selenium-ide

The Selenium IDE python formatter installation/Execution file is called "python-format.xpi" and is found in "Selenium IDE Edited Lite/build/ide/plugins/python-TestREx/", this formatter is compiled from the source found in " Selenium IDE Edited Lite/ide/plugins/python-TestREx/src/content/formats/python-TestREx.js".
If in the future you want to update/change the code and compile a new "python-format.xpi",
you should run this compilation command from the main directory:
./go //ide/plugins/python-TestREx:python-format
The main updates and changes I've done were in this file, so for any change/update I think that the best thing is to start here.

Note: I had a strange error ('sh': Command failed with status (127): [sh .git-fixfiles...] (RuntimeError)) while compiling inside the git directory, if you encounter the same error, try copying all the files inside the git directory to a new directory and try to compile there.

For Information about working with the edited Selenium IDE, please read the HOWTO.txt file.