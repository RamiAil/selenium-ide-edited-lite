This is the source code for a Selenium IDE edited plugin plus a python formatter to "record" user actions (e.g., opening URLs,
clicking buttons, interacting with web forms...), and to translate them into a Selenium script (in python) that works with TestREx Selenium Wrapper.

This IDE Can support:

* Working with plain HTML
* Handles iFrames
* Records assertions
* Records assertions from JavaScript
* Has automatic installer

The Automatic installing scripts are "run.sh" and "run2.sh" and can be found in this repository.
After cloning this repository just run the "run.sh" or "run2.sh" and you should get:

1- Mozilla Firefox ESR version 52.1.2 is downloaded and unzipped in the working director.  
2- The Selenium IDE add-on is installed in Firefox.  
3- The "TestREx Formatter" is installed as a plugin in the Selenium IDE add-on.

The difference between run.sh and run2.sh is if there's an already installed Firefox on your machine:

* run.sh will install a new Firefox with a new TestREx Firefox profile (about Firefox profiles: https://support.mozilla.org/en-US/kb/profiles-where-firefox-stores-user-data) without uninstalling the original Firefox.
* run2.sh will uninstall your original Firefox and install a new one with the IDE add-on

The Selenium IDE source code can be found here: "/ide/main/".   
When compiled it will build a Selenium IDE add-on installation/execution file which is called "selenium-ide.xpi" and can be found in "/build/ide/main/".

If in the future you want to update/change the IDE source code and compile a new "selenium-ide.xpi", you should run this compilation command from the main directory:
./go //ide/main:selenium-ide

The Selenium IDE TestREx formatter source code can be found here: "/ide/plugins/python-TestREx/src/content/formats/python-TestREx.js".   
When compiled it will build a Selenium IDE formatter add-on installation/execution file which is called "python-format.xpi and can be found in "build/ide/plugins/python-TestREx".

If in the future you want to update/change the TestREx formatter source code and compile a new "python-format.xpi", you should run this compilation command from the main directory:
./go //ide/plugins/python-TestREx:python-format

IF you like to install more formatters other than the Selenium TestREx formatter you can find them here:

* PHP Formatters: https://addons.mozilla.org/en-US/firefox/addon/selenium-ide-php-formatters/
* VBA/VBS Formatters: https://addons.mozilla.org/en-US/firefox/addon/selenium-ide-vbavbs-formatt/
* Java/C# Formatters: https://addons.mozilla.org/en-US/firefox/addon/webdriver-backed-formatters/
* For more formatters: please got to: http://www.seleniumhq.org/download/
and search for: "Selenium IDE Plugins (that provide import / export / language support)"

You can install them as add-ons after installing the Selenium IDE.

Note: When compiling the source code inside the git directory, I had a strange error ('sh': Command failed with status (127): [sh .git-fixfiles...] (RuntimeError)).  
If you encounter the same error, try copying all the files inside the git directory to a new directory and try to compile them there.

For information about working with the edited Selenium IDE, please read the HOWTO.txt file.  
For information about changes done to the code, please read the Code Changes.txt file.