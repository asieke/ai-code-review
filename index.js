import core from '@actions/core';
import github from '@actions/github';
import axios from 'axios';
import { Configuration, OpenAIApi } from 'openai';
import fs from 'fs';
import { Base64 } from 'js-base64';

import { updateChangeLog } from './actions/update-change-log.js';

async function main() {
  try {
    // `who-to-greet` input defined in action metadata file
    const action = core.getInput('action');

    if (action === 'update-change-log') {
      console.log('[ACTION] - UPDATING CHANGE LOG');
      await updateChangeLog();
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

main(); // Execute the main function
