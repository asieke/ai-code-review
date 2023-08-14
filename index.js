import core from '@actions/core';
import github from '@actions/github';
import axios from 'axios';
import { Configuration, OpenAIApi } from 'openai';
import fs from 'fs';
import { Base64 } from 'js-base64';

import { describePR } from './lib/describe-pr.js';

async function main() {
  try {
    // `who-to-greet` input defined in action metadata file
    const action = core.getInput('action');

    if (action === 'update-push') {
      console.log('[ACTION] - UPDATING PUSH');
    }

    if (action === 'update-pr') {
      console.log('[ACTION] - UPDATING PR');
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
