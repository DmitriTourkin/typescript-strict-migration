// Проверки самого проекта: всё ли переведено на TypeScript и включён ли строгий режим.
import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import ts from "typescript";

const REQUIRED_FILES = [
  "money.ts",
  "order.ts",
  "result.ts",
  "api.ts",
  "schemas.ts",
  "report.ts",
  "main.ts",
  "ui/dom.ts",
  "ui/render.ts",
  "ui/app.ts",
];

// Все файлы внутри src, включая вложенные папки: ["money.ts", "ui/app.ts", ...]
function sourceFiles(dir = "src", prefix = ""): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? sourceFiles(join(dir, entry.name), `${prefix}${entry.name}/`)
      : [`${prefix}${entry.name}`],
  );
}

function readTsconfig(): Record<string, unknown> {
  const { config, error } = ts.readConfigFile("tsconfig.json", ts.sys.readFile);
  if (error) throw new Error(ts.flattenDiagnosticMessageText(error.messageText, "\n"));
  return (config as { compilerOptions: Record<string, unknown> }).compilerOptions;
}

// Запускает компилятор и возвращает его вывод (пустая строка — ошибок нет).
function runTsc(project: string): string {
  try {
    execSync(`npx tsc --noEmit -p ${project}`, { stdio: "pipe" });
    return "";
  } catch (e) {
    const out = e as { stdout?: Buffer; stderr?: Buffer };
    return `${out.stdout?.toString() ?? ""}${out.stderr?.toString() ?? ""}`;
  }
}

describe("6. Проект переведён на строгий TypeScript", () => {
  test("в src не осталось .js файлов", () => {
    const jsFiles = sourceFiles().filter((f) => f.endsWith(".js"));
    expect(jsFiles, "Эти файлы ещё нужно перевести на TypeScript").toEqual([]);
  });

  test("все модули есть в виде .ts файлов", () => {
    const missing = REQUIRED_FILES.filter((f) => !existsSync(`src/${f}`));
    expect(missing, "Этих файлов не хватает").toEqual([]);
  });

  test("index.html подключает src/main.ts", () => {
    expect(readFileSync("index.html", "utf8")).toContain('src="/src/main.ts"');
  });

  test("zod установлен как зависимость", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { dependencies?: Record<string, string> };
    expect(pkg.dependencies?.zod, "Выполните: npm install zod").toBeDefined();
  });

  test("в tsconfig.json включён строгий режим", () => {
    const options = readTsconfig();
    expect(options.strict).toBe(true);
    expect(options.noImplicitReturns).toBe(true);
    expect(options.noFallthroughCasesInSwitch).toBe(true);
    expect(options.noUncheckedIndexedAccess).toBe(true);
    expect(options.allowJs ?? false).toBe(false);
  });

  test("отдельные проверки строгого режима не выключены", () => {
    const options = readTsconfig();
    const strictFlags = [
      "noImplicitAny",
      "strictNullChecks",
      "strictFunctionTypes",
      "strictBindCallApply",
      "strictPropertyInitialization",
      "noImplicitThis",
      "useUnknownInCatchVariables",
      "alwaysStrict",
    ];
    const disabled = strictFlags.filter((flag) => options[flag] === false);
    expect(disabled, "Эти проверки выключены в tsconfig.json").toEqual([]);
  });

  test("в коде нет any и подавления ошибок компилятора", () => {
    const forbidden = [
      { pattern: /(:\s*any\b|\bas\s+any\b|<any>|\bany\[\]|<any,|,\s*any>)/, why: "тип any" },
      { pattern: /@ts-(ignore|nocheck|expect-error)/, why: "подавление ошибок компилятора" },
    ];
    const problems: string[] = [];
    for (const file of sourceFiles().filter((f) => f.endsWith(".ts"))) {
      readFileSync(`src/${file}`, "utf8")
        .split("\n")
        .forEach((line, i) => {
          for (const { pattern, why } of forbidden) {
            if (pattern.test(line)) problems.push(`src/${file}:${i + 1} — ${why}: ${line.trim()}`);
          }
        });
    }
    expect(problems).toEqual([]);
  });

  test("npm run typecheck проходит без ошибок", () => {
    expect(runTsc("tsconfig.json")).toBe("");
  });

  test("типы соответствуют контракту (tests/types/contract.ts)", () => {
    expect(runTsc("tests/types/tsconfig.json")).toBe("");
  });
});
