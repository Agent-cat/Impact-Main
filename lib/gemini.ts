
import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
} else {
  console.warn("GEMINI_API_KEY is not set. Gemini AI functionalities will fail.");
}

export const analyzeImpact = async (diff: Array<{filename: string, patch: string}>, testFiles: string[]): Promise<string[]> => {
    if (!genAI) {
        throw new Error("GEMINI_API_KEY not configured");
    }

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash", // Using flash for speed/cost, pro if high precision is needed
        generationConfig: { responseMimeType: "application/json" }
    });

    // Strategy:
    // 1. Group changes by folder/category
    // 2. Identify core logic changes vs config/documentation
    // 3. Match test files based on naming conventions and directory structure

    const changesText = diff.map(f => `File: ${f.filename}\nPatch:\n${f.patch}\n`).join("\n---\n");
    const testListText = testFiles.join("\n");

    const prompt = `
    You are an expert software test engineer specialized in Test Impact Analysis (TIA).
    Your goal is to identify which test files MUST be executed given a set of code changes to ensure no regressions, while minimizing the number of tests run.

    CODE CHANGES (Unified Diff):
    ${changesText}

    AVAILABLE TEST FILES:
    ${testListText}

    CRITERIA:
    1. Direct Impact: If a file has a corresponding test (e.g., 'lib/auth.ts' -> 'tests/auth.test.ts'), include it.
    2. Indirect Impact: If a changed file is a dependency or utility (e.g., 'lib/utils.ts'), include tests for modules that likely use it.
    3. Structural Closeness: Files in the same directory often share dependencies.
    4. Ignore: Non-code changes (README, .gitignore, comments only) should not trigger tests unless they are configuration files that affect behavior.

    INSTRUCTIONS:
    - Analyze the imports and logic in the patches to understand dependencies.
    - Be conservative: if you are unsure, include the test.
    - Return a JSON object with a single key "impactedTests" which is an array of strings (the file paths).

    Example output:
    { "impactedTests": ["tests/login.test.ts", "tests/ui/header.spec.ts"] }
    `;

    try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        try {
            const parsed = JSON.parse(responseText);
            return parsed.impactedTests || [];
        } catch (e) {
            // Robust parsing if Gemini adds markdown
            const match = responseText.match(/\{[\s\S]*\}/);
            if (match) {
                const parsed = JSON.parse(match[0]);
                return parsed.impactedTests || [];
            }
            throw new Error("Failed to parse Gemini response as JSON");
        }
    } catch (error) {
        console.error("Gemini AI Impact Analysis Error:", error);
        // Fallback: return empty and let caller handle it (usually means run nothing or run all)
        throw error;
    }
};
