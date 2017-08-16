jQuery.sap.declare("com.pdms.og.production_overview.control");
sap.ui.define([
	"sap/ui/core/Control"
], function(Control) {
	"use strict";

	return Control.extend("com.pdms.og.production_overview.control.ComparisonArcChart", {

		metadata: {
			properties: {
				nomination: {
					type: "float",
					defaultValue: 0
				},
				cdp: {
					type: "float",
					defaultValue: 0
				},
				surplusDeficit: {
					type: "float",
					defaultValue: 0
				}
			}
		},

		init: function() {
			this.sParentId = "";
		},

		renderer: function(oRm, oControl) {
			var oChart = oControl.createChart();
			oRm.write('<svg width="145" height="120"');
			oRm.writeControlData(oChart);
			oRm.writeClasses();
			oRm.write('>');
			oRm.renderControl(oChart);
			oRm.write('</svg>');
		},

		createChart: function() {
			var oChartLayout = new sap.ui.layout.VerticalLayout(),
				oChartFlexBox = new sap.m.VBox();
			this.sParentId = oChartFlexBox.getIdForLabel();
			oChartLayout.addContent(oChartFlexBox);
			return oChartFlexBox;
		},

		onAfterRendering: function() {
			var tau = Math.PI, 
				nom = this.getNomination(),
				cdp = this.getCdp(),
				fPercentage = (cdp / (nom * 2)) * 100,
				sDelta = this.getSurplusDeficit(),
				sCalcText = sDelta >= 0 ? "Surplus" : "Deficit",
				sColor = sDelta >= 0 ? "#60A755" : "#D41F32";
		
			// An arc function with all values bound except the endAngle. So, to compute an
			// SVG path string for a given angle, we pass an object with an endAngle
			// property to the `arc` function, and it will return the corresponding string.
			var arc = d3.svg.arc()
				.innerRadius(30)
				.outerRadius(55)
				.startAngle(0);

			// Get the SVG container, and apply a transform such that the origin is the
			// center of the canvas. This way, we don�t need to position arcs individually.
			var svg = d3.select("#" + this.sParentId),
				width = +svg.attr("width"),
				height = +svg.attr("height"),
				g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + (height / 2 + 30) + ")");

			// Add the background arc, from 0 to 100% (tau).
			g.append("path")
				.datum({
					endAngle: tau
				})
				.style("fill", "#E8E6E6")
				.attr("d", arc).attr("transform", "rotate(-90)");

			// Add the foreground arc in red/green, currently 
			g.append("path")
				.datum({
					endAngle: (fPercentage / 100) * tau
				})
				.style("fill", sColor)
				.attr("d", arc).attr("transform", "rotate(-90)");

			//Nomination line
			svg.append("line")
				.attr("x1", this._getCoordinate(width, height, "x", 56, 50)) //  width * 0.5 = 75
			.attr("y1", this._getCoordinate(width, height, "y", 56, 50))
				.attr("x2", this._getCoordinate(width, height, "x", 30, 50)) //  width * 0.5 = 75
			.attr("y2", this._getCoordinate(width, height, "y", 30, 50))
				.attr("stroke", "black")
				.attr("stroke-width", 1)
				.attr("fill", "none");

			//Nomination Point
			svg.append("circle")
				.attr("cx", this._getCoordinate(width, height, "x", 58, 50))
				.attr("cy", this._getCoordinate(width, height, "y", 58, 50))
				.attr("fill", "#F2D249")
				.attr("r", 2.5);

			//CDP Line
			svg.append("line")
				.attr("x1", this._getCoordinate(width, height, "x", 56, fPercentage)) //  width * 0.5 = 75
			.attr("y1", this._getCoordinate(width, height, "y", 56, fPercentage))
				.attr("x2", this._getCoordinate(width, height, "x", 30, fPercentage)) //  width * 0.5 = 75
			.attr("y2", this._getCoordinate(width, height, "y", 30, fPercentage))
				.attr("stroke", "black")
				.attr("stroke-width", 1)
				.attr("fill", "none");

			//CDP Point
			svg.append("circle")
				.attr("cx", this._getCoordinate(width, height, "x", 58, fPercentage))
				.attr("cy", this._getCoordinate(width, height, "y", 58, fPercentage))
				.attr("fill", "#93B9C7")
				.attr("r", 2.5);

			// Text0 
			svg.append("text")
				.attr("dx", "3em")
				.attr("dy", "10em")
				.style("font-size", "10px")
				.style("text-anchor", "middle")
				.text(function() {
					return "0";
				});

			//Text100
			svg.append("text")
				.attr("dx", "11.5em")
				.attr("dy", "10em")
				.style("font-size", "10px")
				.style("text-anchor", "middle")
				.text(function() {
					return "200";
				});
			
			//Surplus Deficit Delta Value
			svg.append("text")
				.attr("dx", "6.7em")
				.attr("dy", "7.5em")
				.style('font-size', '11px')
				.style('font-weight', 'bold')
				.style('fill', sColor)
				.style("text-anchor", "middle")
				.text(function() { return this._getFormatterValue(Math.abs(sDelta)); }.bind(this));
		
			// Caluclation Text
			svg.append("text")
				.attr("dx", "7.3em")
				.attr("dy", "9.5em")
				.style('font-size', '10px')
				.style("text-anchor", "middle")
				.text(function() { return sCalcText; });
			
			// Legend NOM	
			svg.append("circle")
				.attr("cx", "15")
				.attr("cy", "15")
				.attr("fill", "#F2D249")
				.attr("r", 2.5);
			
			// NOM Value
			svg.append("text")
				.attr("dx", "20")
				.attr("dy", "18.5")
				.style('font-size', '10px')
				.text(function() { return 'NOM '+this._getFormatterValue(nom); }.bind(this));
			
			// Legend CDP Value
			svg.append("circle")
				.attr("cx", "80")
				.attr("cy", "15")
				.attr("fill", "#93B9C7")
				.attr("r", 2.5);
		
			// CDP Value
			svg.append("text")
				.attr("dx", "85")
				.attr("dy", "18.5")
				.style('font-size', '10px')
				.text(function() { return 'CDP '+this._getFormatterValue(cdp); }.bind(this));
		},

		_getCoordinate: function(width, height, axis, radius, percentage) {
			var sPoint = "";
			if (axis === "x") {
				sPoint = Math.round(radius * Math.sin(((percentage / 100) * Math.PI) - (Math.PI / 2)) + (width / 2));
			} else {
				sPoint = Math.round(radius * Math.cos(((percentage / 100) * Math.PI) + (Math.PI / 2)) + (height / 2 + 30));
			}
			return sPoint;
		},
		
		_getFormatterValue: function(value) {
			    var newValue = value;
			    if (value >= 1000) {
			        var precision, suffixes = ["", "k", "m", "b","t"],
			        suffixNum = Math.floor( (""+value).length/3 ),
			        shortNum, shortValue = '';
			        for (precision = 2; precision >= 0; precision--) {
			            shortValue = parseFloat( (suffixNum != 0 ? (value / Math.pow(1000,suffixNum) ) : value).toPrecision(precision));
			            var dotLessShortValue = (shortValue + '').replace(/[^a-zA-Z 0-9]+/g,'');
			            if (dotLessShortValue.length <= 2) { break; }
			        }
			        if (shortValue % 1 !== 0) {
			        	shortNum = shortValue.toFixed(2);
			        }
			        newValue = shortValue+suffixes[suffixNum];
			    }
			    return newValue;
			}
	});
});