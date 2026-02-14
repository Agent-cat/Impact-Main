
import { Octokit } from "octokit";

if (!process.env.GITHUB_TOKEN) {
  console.warn("GITHUB_TOKEN is missing. GitHub API calls may fail or be rate-limited.");
}

export const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export const getChangedFiles = async (owner: string, repo: string, prNumber: number) => {
  try {
    // Fetch commits to find the latest one
    const { data: commits } = await octokit.rest.pulls.listCommits({
      owner,
      repo,
      pull_number: prNumber,
      per_page: 100, // Fetch recent commits
    });

    if (commits.length === 0) {
      return [];
    }

    const latestCommitSha = commits[commits.length - 1].sha;

    // Fetch details of the latest commit, including files
    const { data: commit } = await octokit.rest.repos.getCommit({
        owner,
        repo,
        ref: latestCommitSha
    });

    return (commit.files || []).map(file => ({
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
            recursive: "1",
        });

        return treeData.tree.map(item => item.path).filter((path): path is string => !!path);
    } catch (error) {
      console.error("Error fetching repo tree:", error);
      throw error;
    }
}
