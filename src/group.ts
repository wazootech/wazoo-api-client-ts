import { WazooClient } from "./client";
import { WazooConfig, resolveOrganization } from "./config";

export interface Group {
  id: string;
  name: string;
  slug?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateGroupInput {
  name: string;
  slug?: string;
}

export class GroupClient {
  constructor(private config: WazooConfig) {}

  private get org(): string {
    return resolveOrganization(this.config);
  }

  async list(): Promise<Group[]> {
    const response = await WazooClient.request<{ groups: Group[] }>(
      `organizations/${this.org}/groups`,
      this.config,
    );
    return response.groups ?? [];
  }

  async get(group: string): Promise<Group> {
    const response = await WazooClient.request<{ group: Group }>(
      `organizations/${this.org}/groups/${group}`,
      this.config,
    );
    return response.group;
  }

  async create(input: CreateGroupInput): Promise<Group> {
    const response = await WazooClient.request<{ group: Group }>(
      `organizations/${this.org}/groups`,
      this.config,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      },
    );
    return response.group;
  }

  async delete(group: string): Promise<Group> {
    const response = await WazooClient.request<{ group: Group }>(
      `organizations/${this.org}/groups/${group}`,
      this.config,
      { method: "DELETE" },
    );
    return response.group;
  }
}
