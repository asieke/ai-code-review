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

  //TRY TO UPDATE CHANGELOG
  try {
    const content = fs.readFileSync('./README.md', 'utf-8');
    const contentEncoded = Base64.encode(content + '\n' + addToChangeLog);

    const { data } = await octokit.rest.repos.createOrUpdateFileContents({
      // replace the owner and email with your own details
      owner,
      repo,
      path: 'changelog.md',
      message: 'feat: Added OUTPUT.md programatically',
      content: contentEncoded,
      committer: {
        name: `Octokit Bot`,
        email: 'asieke@gmail.com',
      },
      author: {
        name: 'Octokit Bot',
        email: 'asieke@gmail.com',
      },
    });

    console.log(data);
  } catch (err) {
    console.error(err);
  }

  console.log('context', context);
};
