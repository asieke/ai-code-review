const core = require('@actions/core');
const github = require('@actions/github');
const { Octokit } = require('@octokit/rest');

async function main() {
  try {
    const { GITHUB_TOKEN } = process.env;
    // `who-to-greet` input defined in action metadata file
    const nameToGreet = core.getInput('who-to-greet');
    const action = core.getInput('action');
    const { context } = github;

    console.log(`Hello ${nameToGreet}!  This code is gonna be off the hook`);
    console.log(`Hello ${action}!  <<<-- This is what we're doing? >>>`);

    if (action === 'update-push') {
      console.log('Were going to trick out this push');
    }

    if (action === 'update-change-log') {
      console.log('Updating the change log');
      const { owner, repo, number } = context.issue;

      const client = new Octokit({ auth: `token ${GITHUB_TOKEN}` });

      const data = await client.pulls.get({
        repo,
        pull_number: number,
      });

      console.log(owner, repo, number);

      console.log('---------------------------------------');
      console.log(data);
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
