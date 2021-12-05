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
    url = domainLoc.match(/([Ll]ocation:).*/gm)[0].split(' ')[1].match(/(https?:\/\/)?((?:[aA-zZ0-9](?:[aA-zZ0-9-]{0,61}[aA-zZ0-9])?\.)+[aA-zZ0-9][aA-zZ0-9-]{0,61}[aA-zZ0-9])(\/?)(.*)/gm)
    return url[0]
  }
  return url.substr(0, url.length)
}

bot.on('messageCreate', async (msg) => {
  if (msg.author.bot) return
  const origContent = msg.content.match(/(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/gm)
  const contentMatch = msg.content.match(/((?:(http|https|Http|Https|rtsp|Rtsp):\/\/(?:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,64}(?:\:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,25})?\@)?)?((?:(?:[a-zA-Z0-9][a-zA-Z0-9\-]{0,64}\.)+(?:(?:link|aero|arpa|asia|a[cdefgilmnoqrstuwxz])|(?:biz|b[abdefghijmnorstvwyz])|(?:cat|com|coop|c[acdfghiklmnoruvxyz])|d[ejkmoz]|(?:edu|e[cegrstu])|f[ijkmor]|(?:gov|g[abdefghilmnpqrstuwy])|h[kmnrtu]|(?:info|int|i[delmnoqrst])|(?:jobs|j[emop])|k[eghimnrwyz]|l[abcikrstuvy]|(?:mil|mobi|museum|m[acdghklmnopqrstuvwxyz])|(?:name|net|n[acefgilopruz])|(?:org|om)|(?:pro|p[aefghklmnrstwy])|qa|r[eouw]|s[abcdeghijklmnortuvyz]|(?:tel|travel|t[cdfghjklmnoprtvwz])|u[agkmsyz]|v[aceginu]|w[fs]|y[etu]|z[amw]))|(?:(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9])\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[0-9])))(?:\:\d{1,5})?)(\/(?:(?:[a-zA-Z0-9\;\/\?\:\@\&\=\#\~\-\.\+\!\*\'\(\)\,\_])|(?:\%[a-fA-F0-9]{2}))*)?(?:\b|$)/gm)
  if (contentMatch < 1) return
  for (let i = 0; i < contentMatch.length; i++) {
    const urlOut = await followDomain(contentMatch[i])
    console.log(`Followed to: ${urlOut}`)
    if ((i + 1) === contentMatch.length) {
      if (msg?.channel?.guild?.id === guildID) {
        if (msg.channel.id === channelID) {
          const data = JSON.stringify({
            message: msg.content.match(/(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/gm).join(' ')
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
            origContent.forEach(d => {
              console.log(d)
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
                content: `Parsed unmatched domains:\n\`\`\`\n${contentMatch.map(m => m.match(/(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/gm)).join('\n')}\n\nDomains followed to:\n${urlOut} \`\`\``
              })
            }
          }
        }
      }
    }
  }
})

bot.connect()
