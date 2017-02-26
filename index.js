// TODO use --harmony-async-await
const Promise = require('promise')
const logger = require('./logger')
// network
const fetch = require('node-fetch')
const querystring = require('querystring')

// Setup slack constants
const SLACK_TOKEN = process.env.SLACK_TOKEN
const SLACK_CHANNEL_ID = 'C4971HM3M'
const CLOSED_MESSAGE = ':no_entry_sign:'
const OPEN_MESSAGE = ':toilet:'

// other
const DOOR_UPDATE_FREQ = 1000 // frequency to check door and update
const DOOR_OPEN = 'OPEN'
const DOOR_CLOSED = 'CLOSE'

// state
let prevMsgTimestamp = undefined
let prevStatus = DOOR_OPEN

function checkStatus() {
  const curStatus = readDoor();
  if(curStatus != prevStatus){
    prevStatus = curStatus;
    logger.info('Door changed to ' + curStatus);
    const msg = curStatus == DOOR_OPEN? OPEN_MESSAGE : CLOSED_MESSAGE;
    // update and save the timestamp of the message
    updateSlack(msg, prevMsgTimestamp).then(ts => {prevMsgTimestamp = ts;});
  }
}

// Keep checking door every so often
setInterval(checkStatus, DOOR_UPDATE_FREQ);

// TODO replace with hardware call
// simulate the opening and closing of the door
function readDoor() {
  logger.info('Reading Door Status');
  const didChange = Math.random() > 0.8;
  const newStat = didChange ? (prevStatus == DOOR_OPEN? DOOR_CLOSED : DOOR_OPEN) : prevStatus;
  return newStat;
}

async function updateSlack(status, prevMsgTimestamp) {
  try {
    const historyRes = await request(getMessagesOpts(1))
    const lastSlackMessage = historyRes.messages[0]
    // TODO flatten this using Promise control flows
    if(lastSlackMessage && prevMsgTimestamp && lastSlackMessage.ts == prevMsgTimestamp) {
      // update message
      const updatedMessage = await request(updateMessageOpts(status, prevMsgTimestamp))
      return updatedMessage.ts
    } else {
      // post new
      const newMessageRes = await request(newMessageOpts(status))
      return newMessageRes.ts
    }
  } catch(e) {
    logger.error(e);
  }
}

// returns Promise[Object] constining response body
async function request(path) {
  const res = await fetch(path)
  const text = await res.text()
  return JSON.parse(text)
}

// helper functions construct arguments for posting new messages
function newMessageOpts(text) {
    const queryParams = {
        token: SLACK_TOKEN,
        channel: SLACK_CHANNEL_ID,
        text
    };

    return 'https://slack.com/api/chat.postMessage?' + querystring.stringify(queryParams);
}

// update a given message
function updateMessageOpts(text, timestamp) {
    const queryParams = {
        token: SLACK_TOKEN,
        channel: SLACK_CHANNEL_ID,
        text: text,
        ts: timestamp
    };

    return 'https://slack.com/api/chat.update?' + querystring.stringify(queryParams);
}

// get the last n messages in the channel
function getMessagesOpts(count) {
    const queryParams = {
        token: SLACK_TOKEN,
        channel: SLACK_CHANNEL_ID,
        count: count
    };

    return 'https://slack.com/api/channels.history?' + querystring.stringify(queryParams);
}
