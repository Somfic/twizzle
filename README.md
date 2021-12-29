# twizzle bot

music 'n stuff

## Configuration

Application is configured using `appsettings.json`.

### Example configuration
```json
{
    "Logging": {
        "LogLevel": {
            "Default": "Trace",
            "Microsoft": "Information"
        }
    },
    
    "Discord": {
        "Identifier": "<discord id>",
        "Token": "<discord token>",

        "Guilds": [
            790291218927058956,
            703334117424496706
        ],
        
        "Prefix": "!",
        "ItemsPerPage": 12
    },
    
    "Spotify": {
        "Identifier": "<spotify id>",
        "Token": "<spotify token>"
    }
}
```