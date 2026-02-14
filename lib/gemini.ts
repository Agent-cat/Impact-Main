
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
    Your goal is to identify which test files MUST be executed given a set of code changes.

    CODE CHANGES (Unified Diff):
    ${changesText}

    AVAILABLE TEST FILES:
    ${testListText}

    CRITERIA:
    1. **Direct Match**: If 'lib/foo.ts' changes, you MUST include 'tests/foo.test.ts' (or similar). This is the most important rule.
    2. **Dependency**: If a shared library is changed, include tests for components that use it, BUT ONLY IF you are confident.
    3. **Conservative**: Do NOT include tests unless they are clearly related. Better to run fewer tests than all tests (unless it's a critical core change).
    4. **Ignore Config**: Changes to non-code files (README, .gitignore, etc.) should generally NOT impact tests.
    5. **Self-Tests**: If a test file itself is changed, include it.

    INSTRUCTIONS:
    - Return a JSON object with a single field "impactedTests" containing an array of strings.
    - Return ONLY the file paths from the "AVAILABLE TEST FILES" list. Do not invent paths.
    - If NO tests are impacted, return { "impactedTests": [] }

    Example output:
    { "impactedTests": ["tests/login.test.ts"] }
    `;

    // Retry logic for 429/503 errors
    const maxRetries = 3;
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            console.log(`Sending prompt to Gemini (Attempt ${attempt + 1})...`);
            const result = await model.generateContent(prompt);
            const responseText = result.response.text();

            console.log("Raw Gemini Response:", responseText);

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
