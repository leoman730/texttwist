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
        gameTime: 120, // in second
        init: function() {
        	this.status = 'initialized';
            // generate dictionary 
            this.dict = this.getDictionary();            
            // listen to user input 
            $('body').bind('keypress', this.processInput.bind(this));
        },
        /**
         * Start a game
         * Initialized all necessary parameters and set up game view
         * @return {[type]}
         */
        start: function() {
        	this.status = 'prograss';
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

	    	$('#main_game').show();
	    	$('#start_screen').hide();

            //start timer 
            app.startTimer(this.gameTime);
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

                // check game finihs
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
        /**
         * Handle winning situation
         * @return {[type]}
         */
        processWinner: function() {
        	clearInterval(this.interval);
			this.status = 'won';
            alert('you won!!');
        },
        /**
         * Check if user won the game 
         * @return {Boolean}
         */
        isWon: function() {
            if (this.pc_wdl.length === this.word_tracker.length) {
                return true;
            } else {
                return false;
            }
        },
        /**
         * Reset both pc word and usr word to the orginal value before game started
         * @return {[type]}
         */
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
                console.log(keycode);
            if (keycode === 13) { /* Enter key */
            	if (this.status === 'initialized') {
            		this.start();
            	} else if (this.status === 'prograss') {
	                this.processWord();
            	}
            } else {
                character = String.fromCharCode(keycode).toLowerCase();

                if (this.isValidChar(character)) {
                    this.usr_wd.set('chars', this.pushCharToWord(this.usr_wd.get('chars'), character));

                    this.pc_wd.set('chars', this.popCharFromWord(this.pc_wd.get('chars'), character));

                } else {
                    console.log('invalid character, do nothing');
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
        /**
         * Fire a timer when game start
         * @param  {[type]} time
         * @return {[type]}
         */
        startTimer: function(time) {
        	
            var time = time || 60;
            var $el = $('#timer');
            var self = this;

            self.interval = setInterval(function() {
                
                if (time < 0 && !self.isWon()) {
                	$el.css({
                		'color': 'red'
                	});

                	self.handleGameOver();
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
         * Stop a gam gracefully
         * @return {[type]}
         */
        handleGameOver: function() {
	        alert('game over.');
	        this.status = 'failed';       
	        this.showResult();        
	        clearInterval(this.interval);        	
        },

        /**
         * Pick and get getRamdomWordList wordlist from given dict
         * @param {array} dict
         */
        getRamdomWordList: function(dict) {
            dict = _.first(_.shuffle(dict));
            return dict;
        },
       	/**
       	 * Display the wordlist
       	 * 
       	 */
        showResult: function() {
        	_.each(this.pc_wdl.models, function(wd){
        		wd.trigger('show_word');
        	});
        },
        /**
         * Give user option to play a new game
         * @return {[type]}
         */	
        resetGame: function(){
        	if (this.status === 'prograss') {
        		var confirm = window.confirm("Are you sure want to restart the game?");
        		if (!confirm) {
        			return false;
        		}
        	} 
        	clearInterval(this.interval);
        	$('.wordlist').remove();
        	$('.pc_wd_container').text('');
        	$('.usr_wd_container').text('');
        	$('#timer').text('');
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
                'chars': 'cot'
            }));
            collection.add(new WordModel({
                'chars': 'ort'
            }));
            collection.add(new WordModel({
                'chars': 'roc'
            }));
            collection.add(new WordModel({
                'chars': 'rot'
            }));
            collection.add(new WordModel({
                'chars': 'tic'
            }));
            collection.add(new WordModel({
                'chars': 'coir'
            }));
            collection.add(new WordModel({
                'chars': 'riot'
            }));
            collection.add(new WordModel({
                'chars': 'trio'
            }));
            collection.add(new WordModel({
               'chars': 'victor'
            }));            

            var wdl = {};
			wdl.key = 'tocriv';
            wdl.list = collection;
            dic.push(wdl);

            var collection = new WordList();
             		collection.add(new WordModel({'chars':'ago'}));        		
             		collection.add(new WordModel({'chars':'ash'}));
             		collection.add(new WordModel({'chars':'gas'}));
             		collection.add(new WordModel({'chars':'hag'}));
             		collection.add(new WordModel({'chars':'ham'}));
             		collection.add(new WordModel({'chars':'has'})); 
             		collection.add(new WordModel({'chars':'hog'}));        		
             		collection.add(new WordModel({'chars':'ohm'}));
             		collection.add(new WordModel({'chars':'sag'}));
             		collection.add(new WordModel({'chars':'gash'}));
             		collection.add(new WordModel({'chars':'gosh'}));
             		collection.add(new WordModel({'chars':'hags'}));                     		
             		collection.add(new WordModel({'chars':'hams'}));
             		collection.add(new WordModel({'chars':'hogs'}));
             		collection.add(new WordModel({'chars':'mash'}));
             		collection.add(new WordModel({'chars':'ohms'})); 
             		collection.add(new WordModel({'chars':'shag'}));        		
             		collection.add(new WordModel({'chars':'sham'}));
             		collection.add(new WordModel({'chars':'smog'}));
      
                 	var wdl = {};
                 	wdl.key = 'homags';
                 	wdl.list = collection;
                 	dic.push(wdl);

            var collection = new WordList();
             		collection.add(new WordModel({'chars':'ire'}));
             		collection.add(new WordModel({'chars':'jet'}));
             		collection.add(new WordModel({'chars':'ret'}));
             		collection.add(new WordModel({'chars':'tie'}));
             		collection.add(new WordModel({'chars':'tit'}));
             		collection.add(new WordModel({'chars':'rite'}));
             		collection.add(new WordModel({'chars':'tier'}));
             		collection.add(new WordModel({'chars':'tire'}));
             		collection.add(new WordModel({'chars':'trite'}));
                 	var wdl = {};	
                 	wdl.key = 'tijter';
                 	wdl.list = collection;
                 	dic.push(wdl);



            var collection = new WordList();
             		collection.add(new WordModel({'chars':'erg'}));
             		collection.add(new WordModel({'chars':'rue'}));
             		collection.add(new WordModel({'chars':'rug'}));
             		collection.add(new WordModel({'chars':'sue'}));
             		collection.add(new WordModel({'chars':'use'}));
             		collection.add(new WordModel({'chars':'ergs'}));
             		collection.add(new WordModel({'chars':'rues'}));
             		collection.add(new WordModel({'chars':'rugs'}));
             		collection.add(new WordModel({'chars':'ruse'}));
             		collection.add(new WordModel({'chars':'sure'}));
             		collection.add(new WordModel({'chars':'urge'}));
             		collection.add(new WordModel({'chars':'user'}));
             		collection.add(new WordModel({'chars':'surge'}));
             		collection.add(new WordModel({'chars':'urges'}));

                 	var wdl = {};	
                 	wdl.key = 'ursueg';
                 	wdl.list = collection;
                 	dic.push(wdl);


            var collection = new WordList();
             		collection.add(new WordModel({'chars':'ant'}));
             		collection.add(new WordModel({'chars':'ate'}));
             		collection.add(new WordModel({'chars':'eat'}));
             		collection.add(new WordModel({'chars':'net'}));
             		collection.add(new WordModel({'chars':'sat'}));
             		collection.add(new WordModel({'chars':'sea'}));
             		collection.add(new WordModel({'chars':'set'}));
             		collection.add(new WordModel({'chars':'tan'}));
             		collection.add(new WordModel({'chars':'tea'}));
             		collection.add(new WordModel({'chars':'ten'}));
             		collection.add(new WordModel({'chars':'ante'}));
             		collection.add(new WordModel({'chars':'ants'}));
             		collection.add(new WordModel({'chars':'east'}));
             		collection.add(new WordModel({'chars':'eats'}));
             		collection.add(new WordModel({'chars':'neat'}));
             		collection.add(new WordModel({'chars':'nest'}));
             		collection.add(new WordModel({'chars':'nets'}));
             		collection.add(new WordModel({'chars':'sane'}));
             		collection.add(new WordModel({'chars':'sate'}));
             		collection.add(new WordModel({'chars':'seat'}));
             		collection.add(new WordModel({'chars':'sent'}));
             		collection.add(new WordModel({'chars':'tans'}));   
             		collection.add(new WordModel({'chars':'teas'}));
             		collection.add(new WordModel({'chars':'tens'}));
                 	var wdl = {};	
                 	wdl.key = 'tannes';
                 	wdl.list = collection;
                 	dic.push(wdl);
            return dic;
        }
    };
})();

$('document').ready(function() {
    app.init();
   	$('body').focus();

    $('#start_screen #start_btn').click(function(){
    	app.start();    	
    });

    $('#main_game #new_game').click(function(){
    	app.resetGame();
    });
});