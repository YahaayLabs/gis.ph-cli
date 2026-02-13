# My API CLI

A command-line interface for interacting with your API.

## Features

- 🚀 Simple and intuitive commands
- 🔐 Secure credential management
- 📊 Multiple output formats (table, JSON)
- ⚡ Fast and efficient API interactions
- 🎨 Colorful and user-friendly output
- 💾 Persistent configuration storage

## Installation

### Quick Install (Recommended)

Install with a single command:

```bash
curl -fsSL https://gis.ph/install.sh | bash
```

Then configure:
```bash
gis.ph config set apiUrl https://your-api.com
gis.ph config set apiKey your-api-key-here
```

### Manual Installation

#### Prerequisites

- Node.js >= 14.0.0
- npm or yarn

#### Setup

1. **Clone or navigate to the project directory:**
   ```bash
   cd my-api-cli
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Link the CLI globally (optional):**
   ```bash
   npm link
   ```
   After linking, you can use `myapi` command from anywhere.

4. **Configure your API:**
   ```bash
   # Set your API URL
   gis.ph config set apiUrl https://your-api.com

   # Set your API key (if required)
   gis.ph config set apiKey your-api-key-here
   ```

   Alternatively, create a `.env` file:
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

### Uninstall

```bash
# Using the uninstall script
curl -fsSL https://yourusername.github.io/my-api-cli/uninstall.sh | bash

# Or manually
rm -rf ~/.myapi
rm ~/.local/bin/myapi
```

## Usage

### Configuration Commands

```bash
# Set configuration
gis.ph config set <key> <value>

# Get configuration value
gis.ph config get <key>

# List all configuration
gis.ph config list

# Delete configuration
gis.ph config delete <key>

# Enable/disable automatic update checks
gis.ph config auto-update enable
gis.ph config auto-update disable
```

### Update Commands

```bash
# Update to latest version
gis.ph update

# Check for updates without installing
gis.ph update --check

# Force update even if on latest version
gis.ph update --force
```

The CLI automatically checks for updates once per day and notifies you if a new version is available. You can disable this with `gis.ph config auto-update disable`.

### Regions Commands

```bash
# List all regions (table format)
gis.ph regions list

# List regions in JSON format
gis.ph regions list --format json

# List with limit
gis.ph regions list --limit 10

# Filter regions
gis.ph regions list --filter status:active

# Get specific region by ID
gis.ph regions get <region-id>

# Get region in table format
gis.ph regions get <region-id> --format table
```

### Examples

```bash
# Configure the CLI
gis.ph config set apiUrl https://api.gis.ph
gis.ph config set apiKey sk_live_abc123

# List all regions
gis.ph regions list

# Get specific region
gis.ph regions get us-east-1

# List regions as JSON for scripting
gis.ph regions list --format json | jq '.regions[0]'

# View help
gis.ph --help
gis.ph regions --help
gis.ph regions list --help
```

## Development

### Running Locally

Without installing globally:
```bash
npm start -- regions list
# or
node src/index.js regions list
```

### Project Structure

```
my-api-cli/
├── src/
│   ├── index.js              # Main CLI entry point
│   ├── commands/             # Command implementations
│   │   ├── regions.js        # Regions commands
│   │   └── config.js         # Config commands
│   ├── lib/                  # Core libraries
│   │   └── api-client.js     # API HTTP client
│   └── utils/                # Utility functions
│       ├── config.js         # Configuration management
│       └── formatter.js      # Output formatting
├── package.json
├── .env.example
└── README.md
```

### Adding New Commands

1. Create a new command file in `src/commands/`:
   ```javascript
   const { Command } = require('commander');
   
   const myCommand = new Command('mycommand');
   
   myCommand
     .description('My command description')
     .action(async () => {
       // Your logic here
     });
   
   module.exports = myCommand;
   ```

2. Register it in `src/index.js`:
   ```javascript
   const myCommand = require('./commands/mycommand');
   program.addCommand(myCommand);
   ```

3. Add corresponding API methods in `src/lib/api-client.js`:
   ```javascript
   async getMyData() {
     return this.get('/v1/mydata');
   }
   ```

## Configuration Storage

Configuration is stored in your system's config directory:
- **Linux:** `~/.config/my-api-cli/config.json`
- **macOS:** `~/Library/Preferences/my-api-cli/config.json`
- **Windows:** `%APPDATA%\my-api-cli\config.json`

## Environment Variables

The CLI supports the following environment variables:

- `API_URL` - Base URL for the API
- `API_KEY` - API authentication key

These can be set in a `.env` file or exported in your shell.

## Error Handling

The CLI provides helpful error messages:
- Network errors (API unreachable)
- Authentication errors (invalid API key)
- Validation errors (invalid parameters)
- API errors (with status codes and messages)

## Troubleshooting

### Command not found

If `myapi` command is not found after `npm link`:
```bash
# Unlink and relink
npm unlink -g
npm link
```

### API connection errors

Check your configuration:
```bash
myapi config list
```

Verify your API URL is correct and accessible.

### Debug mode

For more verbose output, use Node's debug mode:
```bash
NODE_DEBUG=* myapi regions list
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
