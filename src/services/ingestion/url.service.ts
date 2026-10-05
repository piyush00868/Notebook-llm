export async function extractUrlText(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch URL: ${response.status}`,
    );
  }

  const html = await response.text();

  // Temporary: we'll replace this with proper
  // readable-content extraction next.
  return html;
}