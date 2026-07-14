import { afterEach, describe, expect, it, vi } from "vitest";
import { createClient } from "../src/index";

describe("createClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requires an organization", () => {
    expect(() => createClient({ token: "token" })).toThrow(/organization/);
  });

  it("uses async tokens and exposes world token paths separately", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ token: "world-token" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = createClient({
      org: "acme",
      token: async () => "platform-token",
      baseUrl: "https://api.example.test/v1/",
    });

    await expect(client.worlds.createToken("earth")).resolves.toEqual({ token: "world-token" });

    expect(fetchMock).toHaveBeenCalledWith(
      new URL("organizations/acme/worlds/earth/auth/tokens", "https://api.example.test/v1/"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer platform-token" }),
      }),
    );
  });

  it("throws typed API errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({ error: "Nope" }), { status: 401 }),
    ));

    const client = createClient({ org: "acme", token: "bad", baseUrl: "https://api.example.test/v1/" });
    await expect(client.worlds.list()).rejects.toMatchObject({
      name: "WazooClientError",
      message: "Nope",
      status: 401,
    });
  });
});
