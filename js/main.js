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
    },
    timeline: {
        //initialises a couple of variables that are useful for mobile/desktop
        setup: function(){
            lenny.$tl = $('#timelinecontent');
            lenny.tlmarginleft = parseInt(lenny.$tl.css('margin-left'));
        },
        //initialises a couple of variables that are useful for mobile/desktop
        resize: function(){
            lenny.tlmarginleft = parseInt(lenny.$tl.css('margin-left'));
            lenny.tloffset = Math.abs(parseInt(lenny.$tl.find('.tlitem').css('margin-left')));
            lenny.tlselected = lenny.tlitemcount;
        },
        //do the timeline
        createTimeline: function(){
            var origin = Date.parse(orig);
            lenny.tllength = Date.now() - origin; //base the length of the timeline on the time difference
            lenny.tllength = lenny.timeline.rescaleTimeline(lenny.tllength);
            lenny.timeline.setTimeLinePos(lenny.tllength - ($(window).outerWidth() / 1.5) + lenny.tlmarginleft); //timeline has a margin left of 500px, need to include this
            lenny.$tl.css('width', lenny.tllength + 'px');

            $.ajax({
                url:'data/'
            }).done(function(data){
                data = $.parseJSON(data);

                for(var i = 0; i < data.length; i++){
                    var date = new Date(data[i]['date']);
                    var pos = Date.parse(date) - origin;
                    pos = lenny.timeline.rescaleTimeline(pos);
                    pos = (pos / lenny.tllength) * 100;
                    if(pos <= 100){ //only show items from the past
                        var humandate = data[i]['date'];
                        humandate = humandate.split(' ');
                        humandate = humandate[0] + ' ' + humandate[1] + ', ' + humandate[4];
                        var classification = data[i]['type']
                        var html = '<div class="date">' + humandate + '</div><div class="content"><h2>' + data[i]['title'] + '</h2>' + data[i]['content'] + '</div>';
                        $('<div/>').addClass('tlitem type-' + classification).css('left',pos + '%').html(html).appendTo(lenny.$tl);
                    }
                }
                lenny.tlitemcount = lenny.$tl.find('.tlitem').length;
                lenny.tlselected = lenny.tlitemcount;

                lenny.timeline.resize();
            });

/*
            for(var i = 0; i < timeline.length; i++){
                var date = new Date(timeline[i]['date']);
                var pos = Date.parse(date) - origin;
                pos = lenny.timeline.rescaleTimeline(pos);
                pos = (pos / lenny.tllength) * 100;
                if(pos <= 100){ //only show items from the past
                    var humandate = timeline[i]['date'];
                    humandate = humandate.split(' ');
                    humandate = humandate[0] + ' ' + humandate[1] + ', ' + humandate[4];
                    var classification = timeline[i]['type']
                    var html = '<div class="date">' + humandate + '</div><div class="content"><h2>' + timeline[i]['title'] + '</h2>' + timeline[i]['content'] + '</div>';
                    $('<div/>').addClass('tlitem type-' + classification).css('left',pos + '%').html(html).appendTo(lenny.$tl);
                }
            }
*/
        },
        setTimeLinePos: function(position){
            //this code positions the 'view' to the far right of the timeline
            //due to a quirk of how the plugin works, this only works on elements that are floated left. It won't work on absolutely positioned elements or elements with an offset using a margin
            //SO! to position the viewport we have two DIVs in the markup with zero height and floated left. The first is given the width of how far along the view we want to start at,
            //and the second is the startAtElementId element used to initialise the plugin below. A bit hacky but it's the only way I can get it to work and still allow the user to scroll back in time
            $('#buffer').css('width',position);
        },
        //adjusts numbers to provide a more sensible scale for the timeline
        rescaleTimeline: function(num){
            return(Math.floor((num / 10000000) / 2));
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
    
    lenny.timeline.setup();
    lenny.timeline.createTimeline();

    //initiate smooth scroller plugin for mouse/touch
    $("#timeline").smoothTouchScroll({
        startAtElementId:'starthere'
    });

    $('html').on('click',function(){
        $('.tlitem').removeClass('active');
        lenny.$tl.css('margin-bottom','100px'); //slightly cheating trick to get around the need for overflow:hidden on the timeline
    });

    //$('.tlitem').on('click',function(e){
    $("#timeline").on('click','.tlitem',function(e){
        e.stopPropagation();
        $('.tlitem').removeClass('active');
        $(this).addClass('active');
        lenny.tlselected = $(this).index();
        var h = $(this).find('.content').outerHeight() + 20; //slightly cheating trick to get around the need for overflow:hidden on the timeline
        lenny.$tl.css('margin-bottom',h);
        $('html,body').animate({
            scrollTop: $('#time').outerHeight() - 60
        }, 500);
    });

    //take the timeline right back to the beginning
    $('#resetstart').on('click',function(e){
        e.preventDefault();
        e.stopPropagation();
        var thisone = lenny.$tl.find('.tlitem').first();
        thisone.trigger('click');
        var pos = thisone.position();
        pos = pos.left - lenny.tloffset + lenny.tlmarginleft;
        lenny.timeline.setTimeLinePos(pos);
        $("#timeline").smoothTouchScroll();
    });

    //send the timeline right to the end
    $('#resetnow').on('click',function(e){
        e.preventDefault();
        e.stopPropagation();
        var thisone = lenny.$tl.find('.tlitem').last();
        thisone.trigger('click');
        lenny.tlselected = lenny.tlitemcount;
        var pos = thisone.position();
        pos = pos.left - lenny.tloffset + lenny.tlmarginleft;
        lenny.timeline.setTimeLinePos(pos);
        $("#timeline").smoothTouchScroll();
    });

    //listener using plugin to check if timeline has been moved, if it has, reset the currently selected item
    $('.scrollWrapper').attrchange({
    	callback: function(e) {
    	    if(!lenny.$tl.find('.tlitem.active').length){
                lenny.tlselected = -1;
            }
    	}
    });    

    //open the previous item. Wow this got complicated
    $('#prev').on('click',function(e){
        e.preventDefault();
        e.stopPropagation();
        if(lenny.tlselected != 0){
            var compareto = $("#timeline").offset();
            compareto = compareto.left;
    
            //if one is already open, open the previous one
            //else if the timeline has been moved, open the previous one that is just off the screen
            //else (if the timeline hasn't moved, we must be at the end, so open the last one)
            var thisone = lenny.$tl.find('.tlitem.active');
            if(thisone.length && thisone.index() > 0){
                thisone = thisone.prev();
            }
            else if(lenny.tlselected != -1){
                thisone = lenny.$tl.find('.tlitem').eq(lenny.tlselected - 1);
            }
            else {
                lenny.$tl.find('.tlitem').each(function(){
                    var thispos = $(this).offset();
                    if(thispos.left >= compareto){
                        if($(this).is(':first-child')){
                            thisone = $(this);
                        }
                        else {
                            thisone = $(this).prev();
                        }
                        return false;
                    }
                });
                if(!thisone.length){
                    thisone = lenny.$tl.find('.tlitem').last();
                }
            }
            if(thisone.length){
                var pos = thisone.offset();
                if(pos.left < compareto){
                    pos = thisone.position();
                    pos = pos.left - lenny.tloffset + lenny.tlmarginleft; //timeline has a margin left of 500px, need to include this
                    lenny.timeline.setTimeLinePos(pos);
                }
                $("#timeline").smoothTouchScroll();
                thisone.trigger('click');
            }
        }
    });

    //open the next item
    $('#next').on('click',function(e){
        e.preventDefault();
        e.stopPropagation();
        if(lenny.tlselected <= lenny.tlitemcount){
            var compareto = $("#timeline").offset();
            compareto = compareto.left + $('#timeline').outerWidth();
    
            var thisone = lenny.$tl.find('.tlitem.active');
            if(thisone.length && thisone.index() < lenny.tlitemcount){
                thisone = thisone.next();
            }
            else if(lenny.tlselected != -1){
                thisone = lenny.$tl.find('.tlitem').eq(lenny.tlselected);
            }
            else {
                lenny.$tl.find('.tlitem').each(function(){
                    var thispos = $(this).offset();
                    if(thispos.left > compareto){
                        thisone = $(this);
                        return false;
                    }
                });
                if(!thisone.length){
                    thisone = lenny.$tl.find('.tlitem').last();
                }
            }
            if(thisone.length){
                var pos = thisone.offset();
                if(pos.left + thisone.outerWidth() > compareto){ //fixme this needs to be a more thorough check for mobile at 320px
                    pos = thisone.position();
                    pos = pos.left - lenny.tloffset + lenny.tlmarginleft; //timeline has a margin left of 500px, need to include this
                    pos = pos - ($('#timeline').outerWidth() - thisone.outerWidth());
                    lenny.timeline.setTimeLinePos(pos);
                }
                $("#timeline").smoothTouchScroll();
                thisone.trigger('click');
            }
        }
    });

    var resize;

    //if the screen is resized basically reset the timeline
    $(window).on('resize',function(){
        clearTimeout(resize); //don't resize immediately
        resize = setTimeout(function(){
            lenny.timeline.resize();
            lenny.timeline.setTimeLinePos(lenny.tllength - ($(window).outerWidth() / 1.5) + lenny.tlmarginleft); //timeline has a margin left of 500px, need to include this
            $("#timeline").smoothTouchScroll();
        },500);
    });

});
