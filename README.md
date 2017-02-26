# Post the status of the toilet door to slack using Raspberry Pi

A simple bot using node js to poll a door sensor (gpio pin) and post the result
to a Slack Channel

### Installation

**Requirements**
- Node 7 or later

```
  $ git clone https://github.com/jpdenford/ToiletBot.git
  $ cd ToiletBot
  $ npm install
```

### Running
Create a Slack Bot
https://jpslackbot.slack.com/apps/new/A0F7YS25R-bots
and export the token to your environment
`export TBOT_TOKEN=XXXXXXXXX`

Then start the bot with
`npm start -- --chanelID=123567`

| Name      | Description                  | Default   | Required |
|-----------|------------------------------|-----------|----------|
| channelid | slack channel id to post to  | undefined | Yes      |
| pin       | gpio pin to read door status | 11        | no       |
