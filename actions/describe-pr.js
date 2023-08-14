import core from '@actions/core';
import github from '@actions/github';
import axios from 'axios';
import { Configuration, OpenAIApi } from 'openai';
import fs from 'fs';
import { Base64 } from 'js-base64';
import { systemMessage } from '../lib/system-message.js';
import { minimizeDiff } from '../lib/minimize-diff.js';

export const describePR = async () => {
  const { context } = github;
  const { GITHUB_TOKEN, OPENAI_API_KEY } = process.env;

  const octokit = github.getOctokit(GITHUB_TOKEN);

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  console.log('Updating the change log, (OPEN AI KEY: ' + OPENAI_API_KEY + ')');
  const { owner, repo, number } = context.issue;

  console.log(owner, repo, number);
  const { data } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: number, // Note that the parameter name must be "pull_number"
  });

  console.log('Getting Diff: ', data.diff_url);

  const { data: diff } = await axios.get(data.diff_url);

  const chatCompletion = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo-16k',
    messages: [
      systemMessage,
      {
        role: 'user',
        content: `
              Link: ${data.html_url}
              Date: ${data.created_at.substring(0, 10)}
              Code: ${minimizeDiff(diff).substring(0, 20000)}`,
      },
    ],
  });

  const addToPR = chatCompletion.data.choices[0].message.content;

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
