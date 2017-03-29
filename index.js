const Promise = require('promise')
const logger = require('./logger')
const gpio = require('rpi-gpio')
const fs = require('fs')

// config
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

// network
const fetch = require('node-fetch')
const querystring = require('querystring')

// Setup slack constants
const SLACK_TOKEN = config.slack_token
const SLACK_CHANNEL_ID = config.channel_id
if(SLACK_TOKEN == '' || SLACK_TOKEN == null || !SLACK_CHANNEL_ID) usageAndExit();
const CLOSED_MESSAGE = config.closed_message ? config.closed_message : ':no_entry_sign:'
const OPEN_MESSAGE = config.open_message ? config.open_message : ':admission_tickets:'

// other
const DOOR_UPDATE_FREQ = 1000 // frequency to check door and update
const DOOR_OPEN = 'OPEN'
const DOOR_CLOSED = 'CLOSE'

// state
let prevMsgTimestamp = undefined
let prevStatus = DOOR_OPEN

// gpio
const PIN = config.pin;
gpio.setup(PIN, gpio.DIR_IN, readInput);

// Keep checking door every so often
setInterval(checkStatus, DOOR_UPDATE_FREQ);

// check the status of the door and update slack if necessary
async function checkStatus() {
  const curStatus = await readDoor();
  if(curStatus != prevStatus){
    prevStatus = curStatus;
    logger.info('Door changed to ' + curStatus);
    const msg = curStatus == DOOR_OPEN ? OPEN_MESSAGE : CLOSED_MESSAGE;
    // update and save the timestamp of the message
    updateSlack(msg, prevMsgTimestamp).then(ts => prevMsgTimestamp = ts);
  }
}

// Check if the door is open or closed
async function readDoor() {
  const pinValue = await readInput(PIN);
  logger.info('Read Door Status: ' + pinValue);
  if(pinValue) return DOOR_CLOSED;
  return DOOR_OPEN;
}

// Reads the value of a pin, returning a promise of the result
function readInput(pin) {
  return new Promise((success, fail) => {
     gpio.read(pin, function(err, value) {
       if(err) {
         fail(err);
         return;
       }
       success(value);	
     });
  });
}

async function updateSlack(status, prevMsgTimestamp) {
  try {
    // if we've already posted a message
    if(prevMsgTimestamp) {
      // delete prev message
      request(deleteMessageOpts(prevMsgTimestamp))
    }
    const newMessageRes = await request(newMessageOpts(status))
    return newMessageRes.ts;
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

// delete a given message
function deleteMessageOpts(timestamp) {
    const queryParams = {
        token: SLACK_TOKEN,
        channel: SLACK_CHANNEL_ID,
        ts: timestamp
    };

    return 'https://slack.com/api/chat.delete?' + querystring.stringify(queryParams);
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

function usageAndExit(){
  // TODO give useful info 'command-line-commands'
  logger.error('Please provide valid config.json')
  process.exit(1)
}

// TODO save timestamp to file on sigint
