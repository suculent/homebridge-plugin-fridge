/*
 * This HAP device connects to defined or default mqtt broker/channel and creates a temperature service(s).
 */


var Service, Characteristic;

// should go from config
var default_broker_address = 'mqtt://localhost'
var default_mqtt_channel = "/sht/2"

'use strict';

var querystring = require('querystring');
var http = require('http');
var mqtt = require('mqtt')

var mqttClient = null; // will be non-null if working

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-dht", "TempSensor", TempSensor);
}

function TempSensor(log, config) {
  this.log = log;

  this.name = config['name'] || "DHT Sensor";
  this.mqttBroker = config['mqtt_broker'];
  this.mqttChannel = config['mqtt_channel'];
  this.shortIdentifier = config['device_identifier'];   
  this.temperature = 0;
  this.humidity = 0; 
  
  this.temperatureService = new Service.TemperatureSensor(this.name, "temperature")
  this.temperatureService
    .getCharacteristic(Characteristic.CurrentTemperature)
    .on('get', this.getTemperature.bind(this))

  this.humidityService = new Service.HumiditySensor(this.name, "humidity")
  this.humidityService
    .getCharacteristic(Characteristic.CurrentRelativeHumidity)
    .on('get', this.getHumidity.bind(this))

  var that = this

  this.getServices();

  if (!this.mqttBroker) {
      this.log.warn('Config is missing mqtt_broker, fallback to default.');        
      this.mqttBroker = default_broker_address;
      if (!this.mqttBroker.contains("mqtt://")) {
          this.mqttBroker = "mqtt://" + this.mqttBroker;
      }
  }

  if (!this.mqttChannel) {
      this.log.warn('Config is missing mqtt_channel, fallback to default.');
      this.mqttChannel = default_mqtt_channel;        
  }

  init_mqtt(this.mqttBroker, this.mqttChannel, this.temperatureService, this.humidityService);

  /* Sends a JSON message to Elasticsearch database */
  function elk(json_message)
  {
    var http = require('http');

    var options = {
      host: 'mini.local',
      port: '9200',
      path: '/telemetry-1/status',
      method: 'POST'
    };

    function callback(response) {
      var str = ''
      response.on('data', function (chunk) {
        str += chunk;
      });

      response.on('end', function () {
        console.log(str);
      });
    };

    var elk = http.request(options, callback);
    var data = JSON.stringify(json_message)
    elk.write(data);
    elk.end();
  }

  function init_mqtt(broker_address, channel, ts, hs) {
    that.log("Connecting to mqtt broker: " + broker_address + " channel: "+channel)
    mqttClient = mqtt.connect(broker_address)

    //var that = this

    mqttClient.on('connect', function () {
      that.log("MQTT connected, subscribing to: " + channel)
      mqttClient.subscribe(channel)
    })

    mqttClient.on('error', function () {
      that.log("MQTT connected, subscribing to: " + channel)
      mqttClient.subscribe(channel)
    })

    mqttClient.on('offline', function () {
      that.log("MQTT connected, subscribing to: " + channel)
      mqttClient.subscribe(channel)
    })  

    mqttClient.on('message', function (topic, message) {
      that.log("message: " + message.toString())
      
      if (topic == channel) {

        if (this.shortIdentifier == message.shortIdentifier) {

          var m = JSON.parse(message)

          var t = m.temperature;
          var h = m.humidity;

          that.temperature = t;
          this.temperature = t;

          that.humidity = h;
          this.humidity = h;

          ts
          .getCharacteristic(Characteristic.CurrentTemperature)
          .setValue(this.temperature);

          hs
          .getCharacteristic(Characteristic.CurrentRelativeHumidity)
          .setValue(this.humidity)

          console.log("[processing] " + channel + " to " + message)

          elk(message)
        } 
      }

    })
  }

} // end class

TempSensor.prototype.getTemperature = function(callback) {
    this.log('getTemperature callback(null, '+this.temperature+')');
    callback(null, this.temperature);    
}

TempSensor.prototype.getHumidity = function(callback) {
    this.log('getHumidity callback(null, '+this.humidity+')');
    callback(null, this.humidity);
}

TempSensor.prototype.getServices = function() {

    var informationService = new Service.AccessoryInformation();

    informationService
      .setCharacteristic(Characteristic.Manufacturer, "Page 42")
      .setCharacteristic(Characteristic.Model, "Temperature Sensor")
      .setCharacteristic(Characteristic.SerialNumber, "3");

    return [this.temperatureService, this.humidityService, informationService];
}

process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err);
});