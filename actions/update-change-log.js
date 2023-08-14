import core from '@actions/core';
import github from '@actions/github';
import axios from 'axios';
import { Configuration, OpenAIApi } from 'openai';
import fs from 'fs';
import { Base64 } from 'js-base64';

export const updateChangeLog = async () => {
  // Get Github Context and setup octokit client
  const { context } = github;
  const { GITHUB_TOKEN, OPENAI_API_KEY } = process.env;

  const octokit = github.getOctokit(GITHUB_TOKEN);
  const { owner, repo, number: pull_number } = context.issue;

  // Set up OPENAI Client
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  //get the pull request in question
  const { data: prData } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number,
  });

  //get all the commits associated with this PR
  const { data: commitData } = await octokit.rest.pulls.listCommits({
    owner,
    repo,
    pull_number,
  });

  //search for any commits named "Updating Changelog" if there is one, then delete it
  const changelogCommit = commitData.find(
    (commit) => commit.commit.message === 'Updating Changelog'
  );

  console.log('Pull Request DATA>>>>>>>>>>>>>>>>>>>>>', prData);
  console.log('Commit DATA>>>>>>>>>>>>>>>>>>>>>', commitData);

  // TRY to update the changelog
  try {
    const { data: changeLogData } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: 'changelog.md',
    });
    const currentContent = Base64.decode(changeLogData.content);

    const addToChangeLog = `## ${prData.title} - ${prData.html_url}\nHello there this is a test`;

    // Update the content
    const contentEncoded = Base64.encode(currentContent + '\n' + addToChangeLog);

    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: 'changelog.md',
      message: 'Updating Changelog',
      content: contentEncoded,
      sha: changeLogData.sha, // Include the current SHA
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

  // console.log('context', context);
};
