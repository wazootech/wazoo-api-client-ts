import { WazooClient } from "./client";
import { WazooConfig, resolveOrganization } from "./config";
import type { UsageAggregate, UsageEvent } from "./usage";

export interface World {
  name: string;
  uid: string;
  displayName: string;
  region: string;
  state: "ACTIVE" | "SUSPENDED" | "DELETED" | "FAILED";
  restorable: boolean;
  storage?: Record<string, unknown>;
  provisioning?: Record<string, unknown>;
  durability?: Record<string, unknown>;
  createTime?: string;
  updateTime?: string;
  deleteTime?: string;
  expireTime?: string;
}

export interface CreateWorldInput {
  worldId: string;
  world: {
    displayName: string;
    region?: string;
  };
}

export interface ListWorldsOptions {
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
  total?: UsageAggregate[];
  events?: UsageEvent[];
  [key: string]: unknown;
}

export interface WorldSyncReport {
  status: "HEALTHY" | "REPAIRED" | "BLOCKED" | "FAILED";
  actions: Array<{ code: string; message: string }>;
  warnings: Array<{ code: string; message: string }>;
  errors: Array<{ code: string; message: string }>;
}

export interface WorldSyncResult {
  world: World;
  syncReport: WorldSyncReport;
}

export class WorldClient {
  constructor(private config: WazooConfig) {}

  private get org(): string {
    return resolveOrganization(this.config);
  }

  async list(options?: ListWorldsOptions): Promise<World[]> {
    const query = queryString({
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
      `organizations/${this.org}/worlds/${worldId(world)}`,
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

  async delete(world: string): Promise<World> {
    const response = await WazooClient.request<{ world: World }>(`organizations/${this.org}/worlds/${worldId(world)}`, this.config, {
      method: "DELETE",
    });
    return response.world;
  }

  async undelete(world: string): Promise<WorldSyncResult> {
    return await WazooClient.request<WorldSyncResult>(
      `organizations/${this.org}/worlds/${worldId(world)}:undelete`,
      this.config,
      { method: "POST" },
    );
  }

  async sync(world: string): Promise<WorldSyncResult> {
    return await WazooClient.request<WorldSyncResult>(
      `organizations/${this.org}/worlds/${worldId(world)}:sync`,
      this.config,
      { method: "POST" },
    );
  }

  async update(world: string, input: { displayName?: string; region?: string; state?: "ACTIVE" | "SUSPENDED" }): Promise<World> {
    const updateMask = [input.displayName !== undefined ? "displayName" : undefined, input.region !== undefined ? "region" : undefined, input.state !== undefined ? "state" : undefined]
      .filter(Boolean)
      .join(",");
    const response = await WazooClient.request<{ world: World }>(
      `organizations/${this.org}/worlds/${worldId(world)}`,
      this.config,
      { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ world: input, updateMask }) },
    );
    return response.world;
  }

  async createToken(world: string, options?: CreateWorldTokenOptions): Promise<WorldAuthToken> {
    return await WazooClient.request<WorldAuthToken>(
      `organizations/${this.org}/worlds/${worldId(world)}/auth/tokens`,
      this.config,
      { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ expiresAt: options?.expiration, authorization: options?.authorization }) },
    );
  }

  async rotateTokens(world: string): Promise<void> {
    await WazooClient.request<void>(
      `organizations/${this.org}/worlds/${worldId(world)}/auth/rotate`,
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
      `organizations/${this.org}/worlds/${worldId(world)}/usage${query}`,
      this.config,
    );
    return response.usage;
  }
}

function worldId(value: string): string {
  const marker = "/worlds/";
  const index = value.indexOf(marker);
  if (index >= 0) return value.slice(index + marker.length);
  return value.startsWith("worlds/") ? value.slice("worlds/".length) : value;
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
