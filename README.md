## Requirements

Running MQTT server on localhost. No authentication used so far.

## Installation

    git clone https://github.com/suculent/homebridge-plugin-fridge.git
    cd homebridge-plugin-fridge/
    sudo npm install -g .

Restart your Homebridge now.

    homebridge

    Expected output:
    
    [11/18/2016, 6:43:58 PM] Loaded plugin: homebridge-fridge
    homebridge API version: 2.1
    Registering homebridge-fridge accessory FridgeSensory
    [11/18/2016, 6:43:58 PM] Registering accessory 'homebridge-fridge.FridgeSensor'
    [11/18/2016, 6:43:58 PM] ---
    [11/18/2016, 6:43:58 PM] Loaded config.json with 1 accessories and 0 platforms.
    [11/18/2016, 6:43:58 PM] ---
    [11/18/2016, 6:43:58 PM] Loading 1 accessories...
    [11/18/2016, 6:43:58 PM] [FridgeSensor] Initializing FridgeSensor accessory...
    searching contact for pin named Fridge: Sensor A
    Initializing mqtt://localhost MQTT broker with base channel /fridge
    MQTT connecting to: mqtt://localhost
    Scan this code with your HomeKit App on your iOS device to pair with Homebridge:
                           
        ┌────────────┐     
        │ 123-45-678 │     
        └────────────┘     
                           
    [11/18/2016, 6:43:58 PM] Homebridge is running on port 51826.
    MQTT connected, subscribing to: /fridge
    

## Usage

Publish to MQTT channels /fridge/open and /fridge/closed now.
If you don't know how, install MQTT.fx and try again.

Add 'Homebridge-IoT' on your iPhone as a new Homekit accessory. Fridge Sensor should appear.
