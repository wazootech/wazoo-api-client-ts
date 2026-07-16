import { WazooClient } from "./client";
import { WazooConfig, resolveOrganization } from "./config";

export interface Organization {
  name: string;
  uid: string;
  displayName: string;
  state: "ACTIVE" | "SUSPENDED" | "DELETED";
  quota?: QuotaStatus;
  billing?: OrganizationBilling;
  metadata?: Record<string, unknown>;
  createTime?: string;
  updateTime?: string;
  deleteTime?: string;
  expireTime?: string;
}

export interface QuotaStatus {
  state: "OK" | "WARN" | "THROTTLED" | "SUSPENDED" | "MANUAL_REVIEW";
  reason?: string;
  retryDelay?: string;
  usagePercent?: number;
}

export interface OrganizationBilling {
  state: "BETA_FREE" | "TRIAL" | "ACTIVE" | "PAST_DUE" | "SUSPENDED";
  provider: "STRIPE";
  customerConfigured: boolean;
  paymentRequired: boolean;
}

export interface CreateOrganizationInput {
  organizationId: string;
  organization: { displayName: string };
}

export class OrganizationClient {
  constructor(private config: WazooConfig) {}

  private get org(): string {
    return resolveOrganization(this.config);
  }

  async list(): Promise<Organization[]> {
    const response = await WazooClient.request<{ organizations: Organization[] }>(
      "organizations",
      this.config,
    );
    return response.organizations ?? [];
  }

  async create(input: CreateOrganizationInput): Promise<Organization> {
    const response = await WazooClient.request<{ organization: Organization }>(
      "organizations",
      this.config,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      },
    );
    return response.organization;
  }

  async get(organization: string = this.org): Promise<Organization> {
    const response = await WazooClient.request<{ organization: Organization }>(
      `organizations/${organizationId(organization)}`,
      this.config,
    );
    return response.organization;
  }

  async patch(input: { displayName?: string; state?: "ACTIVE" | "SUSPENDED" }): Promise<Organization> {
    const updateMask = [input.displayName !== undefined ? "displayName" : undefined, input.state !== undefined ? "state" : undefined]
      .filter(Boolean)
      .join(",");
    const response = await WazooClient.request<{ organization: Organization }>(
      `organizations/${this.org}`,
      this.config,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ organization: input, updateMask }),
      },
    );
    return response.organization;
  }

  async delete(): Promise<Organization> {
    const response = await WazooClient.request<{ organization: Organization }>(`organizations/${this.org}`, this.config, {
      method: "DELETE",
    });
    return response.organization;
  }
}

function organizationId(value: string): string {
  return value.startsWith("organizations/") ? value.slice("organizations/".length) : value;
}
