import { WazooClient } from "./client";
import { WazooConfig, resolveOrganization } from "./config";

export interface UsageOptions {
  from?: Date | string;
  to?: Date | string;
}

export interface OrganizationUsage {
  organization: string;
  worlds?: unknown[];
  total?: UsageAggregate[];
  events?: UsageEvent[];
  [key: string]: unknown;
}

export interface UsageAggregate {
  metric: string;
  quantity: number;
}

export interface UsageEvent {
  name: string;
  organization: string;
  world?: string | null;
  metric: string;
  quantity: number;
  unit: string;
  providerCostMicrocents?: number | null;
  wazooMarkupMicrocents?: number;
  estimatedCostMicrocents?: number | null;
  billingSource: "BETA_FREE" | "INTERNAL" | "MANUAL_CREDIT" | "PAID_BALANCE";
  occurredAt: string;
  createTime: string;
}

export interface UsageEventInput {
  metric: string;
  quantity: number;
  unit?: string;
  worldId?: string;
  providerCostMicrocents?: number;
  wazooMarkupMicrocents?: number;
  estimatedCostMicrocents?: number;
  billingSource?: "BETA_FREE" | "INTERNAL" | "MANUAL_CREDIT" | "PAID_BALANCE";
  occurredAt?: string;
}

export interface OrganizationLimit {
  metric: string;
  limitQuantity: number;
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

  async limits(): Promise<OrganizationLimit[]> {
    const response = await WazooClient.request<{ limits: OrganizationLimit[] }>(
      `organizations/${this.org}/limits`,
      this.config,
    );
    return response.limits;
  }

  async record(event: UsageEventInput): Promise<{ accepted: true }> {
    return await WazooClient.request<{ accepted: true }>(
      `organizations/${this.org}/usage`,
      this.config,
      { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(event) },
    );
  }
}

function formatDate(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}
