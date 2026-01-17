import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export async function GET() {
    try {
        const jsonPath = path.resolve(process.cwd(), "data/contributions.json");

        if (!existsSync(jsonPath)) {
            return NextResponse.json([]);
        }

        const fileContent = await readFile(jsonPath, "utf-8");
        const contributions = JSON.parse(fileContent);

        return NextResponse.json(contributions);
    } catch (error) {
        console.error("Fetch contributions error:", error);
        return NextResponse.json({ error: "Failed to fetch contributions" }, { status: 500 });
    }
}
