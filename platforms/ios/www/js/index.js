/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

angular.module("app", ["ngRoute"]);

angular.module("app").config(function ($routeProvider) {
    $routeProvider.when("/", {
        templateUrl: "lobby.html",
        controller: "LobbyController"
    })
    $routeProvider.when("/video", {
        templateUrl: "video.html",
        controller: "VideoController"
    })
})

angular.module("app").run(function () {

})

angular.module("app").factory("Session", function ($http) {

    var sid, token, apikey;

    this.create = function () {
        return $http.post("http://5.135.191.201:5000/api/opentok", {}).then(function (result) {
            sid = result.data.sessionId;
            token = result.data.token;
            apikey = result.data.apiKey
        })
    }

    this.join = function () {
        return $http.get("http://5.135.191.201:5000/api/opentok").then(function (result) {
            sid = result.data.sessionId;
            token = result.data.token;
            apikey = result.data.apiKey
        })
    }

    this.getSID = function () {
        return sid;
    }

    this.getToken = function () {
        return token;
    }

    this.getApiKey = function () {
        return apikey;
    }

    return this;

})

angular.module("app").controller("LobbyController", function ($scope, $location, Session) {
    $scope.create = function () {
        Session.create().then(function () {
            $location.path("/video");
        })
    }
    $scope.join = function () {
        Session.join().then(function () {
            $location.path("/video");
        })
    }
})

angular.module("app").controller("VideoController", function ($scope, $location, Session) {
    $scope.hangup = function () {
        $location.path("/");
    }
    $scope.session = TB.initSession(Session.getApiKey(), Session.getSID());
    $scope.session.on({
        connectionCreated: function () {
            console.log("Connection created");
        },
        connectionDestroyed: function () {
            console.log("Connection destroyed");
        },
        sessionDisconnected: function () {
            console.log("Session disconnected");
        },
        streamCreated: function (event) {
            console.log("Stream created");
            $scope.session.subscribe(event.stream, "layoutContainer2", {
                insertMode: "replace",
                subscribeToAudio: true,
                subscribeToVideo: true,
                audioVolume: 100
            }, function () {
                console.log("Suscribe callback");
            });
        }
    })
    $scope.session.connect(Session.getToken(), function () {
        console.log("Creating publisher");
        $scope.publisher = TB.initPublisher(Session.getApiKey(), "layoutContainer", {
            width: 0,
            height: 0,
            publishAudio: true,
            publishVideo: true
        })
        console.log("Publishing publisher");
        $scope.session.publish($scope.publisher);
    })
    $scope.$on("$destroy", function () {
        $scope.session.unpublish($scope.publisher);
        $scope.publisher.destroy();
        $scope.session.disconnect();
    })
})