var express = require('express');
var app = express();
var server = require('http').createServer(app);
var path = require('path');
var port = process.env.PORT || 3000;
var io = require('socket.io')(server);
var nodemailer = require('nodemailer');
server.listen(port, function() {
    console.log('Server running at http://127.0.0.1:' + port + '/');
});

var TESTING = false;

//DATABASE
var players = [[{"playerId":0,"name":"Segoshi","pic":"images/p0.png"},{"playerId":1,"name":"Ben","pic":"images/d2.png"},{"playerId":2,"name":"Dana","pic":"images/p2.png"},{"playerId":3,"name":"Fannie","pic":"images/p3.png"},{"playerId":4,"name":"Tim","pic":"images/d0.png"},{"playerId":5,"name":"Andy D","pic":"images/d0.png"},{"playerId":6,"name":"Patrick Hart","pic":"images/d0.png"},{"playerId":7,"name":"John","pic":"images/d0.png"},{"playerId":8,"name":"L","pic":"images/d2.png"},{"playerId":9,"name":"DonutWrangle","pic":"images/d0.png"},{"playerId":10,"name":"2pac","pic":"images/d0.png"}],[{"playerId":0,"password":"","level":7,"colorIndex":7,"volume":0.3,"controlCodes":[38,40,37,39],"controlInputs":["↑","↓","←","→"],"showComponents":{"music":true,"chat":true}},{"playerId":1,"password":"pass","level":8,"colorIndex":7,"volume":0.1,"controlCodes":[79,75,37,39],"controlInputs":["o","k","←","→"],"showComponents":{"music":true,"chat":true}},{"playerId":2,"password":"","level":8,"colorIndex":8,"volume":0.3,"controlCodes":[38,40,37,39],"controlInputs":["↑","↓","←","→"],"showComponents":{"music":true,"chat":true}},{"playerId":3,"password":"","level":5,"colorIndex":5,"volume":0.3,"controlCodes":[38,40,37,39],"controlInputs":["↑","↓","←","→"],"showComponents":{"music":true,"chat":true}},{"playerId":4,"password":"innerparty","level":6,"colorIndex":6,"volume":0.3,"controlCodes":[70,74,37,39],"controlInputs":["f","j","←","→"],"showComponents":{"music":true,"chat":true}},{"playerId":5,"password":"qweqwe","level":11,"colorIndex":5,"volume":0.3,"controlCodes":[76,68,37,39],"controlInputs":["l","d","←","→"],"showComponents":{"music":true,"chat":true}},{"playerId":6,"password":"Cronin","level":4,"colorIndex":4,"volume":0.3,"controlCodes":[38,40,37,39],"controlInputs":["↑","↓","←","→"],"showComponents":{"music":true,"chat":true}},{"playerId":7,"password":"encryptme","level":11,"colorIndex":11,"volume":0,"controlCodes":[74,70,37,39],"controlInputs":["j","f","←","→"],"showComponents":{"music":false}},{"playerId":8,"password":"TENEX7been","level":8,"colorIndex":6,"volume":0.3,"controlCodes":[39,40,71,72],"controlInputs":["→","↓","g","h"],"showComponents":{"music":true,"chat":true}},{"playerId":9,"password":"roadbotics","level":9,"colorIndex":4,"volume":0.3,"controlCodes":[38,40,37,39],"controlInputs":["↑","↓","←","→"],"showComponents":{"music":true,"chat":true}},{"playerId":10,"password":"2pac","level":5,"colorIndex":5,"volume":0.3,"controlCodes":[38,40,37,39],"controlInputs":["↑","↓","←","→"],"showComponents":{"music":true,"chat":true}}]];

var allRecords = [[[{"playerId":1,"score":1820},{"playerId":4,"score":1680},{"playerId":4,"score":1620},{"playerId":4,"score":1610},{"playerId":4,"score":1580},{"playerId":4,"score":1560},{"playerId":4,"score":1530},{"playerId":4,"score":1490},{"playerId":4,"score":1310},{"playerId":1,"score":1030},{"playerId":1,"score":400}],[{"playerId":7,"score":6380},{"playerId":5,"score":6020},{"playerId":7,"score":5950},{"playerId":7,"score":5930},{"playerId":5,"score":5920},{"playerId":5,"score":5910},{"playerId":7,"score":5870},{"playerId":7,"score":5840},{"playerId":7,"score":5830},{"playerId":7,"score":5830},{"playerId":7,"score":5810},{"playerId":5,"score":5780},{"playerId":7,"score":5780},{"playerId":7,"score":5740},{"playerId":5,"score":5700},{"playerId":7,"score":5670},{"playerId":7,"score":5660},{"playerId":5,"score":5650},{"playerId":5,"score":5650},{"playerId":5,"score":5650},{"playerId":7,"score":5650},{"playerId":7,"score":5640},{"playerId":5,"score":5600},{"playerId":7,"score":5590},{"playerId":7,"score":5590},{"playerId":7,"score":5580},{"playerId":7,"score":5580},{"playerId":7,"score":5510},{"playerId":5,"score":5510},{"playerId":7,"score":5510},{"playerId":7,"score":5500},{"playerId":7,"score":5500},{"playerId":5,"score":5490},{"playerId":7,"score":5470},{"playerId":5,"score":5460},{"playerId":5,"score":5460},{"playerId":5,"score":5410},{"playerId":7,"score":5380},{"playerId":5,"score":5360},{"playerId":5,"score":5340},{"playerId":5,"score":5330},{"playerId":5,"score":5280},{"playerId":7,"score":5260},{"playerId":7,"score":5230},{"playerId":5,"score":5190},{"playerId":7,"score":5160},{"playerId":7,"score":5140},{"playerId":5,"score":5000},{"playerId":5,"score":4980},{"playerId":5,"score":4950},{"playerId":9,"score":4920},{"playerId":8,"score":4610},{"playerId":1,"score":4530},{"playerId":5,"score":4520},{"playerId":8,"score":4510},{"playerId":8,"score":4500},{"playerId":8,"score":4450},{"playerId":8,"score":4330},{"playerId":5,"score":4330},{"playerId":8,"score":4300},{"playerId":8,"score":4190},{"playerId":8,"score":4190},{"playerId":8,"score":4140},{"playerId":8,"score":4140},{"playerId":8,"score":4140},{"playerId":8,"score":4080},{"playerId":8,"score":4010},{"playerId":8,"score":3910},{"playerId":7,"score":3910},{"playerId":8,"score":3860},{"playerId":8,"score":3610},{"playerId":9,"score":3540},{"playerId":4,"score":3050},{"playerId":9,"score":2970},{"playerId":9,"score":2970},{"playerId":10,"score":2780},{"playerId":10,"score":2550},{"playerId":10,"score":2530},{"playerId":10,"score":2510},{"playerId":10,"score":2490},{"playerId":4,"score":2480},{"playerId":4,"score":2360},{"playerId":4,"score":2340},{"playerId":10,"score":2340},{"playerId":10,"score":2320},{"playerId":4,"score":2310},{"playerId":10,"score":2290},{"playerId":4,"score":2280},{"playerId":4,"score":2270},{"playerId":10,"score":2260},{"playerId":10,"score":2150},{"playerId":6,"score":2130},{"playerId":10,"score":2120},{"playerId":10,"score":2090},{"playerId":10,"score":1950},{"playerId":10,"score":1930},{"playerId":10,"score":1520},{"playerId":7,"score":1130},{"playerId":7,"score":1100},{"playerId":4,"score":950},{"playerId":5,"score":630},{"playerId":5,"score":390},{"playerId":7,"score":350}],[]],[[],[{"playerId":5,"score":2570},{"playerId":5,"score":2370},{"playerId":10,"score":1790},{"playerId":10,"score":1750},{"playerId":10,"score":1750},{"playerId":10,"score":1740},{"playerId":10,"score":1740},{"playerId":10,"score":1720},{"playerId":10,"score":1680},{"playerId":10,"score":1530}],[]]];

var personalRecords = [[[{"playerId":1,"score":1820},{"playerId":4,"score":1680}],[{"playerId":7,"score":6380},{"playerId":5,"score":6020},{"playerId":9,"score":4920},{"playerId":8,"score":4610},{"playerId":1,"score":4530},{"playerId":2,"score":4280},{"playerId":0,"score":4180},{"playerId":4,"score":3050},{"playerId":10,"score":2780},{"playerId":3,"score":2770},{"playerId":6,"score":2130}],[]],[[],[{"playerId":5,"score":2570},{"playerId":10,"score":1790}],[]]];

var illegitimateRecords = [[ [], [ {playerId: 9, score: 9999} ], []], [[], [], []]];

var messages = [];



//CONSTANTS
var LEVEL_INCREMENT = 600;

var THEORETICAL_MAX = 6500;


//SESSION VARIABLES
var sessions = [];
var open = true;
var activeSessions = 0;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.set('transports', ['websocket', 'polling']);

io.on('connection', function(socket) {

    var sessionId = -1; 
    
    socket.on('refresh', function() {
        socket.emit('refresh'); 
    });
    
    
//PLAYER ID/INFO
    var inUse = function(playerId, loggingIn) {
        for (var i = 0; i < sessions.length; i++) {
            if (loggingIn) {
                socket.emit('sessionAdded', i, sessions[i].playerId, sessions[i].active, sessions[i].chattable);
            }           
            if (sessions[i].playerId === playerId) {
                return true; 
            }
        }
        return false;
    };
    
    var taken = function(name) {
        for (var i = 0; i < players.length; i++) {
            if (players[0][i].name === name) {
                return true; 
            }
        }
        return false;
    };
    
    
    socket.on('getPlayers', function() {
        socket.emit('gotPlayers', players[0]);
    });
    
    
    socket.on('establishId', function(playerId) {
        if (!inUse(playerId, false)) {
            socket.emit('idEstablished', [players[0][playerId], players[1][playerId]]);
        }
        else {
            socket.emit('inUse');
        }
    });
    
    socket.on('createPlayer', function(name) {
        if (!taken(name)) {
            var newId = players[0].length;
            players[0].push({
                playerId: newId,
                name: name,
                pic: 'images/d0.png'
            });
            players[1].push({
                playerId: newId,
                password: '',
                level: 0,
                colorIndex: 0,
                volume: 0.3,
                controlCodes: [38, 40, 37, 39],
                controlInputs: ['↑', '↓', '←', '→'],
                showComponents: {music: true, chat: true}
            });

            io.emit('gotPlayer', players[0][newId]);
            socket.emit('idEstablished', [players[0][newId], players[1][newId]]);
        }
        else {
            socket.emit('nameTaken');
        }
    });
    
    socket.on('createPassword', function(details) {
        players[1][details.playerId].password = details.password;        
    });
    
    
    
//SESSION ID/INFO
    socket.on('logIn', function(details) {      
        
        if (!inUse(details.playerId, true)) {
            if (!TESTING) {
                sendMail(MY_EMAIL, "LOGIN " + details.playerId, JSON.stringify(players[0][details.playerId]) + ' ' + players[1][details.playerId]);
            }
            
            sessions.push(socket);
            sessionId = sessions.indexOf(socket);
        
            sessions[sessionId].playerId = details.playerId;
            sessions[sessionId].score = 0;
            sessions[sessionId].stack = [];
            sessions[sessionId].progress = [];
            sessions[sessionId].active = false;
            sessions[sessionId].chattable = details.chattable;
                    
            io.emit('sessionAdded', sessionId, details.playerId, false, details.chattable);
            
            socket.emit('activityGot', activeSessions, open);
        }
        else {
            socket.emit('inUse');
        }        
    });
    
    socket.on('updateChattability', function(details) {
        if (sessionId < 0) return;
        
        sessions[sessionId].chattable = details.chattable;

        io.emit('chattabilityUpdated', sessionId, details.chattable);
    });
    
    socket.on('refreshSessions', function() {
        sessionId = sessions.indexOf(socket);
    });
    
    socket.on('disconnect', function() {
        if (sessionId < 0) return;
        
        if (!TESTING) {
            sendMail(MY_EMAIL, "LOGOUT " + sessions[sessionId].playerId, JSON.stringify(players[0][sessions[sessionId].playerId]) + ' ' + players[1][sessions[sessionId].playerId]); 
        }
    
        if (sessions[sessionId].active) {
            activeSessions--;
            if (activeSessions === 0) {
                open = true;
                io.emit('openRoom');
            }
        }
        
        sessions.splice(sessionId, 1);

        io.emit('removeSession', sessionId);
        socket = [];
    });
   
    socket.on('checkSession', function() {
        socket.emit('sessionChecked', sessionId); 
    });
    
    
    
    
    
//GAME
    
    socket.on('joinSession', function() {
        if (sessionId < 0) return;
        sessions[sessionId].active = true;
        io.emit('sessionJoined', sessionId);
        activeSessions++;
    });

    socket.on('updateGametype', function(settings) {
        if (sessionId < 0) return;
        io.emit('gametypeUpdated', settings);          
    });    
    
    socket.on('startGame', function() {
        if (sessionId < 0) return;
        open = false;  
        io.emit('gameStarted');
    });
    
    socket.on('updateGame', function(session) {          
        if (sessionId < 0) return;
        
        sessions[sessionId].score = session.score;
        sessions[sessionId].stack = session.stack;
        sessions[sessionId].progress = session.progress;

        io.emit('gameUpdated', sessionId, {score: session.score, stack: session.stack, progress: session.progress});
    });
    
    socket.on('endGame', function() {
        if (sessionId < 0) return;
        var highScore = 0;
        for (var i = 0; i < sessions.length; i++) {
            var score = sessions[i].score;
            if (score > highScore && sessions[i].active)
                highScore = score;
        }
        socket.emit('gameEnded', highScore);
    });
    
    socket.on('recordScore', function(session) {
        if (session.playerId < 0 || session.score === 0 || sessionId < 0) return;

        var l = session.level/2 - 1;
        var d = Math.floor(session.duration / 60);
        
//if no records exist for this level/duration, insert this
        if (allRecords[l][d].length === 0) {
            allRecords[l][d].push({playerId: session.playerId, score: session.score});
        }
        else {
//iterate from the bottom up until you find a score that is greater than or equal to this one; insert this one behind it
            var i = allRecords[l][d].length;
            while (i > 0 && session.score > allRecords[l][d][i - 1].score) {
                i--;
            }
            
//if score is impossibly high, insert into illegitimate        
            if (l === 0 && d === 1 && session.score > THEORETICAL_MAX) {
                illegitimateRecords[l][d].splice(0, 0, {playerId: session.playerId, score: session.score});
                return;
            }
            allRecords[l][d].splice(i, 0, {playerId: session.playerId, score: session.score});
        }
        
        sendMail(MY_EMAIL, "RECORDS UPDATED (all)", JSON.stringify(allRecords));

    
//if no records exist for this level/duration, insert this        
        if (personalRecords[l][d].length === 0) {
            personalRecords[l][d].push({playerId: session.playerId, score: session.score});
        }
        else {
//iterate from the top down until you find a score that matches this player id or is less than or equal to this score
            var i = 0;
            while (i < personalRecords[l][d].length && session.score < personalRecords[l][d][i].score) {
//if player id matches and score is still less, return
                if (personalRecords[l][d][i].playerId === session.playerId) {
                    return;
                }
                i++;
            }
//score must be highest for this player; it fits here, so insert it
            personalRecords[l][d].splice(i, 0, {playerId: session.playerId, score: session.score});

//remove existing score for this player
            for (var j = i + 1; j < personalRecords[l][d].length; j++) {
                if (personalRecords[l][d][j].playerId === session.playerId) {
                    personalRecords[l][d].splice(j, 1);
                }
            }
        }

//thresholds for leveling up...
        if (l == 0 && d == 1) {
            var level = Math.ceil((session.score + 1)/LEVEL_INCREMENT);
            if (level > players[1][session.playerId].level) {
                players[1][session.playerId].level = level;
                socket.emit('levelUp', level);
            }
        }  
        else if (l == 0 && d == 0) {
            var level = Math.ceil((session.score + 1)/(LEVEL_INCREMENT/2));
            if (level > players[1][session.playerId].level) {
                players[1][session.playerId].level = level;
                socket.emit('levelUp', level);
            }
        }  
        else if (l == 0 && d == 2) {
            var level = Math.ceil((session.score + 1)/(LEVEL_INCREMENT*2));
            if (level > players[1][session.playerId].level) {
                players[1][session.playerId].level = level;
                socket.emit('levelUp', level);
            }
        }   
        else if (l == 1 && d == 1) {
            var level = Math.ceil((session.score + 1)/(LEVEL_INCREMENT*0.75));
            if (level > players[1][session.playerId].level) {
                players[1][session.playerId].level = level;
                socket.emit('levelUp', level);
            }
        }  
        else if (l == 1 && d == 0) {
            var level = Math.ceil((session.score + 1)/(LEVEL_INCREMENT*0.375));
            if (level > players[1][session.playerId].level) {
                players[1][session.playerId].level = level;
                socket.emit('levelUp', level);
            }
        }  
        else if (l == 1 && d == 2) {
            var level = Math.ceil((session.score + 1)/(LEVEL_INCREMENT*1.5));
            if (level > players[1][session.playerId].level) {
                players[1][session.playerId].level = level;
                socket.emit('levelUp', level);
            }
        } 
        
        sendMail(MY_EMAIL, "RECORDS UPDATED (personal)", JSON.stringify(personalRecords));
        
    });
    
    socket.on('refreshGame', function() {
        open = true;
        io.emit('gameRefreshed');
    });
    
    socket.on('sessionLeave', function() {
        if (sessionId < 0) return;
        
        sessions[sessionId].active = false;
        activeSessions--;
        io.emit('sessionLeft', sessionId);
        if (activeSessions === 0) {
            io.emit('gameRefreshed');
            open = true;
        }
    });
    
    socket.on('getRecords', function() {
        socket.emit('recordsGot', allRecords, personalRecords, illegitimateRecords);
    });
    
    logPlayers = function() {
        console.log('Current Players:');
        for (var i = 0; i < sessions.length; i++) {
            console.log(i + ' | ' + sessions[i].playerId + ' | ' + sessions[i].active);
        }
    };
 
    
    
    
//SETTINGS
    
    socket.on('setPlayer', function(details) {
        if (details.type === 'name' && !taken(details.value)) {
            players[0][details.playerId].name = details.value;
            io.emit('gotPlayer', players[0][details.playerId]);
        } 
        else if (details.type === 'pic') {
            players[0][details.playerId].pic = details.value;
            io.emit('gotPlayer', players[0][details.playerId]);
        } 
        else if (details.type === 'password') {
            players[1][details.playerId].password = details.value;
        } 
        else if (details.type === 'volume') {
            players[1][details.playerId].volume = details.value;
        } 
        else if (details.type === 'feature') {
            players[1][details.playerId].showComponents = details.value;
        }
        else if (details.type === 'color') {
            players[1][details.playerId].colorIndex = details.value;
        }
        else if (details.type === 'name') {
            socket.emit('nameTaken');   
        }

    });
    
    socket.on('setControls', function(details) {
        players[1][details.playerId].controlCodes[details.index] = details.code;
        players[1][details.playerId].controlInputs[details.index] = details.input;
    });
    
    

 
    
//CHAT 
    
    socket.on('getMessages', function() {
        socket.emit('messagesGot', messages);
    });
    
    socket.on('sendMessage', function(message) {
        messages.push(message);
        io.emit('messageSent', message);
    });
    
    socket.on('removeMessage', function(index) {
        messages.splice(index, 1);
        io.emit('messageRemoved', index);
    });
    
    
      
    
    
//CONTACT
    
    socket.on('sendContact', function(message) {
        sendMail(MY_EMAIL, 'Block Drop feature request from ' + message.sender, message.content + '\n\n' + message.email);
    });
    
    socket.on('sendPassword', function(details) {
        sendMail(details.email, 'Information for ' + details.name, 'This is your information: ' + players[1][details.playerId].password);
    });
    
});

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'dropblocks422@gmail.com',
        pass: 'pi314159'
    }
});

var mailOptions = {
    from: 'dropblocks422@gmail.com',
    to: '',
    subject: '',
    text: ''
};

var MY_EMAIL = 'bcronin2@gmail.com';

var sendMail = function(email, subject, text) {
    mailOptions.to = email;
    mailOptions.subject = subject;
    mailOptions.text = text;
    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        } 
        else {
            console.log('Request sent: ' + info.response);
        }
    });
};

if (!TESTING) {
    setInterval(function() {
        sendMail(MY_EMAIL, "PLAYER REPORT", JSON.stringify(players));
        sendMail(MY_EMAIL, "RECORDS REPORT (all)", JSON.stringify(allRecords));
        sendMail(MY_EMAIL, "RECORDS REPORT (personal)", JSON.stringify(personalRecords));
    }, 1000*60*30);
    setInterval(function() {
        sendMail(MY_EMAIL, "CHAT REPORT", JSON.stringify(messages));
    }, 1000*60*60*24);
}


