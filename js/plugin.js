/*
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
			obj.currNum;
            obj.units = ['second','minute','hour','day','month','year'];
            obj.time = {'year':'00','month':'00','day':'00','hour':'00','minute':'00','second':'00'};
			obj.prevtime = {'year':'00','month':'00','day':'00','hour':'00','minute':'00','second':'00'};
			obj.timelimits = {'year':10000,'month':11,'day':366,'hour':23,'minute':59,'second':59};
			obj.timer = 0;
			obj.trigger = 0;
			obj.countdown = 0; //if true means we are counting down

			this.settings = $.extend({
				mode: 'counter', //determines the behaviour of the flipclock: counter simply counts the time since/til targetDate
				startNum: 0,
				endNum: 100,
				speed: 1000,
				showUnits: true, //controls display name of units beneath digits
				showAllDigits: false, //if true, show all digits regardless, if false, only show from the 1st digit that is 1 or higher
				targetDate: [2014,1,1,0,0,0,0],
			}, this.defaults, this.options);

			var functions = {
                general: {
					//do initial settings setup and prevent settings abuse
                    overrideSettings: function(){
						var d = obj.settings.targetDate;
						obj.settings.targetDate = new Date(d[0],d[1] - 1,d[2],d[3],d[4],d[5]); //second parameter, month, is zero indexed, so we have to subtract 1 to get the right month
						obj.currNum = obj.settings.startNum; //fixme
						if(obj.settings.targetDate.length < 6){

						}
                    },
                    //insert all required markup
					initElements: function(){
						obj.$elem.html('').addClass('timewrap');

						if(obj.settings.mode == 'clock'){
							//cheat a bit - set the targetDate to an arbitrary midnight, then only show the hours, minutes and seconds
							obj.settings.targetDate = [2000,1,1,0,0,0,0];
							var date = new Date;
							obj.time.second = date.getSeconds();
							obj.time.minute = date.getMinutes();
							obj.time.hour = date.getHours();
	
							for(var i = obj.units.length - 1; i > -1; i--){
								if(obj.time[obj.units[i]] !== '00'){
									functions.markup.generateDigit(functions.general.padDigits(obj.time[obj.units[i]], 2),obj.units[i]);
								}
							}
						}
						else {
							var output = functions.general.getTimeNowTarget();
							//create all the digits as blank to start with, unless we find any that match from output
							for(var i = obj.units.length - 1; i >= 0; i--){
								var ind = output.indexOf(obj.units[i] + 's');
								if(ind !== -1){
									functions.markup.generateDigit(functions.general.padDigits(output[ind - 1], 2),obj.units[i]);
								}
								else {
									functions.markup.generateDigit('00',obj.units[i]);
								}
							}
						}
						//create the timekeeping element
						obj.trigger = $('<div/>').addClass('trigger').attr('data-id','trigger');
						obj.trigger.appendTo(obj.$elem);
						//start the counter
						functions.general.initCounter();

						if(obj.settings.showAllDigits){
							obj.$elem.find('.timeunit').addClass('shown'); //show all time elements
						}
					},

					//get the difference between the time now and the time target
					getTimeNowTarget: function(){
			            var now = Date.now();
			            if(now < obj.settings.targetDate){
							obj.countdown = 1;
						}
						else {
							obj.countdown = 0;
						}
			            var output = moment.preciseDiff(now, obj.settings.targetDate);
			            //console.log(now,obj.settings.targetDate,output);
			            return(output.split(" "));
					},

					//set up the counter element and its CSS transition trigger to call the time update
					initCounter: function(){
					    var wait = 1;
					    //in theory if we start on an exact second the js should be in sync with the css animation. In theory.
					    setTimeout(function(){
						    while(wait){
						        if(Date.now() % 1000 === 0){
						            wait = 0;
						            obj.trigger.addClass('active');
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

					    //since CSS animation and JS timing of 1 second seems to differ, we trigger the next loop of the JS after a trigger element's transition is complete
					    //$('.trigger').on(transitionEvent,function(event) {
						obj.trigger.on(obj.transitionEvent,function(event) {
					        // Do something when the transition ends
					        clearTimeout(obj.timer);
					        obj.timer = setTimeout(function(){
					            functions.general.doCounter();
					            if(obj.trigger.hasClass('active')){
					                obj.trigger.removeClass('active');
					            }
					            else {
					                obj.trigger.addClass('active');
					            }
					        },0);
					    });
					},

					doCounter: function(){
			            functions.general.resetTime();
			            var output = functions.general.getTimeNowTarget();

		                if(output.length > 1){
				            for(var i = 0; i < output.length; i += 2){
				                var num = output[i];
				                var unit = output[i + 1];
				                if(unit[unit.length - 1] == 's'){ //moment's output can vary e.g. 'seconds' or 'second', to match the array keys in time we need to trim this
				                    unit = unit.substring(0, unit.length - 1);
				                }
				                //console.log(unit,obj.time[unit],num);
				                obj.time[unit] = num; //this only happens if moment returns a value for this digit type, which it doesn't do if it's 0
				            }
						}
						else {
							console.log('um');
							//fixme need a condition here for outputting all zeroes - this is the moment a countdown becomes a countup. Maybe a flag to halt as well?
						}
			            var ok = 0;

			            for(var key in obj.time){
			                if(obj.time[key] != '00' || ok){ //fixme this is supposed to only flag once then allow continuation through the digits, but it doesn't work
			                    ok = 1;
			                    var unit = key;
			                    var digit = parseInt(obj.time[key]);
			                    if(digit != 1){
			                        unit = unit + 's'; //add the s back on
			                    }

			                    var prevdigit = digit - 1; //get the next digit, for the animation
			                    if(obj.countdown){
									prevdigit = digit + 1;
				                    if(prevdigit > obj.timelimits[key]){
										prevdigit = 0;
									}
								}
								else {
				                    if(prevdigit < 0){
				                        prevdigit = obj.timelimits[key];
				                    }
								}
			                    if(digit < 0){
			                        digit = obj.timelimits[key];
			                    }
			                    digit = functions.general.padDigits(digit, 2)
			                    prevdigit = functions.general.padDigits(prevdigit, 2)

			                    var wrapper = obj.$elem.find('.timeunit[data-name=' + key + ']').attr('class','timeunit shown');//find the relevant element and set it up
			                    var digits = wrapper.find('.digits').attr('data-next',digit).attr('data-now',prevdigit);

			                    digits.find('.next').remove();
			                    digits.find('.prev').remove();

			                    $('<div/>').addClass('next').html(digit).appendTo(digits);
			                    $('<div/>').addClass('prev').html(prevdigit).appendTo(digits);
			                    digits.find('.number').html(digit);
			                    if(obj.settings.showUnits){
				                    wrapper.find('.units').html(unit);
								}

			                    if(obj.time[key] != obj.prevtime[key] || (digit == '00' && key == 'seconds')){ //only animate if changed or unit is 0 and seconds. Otherwise at 0 just animates forever
			                        digits.attr('class','digits animate'); //in theory this is quicker than addClass
			                    }
			                    else {
			                        digits.attr('class','digits');
			                    }
			                }
			            }
			            functions.general.backupTime();
					},
					
			        //store time for comparison next time round, since it's an object can't do a direct copy
			        backupTime: function(){
			            for(var y in obj.time){
			                obj.prevtime[y] = obj.time[y];
			            }
			        },
			        //set the time back to zero
			        resetTime: function(){
			            obj.time = {'year':'00','month':'00','day':'00','hour':'00','minute':'00','second':'00'};
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
						var unit = $('<div/>').attr('data-name',attr).addClass('timeunit');
						var digit = $('<div/>').addClass('digit').appendTo(unit);
						var digits = $('<div/>').addClass('digits').attr('data-now',number).appendTo(digit);
						$('<span/>').addClass('number').html(number).appendTo(digits);
						if(obj.settings.showUnits){
							$('<div/>').addClass('units').html(attr).appendTo(unit);
						}
						unit.appendTo(obj.$elem);
					}
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