/*
 * This HAP device connects to defined or default mqtt broker/channel and creates a temperature service(s).
 */

var Service, Characteristic;

// should go from config
var default_broker_address = 'mqtt://localhost'
var default_mqtt_channel = "/sht/2"

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

    init_mqtt(this.mqttBroker, this.mqttChannel);
}

function init_mqtt(broker_address, channel) {
  console.log("Connecting to mqtt broker: " + broker_address)
  mqttClient = mqtt.connect(broker_address)

  var that = this

  mqttClient.on('connect', function () {
    console.log("MQTT connected, subscribing to: " + channel)
    mqttClient.subscribe(channel + "/status")
  })

  mqttClient.on('error', function () {
    console.log("MQTT connected, subscribing to: " + channel)
    mqttClient.subscribe(channel + "/status")
  })

  mqttClient.on('offline', function () {
    console.log("MQTT connected, subscribing to: " + channel)
    mqttClient.subscribe(channel + "/status")
  })

  mqttClient.on('message', function (topic, message) {
    console.log("message: " + message.toString())

    var pin = 0

    if (topic == channel) {            
      if (this.shortIdentifier == message.shortIdentifier) {

        this.temperature = parseFloat(message.temperature)
        this.humidity = parseFloat(message.humidity)

        this.temperatureService
        .getCharacteristic(Characteristic.CurrentTemperature)
        .setValue(this.temperature);

        this.humidityService
        .getCharacteristic(Characteristic.CurrentRelativeHumidity)
        setValue(this.humidity)

        console.log("[processing] " + mqtt_channel + " to " + message)
      }
    }

  })
}

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

    var temperatureService = new Service.TemperatureSensor(this.name, "temperature")
        temperatureService
        .getCharacteristic(Characteristic.CurrentTemperature)
        .on('get', this.getTemperature.bind(this))

    var humidityService = new Service.HumiditySensor(this.name, "humidity")
        humidityService
        .getCharacteristic(Characteristic.CurrentRelativeHumidity)
        .on('get', this.getHumidity.bind(this))

    this.humidityService = humidityService

    this.temperatureService = temperatureService

    return [temperatureService, humidityService, informationService];
}