const winston = require('winston') // logging
require('winston-daily-rotate-file')
const fs = require('fs');

//check log dir exists
const dir = './log';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

const logger = new(winston.Logger)({
    transports: [
        new(winston.transports.Console)({ level: 'info'}),
        new(winston.transports.DailyRotateFile)({
            level: 'warn',
            name: 'file',
            datePattern: '.yyyy-MM-ddTHH',
            filename: dir + "/toiletbot.log"
        })
    ]
})

module.exports = logger;
