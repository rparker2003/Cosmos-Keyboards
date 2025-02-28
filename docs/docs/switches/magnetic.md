# Magnetic (NIZ) Switches

Unlike mechanical switches that detect keypresses when small metal parts come into contact, magnetic switches trigger when a magnet inside the switch comes in close proximity to a sensor sitting underneath.

Some of the advantages of this design are:

- Longer-ish lifespan (However, mechanical switches last forever. Unless you expect to write more than 500 words per day every day for 50 years, you don't need to care about this)
- Tuneable actuation point (You'll need to spend money on hardware for this though)
- More types of switches! These switches will feel different than MX switches, and whether you prefer them is personal preference.

## NIZ Switches

![Parts of a Niz Switch](../../assets/niz-exploded.png)

These switches use a hall effect sensor attached to the socket and a magnet attached to the rubber dome to detect key presses. They are along the lines of [Topre switches](https://deskthority.net/wiki/Topre_switch). These do not have a physical switch. These switches are classified as tactile (depending on the rubber dome used) and are pretty quiet. The rubber dome helps dampen the bottoming out of the keypress as well.

Traditionally, these switches have been used with capacitive switches, but this article does not cover using capacitive sensors.

!!! warning "Wiring Warning"

    Only direct pin wiring works so far. It did not work for me in a traditional matrix (columns and rows) setup. You will have to make sure you have enough GPIOs for direct wiring.

    QMK: You can't [mix and match direct pin and matrix wiring](https://docs.qmk.fm/porting_your_keyboard_to_qmk#direct-pin-matrix). Not sure about other firmware.

    If you find a way to get matrix wiring to work, please share how you did it on the Cosmos Discord.

### Tested Combinations

- [Beekeeb NIZ Switch](https://shop.beekeeb.com/product/niz-ec-switch/) is where the items were purchased for modeling these switches. You may or may not have luck with components from elsewhere.
- [AH3572 Hall Effect Switch](https://www.mouser.com/ProductDetail/Diodes-Incorporated/AH3572-P-B?qs=qSfuJ%252Bfl/d5Je7Vb/Cw%252B6g%3D%3D)
- [2mm x 1mm Disc Magnets](https://www.amazon.com/JUNAN-Neodymium-Magnet-Earth-Magnets/dp/B09V14FGQF)

### Hall Effect Sensors

Hall effect sensors detect magnetic fields. So to detect keypresses, we pair a small magnet with a hall effect sensor.

There are many varieties of hall effect sensors, but they fall into two main categories: binary/switch/ output (on/off) and analog (integer value).

The sensors have 3 legs: Vcc (power), Gnd (ground), and output (high/low or analog)

#### Switch Style Sensors

Switch style sensors are going to be easier to implement with keyboard software since the output is just like any other switch, high or low. You may try other switches if you want a different travel before activation to suit your preferences.

#### Analog Style Sensors

Analog style sensors are a bit more complicated since you need to use an ADC (Analog to Digital Converter) to read the sensor value. Then you will have to interpret key activations and releases based on the readings. This does allow you to potentially tune the switches to your liking, but make sure you know how to accomplish this with your keyboard firmware (e.g. QMK) and that you have enough ADC inputs to support your needs.

### Assembly

1. Wire the hall effect sensors ([AH3572 Datasheet](https://www.mouser.com/datasheet/2/115/DIOD_S_A0006646941_1-2542859.pdf)).
1. Attach the hall effect sensor to the case. Hotglue works well.
1. (Optional) If you have a spring, put the spring into the socket.
1. Attach the magnet to the rubber dome.
1. Put the rubber dome with magnet into the socket.
1. Put the stem on the rubber dome.
1. Press the housing into the socket. It may be a tight fit.
