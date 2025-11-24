import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import { existsSync } from "fs";

if (existsSync(".env.local")) {
  config({ path: ".env.local" });
} else {
  config();
}

export default defineConfig({
  schema: "./db/schemas/*.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
  migrations: {
    prefix: "timestamp",
  },
});
