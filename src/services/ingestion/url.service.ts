import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

export async function extractUrlText(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch URL: ${response.status}`,
    );
  }

  const html = await response.text();

  const dom = new JSDOM(html, {
    url,
  });

  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article?.textContent) {
    throw new Error("Could not extract readable content");
  }

  return {
    title: article.title ?? null,
    content: article.textContent,
  };
}