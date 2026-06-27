#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_PROMPT = "Reply with OK only.";

if (require.main === module) {
  main().catch((error) => {
    console.error(`endpoint_audit_failed=${error.message}`);
    process.exit(1);
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const configPath = options.config || process.env.ENDPOINT_AUDITOR_CONFIG;
  if (!configPath) {
    throw new Error("Missing --config or ENDPOINT_AUDITOR_CONFIG.");
  }

  const endpoints = readEndpointConfig(configPath);
  const timeoutMs = Number(options.timeoutMs || process.env.ENDPOINT_AUDITOR_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  const prompt = String(options.prompt || process.env.ENDPOINT_AUDITOR_CHAT_PROMPT || DEFAULT_PROMPT);
  const includeChat = Boolean(options.chat);
  const results = [];

  for (const endpoint of endpoints) {
    results.push(await auditEndpoint(endpoint, { includeChat, prompt, timeoutMs }));
  }

  if (options.json) {
    console.log(JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));
    return;
  }

  printTable(results);
  const failed = results.filter((result) => result.status !== "ok");
  process.exitCode = failed.length > 0 ? 1 : 0;
}

async function auditEndpoint(endpoint, options) {
  const startedAt = Date.now();
  const name = String(endpoint.name || endpoint.baseUrl || "endpoint");
  const baseUrl = normalizeBaseUrl(endpoint.baseUrl);
  const apiKey = resolveApiKey(endpoint);
  const result = {
    name,
    baseUrl,
    status: "ok",
    modelsStatus: "not_run",
    chatStatus: options.includeChat ? "not_run" : "skipped",
    modelCount: 0,
    sampleModels: [],
    errors: [],
    elapsedMs: 0,
  };

  if (!apiKey) {
    result.status = "config_error";
    result.errors.push(`Missing API key env ${endpoint.apiKeyEnv || "(unset)"}`);
    result.elapsedMs = Date.now() - startedAt;
    return result;
  }

  try {
    const modelsPayload = await requestJson(`${baseUrl}/models`, {
      apiKey,
      method: "GET",
      timeoutMs: options.timeoutMs,
    });
    const models = normalizeModels(modelsPayload);
    result.modelsStatus = "ok";
    result.modelCount = models.length;
    result.sampleModels = models.slice(0, 12);
  } catch (error) {
    result.status = "error";
    result.modelsStatus = "error";
    result.errors.push(`models:${error.message}`);
  }

  if (options.includeChat) {
    const model = endpoint.chatModel || result.sampleModels[0];
    if (!model) {
      result.status = "error";
      result.chatStatus = "skipped";
      result.errors.push("chat:no_model_available");
    } else {
      try {
        await requestJson(`${baseUrl}/chat/completions`, {
          apiKey,
          method: "POST",
          timeoutMs: options.timeoutMs,
          body: {
            model,
            messages: [{ role: "user", content: options.prompt }],
            max_tokens: 8,
            temperature: 0,
          },
        });
        result.chatStatus = "ok";
      } catch (error) {
        result.status = "error";
        result.chatStatus = "error";
        result.errors.push(`chat:${error.message}`);
      }
    }
  }

  result.elapsedMs = Date.now() - startedAt;
  return result;
}

async function requestJson(url, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);
  try {
    const response = await fetch(url, {
      method: options.method,
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${options.apiKey}`,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${safeErrorText(text)}`);
    }
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      throw new Error("response_not_json");
    }
  } catch (error) {
    if (error.name === "AbortError") throw new Error("request_timeout");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeModels(payload) {
  const data = Array.isArray(payload?.data) ? payload.data : [];
  return data
    .map((model) => String(model?.id || model || "").trim())
    .filter(Boolean)
    .filter((model, index, list) => list.indexOf(model) === index)
    .sort();
}

function readEndpointConfig(configPath) {
  const resolved = path.resolve(process.cwd(), configPath);
  const raw = fs.readFileSync(resolved, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("Endpoint config must be a JSON array.");
  }
  return parsed.map((entry, index) => {
    if (!entry || typeof entry !== "object") throw new Error(`Endpoint ${index} must be an object.`);
    if (!entry.baseUrl) throw new Error(`Endpoint ${index} is missing baseUrl.`);
    if (!entry.apiKeyEnv) throw new Error(`Endpoint ${index} is missing apiKeyEnv.`);
    return entry;
  });
}

function resolveApiKey(endpoint) {
  const envName = String(endpoint.apiKeyEnv || "").trim();
  return envName ? String(process.env[envName] || "").trim() : "";
}

function normalizeBaseUrl(value) {
  const text = String(value || "").trim();
  if (!/^https?:\/\//i.test(text)) {
    throw new Error(`Invalid baseUrl: ${text}`);
  }
  return text.replace(/\/+$/, "");
}

function parseArgs(args) {
  const output = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--help" || arg === "-h") output.help = true;
    else if (arg === "--json") output.json = true;
    else if (arg === "--chat") output.chat = true;
    else if (arg === "--config") output.config = args[++index];
    else if (arg === "--timeout-ms") output.timeoutMs = args[++index];
    else if (arg === "--prompt") output.prompt = args[++index];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return output;
}

function printHelp() {
  console.log(`OpenAI-compatible endpoint auditor

Usage:
  endpoint-auditor --config examples/endpoints.example.json --json
  endpoint-auditor --config endpoints.local.json --chat

Config entries:
  {
    "name": "demo",
    "baseUrl": "https://example.com/v1",
    "apiKeyEnv": "DEMO_API_KEY",
    "chatModel": "gpt-4o-mini"
  }
`);
}

function printTable(results) {
  for (const result of results) {
    const models = result.sampleModels.length > 0 ? result.sampleModels.join(",") : "-";
    const errors = result.errors.length > 0 ? result.errors.join("; ") : "-";
    console.log(`${result.status}\t${result.name}\tmodels=${result.modelCount}\tchat=${result.chatStatus}\t${result.elapsedMs}ms\t${models}\t${errors}`);
  }
}

function safeErrorText(text) {
  return String(text || "")
    .replace(/sk-[A-Za-z0-9_-]+/g, "[redacted-key]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

module.exports = {
  auditEndpoint,
  normalizeModels,
  parseArgs,
};
