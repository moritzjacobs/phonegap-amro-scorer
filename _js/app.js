;(window.onload = function(){
	"use strict";
	

	var I8N_STRINGS = [
		{
			en: "start game",
			de: "Spiel starten",
		},
		{
			en: "Welcome!",
			de: "Willkommen"
		},
		{
			en: "Great! What are your names?",
			de: "Cool! Wie heißt ihr?"
		},
		{
			en: "continue",
			de: "weiter"
		},
		{
			en: "back",
			de: "zurück"
		},
		{
			en: "Who breaks first?",
			de: "Wer stößt an?"
		},
		{
			en: "end game",
			de: "Spiel beenden"
		},
		{
			en: "reset frame",
			de: "Frame zurücksetzen"
		},
		{
			en: "back to table",
			de: "Auf den Tisch"
		}
	];


	var app = new Vue({
		// main container
		el: "#viewport",
		data: {
			// config
			device_language: false,
			device_language_default: "en",
			insomnia_active : false,

			// UI 
			display_viewport: false,
			total_views : 0,
			current_view_index: 0,
			show_move_ball: false,
			current_move_ball: 1,

			// game model
			frame_count: 1,
			frame_endable: false,
			player_1: { name: "Player 1", score_frame : 0, score_total: 0, next_break: false, balls: [] },
			player_2: { name: "Player 2", score_frame : 0, score_total: 0, next_break: false, balls: [] },
			balls_table: [],

		},

		// data watcher
		computed: {
			computedDataJson: function(){
				return JSON.stringify(this.$data);
			},
		},

		watch: {
			computedDataJson: function(){
				this.saveAppData();
			},
		},

		methods: {
			// Application Constructor
			initApp: function() {
				// 15 balls = [1, 2, 3, …]
				this.retrieveAppData();
				
				//bootstrap UI
				var viewport = document.querySelector('#viewport');
				this.total_views = viewport.querySelectorAll(".view").length;
				var views = viewport.querySelectorAll(".view");
				Array.prototype.forEach.call(views, function(view, i){
					view.setAttribute("data-view-index", i);
				});

				// enable back button on device
				document.addEventListener("backbutton", function(){
					if(app.$data.current_view_index !== 3) {
						app.prevView();
					} else {
						app.endGame();
					}
				}, true);

				// load language file
				document.addEventListener("deviceready", function(){
					navigator.globalization.getPreferredLanguage(function(language){
						this.device_language = language.value.substr(0, 2);
					});
				}, false);

				app.startApp();
			},

			saveAppData: function(){
				var json = JSON.stringify(this.$data);
				localStorage.setItem('amro_scorer_data', json);
			},

			retrieveAppData: function(){
				var get = localStorage.getItem('amro_scorer_data');
				if(get === null) {
					this.resetGame();
					this.saveAppData();
				} else {
					var new_data = JSON.parse(get);
					if(typeof new_data === "object") {
						for(var k in this.$data) {
							this[k] = new_data[k];
						}
					}
				}
			},

			i8n: function(str){
				var lang = this.device_language || this.device_language_default;
				for(var i = 0; i < I8N_STRINGS.length; i++) {
					var candidate = I8N_STRINGS[i];
					if(candidate[this.device_language_default] === str) {
						return candidate[lang];
					}
				}
				console.log("Missing string for i8n: \"" + str + "\"");
				return str;
			},

			toggleInsomnia: function() {
				this.insomnia_active = !this.insomnia_active;
				if(this.insomnia_active) {
	 				window.plugins.insomnia.keepAwake();
				} else {
					window.plugins.insomnia.allowSleepAgain();
				}
			},

			startApp: function(){
				var loader = document.querySelector("#app-loader");
				this.display_viewport = true;
				setTimeout(function(){
					loader.classList.add("done");
				}, 2000);
				window.clearInterval(window.loader_interval);
			},

			nextView: function(){
				if(this.current_view_index < this.total_views) {
					this.current_view_index += 1;
				}
			},
			prevView: function(){
				if(this.current_view_index > 0) {
					this.current_view_index -= 1;
				}
			},

			changeView: function(name) {
				var cvi = parseInt(document.querySelector("#"+name+"-view").getAttribute("data-view-index"));
				this.current_view_index = cvi;
			},

			startGame: function(pbf){
				this["player_"+pbf].next_break = true;
				this.changeView("game");
			},

			moveBall: function(ball) {
				this.show_move_ball = true;
				this.current_move_ball = ball;
			},

			removeBallFromPlayer: function(player, ball) {
				var i = this["player_"+player].balls.indexOf(ball);
				if (i > -1) {
					this["player_"+player].balls.splice(i, 1);
				}
			},

			removeBallFromTable: function(ball) {
				var i = this.balls_table.indexOf(ball);
				if (i > -1) {
					this.balls_table.splice(i, 1);
				}
				
			},

			removeFromAllDepots: function(ball) {
				this.removeBallFromTable(ball);
				this.removeBallFromPlayer(1, ball);
				this.removeBallFromPlayer(2, ball);
			},

			findLowestBall: function(){
				if(this.balls_table.length > 0) {
					this.balls_table.sort(function(a, b) { return a - b; });
					return this.balls_table[0];
				}
				return -1;
			},

			moveToPlayer: function(player, ball) {
				this.removeFromAllDepots(ball);
				var new_balls = this["player_"+player].balls;
				new_balls.push(ball);
				new_balls.sort(function(a, b) { return a - b; });
				this["player_"+player].balls = new_balls;
				this.update();
				var cmb = this.findLowestBall();
				if(cmb >= 0) {
					this.current_move_ball = cmb;
				} else {
					this.show_move_ball = false;
				}

			},
			
			moveToTable: function(ball) {
				this.removeFromAllDepots(ball);
				var new_balls = this.balls_table;
				new_balls.push(ball);
				new_balls.sort(function(a, b) { return a - b; });
				this.balls_table = new_balls;
				this.update();
				this.current_move_ball = this.findLowestBall();
				this.show_move_ball = false;
			},

			update: function(){
				this.calcPlayerScore(1);
				this.calcPlayerScore(2);
				this.isFrameOver();
			},

			calcPlayerScore: function(player) {
				var balls = this["player_"+player].balls;
				var pts = 0;
				for(var i = 0; i < balls.length; i++) {
					var pt = 1;
					if(balls[i] > 10) {
						pt = 2;
					}
					pts += pt;
				}
				this["player_"+player].score_frame = pts;
			},

			confirm: function(text, ok, cancel) {
				return confirm(text);
			},

			isFrameOver: function(player) {
				if(!this.frame_endable && this.balls_table.length < 1) {
					this.show_move_ball = false;
					
					if(this.confirm("Frame over, next frame?", "Next frame", "adjust frame")) {
						this.endFrame();
					} else {
						this.frame_endable = true;
					}
				}
			},
			resetFramePrompt: function(){
				if(this.confirm("Really reset this frame?", "Yes, reset.", "No, it's fine.")) {
					this.resetFrame();
				}
			},

			resetFrame: function(){
				this.player_1.score_frame = 0;
				this.player_2.score_frame = 0;

				this.player_1.balls = [];
				this.player_2.balls = [];

				this.resetTableBalls();
			},


			endFrame: function(){
				this.frame_count++;
				this.player_1.next_break = !this.player_1.next_break;
				this.player_2.next_break = !this.player_2.next_break;

				this.player_1.score_total += this.player_1.score_frame;
				this.player_2.score_total += this.player_2.score_frame;
				this.frame_endable = false;
				this.resetFrame();
			},

			endGame: function(){
				if(this.confirm("Are you sure you want to end this game?", "Yes, end it!", "No, whoops...")) {
					this.resetGame();
					this.changeView("home");
				}
			},

			resetGame: function() {
				this.frame_count = 1;
				this.frame_endable = false;
				this.resetFrame();
				this.player_1.score_total = 0;
				this.player_2.score_total = 0;
				this.player_1.next_break = false;
				this.player_2.next_break = false;
			},

			resetTableBalls: function(){
				this.balls_table = Array.apply(null, Array(15)).map(function (_, i) {return i + 1;});
			},
		},

		components: {
			"move-ball": {
				template: '#move-ball',
				props: {
					show: Boolean,
					ball: Number,
					player_1: String,
					player_2: String,
					btt_label: String,
				},
				methods: {
					moveToPlayer: function(player) {
						this.$emit('movetoplayer', player, this.ball);
					},
					moveToTable: function() {
						this.$emit('movetotable', this.ball);
					},
					i8n: function(str){
						return this.$root.i8n(str);
					},

				},
			},
		},

	});



	app.initApp();

});