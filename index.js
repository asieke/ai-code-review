const core = require('@actions/core');
const github = require('@actions/github');

try {
  // `who-to-greet` input defined in action metadata file
  const nameToGreet = core.getInput('who-to-greet');
  const nameToGreet = core.getInput('action');
  console.log(`Hello ${nameToGreet}!  This code is gonna be off the hook`);
  console.log(`Hello ${action}!  <<<-- This is what we're doing? >>>`);
  const time = new Date().toTimeString();
  core.setOutput('time', time);
  // Get the JSON webhook payload for the event that triggered the workflow
  const payload = JSON.stringify(github.context.payload, undefined, 2);

  const octokit = github.getOctokit(process.env.GITHUB_TOKEN);

  console.log(octokit);

  console.log(`The event payload: ${payload}`);
} catch (error) {
  core.setFailed(error.message);
}
