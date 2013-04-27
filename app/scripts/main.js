/**
 * Backbonejs Reference:
 * http://dailyjs.com/2012/12/27/backbone-tutorial-5/
 * https://github.com/leoman730/todomvc/tree/gh-pages/architecture-examples/backbone
 * http://backbonejs.org/examples/todos/index.html
 * https://github.com/leoman730/dotnet-dashboard.andbang.com
 * 
 */

var app = (function() { /* Define models here */
    var WordModel = Backbone.Model.extend({
        defaults: {
            'chars': ''
        },
        initialize: function() {
            //console.log('create word model');
        }
    });

    var WordList = Backbone.Collection.extend({
        model: WordModel,
        initialize: function() {
            //console.log('create new wordlist model');
        }
    });

    /* Define views here */
    var MainView = Backbone.View.extend({
        el: $('#texttwist'),
        events: {
        },
        initialize: function() {}
    });

    var WordlistView = Backbone.View.extend({
        tagName: 'div',
        className: 'wordlist span2',
        template: _.template($('#wordlist').html()),
        events: {

        },
        initialize: function() {
            //this.collection.on('add remove', this.render, this);
            //this.listenTo(app.pc_wdl, 'change', this.render);
        },
        render: function() {
            var $el = $(this.el),
                self = this;

            // loop throught the collection
            this.collection.each(function(list) {
                var item;
                item = new WordlistItemView({
                    model: list
                });
                $el.append(item.render().el);
            });
            return this;
        }
    });

    var WordlistItemView = Backbone.View.extend({
        tagName: 'div',
        className: 'wdl_item clearfix',
        template: _.template($('#wordlist_item_empty').html()),
        events: {

        },
        initialize: function() {
            this.model.on('remove', this.remove, this);
            this.model.on('show_word', this.showWord, this);
        },
        render: function() {
            var $el = $(this.el);
            $el.html(this.template(this.model.toJSON()));
            return this;
        },
        showWord: function() {
            // update template then render to update item view
            this.template = _.template($('#wordlist_item_filled').html());
            this.render();
        }
    });

    var PcWordView = Backbone.View.extend({
        template: _.template($('#pc_word').html()),
        initialize: function() {
            console.log(this.model.toJSON());
            this.model.on('change', this.render, this);
        },
        render: function() {
            var $el = $(this.el);
            $el.html(this.template(this.model.toJSON()));
            return this;
        }
    });

    var UsrWordView = Backbone.View.extend({
        template: _.template($('#usr_word').html()),
        initialize: function() {
            this.model.on('change', this.render, this);
        },
        render: function() {
            var $el = $(this.el);
            $el.html(this.template(this.model.toJSON()));
            return this;
        }
    });

    return {
        word_tracker: [],
        status: '',
        init: function() {
            // generate dictionary 
            this.dict = this.getDictionary();
        },

        start: function() {
            this.usr_wd = new WordModel();
            this.pc_wd = new WordModel();
            this.pc_wdl = new WordList();
            this.main_view = new MainView();

            // set up wordlist
            var wdl = this.getRamdomWordList(this.dict);
            this.pc_wdl = wdl.list;
            this.wdl_view = new WordlistView({
                collection: this.pc_wdl
            });
            $('.wdl_container').append(this.wdl_view.render().el);

            // set up pc word
            this.pc_wd.set('chars', _.shuffle(wdl.key).join(''));
            this.pc_wd_view = new PcWordView({
                model: this.pc_wd
            });
            $('.pc_wd_container').append(this.pc_wd_view.render().el);

            // set up usr word
            this.usr_wd_view = new UsrWordView({
                model: this.usr_wd
            });
            $('.usr_wd_container').append(this.usr_wd_view.render().el);

            //save an original copy of usr_wd, pc_wd
            this.pc_wd_orig = this.pc_wd.get('chars');
            this.usr_wd_orig = this.usr_wd.get('chars');

            // listen to user input 
            $('body').bind('keypress', this.processInput.bind(this));

            //start timer 
            app.startTimer(5, 20);
        },
        /**
         * Check if a word is in the given wordlist
         * @param  {[type]} wd
         * @param  {[type]} wdl
         * @return {boolean}
         */
        validWord: function(wd, wdl) {
            if (wdl.where(wd.toJSON()).length != 0) {
                return true;
            } else {
                return false;
            }
        },
        /**
         * Process word, trigger when user press 'enter' key
         * @return {[type]}
         */
        processWord: function() {
            if (this.validWord(this.usr_wd, this.pc_wdl)) {
                var wd = this.pc_wdl.where(this.usr_wd.toJSON())[0];
                // update WordlistItemView				
                wd.trigger('show_word');

                // add word to tracker
                this.word_tracker.push(wd.get('chars'));

                // reset pc_wd to original
                this.resetWord()

                // check game finish
                if (this.isWon()) {
                	this.processWinner();
                }

            } else {
                console.log('not valid');
                this.resetWord();
                // reset usr_wd empty
                // reset pc_wd to original
            }
        },
        processWinner: function() {
        	clearInterval(this.interval);
			this.status = 'won';
            alert('you won!!');
        },
        isWon: function() {
            if (this.pc_wdl.length === this.word_tracker.length) {
                return true;
            } else {
                return false;
            }
        },

        resetWord: function() {
            this.pc_wd.set('chars', this.pc_wd_orig);
            this.usr_wd.set('chars', '')
        },

        /**
         * Process input value, handle interaction
         * @param  {event} e
         * @return {void}
         */
        processInput: function(e) {
        	if (this.status === 'failed') {
        		return ;
        	}

            var keycode = e.which,
                character;
                console.log(keycode		);
            if (keycode == 13) { /* Enter key */
                this.processWord();
            } else {
                character = String.fromCharCode(keycode).toLowerCase();

                if (this.isValidChar(character)) {
                    this.usr_wd.set('chars', this.pushCharToWord(this.usr_wd.get('chars'), character));

                    this.pc_wd.set('chars', this.popCharFromWord(this.pc_wd.get('chars'), character));

                } else {
                    console.log('invalid character, do nothing');
                    alert('Please enter valid character');
                }

            }
        },
        /**
         * Add a character to a word
         * @param  {[type]} wd
         * @param  {[type]} character
         * @return {string}
         */
        pushCharToWord: function(wd, character) {
            return wd + character;
        },
        /**
         * Remove a character from a word
         * @param  {[type]} wd
         * @param  {[type]} character
         * @return {string}
         */
        popCharFromWord: function(wd, character) {
            return wd.replace(character, '');
        },

        /**
         * Check if the user input is a character in the word
         * @param  {[type]}  char
         * @return {Boolean}
         */
        isValidChar: function(char) {
            if (this.pc_wd.get('chars').indexOf(char) == -1) {
                return false;
            } else {
                return true;
            }
        },
        startTimer: function(minutes, seconds) {
        	var minutes = minutes || 0;
        	var seconds = seconds || 0;
            var time = minutes * 60 + seconds;
            var $el = $('#timer');
            var self = this;

            self.interval = setInterval(function() {
                
                if (time == 0 && !self.isWon()) {

                    $el.text("countdown's over!");
                    //alert('game over.');
                    self.status = 'failed';       
                    self.showResult();        
                    clearInterval(self.interval);
                    return;
                }
                
                var minutes = Math.floor(time / 60);
                
                if (minutes < 10) {
                	minutes = "0" + minutes;
                }
                
                var seconds = time % 60;
                
                if (seconds < 10) {
                	seconds = "0" + seconds;	
                } 

                var text = minutes + ':' + seconds;
                $el.text(text);
                time--;
            }, 1000);
        },

        /**
         * Pick and get getRamdomWordList wordlist from given dict
         * @param {array} dict
         */
        getRamdomWordList: function(dict) {
            dict = _.first(_.shuffle(dict));
            return dict;
        },

        showResult: function() {
        	_.each(this.pc_wdl.models, function(wd){
        		wd.trigger('show_word');
        	});
        },
        resetGame: function(){
        	clearInterval(this.interval);
        	$('.wordlist').remove();
        	$('.pc_wd_container').text('');
        	$('.usr_wd_container').text('');
        	$('#timer').text('');
        	$('body').unbind('keypress');
        	this.start();
        },
        /**
         * Return an array of wordlists
         *
         * Need some refactory work here
         * @return 
         */
        getDictionary: function() {

            var dic = [];
            var collection = new WordList();
            collection.add(new WordModel({
                'chars': 'bad'
            }));
            collection.add(new WordModel({
                'chars': 'bed'
            }));
            collection.add(new WordModel({
                'chars': 'fed'
            }));
            collection.add(new WordModel({
                'chars': 'fade'
            }));
            collection.add(new WordModel({
                'chars': 'decaf'
            }));
            var wdl = {};
            wdl.key = 'abcdef';
            wdl.list = collection;
            dic.push(wdl);

            var collection = new WordList();
             		collection.add(new WordModel({'chars':'he'}));        		
             		collection.add(new WordModel({'chars':'why'}));
             		collection.add(new WordModel({'chars':'yeah'}));
             		collection.add(new WordModel({'chars':'hey'}));
             		collection.add(new WordModel({'chars':'age'}));
             		collection.add(new WordModel({'chars':'way'})); 
                 	var wdl = {};
                 	wdl.key = 'yhgewa';
                 	wdl.list = collection;
                 	dic.push(wdl);
            var collection = new WordList();
             		collection.add(new WordModel({'chars':'age'}));
             		collection.add(new WordModel({'chars':'bag'}));
             		collection.add(new WordModel({'chars':'beg'}));
             		collection.add(new WordModel({'chars':'cab'}));
             		collection.add(new WordModel({'chars':'cage'}));
                 	var wdl = {};	
                 	wdl.key = 'geabc';
                 	wdl.list = collection;
                 	dic.push(wdl);
            return dic;
        }
    };
})();

$('document').ready(function() {
    app.init();
    
    $('#start_screen #start_btn').click(function(){
    	$('#main_game').show();
    	$('#start_screen').hide();
    	app.start();
    	app.startTimer(5, 20);    	
    });

    $('#main_game #new_game').click(function(){
    	app.resetGame();
    });
});