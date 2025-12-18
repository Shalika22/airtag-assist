export type CfClientConfig = {
  accountId: string;
  apiToken: string;
};

export class CloudflareClient {
  private readonly baseUrl: string;
  private readonly apiToken: string;

  constructor(cfg: CfClientConfig) {
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${cfg.accountId}/ai/run`;
    this.apiToken = cfg.apiToken;
  }

  private modelPath(model: string): string {
    // Cloudflare model IDs look like "@cf/vendor/model-name" and must keep "/" separators in the URL.
    // encodeURIComponent would encode "/" to "%2F" and Cloudflare returns "No route for that URI".
    return model
      .split("/")
      .map((seg) => encodeURIComponent(seg))
      .join("/");
  }

  async run<TResp>(model: string, input: unknown): Promise<TResp> {
    const res = await fetch(`${this.baseUrl}/${this.modelPath(model)}`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.apiToken}`,
        "content-type": "application/json"
      },
      body: JSON.stringify(input)
    });

    const json = (await res.json()) as { success?: boolean; errors?: unknown[]; result?: TResp };
    if (!res.ok || json?.success === false) {
      const errText = JSON.stringify({ status: res.status, errors: json?.errors }, null, 2);
      throw new Error(`Cloudflare Workers AI request failed: ${errText}`);
    }
    if (!json?.result) throw new Error("Cloudflare Workers AI response missing result");
    return json.result;
  }
}


