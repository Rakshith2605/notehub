import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const serverPath = `${process.cwd()}/mcp-server/index.mjs`;
  return NextResponse.json({ serverPath });
}
