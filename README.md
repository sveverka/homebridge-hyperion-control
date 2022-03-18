# homebridge-hyperion-service
Homebridge plugin to turn Hyperion instance on/off, change brightness, and change colors. You can read more about how this is done in the [hyperion documentation](https://docs.hyperion-project.org/en/json/Control.html)

## Install

```
npm install -g homebridge-hyperion-service
```

## Configuration

Example configuration:
```json
{
    "accessory": "HyperionControl",
    "name": "TV Backlight",
    "url": "http://192.168.0.123",
    "port": 8090,
    "token": "abc123abc-abcd-abcd-abcd-abcd1234abcd",
    "priority": 150
}
```

- `accessory` **required**: must always be "HyperionControl"
- `name` optional: displayname of your device (default: Hyperion)
- `url` **required**: IP/URL of your hyperion ng instance  
- `port` optional: port of your hyperion ng webserver (default: 8090)
- `token` optional: authorization token (see hyperion ng network configuration)
- `priority` optional: allows you to change the called priority to Hyperion (lowest priority overrides higher priority).