(function () {
	"use strict";
	Date.Parsing = {
		Exception: function (s) {
			this.message = "Parse error at '" + s.substring(0, 10) + " ...'";
		}
	};
	var $P = Date.Parsing;
	var dayOffsets = {
		standard: [0,31,59,90,120,151,181,212,243,273,304,334],
		leap: [0,31,60,91,121,152,182,213,244,274,305,335]
	};

	$P.isLeapYear = function(year) {
		return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
	};

	$P.processTimeObject = function (obj) {
		var d, jan4, date, offset, dayOffset;
		d = new Date();
		dayOffset = ($P.isLeapYear(obj.year)) ? dayOffsets.leap : dayOffsets.standard;
		obj.hours = obj.hours ? obj.hours : 0;
		obj.minutes = obj.minutes ? obj.minutes : 0;
		obj.seconds = obj.seconds ? obj.seconds : 0;
		obj.milliseconds = obj.milliseconds ? obj.milliseconds : 0;
		if (!obj.year) {
			obj.year = d.getFullYear();
		}
		if (!obj.month && (obj.week || obj.dayOfYear)) {
			// work out the day of the year...
			if (!obj.dayOfYear) {
				obj.weekDay = (!obj.weekDay && obj.weekDay !== 0) ? 1 : obj.weekDay;
				d = new Date(obj.year, 0, 4);
				jan4 = d.getDay() === 0 ? 7 : d.getDay(); // JS is 0 indexed on Sunday.
				offset = jan4+3;
				obj.dayOfYear = ((obj.week * 7) + (obj.weekDay === 0 ? 7 : obj.weekDay))-offset;
			}
			for (var i=0;i <= dayOffset.length;i++) {
				if (obj.dayOfYear < dayOffset[i] || i === dayOffset.length) {
					obj.day = obj.day ? obj.day : (obj.dayOfYear - dayOffset[i-1]);
					break;
				} else {
					obj.month = i;
				}
			}
		} else {
			obj.month = obj.month ? obj.month : 0;
			obj.day = obj.day ? obj.day : 1;
			obj.dayOfYear = dayOffset[obj.month] + obj.day;
		}
		date = new Date(obj.year, obj.month, obj.day, obj.hours, obj.minutes, obj.seconds, obj.milliseconds);

		if (obj.zone) {
			// adjust (and calculate) for timezone here
			if (obj.zone.toUpperCase() === "Z" || (obj.zone_hours === 0 && obj.zone_minutes === 0)) {
				// it's UTC/GML so work out the current timeszone offset
				offset = -date.getTimezoneOffset();
			} else {
				offset = (obj.zone_hours*60) + (obj.zone_minutes ? obj.zone_minutes : 0);
				if (obj.zone_sign === "+") {
					offset *= -1;
				}
				offset -= date.getTimezoneOffset();
			}
			date.setMinutes(date.getMinutes()+offset);
		}
		return date;
	};
	
	$P.ISO = {
		regex : /^([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-3])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-4])((:?)[0-5]\d)?|24\:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?\s?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/,
		parse : function (s) {
			var data = s.match(this.regex);
			if (!data || !data.length) {
				return null;
			}
			var time = {
				year : data[1] ? Number(data[1]) : data[1],
				month : data[5] ? (Number(data[5])-1) : data[5],
				day : data[7] ? Number(data[7]) : data[7],
				week : data[8] ? Number(data[8]) : data[8],
				weekDay : data[9] ? (Math.abs(Number(data[9])) === 7 ? 0 : Math.abs(Number(data[9]))) : data[9], // 1-7, starts on Monday. Convert to JS's 0-6 index.
				dayOfYear : data[10] ? Number(data[10]) : data[10],
				hours : data[15] ? Number(data[15]) : data[15],
				minutes : data[16] ? Number(data[16].replace(":","")) : data[16],
				seconds : data[19] ? Math.floor(Number(data[19].replace(":","").replace(",","."))) : data[19],
				milliseconds : data[20] ? (Number(data[20].replace(",","."))*1000) : data[20],
				zone : data[21],
				zone_sign : data[22],
				zone_hours : (data[23] && typeof data[23] !== "undefined") ? Number(data[23]) : data[23],
				zone_minutes : (data[24] && typeof data[23] !== "undefined") ? Number(data[24]) : data[24]
			};
			if (data[18]) {
				data[18] = 60 * Number(data[18].replace(",", "."));
				if (!time.minutes) {
					time.minutes = data[18];
				} else if (!time.seconds) {
					time.seconds = data[18];
				}
			}
			if (!time.year || (!time.year && (!time.month && !time.day) && (!time.week && !time.dayOfYear)) ) {
				return null;
			}
			return $P.processTimeObject(time);
		}
	};
	$P.Numeric = {
		regex: /\b([0-1]?[0-9])([0-3]?[0-9])([0-2]?[0-9]?[0-9][0-9])\b/i,
		parse: function (s) {
			var data, i,
				time = {},
				order = Date.CultureInfo.dateElementOrder.split("");
			if (!(!isNaN(parseFloat(s)) && isFinite(s)) || // if it's non-numeric OR
				(s[0] === "+" && s[0] === "-")) {			// It's an arithmatic string (eg +/-1000)
				return null;
			}
			if (s.length < 5) { // assume it's just a year.
				time.year = s;
				return $P.processTimeObject(time);
			}
			data = s.match(this.regex);
			if (!data || !data.length) {
				return null;
			}
			for (i=0; i < order.length; i++) {
				switch(order[i]) {
					case "d":
						time.day = data[i+1];
						break;
					case "m":
						time.month = (data[i+1]-1);
						break;
					case "y":
						time.year = data[i+1];
						break;
				}
			}
			return $P.processTimeObject(time);
		}
	};
	$P.Normalizer = {
		parse: function (s) {
			var $C = Date.CultureInfo;
			var $R = Date.CultureInfo.regexPatterns;
			var __ = Date.i18n.__;

			s = s.replace($R.jan.source, "January");
			s = s.replace($R.feb, "February");
			s = s.replace($R.mar, "March");
			s = s.replace($R.apr, "April");
			s = s.replace($R.may, "May");
			s = s.replace($R.jun, "June");
			s = s.replace($R.jul, "July");
			s = s.replace($R.aug, "August");
			s = s.replace($R.sep, "September");
			s = s.replace($R.oct, "October");
			s = s.replace($R.nov, "November");
			s = s.replace($R.dec, "December");

			
			s = s.replace($R.tomorrow, Date.today().addDays(1).toString("d"));
			s = s.replace($R.yesterday, Date.today().addDays(-1).toString("d"));
			s = s.replace(new RegExp($R.today.source + "\\b", "i"), Date.today().toString("d"));
			s = s.replace(/\bat\b/gi, ""); // replace "at", eg: "tomorrow at 3pm"
			s = s.replace(/\s{2,}/, " "); // repliace multiple spaces with one.

			s = s.replace(new RegExp("(\\b\\d\\d?("+__("AM")+"|"+__("PM")+")? )("+$R.tomorrow.source.slice(1)+")", "i"), function(full, m1, m2, m3, m4) {
				var t = Date.today().addDays(1).toString("d");
				var s = t + " " + m1;
				return s;
			});

			s = s.replace(new RegExp("(("+$R.past.source+')\\s('+$R.mon.source+'))'), Date.today().last().monday().toString("d"));
			s = s.replace(new RegExp("(("+$R.past.source+')\\s('+$R.tue.source+'))'), Date.today().last().tuesday().toString("d"));
			s = s.replace(new RegExp("(("+$R.past.source+')\\s('+$R.wed.source+'))'), Date.today().last().wednesday().toString("d"));
			s = s.replace(new RegExp("(("+$R.past.source+')\\s('+$R.thu.source+'))'), Date.today().last().thursday().toString("d"));
			s = s.replace(new RegExp("(("+$R.past.source+')\\s('+$R.fri.source+'))'), Date.today().last().friday().toString("d"));
			s = s.replace(new RegExp("(("+$R.past.source+')\\s('+$R.sat.source+'))'), Date.today().last().saturday().toString("d"));
			s = s.replace(new RegExp("(("+$R.past.source+')\\s('+$R.sun.source+'))'), Date.today().last().sunday().toString("d"));

			// s = s.replace($R.thisMorning, "9am"))
			s = s.replace($R.amThisMorning, function(str, am){return am;});
			s = s.replace($R.inTheMorning, "am");
			s = s.replace($R.thisMorning, "9am");
			s = s.replace($R.amThisEvening, function(str, pm){return pm;});
			s = s.replace($R.inTheEvening, "pm");
			s = s.replace($R.thisEvening, "7pm");

			return s;
		}
	};
}());
(function () {
	var $P = Date.Parsing;
	var _ = $P.Operators = {
		//
		// Tokenizers
		//
		rtoken: function (r) { // regex token
			return function (s) {
				var mx = s.match(r);
				if (mx) {
					return ([ mx[0], s.substring(mx[0].length) ]);
				} else {
					throw new $P.Exception(s);
				}
			};
		},
		token: function (s) { // whitespace-eating token
			return function (s) {
				return _.rtoken(new RegExp("^\s*" + s + "\s*"))(s);
				// Removed .strip()
				// return _.rtoken(new RegExp("^\s*" + s + "\s*"))(s).strip();
			};
		},
		stoken: function (s) { // string token
			return _.rtoken(new RegExp("^" + s));
		},

		//
		// Atomic Operators
		// 

		until: function (p) {
			return function (s) {
				var qx = [], rx = null;
				while (s.length) {
					try {
						rx = p.call(this, s);
					} catch (e) {
						qx.push(rx[0]);
						s = rx[1];
						continue;
					}
					break;
				}
				return [ qx, s ];
			};
		},
		many: function (p) {
			return function (s) {
				var rx = [], r = null;
				while (s.length) {
					try {
						r = p.call(this, s);
					} catch (e) {
						return [ rx, s ];
					}
					rx.push(r[0]);
					s = r[1];
				}
				return [ rx, s ];
			};
		},

		// generator operators -- see below
		optional: function (p) {
			return function (s) {
				var r = null;
				try {
					r = p.call(this, s);
				} catch (e) {
					return [ null, s ];
				}
				return [ r[0], r[1] ];
			};
		},
		not: function (p) {
			return function (s) {
				try {
					p.call(this, s);
				} catch (e) {
					return [null, s];
				}
				throw new $P.Exception(s);
			};
		},
		ignore: function (p) {
			return p ?
			function (s) {
				var r = null;
				r = p.call(this, s);
				return [null, r[1]];
			} : null;
		},
		product: function () {
			var px = arguments[0],
			qx = Array.prototype.slice.call(arguments, 1), rx = [];
			for (var i = 0 ; i < px.length ; i++) {
				rx.push(_.each(px[i], qx));
			}
			return rx;
		},
		cache: function (rule) {
			var cache = {}, r = null;
			return function (s) {
				try {
					r = cache[s] = (cache[s] || rule.call(this, s));
				} catch (e) {
					r = cache[s] = e;
				}
				if (r instanceof $P.Exception) {
					throw r;
				} else {
					return r;
				}
			};
		},

		// vector operators -- see below
		any: function () {
			var px = arguments;
			return function (s) {
				var r = null;
				for (var i = 0; i < px.length; i++) {
					if (px[i] == null) {
						continue;
					}
					try {
						r = (px[i].call(this, s));
					} catch (e) {
						r = null;
					}
					if (r) {
						return r;
					}
				}
				throw new $P.Exception(s);
			};
		},
		each: function () {
			var px = arguments;
			return function (s) {
				var rx = [], r = null;
				for (var i = 0; i < px.length ; i++) {
					if (px[i] == null) {
						continue;
					}
					try {
						r = (px[i].call(this, s));
					} catch (e) {
						throw new $P.Exception(s);
					}
					rx.push(r[0]);
					s = r[1];
				}
				return [ rx, s];
			};
		},
		all: function () {
			var px = arguments, _ = _;
			return _.each(_.optional(px));
		},

		// delimited operators
		sequence: function (px, d, c) {
			d = d || _.rtoken(/^\s*/);
			c = c || null;
			
			if (px.length == 1) {
				return px[0];
			}
			return function (s) {
				var r = null, q = null;
				var rx = [];
				for (var i = 0; i < px.length ; i++) {
					try {
						r = px[i].call(this, s);
					} catch (e) {
						break;
					}
					rx.push(r[0]);
					try {
						q = d.call(this, r[1]);
					} catch (ex) {
						q = null;
						break;
					}
					s = q[1];
				}
				if (!r) {
					throw new $P.Exception(s);
				}
				if (q) {
					throw new $P.Exception(q[1]);
				}
				if (c) {
					try {
						r = c.call(this, r[1]);
					} catch (ey) {
						throw new $P.Exception(r[1]);
					}
				}
				return [ rx, (r?r[1]:s) ];
			};
		},

		//
		// Composite Operators
		//

		between: function (d1, p, d2) {
			d2 = d2 || d1;
			var _fn = _.each(_.ignore(d1), p, _.ignore(d2));
			return function (s) {
				var rx = _fn.call(this, s);
				return [[rx[0][0], r[0][2]], rx[1]];
			};
		},
		list: function (p, d, c) {
			d = d || _.rtoken(/^\s*/);
			c = c || null;
			return (p instanceof Array ?
				_.each(_.product(p.slice(0, -1), _.ignore(d)), p.slice(-1), _.ignore(c)) :
				_.each(_.many(_.each(p, _.ignore(d))), px, _.ignore(c)));
		},
		set: function (px, d, c) {
			d = d || _.rtoken(/^\s*/);
			c = c || null;
			return function (s) {
				// r is the current match, best the current 'best' match
				// which means it parsed the most amount of input
				var r = null, p = null, q = null, rx = null, best = [[], s], last = false;

				// go through the rules in the given set
				for (var i = 0; i < px.length ; i++) {

					// last is a flag indicating whether this must be the last element
					// if there is only 1 element, then it MUST be the last one
					q = null;
					p = null;
					r = null;
					last = (px.length == 1);

					// first, we try simply to match the current pattern
					// if not, try the next pattern
					try {
						r = px[i].call(this, s);
					} catch (e) {
						continue;
					}

					// since we are matching against a set of elements, the first
					// thing to do is to add r[0] to matched elements
					rx = [[r[0]], r[1]];

					// if we matched and there is still input to parse and 
					// we don't already know this is the last element,
					// we're going to next check for the delimiter ...
					// if there's none, or if there's no input left to parse
					// than this must be the last element after all ...
					if (r[1].length > 0 && ! last) {
						try {
							q = d.call(this, r[1]);
						} catch (ex) {
							last = true;
						}
					} else {
						last = true;
					}

					// if we parsed the delimiter and now there's no more input,
					// that means we shouldn't have parsed the delimiter at all
					// so don't update r and mark this as the last element ...
					if (!last && q[1].length === 0) {
						last = true;
					}


					// so, if this isn't the last element, we're going to see if
					// we can get any more matches from the remaining (unmatched)
					// elements ...
					if (!last) {	
						// build a list of the remaining rules we can match against,
						// i.e., all but the one we just matched against
						var qx = [];
						for (var j = 0; j < px.length ; j++) {
							if (i != j) {
								qx.push(px[j]);
							}
						}

						// now invoke recursively set with the remaining input
						// note that we don't include the closing delimiter ...
						// we'll check for that ourselves at the end
						p = _.set(qx, d).call(this, q[1]);

						// if we got a non-empty set as a result ...
						// (otw rx already contains everything we want to match)
						if (p[0].length > 0) {
							// update current result, which is stored in rx ...
							// basically, pick up the remaining text from p[1]
							// and concat the result from p[0] so that we don't
							// get endless nesting ...
							rx[0] = rx[0].concat(p[0]);
							rx[1] = p[1];
						}
					}

					// at this point, rx either contains the last matched element
					// or the entire matched set that starts with this element.

					// now we just check to see if this variation is better than
					// our best so far, in terms of how much of the input is parsed
					if (rx[1].length < best[1].length) {
						best = rx;
					}

					// if we've parsed all the input, then we're finished
					if (best[1].length === 0) {
						break;
					}
				}

				// so now we've either gone through all the patterns trying them
				// as the initial match; or we found one that parsed the entire
				// input string ...

				// if best has no matches, just return empty set ...
				if (best[0].length === 0) {
					return best;
				}

				// if a closing delimiter is provided, then we have to check it also
				if (c) {
					// we try this even if there is no remaining input because the pattern
					// may well be optional or match empty input ...
					try {
						q = c.call(this, best[1]);
					} catch (ey) {
						throw new $P.Exception(best[1]);
					}

					// it parsed ... be sure to update the best match remaining input
					best[1] = q[1];
				}

				// if we're here, either there was no closing delimiter or we parsed it
				// so now we have the best match; just return it!
				return best;
			};
		},
		forward: function (gr, fname) {
			return function (s) {
				return gr[fname].call(this, s);
			};
		},

		//
		// Translation Operators
		//
		replace: function (rule, repl) {
			return function (s) {
				var r = rule.call(this, s);
				return [repl, r[1]];
			};
		},
		process: function (rule, fn) {
			return function (s) {
				var r = rule.call(this, s);
				return [fn.call(this, r[0]), r[1]];
			};
		},
		min: function (min, rule) {
			return function (s) {
				var rx = rule.call(this, s);
				if (rx[0].length < min) {
					throw new $P.Exception(s);
				}
				return rx;
			};
		}
	};
	

	// Generator Operators And Vector Operators

	// Generators are operators that have a signature of F(R) => R,
	// taking a given rule and returning another rule, such as 
	// ignore, which parses a given rule and throws away the result.

	// Vector operators are those that have a signature of F(R1,R2,...) => R,
	// take a list of rules and returning a new rule, such as each.

	// Generator operators are converted (via the following _generator
	// function) into functions that can also take a list or array of rules
	// and return an array of new rules as though the function had been
	// called on each rule in turn (which is what actually happens).

	// This allows generators to be used with vector operators more easily.
	// Example:
	// each(ignore(foo, bar)) instead of each(ignore(foo), ignore(bar))

	// This also turns generators into vector operators, which allows
	// constructs like:
	// not(cache(foo, bar))
	
	var _generator = function (op) {
		function gen() {
			var args = null, rx = [], px, i;
			if (arguments.length > 1) {
				args = Array.prototype.slice.call(arguments);
			} else if (arguments[0] instanceof Array) {
				args = arguments[0];
			}
			if (args) {
				px = args.shift();
				if (px.length > 0) {
					args.unshift(px[i]);
					rx.push(op.apply(null, args));
					args.shift();
					return rx;
				}
			} else {
				return op.apply(null, arguments);
			}
		}

		return gen;
	};
	
	var gx = "optional not ignore cache".split(/\s/);
	
	for (var i = 0 ; i < gx.length ; i++) {
		_[gx[i]] = _generator(_[gx[i]]);
	}

	var _vector = function (op) {
		return function () {
			if (arguments[0] instanceof Array) {
				return op.apply(null, arguments[0]);
			} else {
				return op.apply(null, arguments);
			}
		};
	};
	
	var vx = "each any all".split(/\s/);
	
	for (var j = 0 ; j < vx.length ; j++) {
		_[vx[j]] = _vector(_[vx[j]]);
	}
	
}());

(function () {
	var $D = Date;

	var flattenAndCompact = function (ax) {
		var rx = [];
		for (var i = 0; i < ax.length; i++) {
			if (ax[i] instanceof Array) {
				rx = rx.concat(flattenAndCompact(ax[i]));
			} else {
				if (ax[i]) {
					rx.push(ax[i]);
				}
			}
		}
		return rx;
	};
	
	$D.Grammar = {};
	
	$D.Translator = {
		hour: function (s) {
			return function () {
				this.hour = Number(s);
			};
		},
		minute: function (s) {
			return function () {
				this.minute = Number(s);
			};
		},
		second: function (s) {
			return function () {
				this.second = Number(s);
			};
		},
		/* for ss.s format */
		secondAndMillisecond: function (s) {
			return function () {
				var mx = s.match(/^([0-5][0-9])\.([0-9]{1,3})/);
				this.second = Number(mx[1]);
				this.millisecond = Number(mx[2]);
			};
		},
		meridian: function (s) {
			return function () {
				this.meridian = s.slice(0, 1).toLowerCase();
			};
		},
		timezone: function (s) {
			return function () {
				var n = s.replace(/[^\d\+\-]/g, "");
				if (n.length) {
					this.timezoneOffset = Number(n);
				} else {
					this.timezone = s.toLowerCase();
				}
			};
		},
		day: function (x) {
			var s = x[0];
			return function () {
				this.day = Number(s.match(/\d+/)[0]);
				if (this.day < 1) {
					throw "invalid day";
				}
			};
		},
		month: function (s) {
			return function () {
				this.month = (s.length === 3) ? "jan feb mar apr may jun jul aug sep oct nov dec".indexOf(s)/4 : Number(s) - 1;
				if (this.month < 0) {
					throw "invalid month";
				}
			};
		},
		year: function (s) {
			return function () {
				var n = Number(s);
				this.year = ((s.length > 2) ? n :
					(n + (((n + 2000) < Date.CultureInfo.twoDigitYearMax) ? 2000 : 1900)));
			};
		},
		rday: function (s) {
			return function () {
				switch (s) {
					case "yesterday":
						this.days = -1;
						break;
					case "tomorrow":
						this.days = 1;
						break;
					case "today":
						this.days = 0;
						break;
					case "now":
						this.days = 0;
						this.now = true;
						break;
				}
			};
		},
		finishExact: function (x) {
			x = (x instanceof Array) ? x : [ x ];

			for (var i = 0 ; i < x.length ; i++) {
				if (x[i]) {
					x[i].call(this);
				}
			}
			
			var now = new Date();
			if ((this.hour || this.minute) && (!this.month && !this.year && !this.day)) {
				this.day = now.getDate();
			}

			if (!this.year) {
				this.year = now.getFullYear();
			}
			
			if (!this.month && this.month !== 0) {
				this.month = now.getMonth();
			}
			
			if (!this.day) {
				this.day = 1;
			}
			
			if (!this.hour) {
				this.hour = 0;
			}
			
			if (!this.minute) {
				this.minute = 0;
			}

			if (!this.second) {
				this.second = 0;
			}
			if (!this.millisecond) {
				this.millisecond = 0;
			}
			if (this.meridian && this.hour) {
				if (this.meridian == "p" && this.hour < 12) {
					this.hour = this.hour + 12;
				} else if (this.meridian == "a" && this.hour == 12) {
					this.hour = 0;
				}
			}
			
			if (this.day > $D.getDaysInMonth(this.year, this.month)) {
				throw new RangeError(this.day + " is not a valid value for days.");
			}

			var r = new Date(this.year, this.month, this.day, this.hour, this.minute, this.second, this.millisecond);
			if (this.year < 100) {
				r.setFullYear(this.year); // means years less that 100 are process correctly. JS will parse it otherwise as 1900-1999.
			}
			if (this.timezone) {
				r.set({ timezone: this.timezone });
			} else if (this.timezoneOffset) {
				r.set({ timezoneOffset: this.timezoneOffset });
			}
			
			return r;
		},
		finish: function (x) {
			x = (x instanceof Array) ? flattenAndCompact(x) : [ x ];

			if (x.length === 0) {
				return null;
			}

			for (var i = 0 ; i < x.length ; i++) {
				if (typeof x[i] == "function") {
					x[i].call(this);
				}
			}
			
			var today = $D.today();

			if (this.now && !this.unit && !this.operator) {
				return new Date();
			} else if (this.now) {
				today = new Date();
			}
			
			var expression = !!(this.days && this.days !== null || this.orient || this.operator);
			
			var gap, mod, orient;
			orient = ((this.orient == "past" || this.operator == "subtract") ? -1 : 1);

			if(!this.now && "hour minute second".indexOf(this.unit) != -1) {
				today.setTimeToNow();
			}

			if (this.month && this.unit == "week") {
				this.value = this.month + 1;
				delete this.month;
				delete this.day;
			}

			if (this.month || this.month === 0) {
				if ("year day hour minute second".indexOf(this.unit) != -1) {
					if (!this.value) {
						this.value = this.month + 1;
					}
					this.month = null;
					expression = true;
				}
			}

			if (!expression && this.weekday && !this.day && !this.days) {
				var temp = Date[this.weekday]();
				this.day = temp.getDate();
				if (!this.month) {
					this.month = temp.getMonth();
				}
				this.year = temp.getFullYear();
			}

			if (expression && this.weekday && this.unit != "month" && this.unit != "week") {
				this.unit = "day";
				gap = ($D.getDayNumberFromName(this.weekday) - today.getDay());
				mod = 7;
				this.days = gap ? ((gap + (orient * mod)) % mod) : (orient * mod);
			}

			if (this.month && this.unit == "day" && this.operator) {
				if (!this.value) {
					this.value = (this.month + 1);
				}
				this.month = null;
			}

			if (this.value != null && this.month != null && this.year != null) {
				this.day = this.value * 1;
			}

			if (this.month && !this.day && this.value) {
				today.set({ day: this.value * 1 });
				if (!expression) {
					this.day = this.value * 1;
				}
			}

			if (!this.month && this.value && this.unit == "month" && !this.now) {
				this.month = this.value;
				expression = true;
			}

			if (expression && (this.month || this.month === 0) && this.unit != "year") {
				this.unit = "month";
				gap = (this.month - today.getMonth());
				mod = 12;
				this.months = gap ? ((gap + (orient * mod)) % mod) : (orient * mod);
				this.month = null;
			}

			if (!this.unit) {
				this.unit = "day";
			}

			if (!this.value && this.operator && this.operator !== null && this[this.unit + "s"] && this[this.unit + "s"] !== null) {
				this[this.unit + "s"] = this[this.unit + "s"] + ((this.operator == "add") ? 1 : -1) + (this.value||0) * orient;
			} else if (this[this.unit + "s"] == null || this.operator != null) {
				if (!this.value) {
					this.value = 1;
				}
				this[this.unit + "s"] = this.value * orient;
			}

			if (this.meridian && this.hour) {
				if (this.meridian == "p" && this.hour < 12) {
					this.hour = this.hour + 12;
				} else if (this.meridian == "a" && this.hour == 12) {
					this.hour = 0;
				}
			}

			if (this.weekday && this.unit !== "week" && !this.day && !this.days) {
				var temp = Date[this.weekday]();
				this.day = temp.getDate();
				if (temp.getMonth() !== today.getMonth()) {
					this.month = temp.getMonth();
				}
			}
			
			if ((this.month || this.month === 0) && !this.day) {
				this.day = 1;
			}

			if (!this.orient && !this.operator && this.unit == "week" && this.value && !this.day && !this.month) {
				return Date.today().setWeek(this.value);
			}

			if (this.unit == "week" && this.weeks && !this.day && !this.month) {
				var weekday = (this.weekday) ? this.weekday : "today";
				var d = Date[weekday]().addWeeks(this.weeks);
				if (this.now) {
					d.setTimeToNow();
				}
				return d;
			}

			if (expression && this.timezone && this.day && this.days) {
				this.day = this.days;
			}
			
			return (expression) ? today.add(this) : today.set(this);
		}
	};

	var _ = $D.Parsing.Operators, g = $D.Grammar, t = $D.Translator, _fn;

	g.datePartDelimiter = _.rtoken(/^([\s\-\.\,\/\x27]+)/);
	g.timePartDelimiter = _.stoken(":");
	g.whiteSpace = _.rtoken(/^\s*/);
	g.generalDelimiter = _.rtoken(/^(([\s\,]|at|@|on)+)/);
  
	var _C = {};
	g.ctoken = function (keys) {
		var fn = _C[keys];
		if (! fn) {
			var c = Date.CultureInfo.regexPatterns;
			var kx = keys.split(/\s+/), px = [];
			for (var i = 0; i < kx.length ; i++) {
				px.push(_.replace(_.rtoken(c[kx[i]]), kx[i]));
			}
			fn = _C[keys] = _.any.apply(null, px);
		}
		return fn;
	};
	g.ctoken2 = function (key) {
		return _.rtoken(Date.CultureInfo.regexPatterns[key]);
	};

	// hour, minute, second, meridian, timezone
	g.h = _.cache(_.process(_.rtoken(/^(0[0-9]|1[0-2]|[1-9])/), t.hour));
	g.hh = _.cache(_.process(_.rtoken(/^(0[0-9]|1[0-2])/), t.hour));
	g.H = _.cache(_.process(_.rtoken(/^([0-1][0-9]|2[0-3]|[0-9])/), t.hour));
	g.HH = _.cache(_.process(_.rtoken(/^([0-1][0-9]|2[0-3])/), t.hour));
	g.m = _.cache(_.process(_.rtoken(/^([0-5][0-9]|[0-9])/), t.minute));
	g.mm = _.cache(_.process(_.rtoken(/^[0-5][0-9]/), t.minute));
	g.s = _.cache(_.process(_.rtoken(/^([0-5][0-9]|[0-9])/), t.second));
	g.ss = _.cache(_.process(_.rtoken(/^[0-5][0-9]/), t.second));
	g["ss.s"] = _.cache(_.process(_.rtoken(/^[0-5][0-9]\.[0-9]{1,3}/), t.secondAndMillisecond));
	g.hms = _.cache(_.sequence([g.H, g.m, g.s], g.timePartDelimiter));
  
	// _.min(1, _.set([ g.H, g.m, g.s ], g._t));
	g.t = _.cache(_.process(g.ctoken2("shortMeridian"), t.meridian));
	g.tt = _.cache(_.process(g.ctoken2("longMeridian"), t.meridian));
	g.z = _.cache(_.process(_.rtoken(/^((\+|\-)\s*\d\d\d\d)|((\+|\-)\d\d\:?\d\d)/), t.timezone));
	g.zz = _.cache(_.process(_.rtoken(/^((\+|\-)\s*\d\d\d\d)|((\+|\-)\d\d\:?\d\d)/), t.timezone));
	
	g.zzz = _.cache(_.process(g.ctoken2("timezone"), t.timezone));
	g.timeSuffix = _.each(_.ignore(g.whiteSpace), _.set([ g.tt, g.zzz ]));
	g.time = _.each(_.optional(_.ignore(_.stoken("T"))), g.hms, g.timeSuffix);
		  
	// days, months, years
	g.d = _.cache(_.process(_.each(_.rtoken(/^([0-2]\d|3[0-1]|\d)/),
		_.optional(g.ctoken2("ordinalSuffix"))), t.day));
	g.dd = _.cache(_.process(_.each(_.rtoken(/^([0-2]\d|3[0-1])/),
		_.optional(g.ctoken2("ordinalSuffix"))), t.day));
	g.ddd = g.dddd = _.cache(_.process(g.ctoken("sun mon tue wed thu fri sat"),
		function (s) {
			return function () {
				this.weekday = s;
			};
		}
	));
	g.M = _.cache(_.process(_.rtoken(/^(1[0-2]|0\d|\d)/), t.month));
	g.MM = _.cache(_.process(_.rtoken(/^(1[0-2]|0\d)/), t.month));
	g.MMM = g.MMMM = _.cache(_.process(g.ctoken("jan feb mar apr may jun jul aug sep oct nov dec"), t.month));
//	g.MMM = g.MMMM = _.cache(_.process(g.ctoken(Date.CultureInfo.abbreviatedMonthNames.join(" ")), t.month));
	g.y = _.cache(_.process(_.rtoken(/^(\d\d?)/), t.year));
	g.yy = _.cache(_.process(_.rtoken(/^(\d\d)/), t.year));
	g.yyy = _.cache(_.process(_.rtoken(/^(\d\d?\d?\d?)/), t.year));
	g.yyyy = _.cache(_.process(_.rtoken(/^(\d\d\d\d)/), t.year));
	
	// rolling these up into general purpose rules
	_fn = function () {
		return _.each(_.any.apply(null, arguments), _.not(g.ctoken2("timeContext")));
	};
	
	g.day = _fn(g.d, g.dd);
	g.month = _fn(g.M, g.MMM);
	g.year = _fn(g.yyyy, g.yy);

	// relative date / time expressions
	g.orientation = _.process(g.ctoken("past future"),
		function (s) {
			return function () {
				this.orient = s;
			};
		}
	);
	g.operator = _.process(g.ctoken("add subtract"),
		function (s) {
			return function () {
				this.operator = s;
			};
		}
	);
	g.rday = _.process(g.ctoken("yesterday tomorrow today now"), t.rday);
	g.unit = _.process(g.ctoken("second minute hour day week month year"),
		function (s) {
			return function () {
				this.unit = s;
			};
		}
	);
	g.value = _.process(_.rtoken(/^\d\d?(st|nd|rd|th)?/),
		function (s) {
			return function () {
				this.value = s.replace(/\D/g, "");
			};
		}
	);
	g.expression = _.set([ g.rday, g.operator, g.value, g.unit, g.orientation, g.ddd, g.MMM ]);

	// pre-loaded rules for different date part order preferences
	_fn = function () {
		return  _.set(arguments, g.datePartDelimiter);
	};
	g.mdy = _fn(g.ddd, g.month, g.day, g.year);
	g.ymd = _fn(g.ddd, g.year, g.month, g.day);
	g.dmy = _fn(g.ddd, g.day, g.month, g.year);
	g.date = function (s) {
		return ((g[Date.CultureInfo.dateElementOrder] || g.mdy).call(this, s));
	};

	// parsing date format specifiers - ex: "h:m:s tt" 
	// this little guy will generate a custom parser based
	// on the format string, ex: g.format("h:m:s tt")
	g.format = _.process(_.many(
		_.any(
		// translate format specifiers into grammar rules
		_.process(
		_.rtoken(/^(dd?d?d?(?!e)|MM?M?M?|yy?y?y?|hh?|HH?|mm?|ss?|tt?|zz?z?)/),
		function (fmt) {
		if (g[fmt]) {
			return g[fmt];
		} else {
			throw $D.Parsing.Exception(fmt);
		}
	}
	),
	// translate separator tokens into token rules
	_.process(_.rtoken(/^[^dMyhHmstz]+/), // all legal separators 
		function (s) {
			return _.ignore(_.stoken(s));
		}
	)
	)),
		// construct the parser ...
		function (rules) {
			return _.process(_.each.apply(null, rules), t.finishExact);
		}
	);

	var _F = {
		//"M/d/yyyy": function (s) { 
		//	var m = s.match(/^([0-2]\d|3[0-1]|\d)\/(1[0-2]|0\d|\d)\/(\d\d\d\d)/);
		//	if (m!=null) { 
		//		var r =  [ t.month.call(this,m[1]), t.day.call(this,m[2]), t.year.call(this,m[3]) ];
		//		r = t.finishExact.call(this,r);
		//		return [ r, "" ];
		//	} else {
		//		throw new Date.Parsing.Exception(s);
		//	}
		//}
		//"M/d/yyyy": function (s) { return [ new Date(Date._parse(s)), ""]; }
	};
	var _get = function (f) {
		_F[f] = (_F[f] || g.format(f)[0]);
		return _F[f];
	};

	g.allformats = function (fx) {
		var rx = [];
		if (fx instanceof Array) {
			for (var i = 0; i < fx.length; i++) {
				rx.push(_get(fx[i]));
			}
		} else {
			rx.push(_get(fx));
		}
		return rx;
	};
  
	g.formats = function (fx) {
		if (fx instanceof Array) {
			var rx = [];
			for (var i = 0 ; i < fx.length ; i++) {
				rx.push(_get(fx[i]));
			}
			return _.any.apply(null, rx);
		} else {
			return _get(fx);
		}
	};

	// check for these formats first
	g._formats = g.formats([
		"\"yyyy-MM-ddTHH:mm:ssZ\"",
		"yyyy-MM-ddTHH:mm:ss.sz",
		"yyyy-MM-ddTHH:mm:ssZ",
		"yyyy-MM-ddTHH:mm:ssz",
		"yyyy-MM-ddTHH:mm:ss",
		"yyyy-MM-ddTHH:mmZ",
		"yyyy-MM-ddTHH:mmz",
		"yyyy-MM-ddTHH:mm",
		"ddd, MMM dd, yyyy H:mm:ss tt",
		"ddd MMM d yyyy HH:mm:ss zzz",
		"MMddyyyy",
		"ddMMyyyy",
		"Mddyyyy",
		"ddMyyyy",
		"Mdyyyy",
		"dMyyyy",
		"yyyy",
		"Mdyy",
		"dMyy",
		"d"
	]);

	// starting rule for general purpose grammar
	g._start = _.process(_.set([ g.date, g.time, g.expression ],
		g.generalDelimiter, g.whiteSpace), t.finish);
	
	// real starting rule: tries selected formats first, 
	// then general purpose rule
	g.start = function (s) {
		try {
			var r = g._formats.call({}, s);
			if (r[1].length === 0) {
				return r;
			}
		} catch (e) {}
		return g._start.call({}, s);
	};

	/**
	 * @desc Converts the specified string value into its JavaScript Date equivalent using CultureInfo specific format information.
	 * 
	 * Example
	<pre><code>
	///////////
	// Dates //
	///////////

	// 15-Oct-2004
	var d1 = Date.parse("10/15/2004");

	// 15-Oct-2004
	var d1 = Date.parse("15-Oct-2004");

	// 15-Oct-2004
	var d1 = Date.parse("2004.10.15");

	//Fri Oct 15, 2004
	var d1 = Date.parse("Fri Oct 15, 2004");

	///////////
	// Times //
	///////////

	// Today at 10 PM.
	var d1 = Date.parse("10 PM");

	// Today at 10:30 PM.
	var d1 = Date.parse("10:30 P.M.");

	// Today at 6 AM.
	var d1 = Date.parse("06am");

	/////////////////////
	// Dates and Times //
	/////////////////////

	// 8-July-2004 @ 10:30 PM
	var d1 = Date.parse("July 8th, 2004, 10:30 PM");

	// 1-July-2004 @ 10:30 PM
	var d1 = Date.parse("2004-07-01T22:30:00");

	////////////////////
	// Relative Dates //
	////////////////////

	// Returns today's date. The string "today" is culture specific.
	var d1 = Date.parse("today");

	// Returns yesterday's date. The string "yesterday" is culture specific.
	var d1 = Date.parse("yesterday");

	// Returns the date of the next thursday.
	var d1 = Date.parse("Next thursday");

	// Returns the date of the most previous monday.
	var d1 = Date.parse("last monday");

	// Returns today's day + one year.
	var d1 = Date.parse("next year");

	///////////////
	// Date Math //
	///////////////

	// Today + 2 days
	var d1 = Date.parse("t+2");

	// Today + 2 days
	var d1 = Date.parse("today + 2 days");

	// Today + 3 months
	var d1 = Date.parse("t+3m");

	// Today - 1 year
	var d1 = Date.parse("today - 1 year");

	// Today - 1 year
	var d1 = Date.parse("t-1y"); 


	/////////////////////////////
	// Partial Dates and Times //
	/////////////////////////////

	// July 15th of this year.
	var d1 = Date.parse("July 15");

	// 15th day of current day and year.
	var d1 = Date.parse("15");

	// July 1st of current year at 10pm.
	var d1 = Date.parse("7/1 10pm");
	</code></pre>
	 *
	 * @param {String}   The string value to convert into a Date object [Required]
	 * @return {Date}    A Date object or null if the string cannot be converted into a Date.
	 */
	function parse (s) {
		var ords, d, t, r = null;
		if (!s) {
			return null;
		}
		if (s instanceof Date) {
			return s.clone();
		}
		if (s.length >= 4 && s.charAt(0) !== "0") { // ie: 2004 will pass, 0800 won't.
			//  Start with specific formats
			d = $D.Parsing.ISO.parse(s) || $D.Parsing.Numeric.parse(s);
		}
		if (d instanceof Date && !isNaN(d.getTime())) {
			return d;
		} else {
			// find ordinal dates (1st, 3rd, 8th, etc and remove them as they cause parsing issues)
			ords = s.match(/\b(\d+)(?:st|nd|rd|th)\b/); // find ordinal matches
			s = ((ords && ords.length === 2) ? s.replace(ords[0], ords[1]) : s);
			s = $D.Parsing.Normalizer.parse(s);
			try {
				r = $D.Grammar.start.call({}, s.replace(/^\s*(\S*(\s+\S+)*)\s*$/, "$1"));
			} catch (e) {
				return null;
			}
			d = ((r[1].length === 0) ? r[0] : null);
			
			if (d !== null) {
				return d;
			} else {
				try {
					// ok we haven't parsed it, last ditch attempt with the built-in parser.
					t = Date._parse(s);
					return (t || t === 0) ? new Date(t) : null;
				} catch (e) {
					return null;
				}
			}
		}
	}

	if (!$D._parse) {
		$D._parse = $D.parse;
	}
	$D.parse = parse;

	Date.getParseFunction = function (fx) {
		var fns = Date.Grammar.allformats(fx);
		return function (s) {
			var r = null;
			for (var i = 0; i < fns.length; i++) {
				try {
					r = fns[i].call({}, s);
				} catch (e) {
					continue;
				}
				if (r[1].length === 0) {
					return r[0];
				}
			}
			return null;
		};
	};
	
	/**
	 * Converts the specified string value into its JavaScript Date equivalent using the specified format {String} or formats {Array} and the CultureInfo specific format information.
	 * The format of the string value must match one of the supplied formats exactly.
	 * 
	 * Example
	<pre><code>
	// 15-Oct-2004
	var d1 = Date.parseExact("10/15/2004", "M/d/yyyy");

	// 15-Oct-2004
	var d1 = Date.parse("15-Oct-2004", "M-ddd-yyyy");

	// 15-Oct-2004
	var d1 = Date.parse("2004.10.15", "yyyy.MM.dd");

	// Multiple formats
	var d1 = Date.parseExact("10/15/2004", ["M/d/yyyy", "MMMM d, yyyy"]);
	</code></pre>
	 *
	 * @param {String}   The string value to convert into a Date object [Required].
	 * @param {Object}   The expected format {String} or an array of expected formats {Array} of the date string [Required].
	 * @return {Date}    A Date object or null if the string cannot be converted into a Date.
	 */
	$D.parseExact = function (s, fx) {
		return $D.getParseFunction(fx)(s);
	};
}());
