const axios = require('axios');
const Color = require('color');

const wait = async (timeToDelay) => new Promise((resolve) => setTimeout(resolve, timeToDelay));

module.exports = (api) => {
    api.registerAccessory('homebridge-hyperhdr-service', 'HyperHDR', HyperHDR);
}

class HyperHDR {
    constructor(log, config, api) {
        this.log = log;
        this.config = config;
        this.api = api;

        this.name = config.name || "HyperHDR";
        this.port = config.port || 8090;
        this.priority = config.priority || 100;
        this.url = `${config.url}:${this.port}/json-rpc`;
        this.color = Color([255, 200, 150]);

        this.Service = this.api.hap.Service;
        this.Characteristic = this.api.hap.Characteristic;
        this.service = new this.Service.Lightbulb(this.name);
        const switchname = "global HDR";
        this.switchService = new this.Service.Switch(switchname);
        
        this.switchService.getCharacteristic(this.Characteristic.On)
            .onGet(async () => this.handleVideoModeHdrOnGet())
            .onSet(async (value) => this.handleVideoModeHdrOnSet(value));

        this.service.getCharacteristic(this.Characteristic.On)
            .onGet(this.handleOnGet.bind(this))
            .onSet(this.handleOnSet.bind(this));

        this.service.getCharacteristic(this.Characteristic.Brightness)
            .onGet(async () => this.handleBrightnessGet())
            .onSet(async (value) => this.handleBrightnessSet(value));

        this.service
            .getCharacteristic(this.Characteristic.Hue)
            .onSet(this.handleHueSet.bind(this))
            .onGet(this.handleHueGet.bind(this));

        this.service
            .getCharacteristic(this.Characteristic.Saturation)
            .onSet(this.handleSaturationSet.bind(this))
            .onGet(this.handleSaturationGet.bind(this));
                
        this.log.info(`HyperHDR Service Started: ${this.name}`);
    }

    async handleOnGet() {
        this.log.debug('Triggered GET On');
        const {url} = this;

        const {data} = await axios.post(url, {command: "serverinfo"});
        const status = +data.info.components[0].enabled;
        return Boolean(status)
            ? 1
            : 0;
    }

    async handleOnSet(value) {
        this.log.debug('Triggered SET On:', value);
        const {url} = this;

        const {data} = await axios.post(url, {
            command: "componentstate",
            componentstate: {
                component: "ALL",
                state: value
            }
        });

        const {dataSwitchDevice} = await axios.post(url, {
            command: "instance",
            subcommand : "switchTo",
            instance : 0
        });

        const {dataEnableLED} = await axios.post(url, {
            command:"componentstate",
            componentstate:
            {
                component:"LEDDEVICE",
                state: true
            }
        });

        const {success} = data;

        if (!success) {
            this.log.error(`Failed to set the state to: ${value
            }`);
        }
    }

    async handleVideoModeHdrOnGet()  {

        this.log.debug('Triggered GET On');
        const {url} = this;

        const {data} = await axios.post(url, {command: "serverinfo"});
        const status = data.info.components[1].enabled;

        return Boolean(status)
            ? 1
            : 0;
    }

    async handleVideoModeHdrOnSet(value) {
        this.log.debug('Triggered HDR SET On:', value);
        const {url} = this;

        const {data} = await axios.post(url, {
              "command" : "clear",
              "priority" : 50
            }
        });
        const {success} = data;

        if (!success) {
            this.log.error(`Failed to set the state to: ${value}`);
        }
    }


    async handleBrightnessGet() {
        this.log.debug('Triggered GET On');
        const {url} = this;
        const {data} = await axios.post(url, {"command": "serverinfo"});
        const brightness = data.info.adjustment[0].Brightness;
        this.service.getCharacteristic(this.Characteristic.Brightness).updateValue(brightness);
    }

    async handleBrightnessSet(value) {
        const {url} = this;
        this.log.info('setting brightness to ', value)
        const {data} = await axios.post(url, {
            command: "adjustment",
            adjustment: {
                brightness: value
            }
        });
        const {success} = data;
        if (!success) {
            this.log.info(`Failed to set the brightness to: ${value}`);
        } else {
            this.log.info(`Succeded to set the brightness to: ${value}`);
        }

        this.service.getCharacteristic(this.Characteristic.Brightness).updateValue(value);
    }

    async handleHueSet(value) {
        const newHue = Color(this.color).hue(value);
        this.color = newHue;

        this.log.debug(`Setting hue to: ${value}`);

        this.log.debug(`Successfully set the hue.`);

        return this.color.hue();
    }

    async handleHueGet() {
        return this.color.hue();
    }

    async handleSaturationGet() {
        return this.color.saturationv();
    }

    async handleSaturationSet(level) {
        await wait(100);
        const {url, priority} = this;
        const newColor = Color(this.color).saturationv(level);

        this.log.debug(`Setting saturation to: ${level}`)

        const {data} = await axios.post(url, {
            command: "color",
            priority,
            color: newColor.rgb().round().array()
        });

        const {success} = data;

        if (!success) {
            this.log.error(`Failed to set the saturation to: ${level}`);
        } else {
            this.log.debug(`Successfully set the saturation. New color ${newColor.rgb().round().array()}`);
            this.color.hue(newColor.hue());
        }
    }

    getServices() {

        return [
            this.service,this.switchService
        ];
    }
}
