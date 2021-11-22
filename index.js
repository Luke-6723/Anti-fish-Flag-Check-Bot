const Eris = require('eris')
const fetch = require('node-fetch')
const AsciiTable = require('ascii-table')
const { token, channelID, guildID } = require('./config.json')
const bot = new Eris(token)
const exec = require('child_process').exec

bot.on('ready', () => {
  console.log('Ready to check flags!')
})

const checkCodes = ['301', '302']

const _followDomain = (url) => {
  return new Promise((resolve, reject) => {
    exec(`curl -I ${url}`, (_, stdout, stderr) => {
      // if (_ || stderr) _ ? reject(_) : reject(stderr)
      resolve(stdout)
    })
  })
}

function isMoved (output) {
  return checkCodes.includes(output.split('\n')?.[0].split(' ')?.[1])
}

async function followDomain (url) {
  const domainLoc = await _followDomain(url)
  if (isMoved(domainLoc)) {
    url = domainLoc.match(/(Location:).*/gm)[0].split(' ')[1].match(/(?:[aA-zZ0-9](?:[aA-zZ0-9-]{0,61}[aA-zZ0-9])?\.)+[aA-zZ0-9][aA-zZ0-9-]{0,61}[aA-zZ0-9]/gm)
    return url[0]
  }
  return url.substr(0, url.length - 1)
}

bot.on('messageCreate', async (msg) => {
  if (msg.author.bot) return
  const urls = []
  const origContent = msg.content
  const contentMatch = msg.content.match(/((?:[aA-zZ0-9](?:[aA-zZ0-9-]{0,61}[aA-zZ0-9])?\.)+[aA-zZ0-9][aA-zZ0-9-]{0,61}[aA-zZ0-9])(\/?)(.*)/gm) || msg.content.match(/(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/gm)
  for (let i = 0; i < contentMatch.length; i++) {
    console.log(contentMatch.length, i)
    const urlOut = await followDomain(contentMatch[i])
    console.log(urlOut)
    urls.push(urlOut)
    if ((i + 1) === contentMatch.length) {
      msg.content = origContent.match(/(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/gm)
      if (msg?.channel?.guild?.id === guildID) {
        if (msg.channel.id === channelID) {
          const data = JSON.stringify({
            message: msg.content.join(' ')
          })
          let result = await fetch('https://anti-fish.bitflow.dev/check', {
            method: 'POST',
            headers: {
              'User-Agent': 'Anti-Fish-Flag-Check-Bot v0.0.1',
              'Content-Type': 'application/json'
            },
            body: data
          }).catch(err => console.log(err))
          result = await result.json()
          if (result.match) {
            let description = 'Flagged on current sources:\n```\n'
            const table = new AsciiTable()
              .setHeading('domain', 'source', 'type', 'trust rating')

            result.matches.forEach(m => {
              table.addRow(m.domain, m.source, m.type, m.trust_rating)
            })
            description += table.toString() + '\n\nUnmatched domains (if any):'

            let unmatchedDomains = 0
            const domains = result.matches.map(m => m.domain)
            msg.content.forEach(d => {
              if (!domains.includes(d)) {
                unmatchedDomains++
                description += `\n${d}`
              }
            })

            if (unmatchedDomains === 0) description += '\nNo unmatched domains```'
            else description += '```'

            msg.channel.createMessage({
              message_reference: {
                message_id: msg.id,
                channel_id: msg.channel.id
              },
              content: `**Domain is already flagged!**\n${description}`
            })
          } else {
            if (contentMatch.length > 0) {
              msg.channel.createMessage({
                message_reference: {
                  message_id: msg.id,
                  channel_id: msg.channel.id
                },
                content: `Parsed unmatched domains:\n\`\`\`\n${urls.join('\n')}\`\`\``
              })
            }
          }
        }
      }
    }
  }
})

bot.connect()
