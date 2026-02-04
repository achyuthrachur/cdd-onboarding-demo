import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

// Pre-loaded demo documents (available at /demo/ URLs)
const DEMO_DOCUMENTS = [
  {
    id: "demo-doc-1",
    docType: "flu_global",
    jurisdiction: null,
    fileName: "CIP CDD Procedures (Mock).docx",
    fileUrl: "/demo/CIP CDD Procedures (Mock).docx",
    fileHash: null,
    uploadedAt: "2024-01-15T10:00:00.000Z",
  },
  {
    id: "demo-doc-2",
    docType: "global_std_new",
    jurisdiction: null,
    fileName: "Global Financial Standards (Mock) (5).docx",
    fileUrl: "/demo/Global Financial Standards (Mock) (5).docx",
    fileHash: null,
    uploadedAt: "2024-01-15T10:05:00.000Z",
  },
];

// In-memory store for user-uploaded documents (in addition to demo docs)
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

    // Start with user-uploaded documents
    let documents = Array.from(documentsStore.values());

    if (auditRunId) {
      documents = documents.filter((doc) => doc.auditRunId === auditRunId);

      // Always include demo documents for any audit run
      const demoDocsForRun = DEMO_DOCUMENTS.map(doc => ({
        ...doc,
        auditRunId,
      }));
      documents = [...demoDocsForRun, ...documents];
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

    // Don't allow deleting demo documents
    if (id.startsWith("demo-doc-")) {
      return NextResponse.json(
        { error: "Cannot delete demo documents" },
        { status: 403 }
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
