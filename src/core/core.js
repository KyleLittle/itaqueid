(function () {
	var $D = Date,
		$P = $D.prototype,
		p = function (s, l) {
			if (!l) {
				l = 2;
			}
			return ("000" + s).slice(l * -1);
		};
	
	if (typeof window !== "undefined" && typeof window.console !== "undefined" && typeof window.console.log !== "undefined") {
		$D.console = console; // used only to raise non-critical errors if available
	} else {
		// set mock so we don't give errors.
		$D.console = {
			log: function(){},
			error: function(){}
		};
	}
	$D.Config = {};

	$D.initOverloads = function() {
		/** 
		 * Overload of Date.now. Allows an alternate call for Date.now where it returns the 
		 * current Date as an object rather than just milliseconds since the Unix Epoch.
		 *
		 * Also provides an implementation of now() for browsers (IE<9) that don't have it.
		 * 
		 * Backwards compatible so with work with either:
		 *  Date.now() [returns ms]
		 * or
		 *  Date.now(true) [returns Date]
		 */
		if (!$D.now) {
			$D._now = function now() {
				return new Date().getTime();
			};
		} else if (!$D._now) {
			$D._now = $D.now;
		}

		$D.now = function (returnObj) {
			if (returnObj) {
				return $D.present();
			} else {
				return $D._now();
			}
		};

		if ( !$P.toISOString ) {
			$P.toISOString = function() {
				return this.getUTCFullYear() +
				"-" + p(this.getUTCMonth() + 1) +
				"-" + p(this.getUTCDate()) +
				"T" + p(this.getUTCHours()) +
				":" + p(this.getUTCMinutes()) +
				":" + p(this.getUTCSeconds()) +
				"." + String( (this.getUTCMilliseconds()/1000).toFixed(3)).slice(2, 5) +
				"Z";
			};
		}
		
		// private
		if ( $P._toString === undefined ){
			$P._toString = $P.toString;
		}

	};
	$D.initOverloads();

	/**
	 * Resets the time of this Date object to 12:00 AM (00:00), which is the start of the day.
	 * @param {Boolean}  .clone() this date instance before clearing Time
	 * @return {Date}    this
	 */
	$P.clearTime = function () {
		this.setHours(0);
		this.setMinutes(0);
		this.setSeconds(0);
		this.setMilliseconds(0);
		return this;
	};

	/**
	 * Resets the time of this Date object to the current time ('now').
	 * @return {Date}    this
	 */
	$P.setTimeToNow = function () {
		var n = new Date();
		this.setHours(n.getHours());
		this.setMinutes(n.getMinutes());
		this.setSeconds(n.getSeconds());
		this.setMilliseconds(n.getMilliseconds());
		return this;
	};

	/** 
	 * Gets a date that is set to the current date. The time is set to the start of the day (00:00 or 12:00 AM).
	 * @return {Date}    The current date.
	 */
	$D.today = function () {
		return new Date().clearTime();
	};

	/** 
	 * Gets a date that is set to the current date and time (same as new Date, but chainable)
	 * @return {Date}    The current date.
	 */
	$D.present = function () {
		return new Date();
	};

	/**
	 * Compares the first date to the second date and returns an number indication of their relative values.  
	 * @param {Date}     First Date object to compare [Required].
	 * @param {Date}     Second Date object to compare to [Required].
	 * @return {Number}  -1 = date1 is lessthan date2. 0 = values are equal. 1 = date1 is greaterthan date2.
	 */
	$D.compare = function (date1, date2) {
		if (isNaN(date1) || isNaN(date2)) {
			throw new Error(date1 + " - " + date2);
		} else if (date1 instanceof Date && date2 instanceof Date) {
			return (date1 < date2) ? -1 : (date1 > date2) ? 1 : 0;
		} else {
			throw new TypeError(date1 + " - " + date2);
		}
	};
	
	/**
	 * Compares the first Date object to the second Date object and returns true if they are equal.  
	 * @param {Date}     First Date object to compare [Required]
	 * @param {Date}     Second Date object to compare to [Required]
	 * @return {Boolean} true if dates are equal. false if they are not equal.
	 */
	$D.equals = function (date1, date2) {
		return (date1.compareTo(date2) === 0);
	};

	/**
	 * Gets the language appropriate day name when given the day number(0-6)
	 * eg - 0 == Sunday
	 * @return {String}  The day name
	 */
	$D.getDayName = function (n) {
		return Date.CultureInfo.dayNames[n];
	};

	/**
	 * Gets the day number (0-6) if given a CultureInfo specific string which is a valid dayName, abbreviatedDayName or shortestDayName (two char).
	 * @param {String}   The name of the day (eg. "Monday, "Mon", "tuesday", "tue", "We", "we").
	 * @return {Number}  The day number
	 */
	$D.getDayNumberFromName = function (name) {
		var n = Date.CultureInfo.dayNames, m = Date.CultureInfo.abbreviatedDayNames, o = Date.CultureInfo.shortestDayNames, s = name.toLowerCase();
		for (var i = 0; i < n.length; i++) {
			if (n[i].toLowerCase() === s || m[i].toLowerCase() === s || o[i].toLowerCase() === s) {
				return i;
			}
		}
		return -1;
	};
	
	/**
	 * Gets the month number (0-11) if given a Culture Info specific string which is a valid monthName or abbreviatedMonthName.
	 * @param {String}   The name of the month (eg. "February, "Feb", "october", "oct").
	 * @return {Number}  The day number
	 */
	$D.getMonthNumberFromName = function (name) {
		var n = Date.CultureInfo.monthNames, m = Date.CultureInfo.abbreviatedMonthNames, s = name.toLowerCase();
		for (var i = 0; i < n.length; i++) {
			if (n[i].toLowerCase() === s || m[i].toLowerCase() === s) {
				return i;
			}
		}
		return -1;
	};

	/**
	 * Gets the language appropriate month name when given the month number(0-11)
	 * eg - 0 == January
	 * @return {String}  The month name
	 */
	$D.getMonthName = function (n) {
		return Date.CultureInfo.monthNames[n];
	};

	/**
	 * Determines if the current date instance is within a LeapYear.
	 * @param {Number}   The year.
	 * @return {Boolean} true if date is within a LeapYear, otherwise false.
	 */
	$D.isLeapYear = function (year) {
		return ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0);
	};

	/**
	 * Gets the number of days in the month, given a year and month value. Automatically corrects for LeapYear.
	 * @param {Number}   The year.
	 * @param {Number}   The month (0-11).
	 * @return {Number}  The number of days in the month.
	 */
	$D.getDaysInMonth = function (year, month) {
		if (!month && $D.validateMonth(year)) {
				month = year;
				year = Date.today().getFullYear();
		}
		return [31, ($D.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
	};
 
	$D.getTimezoneAbbreviation = function (offset, dst) {
		var p, n = (dst || false) ? Date.CultureInfo.abbreviatedTimeZoneDST : Date.CultureInfo.abbreviatedTimeZoneStandard;
		for (p in n) {
			if (n.hasOwnProperty(p)) {
				if (n[p] === offset) {
					return p;
				}
			}
		}
		return null;
	};
	
	$D.getTimezoneOffset = function (name, dst) {
		var i, a =[], z = Date.CultureInfo.timezones;
		if (!name) { name = (new Date()).getTimezone()}
		for (i = 0; i < z.length; i++) {
			if (z[i].name === name.toUpperCase()) {
				a.push(i);
			}
		}
		if (!z[a[0]]) {
			return null;
		}
		if (a.length === 1 || !dst) {
			return z[a[0]].offset;
		} else {
			for (i=0; i < a.length; i++) {
				if (z[a[i]].dst) {
					return z[a[i]].offset;
				}
			}
		}
	};

	$D.getQuarter = function (d) {
		d = d || new Date(); // If no date supplied, use today
		var q = [1,2,3,4];
		return q[Math.floor(d.getMonth() / 3)]; // ~~~ is a bitwise op. Faster than Math.floor
	};

	$D.getDaysLeftInQuarter = function (d) {
		d = d || new Date();
		var qEnd = new Date(d);
		qEnd.setMonth(qEnd.getMonth() + 3 - qEnd.getMonth() % 3, 0);
		return Math.floor((qEnd - d) / 8.64e7);
	};

	/**
	 * Returns a new Date object that is an exact date and time copy of the original instance.
	 * @return {Date}    A new Date instance
	 */
	$P.clone = function () {
		return new Date(this.getTime());
	};

	/**
	 * Compares this instance to a Date object and returns an number indication of their relative values.  
	 * @param {Date}     Date object to compare [Required]
	 * @return {Number}  -1 = this is lessthan date. 0 = values are equal. 1 = this is greaterthan date.
	 */
	$P.compareTo = function (date) {
		return Date.compare(this, date);
	};

	/**
	 * Compares this instance to another Date object and returns true if they are equal.  
	 * @param {Date}     Date object to compare. If no date to compare, new Date() [now] is used.
	 * @return {Boolean} true if dates are equal. false if they are not equal.
	 */
	$P.equals = function (date) {
		return Date.equals(this, (date !== undefined ? date : new Date()));
	};

	/**
	 * Determines if this instance is between a range of two dates or equal to either the start or end dates.
	 * @param {Date}     Start of range [Required]
	 * @param {Date}     End of range [Required]
	 * @return {Boolean} true is this is between or equal to the start and end dates, else false
	 */
	$P.between = function (start, end) {
		return this.getTime() >= start.getTime() && this.getTime() <= end.getTime();
	};

	/**
	 * Determines if this date occurs after the date to compare to.
	 * @param {Date}     Date object to compare. If no date to compare, new Date() ("now") is used.
	 * @return {Boolean} true if this date instance is greater than the date to compare to (or "now"), otherwise false.
	 */
	$P.isAfter = function (date) {
		return this.compareTo(date || new Date()) === 1;
	};

	/**
	 * Determines if this date occurs before the date to compare to.
	 * @param {Date}     Date object to compare. If no date to compare, new Date() ("now") is used.
	 * @return {Boolean} true if this date instance is less than the date to compare to (or "now").
	 */
	$P.isBefore = function (date) {
		return (this.compareTo(date || new Date()) === -1);
	};

	/**
	 * Determines if the current Date instance occurs today.
	 * @return {Boolean} true if this date instance is 'today', otherwise false.
	 */
	
	/**
	 * Determines if the current Date instance occurs on the same Date as the supplied 'date'. 
	 * If no 'date' to compare to is provided, the current Date instance is compared to 'today'. 
	 * @param {date}     Date object to compare. If no date to compare, the current Date ("now") is used.
	 * @return {Boolean} true if this Date instance occurs on the same Day as the supplied 'date'.
	 */
	$P.isToday = $P.isSameDay = function (date) {
		return this.clone().clearTime().equals((date || new Date()).clone().clearTime());
	};
	
	/**
	 * Adds the specified number of milliseconds to this instance. 
	 * @param {Number}   The number of milliseconds to add. The number can be positive or negative [Required]
	 * @return {Date}    this
	 */
	$P.addMilliseconds = function (value) {
		if (!value) { return this; }
		this.setTime(this.getTime() + value * 1);
		return this;
	};

	/**
	 * Adds the specified number of seconds to this instance. 
	 * @param {Number}   The number of seconds to add. The number can be positive or negative [Required]
	 * @return {Date}    this
	 */
	$P.addSeconds = function (value) {
		if (!value) { return this; }
		return this.addMilliseconds(value * 1000);
	};

	/**
	 * Adds the specified number of seconds to this instance. 
	 * @param {Number}   The number of seconds to add. The number can be positive or negative [Required]
	 * @return {Date}    this
	 */
	$P.addMinutes = function (value) {
		if (!value) { return this; }
		return this.addMilliseconds(value * 60000); /* 60*1000 */
	};

	/**
	 * Adds the specified number of hours to this instance. 
	 * @param {Number}   The number of hours to add. The number can be positive or negative [Required]
	 * @return {Date}    this
	 */
	$P.addHours = function (value) {
		if (!value) { return this; }
		return this.addMilliseconds(value * 3600000); /* 60*60*1000 */
	};

	/**
	 * Adds the specified number of days to this instance. 
	 * @param {Number}   The number of days to add. The number can be positive or negative [Required]
	 * @return {Date}    this
	 */
	$P.addDays = function (value) {
		if (!value) { return this; }
		this.setDate(this.getDate() + value * 1);
		return this;
	};

	/**
	 * Adds the specified number of weekdays (ie - not sat or sun) to this instance. 
	 * @param {Number}   The number of days to add. The number can be positive or negative [Required]
	 * @return {Date}    this
	 */
	$P.addWeekdays = function (value) {
		if (!value) { return this; }
		var day = this.getDay();
		var weeks = (Math.ceil(Math.abs(value)/7));
		if (day === 0 || day === 6) {
			if (value > 0) {
				this.next().monday();
				this.addDays(-1);
			}
		}

		if (value < 0) {
			while (value < 0) {
				this.addDays(-1);
				day = this.getDay();
				if (day !== 0 && day !== 6) {
					value++;
				}
			}
			return this;
		} else if (value > 5 || (6-day) <= value) {
			value = value + (weeks * 2);
		}

		return this.addDays(value);
	};

	/**
	 * Adds the specified number of weeks to this instance. 
	 * @param {Number}   The number of weeks to add. The number can be positive or negative [Required]
	 * @return {Date}    this
	 */
	$P.addWeeks = function (value) {
		if (!value) { return this; }
		return this.addDays(value * 7);
	};

	/**
	 * Adds the specified number of months to this instance. 
	 * @param {Number}   The number of months to add. The number can be positive or negative [Required]
	 * @return {Date}    this
	 */
	$P.addMonths = function (value) {
		if (!value) { return this; }
		var n = this.getDate();
		this.setDate(1);
		this.setMonth(this.getMonth() + value * 1);
		this.setDate(Math.min(n, $D.getDaysInMonth(this.getFullYear(), this.getMonth())));
		return this;
	};

	$P.addQuarters = function (value) {
		if (!value) { return this; }
		// note this will take you to the same point in the quarter as you are now.
		// i.e. - if you are 15 days into the quarter you'll be 15 days into the resulting one.
		// bonus: this allows adding fractional quarters
		return this.addMonths(value * 3);
	};

	/**
	 * Adds the specified number of years to this instance. 
	 * @param {Number}   The number of years to add. The number can be positive or negative [Required]
	 * @return {Date}    this
	 */
	$P.addYears = function (value) {
		if (!value) { return this; }
		return this.addMonths(value * 12);
	};

	/**
	 * Adds (or subtracts) to the value of the years, months, weeks, days, hours, minutes, seconds, milliseconds of the date instance using given configuration object. Positive and Negative values allowed.
	 * Example
	<pre><code>
	Date.today().add( { days: 1, months: 1 } )
	 
	new Date().add( { years: -1 } )
	</code></pre> 
	 * @param {Object}   Configuration object containing attributes (months, days, etc.)
	 * @return {Date}    this
	 */
	$P.add = function (config) {
		if (typeof config === "number") {
			this._orient = config;
			return this;
		}
		
		var x = config;

		if (x.day) {
			// If we should be a different date than today (eg: for 'tomorrow -1d', etc).
			// Should only effect parsing, not direct usage (eg, Finish and FinishExact)
			if ((x.day - this.getDate()) !== 0) {
				this.setDate(x.day);
			}
		}
		if (x.milliseconds) {
			this.addMilliseconds(x.milliseconds);
		}
		if (x.seconds) {
			this.addSeconds(x.seconds);
		}
		if (x.minutes) {
			this.addMinutes(x.minutes);
		}
		if (x.hours) {
			this.addHours(x.hours);
		}
		if (x.weeks) {
			this.addWeeks(x.weeks);
		}
		if (x.months) {
			this.addMonths(x.months);
		}
		if (x.years) {
			this.addYears(x.years);
		}
		if (x.days) {
			this.addDays(x.days);
		}
		return this;
	};
	
	/**
	 * Get the week number. Week one (1) is the week which contains the first Thursday of the year. Monday is considered the first day of the week.
	 * The .getWeek() function does NOT convert the date to UTC. The local datetime is used. 
	 * Please use .getISOWeek() to get the week of the UTC converted date.
	 * @return {Number}  1 to 53
	 */
	$P.getWeek = function (utc) {
		// Create a copy of this date object  
		var self, target = new Date(this.valueOf());
		if (utc) {
			target.addMinutes(target.getTimezoneOffset());
			self = target.clone();
		} else {
			self = this;
		}
		// ISO week date weeks start on monday  
		// so correct the day number  
		var dayNr = (self.getDay() + 6) % 7;
		// ISO 8601 states that week 1 is the week  
		// with the first thursday of that year.  
		// Set the target date to the thursday in the target week  
		target.setDate(target.getDate() - dayNr + 3);
		// Store the millisecond value of the target date  
		var firstThursday = target.valueOf();
		// Set the target to the first thursday of the year  
		// First set the target to january first  
		target.setMonth(0, 1);
		// Not a thursday? Correct the date to the next thursday  
		if (target.getDay() !== 4) {
			target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
		}
		// The weeknumber is the number of weeks between the   
		// first thursday of the year and the thursday in the target week  
		return 1 + Math.ceil((firstThursday - target) / 604800000); // 604800000 = 7 * 24 * 3600 * 1000  
	};
	
	/**
	 * Get the ISO 8601 week number. Week one ("01") is the week which contains the first Thursday of the year. Monday is considered the first day of the week.
	 * The .getISOWeek() function does convert the date to it's UTC value. Please use .getWeek() to get the week of the local date.
	 * @return {String}  "01" to "53"
	 */
	$P.getISOWeek = function () {
		return p(this.getWeek(true));
	};

	/**
	 * Moves the date to Monday of the week set. Week one (1) is the week which contains the first Thursday of the year.
	 * @param {Number}   A Number (1 to 53) that represents the week of the year.
	 * @return {Date}    this
	 */
	$P.setWeek = function (n) {
		return this.moveToDayOfWeek(1, (this.getDay() > 1 ? -1 : 1)).addWeeks(n - this.getWeek());
	};

	$P.setQuarter = function (qtr) {
		var month = Math.abs(((qtr-1) * 3) + 1);
		return this.setMonth(month, 1);
	};

	$P.getQuarter = function () {
		return Date.getQuarter(this);
	};

	$P.getDaysLeftInQuarter = function () {
		return Date.getDaysLeftInQuarter(this);
	};

	// private
	var validate = function (n, min, max, name) {
		name = name ? name : "Object";
		if (typeof n === "undefined") {
			return false;
		} else if (typeof n !== "number") {
			throw new TypeError(n + " is not a Number.");
		} else if (n < min || n > max) {
			// As failing validation is *not* an exceptional circumstance 
			// lets not throw a RangeError Exception here. 
			// It's semantically correct but it's not sensible.
			return false;
		}
		return true;
	};

	/**
	 * Validates the number is within an acceptable range for milliseconds [0-999].
	 * @param {Number}   The number to check if within range.
	 * @return {Boolean} true if within range, otherwise false.
	 */
	$D.validateMillisecond = function (value) {
		return validate(value, 0, 999, "millisecond");
	};

	/**
	 * Validates the number is within an acceptable range for seconds [0-59].
	 * @param {Number}   The number to check if within range.
	 * @return {Boolean} true if within range, otherwise false.
	 */
	$D.validateSecond = function (value) {
		return validate(value, 0, 59, "second");
	};

	/**
	 * Validates the number is within an acceptable range for minutes [0-59].
	 * @param {Number}   The number to check if within range.
	 * @return {Boolean} true if within range, otherwise false.
	 */
	$D.validateMinute = function (value) {
		return validate(value, 0, 59, "minute");
	};

	/**
	 * Validates the number is within an acceptable range for hours [0-23].
	 * @param {Number}   The number to check if within range.
	 * @return {Boolean} true if within range, otherwise false.
	 */
	$D.validateHour = function (value) {
		return validate(value, 0, 23, "hour");
	};

	/**
	 * Validates the number is within an acceptable range for the days in a month [0-MaxDaysInMonth].
	 * @param {Number}   The number to check if within range.
	 * @return {Boolean} true if within range, otherwise false.
	 */
	$D.validateDay = function (value, year, month) {
		return validate(value, 1, $D.getDaysInMonth(year, month), "day");
	};

	/**
	 * Validates the number is within an acceptable range for months [0-11].
	 * @param {Number}   The number to check if within range.
	 * @return {Boolean} true if within range, otherwise false.
	 */
	$D.validateWeek = function (value) {
		return validate(value, 0, 53, "week");
	};

	/**
	 * Validates the number is within an acceptable range for months [0-11].
	 * @param {Number}   The number to check if within range.
	 * @return {Boolean} true if within range, otherwise false.
	 */
	$D.validateMonth = function (value) {
		return validate(value, 0, 11, "month");
	};

	/**
	 * Validates the number is within an acceptable range for years.
	 * @param {Number}   The number to check if within range.
	 * @return {Boolean} true if within range, otherwise false.
	 */
	$D.validateYear = function (value) {
		/**
		 * Per ECMAScript spec the range of times supported by Date objects is 
		 * exactly –100,000,000 days to 100,000,000 days measured relative to 
		 * midnight at the beginning of 01 January, 1970 UTC. 
		 * This gives a range of 8,640,000,000,000,000 milliseconds to either 
		 * side of 01 January, 1970 UTC.
		 *
		 * Earliest possible date: Tue, 20 Apr 271,822 B.C. 00:00:00 UTC
		 * Latest possible date: Sat, 13 Sep 275,760 00:00:00 UTC
		 */

		return validate(value, -271822, 275760, "year");
	};

	/**
	 * Set the value of year, month, day, hour, minute, second, millisecond of date instance using given configuration object.
	 * Example
	<pre><code>
	Date.today().set( { day: 20, month: 1 } )

	new Date().set( { millisecond: 0 } )
	</code></pre>
	 * 
	 * @param {Object}   Configuration object containing attributes (month, day, etc.)
	 * @return {Date}    this
	 */
	$P.set = function (config) {
		if ($D.validateMillisecond(config.millisecond)) {
			this.addMilliseconds(config.millisecond - this.getMilliseconds());
		}
		
		if ($D.validateSecond(config.second)) {
			this.addSeconds(config.second - this.getSeconds());
		}
		
		if ($D.validateMinute(config.minute)) {
			this.addMinutes(config.minute - this.getMinutes());
		}
		
		if ($D.validateHour(config.hour)) {
			this.addHours(config.hour - this.getHours());
		}
		
		if ($D.validateMonth(config.month)) {
			this.addMonths(config.month - this.getMonth());
		}

		if ($D.validateYear(config.year)) {
			this.addYears(config.year - this.getFullYear());
		}
		
		/* day has to go last because you can't validate the day without first knowing the month */
		if ($D.validateDay(config.day, this.getFullYear(), this.getMonth())) {
			this.addDays(config.day - this.getDate());
		}
		
		if (config.timezone) {
			this.setTimezone(config.timezone);
		}
		
		if (config.timezoneOffset) {
			this.setTimezoneOffset(config.timezoneOffset);
		}

		if (config.week && $D.validateWeek(config.week)) {
			this.setWeek(config.week);
		}
		
		return this;
	};

	/**
	 * Moves the date to the first day of the month.
	 * @return {Date}    this
	 */
	$P.moveToFirstDayOfMonth = function () {
		return this.set({ day: 1 });
	};

	/**
	 * Moves the date to the last day of the month.
	 * @return {Date}    this
	 */
	$P.moveToLastDayOfMonth = function () {
		return this.set({ day: $D.getDaysInMonth(this.getFullYear(), this.getMonth())});
	};

	/**
	 * Moves the date to the next n'th occurrence of the dayOfWeek starting from the beginning of the month. The number (-1) is a magic number and will return the last occurrence of the dayOfWeek in the month.
	 * @param {Number}   The dayOfWeek to move to
	 * @param {Number}   The n'th occurrence to move to. Use (-1) to return the last occurrence in the month
	 * @return {Date}    this
	 */
	$P.moveToNthOccurrence = function (dayOfWeek, occurrence) {
		if (dayOfWeek === "Weekday") {
			if (occurrence > 0) {
				this.moveToFirstDayOfMonth();
				if (this.is().weekday()) {
					occurrence -= 1;
				}
			} else if (occurrence < 0) {
				this.moveToLastDayOfMonth();
				if (this.is().weekday()) {
					occurrence += 1;
				}
			} else {
				return this;
			}
			return this.addWeekdays(occurrence);
		}
		var shift = 0;
		if (occurrence > 0) {
			shift = occurrence - 1;
		}
		else if (occurrence === -1) {
			this.moveToLastDayOfMonth();
			if (this.getDay() !== dayOfWeek) {
				this.moveToDayOfWeek(dayOfWeek, -1);
			}
			return this;
		}
		return this.moveToFirstDayOfMonth().addDays(-1).moveToDayOfWeek(dayOfWeek, +1).addWeeks(shift);
	};

	/**
	 * Move to the next or last dayOfWeek based on the orient value.
	 * @param {Number}   The dayOfWeek to move to
	 * @param {Number}   Forward (+1) or Back (-1). Defaults to +1. [Optional]
	 * @return {Date}    this
	 */
	$P.moveToDayOfWeek = function (dayOfWeek, orient) {
		var diff = (dayOfWeek - this.getDay() + 7 * (orient || +1)) % 7;
		return this.addDays((diff === 0) ? diff += 7 * (orient || +1) : diff);
	};

	/**
	 * Move to the next or last month based on the orient value.
	 * @param {Number}   The month to move to. 0 = January, 11 = December
	 * @param {Number}   Forward (+1) or Back (-1). Defaults to +1. [Optional]
	 * @return {Date}    this
	 */
	$P.moveToMonth = function (month, orient) {
		var diff = (month - this.getMonth() + 12 * (orient || +1)) % 12;
		return this.addMonths((diff === 0) ? diff += 12 * (orient || +1) : diff);
	};
	/**
	 * Get the Ordinate of the current day ("th", "st", "rd").
	 * @return {String} 
	 */
	$P.getOrdinate = function () {
		var num = this.getDate();
		return ord(num);
	};
	/**
	 * Get the Ordinal day (numeric day number) of the year, adjusted for leap year.
	 * @return {Number} 1 through 365 (366 in leap years)
	 */
	$P.getOrdinalNumber = function () {
		return Math.ceil((this.clone().clearTime() - new Date(this.getFullYear(), 0, 1)) / 86400000) + 1;
	};

	/**
	 * Get the time zone abbreviation of the current date.
	 * @return {String} The abbreviated time zone name (e.g. "EST")
	 */
	$P.getTimezone = function () {
		return $D.getTimezoneAbbreviation(this.getUTCOffset(), this.isDaylightSavingTime());
	};

	$P.setTimezoneOffset = function (offset) {
		var here = this.getTimezoneOffset(), there = Number(offset) * -6 / 10;
		return (there || there === 0) ? this.addMinutes(there - here) : this;
	};

	$P.setTimezone = function (offset) {
		return this.setTimezoneOffset($D.getTimezoneOffset(offset));
	};

	/**
	 * Indicates whether Daylight Saving Time is observed in the current time zone.
	 * @return {Boolean} true|false
	 */
	$P.hasDaylightSavingTime = function () {
		return (Date.today().set({month: 0, day: 1}).getTimezoneOffset() !== Date.today().set({month: 6, day: 1}).getTimezoneOffset());
	};
	
	/**
	 * Indicates whether this Date instance is within the Daylight Saving Time range for the current time zone.
	 * @return {Boolean} true|false
	 */
	$P.isDaylightSavingTime = function () {
		return Date.today().set({month: 0, day: 1}).getTimezoneOffset() !== this.getTimezoneOffset();
	};

	/**
	 * Get the offset from UTC of the current date.
	 * @return {String} The 4-character offset string prefixed with + or - (e.g. "-0500")
	 */
	$P.getUTCOffset = function (offset) {
		var n = (offset || this.getTimezoneOffset()) * -10 / 6, r;
		if (n < 0) {
			r = (n - 10000).toString();
			return r.charAt(0) + r.substr(2);
		} else {
			r = (n + 10000).toString();
			return "+" + r.substr(1);
		}
	};

	/**
	 * Returns the number of milliseconds between this date and date.
	 * @param {Date} Defaults to now
	 * @return {Number} The diff in milliseconds
	 */
	$P.getElapsed = function (date) {
		return (date || new Date()) - this;
	};

	/**
	 * Converts the value of the current Date object to its equivalent string representation.
	 * Format Specifiers
	<pre>
	CUSTOM DATE AND TIME FORMAT STRINGS
	Format  Description                                                                  Example
	------  ---------------------------------------------------------------------------  -----------------------
	 s      The seconds of the minute between 0-59.                                      "0" to "59"
	 ss     The seconds of the minute with leading zero if required.                     "00" to "59"
	 
	 m      The minute of the hour between 0-59.                                         "0"  or "59"
	 mm     The minute of the hour with leading zero if required.                        "00" or "59"
	 
	 h      The hour of the day between 1-12.                                            "1"  to "12"
	 hh     The hour of the day with leading zero if required.                           "01" to "12"
	 
	 H      The hour of the day between 0-23.                                            "0"  to "23"
	 HH     The hour of the day with leading zero if required.                           "00" to "23"
	 
	 d      The day of the month between 1 and 31.                                       "1"  to "31"
	 dd     The day of the month with leading zero if required.                          "01" to "31"
	 ddd    Abbreviated day name. Date.CultureInfo.abbreviatedDayNames.                                "Mon" to "Sun" 
	 dddd   The full day name. Date.CultureInfo.dayNames.                                              "Monday" to "Sunday"
	 
	 M      The month of the year between 1-12.                                          "1" to "12"
	 MM     The month of the year with leading zero if required.                         "01" to "12"
	 MMM    Abbreviated month name. Date.CultureInfo.abbreviatedMonthNames.                            "Jan" to "Dec"
	 MMMM   The full month name. Date.CultureInfo.monthNames.                                          "January" to "December"

	 yy     The year as a two-digit number.                                              "99" or "08"
	 yyyy   The full four digit year.                                                    "1999" or "2008"
	 
	 t      Displays the first character of the A.M./P.M. designator.                    "A" or "P"
			Date.CultureInfo.amDesignator or Date.CultureInfo.pmDesignator
	 tt     Displays the A.M./P.M. designator.                                           "AM" or "PM"
			Date.CultureInfo.amDesignator or Date.CultureInfo.pmDesignator
	 
	 S      The ordinal suffix ("st, "nd", "rd" or "th") of the current day.            "st, "nd", "rd" or "th"

|| *Format* || *Description* || *Example* ||
|| d      || The CultureInfo shortDate Format Pattern                                     || "M/d/yyyy" ||
|| D      || The CultureInfo longDate Format Pattern                                      || "dddd, MMMM dd, yyyy" ||
|| F      || The CultureInfo fullDateTime Format Pattern                                  || "dddd, MMMM dd, yyyy h:mm:ss tt" ||
|| m      || The CultureInfo monthDay Format Pattern                                      || "MMMM dd" ||
|| r      || The CultureInfo rfc1123 Format Pattern                                       || "ddd, dd MMM yyyy HH:mm:ss GMT" ||
|| s      || The CultureInfo sortableDateTime Format Pattern                              || "yyyy-MM-ddTHH:mm:ss" ||
|| t      || The CultureInfo shortTime Format Pattern                                     || "h:mm tt" ||
|| T      || The CultureInfo longTime Format Pattern                                      || "h:mm:ss tt" ||
|| u      || The CultureInfo universalSortableDateTime Format Pattern                     || "yyyy-MM-dd HH:mm:ssZ" ||
|| y      || The CultureInfo yearMonth Format Pattern                                     || "MMMM, yyyy" ||
	 

	STANDARD DATE AND TIME FORMAT STRINGS
	Format  Description                                                                  Example ("en-US")
	------  ---------------------------------------------------------------------------  -----------------------
	 d      The CultureInfo shortDate Format Pattern                                     "M/d/yyyy"
	 D      The CultureInfo longDate Format Pattern                                      "dddd, MMMM dd, yyyy"
	 F      The CultureInfo fullDateTime Format Pattern                                  "dddd, MMMM dd, yyyy h:mm:ss tt"
	 m      The CultureInfo monthDay Format Pattern                                      "MMMM dd"
	 r      The CultureInfo rfc1123 Format Pattern                                       "ddd, dd MMM yyyy HH:mm:ss GMT"
	 s      The CultureInfo sortableDateTime Format Pattern                              "yyyy-MM-ddTHH:mm:ss"
	 t      The CultureInfo shortTime Format Pattern                                     "h:mm tt"
	 T      The CultureInfo longTime Format Pattern                                      "h:mm:ss tt"
	 u      The CultureInfo universalSortableDateTime Format Pattern                     "yyyy-MM-dd HH:mm:ssZ"
	 y      The CultureInfo yearMonth Format Pattern                                     "MMMM, yyyy"
	</pre>
	 * @param {String}   A format string consisting of one or more format spcifiers [Optional].
	 * @return {String}  A string representation of the current Date object.
	 */
	
	var ord = function (n) {
		switch (n * 1) {
		case 1:
		case 21:
		case 31:
			return "st";
		case 2:
		case 22:
			return "nd";
		case 3:
		case 23:
			return "rd";
		default:
			return "th";
		}
	};
	$P.toString = function (format, ignoreStandards) {
		var x = this;
		
		// Standard Date and Time Format Strings. Formats pulled from CultureInfo file and
		// may vary by culture. 
		if (!ignoreStandards && format && format.length === 1) {
			var y, c = Date.CultureInfo.formatPatterns;
			x.t = x.toString;
			switch (format) {
			case "d":
				return x.t(c.shortDate);
			case "D":
				return x.t(c.longDate);
			case "F":
				return x.t(c.fullDateTime);
			case "m":
				return x.t(c.monthDay);
			case "r":
			case "R":
				y = x.clone().addMinutes(x.getTimezoneOffset());
				return y.toString(c.rfc1123) + " GMT";
			case "s":
				return x.t(c.sortableDateTime);
			case "t":
				return x.t(c.shortTime);
			case "T":
				return x.t(c.longTime);
			case "u":
				y = x.clone().addMinutes(x.getTimezoneOffset());
				return y.toString(c.universalSortableDateTime);
			case "y":
				return x.t(c.yearMonth);
			}
		}

		return format ? format.replace(/((\\)?(dd?d?d?|MM?M?M?|yy?y?y?|hh?|HH?|mm?|ss?|tt?|S|q|Q)(?![^\[]*\]))/g,
		function (m) {
			if (m.charAt(0) === "\\") {
				return m.replace("\\", "");
			}
			x.h = x.getHours;
			switch (m) {
			case "hh":
				return p(x.h() < 13 ? (x.h() === 0 ? 12 : x.h()) : (x.h() - 12));
			case "h":
				return x.h() < 13 ? (x.h() === 0 ? 12 : x.h()) : (x.h() - 12);
			case "HH":
				return p(x.h());
			case "H":
				return x.h();
			case "mm":
				return p(x.getMinutes());
			case "m":
				return x.getMinutes();
			case "ss":
				return p(x.getSeconds());
			case "s":
				return x.getSeconds();
			case "yyyy":
				return p(x.getFullYear(), 4);
			case "yy":
				return p(x.getFullYear());
			case "dddd":
				return Date.CultureInfo.dayNames[x.getDay()];
			case "ddd":
				return Date.CultureInfo.abbreviatedDayNames[x.getDay()];
			case "dd":
				return p(x.getDate());
			case "d":
				return x.getDate();
			case "MMMM":
				return Date.CultureInfo.monthNames[x.getMonth()];
			case "MMM":
				return Date.CultureInfo.abbreviatedMonthNames[x.getMonth()];
			case "MM":
				return p((x.getMonth() + 1));
			case "M":
				return x.getMonth() + 1;
			case "t":
				return x.h() < 12 ? Date.CultureInfo.amDesignator.substring(0, 1) : Date.CultureInfo.pmDesignator.substring(0, 1);
			case "tt":
				return x.h() < 12 ? Date.CultureInfo.amDesignator : Date.CultureInfo.pmDesignator;
			case "S":
				return ord(x.getDate());
			case "Q":
				return "Q" + x.getQuarter();
			case "q":
				return String(x.getQuarter());
			}
		}).replace(/\[|\]/g, "") : this._toString();
	};

}());
