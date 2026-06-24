import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    status: "ready",
    message:
      "This mini project uses local sample analysis. Connect a Claude API call here when you are ready for production analysis."
  });
}
