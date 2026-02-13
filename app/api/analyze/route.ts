
import { NextResponse } from "next/server";
import { getChangedFiles, getRepoFileStructure, getPullRequestHeadSha } from "@/lib/githubClient";
import { getRepoIndex, saveRepoIndex, filterTestFiles } from "@/lib/repoIndexer";
import { analyzeImpact } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";

export const POST = async (req: Request) => {
    try {
        const { owner, repo, pr } = await req.json();

        if (!owner || !repo || !pr) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const prNumber = parseInt(pr);

        // Optimization: Check for existing analysis for this commit SHA
        const headSha = await getPullRequestHeadSha(owner, repo, prNumber);

        const existingAnalysis = await prisma.pREvaluation.findFirst({
            where: {
                owner,
                repo,
                prNumber,
                headSha
            }
        });

        if (existingAnalysis) {
            console.log(`Returning cached analysis for ${owner}/${repo} PR #${prNumber} @ ${headSha}`);
            return NextResponse.json({
                impactedTests: existingAnalysis.impactedTests,
                allTests: [], // Optional, maybe we don't need to return full list every time
                evaluationId: existingAnalysis.id,
                cached: true
            });
        }

        // 1. Fetch PR Diff
        // Parallelize fetching if possible, but we need diff for AI
        const changedFiles = await getChangedFiles(owner, repo, prNumber);

        // 2. Fetch or Build Repo Index
        let testFiles = await getRepoIndex(owner, repo);

        if (!testFiles || testFiles.length === 0) {
            console.log(`Index missing for ${owner}/${repo}, building now...`);
            const structure = await getRepoFileStructure(owner, repo); // Default branch
            testFiles = filterTestFiles(structure);
            await saveRepoIndex(owner, repo, testFiles);
        }

        if (testFiles.length === 0) {
             // No tests in repo at all
             return NextResponse.json({
                impactedTests: [],
                allTests: [],
                evaluationId: "no-tests"
            });
        }

        // 3. Analyze Impact with Gemini
        // Convert changed files to simpler format for Gemini (filename + patch)
        const changesForAI = changedFiles.map(f => ({
            filename: f.filename,
            patch: f.patch
        }));

        let impactedTests: string[] = [];
        try {
            impactedTests = await analyzeImpact(changesForAI, testFiles);
        } catch (geminiError) {
            console.error("Gemini Analysis Failed:", geminiError);
            // Fallback: If AI fails, we must be safe and run ALL tests.
            impactedTests = testFiles;
        }

        // Integrity check: Filter out any hallucinations not in the actual test list
        impactedTests = impactedTests.filter(t => testFiles?.includes(t));

        // 4. Save to Database
        const record = await prisma.pREvaluation.upsert({
            where: {
                owner_repo_prNumber: {
                    owner,
                    repo,
                    prNumber
                }
            },
            update: {
                headSha, // Update SHA if PR updated
                impactedTests,
                skippedTests: testFiles.filter(t => !impactedTests.includes(t)),
                // Reset metrics on new run
                testsRun: null,
                testsFailed: null,
                timeSaved: null
            },
            create: {
                owner,
                repo,
                prNumber,
                headSha,
                impactedTests,
                skippedTests: testFiles.filter(t => !impactedTests.includes(t))
            }
        });

        // 5. Return Result
        return NextResponse.json({
            impactedTests,
            allTests: testFiles,
            evaluationId: record.id
        });

    } catch (error) {
        console.error("Analysis Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
