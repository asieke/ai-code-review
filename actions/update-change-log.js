import core from '@actions/core';
import github from '@actions/github';
import axios from 'axios';
import { Configuration, OpenAIApi } from 'openai';
import fs from 'fs';
import { Base64 } from 'js-base64';

export const updateChangeLog = async () => {
  const { context } = github;
  const { GITHUB_TOKEN, OPENAI_API_KEY } = process.env;

  const octokit = github.getOctokit(GITHUB_TOKEN);
  const { owner, repo, number } = context.issue;

  let addToChangeLog = context.payload.pull_request.body;

  // Get the current content of the changelog file
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: 'changelog.md',
    });
    const currentContent = Base64.decode(data.content);

    // Update the content
    const contentEncoded = Base64.encode(currentContent + '\n' + addToChangeLog);

    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: 'changelog.md',
      message: 'feat: Updated changelog.md programmatically',
      content: contentEncoded,
      sha: data.sha, // Include the current SHA
      committer: {
        name: `Octokit Bot`,
        email: 'asieke@gmail.com',
      },
      author: {
        name: 'Octokit Bot',
        email: 'asieke@gmail.com',
      },
    });
  } catch (err) {
    console.error(err);
  }

  console.log('context', context);
};