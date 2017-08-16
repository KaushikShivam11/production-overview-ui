sap.ui.define([
		"com/pdms/og/production_overview/controller/BaseController"
	], function (BaseController) {
		"use strict";

		return BaseController.extend("com.pdms.og.production_overview.controller.NotFound", {

			/**
			 * Navigates to the home when the link is pressed
			 * @public
			 */
			onLinkPressed : function () {
				this.getRouter().navTo("home");
			}

		});

	}
);