import core from '@actions/core';
import github from '@actions/github';
import axios from 'axios';
import { Configuration, OpenAIApi } from 'openai';
import fs from 'fs';
import { Base64 } from 'js-base64';
import { systemMessage } from '../lib/system-message.js';

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

  const addToChangeLog = chatCompletion.data.choices[0].message.content;

  // use oktokit to update the changelog
  const temp = await octokit.rest.pulls.update({
    owner,
    repo,
    pull_number: number,
    body: addToChangeLog,
  });
};

function minimizeDiff(diffContent) {
  const lines = diffContent.split('\n');
  const allowedExtensions = /\.(js|ts|jsx|tsx|svelte|css|html)\b/;
  let result = '';
  let isDeletingFile = false;
  let includeFile = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if the line starts a new file diff
    if (line.startsWith('diff --git')) {
      // Check if the file has an allowed extension
      includeFile = allowedExtensions.test(line);
      isDeletingFile = false;

      if (includeFile) {
        result += line + '\n';
      }
    } else if (includeFile) {
      // Check for file deletion header
      if (line.startsWith('deleted file')) {
        isDeletingFile = true;
        result += line + '\n';
      }

      // If not deleting, include lines until the next file diff
      if (!isDeletingFile && !lines[i + 1]?.startsWith('diff --git')) {
        result += line + '\n';
      }
    }
  }

  return result;
}
