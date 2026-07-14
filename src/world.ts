import { WazooClient } from "./client";
import { WazooConfig, resolveOrganization } from "./config";

export interface World {
  id: string;
  slug: string;
  label?: string;
  description?: string;
  group?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateWorldInput {
  label: string;
  slug?: string;
  description?: string;
  group?: string;
}

export interface ListWorldsOptions {
  group?: string;
  page?: number;
  pageSize?: number;
}

export interface WorldAuthToken {
  token: string;
}

export interface CreateWorldTokenOptions {
  expiration?: string;
  authorization?: "read-only" | "full-access";
}

export interface WorldUsageOptions {
  from?: Date | string;
  to?: Date | string;
}

export interface WorldUsage {
  world: string;
  rowsRead?: number;
  rowsWritten?: number;
  storageBytes?: number;
  [key: string]: unknown;
}

export class WorldClient {
  constructor(private config: WazooConfig) {}

  private get org(): string {
    return resolveOrganization(this.config);
  }

  async list(options?: ListWorldsOptions): Promise<World[]> {
    const query = queryString({
      group: options?.group,
      page: options?.page,
      page_size: options?.pageSize,
    });
    const response = await WazooClient.request<{ worlds: World[] }>(
      `organizations/${this.org}/worlds${query}`,
      this.config,
    );
    return response.worlds ?? [];
  }

  async get(world: string): Promise<World> {
    const response = await WazooClient.request<{ world: World }>(
      `organizations/${this.org}/worlds/${world}`,
      this.config,
    );
    return response.world;
  }

  async create(input: CreateWorldInput): Promise<World> {
    const response = await WazooClient.request<{ world: World }>(
      `organizations/${this.org}/worlds`,
      this.config,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      },
    );
    return response.world;
  }

  async delete(world: string): Promise<void> {
    await WazooClient.request<void>(`organizations/${this.org}/worlds/${world}`, this.config, {
      method: "DELETE",
    });
  }

  async createToken(world: string, options?: CreateWorldTokenOptions): Promise<WorldAuthToken> {
    const query = queryString({
      expiration: options?.expiration,
      authorization: options?.authorization,
    });
    return await WazooClient.request<WorldAuthToken>(
      `organizations/${this.org}/worlds/${world}/auth/tokens${query}`,
      this.config,
      { method: "POST" },
    );
  }

  async rotateTokens(world: string): Promise<void> {
    await WazooClient.request<void>(
      `organizations/${this.org}/worlds/${world}/auth/rotate`,
      this.config,
      { method: "POST" },
    );
  }

  async usage(world: string, options?: WorldUsageOptions): Promise<WorldUsage> {
    const query = queryString({
      from: formatDate(options?.from),
      to: formatDate(options?.to),
    });
    const response = await WazooClient.request<{ usage: WorldUsage }>(
      `organizations/${this.org}/worlds/${world}/usage${query}`,
      this.config,
    );
    return response.usage;
  }
}

function queryString(values: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) {
      params.set(key, String(value));
    }
  }
  const value = params.toString();
  return value ? `?${value}` : "";
}

function formatDate(value?: Date | string): string | undefined {
  return value instanceof Date ? value.toISOString() : value;
}
