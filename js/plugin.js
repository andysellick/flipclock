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
			obj.modes = ['clock','countdown','countup','flipup','flipdown'];
			obj.currNum;
            obj.units = ['second','minute','hour','day','month','year'];

			this.settings = $.extend({
				mode: 'countup', //determines the behaviour of the flipclock
				startNum: 0,
				endNum: 100,
				speed: 1000,
				mostUnit: 'day', //highest unit to display, e.g. if set to 'hour' will only show seconds, minutes and hours
			}, this.defaults, this.options);

			var functions = {
                general: {
					//do initial settings setup and prevent settings abuse
                    overrideSettings: function(){
						//set mode
						if(obj.modes.indexOf(obj.settings.mode) == -1){
							obj.settings.mode = obj.modes[0]; //default mode to 'clock'
						}
                    	//limit time units shown
                    	var showUnits = obj.units.indexOf(obj.settings.mostUnit);
                    	if(showUnits !== -1){
							obj.units = obj.units.slice(0,showUnits + 1);
						}
						obj.currNum = obj.settings.startNum; //fixme
                    },
                    //insert all required markup
					initElements: function(){
						obj.$elem.html('').addClass('timewrap');

						//create the time digits
						if(obj.settings.mode == 'clock'){
							for(var i = obj.units.length - 1; i > -1; i--){
								functions.markup.generateDigit(obj.units[i],0);
							}
						}
						else if(obj.settings.mode == 'countup'){
							var len = functions.general.getNumberStrLen(obj.settings.endNum); //get the number of chars in the highest number
							for(var i = 0; i < len; i++){
								functions.markup.generateDigit(0);
							}
						}
						//create the timekeeping element
						$('<div/>').addClass('trigger').attr('id','trigger').appendTo(obj.$elem);

						//do more stuff here

						//show time elements
						obj.$elem.find('.timeunit').addClass('shown');
					},
					initNumbers: function(){
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
                markup: {
					//create the chunk of markup necessary to hold a digit
					generateDigit: function(number,attr){
						var unit = $('<div/>').attr('data-name',attr).addClass('timeunit');
						var digit = $('<div/>').addClass('digit').appendTo(unit);
						var digits = $('<div/>').addClass('digits').attr('data-now',number).appendTo(digit);
						$('<span/>').addClass('number').html(number).appendTo(digits);
						$('<div/>').addClass('units').appendTo(unit);
						unit.appendTo(obj.$elem);
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