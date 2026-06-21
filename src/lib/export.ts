import { mdToHtml } from "@/components/ui";

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60) || "manuscript";

export function downloadMarkdown(title: string, body: string) {
  save(new Blob([body], { type: "text/markdown" }), `${slug(title)}.md`);
}

export function downloadDoc(title: string, body: string) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
  <style>body{font-family:Georgia,serif;line-height:1.7;font-size:12pt;}
  h1{font-size:20pt}h2{font-size:15pt}blockquote{border-left:3px solid #b8893a;padding-left:12px;font-style:italic;color:#555}</style>
  </head><body>${mdToHtml(body)}</body></html>`;
  save(new Blob(["﻿", html], { type: "application/msword" }), `${slug(title)}.doc`);
}

export async function copyText(body: string) {
  await navigator.clipboard.writeText(body);
}

/** Compile multiple chapters into one bound manuscript and download as .doc */
export function downloadBook(
  title: string,
  subtitle: string,
  chapters: { title: string; body: string }[],
) {
  const toc = chapters.map((c, i) => `<li>${i + 1}. ${c.title}</li>`).join("");
  const inner = chapters
    .map((c) => `<div style="page-break-before:always">${mdToHtml(c.body)}</div>`)
    .join("\n");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
  <style>body{font-family:Georgia,serif;line-height:1.7;font-size:12pt;}
  h1{font-size:22pt}h2{font-size:15pt}blockquote{border-left:3px solid #b8893a;padding-left:12px;font-style:italic;color:#555}
  .title-page{text-align:center;margin-top:30%}</style></head><body>
  <div class="title-page"><h1>${title}</h1><p style="font-size:14pt;color:#555">${subtitle}</p></div>
  <div style="page-break-before:always"><h1>Contents</h1><ol style="list-style:none;padding:0">${toc}</ol></div>
  ${inner}</body></html>`;
  const fn = (title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "book") + ".doc";
  const url = URL.createObjectURL(new Blob(["﻿", html], { type: "application/msword" }));
  const a = document.createElement("a");
  a.href = url; a.download = fn; a.click();
  URL.revokeObjectURL(url);
}
