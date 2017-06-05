This is the source code for a Selenium IDE edited plugin plus a python formatter to "record" user actions (e.g., opening URLs,
clicking buttons, interacting with web forms...), and to translate them into a Selenium script (in python) that works with Stanislav Dashevskyi Selenium Wrapper.


This IDE Can support:

* Working with plain HTML
* Handles iFrames
* Records assertions
* Handles JavaScript (simple)
* Records assertions from JavaScript
* Has automatic installer

The Automatic installing script is "run.sh" and can be found in this repository.
After cloning this repository just run the "run.sh" and you should get:
1- Mozilla Firefox ESR version 52.1.2 is downloaded and unzipped in the working directory
2- The Selenium IDE add-on is installed in Firefox
3- The "Stanislav Formatter" is installed as a plugin in the Selenium IDE add-on

add some details about ".xpi" files

Working with the plugin is exactly like working with the original Selenium IDE (can be found here: http://www.seleniumhq.org/docs/02_selenium_ide.jsp).

Whenever you need to export a Selenium python script, just go to "File -> Export Test Case As ... -> python-Stanislav"




