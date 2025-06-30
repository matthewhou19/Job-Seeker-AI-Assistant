import { Ollama } from "@langchain/ollama";

export const OllamaClient = new Ollama({
  model: "mistral", // or "mistral:latest"
  temperature: 0.7,
  maxRetries: 2,
  // host/port only if you’ve changed defaults:
  // baseUrl: "http://127.0.0.1:11434",
});
