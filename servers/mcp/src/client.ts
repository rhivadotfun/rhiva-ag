import {
  Agent,
  type AgentOutputType,
  type MCPServerStreamableHttp,
} from "@openai/agents";

export class McpClient {
  connected: boolean;

  constructor(
    private readonly server: MCPServerStreamableHttp,
    private readonly config: { name: string },
  ) {
    this.connected = false;
  }

  async connect() {
    await this.server.connect();

    if (this.connected) return this;

    this.connected = true;

    return this;
  }

  async close() {
    if (this.connected) {
      await this.server.close();
      this.connected = false;
    }
  }

  async createAgent<T extends AgentOutputType>(
    params: Omit<
      ConstructorParameters<typeof Agent>[number],
      "name" | "mcpServers" | "outpuType"
    >,
    outputType: T,
  ) {
    await this.connect();

    const agent = new Agent({
      ...params,
      outputType,
      name: this.config.name,
      mcpServers: [this.server],
    });

    return agent as unknown as Agent<unknown, T>;
  }
}
