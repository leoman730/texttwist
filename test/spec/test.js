/*global describe, it */
'use strict';
mocha.setup({
    ignoreLeaks: true,
    ui: 'bdd',
    
});
var expect = chai.expect;
var assert = chai.assert;
var testApp = new app();



// jQuery plugin. Called on a jQuery object, not directly.
jQuery.fn.simulateKeyPress = function(character) {
  // Internally calls jQuery.event.trigger
  // with arguments (Event, data, elem). That last arguments is very important!
  jQuery(this).trigger({ type: 'keypress', which: character.charCodeAt(0) });
};
// jQuery plugin. Called on a jQuery object, not directly.
jQuery.fn.simulateEnterKeyPress = function() {
  // Internally calls jQuery.event.trigger
  // with arguments (Event, data, elem). That last arguments is very important!
  jQuery(this).trigger({ type: 'keypress', which:13 });
};



(function() {
    describe('Call app.init()', function() {
        testApp.init();
        it('should have an empty usr_wd model', function() {
            assert.isDefined(testApp.usr_wd, 'usr_wd is defined.');
        });

        it('should have an empty pc_wd model', function() {
            assert.isDefined(testApp.pc_wd, 'pc_wd is defined.');
        });

        it('should have an empty pc_wdl model', function() {
            assert.isDefined(testApp.pc_wdl, 'pc_wdl is defined.');
        });

        it('should has a dictionary', function() {
            assert.isDefined(testApp.dict, 'Dictionary is defined');
        });

        it('should has a main view', function() {
            assert.isDefined(testApp.main_view, 'usr_wd is defined.');
        });

        describe('Call getDictionary()', function() {
            var dict = testApp.getDictionary();
            it('should get an array', function() {
                assert.isTrue(dict.length > 0);
            });
        });
    });

    describe('Call app.start()', function() {
        testApp.start();

        describe('Call getRamdomWordList()', function() {
            var wdl = testApp.getRamdomWordList(testApp.dict);
            it('should get a propery object from dictionary', function() {
                assert.isObject(wdl, 'Wordlist is an object');
                assert.isDefined(wdl.key);
                assert.isDefined(wdl.list);
            });
        });

        it('pc_wdl should not be empty', function() {
            assert.isTrue(testApp.pc_wd.get('chars').length > 0);
        }); 

        it('should have a wordlist defined', function() {
            assert.isDefined(testApp.pc_wdl);
        }); 
    });

    describe('Call isValidChar()', function () {
      testApp.pc_wd.set('chars', 'abcdefg');
      describe('when passing invalid char', function () {
        it('should return false', function () {
          assert.isFalse(testApp.isValidChar('z'));
        });
      });
      describe('when passing valid char', function () {
        it('should return true', function () {
          assert.isTrue(testApp.isValidChar('a'));
        });
      });
    });

    describe('Call pushCharToWord()', function () {
      describe('when add z to the word "abcdefg"', function () {
        it('should get abcdefgz', function () {
          assert.equal(testApp.pushCharToWord('abcdefg', 'z'), 'abcdefgz');
        });
      });
    });

    describe('Call popCharFromWord', function () {
      describe('when pop c to the word "abcdefg"', function () {
        it('should get abdefg', function () {
          assert.equal(testApp.popCharFromWord('abcdefg', 'c'), 'abdefg');
        });
      });
    });


    describe('Call validWord()', function () {
      describe('when pass a valid word', function () {
        it('should return true', function () {
          testApp.usr_wd.set('chars', 'bad');
          assert.isTrue(testApp.validWord(testApp.usr_wd, testApp.pc_wdl));
        });
      });
      describe('when pass an invalid word', function () {
        it('should return true', function () {
          testApp.usr_wd.set('chars', 'bags');
          assert.isFalse(testApp.validWord(testApp.usr_wd, testApp.pc_wdl));
          testApp.usr_wd.set('chars', '');
        });
      });
    });

    describe('When a key is pressed', function () {
      testApp.pc_wd.set('chars', 'fabced');
      describe('when key is one of the pc word char', function () {
        it('should remove the char from pc_wd model', function () {
          $('body').simulateKeyPress('b');
          assert.equal(testApp.pc_wd.get('chars').length, 5, 'pc_wd now has 5 chars');
          $('body').simulateKeyPress('a');
          assert.equal(testApp.pc_wd.get('chars').length, 4, 'pc_wd now has 4 chars');
          $('body').simulateKeyPress('d');
          assert.equal(testApp.pc_wd.get('chars').length, 3, 'pc_wd now has 3 chars');

        });

        it('should add the char to usr_wd model', function () {
          assert.equal(testApp.usr_wd.get('chars').length, 3, 'usr_wd now has 3 chars');  
        });
        
      });

      describe('when "enter" key is pressed', function () {        
        describe('when usr_wd is on the pc_wdl', function () {

          it('tracker length should increase by 1', function () {
            testApp.usr_wd.set('chars', 'bed');
            var tmp = testApp.word_tracker.length;
            $('body').simulateEnterKeyPress(); 
            assert.equal(testApp.word_tracker.length - tmp, 1);
          });


          it('should reset usr_wd to empty', function () {           
            assert.equal(testApp.usr_wd.get('chars'), '', 'usr_wd is empty');            
          });

          it('should reset pc_wd to original chars set', function () {
            assert.equal(testApp.pc_wd.get('chars'), testApp.pc_wd_orig, "pc_wd is reset");
          });

          describe('when there no more word on the list', function () {
            it('should show winning message', function () {
               if (testApp.isWon()) {
                  assert.isTrue(testApp.won);
               }
            });     
          });

        });
      });

    });

    // may not need this
    describe('Call app.reset()', function() {

    });

})();




