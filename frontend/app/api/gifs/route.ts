import { NextResponse } from "next/server";
import { readdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Target directory: ../gif
        const targetDir = path.resolve(process.cwd(), "../gif");

        if (!existsSync(targetDir)) {
            return NextResponse.json([]);
        }

        const files = await readdir(targetDir);

        // Filter for GIFs and create metadata
        const gifs = files
            .filter(file => file.toLowerCase().endsWith(".gif"))
            .map(file => {
                const word = file.replace(".gif", "").replace(/-/g, " ");
                return {
                    filename: file,
                    word: word,
                    url: `/api/image/${file}`,
                };
            });

        return NextResponse.json(gifs);
    } catch (error) {
        console.error("List GIFs error:", error);
        return NextResponse.json({ error: "Failed to list GIFs" }, { status: 500 });
    }
}
