import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command, mode }) => {
  const loadedEnv = loadEnv(mode, process.cwd(), "");
  const parserEndpoint = Object.hasOwn(process.env, "VITE_GEOMETRY_PARSER_ENDPOINT")
    ? process.env.VITE_GEOMETRY_PARSER_ENDPOINT
    : loadedEnv.VITE_GEOMETRY_PARSER_ENDPOINT;
  if (command === "build" && mode === "production" && !parserEndpoint?.trim()) {
    throw new Error("VITE_GEOMETRY_PARSER_ENDPOINT is required for production builds.");
  }

  return {
    build: {
      outDir: "dist/client",
    },
    optimizeDeps: {
      include: ["react", "react-dom/client"],
    },
    server: {
      host: "0.0.0.0",
      allowedHosts: ["terminal.local"],
      warmup: {
        clientFiles: ["./src/main.jsx"],
      },
    },
    plugins: [react()],
  };
});
