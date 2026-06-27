const { auditEndpoint } = require("../bin/endpoint-auditor.cjs");

async function main() {
  const originalFetch = globalThis.fetch;
  process.env.MOCK_API_KEY = "sk-mock";
  globalThis.fetch = async (url, options = {}) => {
    const parsedUrl = new URL(String(url));
    const body = options.body ? JSON.parse(String(options.body)) : null;
    if (parsedUrl.pathname === "/v1/models") {
      return jsonResponse(200, { data: [{ id: "mock-chat" }, { id: "mock-vision" }] });
    }
    if (parsedUrl.pathname === "/v1/chat/completions" && body?.model === "mock-chat") {
      return jsonResponse(200, { choices: [{ message: { content: "OK" } }] });
    }
    return jsonResponse(404, { error: { message: "not found" } });
  };

  const result = await auditEndpoint({
    name: "mock",
    baseUrl: "https://mock.local/v1",
    apiKeyEnv: "MOCK_API_KEY",
    chatModel: "mock-chat",
  }, {
    includeChat: true,
    prompt: "Reply with OK only.",
    timeoutMs: 1000,
  });
  globalThis.fetch = originalFetch;

  if (result.status !== "ok" || result.modelCount !== 2 || result.chatStatus !== "ok") {
    console.error(`unexpected_mock_result=${JSON.stringify(result)}`);
    process.exit(1);
  }

  console.log("mock_smoke_ok=true");
}

function jsonResponse(status, payload) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(payload),
  };
}

main().catch((error) => {
  if (globalThis.fetch && error) {
    // Keep the original error visible while avoiding extra test dependencies.
  }
  console.error(error);
  process.exit(1);
});
