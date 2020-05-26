/*
jQuery flip clock plugin - for details see https://github.com/andysellick/flipclock
*/
(function (window,$) {
	var Plugin = function(elem,options){
		this.elem = elem;
		this.$elem = $(elem);
		this.options = options;
	};

	Plugin.prototype = {
		init: function(){
			var obj = this;
			obj.units = ['second','minute','hour','day','month','year'];
			obj.time = {'year':0,'month':0,'day':0,'hour':0,'minute':0,'second':0};
			obj.prevtime = {'year':0,'month':0,'day':0,'hour':0,'minute':0,'second':0};
			obj.timelimits = {'year':10000,'month':11,'day':366,'hour':23,'minute':59,'second':59};
			obj.timer = 0;
			obj.trigger = 0;
			obj.endofdays = 0; //handles the special case when a countdown becomes a countup
			obj.timeZoneOffset = 0;

			this.settings = $.extend({
				mode: 'counter', //determines the behaviour of the flipclock: counter simply counts the time since/til targetDate
				showUnits: true, //controls display name of units beneath digits
				showAllDigits: false, //if true, show all digits regardless, if false, only show from the 1st digit that is 1 or higher
				targetDate: [2000,1,1,0,0,0],
				stopAtZero: false,
				timeZoneOffset: -1 //controls time zone. If set, all times are set to GMT plus that amount, if -1, set to your current timezone
			}, this.defaults, this.options);

			var functions = {
				general: {
					//do initial settings setup and prevent settings abuse
					overrideSettings: function(){
						var len = obj.settings.targetDate.length;
						if(len < 6){
							for(var l = len; len < 6; len++){
								obj.settings.targetDate.push(0);
							}
						}
						var d = obj.settings.targetDate;
						obj.settings.targetDate = new Date(d[0],d[1] - 1,d[2],d[3],d[4],d[5]); //second parameter, month, is zero indexed, so we have to subtract 1 to get the right month
						if(obj.settings.timeZoneOffset !== -1){
							var offset = new Date();
							offset = offset.getTimezoneOffset();
							obj.timeZoneOffset = ((offset / 60) + obj.settings.timeZoneOffset) * 3600000;
						}
					},
					//insert all required markup
					initElements: function(){
						obj.$elem.html('').addClass('flipclock');
						var showdigits = 1;

						if(obj.settings.mode === 'clock'){
							//cheat a bit - set the targetDate to an arbitrary midnight, then only show the hours, minutes and seconds
							obj.settings.targetDate = [2000,1,1,0,0,0,0];
							var date = new Date;
							obj.time.second = date.getSeconds();
							obj.time.minute = date.getMinutes();
							obj.time.hour = date.getHours() + obj.timeZoneOffset;
							//console.log('initial hours are', date.getHours(), obj.time.hour);
							showdigits = Math.floor(obj.units.length / 2 - 1);
						}
						else {
							showdigits = obj.units.length - 1;
						}
						//create digits for all the time units
						for(var i = showdigits; i > -1; i--){
							functions.markup.generateDigit(functions.general.padDigits(obj.time[obj.units[i]], 2),obj.units[i]);
						}
						functions.general.backupTime();
						if(!obj.settings.stopAtZero){
							functions.general.initCounter();
						}
						else {
							functions.markup.showDigit('second');
						}
						if(obj.settings.showAllDigits){
							obj.$elem.find('.flipclock__unit').addClass('flipclock__unit--visible'); //show all time elements
						}
					},

					//get the difference between the time now and the time target
					getTimeNowTarget: function(){
						functions.general.backupTime();
						functions.general.resetTime();
						var now = Date.now() + obj.timeZoneOffset;
						var output = moment.preciseDiff(now, obj.settings.targetDate);
						output = output.split(" ");

						if(output.length > 1){
							obj.endofdays = 0;
							for(var i = 0; i < output.length; i += 2){
								var num = output[i];
								var unit = output[i + 1];
								if(unit[unit.length - 1] == 's'){ //moment's output can vary e.g. 'seconds' or 'second', to match the array keys in time we need to trim this
									unit = unit.substring(0, unit.length - 1);
								}
								obj.time[unit] = num; //this only happens if moment returns a value for this digit type, which it doesn't do if it's 0
							}
						}
						else {
							obj.endofdays = 1;
							if(obj.settings.stopAtZero){
								obj.trigger.remove();
								clearTimeout(obj.timer);
							}
						}
					},

					//set up the counter element and its CSS transition trigger to call the time update
					initCounter: function(){
						obj.trigger = $('<div/>').addClass('flipclock__trigger').attr('data-id','trigger').appendTo(obj.$elem); //create the timekeeping element
						var wait = 1;
						//in theory if we start on an exact second the js should be in sync with the css animation. In theory.
						setTimeout(function(){
							while(wait){
								if(Date.now() % 1000 === 0){
									wait = 0;
									obj.trigger.addClass('flipclock__trigger--active');
								}
							}
						},1);

						// Function from David Walsh: http://davidwalsh.name/css-animation-callback
						function whichTransitionEvent(){
							var t,
							el = document.createElement("fakeelement");
							var transitions = {
								"transition"      : "transitionend",
								"OTransition"     : "oTransitionEnd",
								"MozTransition"   : "transitionend",
								"WebkitTransition": "webkitTransitionEnd"
							}
							for (t in transitions){
								if (el.style[t] !== undefined){
									return transitions[t];
								}
							}
						}
						obj.transitionEvent = whichTransitionEvent();

						//since CSS animation and JS timing of 1 second differs, we trigger next loop of JS after a trigger element's transition is complete
						obj.trigger.on(obj.transitionEvent,function(event) {
							// Do something when the transition ends
							clearTimeout(obj.timer);
							obj.timer = setTimeout(function(){
								functions.general.doCounter();
								if(obj.trigger.hasClass('flipclock__trigger--active')){
									obj.trigger.removeClass('flipclock__trigger--active');
								}
								else {
									obj.trigger.addClass('flipclock__trigger--active');
								}
							},0);
						});
					},

					//called continually to update the display
					doCounter: function(){
						functions.general.getTimeNowTarget();
						var ok = 0;

						for(var u = obj.units.length - 1; u >= 0 ; u--){
							functions.general.updateDigit(obj.units[u]);
							//show or hide the digit if it is zero and it was last time, unless it's seconds, in which case we always show it
							if(ok){ //fixme should be better way of structuring this
								functions.markup.showDigit(obj.units[u]);
							}
							else {
								if(obj.time[obj.units[u]] === 0 && obj.prevtime[obj.units[u]] === 0 && obj.units[u] !== 'second'){
									functions.markup.hideDigit(obj.units[u]);
								}
								else {
									ok = 1;
									functions.markup.showDigit(obj.units[u]);
								}
							}
						}
						functions.general.backupTime();
					},

					//update the contents of a single time unit
					updateDigit: function(key){
						var unit = key;
						var digit = parseInt(obj.time[key]);
						if(digit != 1){
							unit = unit + 's'; //add the s back on
						}
						var prevdigit = obj.prevtime[key];
						digit = functions.general.padDigits(digit, 2)
						prevdigit = functions.general.padDigits(prevdigit, 2)

						var wrapper = obj.$elem.find('.flipclock__unit[data-name=' + key + ']'); //find the relevant element and set it up
						var digits = wrapper.find('.flipclock__digits').attr('data-next',digit).attr('data-now',prevdigit);

						digits.find('.flipclock__digits-next').remove();
						digits.find('.flipclock__digits-prev').remove();
						$('<div/>').addClass('flipclock__digits-next').html(digit).appendTo(digits);
						$('<div/>').addClass('flipclock__digits-prev').html(prevdigit).appendTo(digits);

						digits.find('.number').html(digit);

						if(obj.settings.showUnits){
							wrapper.find('.flipclock__units').html(unit);
						}

						if(obj.time[key] !== obj.prevtime[key]){ //only animate if changed
							digits.attr('class','flipclock__digits flipclock__digits--animate'); //in theory this is quicker than addClass
						}
						else {
							digits.attr('class','flipclock__digits');
						}
					},

					//store time for comparison next time round, since it's an object can't do a direct copy
					backupTime: function(){
						for(var y in obj.time){
							obj.prevtime[y] = obj.time[y];
						}
					},
					//set the time back to zero, needed to handle when we reach zero for numbers
					resetTime: function(){
						obj.time = {'year':0,'month':0,'day':0,'hour':0,'minute':0,'second':0};
					},

					//get the number of digits in a number
					getNumberStrLen: function(num){
						var len = '' + num;
						return(len.length);
					},

					//http://stackoverflow.com/questions/10073699/pad-a-number-with-leading-zeros-in-javascript
					padDigits: function(number, digits) {
						return Array(Math.max(digits - String(number).length + 1, 0)).join(0) + number;
					},
				},
				markup: {
					//create the chunk of markup necessary to hold a digit
					generateDigit: function(number,attr){
						var unit = $('<div/>').attr('data-name',attr).addClass('flipclock__unit');
						var digit = $('<div/>').addClass('flipclock__digit').appendTo(unit);
						var digits = $('<div/>').addClass('flipclock__digits').attr('data-now',number).appendTo(digit);
						$('<span/>').addClass('number').html(number).appendTo(digits);
						if(obj.settings.showUnits){
							$('<div/>').addClass('flipclock__units').html(attr).appendTo(unit);
						}
						unit.appendTo(obj.$elem);
					},
					//show a particular time unit
					showDigit: function(key){
						obj.$elem.find('.flipclock__unit[data-name=' + key + ']').addClass('flipclock__unit--visible');
					},

					//hide a particular time unit
					hideDigit: function(key){
						if(!obj.settings.showAllDigits){
							obj.$elem.find('.flipclock__unit[data-name=' + key + ']').removeClass('flipclock__unit--visible');
						}
					},
				},
			};

			$(window).on('load',function(){
				functions.general.overrideSettings();
				functions.general.initElements();
			});
		}
	};
	$.fn.flipclock = function(options){
		return this.each(function(){
			new Plugin(this,options).init();
		});
	};
	window.Plugin = Plugin;
})(window,jQuery);
