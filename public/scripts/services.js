'use strict';

angular.module('blockDrop')

    .factory('socket', ['$rootScope', function ($rootScope) {
        var socket = io.connect();
        return {
            on: function (eventName, callback) {
                socket.on(eventName, function () {  
                    var args = arguments;
                    $rootScope.$apply(function () {
                        callback.apply(socket, args);
                    });
                });
            },
            emit: function (eventName, data, callback) {
                socket.emit(eventName, data, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        if (callback) {
                            callback.apply(socket, args);
                        }
                    });
                });
            }
        };
    }])      

    .factory('media', function() {
    
    
        var COLORS = ['grey', '#c34a00', '#a68400', '#ccaa00', '#598c54', '#3f723a', 'teal', 'royalblue', 'mediumblue', 'midnightblue', 'black', 'magenta'];
    
        var PICS = [['images/p0.png', 'images/p1.png', 'images/p2.png', 'images/p3.png'], 
                   ['images/d0.png', 'images/d1.png', 'images/d2.png', 'images/d3.png', 'images/d4.png', 'images/d5.png']];     
    
        var BLOCKS = [
            {
              id: 0,
              code: 38,
              icon: 'glyphicon-arrow-up',
              color: 'crimson'
            },
            {
              id: 1,
              code: 40,
              icon: 'glyphicon-arrow-down',
              color: 'darkgreen'
            },
            {
              id: 2,
              code: 37,
              icon: 'glyphicon-arrow-left',
              color: 'orange'
            },
            {
              id: 3,
              code: 39,
              icon: 'glyphicon-arrow-right',
              color: 'indigo'
            }
        ];
    
    
    
        var EFFECTS = {
            simple: 'audio/bonus10.wav',
            special: 'audio/bonus100.wav',
            frozen: 'audio/freeze.wav',
            countdown: 'audio/countdown.wav',
            start: 'audio/start.wav',
            final: 'audio/final.wav',
            finish: 'audio/finish.wav'
        };
    
    
        var MUSIC = [
            {
              id: 0,
              name: '9-24-11',
              source: 'audio/092411.mp3'
            },
            {
              id: 1,
              name: 'La Piñata',
              source: 'audio/pinata.mp3'
            },
            {
              id: 2,
              name: 'Coastin',
              source: 'audio/coastin.mp3'
            },
            {
              id: 3,
              name: 'Bad Bitches',
              source: 'audio/badbitches.mp3'
            },
            {
              id: 4,
              name: 'Sincerely',
              source: 'audio/sincerely.mp3'
            },
            {
              id: 5,
              name: 'Magnolia',
              source: 'audio/magnolia.mp3'     
            }
        ];
        
        return {
            
            getColors: function() {
                return COLORS;  
            },

            getPics: function() {
                return PICS;
            },
            
            getMusic: function() {
                return MUSIC;
            },

            getSoundEffects: function() {
                return EFFECTS;
            },

            getBlocks: function() {
                return BLOCKS;
            }
        };

    })

;