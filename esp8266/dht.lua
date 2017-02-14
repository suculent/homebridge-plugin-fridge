dofile("config.lua")

led = 4 -- LED is used as activity indicator
seq = 0
m = 0

sda = 1 -- D1 data pin, GPIO2
scl = 2 -- D2
dev_addr = 0x40
RHumidityHoldCmd = 0xE5
TempHoldCmd = 0xE3

function init_I2C()
    i2c.setup(0, sda, scl, i2c.SLOW)
end

write_Si_Reg = function (dev_addr, set)  
    i2c.start(0x0)
    i2c.address(0x0, dev_addr ,i2c.TRANSMITTER)
    i2c.write(0x0,set)
    i2c.stop(0x0)
    tmr.delay(5000)
end

read_Si_Reg = function (dev_addr)           
    i2c.start(0x0)
    i2c.address(0x0, dev_addr,i2c.RECEIVER)
    tmr.delay(5000)
    c = i2c.read(0x0,2)
    i2c.stop(0x0)

    rval = (bit.lshift(string.byte(c, 1), 8) + string.byte(c, 2)) 
    status = bit.band(rval,3)    --save status bits
    rval = bit.band(rval,65532)  --clear status bits
    return rval, status
end

function read_hum(client)
   write_Si_Reg(dev_addr, RHumidityHoldCmd)
   tmr.delay(10000)
   read_Si_Reg(dev_addr)        
   hum = -6.0+125.0/65536.0*rval
   print("\nStatus : "..status)
   hum_percent = string.format("%.2f",hum)
   print("Humidity : "..hum_percent.."%")
   return hum_percent
end

function read_temp(client)
    write_Si_Reg(dev_addr, TempHoldCmd)
    read_Si_Reg(dev_addr)       
    temp = -46.85+175.72/65536.0*rval
    print("Status : "..status)
    temp_celsius = string.format("%.2f",temp)
    print("Temperature : "..temp_celsius.."C")
    return temp_celsius    
end

function mq(target)
    m:lwt("/lwt", "DHT-"..node.chipid().."offline", 0, 0)
    m:on("connect", function(client) 
        print("connected") 
    end)
    m:on("offline", function(client) 
        print("offline") 
        m:close();        
        connect(wifi_ssid, wifi_password)
    end)

    m:on("message", function(client, topic, data) 
        print(topic .. ":" ) 
        if data ~= nil then print("message: " .. data) end
    end)

    print("Contacting MQTT at " .. target .. "...")
    m:connect(target, 1883, 0,
    function(client)
        print("Connected to MQTT broker") 
        init_I2C()
        tmr.alarm( 0, 60000, 1, function() 
            h = read_hum(client)
            t = read_temp(client)
            m:publish(mqtt_channel .. "/status",'{ "shortIdentifier" : "'..shortIdentifier..'", "temperature" : '..t..', "humidity" : '..h..' }',0,0)
        end)
    end,     
    function(client, reason)
        print("failed reason: "..reason)
    end     
)
end

function connect(ssid, password)
    wifi.setmode(wifi.STATION)
    wifi.sta.config(ssid, password)
    wifi.sta.connect()

    tmr.alarm(1, 1000, 1, function()
    if wifi.sta.getip() == nil then        
        gpio.write(led,gpio.HIGH)
        print("Connecting " .. wifi_ssid .. "...")
        gpio.write(led,gpio.LOW)
    else
        tmr.stop(1)
        print("Connected to " .. ssid .. ", IP is "..wifi.sta.getip())                    
        gpio.write(led,gpio.HIGH)
        mq(mqtt_server)
    end
end)
end

gpio.mode(led,gpio.OUTPUT)
connect(wifi_ssid, wifi_password)
m = mqtt.Client("DHT-"..node.chipid(), 120, "username", "password") 
