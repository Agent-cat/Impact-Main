
import { prisma } from "./prisma";

// No more FS usage

export const getRepoIndex = async (owner: string, repo: string): Promise<string[] | null> => {
    const index = await prisma.repoIndex.findUnique({
        where: {
            owner_repo: {
                owner,
                repo
            }
        }
    });

    if (!index) return null;
    return index.testFiles || [];
};

export const saveRepoIndex = async (owner: string, repo: string, testFiles: string[]) => {
    await prisma.repoIndex.upsert({
        where: {
            owner_repo: {
                owner,
                repo
            }
        },
        update: {
            testFiles,
            lastIndexedAt: new Date()
        },
        create: {
            owner,
            repo,
            testFiles
        }
    });
    console.log(`Saved repo index for ${owner}/${repo} to DB`);
};

// Helper to filter test files
export const isTestFile = (filepath: string) => {
    return filepath.endsWith(".test.ts") ||
           filepath.endsWith(".spec.ts") ||
           filepath.endsWith(".test.js") ||
           filepath.endsWith(".spec.js") ||
           filepath.endsWith(".test.jsx") ||
           filepath.endsWith(".spec.jsx") ||
           filepath.endsWith(".test.tsx") ||
           filepath.endsWith(".spec.tsx") ||
           filepath.includes("__tests__");
};

export const filterTestFiles = (files: string[]) => {
    return files.filter(isTestFile);
};
