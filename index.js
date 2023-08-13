import core from '@actions/core';
import github from '@actions/github';
import axios from 'axios';
import { Configuration, OpenAIApi } from 'openai';

async function main() {
  try {
    const { GITHUB_TOKEN, OPENAI_API_KEY } = process.env;
    // `who-to-greet` input defined in action metadata file
    const nameToGreet = core.getInput('who-to-greet');
    const action = core.getInput('action');
    const { context } = github;

    const octokit = github.getOctokit(GITHUB_TOKEN);

    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);

    console.log(`Hello ${nameToGreet}!  This code is gonna be off the hook`);
    console.log(`Hello ${action}!  <<<-- This is what we're doing? >>>`);

    if (action === 'update-push') {
      console.log('Were going to trick out this push');
    }

    if (action === 'update-change-log') {
      console.log('Updating the change log, (OPEN AI KEY: ' + OPENAI_API_KEY + ')');
      const { owner, repo, number } = context.issue;

      console.log(owner, repo, number);
      const { data } = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: number, // Note that the parameter name must be "pull_number"
      });

      // const { data: diff } = await axios.get(data.diff_url);
      const { data: diff } = await axios.get(
        'https://patch-diff.githubusercontent.com/raw/asieke/portfolio-labs/pull/2.diff'
      );

      const chatCompletion = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo-16k',
        messages: [
          {
            role: 'user',
            content:
              'Please create a changelog entry for the following changes in markdown. In your response, feel free to include emojies.' +
              minimizeDiff(diff),
          },
        ],
      });

      console.log('---------------------------------------');
      console.log(diff);
      console.log(chatCompletion.data.choices[0].message);
      console.log('---------------------------------------');
    }

    const time = new Date().toTimeString();
    core.setOutput('time', time);
    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2);

    console.log(`The event payload: ${payload}`);
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
