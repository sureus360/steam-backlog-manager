import { defineConfig } from "prisma/config";
import path from "node:path";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: `file:${path.resolve(process.cwd(), "prisma", "dev.db")}`,
  },
});
