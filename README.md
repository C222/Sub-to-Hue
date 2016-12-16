![Sub-to-Hue](http://i.imgur.com/poM3YYk.png "Sub-to-Hue")

Sub-to-Hue is a simple Javascript app that allows Twitch streamers to have their Philips Hue lights change colors upon subscriptions and allows moderators to change the color via a command.

The app can be downloaded to a local folder and run by double-clicking `index.html`.

## Interface
![UI] (http://i.imgur.com/HB6iwwv.png)

### Channel Connection
Insert the channel name that you want to connect the app to.

Connect / Disconnect buttons work as expected.

### Hue Connection
Insert the IP address of the Hue Bridge.

If on a local network and properly setup, the IP can be found [here](https://www.meethue.com/api/nupnp).

Pressing "Hue Connect" may propt you to press the button on the bridge. Do so, then click the "Hue Connect" button again.

Some colors appear dimmer than others. The "Min Brigtness" slider will artificailly boost all colors brightnesses. I recommend leaving this at 0%.

### Subscribtion Blink
This section is where blinking on subscriptions is enabled, length of the blink is set, and color of the blink from a predefined list is chosen.

### Moderator Command
This section is where the moderator command is enabled along with what the command text exactly is.

The color name reference is a page with all color names that can be used in a command

A command for the color red can be formatted like:
```
!color red
!color #F00
!color #FF0000
!color rgb(255, 0, 0)
```
