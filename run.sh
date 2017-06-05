#!/bin/bash

echo "Downloading Firefox 52.1.2 ESR"

curl https://ftp.mozilla.org/pub/firefox/releases/52.1.2esr/linux-x86_64/en-US/firefox-52.1.2esr.tar.bz2 > ./firefox-52.1.2esr.tar.bz2

tar -xjf ./firefox-52.1.2esr.tar.bz2

echo "Disabling the add-on installation signiture required so we can install an open source add-on"

echo 'pref("xpinstall.signatures.required", "false");' >> ./firefox/defaults/pref/channel-prefs.js

echo " "
echo "Please read before continuing: Now installing Selenium IDE plugin, firefox will run TWICE and prompt an add on installation window"
echo 'please press install and if you get a "restart now" message close firefox and DO NOT press "restart now"'

read -p "Press enter to continue"

./firefox/firefox ./build/ide/main/selenium-ide.xpi &

#sleep 10
#my_child_PID=$!
#kill -9 $my_child_PID

echo "Installing Selenium IDE python-format plugin, please shut down firefox after the installation ..."
./firefox/firefox ./build/ide/plugins/python-Stanislav/python-format.xpi

#echo "Intallation Completed!"
