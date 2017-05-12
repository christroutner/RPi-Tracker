# RPi-Tracker

The RPi-tracker is a Node/Express.js application designed to run on the Raspberry Pi mini-computer. 
It uses a BU-353 USB GPS to create a simple tracking device. GPS coordinates are logged to the devices 
SD card. Data can be downloaded in GeoJSON, KML, or GPX format. The device can also sync with 
[CrumbShare](http://crumbshare.net) for easy embedding into a blog or sharing via social media.
See [the project page on RPiOVN.org](http://rpiovn.org/project/rpi-tracker) for more details.

Additional documentation can be found in [this repositories Wiki](https://github.com/christroutner/RPi-Tracker/wiki).

## Current State
This program is currently in Beta release. The code base has been fairly stable for a few months and the installation
instructions below should be dependable. Developers who want to try the software are welcome to sign up for
a free account on [CrumbShare](http://crumbshare.net). 

So far the following milestones have been achieved:
* Logging in GeoJSON and KML formats has been achieved. 
* Logging happens in two formats: Line String and Point Time Stamp. The former produces a nice breadcumb trail in Google Maps, the latter incorporates a timestamp in each GPS coordinate.
* Device user interface (UI) can be achieved by bringing up the devices IP in a web browser.
* Log files can be downloaded through the web based UI. One file per day X 2 formats (GeoJSON, KML) X 2 GPS formats = 4 files per day
* WiFi control for switching between AP and Client accomplished through the web based UI.

The RPi-Tracker is configurable from a cell phone or computer over WiFi. Using the web-based user interface (UI), 
the RPi can switch between an Access Point (acting like a wifi router) and a wireless client 
(like a computer or cell phone). It will serve up a web page that lists the available tracking logs 
that can be downloaded in the various formats.

## Installation
In order to create an RPi-Tracking device, you'll need one piece of hardware in addition to the Raspberry Pi. That
piece is a [BU-353 USB GPS](http://rpiovn.org/project/rpi-tracker).

Installation step-by-step directions are as follows:

1. Install Raspbian and the latest updates:
  * Ensure your Raspberry Pi is running the latest version of Raspbian by following [these instructions](https://www.raspberrypi.org/learning/noobs-install/).  
  * The rest of the installation instructions assume that you are using an RPi v3.
  * Before continuing, it's always a good idea to update your system to the latest versions of software by running the following commands to update the devices operating system. This will probably take a while. It's also a good idea to make a copy of your SD card after you're done, so that you don't have to do it again.
    * `sudo apt-get update`
    * `sudo apt-get upgrade`
    
2. Install the packages needed to run the GPS:
  * `sudo apt-get install -y gpsd gpsd-clients python-gps`
  
3. Install a more up-to-date version of node and npm on the Raspberry Pi.
  * `sudo apt-get remove nodejs`
  * `curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash - `
  * `sudo apt-get install -y nodejs`

4. Create a symbolic link to replace the old version of node:
  * `sudo ln -s /usr/bin/nodejs /usr/local/bin/node`

5. Although not necessary to run the RPi-Tracker, it's a good idea to install node-inspector in case 
you need to do any debugging down the road:
  * `sudo npm install -g node-inspector --unsafe-perm`

6. Reboot the device.

7. Clone this repository
  * `git clone https://github.com/christroutner/RPi-Tracker`
  
8. Change into the `RPi-Tracker` directory. To save typing, it might help to rename the directory to `rpi-tracker`.

9. Install the dependencies with this command:
  * `npm install`
  
10. Tell the system to allow node to run on port 80 with this command:
  * `sudo setcap 'cap_net_bind_service=+ep' /usr/bin/nodejs`
  
11. Edit the gpsd config file by running this command:
  * `sudo nano /etc/default/gpsd`
  * Change the line `DEVICES=""` to `DEVICES="/dev/ttyUSB0"`
  * Press CTL-X to exit and answer 'y' to save the file.

12. Install the PM2 package, which will run the rpi-tracker application on bootup. Enter the `RPi-Tracker` directory and execute these commands:
  * `sudo npm install -g pm2`
  * `pm2 start rpi-tracker.js`
  * `sudo env PATH=$PATH:/usr/local/bin pm2 startup systemd -u pi --hp /home/pi`
  * `pm2 save`

13. Reboot the device and it should now run the RPi-Tracker software on boot up. Run the 
command `ifconfig` to retrieve the devices IP address. Put that IP in your web browser 
and you should see the RPi-Tracker User Interface (UI). Congratulations! 

You device is fully functional as a stand-alone tracking device, but you'll be able to easily
share your breadcrumb trails on the web if you sign up for
a [Crumb Share](http://crumbshare.net) account.


# Licensing

Copyright (c) 2017 Chris Troutner and RPiOVN.org This software is covered by Attribution-NonCommercial-ShareAlike 4.0 International license: https://creativecommons.org/licenses/by-nc-sa/4.0/. In order to use this code in your own project you must meet the following conditions:

* Attribution:
  * Attribution in the form of a link to RPiOVN.org is required in the header of any source code files that make use of source code or derivatives of source code from this project.

* Commercial Use:
  * Commercial use of this code is encouraged, subject to the following conditions:
  
    * Any products using code or derivatives of code from this repository must register by contacting [Chris Troutner](mailto:chris.troutner@gmail.com) or [RPiOVN.org](http://rpiovn.org). A simple written notice by email will suffice.
    
    * Any products using code or derivativesof code from this repository which obtain more than $10,000 USD in annual gross sales agree to pay a royalty of 2% of those gross sales to the copyright holder. 


# Attribution
This project makes use of the following Libraries:
* Node & Express.js
* [node-gpsd](https://github.com/eelcocramer/node-gpsd) for interfacing with the GPS daemon.
