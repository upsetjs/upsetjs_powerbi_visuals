import cap from "./capabilities.json";
import { writeFile } from "fs/promises";

const out: Record<string, string> = {};

function visit(o: Record<string, unknown>) {
  const keys = Object.keys(o);
  for (const k of keys) {
    if (k.endsWith("Key")) {
      const key = o[k] as string;
      const defaultValue = (o[k.replace("Key", "")] as string) ?? "";
      out[key] = defaultValue;
    } else if (typeof o[k] === "object") {
      visit(o[k] as Record<string, unknown>);
    }
  }
}

visit(cap);
writeFile(
  "./stringResources/en-US/resources.resjson",
  JSON.stringify(out, null, 2),
);
