import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * Direct file download endpoint
 * Serves the AutoLabel-Setup.exe file directly
 */
export async function GET(req: NextRequest) {
  try {
    const filePath = join(process.cwd(), "public", "downloads", "AutoLabel-Setup.exe");
    
    // Check if file exists
    const fs = await import("fs");
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "Download-Datei nicht gefunden" },
        { status: 404 }
      );
    }

    // Read file
    const fileBuffer = fs.readFileSync(filePath);

    // Return file with proper headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": 'attachment; filename="AutoLabel-Setup.exe"',
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("File download error:", error);
    return NextResponse.json(
      { error: "Fehler beim Herunterladen der Datei" },
      { status: 500 }
    );
  }
}

