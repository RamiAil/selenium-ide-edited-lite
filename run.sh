#!/bin/bash


echo "Updating and installing git,default-jdk,curl"
sudo apt-get update
sudo apt-get -y install git default-jdk curl

echo "Downloading Firefox 52.1.2 ESR"

curl https://ftp.mozilla.org/pub/firefox/releases/52.1.2esr/linux-x86_64/en-US/firefox-52.1.2esr.tar.bz2 > ./firefox-52.1.2esr.tar.bz2

tar -xjf ./firefox-52.1.2esr.tar.bz2

echo "Creating a new Firefox Profile named: TestRExProfile and Disabling the add-on installation signature required so we can install an open source add-on"

pwd=`pwd`
./firefox/firefox -CreateProfile "TestRExProfile `echo $pwd`/firefox/TestRExProfile"

echo 'user_pref("xpinstall.signatures.required", false);' >> ./firefox/TestRExProfile/prefs.js

echo " "
echo "Please read before continuing: Now installing Selenium IDE plugin, Firefox will run TWICE and prompt an add on installation window"
echo 'please press install and if you get a "restart now" message close Firefox and DO NOT press "restart now"'

read -p "Press enter to continue"

./firefox/firefox -P TestRExProfile ./build/ide/main/selenium-ide.xpi

echo "Installing Selenium IDE python-format plugin, please shut down firefox after the installation ..."
./firefox/firefox -P TestRExProfile ./build/ide/plugins/python-TestREx/python-format.xpi

echo "Installation Completed!"
echo "Note: for the Selenium IDE use the TestRExProfile, for normal usage you can use the default Firefox profile"