import { WazooClient } from "./client";
import { WazooConfig, resolveOrganization } from "./config";

export interface Organization {
  id: string;
  name: string;
  slug?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
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

  async get(org: string = this.org): Promise<Organization> {
    const response = await WazooClient.request<{ organization: Organization }>(
      `organizations/${org}`,
      this.config,
    );
    return response.organization;
  }

  async update(input: Partial<Pick<Organization, "name" | "slug" | "metadata">>): Promise<Organization> {
    const response = await WazooClient.request<{ organization: Organization }>(
      `organizations/${this.org}`,
      this.config,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
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
