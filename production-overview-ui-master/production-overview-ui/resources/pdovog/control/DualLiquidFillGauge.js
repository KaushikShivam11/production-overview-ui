jQuery.sap.require("sap/ui/thirdparty/d3");
jQuery.sap.declare("com.pdms.og.production_overview.control.DualLiquidFillGauge");

sap.ui.core.Control.extend("com.pdms.og.production_overview.control.DualLiquidFillGauge", {

	metadata: {
		properties: {
			"id": {
				type: "string"
			},
			"oilUom": {
				type: "string",
				defaultValue: "Bbls"
			},
			"waterUom": {
				type: "string",
				defaultValue: "Bbls"
			},
			"targetOil": {
				type: "float",
				defaultValue: 0
			},
			"targetWater": {
				type: "float",
				defaultValue: 0
			},
			"valueOil": {
				type: "float",
				defaultValue: 0
			},
			"valueWater": {
				type: "float",
				defaultValue: 0
			}
		}
	},
	onInit: function() {

	},

	renderer: function(oRm, oControl) {
		oRm.write("<div id='idDualLiquidGaugeContainer'>");
		oRm.write("<div style='width:50%;float:left;text-align:center;'>");
		oRm.write("<span>" + oControl.getValueOil() + " / " + oControl.getTargetOil() + " Oil</span>");
		oRm.write("<span> " + oControl.getOilUom() + "</span>");
		oRm.write("<svg id='idGaugeOil'");
		oRm.writeClasses(); // there is no class to write, but this enables 
		oRm.write(">");
		oRm.write("</svg>");
		oRm.write("</div>");
		oRm.write("<div style='width:50%;float:left;text-align:center;'>");
		oRm.write("<span>" + oControl.getValueWater() + " / " + oControl.getTargetWater() + " Water</span>");
		oRm.write("<span> " + oControl.getOilUom() + "</span>");
		oRm.write("<svg id='idGaugeWater'");
		oRm.writeClasses(); // there is no class to write, but this enables 
		oRm.write(">");
		oRm.write("</svg>");
		oRm.write("<div>");
		oRm.write("</div>");
	},
	onAfterRendering: function() {
		jQuery.sap.includeScript(jQuery.sap.getModulePath("com.pdms.og.production_overview", "/js/liquidFillGauge.js"), "liquidFillGauge", function() {
			var config1 = {
				minValue: 0, // The gauge minimum value.
				maxValue: 100, // The gauge maximum value.
				circleThickness: 0.05, // The outer circle thickness as a percentage of it's radius.
				circleFillGap: 0.05, // The size of the gap between the outer circle and wave circle as a percentage of the outer circles radius.
				circleColor: "#efcd00", // The color of the outer circle.
				waveHeight: 0.05, // The wave height as a percentage of the radius of the wave circle.
				waveCount: 1, // The number of full waves per width of the wave circle.
				waveRiseTime: 1000, // The amount of time in milliseconds for the wave to rise from 0 to it's final height.
				waveAnimateTime: 1800, // The amount of time in milliseconds for a full wave to enter the wave circle.
				waveRise: false, // Control if the wave should rise from 0 to it's full height, or start at it's full height.
				waveHeightScaling: true, // Controls wave size scaling at low and high fill percentages. When true, wave height reaches it's maximum at 50% fill, and minimum at 0% and 100% fill. This helps to prevent the wave from making the wave circle from appear totally full or empty when near it's minimum or maximum fill.
				waveAnimate: false, // Controls if the wave scrolls or is static.
				waveColor: "#efcd00", // The color of the fill wave.
				waveOffset: 0, // The amount to initially offset the wave. 0 = no offset. 1 = offset of one full wave.
				textVertPosition: .5, // The height at which to display the percentage text withing the wave circle. 0 = bottom, 1 = top.
				textSize: .8, // The relative height of the text to display in the wave circle. 1 = 50%
				valueCountUp: true, // If true, the displayed value counts up from 0 to it's final value upon loading. If false, the final value is displayed.
				displayPercent: true, // If true, a % symbol is displayed after the value.
				textColor: "#000000", // The color of the value text when the wave does not overlap it.
				waveTextColor: "#000000", // The color of the value text when the wave overlaps it.
				visible: "true"
			};
			var valueOil = ((this.getValueOil() / this.getTargetOil()) * 100).toFixed(2)
			loadLiquidFillGauge("idGaugeOil", valueOil, config1);
			var config2 = {
				minValue: 0, // The gauge minimum value.
				maxValue: 100, // The gauge maximum value.
				circleThickness: 0.05, // The outer circle thickness as a percentage of it's radius.
				circleFillGap: 0.05, // The size of the gap between the outer circle and wave circle as a percentage of the outer circles radius.
				circleColor: "#32b0d6", // The color of the outer circle.
				waveHeight: 0.05, // The wave height as a percentage of the radius of the wave circle.
				waveCount: 1, // The number of full waves per width of the wave circle.
				waveRiseTime: 1000, // The amount of time in milliseconds for the wave to rise from 0 to it's final height.
				waveAnimateTime: 1800, // The amount of time in milliseconds for a full wave to enter the wave circle.
				waveRise: false, // Control if the wave should rise from 0 to it's full height, or start at it's full height.
				waveHeightScaling: true, // Controls wave size scaling at low and high fill percentages. When true, wave height reaches it's maximum at 50% fill, and minimum at 0% and 100% fill. This helps to prevent the wave from making the wave circle from appear totally full or empty when near it's minimum or maximum fill.
				waveAnimate: false, // Controls if the wave scrolls or is static.
				waveColor: "#32b0d6 ", // The color of the fill wave.
				waveOffset: 0, // The amount to initially offset the wave. 0 = no offset. 1 = offset of one full wave.
				textVertPosition: .5, // The height at which to display the percentage text withing the wave circle. 0 = bottom, 1 = top.
				textSize: .8, // The relative height of the text to display in the wave circle. 1 = 50%
				valueCountUp: true, // If true, the displayed value counts up from 0 to it's final value upon loading. If false, the final value is displayed.
				displayPercent: true, // If true, a % symbol is displayed after the value.
				textColor: "#000000", // The color of the value text when the wave does not overlap it.
				waveTextColor: "#000000", // The color of the value text when the wave overlaps it.
				visible: "true"
			};
			var valueWater = ((this.getValueWater() / this.getTargetWater()) * 100).toFixed(2)
			loadLiquidFillGauge("idGaugeWater", valueWater, config2);
		}.bind(this));
	}
});