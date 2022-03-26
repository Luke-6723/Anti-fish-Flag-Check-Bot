const Eris = require('eris')
const fetch = require('node-fetch')
const AsciiTable = require('ascii-table')
const { token, channelID, guildID, clonedRepoFolder } = require('./config.json')
const { readFileSync, writeFileSync, writeFile } = require('fs')
const bot = new Eris(token)
const psl = require('psl')
const createPullRequest = require('./util/createPullRequest')
const { nanoid } = require('nanoid')
const exec = require('child_process').exec

bot.on('ready', () => {
  console.log('Ready to check flags!')
})

const checkCodes = ['301', '302', '308']

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
    url = domainLoc.match(/([Ll]ocation:).*/gm)[0].split(' ')[1].match(/((?:(http|https|Http|Https|rtsp|Rtsp):\/\/(?:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,64}(?:\:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,25})?\@)?)?((?:(?:[a-zA-Z0-9][a-zA-Z0-9\-]{0,64}\.)+(?:(?:[aA-zZ]+|xyz|link|aero|arpa|asia|a[cdefgilmnoqrstuwxz])|(?:biz|b[abdefghijmnorstvwyz])|(?:cat|com|coop|c[acdfghiklmnoruvxyz])|d[ejkmoz]|(?:edu|e[cegrstu])|f[ijkmor]|(?:gov|g[abdefghilmnpqrstuwy])|h[kmnrtu]|(?:info|int|i[delmnoqrst])|(?:jobs|j[emop])|k[eghimnrwyz]|l[abcikrstuvy]|(?:mil|mobi|museum|m[acdghklmnopqrstuvwxyz])|(?:name|net|n[acefgilopruz])|(?:org|om)|(?:pro|p[aefghklmnrstwy])|qa|r[eouw]|s[abcdeghijklmnortuvyz]|(?:tel|travel|t[cdfghjklmnoprtvwz])|u[agkmsyz]|v[aceginu]|w[fs]|y[etu]|z[amw]))|(?:(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9])\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[0-9])))(?:\:\d{1,5})?)(\/(?:(?:[a-zA-Z0-9\;\/\?\:\@\&\=\#\~\-\.\+\!\*\'\(\)\,\_])|(?:\%[a-fA-F0-9]{2}))*)?(?:\b|$)/gm)
    return url[0]
  }
  return url.substr(0, url.length)
}

bot.on('rawWS', (event) => {
  if (event.t === 'INTERACTION_CREATE') {
    if (event.d.data.custom_id === 'deleteMessageAttached') {
      bot.deleteMessage(event.d.message.channel_id, event.d.message.id).catch()
    }
  }
})

const errorMessage = (id) => {
  return {
    content: `<@${id}>
    
please give type of url.
Command syntax: \`-pr <blacklist / whitelist> <url / domain> <domain or url you want to whitelist>\`
**Only domains can be whitelisted. URLs can't be whitelisted.**`,
    components: [
      {
        type: 1,
        components: [{
          type: 2,
          label: '🗑️',
          style: 4,
          custom_id: 'deleteMessageAttached'
        }]
      }
    ]
  }
}

bot.on('messageCreate', async (msg) => {
  if (msg.author.bot) return
  // msg.content = msg.content.toLowerCase()
  const contentMatch = msg.content.replace(/`/gm, '').match(/((?:(http|https|Http|Https|rtsp|Rtsp):\/\/(?:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,64}(?:\:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,25})?\@)?)?((?:(?:[a-zA-Z0-9][a-zA-Z0-9\-]{0,64}\.)+(?:(?:[aA-zZ]+|xyz|link|aero|arpa|asia|a[cdefgilmnoqrstuwxz])|(?:biz|b[abdefghijmnorstvwyz])|(?:cat|com|coop|c[acdfghiklmnoruvxyz])|d[ejkmoz]|(?:edu|e[cegrstu])|f[ijkmor]|(?:gov|g[abdefghilmnpqrstuwy])|h[kmnrtu]|(?:info|int|i[delmnoqrst])|(?:jobs|j[emop])|k[eghimnrwyz]|l[abcikrstuvy]|(?:mil|mobi|museum|m[acdghklmnopqrstuvwxyz])|(?:name|net|n[acefgilopruz])|(?:org|om)|(?:pro|p[aefghklmnrstwy])|qa|r[eouw]|s[abcdeghijklmnortuvyz]|(?:tel|travel|t[cdfghjklmnoprtvwz])|u[agkmsyz]|v[aceginu]|w[fs]|y[etu]|z[amw]))|(?:(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9])\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[0-9])))(?:\:\d{1,5})?)(\/(?:(?:[a-zA-Z0-9\;\/\?\:\@\&\=\#\~\-\.\+\!\*\'\(\)\,\_])|(?:\%[a-fA-F0-9]{2}))*)?(?:\b|$)/gm)
  if (contentMatch < 1) return
  for (let i = 0; i < contentMatch.length; i++) {
    const urlOut = await followDomain(contentMatch[i])
    console.log(`Followed to: ${urlOut}`)
    if ((i + 1) === contentMatch.length) {
      if (msg?.channel?.guild?.id === guildID) {
        if (msg.channel.id === channelID) {
          const data = JSON.stringify({
            message: msg.content.replace(/`/gm, '')
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
          console.log(result)
          if (result.match) {
            let description = 'Flagged on current sources:\n```\n'
            const table = new AsciiTable()
              .setHeading('domain', 'source', 'type', 'trust rating')

            result.matches.forEach(m => {
              table.addRow(m.domain, m.source, m.type, m.trust_rating)
            })

            description += table.toString() + '\n\n'

            description += 'Matched full urls (if any):'
            result.matches.forEach(m => {
              description += `\n${m.url}`
            })

            description += '\n\nUnmatched domains (if any):'

            let unmatchedDomains = 0
            const domains = result.matches.map(m => m.domain)
            contentMatch.forEach(d => {
              if (!domains.includes(d) && domains.includes(d.url)) {
                unmatchedDomains++
                description += `\n${d}`
              }
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

              description += table.toString() + '\n\n'

              description += 'Matched full urls (if any):'
              result.matches.forEach(m => {
                description += `\n${m.url}`
              })

              description += '\n\nUnmatched domains (if any):'

              let unmatchedDomains = 0
              const domains = result.matches.map(m => m.domain)
              contentMatch.forEach(d => {
                if (!domains.includes(d) && domains.includes(d.url)) {
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
                components: [
                  {
                    type: 1,
                    components: [{
                      type: 2,
                      label: '🗑️',
                      style: 4,
                      custom_id: 'deleteMessageAttached'
                    }]
                  }
                ],
                content: `**Domain is already flagged!**\n${description}`
              })
            } else {
              if (contentMatch.length > 0) {
                msg.channel.createMessage({
                  message_reference: {
                    message_id: msg.id,
                    channel_id: msg.channel.id
                  },
                  components: [
                    {
                      type: 1,
                      components: [{
                        type: 2,
                        label: '🗑️',
                        style: 4,
                        custom_id: 'deleteMessageAttached'
                      }]
                    }
                  ],
                  content: `Parsed unmatched domains:\n\`\`\`\n${contentMatch.map(m => m.match(/(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/gm)).join('\n')}\n\nDomains followed to:\n${urlOut} \`\`\``
                })
              }
            }
          }
        }
      }
    }
  }
})

bot.connect()
