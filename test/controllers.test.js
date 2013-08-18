describe( 'controller test', function() {
  beforeEach( angular.mock.module( 'myApp' ) );

  //mock the controller for the same reason and include $rootScope and $controller
  beforeEach(angular.mock.inject(function($rootScope, $controller){
      //create an empty scope
      scope = $rootScope.$new();

      socketMock = new sockMock($rootScope);

      //declare the controller and inject our empty scope
      $controller('AppCtrl', {$scope: scope, socket: socketMock, serverState:{roomName:'testRoom'}});
  })); 

  it('should have variable name = "testRoom"', function(){
    expect(scope.name).toBe('testRoom');
  });

  it('should accept changeCurrentFile file="/myfiles/test.js"', function(){
    socketMock.emit('changeCurrentFile', '/myfiles/test.js', 'text/javascript');
    expect(scope.currentFile).toBe('/myfiles/test.js');
    expect(scope.editorOptions.mode).toBe('text/javascript');
  });

  it('should accept roomReadOnly', function(){
    socketMock.emit('roomReadOnly', true);
    expect(scope.readOnly).toBe(true);
    socketMock.emit('roomReadOnly', false);
    expect(scope.readOnly).toBe(false);
  });

  it('should accept roomAuthMap', function(){
    var testMap = {
      moderator:{'editData':true, 'newChatMessage':true, 'changeUserId':true, 'saveCurrentFile': true, 'changeCurrentFile':true, 'changeRole':true},
      editor:{'editData':true, 'newChatMessage':true, 'changeUserId':true, 'saveCurrentFile': true, 'changeCurrentFile':true, 'changeRole':false},
      default:{'editData':false, 'newChatMessage':true, 'changeUserId':true, 'saveCurrentFile': false, 'changeCurrentFile':false, 'changeRole':false}
    };

    socketMock.emit('roomAuthMap', testMap);
    expect(scope.authMap).toBe(testMap);
  });

  it('should accept fileAdded and add file to files list', function(){
    socketMock.emit('fileAdded', '/my/test/file.js');
    expect(scope.files.length).toBe(1);
    expect(scope.files[0]).toBe('/my/test/file.js');
  });

  it('should accept fileDeleted and remove file from files list', function(){
    socketMock.emit('fileAdded', '/my/test/file.js');
    socketMock.emit('fileAdded', '/my/other/test/stuff.css');
    socketMock.emit('fileDeleted', '/my/test/file.js');
    expect(scope.files.length).toBe(1);
    expect(scope.files[0]).toBe('/my/other/test/stuff.css');
  });

  it('should accept refreshData', function(){
    socketMock.emit('refreshData', 'This is the new file data.');
    expect(scope.body).toBe('This is the new file data.');
  });

  it('should accept changeData', function(){
    var testOp = {origin:'+input'};
    socketMock.emit('changeData', testOp);
    expect(scope.newChange).toBe(testOp);
  });

  it('should accept resetHostData and reset all host data', function(){
    socketMock.emit('resetHostData');
    expect(scope.currentFile).toBe('no file');
    expect(scope.files.length).toBe(0);
    expect(scope.body).toBe('');
    expect(scope.warning).toBe('');
  });

  it('should accept newChatMessage and add it to the messages list', function(){
    var flag;

    runs(function() {
      flag = false;

      socketMock.emit('newChatMessage', "Hi my name is bob", 'bob');
      socketMock.emit('newChatMessage', "pleased to meet you, I'm Cindy", 'Cindy Crawford');

      setTimeout(function() {
        socketMock.emit('newChatMessage', "I'm like.. a Model!", 'Cindy Crawford');
        flag = true;
      }, 100);
    });

    waitsFor(function() {
      return flag;
    }, "it should wait to post the last message", 200);

    runs(function() {
      expect(scope.messages.length).toBe(3);
      expect(scope.messages[2].message).toBe("I'm like.. a Model!");
      expect(scope.messages[1].date.getTime()).toBeLessThan(scope.messages[2].date.getTime());
    });
  });


});

/*
Simple mock for socket.io
see: https://github.com/btford/angular-socket-io-seed/issues/4
thanks to https://github.com/southdesign for the idea
*/
var sockMock = function($rootScope){
  this.events = {};

  // Receive Events
  this.on = function(eventName, callback){
    if(!this.events[eventName]) this.events[eventName] = [];
    this.events[eventName].push(callback);
  }

  // Send Events
  this.emit = function(eventName){
    var args = Array.prototype.slice.call(arguments, 1);
    if(this.events[eventName]){
      angular.forEach(this.events[eventName], function(callback){
        $rootScope.$apply(function() {
          callback.apply(this, args);
        });
      });
    };
  }
};



