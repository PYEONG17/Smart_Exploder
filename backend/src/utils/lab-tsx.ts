import { readFile } from "node:fs/promises";
import { build, type Plugin } from "esbuild";
import { AppError } from "./app-error.js";

const TAILWIND_BROWSER_SCRIPT =
  "https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4";

const LAB_TELEMETRY_SCRIPT = `<script>
(() => {
  const source = "smart-explorer-lab";
  const previousOutputs = new Map();
  const changedOutputs = new Set();
  let sendTimer;

  const readNumber = (text) => {
    const match = text.match(/-?\\d+(?:[.,]\\d+)?/);
    if (!match) return null;
    const value = Number(match[0].replace(",", "."));
    return Number.isFinite(value) ? value : null;
  };

  const readControls = () =>
    Array.from(document.querySelectorAll('input[type="range"], input[type="number"], select'))
      .slice(0, 40)
      .map((control, index) => {
        const row = control.parentElement;
        const labelRow = row?.previousElementSibling;
        const label = control.getAttribute("aria-label") ||
          control.labels?.[0]?.textContent?.trim() ||
          labelRow?.querySelector("label")?.textContent?.trim() ||
          labelRow?.textContent?.trim() ||
          control.name ||
          "Parameter " + (index + 1);
        const unit = label.match(/[([]([^()[\\]]+)[)\\]]/)?.[1]?.trim() || "";
        const numericValue = readNumber(control.value);
        if (numericValue === null) return null;
        return {
          id: control.id || control.name || "control-" + index,
          label: label.replace(/\\s+/g, " ").slice(0, 120),
          value: numericValue,
          unit: unit.slice(0, 30)
        };
      })
      .filter(Boolean);

  const readOutputs = () => {
    const textNodes = Array.from(document.querySelectorAll("svg text"));
    const currentOutputs = new Map();
    textNodes.forEach((element, index) => {
      const text = (element.textContent || "").trim().replace(/\\s+/g, " ");
      const value = readNumber(text);
      if (value === null) return;
      const id = "svg-output-" + index;
      const previous = element.previousElementSibling;
      const label = previous?.tagName.toLowerCase() === "text"
        ? (previous.textContent || "").trim().replace(/\\s+/g, " ")
        : "Simulation result " + (index + 1);
      currentOutputs.set(id, { id, label: label.slice(0, 120), value, unit: text.replace(/^-?\\d+(?:[.,]\\d+)?\\s*/, "").slice(0, 30) });
      if (previousOutputs.has(id) && previousOutputs.get(id) !== text) {
        changedOutputs.add(id);
      }
      previousOutputs.set(id, text);
    });
    return Array.from(changedOutputs)
      .map((id) => currentOutputs.get(id))
      .filter(Boolean)
      .slice(0, 40);
  };

  const publish = () => {
    const parameters = readControls();
    const outputs = readOutputs();
    window.parent.postMessage(
      { source, type: "telemetry", parameters, outputs },
      "*"
    );
  };

  const schedulePublish = () => {
    window.clearTimeout(sendTimer);
    sendTimer = window.setTimeout(publish, 120);
  };

  document.addEventListener("input", schedulePublish, true);
  document.addEventListener("change", schedulePublish, true);
  const observer = new MutationObserver(schedulePublish);
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    characterData: true
  });
  window.setTimeout(publish, 0);
})();
</script>`;

export async function compileLabTsxFile(filePath: string): Promise<string> {
  const source = await readFile(filePath, "utf8");
  const plugin: Plugin = {
    name: "lab-tsx-entry",
    setup(builder) {
      builder.onResolve({ filter: /^lab-entry$/ }, () => ({
        path: "lab-entry",
        namespace: "lab-tsx",
      }));
      builder.onResolve({ filter: /^lab-upload$/ }, () => ({
        path: "lab-upload",
        namespace: "lab-tsx",
      }));
      builder.onResolve({ filter: /.*/, namespace: "lab-tsx" }, (args) => {
        if (
          ["react", "react-dom", "react/jsx-runtime", "react-dom/client"].includes(
            args.path,
          )
        ) {
          return undefined;
        }
        return {
          errors: [
            {
              text: `TSX Labs can only import React packages. Remove unsupported import "${args.path}".`,
            },
          ],
        };
      });
      builder.onLoad({ filter: /.*/, namespace: "lab-tsx" }, ({ path }) => ({
        contents:
          path === "lab-entry"
            ? [
                'import React from "react";',
                'import { createRoot } from "react-dom/client";',
                'import Simulation from "lab-upload";',
                'const root = document.getElementById("root");',
                'if (!root) throw new Error("Simulation mount point is missing");',
                "createRoot(root).render(React.createElement(Simulation));",
              ].join("\n")
            : source,
        loader: "tsx",
        resolveDir: process.cwd(),
      }));
    },
  };

  let bundle: string;
  try {
    const result = await build({
      absWorkingDir: process.cwd(),
      entryPoints: ["lab-entry"],
      bundle: true,
      write: false,
      format: "iife",
      platform: "browser",
      target: ["es2020"],
      jsx: "automatic",
      minify: true,
      legalComments: "none",
      plugins: [plugin],
    });
    const output = result.outputFiles[0];
    if (!output) throw new Error("The TSX compiler did not produce browser code.");
    bundle = output.text.replace(/<\/script/gi, "<\\/script");
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown compilation error";
    throw new AppError(`Could not compile this TSX Lab: ${detail}`, 400);
  }

  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="${TAILWIND_BROWSER_SCRIPT}"></script>
</head>
<body>
  <div id="root"></div>
  ${LAB_TELEMETRY_SCRIPT}
  <script>${bundle}</script>
</body>
</html>`;
}
