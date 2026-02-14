
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
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    // Strategy:
    // 1. Group changes by folder/category
    // 2. Identify core logic changes vs config/documentation
    // 3. Match test files based on naming conventions and directory structure

    const changesText = diff.map(f => `<file name="${f.filename}">\n${f.patch}\n</file>`).join("\n");
    const testListText = testFiles.join("\n");

    const prompt = `
    You are an expert software test engineer specialized in Test Impact Analysis (TIA).
    Your goal is to identify which test files MUST be executed given a set of code changes from the LATEST COMMIT.

    CODE CHANGES (Unified Diff):
    ${changesText}

    AVAILABLE TEST FILES:
    ${testListText}

    CRITERIA:
    1. Direct Impact: If a source file is modified (e.g., 'lib/auth.ts'), include its direct test file (e.g., 'tests/auth.test.ts').
    2. Indirect Impact (Dependency Chain): If a changed file is imported by other files, include tests that cover those *dependent* files. strictly checking import paths in the codebase (inferred).
    3. Exclude Unrelated: Do NOT include tests that have no dependency on the changed files. Do NOT include tests just because they are in the same folder or have similar names.
    4. Ignore Scripts/Config: Changes to 'scripts/', 'package.json', or config files should generally NOT triggers app tests unless they fundamentally change the build/test environment.
    5. Self-Tests: If a test file itself is modified, it MUST be included.

    INSTRUCTIONS:
    - Analyze the logic modification in the provided <file> blocks.
    - Be Conservative: Only select tests where there is a clear causal link (import or functional dependency).
    - Return a JSON object with "impactedTests" array.
    - If NO tests are impacted, return { "impactedTests": [] }
    - RESPONSE FORMAT: Pure JSON only. No markdown. No comments.

    Example output:
    { "impactedTests": ["tests/login.test.ts"] }
    `;

    // Retry logic for 429/503 errors
    const maxRetries = 3;
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            const result = await model.generateContent(prompt);
            const responseText = result.response.text();

            let cleanResponse = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

            try {
                const parsed = JSON.parse(cleanResponse);
                return parsed.impactedTests || [];
            } catch (e) {
                // Formatting fallback
                const match = responseText.match(/\{[\s\S]*\}/);
                if (match) {
                    try {
                        const parsed = JSON.parse(match[0]);
                        return parsed.impactedTests || [];
                    } catch (innerError) {
                         console.error("Failed to parse matched JSON segment:", match[0]);
                    }
                }
                throw new Error("Failed to parse Gemini response as JSON");
            }
        } catch (error: any) {
            console.error(`Gemini Analysis Attempt ${attempt + 1} Failed:`, error.message);
            if (error.status === 429 || error.status === 503) {
                 attempt++;
                 const delay = Math.pow(2, attempt) * 1000;
                 await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                 throw error;
            }
        }
    }
    throw new Error("Gemini Analysis Failed after max retries");
};
