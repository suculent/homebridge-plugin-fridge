## Purpose

This is a plugin for Homebridge, that provides virtual Temperature and Humidity sensor using data from specific MQTT channel.

## Requirements

* Running MQTT server on localhost. No authentication used so far.
* GIT
* Node.js, Node Package Manager, Homebridge


## Installation

Install this as a homebridge plugin on the device where you run homebridge. You can redirect 'localhost' to a MQTT server you are using, if on other device. In my case, both are running on Raspberry PI.

    git clone https://github.com/suculent/homebridge-plugin-dht.git
    cd homebridge-plugin-dht/
    sudo npm install -g .        

Re/start your Homebridge now.


## Usage

Connect your IoT device (Arduino or ESP8266 with SHT21 sensor). Publishes by default to MQTT channel /sht/2.
If you don't know how, install MQTT.fx and try again.

Add 'Homebridge-IoT' on your iPhone as a new Homekit accessory. Temperature Sensor should appear.

### Sample Minimal Homebridge Configuration

```
 "accessories" : [
    {
      "accessory" : "TempSensor",
      "name" : "SHT21A",
      "description" : "Temperature Sensor",
      "device_identifier" : "SHT21A-12824453",
      "mqtt_broker" : "mqtt://192.168.1.21",
      "mqtt_channel" : "/sht/2/status"
    }
  ]
```
