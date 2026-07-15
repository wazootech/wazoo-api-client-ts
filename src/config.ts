export type WazooToken = string | (() => Promise<string>);

export interface WazooConfig {
  /** Public organization resource ID, for example `acme` or `organizations/acme`. */
  organization: string;
  token: WazooToken;
  baseUrl?: string;
}

export function resolveOrganization(config: WazooConfig): string {
  const organization = config.organization;
  if (!organization) {
    throw new Error("You must provide an organization resource ID (organization)");
  }
  return organization.startsWith("organizations/") ? organization.slice("organizations/".length) : organization;
}

export async function resolveToken(config: WazooConfig): Promise<string> {
  return typeof config.token === "function" ? await config.token() : config.token;
}
