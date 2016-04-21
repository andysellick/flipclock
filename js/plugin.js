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
			//obj.modes = ['clock','counter'];
			obj.currNum;
            obj.units = ['second','minute','hour','day','month','year'];
            obj.time = {'year':'00','month':'00','day':'00','hour':'00','minute':'00','second':'00'};
			obj.prevtime = {'year':'00','month':'00','day':'00','hour':'00','minute':'00','second':'00'};
			obj.timelimits = {'year':10000,'month':11,'day':366,'hour':23,'minute':59,'second':59};
			obj.timer = 0;
			obj.trigger = 0;
			obj.countdown = 0; //if true means we are counting down

			this.settings = $.extend({
				mode: 'countup', //determines the behaviour of the flipclock
				startNum: 0,
				endNum: 100,
				speed: 1000,
				targetDate: [2014,1,1,0,0,0,0],//new Date("Jan 1 00:00:00 +0000 2014"),
				//mostUnit: 'year', //highest unit to display, e.g. if set to 'hour' will only show seconds, minutes and hours
			}, this.defaults, this.options);

			var functions = {
                general: {
					//do initial settings setup and prevent settings abuse
                    overrideSettings: function(){
                    	//limit time units shown
                    	/*
                    	var showUnits = obj.units.indexOf(obj.settings.mostUnit);
                    	if(showUnits !== -1){
							obj.units = obj.units.slice(0,showUnits + 1);
						}
						*/
						var d = obj.settings.targetDate;
						obj.settings.targetDate = new Date(d[0],d[1] - 1,d[2],d[3],d[4],d[5]); //second parameter, month, is zero indexed, so we have to subtract 1 to get the right month
						obj.currNum = obj.settings.startNum; //fixme
                    },
                    //insert all required markup
					initElements: function(){
						obj.$elem.html('').addClass('timewrap');

						//create the time digits
						if(obj.settings.mode == 'clock'){
							for(var i = obj.units.length - 1; i > -1; i--){
								functions.markup.generateDigit(0,obj.units[i]);
							}
						}
						else { // if(obj.settings.mode == 'counter'){
							//var len = functions.general.getNumberStrLen(obj.settings.endNum); //get the number of chars in the highest number FIXME
							var output = functions.general.getTimeNowTarget();

							var len = output.length;
							for(var i = 0; i < len; i += 2){
								functions.markup.generateDigit(functions.general.padDigits(output[i], 2),output[i+1]);
							}
							//create the timekeeping element
							obj.trigger = $('<div/>').addClass('trigger').attr('data-id','trigger');
							obj.trigger.appendTo(obj.$elem);
							//start the counter
							functions.general.doCounter();
							functions.general.initCounter();
						}

						obj.$elem.find('.timeunit').addClass('shown'); //show time elements
					},

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
				                obj.time[unit] = num; //this only happens if moment returns a value for this digit type, which it doesn't do if it's 0
				            }
						}
						else {
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

			                    var wrapper = obj.$elem.find('.timeunit[data-name=' + key + 's]').attr('class','timeunit shown');//find the relevant element and set it up
			                    var digits = wrapper.find('.digits').attr('data-next',digit).attr('data-now',prevdigit);

			                    digits.find('.next').remove();
			                    digits.find('.prev').remove();
		                    
			                    $('<div/>').addClass('next').html(digit).appendTo(digits);
			                    $('<div/>').addClass('prev').html(prevdigit).appendTo(digits);
			                    digits.find('.number').html(digit);
			                    wrapper.find('.units').html(unit);

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

					changeNumbers: function(){
						//take current number
						var currNum = obj.currNum;
						//determine length and pad with zeroes if needed
						var currNumLen = functions.general.getNumberStrLen(currNum);
						var targLen = functions.general.getNumberStrLen(Math.max(obj.settings.startNum,obj.settings.endNum));
						currNum = functions.general.padDigits(currNum,targLen);
						//loop through digits on page and insert from string accordingly
						var i = 0;
						obj.$elem.find('.digit').each(function(){
							var digits = $(this).find('.digits');
							var numel = $(this).find('.number');
							var prevdigit = parseInt(numel.html()); //store previous digit
							//var prevdigit = parseInt(digits.attr('data-now')); //store previous digit
							numel.html(currNum[i]);
							digits.attr('data-next',currNum[i]).attr('data-now',prevdigit).removeClass('animate').focus();
							//insert elements used for flip animation
		                    digits.find('.next').remove();
		                    digits.find('.prev').remove();
		                    $('<div/>').addClass('next').html(currNum[i]).appendTo(digits);
		                    $('<div/>').addClass('prev').html(prevdigit).appendTo(digits);

		                    if(prevdigit != parseInt(currNum[i])){ //only animate if num changed or unit is 0 and seconds. Otherwise at 0 on minutes etc. just animates forever
		                        digits.attr('class','digits animate'); //in theory this is quicker than addClass
		                    }
		                    else {
		                        digits.attr('class','digits');
		                    }
							i++;
						});
					},
					//http://stackoverflow.com/questions/10073699/pad-a-number-with-leading-zeros-in-javascript
					padDigits: function(number, digits) {
						return Array(Math.max(digits - String(number).length + 1, 0)).join(0) + number;
					},

                    resizeWindow: function(){
                    },
                },
                markup: {
					//create the chunk of markup necessary to hold a digit
					generateDigit: function(number,attr){
						var unit = $('<div/>').attr('data-name',attr).addClass('timeunit');
						var digit = $('<div/>').addClass('digit').appendTo(unit);
						var digits = $('<div/>').addClass('digits').attr('data-now',number).appendTo(digit);
						$('<span/>').addClass('number').html(number).appendTo(digits);
						$('<div/>').addClass('units').html(attr).appendTo(unit);
						unit.appendTo(obj.$elem);
					}
				},
				events: {
					initClicks: function(){
						$('#increment').on('click',function(){
							obj.currNum = Math.min(obj.currNum + 1,obj.settings.endNum);
							functions.general.changeNumbers();
						});
						$('#decrement').on('click',function(){
							obj.currNum = Math.max(obj.currNum - 1,obj.settings.startNum);
							functions.general.changeNumbers();
						});
					}
				},
            };

            $(window).on('load',function(){
                functions.general.overrideSettings();
                functions.general.initElements();
                functions.events.initClicks();
            });

            var resize;
        	$(window).on('resize',function(){
                //don't resize immediately
                clearTimeout(resize);
                resize = setTimeout(functions.general.resizeWindow,200);
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