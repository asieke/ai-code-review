import core from '@actions/core';
import github from '@actions/github';
import axios from 'axios';
import { Configuration, OpenAIApi } from 'openai';
import fs from 'fs';
import { Base64 } from 'js-base64';
import { systemMessage } from '../lib/system-message.js';
import { minimizeDiff } from '../lib/minimize-diff.js';

//create an async sleep function
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const ALLOWED_TYPES = ['js', 'ts', 'tsx', 'jsx', 'html', 'css', 'svelte'];

export const describePR = async () => {
  //Configure the variable and get contexts
  const { context } = github;
  const { GITHUB_TOKEN, OPENAI_API_KEY } = process.env;
  const octokit = github.getOctokit(GITHUB_TOKEN);
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  // Get the PR information
  const { owner, repo, number } = context.issue;
  console.log('-----------------------------');
  console.log('owner......................', owner);
  console.log('repo.......................', repo);
  console.log('number.....................', number);

  const { data } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: number, // Note that the parameter name must be "pull_number"
  });

  const { data: commitData } = await octokit.rest.pulls.listCommits({
    owner,
    repo,
    pull_number: number,
  });

  const branchSHA = data.head.sha;
  const latestCommitSHA = commitData[0].sha;

  const { data: diff } = await axios.get(data.diff_url);
  console.log('Diff URL...................', data.diff_url);

  //get the files associated with this PR
  const { data: pullRequestFiles } = await octokit.rest.pulls.listFiles({
    owner,
    repo,
    pull_number: number,
  });

  //iterate through and get AI code review for each file
  for (const file of pullRequestFiles) {
    //get the file extension of file.filename
    const fileExtension = file.filename.slice(((file.filename.lastIndexOf('.') - 1) >>> 0) + 2);
    if (file.status === 'deleted') continue;
    if (!ALLOWED_TYPES.includes(fileExtension)) continue;

    console.log('filename...................', file.filename);
    console.log('extension..................', fileExtension);
    let diff = file.patch;
    console.log('...[Patch]', diff);

    const response = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: file.filename,
      ref: branchSHA,
    });

    const fileContent = Buffer.from(response.data.content, 'base64').toString('utf-8');

    console.log('...[DATA', fileContent);
    await sleep(5000);

    let commentResponse = await octokit.rest.pulls.createReviewComment({
      owner,
      repo,
      pull_number: number,
      body: 'Heres a comment, good stuff',
      commit_id: latestCommitSHA,
      path: file.filename,
      line: 5,
    });

    console.log(commentResponse);
  }

  // const chatCompletion = await openai.createChatCompletion({
  //   model: 'gpt-3.5-turbo-16k',
  //   messages: [
  //     systemMessage,
  //     {
  //       role: 'user',
  //       content: `
  //             Link: ${data.html_url}
  //             Date: ${data.created_at.substring(0, 10)}
  //             Code: ${minimizeDiff(diff).substring(0, 20000)}`,
  //     },
  //   ],
  // });

  // const addToPR = chatCompletion.data.choices[0].message.content;

  const addToPR = '## Placeholder';

  console.log('Adding to PR');
  console.log(addToPR);

  // use oktokit to update the changelog
  const temp = await octokit.rest.pulls.update({
    owner,
    repo,
    pull_number: number,
    body: addToPR,
  });
};
