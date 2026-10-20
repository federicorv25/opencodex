import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { repoPath } from "../helpers/repo-root";
import { FRONTIER_STRINGS } from "../../docs-site/src/data/frontier-i18n";

const root = repoPath("docs-site/src/content/docs");
const source = (path: string): string => readFileSync(path, "utf8").replace(/\r\n/g, "\n");
const config = source(repoPath("docs-site/astro.config.mjs"));
// Use the configured locale directories rather than freezing today's page count.
const localeFolders = new Set([...config.matchAll(/^\s*["']?([a-z]{2}(?:-[a-z]{2})?)["']?:\s*\{\s*label:/gm)]
  .map(match => match[1]!));
function pages(directory: string, canonical = false): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.isDirectory() && canonical && localeFolders.has(entry.name)) return [];
    const path = join(directory, entry.name);
    return entry.isDirectory() ? pages(path).map(child => `${entry.name}/${child}`)
      : /\.mdx?$/.test(entry.name) ? [entry.name] : [];
  }).sort();
}
function codeBlocks(markdown: string): string[] {
  return [...markdown.matchAll(/^(`{3,}|~{3,})[^\n]*\n([\s\S]*?)^\1\s*$/gm)].map(match => match[2]!);
}
function inlineCode(markdown: string): Set<string> {
  const prose = markdown.replace(/^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1\s*$/gm, "");
  const values = new Set<string>();
  const escaped = (at: number): boolean => {
    let slashes = 0;
    for (let i = at - 1; i >= 0 && prose[i] === "\\"; i--) slashes++;
    return slashes % 2 === 1;
  };
  for (let at = 0; at < prose.length; at++) {
    if (prose[at] !== "`" || escaped(at)) continue;
    let length = 1;
    while (prose[at + length] === "`") length++;
    const closing = new RegExp("(?<!`)`{" + length + "}(?!`)", "g");
    closing.lastIndex = at + length;
    let match: RegExpExecArray | null;
    do { match = closing.exec(prose); } while (match && escaped(match.index));
    if (!match || /\n[ \t]*\n/.test(prose.slice(at + length, match.index))) { at += length - 1; continue; }
    // Markdown code spans can cross lines; their rendered whitespace is normalized.
    values.add(prose.slice(at + length, match.index).replace(/\s*\n\s*/g, " ").trim());
    at = match.index + length - 1;
  }
  return values;
}
function missingInlineIdentifiers(english: string, spanish: string): string[] {
  const translated = inlineCode(spanish);
  return [...inlineCode(english)].filter(value => !translated.has(value));
}

describe("Spanish documentation localization", () => {
  test("registers Spanish and covers every current canonical documentation path", () => {
    expect(localeFolders.has("es")).toBe(true);
    expect(config).toMatch(/es:\s*\{\s*label:\s*["']Español["'],\s*lang:\s*["']es["']/);
    const english = pages(root, true);
    expect(english.length).toBeGreaterThan(50);
    expect(pages(join(root, "es"))).toEqual(english);
  });

  test("keeps executable examples and frontmatter in the current English shape", () => {
    for (const path of pages(root, true)) {
      const english = source(join(root, path));
      const spanish = source(join(root, "es", path));
      expect(spanish, path).toMatch(/^---\ntitle:\s*\S/);
      expect(spanish, path).toMatch(/\ndescription:\s*\S/);
      expect(codeBlocks(spanish), `${path} code examples`).toEqual(codeBlocks(english));
      // Exact code spans cover every model family and namespace without a family allowlist.
      expect(missingInlineIdentifiers(english, spanish), `${path} inline and model identifiers`).toEqual([]);
      const htmlCode = (text: string): string[] => [...text.matchAll(/<code\b[^>]*>([\s\S]*?)<\/code>/g)].map(match => match[1]!);
      expect(htmlCode(spanish), `${path} HTML code`).toEqual(htmlCode(english));
      const directives = (text: string): string[] => [...text.matchAll(/^:::(\w*)/gm)].map(match => match[1]!);
      expect(directives(spanish), `${path} admonition structure`).toEqual(directives(english));
      const prose = (text: string): string => text.replace(/^[ \t]*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^[ \t]*\1[ \t]*$/gm, "");
      const tables = (text: string): number => [...prose(text).matchAll(/^\s*\|?\s*:?-{3,}:?\s*\|\s*:?-{3,}:?/gm)].length;
      const items = (text: string): number => [...prose(text).matchAll(/^\s*(?:[-*]|[1-9]\d*\.)\s+/gm)].length;
      expect(tables(spanish), `${path} complete tables`).toBe(tables(english));
      const tableShapes = (text: string): number[][] => prose(text).split(/\n\s*\n/)
        .filter(block => /^\s*\|?\s*:?-{3,}:?\s*\|\s*:?-{3,}:?/m.test(block))
        .map(block => block.split("\n").filter(line => line.trimStart().startsWith("|"))
          .map(line => [...line.matchAll(/(?<!\\)\|/g)].length));
      expect(tableShapes(spanish), `${path} table rows and columns`).toEqual(tableShapes(english));
      expect(items(spanish), `${path} complete instruction lists`).toBeGreaterThanOrEqual(items(english));
      expect(spanish, path).not.toMatch(/ZXQ\d|QXZ|\u2047|\uFFFD/);
      expect(spanish, path).not.toMatch(/locale=["']en["']/);
      expect(relative(root, join(root, "es", path)).replaceAll("\\", "/")).toBe(`es/${path}`);
    }
  });

  test("model identifier parity rejects extended tokens across families and namespaces", () => {
    const identifiers = ["gpt-6-astra", "whisper-1", "claude-opus-5", "o1-mini", "o3-mini", "o4-mini",
      "codex-mini-latest", "qwen/qwen3-coder-plus", "tev1:4b"];
    const canonical = identifiers.map(id => `\`${id}\``).join(", ");
    expect(missingInlineIdentifiers(canonical, canonical)).toEqual([]);
    for (const id of identifiers) {
      const extended = canonical.replace(`\`${id}\``, `\`${id}-translated\``);
      expect(missingInlineIdentifiers(canonical, extended)).toEqual([id]);
    }
  });

  test("landing, language navigation, metadata and benchmark copy include Spanish", () => {
    for (const file of ["Landing.astro", "Header.astro", "SiteJsonLd.astro"]) {
      const text = source(repoPath(`docs-site/src/components/${file}`));
      expect(text, file).toContain("'es'");
    }
    expect(source(join(root, "es/index.mdx"))).toContain('<Landing locale="es" />');
    expect(source(repoPath("docs-site/src/components/Header.astro"))).toContain("Español");
    expect(source(repoPath("docs-site/src/data/frontier-i18n.ts"))).toMatch(/\bes:\s*\{/);
  });

  test("benchmark names and placeholders retain their canonical meaning", () => {
    const english = FRONTIER_STRINGS.en;
    const spanish = FRONTIER_STRINGS.es;
    expect(Object.keys(spanish).sort()).toEqual(Object.keys(english).sort());
    for (const key of Object.keys(english) as (keyof typeof english)[]) {
      expect(spanish[key].trim(), key).not.toBe("");
      expect(spanish[key].match(/\{\w+\}/g) ?? [], key).toEqual(english[key].match(/\{\w+\}/g) ?? []);
      if (key.endsWith(".title")) expect(spanish[key], key).toBe(english[key]);
    }
  });

  test("documents the current archive limits and recoverable refusal codes", () => {
    const spanish = source(join(root, "es/reference/configuration/server.md"));
    expect(spanish).toContain('<a id="native-reasoning-retention"></a>');
    for (const value of ["512 MiB", "256", "reasoning_archive_quota_exceeded", "reasoning_archive_busy", "reasoning_archive_unavailable"]) {
      expect(spanish).toContain(value);
    }
  });
});
