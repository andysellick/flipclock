/*
*/
(function (window,$) {
	var Plugin = function(elem,options){
		this.elem = elem;
		this.$elem = $(elem);
		this.options = options
	}

	Plugin.prototype = {
		init: function(){
			var thisobj = this;
            this.canvas;

			this.settings = $.extend({
				weatherType: "rain",
			}, this.defaults, this.options);

			var functions = {
                general: {
                    overrideSettings: function(){ //prevent settings abuse
                    },
                    resizeWindow: function(){
                    },
                }
            }

            $(window).on('load',function(){
                functions.general.overrideSettings();
            });

            var resize;
        	$(window).on('resize',function(){
                //don't resize immediately
                clearTimeout(resize);
                resize = setTimeout(functions.general.resizeWindow,200);
        	});
		}
	}
	$.fn.flipclock = function(options){
		return this.each(function(){
			new Plugin(this,options).init();
		});
	}
	window.Plugin = Plugin;
})(window,jQuery);