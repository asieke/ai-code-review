import core from '@actions/core';
import github from '@actions/github';
import axios from 'axios';
import { Configuration, OpenAIApi } from 'openai';
import fs from 'fs';

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

      const { data: diff } = await axios.get(data.diff_url);

      const chatCompletion = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo-16k',
        messages: [
          {
            role: 'system',
            content: `
              You are an expert code summarizer who summarizing a pull request for a changelog.
              Please summarize any code provided.
              Your output should be in markdown format.
              Only provide your summary, no additional text in your response.
              Each change summary should be no more than 15 words long.
              Only list at MOST 6 relevant changes, it can be fewer if its a smaller PR.
              Please make the emojis fun and relevant to the change.
              Please include after the date and title, a 20-30 word summary of all changes.
              Your return should be in the following format:
              ## [Date of Change] - [Pull Request Title]
              [Link to PR in markdown format]
              [20-30 word summary of all changes]
              - [emoji] [summary of change 1]
              - [emoji] [summary of change 2]
            `,
          },
          {
            role: 'user',
            content: `
              PR Title: ${data.title}
              Link: ${data.html_url}
              Date: ${data.created_at.substring(0, 10)}
              Code: ${minimizeDiff(diff).substring(0, 20000)}`,
          },
        ],
      });

      const addToChangeLog = chatCompletion.data.choices[0].message.content;

      console.log('Trying to add this to changelog >>>' addToChangeLog)

      const changelogPath = 'changelog.md';
      fs.appendFile(changelogPath, addToChangeLog + '\n', (err) => {
        if (err) {
          console.error(`Failed to update changelog: ${err}`);
          core.setFailed(err.message);
        } else {
          console.log(`Updated ${changelogPath} with new changes.`);
        }
      });
    }

    const time = new Date().toTimeString();
    core.setOutput('time', time);
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
