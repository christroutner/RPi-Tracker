This directory contains files for turning on the pull up resistor for GPIO pin 21.
This allows a jumper to be placed between this pin and ground in order to signal
to the device at bootup that it should force the device into factory-default
access point (AP) mode.

To enable this feature, do the following:

1. Copy the file `rpi-tracker.dtb` to the `/boot/overlays` directory

2. Add this line to the file `/boot/config.txt`:
`device_tree_overlay=overlays/rpi-tracker.dtb`

3. To test the GPIO, run the file readGPIO21.js with node. It will read the pin and display its value on the console. You can toggle the pin state by jumpering GPIO21 to the ground pin (right next to it).

4. Open the server_settings.json file. Set the field `internalPullupConfigured` to true.

The RPi will now boot into AP mode when the jumper connects GPIO pin 21 to ground.
