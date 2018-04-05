'use strict';

angular.module('blockDrop', ['ui.router', 'ngStorage'])

    .config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
        
        $stateProvider
            .state('home', {
                url: '/',
                views: {
                    'cover': {templateUrl: 'views/login.html'},
                    'content': {templateUrl: 'views/home.html'}
                }
            })
        
            .state('solo', {
                url: '/',
                views: {
                    'nav': {templateUrl: 'views/menu.html'},                
                    'content': {templateUrl: 'views/game.html'}
                }
            })
        
            .state('multi', {
                url: '/',
                views: {
                    'nav': {templateUrl: 'views/menu.html'},
                    'content': {templateUrl: 'views/game.html'}
                }
            })

            .state('records', {
                url: '/',
                views: {
                    'nav': {templateUrl: 'views/menu.html'},
                    'content': {templateUrl: 'views/records.html'}
                }
            })
        
            .state('settings', {
                url: '/',
                views: {
                    'nav': {templateUrl: 'views/menu.html'},
                    'content': {templateUrl: 'views/settings.html'}
                }
            });
            
        $urlRouterProvider.otherwise('/');
    
    }])

    .run(['$rootScope', '$state', '$window', 'socket', function($rootScope, $state, $window, socket) {
        
        $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
            $state.current = toState;
            
            if (fromState.name === '') {
                socket.emit('refresh');
            }
            if (toState.name === 'multi') {
                socket.emit('joinSession');
            }
            if (toState.name === 'records') {
                socket.emit('getRecords');
            }
            if (fromState.name === 'multi') {
                socket.emit('sessionLeave');
//                if (toState.name === 'home') {
//                    $('.modal-backdrop').hide();
//                }
            }
        });    
    }])

;


    

