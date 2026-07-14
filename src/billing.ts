import { WazooClient } from "./client";
import { WazooConfig, resolveOrganization } from "./config";

export interface BillingSummary {
  organization: string;
  plan?: string;
  status?: string;
  [key: string]: unknown;
}

export interface Invoice {
  id: string;
  amountDue?: number;
  currency?: string;
  status?: string;
  invoicePdf?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface BillingPortalSession {
  url: string;
}

export class BillingClient {
  constructor(private config: WazooConfig) {}

  private get org(): string {
    return resolveOrganization(this.config);
  }

  async get(): Promise<BillingSummary> {
    const response = await WazooClient.request<{ billing: BillingSummary }>(
      `organizations/${this.org}/billing`,
      this.config,
    );
    return response.billing;
  }

  async invoices(): Promise<Invoice[]> {
    const response = await WazooClient.request<{ invoices: Invoice[] }>(
      `organizations/${this.org}/billing/invoices`,
      this.config,
    );
    return response.invoices ?? [];
  }

  async createPortalSession(returnUrl?: string): Promise<BillingPortalSession> {
    return await WazooClient.request<BillingPortalSession>(
      `organizations/${this.org}/billing/portal`,
      this.config,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ returnUrl }),
      },
    );
  }
}
