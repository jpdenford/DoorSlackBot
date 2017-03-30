# Post the status of the toilet door to slack using Raspberry Pi

A simple bot using node js to poll a door sensor (gpio pin) and post the result
to a Slack Channel

### Requirements
- Node 7 or later
- Raspberry PI

### Installation
1. ```
  git clone https://github.com/jpdenford/ToiletBot.git
  cd ToiletBot
  npm install
  ```
2. Create a Slack Bot  
   https://api.slack.com/bot-users
3. Find the channelID where you want the message to be posted  
   https://api.slack.com/methods/channels.list/test
4. Put the **channelID** and slackbot **TOKEN** in the *config.json* file

### Running
Run command
`sudo node index.js`  
If you want to leave the process running, run `sudo node index.js &`
