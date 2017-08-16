jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

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
		"com/wedonate/ssc/eng/test/integration/NavigationJourneyPhone",
		"com/wedonate/ssc/eng/test/integration/NotFoundJourneyPhone",
		"com/wedonate/ssc/eng/test/integration/BusyJourneyPhone"
	], function () {
		QUnit.start();
	});
});