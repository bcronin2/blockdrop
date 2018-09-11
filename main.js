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

//"DATABASE" - TODO: convert to proper DB and store passwords securely
//There are two sets of player objects stored in the 'players' objects: public and private
//Public contains 'name' and 'pic' fields for each player
//Private contains 'password', 'level' (0-12), 'colorIndex' (0-12), 'volume' (0-1), 'controlCodes' (keyCodes for arrow controllers), 'controlInputs' (strings to display for arrow controllers), and 'showComponents' (settings for whether music/chat appear)
var players = [
  [{ playerId: 0, name: 'Ben', pic: 'images/d2.png' }],
  [
    {
      playerId: 0,
      password: 'pass',
      level: 8,
      colorIndex: 7,
      volume: 0.1,
      controlCodes: [79, 75, 37, 39],
      controlInputs: ['o', 'k', '←', '→'],
      showComponents: { music: true, chat: true }
    }
  ]
];

var allRecords = [[[], [], []], [[], [], []]];

var personalRecords = [[[], [], []], [[], [], []]];

var illegitimateRecords = [[[], [], []], [[], [], []]];

var messages = [];

//CONSTANTS
var LEVEL_INCREMENT = 600;

var THEORETICAL_MAX = 6500;

//SESSION VARIABLES
var sessions = [];
var open = true;
var activeSessions = 0;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
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
      if (players[i][0].name === name) {
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
    } else {
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
        showComponents: { music: true, chat: true }
      });

      io.emit('gotPlayer', players[0][newId]);
      socket.emit('idEstablished', [players[0][newId], players[1][newId]]);
    } else {
      socket.emit('nameTaken');
    }
  });

  socket.on('createPassword', function(details) {
    players[1][details.playerId].password = details.password;
  });

  //SESSION ID/INFO
  socket.on('logIn', function(details) {
    if (!inUse(details.playerId, true)) {
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
    } else {
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

    io.emit('gameUpdated', sessionId, { score: session.score, stack: session.stack, progress: session.progress });
  });

  socket.on('endGame', function() {
    if (sessionId < 0) return;
    var highScore = 0;
    for (var i = 0; i < sessions.length; i++) {
      var score = sessions[i].score;
      if (score > highScore && sessions[i].active) highScore = score;
    }
    socket.emit('gameEnded', highScore);
  });

  socket.on('recordScore', function(session) {
    if (session.playerId < 0 || session.score === 0 || sessionId < 0) return;

    var l = session.level / 2 - 1;
    var d = Math.floor(session.duration / 60);

    //if no records exist for this level/duration, insert this
    if (allRecords[l][d].length === 0) {
      allRecords[l][d].push({ playerId: session.playerId, score: session.score });
    } else {
      //iterate from the bottom up until you find a score that is greater than or equal to this one; insert this one behind it
      var i = allRecords[l][d].length;
      while (i > 0 && session.score > allRecords[l][d][i - 1].score) {
        i--;
      }

      //if score is impossibly high, insert into illegitimate
      if (l === 0 && d === 1 && session.score > THEORETICAL_MAX) {
        illegitimateRecords[l][d].splice(0, 0, { playerId: session.playerId, score: session.score });
        return;
      }
      allRecords[l][d].splice(i, 0, { playerId: session.playerId, score: session.score });
    }

    sendMail(MY_EMAIL, 'RECORDS UPDATED (all)', JSON.stringify(allRecords));

    //if no records exist for this level/duration, insert this
    if (personalRecords[l][d].length === 0) {
      personalRecords[l][d].push({ playerId: session.playerId, score: session.score });
    } else {
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
      personalRecords[l][d].splice(i, 0, { playerId: session.playerId, score: session.score });

      //remove existing score for this player
      for (var j = i + 1; j < personalRecords[l][d].length; j++) {
        if (personalRecords[l][d][j].playerId === session.playerId) {
          personalRecords[l][d].splice(j, 1);
        }
      }
    }

    //thresholds for leveling up...
    if (l == 0 && d == 1) {
      var level = Math.ceil((session.score + 1) / LEVEL_INCREMENT);
      if (level > players[1][session.playerId].level) {
        players[1][session.playerId].level = level;
        socket.emit('levelUp', level);
      }
    } else if (l == 0 && d == 0) {
      var level = Math.ceil((session.score + 1) / (LEVEL_INCREMENT / 2));
      if (level > players[1][session.playerId].level) {
        players[1][session.playerId].level = level;
        socket.emit('levelUp', level);
      }
    } else if (l == 0 && d == 2) {
      var level = Math.ceil((session.score + 1) / (LEVEL_INCREMENT * 2));
      if (level > players[1][session.playerId].level) {
        players[1][session.playerId].level = level;
        socket.emit('levelUp', level);
      }
    } else if (l == 1 && d == 1) {
      var level = Math.ceil((session.score + 1) / (LEVEL_INCREMENT * 0.75));
      if (level > players[1][session.playerId].level) {
        players[1][session.playerId].level = level;
        socket.emit('levelUp', level);
      }
    } else if (l == 1 && d == 0) {
      var level = Math.ceil((session.score + 1) / (LEVEL_INCREMENT * 0.375));
      if (level > players[1][session.playerId].level) {
        players[1][session.playerId].level = level;
        socket.emit('levelUp', level);
      }
    } else if (l == 1 && d == 2) {
      var level = Math.ceil((session.score + 1) / (LEVEL_INCREMENT * 1.5));
      if (level > players[1][session.playerId].level) {
        players[1][session.playerId].level = level;
        socket.emit('levelUp', level);
      }
    }

    sendMail(MY_EMAIL, 'RECORDS UPDATED (personal)', JSON.stringify(personalRecords));
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
    } else if (details.type === 'pic') {
      players[0][details.playerId].pic = details.value;
      io.emit('gotPlayer', players[0][details.playerId]);
    } else if (details.type === 'password') {
      players[1][details.playerId].password = details.value;
    } else if (details.type === 'volume') {
      players[1][details.playerId].volume = details.value;
    } else if (details.type === 'feature') {
      players[1][details.playerId].showComponents = details.value;
    } else if (details.type === 'color') {
      players[1][details.playerId].colorIndex = details.value;
    } else if (details.type === 'name') {
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
    sendMail(
      details.email,
      'Information for ' + details.name,
      'This is your information: ' + players[1][details.playerId].password
    );
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
    } else {
      console.log('Request sent: ' + info.response);
    }
  });
};
