import { NextResponse } from "next/server";
import {
  createVersionRecord,
  deleteVersionRecord,
  listVersions,
} from "@/lib/db/repository";
import { createVersion } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET() {
  try {
    const versions = await listVersions();
    return NextResponse.json(versions);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load versions" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const title = typeof body.title === "string" ? body.title : undefined;
    const version = createVersion(content, title);
    const saved = await createVersionRecord(version);
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save version" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const deleted = await deleteVersionRecord(id);
    if (!deleted) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete version" },
      { status: 500 },
    );
  }
}
