const config = require('../config.json')
const { Octokit } = require('@octokit/core')
const octokit = new Octokit({ auth: config.githubPAT })
const exec = require('child_process').exec
// ZeroTwo-Bot
module.exports = (title = 'No title provided.', branch) => {
  return octokit.request('POST /repos/Luke-6723/anti-fish-lists/pulls', {
    owner: 'Luke-6723',
    title: title,
    repo: 'anti-fish-lists',
    head: `Luke-6723:${branch}`,
    base: 'main'
  }).catch(e => console.log(e.response.data))
}
