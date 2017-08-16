sap.ui.define([], function() {
	"use strict";

	return {
		/**
		 * converts the string to float
		 *
		 * @public
		 * @param {string} sValue value to be formatted
		 * @returns {number} converter value
		 */
		getFloatValue: function(sValue) {
			var nVal = 0;
			if (sValue) {
				nVal = parseFloat(sValue);
			}
			return nVal;
		},

		/**
		 * Returns the Icon URI based on the Severity
		 *
		 * @public
		 * @param {string} sStatus value based on which Icon URI is returned
		 * @returns {string} Icon URI based on severity
		 */
		getIconURI: function(sStatus) {
			if (sStatus === "Closed") {
				return this.mIconURI.success;
			} else if (sStatus === "InProgress") {
				return this.mIconURI.warning;
			} else if (sStatus === "Open") {
				return this.mIconURI.error;
			} else {
				return "";
			}
		},

		/**
		 * Returns the Icon Color based on the Severity
		 *
		 * @public
		 * @param {number} sStatus value based on which Icon color is returned
		 * @returns {string} Icon color based on severity
		 */
		getIconColor: function(sStatus) {
			if (sStatus === "Closed") {
				return this.mIconColor.positive;
			} else if (sStatus === "InProgress") {
				return this.mIconColor.critical;
			} else if (sStatus === "open" || "Open") {
				return this.mIconColor.negative;
			} else {
				return "";
			}
		},
		
		/**
		 * Rounds the currency value to 2 digits
		 *
		 * @public
		 * @param {string} sValue value to be formatted
		 * @returns {string} formatted currency value with 2 digits
		 */
		getFloat: function(sString) {
			var nNumber;
			if (sString) {
				nNumber = parseFloat(sString);
			} else {
				nNumber = 0;
			}
			return nNumber;
		},
		getRunningStatus:function(nStatus){
			var sStatus;
			if (nStatus == 1){
				sStatus = "On";
			}
			else{
				sStatus = "Off";
			}
			return sStatus;
			
		}
	};
});