import { NextResponse } from 'next/server';
import { LANGUAGES } from '@/lib/languages';

export async function GET() {
  return NextResponse.json({
    noteTypes: LANGUAGES.map((lang) => ({
      id: lang.value,
      label: lang.label,
    })),
  });
}
