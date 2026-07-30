# GIS.ph CLI

A command-line interface for interacting with GIS.ph API.
   
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
   After linking, you can use `gis.ph` command from anywhere.

4. **Configure your API:**
   ```bash
   # Set your API URL
   gis.ph config set apiUrl https://api.gis.ph

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
rm -rf ~/.gis.ph
rm ~/.local/bin/gis.ph
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

# List with pagination
gis.ph regions list --limit 5 --page 2

# List regions in JSON format
gis.ph regions list --format json

# Filter regions (e.g., status:active)
gis.ph regions list --filter status:active

# Get region by PSGC code
gis.ph regions get 0700000000
```

### Provinces Commands

```bash
# List all provinces
gis.ph provinces list

# List with pagination
gis.ph provinces list --limit 10 --page 1

# Get province by PSGC code
gis.ph provinces get 0702200000

# Get province with GeoJSON boundaries
gis.ph provinces get 0702200000 --geometry
```

### Cities and Municipalities Commands

```bash
# List all cities/municipalities in a province (REQUIRED)
gis.ph municities list --province "Bohol"

# Filter by name (starts with)
gis.ph municities list --province "Bohol" --name "Al"

# Get municipality by PSGC code
gis.ph municities get 0730600000

# Get municipality with barangay boundaries (GeoJSON)
gis.ph municities get 0730600000 --geometry
```

### Barangays Commands

```bash
# List barangays in a province (REQUIRED)
gis.ph barangays list --province "Cebu"

# Filter by municipality and/or barangay name
gis.ph barangays list --province "Cebu" --municipality "Poro" --name "Pob"

# Get barangay by PSGC code
gis.ph barangays get 0730600041
```

### Examples

```bash
# Configure the CLI
gis.ph config set apiUrl https://api.gis.ph
gis.ph config set apiKey sk_live_abc123

# List all regions
gis.ph regions list

# Get all provinces in Region 7
gis.ph provinces list --limit 100 --page 1

# Find a town in Bohol
gis.ph municities list --province "Bohol" --name "Al"

# Get a specific barangay info
gis.ph barangays get 12345

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
gis.ph-cli/
├── src/
│   ├── index.ts              # Main CLI entry point
│   ├── commands/             # Command implementations
│   │   ├── regions.ts        # Regions commands
│   │   ├── provinces.ts      # Provinces commands
│   │   ├── municities.ts     # Cities/Municipalities commands
│   │   ├── barangays.ts      # Barangays commands
│   │   ├── update.ts         # Self-update logic
│   │   └── config.ts         # Config commands
│   ├── lib/                  # Core libraries
│   │   └── api-client.ts     # API HTTP client
│   └── utils/                # Utility functions
│       ├── config.ts         # Configuration management
│       ├── formatter.ts      # Output formatting
│       └── auto-update.ts    # Background update checker
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

### Adding New Commands

1. Create a new command file in `src/commands/`:
   ```typescript
   import { Command } from 'commander';
   
   const myCommand = new Command('mycommand');
   
   myCommand
     .description('My command description')
     .action(async () => {
       // Your logic here
     });
   
   export default myCommand;
   ```

2. Register it in `src/index.ts`:
   ```typescript
   import myCommand from './commands/mycommand.js';
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

If `gis.ph` command is not found after `npm link`:
```bash
# Unlink and relink
npm unlink -g
npm link
```

### API connection errors

Check your configuration:
```bash
gis.ph config list
```

Verify your API URL is correct and accessible.

### Debug mode

For more verbose output, use Node's debug mode:
```bash
NODE_DEBUG=* gis.ph regions list
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
