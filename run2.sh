#!/bin/bash


echo "Updating and installing git,default-jdk,curl"
#sudo apt-get update
sudo apt-get -y install git default-jdk curl

echo "Deleting the existing Firefox"

sudo apt-get remove -y --purge firefox

sudo rm -rf ~/.mozilla/

sudo rm -rf /etc/firefox/

sudo rm -rf /usr/lib/firefox/

sudo rm -rf /usr/lib/firefox-addons/

sudo rm -rf /usr/bin/firefox

echo "Downloading Firefox 52.1.2 ESR"

curl https://ftp.mozilla.org/pub/firefox/releases/52.1.2esr/linux-x86_64/en-US/firefox-52.1.2esr.tar.bz2 > ./firefox-52.1.2esr.tar.bz2

tar -xjf ./firefox-52.1.2esr.tar.bz2

pwd=`pwd`
sudo ln -s `echo $pwd`/firefox/firefox /usr/bin/firefox

echo " "
echo "Please read before continuing: Now installing Selenium IDE plugin, Firefox will run for the first time to load all the configurations for 10 seconds, then it will be killed to overwrite these configurations. After that firefox will run TWICE and prompt an add on installation window"
echo 'please press install and if you get a "restart now" message close Firefox and DO NOT press "restart now"'

read -p "Press enter to continue"


firefox &
sleep 10
killall firefox

echo "Disabling the add-on installation signature required so we can install an open source add-on"
echo 'user_pref("xpinstall.signatures.required", false);' >> ~/.mozilla/firefox/*.default/prefs.js



./firefox/firefox ./build/ide/main/selenium-ide.xpi

echo "Installing Selenium IDE python-format plugin, please shut down firefox after the installation ..."
./firefox/firefox ./build/ide/plugins/python-TestREx/python-format.xpi

echo "Installation Completed!"
