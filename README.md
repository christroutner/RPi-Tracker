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
Installation step-by-step directions are as follows:

1. Install Raspbian and the latest updates
  a. Ensure your Raspberry Pi is running the latest version of Raspbian by following these instructions.
  b. The rest of the installation instructions assume that you are using an RPi v3.
  c. Before continuing, it's always a good idea to update your system to the latest versions of software by running the following commands to update the devices operating system. This will probably take a while. It's also a good idea to make a copy of your SD card after you're done, so that you don't have to do it again.
    i. sudo apt-get update
    ii. sudo apt-get upgrade


2. Install git with the command `sudo apt-get install git`
3. [Follow these instructions](http://weworkweplay.com/play/raspberry-pi-nodejs/) to install node on the Raspberry Pi.
4. Clone this repository with this command `git clone https://github.com/christroutner/RPi-Tracker`
5. Change into the `RPi-Tracker` directory.
6. Install the dependencies with the command `npm install`
7. Run the program with `node app.js`

I'm missing some steps there. I'll come back and refine this section once I have a pseudo-stable version.

# Licensing
Copyright (c) 2016 Chris Troutner and RPiOVN.com
This software is covered by Attribution-NonCommercial-ShareAlike 4.0 International license:
https://creativecommons.org/licenses/by-nc-sa/4.0/

## Attribution:
Attribution in the form of a link to RPiOVN.com is required in the header of any source code files that make use of source code from this project.

## Commercial Extension
As additional conditions to the Attribution-NonCommercial-ShareAlike 4.0 International license, the following conditions also apply:

1. Commercial use of the Software is encouraged. Any products using the Software which obtain more than $10,000 USD in annual gross sales agree to pay a royalty of 2% of those gross sales to the copyright holder.


# Attribution
This project makes use of the following Libraries:
* Node & Express.js
* [node-gpsd](https://github.com/eelcocramer/node-gpsd) for interfacing with the GPS daemon.
