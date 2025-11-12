import { buildFullPrompt, extractPlaceholders, applyReplacements, mergeRemote } from "../promptUtils";

const sample: any = {
  title: "Test Prompt",
  role: "coach",
  audience: "[buyer] in [market]",
  inputs: "- KPI = [kpi]",
  module: "Module 1 — Lead Generation",
  index: 0,
};

test("buildFullPrompt returns string containing title and audience", () => {
  const txt = buildFullPrompt(sample);
  expect(txt).toEqual(expect.stringContaining("Test Prompt"));
  expect(txt).toEqual(expect.stringContaining("[buyer]"));
});

test("extractPlaceholders finds placeholders in fields and built prompt", () => {
  const toks = extractPlaceholders(sample as any);
  expect(toks).toEqual(expect.arrayContaining(["buyer", "market", "kpi"]));
});

test("applyReplacements substitutes values correctly", () => {
  const txt = buildFullPrompt(sample as any);
  const replaced = applyReplacements(txt, { buyer: "first-time buyer", market: "Denver", kpi: "appointments" });
  expect(replaced).toEqual(expect.stringContaining("first-time buyer"));
  expect(replaced).toEqual(expect.stringContaining("Denver"));
});

test("mergeRemote appends new prompts and avoids duplicates", () => {
  const base = [
    { ...sample, title: "A", module: "Module 1 — Lead Generation", index: 0 },
  ];
  const remote = {
    modules: {
      "Module 1 — Lead Generation": [
        { title: "B", role: "x", deliverable: "y" },
        { title: "A", role: "dup", deliverable: "z" },
      ],
    },
  } as any;
  const merged = mergeRemote(base as any, remote as any);
  const titles = merged.map((m) => m.title);
  expect(titles).toEqual(expect.arrayContaining(["A", "B"]));
  expect(titles.filter((t) => t === "A").length).toBe(1);
});
