
import { Octokit } from "octokit";

if (!process.env.GITHUB_TOKEN) {
  console.warn("GITHUB_TOKEN is missing. GitHub API calls may fail or be rate-limited.");
}

export const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export const getChangedFiles = async (owner: string, repo: string, prNumber: number) => {
  try {
    const { data: files } = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber,
    });

    return files.map(file => ({
      filename: file.filename,
      status: file.status,
      additions: file.additions,
      deletions: file.deletions,
      patch: file.patch || "", // The diff
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
            recursive: "true",
        });

        return treeData.tree.map(item => item.path).filter((path): path is string => !!path);
    } catch (error) {
      console.error("Error fetching repo tree:", error);
      throw error;
    }
}
