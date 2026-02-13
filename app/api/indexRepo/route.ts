
import { NextResponse } from "next/server";
import { getRepoIndex, saveRepoIndex, filterTestFiles } from "@/lib/repoIndexer";
import { getRepoFileStructure } from "@/lib/githubClient";
import { prisma } from "@/lib/prisma";

export const POST = async (req: Request) => {
    try {
        const { owner, repo, branch } = await req.json();

        if (!owner || !repo) {
            return NextResponse.json({ error: "Missing owner or repo" }, { status: 400 });
        }

        // Fetch structure from GitHub
        const structure = await getRepoFileStructure(owner, repo, branch || "main");

        // Filter for tests
        const testFiles = filterTestFiles(structure);

        // Save index
        await saveRepoIndex(owner, repo, testFiles);

        return NextResponse.json({
            message: "Repo index created/updated successfully",
            testsFound: testFiles.length
        });

    } catch (error) {
        console.error("Index Repo Error:", error);
        return NextResponse.json({ error: "Failed to index repo" }, { status: 500 });
    }
}
