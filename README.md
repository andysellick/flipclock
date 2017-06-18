Flipclock
=========

A plugin to create an old fashioned 'flip' clock or countdown.

Usage
-----

```html
<div id="example"></div>

<script src="js/vendor/jquery-1.10.2.min.js"></script>
<script src="js/vendor/moment.min.js"></script>
<script src="js/vendor/readable-range.js"></script>
<script src="js/jquery.flipclock.js"></script>

<script>
  $(document).ready(function(){
    $('#example').flipclock();
  });
</script>
```

Options
-------

- **mode**: 'clock' or 'counter'. Clock mode shows the current time. Counter mode shows the number of years, months, days, hours, minutes and seconds until the specified time.
- **targetDate**: array containing numbers representing year, month, day, hour, minute, second e.g. [2016,3,15,13,45,23] translates to 13:45:23 on the 15th of March 2016. Ignored in clock mode.
- **showUnits**: set to true or false, defaults to true. Shows the type of unit beneath each digit of the clock.
- **showAllDigits**: set to true or false, defaults to false. If false, only shows digits from the first non-zero digit. Ignored in clock mode.
- **stopAtZero**: set to true or false, defaults to false. In counter mode, if targetDate is in the future, if this is set to true when it reaches that time the clock will stop. Otherwise it will begin counting upwards again. Ignored in clock mode.
- **timeZoneOffset**: used to set timezone for more accurate timings, e.g. set to 0 for GMT, then clock/countdown/countup will be relative to GMT, not the timezone on the computer currently viewing the flipclock. Defaults to -1 (off) so times will be shown relative to current computer timezone.

With no options set, flipclock will display the time since the start of the year 2000 according to the current device's timezone.