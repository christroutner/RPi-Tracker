# RPi-Tracker

The RPi-tracker is a Node/Express.js application designed to run on the Raspberry Pi mini-computer. It uses a BU-353 USB GPS to create a simple tracking device. GPS coordinates are logged to the devices SD card. Data can be downloaded in GeoJSON, KML, or GPX format. See [the project page on RPiOVN.com](http://rpiovn.com/page/simple-tracking-device) for more details.

## Current State
This program is currently in pre-Alpha development. It's still very rough. So far the following milestones have been achieved:
* Logging in GeoJSON and KML formats has been achieved. 
* Logging happens in two formats: Line String and Point Time Stamp. The former produces a nice breadcumb trail in Google Maps, the latter incorporates a timestamp in each GPS coordinate.
* A rough UI is currently being developed
 * File Download is achieved. One file per day X 2 formats (GeoJSON, KML) X 2 GPS formats = 4 files per day
 * WiFi control for switching between AP and Client modes achieved.

The ultimate goal of the software is for the device to be configurable from a cell phone or computer over WiFi. The RPi will be able to switch between an Access Point (acting like a wifi router) and a wireless client (like a computer or cell phone). It will serve up a web page that lists the available tracking logs that can be downloaded in the various formats.

## Installation
In order to create an RPi-Tracking device, you'll need one piece of hardware in addition to the Raspberry Pi. That
piece is a [BU-353 USB GPS](http://rpiovn.com/page/rpi-tracking-device).

Installation step-by-step directions are as follows:

1. Install Raspbian and the latest updates
  1. Ensure your Raspberry Pi is running the latest version of Raspbian by following [these instructions](https://www.raspberrypi.org/learning/noobs-install/).
  2. The rest of the installation instructions assume that you are using an RPi v3.
  3. Before continuing, it's always a good idea to update your system to the latest versions of software by running the following commands to update the devices operating system. This will probably take a while. It's also a good idea to make a copy of your SD card after you're done, so that you don't have to do it again.
    * `sudo apt-get update`
    * `sudo apt-get upgrade`
    
2. Install the packages needed to run the GPS:
  * `sudo apt-get install -y gpsd gpsd-clients python-gps`
  
3. Install a more up-to-date version of node and npm on the Raspberry Pi.
  * `sudo apt-get remove nodejs`
  * `wget http://node-arm.herokuapp.com/node_latest_armhf.deb `
  * `sudo dpkg -i node_latest_armhf.deb`
  
4. Reboot the device.

5. Clone this repository
  * `git clone https://github.com/christroutner/RPi-Tracker`
  
6. Change into the `RPi-Tracker` directory.

7. Install the dependencies with this command:
  * `npm install`
  
8. Tell the system to allow node to run on port 80 with this command:
  * `sudo setcap 'cap_net_bind_service=+ep' /usr/local/bin/node`
  
9. Edit the gpsd config file by running this command:
  * `sudo nano /etc/default/gpsd`
  * Change the line `DEVICES=""` to `DEVICES="/dev/ttyUSB0"`
  * Press CTL-X to exit and answer 'y' to save the file.

10. Install the PM2 package, which will run the rpi-tracker application on bootup. Enter the `RPi-Tracker` directory and execute these commands:
  1. `sudo npm install -g pm2`
  2. `pm2 start rpi-tracker.js`
  3. `sudo env PATH=$PATH:/usr/local/bin pm2 startup systemd -u pi --hp /home/pi`
  4. `pm2 save`

11. Reboot the device and it should now run the RPi-Tracker software on boot up. Congratulations! Consider signing up for
a [Crumb Share](http://crumbshare.com) account.


# Licensing

Copyright (c) 2016 Chris Troutner and RPiOVN.com This software is covered by Attribution-NonCommercial-ShareAlike 4.0 International license: https://creativecommons.org/licenses/by-nc-sa/4.0/. In order to use this code in your own project you must meet the following conditions:

* Attribution:
  * Attribution in the form of a link to RPiOVN.com is required in the header of any source code files that make use of source code or derivities of source code from this project.

* Commercial Use:
  * Commercial use of this code is encouraged, subject to the following conditions:
  
    * Any products using code or derivitives of code from this repository must register by contacting [Chris Troutner](mailto:chris.troutner@gmail.com) or [RPiOVN.com](http://rpiovn.com). A simple written notice by email will suffice.
    
    * Any products using code or derivities of code from this repository which obtain more than $10,000 USD in annual gross sales agree to pay a royalty of 2% of those gross sales to the copyright holder. 


# Attribution
This project makes use of the following Libraries:
* Node & Express.js
* [node-gpsd](https://github.com/eelcocramer/node-gpsd) for interfacing with the GPS daemon.
