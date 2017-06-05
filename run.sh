#!/bin/bash

echo "Downloading Firefox 52.1.2 ESR"

curl https://ftp.mozilla.org/pub/firefox/releases/52.1.2esr/linux-x86_64/en-US/firefox-52.1.2esr.tar.bz2 > ./firefox-52.1.2esr.tar.bz2

tar -xjf ./firefox-52.1.2esr.tar.bz2

echo "Installing Selenium IDE plugin, please restart firefox and shut it down after the installation ..."
./firefox/firefox ./build/ide/main/selenium-ide.xpi &

#sleep 10
#my_child_PID=$!
#kill -9 $my_child_PID

echo "Installing Selenium IDE python-format plugin, please restart firefox after the installation ..."
./firefox/firefox ./build/ide/plugins/python-Stanislav/python-format.xpi

echo "Intallation Completed!"
