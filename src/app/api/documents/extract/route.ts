import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { readFile } from "fs/promises";
import path from "path";

async function extractTextFromBuffer(buffer: Buffer, fileName: string): Promise<{
  text: string;
  messages: string[];
}> {
  const ext = fileName.toLowerCase().split(".").pop();

  if (ext === "txt") {
    return { text: buffer.toString("utf-8"), messages: [] };
  }

  if (ext === "docx" || ext === "doc") {
    const result = await mammoth.extractRawText({ buffer });
    return {
      text: result.value,
      messages: result.messages.map((m) => m.message),
    };
  }

  throw new Error(
    `Unsupported file type: .${ext}. Please upload a .docx or .txt file.`
  );
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let buffer: Buffer;
    let fileName: string;

    if (contentType.includes("multipart/form-data")) {
      // ---------- FormData path (user-uploaded file) ----------
      const formData = await request.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json(
          { error: "No file provided in form data" },
          { status: 400 }
        );
      }

      fileName = file.name;
      const ext = fileName.toLowerCase().split(".").pop();

      if (ext === "pdf") {
        return NextResponse.json(
          {
            error:
              "PDF extraction is not supported. Please upload a .docx or .txt file.",
          },
          { status: 422 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      // ---------- JSON path (fileUrl reference – existing behavior) ----------
      const body = await request.json();
      const { fileUrl, fileName: providedName } = body;

      if (!fileUrl) {
        return NextResponse.json(
          { error: "File URL is required" },
          { status: 400 }
        );
      }

      fileName = providedName || fileUrl.split("/").pop() || "unknown";

      if (fileUrl.startsWith("/demo/")) {
        const filePath = path.join(process.cwd(), "public", fileUrl);
        buffer = await readFile(filePath);
      } else {
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      }
    }

    const { text, messages } = await extractTextFromBuffer(buffer, fileName);

    return NextResponse.json({
      success: true,
      text,
      fileName,
      characterCount: text.length,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      messages: messages.length > 0 ? messages : undefined,
    });
  } catch (error) {
    console.error("Document extraction error:", error);

    const message =
      error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("Unsupported file type") ? 422 : 500;

    return NextResponse.json(
      {
        error: "Failed to extract document text",
        details: message,
      },
      { status }
    );
  }
}
