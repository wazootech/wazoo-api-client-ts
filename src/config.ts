export type WazooToken = string | (() => Promise<string>);

export interface WazooConfig {
  /** Organization slug. Provide either `org` or `orgId`. */
  org?: string;
  /** Organization id. Takes precedence over `org` when both are provided. */
  orgId?: string;
  token: WazooToken;
  baseUrl?: string;
}

export function resolveOrganization(config: WazooConfig): string {
  const organization = config.orgId ?? config.org;
  if (!organization) {
    throw new Error("You must provide an organization slug (org) or id (orgId)");
  }
  return organization;
}

export async function resolveToken(config: WazooConfig): Promise<string> {
  return typeof config.token === "function" ? await config.token() : config.token;
}
