'use strict';

angular.module('blockDrop')

//LOGIN
    .directive('showModal', function() {

        return {
            link: function(scope, element, attrs) {

                attrs.$observe('showModal', function(show) {
                    var state = (show === 'true') ? 'show' : 'hide';
                    element.modal(state);
                });
            }
        };
    })



//FOCUSING ELEMENTS        
    .directive('giveFocus', ['$timeout', function($timeout) {

        return {
            link : function(scope, element, attrs) {

                attrs.$observe('giveFocus', function(focusing) {
                    if (focusing === 'true') {
                        scope.$broadcast(attrs.getFocus);
                    }
                });
            }
        };
    }])    
    
    .directive('getFocus', ['$timeout', function($timeout) {

        return {
            link : function(scope, element, attrs) {

                scope.$on(attrs.getFocus, function(event) {
                    $timeout(function() {
                        element.val('');
                        element[0].focus(); 
                    }, attrs.delay || 0);
                });
            }
        };
    }])


//GAME INPUT        
    .directive('listen', ['$document', function($document) {

        return {
            link : function(scope, element, attrs) {

                attrs.$observe('listen', function(listening) {
                    if (element.attr('id') === 'game-content') {
                        if (listening === 'true') {
                            $document[0].addEventListener('keydown', scope.processKey);
                        }
                        else {
                            $document[0].removeEventListener('keydown', scope.processKey);        
                        }
                    }  
                });
            }
        };
    }])


//CREATES BLOCK
    .directive('block', function() {

        return { 
            link: function(scope, element, attrs) {

                var dim = Math.ceil(0.9/(scope.STACK_HEIGHT)*element.parent().height()/10)*10;

                attrs.$observe('ngValue', function(value) {
                    var color = scope.blockDetails[value].color;
                    element.css({
                        display: 'flex',
                        flexGrow: 1,
                        flexShrink: 1,
                        flexBasis: '0%',
                        width: dim+'px',
                        fontSize: dim+'px',
                        border: 'double',
                        backgroundColor: color,
                        backgroundImage: 'linear-gradient(top, ' + color + ', grey)'
                    });
                });
            }
        };
    })


//GRAPHS END OF GAME
    .directive('graphGame', function () {

        return {link: function(scope, element, attrs) {
            var grapher = element[0].getContext('2d');

            attrs.$observe('graphGame', function(over) {
                if (over) { 
                    grapher.clearRect(0, 0, 320, 155);

                    grapher.beginPath();
                    grapher.lineWidth = 4;
                    grapher.strokeStyle = 'rgba(0, 0, 0, 0.8)';
                    grapher.moveTo(10, 0);
                    grapher.lineTo(10, 145);
                    grapher.lineTo(280, 145);
                    grapher.stroke();
                    grapher.closePath();

                    scope.currentSessions.forEach(function(s) {  
                        
                        if (s.active) { 
                            grapher.beginPath();
                            grapher.lineWidth = 0.5;
                            grapher.strokeStyle = 'rgba(50,50,50,1)';
                            grapher.moveTo(10, 140);
                            s.progress.forEach(function(v, i) {
                                grapher.lineTo(10 + (280/(scope.duration + 1))*i, 145 - 140*(v/scope.highScore));
                            });
                            grapher.stroke();
                            grapher.closePath();
                        }
                        if (s.playerId === scope.thisId) {
                            grapher.beginPath();
                            grapher.lineWidth = 2;
                            grapher.strokeStyle = 'rgba(0,0,0,1)';
                            grapher.moveTo(10, 140);
                            s.progress.forEach(function(v, i) {
                                grapher.lineTo(10 + (280/(scope.duration + 1))*i, 145 - 140*(v/scope.highScore));
                            });
                            grapher.stroke();
                            grapher.closePath();
                        }
                    });

               }
            });
        }};
    })


//INCORPORATE SOUND SETTING
    .directive('soundEffect', ['$timeout', function($timeout) {

        return {
            link: function link(scope, element, attrs) {
                
                var effects = scope.soundEffects;

                attrs.$observe('ngValue', function(value) {
                    var e = attrs.soundEffect;
                    var sound;
                    if (e === 'simple' && value > 0) {
                        sound = new Audio(effects.simple);
                    }
                    else if (e === 'special' && scope.streak === 0 && value > 0) {
                        sound = new Audio(effects.special);
                    }
                    else if (e === 'frozen' && value === 'true') {
                        sound = new Audio(effects.frozen);
                    }
                    else if (e === 'timer') {
                        if (scope.preGame()) {
                            sound = new Audio(effects.countdown);
                        }
                        else if (value == scope.duration) {
                            sound = new Audio(effects.start);
                        }
                        else if (value <= 10 && value > 0) {
                            sound = new Audio(effects.final);
                        }
                        else if (value == 0 && scope.thisId >= 0 && scope.score > 0) {        
                            sound = new Audio(effects.finish);
                        }
                    }
                    else if (e === 'setting' && scope.sound) {
                        sound = new Audio(effects.simple);
                    }
                    if (sound !== undefined) {
                        sound.volume = scope.volume || scope.thisPlayer[1].volume;
                        sound.play();
                    }
                });
            }
        };
    }])


//CHAT AVAILABILITY
    .directive('chattability', ['socket', function(socket) {

        return {
            link: function(scope, element, attrs) {

                scope.$watch('chattable()', function(value) {
                    socket.emit('updateChattability', {chattable: value});
                });
            }
        };
    }])
                             


//SCOLLS CHAT WINDOW
    .directive('scrolldown', ['$timeout', function($timeout) {

        return {
            link: function(scope, element, attrs) {

                scope.$watch('messages.length', function() {
                    $timeout(function() {
                        element.scrollTop(element[0].scrollHeight);
                    }, attrs.delay || 0);
                });

                scope.$watch('chatVisible', function(visible) {    
                    if (visible) {
                        $timeout(function() {
                            element.scrollTop(element[0].scrollHeight);
                        }, attrs.delay || 0);
                    }
                });
            }
        };

    }])


//MUSIC  
    .directive('playMusic', ['$timeout', function($timeout) {

        return {
            link: function(scope, element, attrs) {
//AUTO PLAY NEXT
                element.on('ended', function() {
                    scope.nextMusic(); 
                    $timeout(element[0].play(), 500);
                });
//CONTROL THROUGH PLAY/PAUSE
                attrs.$observe('playMusic', function(playing) {
                    if (playing === 'true') { 
                        element[0].play(); 
                    }
                    else { 
                        element[0].pause(); 
                    }
                });    
//AUTO PLAY WHEN CHANGE TRACK                
                attrs.$observe('src', function() {
                    if (scope.playing) { 
                        element[0].play(); 
                    }
                });
            }
        };
    }])

;