import { NextRequest, NextResponse } from "next/server";
import { writeFile, readFile } from "fs/promises";
import path from "path";
import { existsSync, mkdirSync } from "fs";

export async function POST(request: NextRequest) {
    try {
        const data = await request.formData();
        const file: File | null = data.get("file") as unknown as File;
        const word: string | null = data.get("word") as unknown as string;
        const user: string = (data.get("user") as unknown as string) || "Contributor";

        if (!file || !word) {
            return NextResponse.json({ success: false, message: "Missing file or word" }, { status: 400 });
        }

        // Basic validation
        if (!file.name.toLowerCase().endsWith(".gif")) {
            return NextResponse.json({ success: false, message: "Only GIF files are allowed" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Sanitize word (lowercase, alphanumeric)
        const sanitizedWord = word.toLowerCase().trim().replace(/[^a-z0-9]/g, "");

        if (!sanitizedWord) {
            return NextResponse.json({ success: false, message: "Invalid word" }, { status: 400 });
        }

        // Target directory: ../gif
        const targetDir = path.resolve(process.cwd(), "../gif");

        // Ensure directory exists
        if (!existsSync(targetDir)) {
            console.log(`Directory ${targetDir} does not exist, creating...`);
            try {
                mkdirSync(targetDir, { recursive: true });
            } catch (e) {
                console.error("Failed to create directory:", e);
                return NextResponse.json({ success: false, message: "Server configuration error: GIF directory not found" }, { status: 500 });
            }
        }

        const filePath = path.join(targetDir, `${sanitizedWord}.gif`);
        await writeFile(filePath, buffer);
        console.log(`✅ Saved GIF to ${filePath}`);

        // Update JSON database
        const jsonPath = path.resolve(process.cwd(), "data/contributions.json");
        let contributions = [];

        try {
            if (existsSync(jsonPath)) {
                const fileContent = await readFile(jsonPath, "utf-8");
                contributions = JSON.parse(fileContent);
            }
        } catch (e) {
            console.warn("Failed to read contributions.json, starting fresh", e);
        }

        const newContribution = {
            word: sanitizedWord,
            user: user,
            timestamp: new Date().toISOString()
        };

        contributions.unshift(newContribution); // Add to beginning
        // Limit to last 50
        if (contributions.length > 50) contributions = contributions.slice(0, 50);

        await writeFile(jsonPath, JSON.stringify(contributions, null, 2));

        return NextResponse.json({ success: true, message: `Successfully added sign for "${sanitizedWord}"`, contribution: newContribution });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
    }
}
