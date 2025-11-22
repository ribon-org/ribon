import { defineConfig } from "drizzle-kit";
import { postgresUrl } from "./utils/config/env";

export default defineConfig({
  schema: "./db/schemas/*.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: postgresUrl,
  },
});
