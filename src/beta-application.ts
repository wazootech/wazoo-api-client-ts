import { WazooClient, WazooClientError } from "./client";
import { WazooConfig } from "./config";
import type { Organization } from "./organization";

export interface BetaApplication {
  name: string;
  uid: string;
  email: string;
  applicantName: string;
  company?: string;
  useCase: string;
  state: "PENDING" | "APPROVED" | "REJECTED";
  organizationUid?: string;
  reviewerTokenUid?: string;
  reviewNote?: string;
  createTime?: string;
  updateTime?: string;
  reviewTime?: string;
}

export interface SubmitBetaApplicationInput {
  email: string;
  applicantName: string;
  company?: string;
  useCase: string;
  turnstileToken: string;
}

export interface ApproveBetaApplicationInput {
  organizationId: string;
  displayName?: string;
  reviewNote?: string;
}

export class BetaApplicationClient {
  constructor(private config: WazooConfig) {}

  async list(options: { state?: BetaApplication["state"] } = {}): Promise<BetaApplication[]> {
    const query = options.state ? `?state=${options.state}` : "";
    const response = await WazooClient.request<{ applications: BetaApplication[] }>(`betaApplications${query}`, this.config);
    return response.applications ?? [];
  }

  async approve(applicationUid: string, input: ApproveBetaApplicationInput): Promise<{ application: BetaApplication; organization: Organization }> {
    return await WazooClient.request<{ application: BetaApplication; organization: Organization }>(`betaApplications/${applicationUid}:approve`, this.config, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
  }

  async reject(applicationUid: string, reviewNote?: string): Promise<void> {
    await WazooClient.request<void>(`betaApplications/${applicationUid}:reject`, this.config, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reviewNote }),
    });
  }
}

export async function submitBetaApplication(input: SubmitBetaApplicationInput, baseUrl = "https://api.wazoo.dev/v1/"): Promise<BetaApplication> {
  const response = await fetch(new URL("betaApplications", baseUrl), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await response.json().catch(() => null) as { application?: BetaApplication; error?: { message?: string; code?: string } } | null;
  if (!response.ok) {
    throw new WazooClientError(body?.error?.message ?? `Request failed with status ${response.status}`, response.status, { code: body?.error?.code });
  }
  if (!body?.application) {
    throw new WazooClientError("Missing beta application response", response.status);
  }
  return body.application;
}
