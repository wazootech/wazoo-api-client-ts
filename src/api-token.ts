import { WazooClient } from "./client";
import { WazooConfig } from "./config";

export interface PlatformApiToken {
  uid: string;
  name: string;
  createdAt?: string;
}

export interface CreatedPlatformApiToken extends PlatformApiToken {
  token: string;
}

export interface RevokedPlatformApiToken {
  token: string;
}

export interface PlatformApiTokenValidation {
  valid: boolean;
  expiry: number;
}

export class ApiTokenClient {
  constructor(private config: WazooConfig) {}

  async list(): Promise<PlatformApiToken[]> {
    const response = await WazooClient.request<{ tokens: PlatformApiToken[] }>(
      "auth/api-tokens",
      this.config,
    );
    return response.tokens ?? [];
  }

  async create(name: string): Promise<CreatedPlatformApiToken> {
    return await WazooClient.request<CreatedPlatformApiToken>(
      `auth/api-tokens/${name}`,
      this.config,
      { method: "POST" },
    );
  }

  async revoke(name: string): Promise<RevokedPlatformApiToken> {
    return await WazooClient.request<RevokedPlatformApiToken>(
      `auth/api-tokens/${name}`,
      this.config,
      { method: "DELETE" },
    );
  }

  async validate(token: string): Promise<PlatformApiTokenValidation> {
    const response = await WazooClient.request<{ exp: number }>(
      "auth/api-tokens/validate",
      this.config,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const now = Math.floor(Date.now() / 1000);
    return { valid: response.exp === 0 || response.exp > now, expiry: response.exp };
  }
}
