import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { readFile } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileUrl, fileName } = body;

    if (!fileUrl) {
      return NextResponse.json(
        { error: "File URL is required" },
        { status: 400 }
      );
    }

    let buffer: Buffer;

    // Check if it's a demo file (served from public/demo/)
    if (fileUrl.startsWith("/demo/")) {
      // Read from the public directory
      const filePath = path.join(process.cwd(), "public", fileUrl);
      buffer = await readFile(filePath);
    } else {
      // Fetch from external URL
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    // Extract text from DOCX using mammoth
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;

    // Also get any warnings/messages
    const messages = result.messages.map((m) => m.message);

    return NextResponse.json({
      success: true,
      text,
      fileName: fileName || fileUrl.split("/").pop(),
      characterCount: text.length,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      messages: messages.length > 0 ? messages : undefined,
    });
  } catch (error) {
    console.error("Document extraction error:", error);
    return NextResponse.json(
      {
        error: "Failed to extract document text",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
