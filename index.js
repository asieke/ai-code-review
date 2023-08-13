const core = require('@actions/core');
const github = require('@actions/github');
const { Octokit } = require('@octokit/rest');
import fetch from 'node-fetch';

try {
  // `who-to-greet` input defined in action metadata file
  const nameToGreet = core.getInput('who-to-greet');
  const action = core.getInput('action');
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
    request: { fetch },
  });
  const { context } = github;

  console.log(`Hello ${nameToGreet}!  This code is gonna be off the hook`);
  console.log(`Hello ${action}!  <<<-- This is what we're doing? >>>`);

  if (action === 'update-push') {
    console.log('Were going to trick out this push');
  }

  if (action === 'update-change-log') {
    console.log('Updating the change log');
    const { owner, repo, number } = context.issue;
    octokit.pulls
      .get({
        owner,
        repo,
        pull_number: number,
      })
      .then((res) => {
        console.log('Flattened diff:', res.data.diff_url);
      });
    console.log('...', context);
  }

  const time = new Date().toTimeString();
  core.setOutput('time', time);
  // Get the JSON webhook payload for the event that triggered the workflow
  const payload = JSON.stringify(github.context.payload, undefined, 2);

  console.log(`The event payload: ${payload}`);
} catch (error) {
  core.setFailed(error.message);
}
