const Eris = require('eris')
const fetch = require('node-fetch')
const AsciiTable = require('ascii-table')
const { token, channelID, guildID } = require('./config.json')
const bot = new Eris(token)

bot.on('ready', () => {
  console.log('Ready to check flags!')
})

bot.on('messageCreate', async (msg) => {
  if (msg.author.bot) return
  if (msg?.channel?.guild?.id === guildID) {
    if (msg.channel.id === channelID) {
      const data = JSON.stringify({
        message: msg.content
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
        description += table.toString() + '```'

        msg.channel.createMessage({
          content: `**Domain is already flagged!**\n${description}`
        })
      } else {
        const contentMatch = msg.content.match(/(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/gm)
        if (contentMatch.length > 0) {
          msg.channel.createMessage({
            message_reference: {
              message_id: msg.id,
              channel_id: msg.channel.id
            },
            content: `Parsed unmatched domains:\n\`\`\`\n${contentMatch.join('\n')}\`\`\``
          })
        }
      }
    }
  }
})

bot.connect()
