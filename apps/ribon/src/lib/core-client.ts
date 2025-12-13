import { hc } from "hono/client";
import type { AppType as CoreType } from "@/../../core/src/app/api/[[...route]]/route";

const coreUrl = process.env.CORE_API_URL || "";
const coreApiKey = process.env.CORE_API_KEY || "";

export const coreClient = hc<CoreType>(coreUrl, {
  headers: {
    Authorization: `Bearer ${coreApiKey}`,
  },
});
