#!/usr/bin/env node

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "child_process";
import * as path from "path";
import { fileURLToPath } from "url";
import { config as dotenvConfig } from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  let serverProcess;
  let transport;
  let client;

  try {
    // Load environment variables
    dotenvConfig();
    const linearApiKey = process.env.LINEAR_API_KEY;
    if (!linearApiKey) {
      throw new Error("LINEAR_API_KEY environment variable is not set");
    }

    // Start the server process
    const serverPath = path.join(__dirname, "server.js");
    serverProcess = spawn("node", [serverPath]);

    // Create a transport that communicates with the server process
    transport = new StdioClientTransport({
      command: serverPath,
      args: [],
    });

    // Create the client and connect
    client = new Client(
      {
        name: "linear-context-client",
        version: "0.1.0",
      },
      {
        capabilities: {
          experimental: {},
          sampling: {},
          roots: {},
        },
      },
    );
    await client.connect(transport);

    // List all notes
    console.log("\nListing all notes:");
    const resources = await client.listResources({ type: "note" });
    console.log(resources);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    if (transport) {
      try {
        await transport.close();
      } catch (e) {
        console.error("Error closing transport:", e);
      }
    }

    if (serverProcess) {
      serverProcess.kill();
      process.exit(0);
    }
  }
}

// Add error handling for uncaught errors
process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
  process.exit(1);
});

main().catch((error) => {
  console.error("Client error:", error);
  process.exit(1);
});
