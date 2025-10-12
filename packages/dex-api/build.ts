import { mapFilter } from "@rhiva-ag/shared";
import "dotenv/config";
import tsup from "tsup";

export default tsup.build({
  entry: ["src/index.browser.ts"],
  format: ["cjs", "esm"],
  env: Object.fromEntries(
    mapFilter(Object.entries(process.env), ([key, value]) =>
      value ? [key, value] : null,
    ),
  ),
});
