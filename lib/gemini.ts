
import { GoogleGenerativeAI } from "@google/generative-ai";

// Lazy getter — always reads the latest env var so .env changes take effect without restart
const getGenAI = (): GoogleGenerativeAI => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not set. Please add it to your .env file.");
  }
  return new GoogleGenerativeAI(key);
};


export const analyzeImpact = async (diff: Array<{filename: string, patch: string}>, testFiles: string[]): Promise<string[]> => {
    const genAI = getGenAI();

    const model = genAI.getGenerativeModel({
        model: "gemini-3-flash-preview",
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
    1. **Direct Match**: If 'lib/foo.ts' changes, you MUST include 'tests/foo.test.ts'.
    2. **Strict Dependency**: ONLY include other tests if the changed code is imported/used by the code under test.
    3. **NO GUESSING**: Do NOT include tests just because they are in the same folder. 'todoStore.test.ts' does NOT test 'todoValidator.ts' unless it imports it.
    4. **Conservative**: If in doubt, exclude. It is better to miss a subtle edge case than to run the entire suite appropriately.
    5. **Self-Tests**: If a test file itself is changed, include it.

    INSTRUCTIONS:
    - Return a JSON object with a single field "impactedTests" containing an array of strings.
    - Return ONLY the file paths from the "AVAILABLE TEST FILES" list.
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

export interface GeneratedTest {
    filename: string;
    content: string;
    description: string;
}

export const generateTestCases = async (
    diff: Array<{filename: string, patch: string}>,
    existingTestFiles: string[],
    repoLanguage?: string
): Promise<GeneratedTest[]> => {
    const genAI = getGenAI();

    const changesText = diff.map(f => `<file name="${f.filename}">\n${f.patch}\n</file>`).join("\n");
    const existingTestsText = existingTestFiles.join("\n");

    const prompt = `
    You are an expert software test engineer. Your task is to analyze code changes and generate NEW test cases
    that would improve the test coverage of the changed code.

    CODE CHANGES (Unified Diff):
    ${changesText}

    EXISTING TEST FILES (for reference of naming conventions and style):
    ${existingTestsText}

    INSTRUCTIONS:
    1. Analyze the code changes and identify areas that need additional test coverage.
    2. Focus on:
       - Edge cases not covered by existing tests
       - Error handling paths
       - Boundary conditions
       - New functions/methods added in the diff
       - Modified logic that may need updated tests
       - Integration scenarios between changed components
    3. Generate complete, runnable test files.
    4. Follow the same testing framework and conventions used in the existing test files.
    5. Use descriptive test names that explain what is being tested.
    6. Each test should be independent and self-contained.

    CONSTRAINTS:
    - Do NOT duplicate existing tests.
    - Only generate tests for code that is actually changed in the diff.
    - Keep tests focused and atomic (one assertion per test when practical).
    - Use proper mocking for external dependencies.
    - Follow the project's naming convention (e.g., if tests use *.test.ts, generate *.test.ts files).

    RESPONSE FORMAT:
    Return a JSON object with a single field "tests" containing an array of objects, each with:
    - "filename": the full path for the test file (e.g., "tests/newValidator.test.ts")
    - "content": the complete test file content as a string
    - "description": a brief description of what this test covers

    If no additional tests are needed, return: { "tests": [] }

    Example output:
    {
      "tests": [
        {
          "filename": "tests/utils/helpers.test.ts",
          "content": "import { describe, it, expect } from 'vitest';\\nimport { helperFn } from '../../src/utils/helpers';\\n\\ndescribe('helperFn', () => {\\n  it('should handle empty input', () => {\\n    expect(helperFn('')).toBe('');\\n  });\\n});",
          "description": "Tests edge case handling for helperFn with empty inputs"
        }
      ]
    }
    `;

    const model = getGenAI().getGenerativeModel({
        model: "gemini-3-flash-preview",
        generationConfig: { responseMimeType: "application/json" }
    });

    const maxRetries = 3;
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            console.log(`Sending test generation prompt to Gemini (Attempt ${attempt + 1})...`);
            const result = await model.generateContent(prompt);
            const responseText = result.response.text();

            console.log("Raw Gemini Test Generation Response:", responseText);

            let cleanResponse = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

            try {
                const parsed = JSON.parse(cleanResponse);
                return parsed.tests || [];
            } catch (e) {
                const match = responseText.match(/\{[\s\S]*\}/);
                if (match) {
                    try {
                        const parsed = JSON.parse(match[0]);
                        return parsed.tests || [];
                    } catch (innerError) {
                        console.error("Failed to parse matched JSON segment:", match[0]);
                    }
                }
                throw new Error("Failed to parse Gemini test generation response as JSON");
            }
        } catch (error: any) {
            console.error(`Gemini Attempt ${attempt + 1} Failed:`, error.message);
            if (error.status === 429 || error.status === 503) {
                attempt++;
                const delay = Math.pow(2, attempt) * 1000;
                console.log(`Rate limited. Waiting ${delay / 1000}s before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error;
            }
        }
    }
    throw new Error("Gemini test generation failed after max retries");
};
