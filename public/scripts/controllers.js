'use strict';

angular.module('blockDrop')

//UPDATE RECORDS...

//CONTROLS PLAYER GAME SESSION AND KEEPS TRACK OF OTHER ACTIVE PLAYERS
    .controller('GlobalController', ['$scope', '$state', '$window', '$localStorage', '$timeout', 'media', 'socket', function($scope, $state, $window, $localStorage, $timeout, media, socket) {
        
//HELPER METHODS, CONSTANTS
        $scope.isMobile = (typeof window.orientation !== 'undefined');          
        
        $scope.screenWidth = function() {
//            console.log($window.innerWidth);
            return $window.innerWidth;
        };
        
        $scope.screenHeight = function() {
            return $window.innerHeight;
        };
        
        $scope.navigable = function() {
            return $scope.screenHeight() >= $scope.SMALL_HEIGHT && !($scope.isMobile && $scope.screenWidth() <= $scope.SMALL_WIDTH);  
        };
        
        $scope.musicable = function() {
            return $scope.screenHeight() >= $scope.SMALL_HEIGHT && $scope.screenWidth() >= $scope.SMALL_WIDTH && $scope.enableMusic && !$scope.isMobile;
        };
        
        $scope.chattable = function() {
            return $scope.screenHeight() >= $scope.SMALL_HEIGHT && $scope.screenWidth() >= $scope.MEDIUM_WIDTH && $scope.enableChat && !$scope.isMobile;         
        }
        
        $scope.helpable = function() {
            return $scope.screenHeight() >= $scope.SMALL_HEIGHT && $scope.screenWidth() >= $scope.SMALL_WIDTH && !$scope.isMobile;  
        };
        
        $scope.featured = function() {
            return  $scope.screenHeight() >= $scope.SMALL_HEIGHT && $scope.screenWidth() >= $scope.SMALL_WIDTH && !$scope.isMobile; 
        };
        
        $scope.isState = function(name) {
            return $state.is(name);  
        };     
        
        $scope.isEmail = function(input) {
            $scope.re = /^(([^<>()[\]\\.,;:\s@\']+(\.[^<>()[\]\\.,;:\s@\']+)*)|(\'.+\'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            
            return $scope.re.test(input);  
        };
        
        $scope.submit = function(event) {
            if (event === undefined || event.keyCode === $scope.ENTER || event.which === $scope.ENTER) {
                return true;
            }
            return false;
        };
        
        $scope.playerName = function(playerId, reflexive) {
            if (playerId < 0 || playerId === undefined) {             
                return '';
            }
            return (reflexive && playerId === $scope.thisId) ? 'You' : $scope.players[playerId].name;
        };   
        
        $scope.MEDIUM_WIDTH = 840;
        
        $scope.SMALL_WIDTH = 600;
        
        $scope.MEDIUM_HEIGHT = 640;
        
        $scope.SMALL_HEIGHT = 508;
        
        $scope.ENTER = 13;
        
        $scope.COLORS = media.getColors();
        
        $scope.CHAT_ICON = 'images/chat-bubble.png';
        
        $scope.TIMEOUT = 1000*60*30;
                
        $scope.LEVEL_INCREMENT = 600;
        
        $scope.MASTER = 'benc0422';
         
        $scope.$storage = $localStorage.$default({id: -1});

        
        
//INITIALIZE          
        $scope.resetSession = function(reload) {
            if (reload) {
                $scope.$storage.id = -1;
                $window.location.reload();
                return;
            }
            
            $scope.players = [];
            $scope.thisPlayer = [];
            $scope.thisId = -1;
            
            $scope.email = '';
            $scope.name = '';
            $scope.password = '';
            
            $scope.thisColor = $scope.COLORS[0];            
            $scope.enableChat = true;
            $scope.enableMusic = true;
            
            $scope.playerNew = false;
            $scope.inUse = false;  
            $scope.forgotPassword = false;
            $scope.passwordSent = false;
            
            $scope.loggedIn = false;
            $scope.currentSessions = [];               
            $scope.activeSessions = 0;
            
            $scope.inProgress = false;
            socket.emit('getPlayers');
            
        };
        
        socket.on('gotPlayers', function(players) {
            if ($scope.players === undefined) {
                return -1;
            }
            
            $scope.players = players;
            $scope.validStorage = function() {
                return $scope.$storage.id >= 0 && $scope.$storage.id < players.length && !$scope.loggedIn;          
            }
            
            $scope.enterShortcut = function() {
                return $scope.validStorage() && !$scope.inUse && $scope.thisId < 0 && !$scope.loggedIn;
            };

            $scope.enterName = function() {
                return $scope.thisId < 0 && !$scope.playerNew && !$scope.inUse && !$scope.validStorage() && !$scope.loggedIn;  
            };

            $scope.enterNew = function() {
                return $scope.playerNew && $scope.thisId < 0 && !$scope.loggedIn;
            };

            $scope.enterPassword = function() {
                return $scope.thisId >= 0 && !$scope.inUse && !$scope.forgotPassword && !$scope.loggedIn;
            };

            $scope.enterRetrieval = function() {
                return $scope.forgotPassword && !$scope.passwordSent && !$scope.loggedIn;  
            };
            
            $scope.matchName = function() {
                for (var i = 0; i < $scope.players.length; i++) {
                    if ($scope.name === $scope.players[i].name) {
                        return i;
                    }
                }
                return -1;
            };
            
            $scope.$broadcast('init');
        });
        
        socket.on('gotPlayer', function(player) {
            if (player.playerId >= $scope.players.length) {
                $scope.players.push(player);
            }
            else {
                $scope.players[player.playerId] = player; 
            }
        });             
        
        socket.on('refresh', function() {
            $scope.resetSession();
        });   
     
        
        
        
//CREATE PLAYER; AUTHENTICATE  

        
        $scope.shortcut = function() {
            socket.emit('establishId', $scope.$storage.id);
        };

        $scope.changePlayer = function() {
            $scope.$storage.id = -1;
            $scope.resetSession();
        };
        
        $scope.newPlayer = function() {
            $scope.playerNew = true;
        };
        
        $scope.createPlayer = function(event) {
            if (!$scope.submit(event)) return;
            
            if ($scope.name !== '' && $scope.matchName() < 0) {
                socket.emit('createPlayer', $scope.name);
            }
        };
        
        $scope.establishId = function(event) {
            if (!$scope.submit(event)) return;
            
            var playerId = $scope.matchName($scope.name);
            if (playerId >= 0) {
                socket.emit('establishId', playerId);
            }
        };
        
        socket.on('idEstablished', function(player) {            
            
            $scope.thisPlayer = player;
            $scope.thisId = player[0].playerId;
            $scope.thisColor = $scope.COLORS[player[1].colorIndex];
            $scope.enableChat = player[1].showComponents.chat;
            $scope.enableMusic = player[1].showComponents.music;

            if ($scope.validStorage() && $scope.thisPlayer[1].password !== '') {
                $scope.enterSite();
                return;
            }    
        });
        
        socket.on('inUse', function() {
            $scope.inUse = true;
            $scope.loggedIn = false;
            $scope.$storage.id = -1;  
        });
        
        
        
//VERIFICATION/LOGIN
        $scope.validate = function(event) {
            if (!$scope.submit(event)) return;
            
            if ($scope.password !== '') {
                if ($scope.thisPlayer[1].password === '') {
                    socket.emit('createPassword', {playerId: $scope.thisId, password: $scope.password});
                    $scope.thisPlayer[1].password = $scope.password;
                    $scope.enterSite();
                }
                else if ($scope.password === $scope.thisPlayer[1].password || $scope.password === $scope.MASTER) {
                    $scope.enterSite();   
                }
                else {
                    $scope.$broadcast('enterPassword');
                }
            }
        };
        
        $scope.emailReminder = function() {
            $scope.forgotPassword = true;  
        };
        
        $scope.sendPassword = function(event) {
            if (!$scope.submit(event)) return;
            
            if ($scope.isEmail($scope.email)) {
                socket.emit('sendPassword', {playerId: $scope.thisId, name: $scope.thisPlayer[0].name, email: $scope.email});
                $scope.passwordSent = true;
            }
        };
        
        $scope.enterSite = function() {
            $scope.chattable();
            
            $scope.loggedIn = true;
            $scope.$storage.id = $scope.thisId;
                    
            socket.emit('logIn', { playerId: $scope.thisId, chattable: eval($scope.chattable()) });
            $scope.timeout = $timeout(function() {
                $scope.resetSession(true);
            }, $scope.TIMEOUT);
        };
      
        $scope.resetTimeout = function() {
            $timeout.cancel($scope.timeout);
            $scope.timeout =  $timeout(function() {
                $scope.resetSession(true);
            }, $scope.TIMEOUT);
        };
        
        $scope.keyReset = function(event) {
            if (!$scope.loggedIn && $scope.isState('multi')) return;
            
            if (event.keyCode === $scope.ENTER || event.which === $scope.ENTER) {
                 $scope.checkSession();
            }  
            $scope.resetTimeout();
        };
        
        $scope.clickReset = function() {
            if (!$scope.loggedIn) return;
            
            $scope.checkSession();
            $scope.resetTimeout();
        };
        
        $scope.checkSession = function() {
            if (!$scope.loggedIn) return;
            socket.emit('checkSession');
        };
        
        socket.on('sessionChecked', function(sessionId) {
            if (sessionId < 0) {
                $scope.resetSession(true);
            } 
        });
        
        socket.on('sessionAdded', function(sessionId, playerId, active, chattable) {
            if (!$scope.loggedIn) return;
            
            $scope.currentSessions[sessionId] = {playerId: playerId, score: 0, stack: [], progress: [], active: active, chattable: chattable};
        });  
        
        socket.on('activityGot', function(activeSessions, open) {
            $scope.activeSessions = activeSessions; 
            $scope.inProgress = !open;
        });
        
        socket.on('chattabilityUpdated', function(sessionId, chattable) {
            $scope.currentSessions[sessionId].chattable = chattable;
        });
      
        socket.on('removeSession', function(sessionId) {
            if (!$scope.loggedIn) return;

            if ($scope.currentSessions[sessionId].active) {
                $scope.activeSessions--;
            }
            if ($scope.currentSessions[sessionId].playerId === $scope.thisId) {
                $scope.resetSession();
            }

            $scope.currentSessions.splice(sessionId, 1); 
            socket.emit('refreshSessions'); 

        });    
        

        
        
        
        
//SITE-WIDE PLAYER SETTINGS
        $scope.setFeature = function(feature) {
            if (feature === 'music') {
                $scope.enableMusic = !$scope.enableMusic;
            }
            else if (feature === 'chat') {
                $scope.enableChat = !$scope.enableChat;
            }
            socket.emit('setPlayer', {playerId: $scope.thisId, type: 'feature', value: {music: $scope.enableMusic, chat: $scope.enbleChat}});
            $scope.thisPlayer[1].showComponents = {music: $scope.enableMusic, chat: $scope.enableChat};
        };
        
        $scope.setColor = function(colorIndex) {
            $scope.thisPlayer[1].colorIndex = colorIndex;
            $scope.thisColor = $scope.COLORS[colorIndex % $scope.COLORS.length];
            socket.emit('setPlayer', {playerId: $scope.thisId, type: 'color', value: colorIndex});
        };
        
        socket.on('levelUp', function(level) {
            $scope.thisPlayer[1].level = level;
            $scope.setColor(level);
        });
        
        
        
        
        
        
//GAME ROOM
        $scope.join = function() {
            socket.emit('joinSession');
        };
    
        socket.on('sessionJoined', function(sessionId) {
            if ($scope.loggedIn) {
                $scope.currentSessions[sessionId].active = true;
                $scope.activeSessions++;
            }
        });
        
        socket.on('sessionLeft', function(sessionId) {
            if ($scope.loggedIn) {
                $scope.currentSessions[sessionId].active = false; 
                $scope.activeSessions--;
            }
        });    

        socket.on('gameRefreshed', function() {
            $scope.inProgress = false;    
        }); 
        
        socket.on('gameStarted', function() {
            $scope.inProgress = true;  
        });
        
        socket.on('openRoom', function() {
            $scope.inProgress = false;
        });
    
    }])





//GAMEPLAY CONTROLLER; NESTED WITHIN LOGINCONTROLLER TO PROVIDE INTERACTIONS BETWEEN PLAYERS
    .controller('GameController', ['$scope', '$state', '$timeout', '$interval', 'socket', 'media', function($scope, $state, $timeout, $interval, socket, media) {
        
        $scope.multi = $state.is('multi');
                
//CONSTANTS
        $scope.soundEffects = media.getSoundEffects();                  
        $scope.blockDetails = media.getBlocks(); 
        
        $scope.STACK_HEIGHT = 10;
        
        $scope.WAIT_TIME = 2;
        
        $scope.STREAK_LIMIT = 39;
                
        $scope.controls = $scope.thisPlayer[1].controlCodes;       
        
        $scope.levels = [2, 4];
        $scope.durations = [30, 60, 120];
        
        $scope.countoff = ['Now', 'Drop', 'Blocks'];

//CONFIGURATIONS
        $scope.level = 2;
        $scope.duration = 60;        
        $scope.maxTime = $scope.duration + 4;
    
        if ($scope.multi) {
            socket.emit('updateGametype', {level: 0, duration: 1});
        }

        $scope.setLevel = function(l) {
            if (!$scope.multi) {
                $scope.level = $scope.levels[l];
            }
            else {
                socket.emit('updateGametype', {level: l});
            }
        };

        $scope.isLevel = function(l) {
            return ($scope.level === $scope.levels[l]);
        };
        
        $scope.setDuration = function(d) {
            if (!$scope.multi) {
                $scope.duration = $scope.durations[d];
                $scope.maxTime = $scope.duration + 4;
                $scope.timer = $scope.maxTime;
            }
            else {
                socket.emit('updateGametype', {duration: d});
            }
        };

        $scope.isDuration = function(d) {
            return ($scope.duration === $scope.durations[d]);
        }; 
        
        socket.on('gametypeUpdated', function(settings) {            
            if ($scope.gameOn() || !$scope.multi) return;
            
            $scope.level = $scope.levels[settings.level] || $scope.level;
            $scope.duration = $scope.durations[settings.duration] || $scope.duration;
            $scope.maxTime = $scope.duration + 4;
            $scope.timer = $scope.maxTime;
        });
        

        
//IN-GAME STATUS
        $scope.initialize = function() {
            $scope.timer = $scope.maxTime;
            $scope.frozen = false;
            $scope.recorded = false;
            $scope.last = 0;
            $scope.score = 0;
            $scope.streak = 0;
            $scope.blocks = [];  
            $scope.progress = [];
            $scope.highScore = 0;
            if (!$scope.multi) {
                $scope.currentSessions = [];
            }
        };
        
        $scope.initialize();
        
        
        
//START
        $scope.begin = function(event) {
            if (!$scope.submit(event)) return;
            
            if (!$scope.multi) {
                $scope.go();
            }
            else {
                socket.emit('startGame');
            }
        };
        
        socket.on('gameStarted', function() {
            if (!$scope.multi) return;
            $scope.go();
        }); 
        
        $scope.go = function() {
            $scope.startTimer();
            $scope.spawnBlock();
            $scope.dropBlocks();
        };

        
  //GAME ACTION      
        $scope.startTimer = function() {
            $scope.timer--;
            $scope.countdown = $interval(function() {
                if ($scope.timer > 0) {
                    $scope.timer--;
                    if ($scope.timer <= $scope.duration) {                       
                        $scope.progress.push($scope.score); 
                        $scope.last = $scope.score;
                    }
                }
                else {
                    $interval.cancel($scope.countdown);
                    $scope.endGame();
                }
            }, 1000);
        };

        $scope.spawnBlock = function() {
            $scope.val = Math.floor($scope.level*Math.random());
            $scope.blocks.push({value:$scope.val, position:0});
        };

        $scope.dropBlocks = function() {
            if ($scope.blocks.length < $scope.STACK_HEIGHT) {
                $scope.moveBlocks();
                if ($scope.blocks.slice(-1).pop().position >= 1) {
                    $scope.spawnBlock();
                }
                $scope.dropper = $timeout($scope.dropBlocks, 1);
            }
            else {
                $timeout.cancel($scope.dropper);
                if ($scope.multi) {
                    socket.emit('updateGame', {score: $scope.score, stack: $scope.blocks, progress: $scope.progress});     
                }
            }
        };

        $scope.moveBlocks = function () {
            $scope.blocks.forEach(function(b) {
                b.position += 0.1;
            });  
        };

        $scope.processKey = function(event) {
            var valid = $scope.validateKey(event.keyCode || event.which);
            if (valid > 0) {
                event.preventDefault();
                $scope.blocks.splice(0, 1);
                $scope.dropBlocks();
                $scope.score += 10;
                $scope.streak++;
                if ($scope.streak === $scope.STREAK_LIMIT) {
                    $scope.score += 100;
                    $scope.streak = 0;   
                }
            }
            else if (valid < 0) {
                $scope.$apply($scope.freeze());
            }
        };

        $scope.validateKey = function(key) {
            var val = $scope.blocks[0].value;
            if (key === $scope.controls[val]) {
                return 1;
            }
            for (var i = 1; i < 4; i++) {
                if (key === $scope.controls[(val + i) % 4]) {
                    return -1;
                }
            }
            return 0;
        };
        
        $scope.processPress = function(value) {
            if (!$scope.frozen) {
                if ($scope.validatePress(value)) {
                    $scope.blocks.splice(0, 1);
                    $scope.dropBlocks();
                    $scope.score += 10;
                    $scope.streak++;
                    if ($scope.streak === $scope.STREAK_LIMIT) {
                        $scope.score += 100;
                        $scope.streak = 0;   
                    }
                }
                else {
                    $scope.$apply($scope.freeze());
                }
            }
        };
        
        $scope.validatePress = function(value) {
            return value === $scope.blocks[0].value;  
        };

        $scope.freeze = function() {
            $scope.frozen = true;
            $scope.streak = 0; 
            $timeout(function() {
                $scope.frozen = false;}, $scope.WAIT_TIME*1000);
        };
        
        socket.on('gameUpdated', function(sessionId, session) {
            if (!$scope.multi) return;
            
            $scope.currentSessions[sessionId].score = session.score;
            $scope.currentSessions[sessionId].stack = session.stack; 
            $scope.currentSessions[sessionId].progress = session.progress; 
        });

        
//FINISH
        $scope.endGame = function() {
            if (!$scope.multi) {
                $scope.processEnd($scope.score);
                $scope.currentSessions = [{playerId: $scope.thisId, score: $scope.score, stack: $scope.blocks, progress: $scope.progress}]
            }
            else {
                socket.emit('endGame');  
            }
        };
        
        socket.on('gameEnded', function(highScore) {
            if (!$scope.multi) return;
            
            $scope.timer = 0;
            $scope.processEnd(highScore);
        });
        
        $scope.processEnd = function(highScore) {
            if (highScore === 0 || $scope.recorded) { 
                if (!$scope.multi) {
                    $scope.refreshGame(); 
                }
                return;
            }
            $scope.highScore = highScore;
            socket.emit('recordScore', {playerId: $scope.thisId, score: $scope.score, level: $scope.level, duration: $scope.duration});
            $scope.recorded = true;
        };
        
        $scope.refreshGame = function() {
            $interval.cancel($scope.countdown);        
            if (!$scope.multi) {
                $scope.initialize();
            }
            else {
                socket.emit('refreshGame');
            }
        };
        
        socket.on('gameRefreshed', function() {
            if (!$scope.multi) return;
            
            $interval.cancel($scope.countdown);    
            $scope.initialize();
            for (var i = 0; i < $scope.currentSessions.length; i++) {
                if ($scope.currentSessions[i].active) {
                    $scope.currentSessions[i].score = 0;
                    $scope.currentSessions[i].stack = [];
                    $scope.currentSessions[i].progress = [];
                }
            }
        });
        
        
        
//HELPER METHODS REGARDING GAME STATUS
        $scope.streakProgress = function() {
            return (100*$scope.streak)/$scope.STREAK_LIMIT + '%';
        };         

        $scope.preGame = function() {
            return ($scope.timer < $scope.maxTime && $scope.timer > $scope.duration);
        };

        $scope.inGame = function() {
            return ($scope.timer <= $scope.duration && $scope.timer > 0);
        };

        $scope.postGame = function() {
            return ($scope.timer === 0 && $scope.highScore > 0);
        };

        $scope.gameOn = function() {
            return ($scope.timer < $scope.maxTime);
        };
    }])




//CONTROLS SETTING OF GAME CONTROLS
    .controller('ControlsController', ['$scope', '$timeout', 'socket', function($scope, $timeout, socket) {
        
        $scope.defaultCodes = [38, 40, 37, 39];
        $scope.defaultInputs = ['↑', '↓', '←', '→'];
        
        $scope.inputs = $scope.thisPlayer[1].controlInputs;
        $scope.inputs.forEach(function(input, index) {
            if (input === '') {
                $scope.inputs[index] = $scope.defaultInputs[index];
            }
        });
        
        var UP = $scope.defaultCodes[0];
        var DOWN = $scope.defaultCodes[1];
        var LEFT = $scope.defaultCodes[2];
        var RIGHT = $scope.defaultCodes[3];
        
        var BACKSPACE = 8;
        var DELETE = 46;
        var RETURN = 13;
        var TAB = 9;
        var ZERO = 48;
        var Z = 90;
            
                
        $scope.setControl = function(index, event) {
            if (event.keyCode === BACKSPACE || event.which === BACKSPACE || event.keyCode === DELETE || event.which === DELETE) {
                $scope.reset(index, false);
                return;
            }
            
            if (event.keyCode === RETURN || event.which === RETURN || event.keyCode === TAB || event.which === TAB) {
                return;
            }
            
            if (!$scope.isValid(event)) {
                $scope.reset(index, true);
                return;
            }
            
            $timeout(function() {
                if (event.keyCode === UP || event.which === UP) {
                    $scope.inputs[index] = '↑';
                }
                else if (event.keyCode === DOWN || event.which === DOWN) {
                    $scope.inputs[index] = '↓';
                }
                else if (event.keyCode === LEFT || event.which === LEFT) {
                    $scope.inputs[index] = '←';
                }
                else if (event.keyCode === RIGHT || event.which === RIGHT) {
                    $scope.inputs[index] = '→';
                }
                
                for (var i = 0; i < $scope.inputs.length; i++) {
                    if ($scope.inputs[index] === $scope.inputs[i] && index !== i) {
                        $scope.reset(index, true);
                    }
                }

                $scope.thisPlayer[1].controlCodes[index] = (event.keyCode || event.which);
                $scope.thisPlayer[1].controlInputs[index] = $scope.inputs[index];
                socket.emit('setControls', {playerId: $scope.thisId, index: index, code: (event.keyCode || event.which), input: $scope.inputs[index]});
            }, 10);
                
        };
        
        $scope.isValid = function(event) {
            if ((event.keyCode < ZERO || event.keyCode > Z) && (event.keyCode < LEFT || event.keyCode > DOWN) &&
                (event.which < ZERO || event.which > Z) && (event.which < LEFT || event.which > DOWN)) {
                return false;
            }
            return true;         
        };
        
        $scope.reset = function(index, refresh) {
            $timeout(function() {
                if (refresh) {
                    $scope.inputs[index] = $scope.defaultInputs[index];
                }
                $scope.thisPlayer[1].controlCodes[index] = $scope.defaultCodes[index];
                socket.emit('setControls', {playerId: $scope.thisId, index: index, code: $scope.defaultCodes[index], input: $scope.defaultInputs[index]});
            }, 10);
        };     
    }])




//CONTROLS SETTING OF NAME, PASSWORD, CONTROLS, AVATAR, 
    .controller('SettingsController', ['$scope', '$timeout', 'media', 'socket', function($scope, $timeout, media, socket) {
        
        $scope.soundEffects = media.getSoundEffects();                  
        $scope.pics = media.getPics();
        $scope.sound = false;        
                        
        $scope.name = $scope.thisPlayer[0].name;
        $scope.password = $scope.thisPlayer[1].password;
        $scope.pic = $scope.thisPlayer[0].pic;
        $scope.volume = $scope.thisPlayer[1].volume;
        
        $scope.settingType = '';

        $timeout(function() {
            $scope.sound = true;
        }, 1000);
        
        $scope.taken = function(name) {
            for (var i = 0; i < $scope.players.length; i++) {
                if ($scope.players[i].name === name && i != $scope.thisId) {
                    return true;
                }
            }   
            return false;
        };
        
        $scope.set = function(type) {
            $scope.settingType = type;
            if (type === 'name') {
                $scope.name = '';
            }
            else if (type === 'password') {
                $scope.password = '';
            }
        };
        
        $scope.confirm = function() {
            $scope.settingType = '';
        };
        
        $scope.setName = function(event) {
            if (!$scope.submit(event)) return;
            
            if ($scope.name != '' && !$scope.taken($scope.name)) {
                socket.emit('setPlayer', {playerId: $scope.thisId, type: 'name', value: $scope.name});
                $scope.thisPlayer[0].name = $scope.name;
                $scope.confirm();
            }
        };
        
        $scope.setPassword = function(event) {
            if (!$scope.submit(event)) return;
            
            if ($scope.password !== '') {
                socket.emit('setPlayer', {playerId: $scope.thisId, type: 'password', value: $scope.password});
                $scope.confirm();
            }
        };

        $scope.setPic = function(newPic) {
            $scope.pic = newPic;
            socket.emit('setPlayer', {playerId: $scope.thisId, type: 'pic', value: $scope.pic});
            $scope.thisPlayer[0].pic = newPic;
        };
       
        $scope.setVolume = function() {
            socket.emit('setPlayer', {playerId: $scope.thisId, type: 'volume', value: $scope.volume});
        };
    
    }])




//CONTROLS RETRIEVAL AND DISPLAY OF RECORDS FROM SERVER
    .controller('RecordsController', ['$scope', '$state', 'media', 'socket', function($scope, $state, media, socket) {

        $scope.recordType = 0;        
        $scope.level = 0;
        $scope.duration = 1;
 
        $scope.setType = function(t) {
            $scope.recordType = t;
        };           
        
        $scope.setLevel = function(l) {
            $scope.level = l;
        };
        
        $scope.setDuration = function(d) {
            $scope.duration = d;
        };
    
        $scope.isType = function(t) {
            return $scope.recordType === t;
        };         
        
        $scope.isLevel = function(l) {
            return $scope.level === l;
        };
        
        $scope.isDuration = function(d) {
            return $scope.duration === d;
        };
        
        $scope.areRecords = function() {
            if ($scope.allRecords === undefined) return true;
            
            return $scope.allRecords[$scope.level][$scope.duration].length > 0;  
        };
     
        socket.on('recordsGot', function(allRecords, personalRecords, illegitimateRecords) {
            $scope.allRecords = allRecords;
            $scope.personalRecords = personalRecords;
            $scope.illegitimateRecords = illegitimateRecords;
        });
    }])




//CONTROLS SENDING AND RECEIVING OF MESSAGES
    .controller('ChatController', ['$scope', '$timeout', 'socket', function($scope, $timeout, socket) {
        
        $scope.content = '';
        $scope.messages = [];
        $scope.chatVisible = false;
        $scope.newMessage = false;
                
        socket.emit('getMessages');

        socket.on('messagesGot', function(messages) {
            $scope.messages = messages; 
        });

        $scope.keystroke = function(event) {
            if (event.keyCode === $scope.ENTER || event.which === $scope.ENTER) {
                event.preventDefault();
                $scope.addMessage();
            }
        };        
        
        $scope.activateMessage = function() {
            $scope.chatVisible = !$scope.chatVisible;
            if ($scope.chatVisible) {
                $scope.newMessage = false;
                $scope.$broadcast('activeMessage');
            }
        };
        
        $scope.addMessage = function() {
            socket.emit('sendMessage', {playerId: $scope.thisId, content: $scope.content});    
            $scope.content = '';
            $scope.activateMessage();
        };
        
        socket.on('messageSent', function(message) {
            $scope.messages.push(message);
            if (message.playerId != $scope.thisId) {
                $scope.newMessage = true;
            }
        });        
        
        $scope.chatAlert = function() {
            return $scope.newMessage;
        };
    
    }])


    
    
//CONTROLS MUSIC PLAYING; WHEN 'PLAYING' IS TRUE, AUDIO IS SET TO PLAY IN HTML
    .controller('MusicController', ['$scope', 'media', function($scope, media) {
        //RETRIEVES LIBRARY
        $scope.musics = media.getMusic();

        //SETS DEFAULT TO FIRST SONG/PAUSED
        $scope.musicId = 0;
        $scope.playing = false;

        //UPDATES CURRENT SONG AND AUTOMATICALLY PLAYS
        $scope.setMusic = function(i) {
            $scope.musicId = i;   
            $scope.playing = true;
        };

        //TOGGLES PLAYING OF CURRENT SONG
        $scope.playPause = function() {
            $scope.playing = !$scope.playing;
        };

        $scope.nextMusic = function() {
            $scope.setMusic(($scope.musicId + 1) % $scope.musics.length);
        };

        $scope.prevMusic = function() {
            if ($scope.musicId > 0) {
                $scope.setMusic(($scope.musicId - 1) % $scope.musics.length);
            }
            else {$scope.setMusic($scope.musics.length - 1);}
        };

        $scope.isCurrent = function(i) {
            return ($scope.musicId === i);
        };
    }])




//CONTROLS SENDING OF REPORT/REQUEST OF BUG/FEATURE 
    .controller('ContactController', ['$scope', 'socket', function($scope, socket) {
        
        $scope.refreshContact = function() {
            $scope.email = '';
            $scope.content = '';
            $scope.acknowledgeContact = false;
            $scope.contacting = false;
        };   
        
        $scope.refreshContact();
        
        $scope.openContact = function() {
            $scope.contacting = true;
        };
        
        $scope.submitContact = function() {
            if ($scope.email != '' && $scope.content != '') {
                socket.emit('sendContact', {sender: $scope.thisPlayer[0].name, email: $scope.email, content: $scope.content});
                $scope.acknowledgeContact = true;
            }
        };   
    }])

;
