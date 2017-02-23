//logging
const winston = require('winston')
var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)(),
    new (winston.transports.File)({ filename: 'toiletbot.log' })
  ]
});
// network
const https = require('https')
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
let messageTimestamp = undefined
let prevStatus = DOOR_OPEN

function checkStatus() {
  const curStatus = readDoor();
  if(curStatus != prevStatus){
    prevStatus = curStatus;
    const msg = curStatus == DOOR_OPEN? OPEN_MESSAGE : CLOSED_MESSAGE;
    updateSlack(msg);
  }
}

// TODO replace with hardware call
// simulate the opening and closing of the door
function readDoor(){
  const didChange = Math.random() > 0.9;
  const newStat = didChange ? (prevStatus == DOOR_OPEN? DOOR_CLOSED : DOOR_OPEN) : prevStatus;
  if (didChange) logger.info('Door changed to '+ newStat);
  return newStat;
}

// Keep checking door every so often
setInterval(checkStatus, DOOR_UPDATE_FREQ);

function updateSlack(status){
  post(status)
}

function post(text) {
  const {postData, options} = newMessageOpts(text)

  //create reqest
  const req = https.request(options, (res) => {
    res.on('data', (chunk) => {
      let data = JSON.parse(chunk);
      logger.info('Slack Response: ' + JSON.stringify(data));
    });
  });

  req.on('error', (e) => {
    logger.error(`problem with request: ${e.message}`);
  });

  // write data to request and send
  req.write(postData);
  req.end();
  logger.info('Sent request to ' + options.path + ' with ' + postData)
}
// construct values for posting new message
function newMessageOpts(text){
  let postData = querystring.stringify({
    token : SLACK_TOKEN,
    channel: SLACK_CHANNEL_ID,
    text
  });

  let options = {
    hostname: 'slack.com',
    path: '/api/chat.postMessage',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };
  return {postData: postData, options: options };
}

// // returns the latest message in the channel
// function getLatestMessage() {
//   let req = https.request(options, (res) => {
//     console.log(`STATUS: ${res.statusCode}`);
//     console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
//     res.setEncoding('utf8');
//     res.on('data', (chunk) => {
//       console.log(`BODY: ${chunk}`);
//     });
//     res.on('end', () => {
//       console.log('No more data in response.');
//     });
//   });
//
//   req.on('error', (e) => {
//     console.log(`problem with request: ${e.message}`);
//   });
//
//   // write data to request body
//   req.write(postData);
//   req.end();
//
//   console.log(postData);
// }
