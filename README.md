# RPi-Tracker

The RPi-tracker is a Node/Express.js application designed to run on the Raspberry Pi mini-computer. It uses a BU-353 USB GPS to create a simple tracking device. GPS coordinates are logged to the devices SD card. Data can be downloaded in GeoJSON, KML, or GPX format. See [the project page on RPiOVN.com](http://rpiovn.com/page/simple-tracking-device) for more details.

## Current State
This program is currently in pre-Alpha development. It's very rough. So far logging in GeoJSON and KML formats has been achieved. The next step is to get GPX format. After that I'll start working on the UI.

The ultimate goal of the software is for the device to be configurable from a cell phone or computer over WiFi. The RPi will be able to switch between an Access Point (acting like a wifi router) and a wireless client (like a computer or cell phone). It will serve up a web page that lists the available tracking logs that can be downloaded in the various formats.

## Installation
Installation instructions are still being created, but consist of the following general steps:

1. Connect your RPi to the internet and bring up a command line.
2. Install git with the command `sudo apt-get install git`
3. [Follow these instructions](http://weworkweplay.com/play/raspberry-pi-nodejs/) to install node on the Raspberry Pi.
4. Clone this repository with this command `git clone https://github.com/christroutner/RPi-Tracker`
5. Change into the `RPi-Tracker` directory.
6. Install the dependencies with the command `npm install`
7. Run the program with `node app.js`

I'm missing some steps there. I'll come back and refine this section once I have a pseudo-stable version.

# Licensing
This software is covered by a modified MIT license.

## The MIT License (MIT)
Copyright (c) 2016 Chris Troutner and RPiOVN.com

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Additional Conditions
As additional conditions to the standard MIT license above, the following conditions also apply:

Commercial use of the Software is encouraged. Any products using the Software which obtain more than $10,000 USD in annual gross sales agree to pay a royalty of 2% of those gross sales to the copyright holder. 

# Attribution
This project makes use of the following Libraries:
* Node & Express.js
* [node-gpsd](https://github.com/eelcocramer/node-gpsd) for interfacing with the GPS daemon.
