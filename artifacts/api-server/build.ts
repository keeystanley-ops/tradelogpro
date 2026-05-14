import path from "path";
import { fileURLToPath } from "url";
import { build as esbuild } from "esbuild";
import { rm, readFile } from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times without risking some
// packages that are not bundle compatible
const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  const distDir = path.resolve(__dirname, "dist");
  await rm(distDir, { recursive: true, force: true });

  console.log("building server...");
  
  const commonConfig: any = {
    bundle: true,
    platform: "node",
    format: "cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    logLevel: "info",
    // We only externalize truly native modules if any, but pg is usually fine bundled as JS.
    // drizzle-orm and other deps should be bundled.
  };

  await esbuild({
    ...commonConfig,
    entryPoints: [path.resolve(__dirname, "src/index.ts")],
    outfile: path.resolve(distDir, "index.cjs"),
  });

  console.log("building app for vercel...");
  await esbuild({
    ...commonConfig,
    entryPoints: [path.resolve(__dirname, "src/app.ts")],
    outfile: path.resolve(distDir, "vercel-app.cjs"),
  });

  console.log("building final vercel entry...");
  await esbuild({
    ...commonConfig,
    entryPoints: [path.resolve(__dirname, "src/vercel.ts")],
    outfile: path.resolve(distDir, "vercel-entry.cjs"),
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
