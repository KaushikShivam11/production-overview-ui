sap.ui.define([
	"sap/ui/core/Control"
], function(Control) {
	"use strict";

	return Control.extend("com.pdms.og.production_overview.control.DynaCard", {

		_oDynaCardData: null,

		metadata: {
			properties: {
				cardType: {
					type: "string",
					defaultValue: "Pump"
				}
			},
			aggregations: {}
		},

		init: function() {

		},

		onAfterRendering: function() {},

		renderer: function(oRM, oControl) {
			if (oControl.getCardType() === "Pump") {
				oRM.write("<div id='idDynaCardPump'");
				oRM.writeControlData(oControl);
				oRM.writeClasses();
				oRM.write(">");
				oRM.write("</div>");
			} else {
				oRM.write("<div id='idDynaCardSurface'");
				oRM.writeControlData(oControl);
				oRM.writeClasses();
				oRM.write(">");
				oRM.write("</div>");
			}
		},

		setDynaCardData: function(aDynaCardDataParam) {
			var aDynaCardData = $.extend(true, [], aDynaCardDataParam);
			this._oDynaCardData = aDynaCardData;
		},

		getDynaCardData: function() {
			return this._oDynaCardData;
		},

		drawDynaCard: function() {
			jQuery.sap.includeScript(jQuery.sap.getModulePath("com.pdms.og.production_overview", "/js/d3.min.js"), "d3", function() {
				// set the dimensions and margins of the graph
				var margin = {
						top: 20,
						right: 20,
						bottom: 30,
						left: 50
					},
					width = 530 - margin.left - margin.right,
					height = 200 - margin.top - margin.bottom;

				// set the ranges
				var x = d3.scaleLinear().range([0, width]);
				var y = d3.scaleLinear().range([height, 0]);

				// define the line
				var valueline = d3.line()
					.x(function(d) {
						return x(d.date);
					})
					.y(function(d) {
						return y(d.close);
					});
				if (this.getCardType() === "Pump") {
					$("#idDynaCardSurface").remove();
				} else {
					$("#idDynaCardPump").remove();
				}
				// moves the 'group' element to the top left margin
				var svg = d3.select("#idDynaCard" + this.getCardType()).append("svg")
					.attr("width", width + margin.left + margin.right)
					.attr("height", height + margin.top + margin.bottom)

				.append("g")
					.attr("transform",
						"translate(" + margin.left + "," + margin.top + ")");

				// gridlines in x axis function
				function make_x_gridlines() {
					return d3.axisBottom(x)
						.ticks(5);
				}

				// gridlines in y axis function
				function make_y_gridlines() {
					return d3.axisLeft(y)
						.ticks(5);
				}
				var data = this.getDynaCardData();
				// format the data
				data.forEach(function(d) {
					if (this.getCardType() === "Pump") {
						d.close = +d.Load;
						d.date = d.Position + "";
					} else {
						d.close = +d.LoadAtSurface;
						d.date = d.PositionAtSurface + "";
					}
				}.bind(this));

				// Scale the range of the data
				x.domain(d3.extent(data, function(d) {
					return d.date;
				}));
				y.domain([0, d3.max(data, function(d) {
					return d.close;
				})]);

				// add the X gridlines
				svg.append("g")
					.attr("class", "grid")
					.attr("transform", "translate(0," + height + ")")
					.call(make_x_gridlines()
						.tickSize(-height)
						.tickFormat("")
				);

				// add the Y gridlines
				svg.append("g")
					.attr("class", "grid")
					.call(make_y_gridlines()
						.tickSize(-width)
						.tickFormat("")
				);

				// add the valueline path.
				svg.append("path")
					.data([data])
					.attr("class", "line")
					.attr("d", valueline);

				// add the X Axis
				svg.append("g")
					.attr("transform", "translate(0," + height + ")")
					.call(d3.axisBottom(x));

				// add the Y Axis
				svg.append("g")
					.call(d3.axisLeft(y));
			}.bind(this));
		}
	});
});