import { WazooClient } from "./client";
import { WazooConfig, resolveOrganization } from "./config";

export interface Organization {
  name: string;
  uid: string;
  displayName: string;
  state: "ACTIVE" | "SUSPENDED";
  metadata?: Record<string, unknown>;
  createTime?: string;
  updateTime?: string;
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

  async get(org: string = this.org): Promise<Organization> {
    const response = await WazooClient.request<{ organization: Organization }>(
      `organizations/${org}`,
      this.config,
    );
    return response.organization;
  }

  async update(input: { displayName: string }): Promise<Organization> {
    const response = await WazooClient.request<{ organization: Organization }>(
      `organizations/${this.org}`,
      this.config,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ organization: input, updateMask: "displayName" }),
      },
    );
    return response.organization;
  }

  async delete(): Promise<void> {
    await WazooClient.request<void>(`organizations/${this.org}`, this.config, {
      method: "DELETE",
    });
  }
}
