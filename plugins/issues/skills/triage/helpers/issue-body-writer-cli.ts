import { readFileSync, realpathSync, statSync, lstatSync, unlinkSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { upsertIssueRationale } from "./upsert-issue-rationale.ts";
function alias(a: string, b: string) {
  if (resolve(a) === resolve(b)) return true;
  try { const x = statSync(a), y = statSync(b); return realpathSync(a) === realpathSync(b) || x.ino === y.ino && x.dev === y.dev; } catch { return false; }
}
export function writeRationaleFile(bodyPath: string, rationalePath: string, outPath: string) {
  if (alias(bodyPath, outPath) || alias(rationalePath, outPath)) throw new Error("Output must not alias an input");
  try { if (!lstatSync(outPath).isFile()) throw new Error("Output must be a regular file"); } catch (error: any) { if (error.code !== "ENOENT") throw error; }
  try {
    const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
    const result = upsertIssueRationale(decoder.decode(readFileSync(bodyPath)), decoder.decode(readFileSync(rationalePath)));
    writeFileSync(outPath, result); return result;
  } catch (error) { try { unlinkSync(outPath); } catch {} throw error; }
}
