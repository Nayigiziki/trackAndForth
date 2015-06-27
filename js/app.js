var app = angular.module("chatApp", ["firebase", "luegg.directives", 'ui.router'])

.config(function($stateProvider, $urlRouterProvider){
  // For any unmatched url, send to /route1
  $urlRouterProvider.otherwise("/");

  $stateProvider
  .state('home', {
    url: "/",
    templateUrl: "views/register.html"

  })
  .state('signIn', {
    url: "/signIn",
    templateUrl: "views/signIn.html"
  })
  .state('name', {
    url: "/name",
    templateUrl: "views/name.html"
  })
  .state('messages', {
    url: "/messages",
    templateUrl: "views/chatRoom.html",
    controller : "ChatCtrl"
  });
})

.factory('User', function ($state) {
  var ref = new Firebase("https://chromechatapp.firebaseio.com/chat");
  var userRef = new Firebase('https://chromechatapp.firebaseio.com/usersInfo');
  var authDataObj;
  var name;

  var setName = function(nameStr){
    name = nameStr;
  }

  var getName = function(){
    return name;
  }

  var setAuthObj = function(obj){
    console.log(obj);
    authDataObj = obj;
  }

  var getAuthObj = function(){
    return authDataObj;
  }
  //pick up from up here
  var saveUserObjToFirebase = function() {
    console.log(authDataObj);
    userRef.child(authDataObj.uid).set(name);
  };

  var fetchUserObjFromFirebase = function(cb) {
    var auth = this.getAuthObj();
    userRef.child(auth.uid).once('value', function(nameSnapshot) {
      name = nameSnapshot.val();
      cb(name);
    });
  };

  var unauth = function(){
   userRef.unauth();
 };

 var registerUser = function(username, password, cb) {
  ref.createUser({
    email: username,
    password: password
  }, function(error, authData) {
    cb(error, authData);
  });
};

var signIn = function(username, password, cb) {
  ref.authWithPassword({
    email: username,
    password: password
  }, function(error, authData) {
    cb(error, authData);
  });
};

return {
  saveUserObjToFirebase : saveUserObjToFirebase,
  fetchUserObjFromFirebase : fetchUserObjFromFirebase,
  unauth : unauth,
  registerUser : registerUser,
  signIn : signIn,
  setName : setName,
  getName : getName,
  setAuthObj : setAuthObj,
  getAuthObj : getAuthObj,
  ref : ref
};

})

.controller("ChatCtrl", ["$scope", "$firebaseArray", "User", "$state",
  // we pass our new chatMessages factory into the controller
  function($scope, $firebaseArray, User, $state) {
    $scope.messages = $firebaseArray(User.ref);


    User.fetchUserObjFromFirebase(function(nameString){
      User.setName(nameString);
      $scope.name = User.getName();
      $scope.$apply();  
    });
    
    $scope.$on('LastRepeaterElement', function(){
      console.log('good to go');
    });

    $scope.addMessage = function() {
      // calling $add on a synchronized array is like Array.push(),
      // except that it saves the changes to our Firebase database!
      var ts = new Date();
      User.ref.push({
        name: $scope.name, 
        text: $scope.messageText, 
        timeStamp: ts
      });
      // reset the message input
      $scope.messageText = "";
    };
    $scope.formatTime = function(dateString){
      var ts = moment(dateString).fromNow();
      return ts;
    };
    $scope.logOff = function(){
      $state.go('signIn');
      User.setAuthObj(null);
      User.setName(null);
    }
  }])

.controller("RegisterCtrl", ["$scope", "$firebaseArray", "$state", "User",
  function($scope, $firebaseArray, $state, User){
    $scope.registerUser = function(username, password) {
      $scope.registerEmail = '';
      $scope.registerPassword = '';
      User.registerUser(username, password, function(error, authData) {
        if(error) { 
          console.log("Error creating user", error);
          $scope.error = error.message;
          $scope.$apply();
        } else {
          console.log("registered user");
          User.signIn(username, password, function(error, authDataFb) {
            if (error) {
            console.log("Login Failed!", error);
            $scope.error = error.message;
            $scope.$apply();
            } else {
              User.setAuthObj(authDataFb);
              console.log('registerCtrl ' + User.getAuthObj().toString());
              $state.go('name');
            }
          });
        }
      });
    };

    $scope.goToSignIn = function(dateString){
      $state.go('signIn');
    };

  }])

.controller("SignInCtrl", ["$scope", "$firebaseArray", "$state", "User",
  function($scope, $firebaseArray, $state, User){
    $scope.signIn = function(username, password) {
      $scope.signInEmail = '';
      $scope.signInPassword = '';
      User.signIn(username, password, function(error, authData) {
        if (error) {
          console.log("Login Failed!", error);
          $scope.error = error.message;
          $scope.$apply();
        } else {
          console.log(authData);
          User.setAuthObj(authData);
          $state.go('messages');
        }
      });
    };

    $scope.goToRegister = function(dateString){
      $state.go('home');
    };

  }])

.controller("NameCtrl", ["$scope", "$firebaseArray", "$state", "User",
  function($scope, $firebaseArray, $state, User){
    // angular.extend($scope, User);
    $scope.saveName = function(name){
      User.setName(name);
      User.saveUserObjToFirebase();
      soonToBeNamed = '';
      $state.go('messages');
    };        

  }])

.directive('emitLastRepeaterElement', function() {
  return function(scope) {
    if (scope.$last){
      scope.$emit('LastRepeaterElement');
    }
  };
});




