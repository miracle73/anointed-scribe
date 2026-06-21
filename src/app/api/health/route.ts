export async function GET() {
  const key = process.env.OPENROUTER_API_KEY ?? "";
  return Response.json({ keySet: key.startsWith("sk-or-") });
}
