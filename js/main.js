/*
	Objective

	Clock
	- count up
	- count down
		- define units 
			e.g. full year, month, day, hour, minute, second
			or just one or two of those
	- actual clock
		- just hours, minutes, seconds

	General flip
	- count up
	- count down
		- single number or set of numbers e.g. pounds and pence

	as plugin, ideally
*/


//timestamp shim for cross browser compatibility
if(!Date.now){
    Date.now = function() { return new Date().getTime(); }
}

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
var transitionEvent = whichTransitionEvent();


//global variables
var orig = new Date("Jan 1 00:00:00 +0000 2014"); //fixme this is out by an hour FOR SMALL NUMBERS ONLY e.g. set to 10am and view at 11:15, difference is 15 mins, not an hour 15 - but from start of year timing is accurate
var $time = $('#time');
var time = {'year':'00','month':'00','day':'00','hour':'00','minute':'00','second':'00'};
var prevtime = {'year':'00','month':'00','day':'00','hour':'00','minute':'00','second':'00'};
var limits = {'year':10000,'month':11,'day':366,'hour':23,'minute':59,'second':59};
var currentscale = 0;
var timer;

//other, education, job, first, travel, fun

(function( window, undefined ) {
var lenny = {
    $tl: 0, //the timeline element
    tllength: 0,
    tlmarginleft: 0,
    tloffset: 0,
    tlitemcount: 0,
    tlselected: 0,

    general: {
        //store time for comparison next time round, since it's an object can't do a direct copy
        backupTime: function(){
            for(var y in time){
                prevtime[y] = time[y];
            }
        },
        //set all the values back to zero
        resetTime: function(){
            time = {'year':'00','month':'00','day':'00','hour':'00','minute':'00','second':'00'};
        },
        //do the clock
        showDiff: function(){
            lenny.general.resetTime();
            var now = Date.now();
            var output = moment.preciseDiff(now, orig);
            output = output.split(" ");
        
            for(var i = 0; i < output.length; i += 2){
                var num = output[i];
                var unit = output[i + 1];
                if(unit[unit.length - 1] == 's'){ //moment's output can vary e.g. 'seconds' or 'second', to match the array keys in time we need to trim this
                    unit = unit.substring(0, unit.length - 1);
                }
                time[unit] = num; //this only happens if moment returns a value for this digit type, which it doesn't do if it's 0
            }
            var ok = 0;

            for(var key in time){
                if(time[key] != '00' || ok){
                    ok = 1;
                    var unit = key;
                    var digit = parseInt(time[key]);
                    if(digit != 1){
                        unit = unit + 's'; //add the s back on
                    }
                    //prev digit might be invalid, need to roll back to zero
                    var prevdigit = digit - 1; //get the next digit, for the animation
                    if(prevdigit < 0){
                        prevdigit = limits[key];
                    }
                    if(prevdigit < 10){
                        prevdigit = '0' + prevdigit;
                    }
                    if(digit < 10){
                        digit = '0' + digit;
                    }
        
                    var wrapper = $time.find('.timeunit[data-name=' + key + ']').attr('class','timeunit shown');//find the relevant element and set it up
                    var digits = wrapper.find('.digits').attr('data-next',digit).attr('data-now',prevdigit);
        
                    digits.find('.next').remove();
                    digits.find('.prev').remove();
        
                    $('<div/>').addClass('next').html(digit).appendTo(digits);
                    $('<div/>').addClass('prev').html(prevdigit).appendTo(digits);
        
                    digits.find('.number').html(digit);
                    wrapper.find('.units').html(unit);

                    if(time[key] != prevtime[key] || (digit == '00' && key == 'seconds')){ //only animate if num changed or unit is 0 and seconds. Otherwise at 0 on minutes etc. just animates forever
                        digits.attr('class','digits animate'); //in theory this is quicker than addClass
                    }
                    else {
                        digits.attr('class','digits');
                    }
                }
            }
            lenny.general.backupTime();
        }
    }
};
window.lenny = lenny;
})(window);


$(function() {
    /*
    var currentdate = new Date();
    var datetime = "Now: " + currentdate.getDate() + "/"
                + (currentdate.getMonth()+1)  + "/"
                + currentdate.getFullYear() + " @ "
                + currentdate.getHours() + ":"
                + currentdate.getMinutes() + ":"
                + currentdate.getSeconds();
    console.log(datetime);
    */

    var wait = 1;
    //in theory if we start on an exact second the js should be in sync with the css animation. In theory.
    while(wait){
        if(Date.now() % 1000 === 0){
            wait = 0;
            $('#trigger').addClass('active');
        }
    }

    //since CSS animation and JS timing of 1 second seems to differ, we trigger the next loop of the JS after a trigger element's transition is complete
    $('.trigger').on(transitionEvent,function(event) {
        // Do something when the transition ends
        clearTimeout(timer);
        timer = setTimeout(function(){
            lenny.general.showDiff();
            if($('#trigger').hasClass('active')){
                $('#trigger').removeClass('active');
            }
            else {
                $('#trigger').addClass('active');
            }
        },0);
    });
    

});
