import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

// In-memory store for demo (replace with database in production)
const documentsStore: Map<string, {
  id: string;
  auditRunId: string;
  docType: string;
  jurisdiction: string | null;
  fileName: string;
  fileUrl: string;
  fileHash: string | null;
  uploadedAt: string;
}> = new Map();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const auditRunId = searchParams.get("auditRunId");

    let documents = Array.from(documentsStore.values());

    if (auditRunId) {
      documents = documents.filter((doc) => doc.auditRunId === auditRunId);
    }

    documents.sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const auditRunId = formData.get("auditRunId") as string;
    const docType = formData.get("docType") as string;
    const jurisdiction = formData.get("jurisdiction") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!auditRunId) {
      return NextResponse.json(
        { error: "Audit run ID is required" },
        { status: 400 }
      );
    }

    if (!docType) {
      return NextResponse.json(
        { error: "Document type is required" },
        { status: 400 }
      );
    }

    // For demo: store file info without actual upload
    // In production, upload to Vercel Blob
    const id = uuidv4();
    const document = {
      id,
      auditRunId,
      docType,
      jurisdiction: jurisdiction || null,
      fileName: file.name,
      fileUrl: `/api/documents/${id}/download`, // Placeholder URL
      fileHash: null,
      uploadedAt: new Date().toISOString(),
    };

    documentsStore.set(id, document);

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Error uploading document:", error);
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    if (!documentsStore.has(id)) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    documentsStore.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
