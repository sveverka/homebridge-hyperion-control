const axios = require('axios');

module.exports = (api) => {
    api.registerAccessory('homebridge-hyperion-control', 'Hyperion', Hyperion);
}

class Hyperion {
    constructor(log, config, api) {
        this.log = log;
        this.config = config;
        this.name = config.name || "Hyperion";
        this.port = config.port || 8090;
        this.url = `${config.url}:${this.port}/json-rpc`;
        this.api = api;

        this.Service = this.api.hap.Service;
        this.Characteristic = this.api.hap.Characteristic;

        this.service = new this.Service.Lightbulb(this.name);

        this.service.getCharacteristic(this.Characteristic.On)

        this.service.getCharacteristic(this.Characteristic.On)
            .onGet(this.handleOnGet.bind(this))
            .onSet(this.handleOnSet.bind(this));

        this.service.addCharacteristic(this.Characteristic.Brightness)
            .onGet(this.handleBrightnessGet.bind(this))
            .onSet(this.handleBrightnessSet.bind(this));
    }

    async handleOnGet() {
        this.log.debug('Triggered GET On');
        const {url} = this;

        const {data} = await axios.post(url, {"command": "serverinfo"});
        const status = data.info.components[0].enabled;

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
        })
        const {success} = data;

        if (!success) {
            this.log.error(`Failed to set the state to: ${value}`)
        }
    }

    async handleBrightnessGet() {
        this.log.debug('Triggered GET On');
        const {url} = this;

        const {data} = await axios.post(url, {"command": "serverinfo"});
        const {brightness} = data.info.adjustment[0];

        this.service.getCharacteristic(this.Characteristic.Brightness).updateValue(brightness);
    }

    async handleBrightnessSet(value) {
        const {url} = this;

        const {data} = await axios.post(url, {
            command: "adjustment",
            adjustment: {
                brightness: value
            }
        });
        const {success} = data;

        if (!success) {
            this.log.error(`Failed to set the brightness to: ${value}`)
        }
    }

    getServices() {
        return [
            this.service,
        ];
    }
}