import fs from "fs";
import path from "path";

export function loadWhitelist() {
  const filePath = path.resolve("whitelist.txt");

  const data = fs.readFileSync(filePath, "utf-8");

  return data
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map(Number);
}
