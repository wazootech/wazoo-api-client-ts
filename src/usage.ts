import { WazooClient } from "./client";
import { WazooConfig, resolveOrganization } from "./config";

export interface UsageOptions {
  from?: Date | string;
  to?: Date | string;
}

export interface OrganizationUsage {
  organization: string;
  worlds?: unknown[];
  total?: Record<string, unknown>;
  [key: string]: unknown;
}

export class UsageClient {
  constructor(private config: WazooConfig) {}

  private get org(): string {
    return resolveOrganization(this.config);
  }

  async get(options?: UsageOptions): Promise<OrganizationUsage> {
    const params = new URLSearchParams();
    if (options?.from) params.set("from", formatDate(options.from));
    if (options?.to) params.set("to", formatDate(options.to));

    const response = await WazooClient.request<{ usage: OrganizationUsage }>(
      `organizations/${this.org}/usage${params.toString() ? `?${params}` : ""}`,
      this.config,
    );
    return response.usage;
  }
}

function formatDate(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}
