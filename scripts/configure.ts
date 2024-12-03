import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { config as dotenvConfig } from "dotenv";

// Load environment variables
dotenvConfig();
const linearApiKey = process.env.LINEAR_API_KEY;
if (!linearApiKey) {
  console.error("LINEAR_API_KEY environment variable is not set");
  process.exit(1);
}

const CONFIG_FILENAME = 'claude_desktop_config.json';
const DEFAULT_SERVER_NAME = 'linear-context-server-ts';

interface MCPServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

interface MCPConfig {
  globalShortcut: string;
  mcpServers: Record<string, MCPServerConfig>;
}

async function configure(force: boolean = false, serverName: string = DEFAULT_SERVER_NAME) {
  let configPath: string;

  switch (process.platform) {
    case 'win32':
      configPath = path.join(process.env.APPDATA, 'Claude', CONFIG_FILENAME);
      break;
    case 'darwin':
      configPath = path.join(os.homedir(), 'Library', 'Application Support', 'Claude', CONFIG_FILENAME);
      break;
    default:
      throw new Error('This application only supports Windows and macOS');
  }

  try {
    // Read existing config
    const configContent = await fs.readFile(configPath, 'utf-8');
    const config: MCPConfig = JSON.parse(configContent);

    // Check if entry already exists
    if (config.mcpServers[serverName] && !force) {
      console.log(`${serverName} configuration already exists. Use --force to overwrite.`);
      return;
    }

    // Add or update server configuration
    config.mcpServers[serverName] = {
      command: 'node',
      args: [
        path.join(process.cwd(), 'build', 'server.js')
      ],
      env: {
        LINEAR_API_KEY: linearApiKey
      }
    };

    // Write updated config
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    console.log('Successfully updated MCP configuration');
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error updating MCP configuration:', error.message);
    } else {
      console.error('Unknown error occurred');
    }
    process.exit(1);
  }
}

// Parse command line arguments
const force = process.argv.includes('--force');
const serverNameArg = process.argv.find(arg => arg.startsWith('--name='));
const serverName = serverNameArg ? serverNameArg.split('=')[1] : DEFAULT_SERVER_NAME;

configure(force, serverName).catch(console.error);
