
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const POST = async (req: Request) => {
    try {
        const { owner, repo, pr, testsRun, testsFailed, timeSaved } = await req.json();

        if (!owner || !repo || !pr) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Update the PREvaluation record
        const updated = await prisma.pREvaluation.update({
            where: {
                owner_repo_prNumber: {
                    owner,
                    repo,
                    prNumber: parseInt(pr),
                },
            },
            data: {
                testsRun: parseInt(testsRun),
                testsFailed: parseInt(testsFailed),
                timeSaved: timeSaved?.toString(),
            },
        });

        return NextResponse.json({ message: "CI results recorded", data: updated });

    } catch (error) {
        console.error("Report Error:", error);
        return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
    }
}
