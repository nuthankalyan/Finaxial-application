import { NextRequest, NextResponse } from 'next/server';

const notImplementedResponse = NextResponse.json(
  { success: false, message: 'Not implemented - using sample data' },
  { status: 501 }
);

export async function GET(request: NextRequest): Promise<NextResponse> {
  return notImplementedResponse;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return notImplementedResponse;
}
