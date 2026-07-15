import { ApiTokenClient } from "./api-token";
import { BillingClient } from "./billing";
import { WazooConfig, resolveOrganization, resolveToken } from "./config";
import { OrganizationClient } from "./organization";
import { UsageClient } from "./usage";
import { WorldClient } from "./world";

interface ApiErrorResponse {
  error?: string | { message?: string; code?: string };
  message?: string;
  quota?: unknown;
  world?: unknown;
  details?: unknown;
}

export class WazooClientError extends Error {
  status?: number | undefined;
  code?: string | undefined;
  quota?: unknown;
  world?: unknown;
  details?: unknown;

  constructor(message: string, status?: number, options: { code?: string | undefined; quota?: unknown; world?: unknown; details?: unknown } = {}) {
    super(message);
    this.name = "WazooClientError";
    if (status !== undefined) {
      this.status = status;
    }
    this.code = options.code;
    this.quota = options.quota;
    this.world = options.world;
    this.details = options.details;
  }
}

export class WazooClient {
  public organizations: OrganizationClient;
  public worlds: WorldClient;
  public apiTokens: ApiTokenClient;
  public usage: UsageClient;
  public billing: BillingClient;

  private config: WazooConfig;

  constructor(config: WazooConfig) {
    if (!config.token) {
      throw new Error("You must provide an API token");
    }

    this.config = {
      baseUrl: "https://api.wazoo.dev/v1/",
      ...config,
    };

    resolveOrganization(this.config);

    this.organizations = new OrganizationClient(this.config);
    this.worlds = new WorldClient(this.config);
    this.apiTokens = new ApiTokenClient(this.config);
    this.usage = new UsageClient(this.config);
    this.billing = new BillingClient(this.config);
  }

  static async request<T>(
    url: string,
    config: WazooConfig,
    options: RequestInit = {},
  ): Promise<T> {
    const token = await resolveToken(config);
    const response = await fetch(new URL(url, config.baseUrl), {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        "User-Agent": "@wazoo/api",
      },
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null) as ApiErrorResponse | null;
      const nestedError = typeof body?.error === "object" ? body.error : null;
      throw new WazooClientError(
        nestedError?.message ?? (typeof body?.error === "string" ? body.error : body?.message) ?? `Request failed with status ${response.status}`,
        response.status,
        { code: nestedError?.code, quota: body?.quota, world: body?.world, details: body?.details },
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return await response.json() as T;
  }
}

export function createClient(config: WazooConfig): WazooClient {
  return new WazooClient(config);
}
