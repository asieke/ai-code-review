import core from '@actions/core';
import github from '@actions/github';
import axios from 'axios';
import { Configuration, OpenAIApi } from 'openai';
import fs from 'fs';
import { Base64 } from 'js-base64';

export const describePR = async (github) => {
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
      {
        role: 'system',
        content: `
              You are an expert code summarizer who summarizing a pull request for a changelog.
              Please summarize any code provided.
              Your output should be in markdown format.
              Only provide your summary, no additional text in your response.
              Each change summary should be no more than 15 words long.
              Only list at MOST 6 relevant changes, it can be fewer if its a smaller PR.
              Changes should be bulleted and included in an emoji.
              Please include after the date and title, a 20-30 word summary of all changes.
              Your return should be in the following format:
              ## [Date of Change] - [Pull Request Title]
              [Link to PR in markdown format]
              [20-30 word summary of all changes]
              - [emoji] [bullet 1 summary of change 1]
              - [emoji] [bullet 2 summary of change 2]
              - etc...
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

  console.log('NEW CHANGE', '\n' + addToChangeLog);

  // use oktokit to update the changelog
  const temp = await octokit.rest.pulls.update({
    owner,
    repo,
    pull_number: number,
    body: addToChangeLog,
  });
};
