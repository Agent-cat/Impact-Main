
import { NextResponse } from "next/server";
import { getChangedFiles, getPRHeadBranch, createBranchAndCommitTests, createTestPullRequest } from "@/lib/githubClient";
import { getRepoIndex } from "@/lib/repoIndexer";
import { generateTestCases } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";

export const POST = async (req: Request) => {
    try {
        const { owner, repo, prNumber, evaluationId } = await req.json();

        if (!owner || !repo || !prNumber || !evaluationId) {
            return NextResponse.json({ error: "Missing required fields: owner, repo, prNumber, evaluationId" }, { status: 400 });
        }

        const prNum = parseInt(prNumber);

        // Check if we already have a generated test PR for this evaluation
        const existingGenPR = await prisma.generatedTestPR.findUnique({
            where: { evaluationId }
        });

        if (existingGenPR) {
            return NextResponse.json({
                message: "Test PR already exists for this evaluation",
                prUrl: existingGenPR.prUrl,
                prNumber: existingGenPR.prNumber,
                testsGenerated: existingGenPR.testsGenerated,
                alreadyExists: true
            });
        }

        // 1. Get the PR diff
        const changedFiles = await getChangedFiles(owner, repo, prNum);

        if (changedFiles.length === 0) {
            return NextResponse.json({ error: "No changed files found in this PR" }, { status: 400 });
        }

        // 2. Get existing test files for context
        const existingTestFiles = await getRepoIndex(owner, repo) || [];

        // 3. Generate test cases using Gemini AI
        const changesForAI = changedFiles.map(f => ({
            filename: f.filename,
            patch: f.patch
        }));

        console.log(`Generating test cases for ${owner}/${repo} PR #${prNum}...`);
        const generatedTests = await generateTestCases(changesForAI, existingTestFiles);

        if (generatedTests.length === 0) {
            // Save the suggestion even if empty
            await prisma.pREvaluation.update({
                where: { id: evaluationId },
                data: { suggestedTests: [] }
            });

            return NextResponse.json({
                message: "AI determined no additional tests are needed for these changes",
                testsGenerated: 0,
                tests: []
            });
        }

        // 4. Save the suggested tests to the evaluation record
        await prisma.pREvaluation.update({
            where: { id: evaluationId },
            data: {
                suggestedTests: generatedTests.map(t => ({
                    filename: t.filename,
                    content: t.content,
                    description: t.description
                }))
            }
        });

        // 5. Get the PR's head branch (to base our new branch off of)
        const prHeadBranch = await getPRHeadBranch(owner, repo, prNum);
        const newBranchName = `impacanalyzer/tests-for-pr-${prNum}`;

        // 6. Create a branch and commit the test files
        await createBranchAndCommitTests(
            owner,
            repo,
            prHeadBranch,
            newBranchName,
            generatedTests.map(t => ({ filename: t.filename, content: t.content }))
        );

        // 7. Create a Pull Request
        const { prNumber: newPRNumber, prUrl } = await createTestPullRequest(
            owner,
            repo,
            newBranchName,
            prHeadBranch,
            prNum,
            generatedTests.length
        );

        // 8. Save the generated test PR record
        await prisma.generatedTestPR.create({
            data: {
                evaluationId,
                owner,
                repo,
                prNumber: newPRNumber,
                branchName: newBranchName,
                status: "created",
                testsGenerated: generatedTests.length,
                prUrl,
            }
        });

        return NextResponse.json({
            message: "Test PR created successfully",
            prUrl,
            prNumber: newPRNumber,
            branchName: newBranchName,
            testsGenerated: generatedTests.length,
            tests: generatedTests.map(t => ({
                filename: t.filename,
                description: t.description
            }))
        });

    } catch (error: any) {
        console.error("Generate Tests Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate tests" },
            { status: 500 }
        );
    }
};
