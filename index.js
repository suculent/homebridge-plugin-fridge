// homebridge-fridge-sensor

// npm install mqtt --save
// npm install mdns --save
// npm install querystring --save

'use strict';

var querystring = require('querystring');
var http = require('http');

// CONFIGURATION

var broker_address = 'mqtt://localhost'
var mqtt_channel = "/fridge"

// MDNS

var mdns = require('mdns')
var mqtt = require('mqtt')
var mqttClient

const path = require('path');

let Service, Characteristic;

module.exports = (homebridge) => {
  console.log("homebridge API version: " + homebridge.version);
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  console.log('Registering homebridge-fridge accessory FridgeSensory')
  homebridge.registerAccessory('homebridge-fridge', 'FridgeSensor', FridgeSensorPlugin);
};

class FridgeSensorPlugin
{
  constructor(log, config) {
    
    this.log = log;
    this.name = config.name;
    this.state = false; // sensor state, will be updated by mqtt
    
    this.pins = config.pins || {
      "Fridge: Sensor A": 0
    };

    this.pin2contact = {};
    this.contacts = [];

    for (let name of Object.keys(this.pins)) {
      console.log('searching contact for pin named ' + name)
      const pin = this.pins[name];      
      const subtype = name; 
      const contact = new Service.ContactSensor(name, subtype);

      contact
      .getCharacteristic(Characteristic.ContactSensorState)
      .setValue(this.state);

      this.pin2contact[pin] = contact;
      this.contacts.push(contact);
    }

    console.log("Initializing " + broker_address + " MQTT broker with base channel " + mqtt_channel)
    this.init_mqtt(broker_address, mqtt_channel)
  }

  init_mqtt(broker_address, channel) {   
    console.log("MQTT connecting to: " + broker_address)
    mqttClient = mqtt.connect(broker_address)

    var that = this

    mqttClient.on('connect', function () {
      console.log("MQTT connected, subscribing to: " + channel)
      mqttClient.subscribe(channel + "/open")
      mqttClient.subscribe(channel + "/closed")

      // This is violation of standard. Exact following string is skipped by the client instead of parsing as JSON.
      mqttClient.publish(channel, 'MQTT->Homebridge Gateway Started...')
    })

    mqttClient.on('message', function (topic, message) {
      console.log("message: " + message.toString())

      var pin = 0

      if (topic == (mqtt_channel + "/open")) {
        this.state = true;
        const contact = that.pin2contact[pin];
        if (!contact) throw new Error(`received pin event for unconfigured pin: ${pin}`);
        contact
        .getCharacteristic(Characteristic.ContactSensorState)
        .setValue(this.state);

        console.log("[processing] " + mqtt_channel + " is open.")
      }

      if (topic == (mqtt_channel + "/closed")) {
        this.state = false;
        const contact = that.pin2contact[pin];
        if (!contact) throw new Error(`received pin event for unconfigured pin: ${pin}`);
        contact
        .getCharacteristic(Characteristic.ContactSensorState)
        .setValue(this.state);
        console.log("[processing] " + mqtt_channel + " is closed.")
      }
    })
  }

  getServices() {
    return this.contacts;
  }
}