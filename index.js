const winston = require('winston') // logging
const Promise = require('promise')
// network
const https = require('https')
const querystring = require('querystring')

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)(),
    new (winston.transports.File)({ filename: 'toiletbot.log' })
  ]
});
// Setup slack constants
const SLACK_TOKEN = process.env.SLACK_TOKEN
const SLACK_CHANNEL_ID = 'C4971HM3M'
const CLOSED_MESSAGE = ':no_entry_sign:'
const OPEN_MESSAGE = ':toilet:'

// other
const DOOR_UPDATE_FREQ = 5000 // frequency to check door and update
const DOOR_OPEN = 'OPEN'
const DOOR_CLOSED = 'CLOSE'

// state
let prevMsgTimestamp = undefined
let prevStatus = DOOR_OPEN

function checkStatus() {
  const curStatus = readDoor();
  if(curStatus != prevStatus){
    prevStatus = curStatus;
    logger.info('Door changed to '+ curStatus);
    const msg = curStatus == DOOR_OPEN? OPEN_MESSAGE : CLOSED_MESSAGE;
    // update and save the timestamp of the message
    updateSlack(msg, prevMsgTimestamp).then(ts => {prevMsgTimestamp = ts;});
  }
}

// Keep checking door every so often
setInterval(checkStatus, DOOR_UPDATE_FREQ);

// TODO replace with hardware call
// simulate the opening and closing of the door
function readDoor(){
  // const didChange = Math.random() > 0.;
  const newStat = true ? (prevStatus == DOOR_OPEN? DOOR_CLOSED : DOOR_OPEN) : prevStatus;
  return newStat;
}

function updateSlack(status, prevMsgTimestamp) {
  return new Promise(function(fulfill, reject){
    const text = CLOSED_MESSAGE;
    // auxillary function to construct request params
    request(getMessagesOpts(1)).then(res => {
      const lastSlackMessage = res.messages[0]
      // TODO flatten this using Promise control flows
      if(lastSlackMessage && prevMsgTimestamp && lastSlackMessage.ts == prevMsgTimestamp) {
        // update message
        request(updateMessageOpts(text, prevMsgTimestamp)).then(res => {
          fulfill(res.ts); // return timstamp
        }, reject);
      } else {
        // post new
        request(newMessageOpts(text)).then(res => {
          fulfill(res.ts) // return timestamp
        }, reject);
      }
      console.log(res);
    }, logger.error);
  });
}

// returns Promise[Object] constining response
function request(options) {
  return new Promise(function(fulfill, reject){
    //create reqest
    const req = https.request(options, (res) => {
      res.on('data', (chunk) => {
        fulfill(chunk);
      });
    });

    req.on('error', reject);
    req.end(); // send request
    logger.info('Sent request to ' + options.path);
  }).then(chunk => { //parse the json
    let data = JSON.parse(chunk);
    logger.info('Response received: ' + JSON.stringify(data));
    return data;
  });
}

// helper functions construct arguments for posting new messages
function newMessageOpts(text) {
    const queryParams = {
        token: SLACK_TOKEN,
        channel: SLACK_CHANNEL_ID,
        text
    };

    return {
        hostname: 'slack.com',
        path: '/api/chat.postMessage?' + querystring.stringify(queryParams),
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }
}

// update a given message
function updateMessageOpts(text, timestamp) {
    const queryParams = {
        token: SLACK_TOKEN,
        channel: SLACK_CHANNEL_ID,
        text: text,
        ts: timestamp
    };

    return {
        hostname: 'slack.com',
        path: '/api/chat.update?' + querystring.stringify(queryParams),
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }
}

// get the last n messages in the channel
function getMessagesOpts(count) {
    const queryParams = {
        token: SLACK_TOKEN,
        channel: SLACK_CHANNEL_ID,
        count: count
    };

    return {
        hostname: 'slack.com',
        path: '/api/channels.history?' + querystring.stringify(queryParams),
        method: 'GET',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }
}
