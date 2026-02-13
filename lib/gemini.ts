
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
        model: "gemini-flash-latest", // Using flash for speed/cost, pro if high precision is needed
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
    Your goal is to identify which test files MUST be executed given a set of code changes to ensure no regressions.

    CODE CHANGES (Unified Diff):
    ${changesText}

    AVAILABLE TEST FILES:
    ${testListText}

    CRITERIA:
    1. Direct Impact: If a file has a corresponding test (e.g., 'lib/auth.ts' -> 'tests/auth.test.ts'), include it.
    2. Indirect Impact: If a changed file is a dependency (imported by other files), include tests that cover those dependent files. Analyze imports in the patch.
    3. Exclude Unrelated: Do NOT include tests that have no dependency on the changed files. Do NOT include tests just because they are in the same folder.
    4. Ignore: Non-code changes (README, .gitignore) should not trigger tests.

    INSTRUCTIONS:
    - Analyze the code changes to understand what logic has been modified.
    - Trace dependencies based on imports visible in the patch or standard project structure conventions.
    - Return a JSON object with a single key "impactedTests" which is an array of strings.

    Example output:
    { "impactedTests": ["tests/login.test.ts"] }
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
