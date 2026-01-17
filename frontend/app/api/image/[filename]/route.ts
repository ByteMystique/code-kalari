import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ filename: string }> }
) {
    try {
        const { filename } = await params; // await params in newer Next.js versions

        // Target directory: ../gif
        const targetDir = path.resolve(process.cwd(), "../gif");
        const filePath = path.join(targetDir, filename);

        // Security check: ensure filePath is within targetDir to prevent traversal
        if (!filePath.startsWith(targetDir)) {
            return NextResponse.json({ error: "Invalid path" }, { status: 403 });
        }

        if (!existsSync(filePath)) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        const fileBuffer = await readFile(filePath);

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": "image/gif",
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch (error) {
        console.error("Serve Image error:", error);
        return NextResponse.json({ error: "Failed to serve image" }, { status: 500 });
    }
}
