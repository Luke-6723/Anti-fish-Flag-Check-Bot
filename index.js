const Eris = require('eris')
const fetch = require('node-fetch')
const { token, channelID, guildID } = require('./config.json')
const bot = new Eris(token)

bot.on('ready', () => {
  console.log('Ready to check flags!')
})

bot.on('messageCreate', async (msg) => {
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
        let description = 'Flagged on current sources:\n```\n[source | type | trust rating]\n'
        result.matches.forEach(m => {
          description += `${m.source} | ${m.type} | ${m.trust_rating}`
        })
        description += '```'

        msg.channel.createMessage({
          embed: {
            title: 'Domain is already flagged!',
            description: description
          }
        })
      }
    }
  }
})

bot.connect()
