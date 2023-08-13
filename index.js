import core from '@actions/core';
import github from '@actions/github';
import fetch from 'node-fetch';

async function main() {
  try {
    const { GITHUB_TOKEN, OPENAI_API_KEY } = process.env;
    // `who-to-greet` input defined in action metadata file
    const nameToGreet = core.getInput('who-to-greet');
    const action = core.getInput('action');
    const { context } = github;

    const octokit = github.getOctokit(GITHUB_TOKEN);

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

      const diff = await fetch(data.diff_url);

      console.log('---------------------------------------');
      console.log(diff);
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
