import core from '@actions/core';
import github from '@actions/github';
import axios from 'axios';
import { Configuration, OpenAIApi } from 'openai';
import fs from 'fs';
import { Base64 } from 'js-base64';

import { describePR } from './lib/describe-pr.js';

async function main() {
  try {
    const { GITHUB_TOKEN, OPENAI_API_KEY } = process.env;
    // `who-to-greet` input defined in action metadata file
    const nameToGreet = core.getInput('who-to-greet');
    const action = core.getInput('action');

    if (action === 'update-push') {
      console.log('[ACTION] - UPDATING PUSH');
    }

    if (action === 'update-change-log') {
      console.log('[ACTION] - UPDATING CHANGE LOG');
      await describePR();

      //TRY TO UPDATE CHANGELOG
      // try {
      //   const content = fs.readFileSync('./README.md', 'utf-8');
      //   const contentEncoded = Base64.encode(content + '\n' + addToChangeLog);

      //   const { data } = await octokit.rest.repos.createOrUpdateFileContents({
      //     // replace the owner and email with your own details
      //     owner,
      //     repo,
      //     path: 'changelog.md',
      //     message: 'feat: Added OUTPUT.md programatically',
      //     content: contentEncoded,
      //     committer: {
      //       name: `Octokit Bot`,
      //       email: 'asieke@gmail.com',
      //     },
      //     author: {
      //       name: 'Octokit Bot',
      //       email: 'asieke@gmail.com',
      //     },
      //   });

      //   console.log(data);
      // } catch (err) {
      //   console.error(err);
      // }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

main(); // Execute the main function

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
