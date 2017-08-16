jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

// We cannot provide stable mock data out of the template.
// If you introduce mock data, by adding .json files in your webapp/localService/mockdata folder you have to provide the following minimum data:
// * At least 3 Categories in the list
// * All 3 Categories have at least one Products

sap.ui.require([
	"sap/ui/test/Opa5",
	"com/wedonate/ssc/eng/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"com/wedonate/ssc/eng/test/integration/pages/App",
	"com/wedonate/ssc/eng/test/integration/pages/Browser",
	"com/wedonate/ssc/eng/test/integration/pages/Master",
	"com/wedonate/ssc/eng/test/integration/pages/Detail",
	"com/wedonate/ssc/eng/test/integration/pages/NotFound"
], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "com.wedonate.ssc.eng.view."
	});

	sap.ui.require([
		"com/wedonate/ssc/eng/test/integration/MasterJourney",
		"com/wedonate/ssc/eng/test/integration/NavigationJourney",
		"com/wedonate/ssc/eng/test/integration/NotFoundJourney",
		"com/wedonate/ssc/eng/test/integration/BusyJourney",
		"com/wedonate/ssc/eng/test/integration/FLPIntegrationJourney"
	], function () {
		QUnit.start();
	});
});