This directory contains files for turning on the pull up resistor for GPIO pin 21.
This allows a jumper to be placed between this pin and ground in order to signal
to the device at bootup that it should force the device into factory-default
access point (AP) mode.

To enable this feature, do the following:

1. Copy the file `rpi-tracker.dtb` to the `/boot/overlays` directory

2. Add this line to the file `/boot/config.txt`:
`device_tree_overlay=overlays/rpi-tracker.dtb`

