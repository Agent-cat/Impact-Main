
import { Octokit } from "octokit";

if (!process.env.GITHUB_TOKEN) {
  console.warn("GITHUB_TOKEN is missing. GitHub API calls may fail or be rate-limited.");
}

export const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export const getChangedFiles = async (owner: string, repo: string, prNumber: number) => {
  try {
    const files = await octokit.paginate(octokit.rest.pulls.listFiles, {
      owner,
      repo,
      pull_number: prNumber,
      per_page: 100,
    });

    return files.map(file => ({
      filename: file.filename,
      status: file.status,
      additions: file.additions,
      deletions: file.deletions,
      patch: file.patch || "",
    }));
  } catch (error) {
    console.error("Error fetching PR files:", error);
    throw error;
  }
};

export const getPullRequestHeadSha = async (owner: string, repo: string, prNumber: number) => {
    try {
        const { data: pr } = await octokit.rest.pulls.get({
            owner,
            repo,
            pull_number: prNumber
        });
        return pr.head.sha;
    } catch (error) {
        console.error("Error fetching PR details:", error);
        throw error;
    }
};

export const getRepoFileStructure = async (owner: string, repo: string, branch = "main") => {
    try {
        // use trees API for recursive fetch
        // First get the SHA of the branch
        const { data: refData } = await octokit.rest.git.getRef({
             owner,
             repo,
             ref: `heads/${branch}`,
        });

        const treeSha = refData.object.sha;

        const { data: treeData } = await octokit.rest.git.getTree({
            owner,
            repo,
            tree_sha: treeSha,
            recursive: "1",
        });

        return treeData.tree.map(item => item.path).filter((path): path is string => !!path);
    } catch (error) {
      console.error("Error fetching repo tree:", error);
      throw error;
    }
}

// Get the SHA of an existing file (to check if it exists for update)
export const getFileSha = async (owner: string, repo: string, path: string, branch: string): Promise<string | null> => {
    try {
        const { data } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path,
            ref: branch,
        });
        if (!Array.isArray(data) && data.type === "file") {
            return data.sha;
        }
        return null;
    } catch {
        return null; // File doesn't exist
    }
};

// Get the default branch of a repository
export const getDefaultBranch = async (owner: string, repo: string): Promise<string> => {
    try {
        const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
        return repoData.default_branch;
    } catch (error) {
        console.error("Error fetching default branch:", error);
        return "main";
    }
};

// Get the head branch name of a PR
export const getPRHeadBranch = async (owner: string, repo: string, prNumber: number): Promise<string> => {
    try {
        const { data: pr } = await octokit.rest.pulls.get({
            owner,
            repo,
            pull_number: prNumber,
        });
        return pr.head.ref;
    } catch (error) {
        console.error("Error fetching PR head branch:", error);
        throw error;
    }
};

// Create a new branch and commit generated test files
export const createBranchAndCommitTests = async (
    owner: string,
    repo: string,
    baseBranch: string,
    newBranchName: string,
    files: Array<{ filename: string; content: string }>
): Promise<string> => {
    try {
        // 1. Get the SHA of the base branch
        const { data: refData } = await octokit.rest.git.getRef({
            owner,
            repo,
            ref: `heads/${baseBranch}`,
        });
        const baseSha = refData.object.sha;

        // 2. Create the new branch
        try {
            await octokit.rest.git.createRef({
                owner,
                repo,
                ref: `refs/heads/${newBranchName}`,
                sha: baseSha,
            });
            console.log(`Created branch: ${newBranchName}`);
        } catch (error: any) {
            if (error.status === 422) {
                console.log(`Branch ${newBranchName} already exists, updating...`);
                // Branch exists, update it to latest base
                await octokit.rest.git.updateRef({
                    owner,
                    repo,
                    ref: `heads/${newBranchName}`,
                    sha: baseSha,
                    force: true,
                });
            } else {
                throw error;
            }
        }

        // 3. Commit each test file
        for (const file of files) {
            const existingSha = await getFileSha(owner, repo, file.filename, newBranchName);

            if (existingSha) {
                // Update existing file
                await octokit.rest.repos.createOrUpdateFileContents({
                    owner,
                    repo,
                    path: file.filename,
                    message: `test: add AI-generated test - ${file.filename}`,
                    content: Buffer.from(file.content).toString("base64"),
                    branch: newBranchName,
                    sha: existingSha,
                });
            } else {
                // Create new file
                await octokit.rest.repos.createOrUpdateFileContents({
                    owner,
                    repo,
                    path: file.filename,
                    message: `test: add AI-generated test - ${file.filename}`,
                    content: Buffer.from(file.content).toString("base64"),
                    branch: newBranchName,
                });
            }
            console.log(`Committed file: ${file.filename}`);
        }

        return newBranchName;
    } catch (error) {
        console.error("Error creating branch and committing tests:", error);
        throw error;
    }
};

// Create a Pull Request with the generated tests
export const createTestPullRequest = async (
    owner: string,
    repo: string,
    headBranch: string,
    baseBranch: string,
    originalPRNumber: number,
    testCount: number
): Promise<{ prNumber: number; prUrl: string }> => {
    try {
        const { data: pr } = await octokit.rest.pulls.create({
            owner,
            repo,
            title: `🧪 AI-Generated Tests for PR #${originalPRNumber}`,
            head: headBranch,
            base: baseBranch,
            body: `## 🤖 Auto-Generated Test Cases

This pull request was automatically generated by **ImpacAnalyzer** to improve test coverage for the changes in PR #${originalPRNumber}.

### What's included:
- **${testCount}** new test case(s) generated by AI analysis
- Tests target edge cases, error handling, and boundary conditions
- All tests follow the project's existing testing conventions

### How these tests were generated:
1. AI analyzed the code diff from PR #${originalPRNumber}
2. Identified areas lacking test coverage
3. Generated comprehensive tests for the changed code

### Review Notes:
- Please review the generated tests for correctness
- Verify mocks and assertions match your project's patterns
- Feel free to modify or remove tests that don't apply

---
*Generated by [ImpacAnalyzer](https://github.com/impacanalyzer) 🚀*`,
        });

        return {
            prNumber: pr.number,
            prUrl: pr.html_url,
        };
    } catch (error) {
        console.error("Error creating pull request:", error);
        throw error;
    }
};

