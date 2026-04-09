import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";

const client = new Anthropic();

const COMPONENTS_DIR = process.argv[2] ?? "./src/components";

const getAllFiles = (dir: string, exts = [".tsx", ".ts"]): string[] => {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...getAllFiles(full, exts));
    else if (exts.some(e => entry.name.endsWith(e))) results.push(full);
  }
  return results;
};

const analyzeFile = async (
  filePath: string,
  allFiles: string[],
  allFileNames: string[]
): Promise<void> => {
  const code = fs.readFileSync(filePath, "utf-8");
  const relativePath = path.relative(COMPONENTS_DIR, filePath);

  console.log(`\n${"─".repeat(80)}`);
  console.log(`📄 ${relativePath}`);
  console.log(`${"─".repeat(80)}`);

  const prompt = `You are analyzing a React component file as part of a component library audit.

FILE: ${relativePath}

FULL SOURCE CODE:
\`\`\`tsx
${code}
\`\`\`

ALL OTHER COMPONENT FILES IN THE LIBRARY (names only):
${allFileNames.filter(f => f !== relativePath).join("\n")}

Answer BOTH questions concisely:

1. SPLIT: List every distinct UI element or logical unit inside this file that could be extracted into its own reusable component. For each, give:
   - name
   - what it does in 1 sentence
   - how many times it appears in this file (or "pattern repeated across codebase")

2. REUSE: List every place in this file where an inline HTML element or pattern could be replaced by an already-existing component from the library list above. For each, give:
   - the existing component name
   - what it would replace in this file
   - confidence: high / medium / low

If nothing applies to either question, say "none".`;

  process.stdout.write("\n");

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  for await (const chunk of stream) {
    if (
      chunk.type === "content_block_delta" &&
      chunk.delta.type === "text_delta"
    ) {
      process.stdout.write(chunk.delta.text);
    }
  }

  process.stdout.write("\n");
};

const main = async () => {
  if (!fs.existsSync(COMPONENTS_DIR)) {
    console.error(`Directory not found: ${COMPONENTS_DIR}`);
    console.error(`Usage: npx ts-node analyze-components.ts ./src/components`);
    process.exit(1);
  }

  const allFiles = getAllFiles(COMPONENTS_DIR);
  const allFileNames = allFiles.map(f => path.relative(COMPONENTS_DIR, f));

  console.log(`\n🔍 Analyzing ${allFiles.length} component files in ${COMPONENTS_DIR}\n`);

  for (const filePath of allFiles) {
    await analyzeFile(filePath, allFiles, allFileNames);
  }

  console.log(`\n${"─".repeat(80)}`);
  console.log(`✅ Done — analyzed ${allFiles.length} files`);
  console.log(`${"─".repeat(80)}\n`);
};

main().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});