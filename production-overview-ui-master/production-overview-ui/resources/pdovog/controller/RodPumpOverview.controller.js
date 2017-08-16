sap.ui.define([
	"com/pdms/og/production_overview/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/vk/ContentResource",
	"com/pdms/og/production_overview/model/formatter",
	"com/pdms/og/production_overview/control/DynaCard",
	"sap/ui/model/Sorter",
	"sap/ui/core/routing/History",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function(BaseController, JSONModel, ContentResource, formatter, DynaCard, Sorter, History, Filter, FilterOperator) {
	"use strict";

	return BaseController.extend("com.pdms.og.production_overview.controller.RodPumpOverview", {

		formatter: formatter,

		_aFilters: [],

		_oIcon: null,

		_sVDSSource: "",

		_mVDSComps: {
			"sucker rod oil rig:1": "iffffffff00931118",
			"oil rig assembly plunger:1": "iffffffff0092ffd8",
			"oil rig assembly1:1": "iffffffff009304a8",
			"Casing:1_cut": "iffffffff00931718",
			"Wellhead": "iffffffff00927de8",
			"Small_Support": "iffffffff009242c8",
			"Casing:1": "iffffffff00931448"
		},

		onInit: function() {
			var oModel = new sap.ui.model.json.JSONModel({
				"dynaCardType": "Pump",
				"logo": jQuery.sap.getModulePath('sap.ui.core', '/') + 'mimes/logo/sap_50x26.png',
				"ProductionMonitoringData": [],
				"PopoverChartData": [],
				"PumpManu": "",
				"PumpModel": "",
				"PumpRunningStatus": "",
				"InstallationDate": "",
				"ThingName": "",
				"PopoverTitle": "",
				"AlertStartDate": "",
				"WellName": "",
				"AlertStatus": "",
				"AlertDescription": ""
			});
			this.setModel(oModel, "viewData");
			this.getRouter().getRoute("RodPump").attachPatternMatched(this._onRouteMatched, this);
		},

		_onRouteMatched: function(oEvent) {
			var oArgs = oEvent.getParameter("arguments"),
				sThingId = oArgs.ThingId,
				sTimestamp = oArgs.Timestamp;
			this.getModel("viewData").setProperty("/ThingId", sThingId);
			this.getModel("viewData").setProperty("/Timestamp", sTimestamp);
			this.getBusyDialog().open();
			var oRodDetailModel = new JSONModel();
			oRodDetailModel.attachRequestCompleted(this._onReadProdDataSuccess, this);
			oRodDetailModel.attachRequestFailed(this._onReadProdDataError, this);
			oRodDetailModel.loadData("/api/pdms/og/core/svc/OGCoreServices.xsodata/RodPumpData?$filter=Thing eq '" + sThingId +
				"' and AlertStartDate eq '" + sTimestamp + "'");
		},

		_onReadProdDataSuccess: function(oEvent) {
			this.getBusyDialog().close();
			var oData = oEvent.getSource().getData(),
				aResData = oData.d.results, oViewModel= this.getModel("viewData");
			 
			if (aResData.length > 0) {
				oViewModel.setProperty("/ProductionMonitoringData", [aResData[0]]);
				oViewModel.setProperty("/PumpManu", this._isNull(aResData[0].PumpManufacturer));
				oViewModel.setProperty("/PumpModel", this._isNull(aResData[0].PumpModel));
				oViewModel.setProperty("/PumpRunningStatus", aResData[0].PumpRunningStatus);
				var sDateIns = aResData[0].InstallationDate;	
				var oDateIns = Date.parse(sDateIns.replace(/-/g,"/"));
				oDateIns = new Date(oDateIns);
				oViewModel.setProperty("/InstallationDate", this._isNull(oDateIns.toDateString()));
				oViewModel.setProperty("/ThingName", this._isNull(aResData[0].ThingName));
				var oDate = aResData[0].AlertStartDate;
				var oAlertStartDate = eval("new " + oDate.replace(/\//g, ""));
				oViewModel.setProperty("/AlertStartDate", oAlertStartDate.toDateString());
				oViewModel.setProperty("/AlertStatus", aResData[0].AlertStatus);
				oViewModel.setProperty("/AlertDescription", this._isNull(aResData[0].AlertDescription));
				oViewModel.setProperty("/WellName", this._isNull(aResData[0].WellName));
				this._sVDSSource = aResData[0].Source;
			}
			this._fnGetDynaCard("Pump");
			this.getView().setBusy(true);
			this._fnLoadVDS();
		},

		_isNull: function(val) {
			return val !== null ? val : "";
		},

		_fnLoadVDS: function() {
			var contentResource = new ContentResource({
				source: jQuery.sap.getModulePath("com.pdms.og.production_overview", "/model/OILWER.vds"),
				sourceType: "vds",
				id: "cr"
			});
			var oViewer = this.byId("RodViewer");
			oViewer.addContentResource(contentResource);
		},

		_onReadProdDataError: function() {
			this.getView().setBusy(false);
			this._fnGetDynaCard("Pump");
		},

		onCreatePMNotification: function() {
			window.location = "/app/ahcc/index.html#/FactSheet/" + this.getModel("viewData").getProperty("/ThingId");
		},

		onIconPress: function(oEvent) {
			this._oIcon = oEvent.getSource();
			this._getProductionPopoverData();
			this.getModel("viewData").setProperty("/PopoverTitle", oEvent.getSource().getParent().getParent().getItems()[0].getText());
		},
		onEmailPress: function(oEvent) {
			var sSubject = this.getModel("viewData").getProperty("/ThingName") + ":" + this.getModel("viewData").getProperty("/AlertDescription"),
				oBody = "Well Name:" + this.getModel("viewData").getProperty("/WellName") + "\n" + "Manufacturer:" + this.getModel("viewData").getProperty(
					"/PumpManu") + "\n" + "Model:" + this.getModel("viewData").getProperty("/PumpModel") + "\n" + "Installation Date:" + this.getModel(
					"viewData").getProperty("/InstallationDate");
			sap.m.URLHelper.triggerEmail("", sSubject, oBody);
		},

		_getProductionPopoverData: function() {
			var endDate = this.getModel("viewData").getProperty("/Timestamp"),
				startDate, datechange, oDtFormat;
			datechange = new Date(endDate);
			datechange.setDate(datechange.getDate() - 5);
			oDtFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
				pattern: "yyyy-MM-ddTHH:mm:ss"
			});
			startDate = oDtFormat.format(datechange, true) + "." + datechange.getMilliseconds();
			/*
			dateFilter = new Filter("AlertStartDate", FilterOperator.BT, startDate, endDate);
			aFilters.push(dateFilter);*/
			this.getView().setBusy(true);
			var popoverDataModel = new JSONModel();
			popoverDataModel.loadData(
				"/api/pdms/og/core/svc/OGCoreServices.xsodata/RodPumpData?$filter=(AlertStartDate ge '" + startDate +
				"' and AlertStartDate le '" + endDate + "')");
			popoverDataModel.attachRequestCompleted(this._onProductionPopoverReadSuccess, this);
			popoverDataModel.attachRequestFailed(this._onProductionPopoverReadError, this);
			/*this.getView().getModel().read(
				"/RodPumpData", {
					filters: aFilters,
					success: this._onProductionPopoverReadSuccess.bind(this),
					error: this._onProductionPopoverReadError.bind(this)
				});*/
		},

		_onProductionPopoverReadSuccess: function(oEvent) {
			this.getView().setBusy(false);
			var i, sChartType, aChartData = [],
				oData = oEvent.getSource().getData(),
				oRespData = oData.d.results,
				oViewModel = this.getModel("viewData");
			sChartType = oViewModel.getProperty("/PopoverTitle");
			for (i = 0; i < oRespData.length; i++) {
				var oAlertStartDate, oDate;
				if (oRespData[i].AlertStartDate) {
					oDate = oRespData[i].AlertStartDate;
					oAlertStartDate = eval("new " + oDate.replace(/\//g, ""));
				}
				var oChartObj = {};
				if (sChartType === "Load Cell") {
					oChartObj.Timestamp = oAlertStartDate ? oAlertStartDate.getDate() : "";
					oChartObj.Parameter = oRespData[i].LoadAtSurfaceLevel;
				} else {
					oChartObj.Timestamp = oAlertStartDate ? oAlertStartDate.getDate() : "";
					oChartObj.Parameter = oRespData[i].StrokesPerMinute;
				}
				aChartData.push(oChartObj);
			}
			oViewModel.setProperty("/PopoverChartData", aChartData);
			jQuery.sap.delayedCall(50, this, function() {
				this._getChartPopover().openBy(this._oIcon);
			});
		},

		_onProductionPopoverReadError: function() {
			this.getView().setBusy(false);
		},

		onBeforeRendering: function() {},

		onDynaCardTypeChange: function(oEvent) {
			var sKey = oEvent.getParameter("selectedItem").getKey();
			this._sCardType = sKey;
			this.getView().setBusy(true);
			this._fnGetDynaCard(sKey);
		},

		_fnGetDynaCard: function(sCardType) {
			var /*oTimeStampSorter, oThingFilter, oTimestampFilter, aFilters = [], aSorters = [],*/
				sThingId = this.getModel("viewData").getProperty("/ThingId"),
				sTimestamp = this.getModel("viewData").getProperty("/Timestamp");
			/*oTimeStampSorter = new Sorter("Timestamp", true);
			aSorters.push(oTimeStampSorter);
			oThingFilter = new Filter("Thing", FilterOperator.EQ, sThingId);
			oTimestampFilter = new Filter("Timestamp", FilterOperator.EQ, sTimestamp);
			aFilters.push(oThingFilter);
			aFilters.push(oTimestampFilter);*/
			if (sCardType === "Surface") {
				var odynaSurfaceCardDataModel = new JSONModel();
				this.getView().setBusy(true);
				odynaSurfaceCardDataModel.loadData("/api/pdms/og/core/svc/SurfaceDataService.xsjs", {
					"thing": sThingId,
					"timestamp": sTimestamp
				});
				odynaSurfaceCardDataModel.attachRequestCompleted(this._surfaceDataSuccess, this);
				odynaSurfaceCardDataModel.attachRequestFailed(this._surfaceDataFailure, this);
			} else {
				var odynaPumpCardDataModel = new JSONModel();
				this.getView().setBusy(true);
				odynaPumpCardDataModel.loadData("/api/pdms/og/core/svc/PumpDataService.xsjs", {
					"thing": sThingId,
					"timestamp": sTimestamp
				});
				odynaPumpCardDataModel.attachRequestCompleted(this._pumpDataSuccess, this);
				odynaPumpCardDataModel.attachRequestFailed(this._pumpDataFailure, this);
			}
			/*this.getModel("ControllerDataModel").read("/" + sCardType, {
				//filters: aFilters,
				sorters: aSorters,
				success: this._onGetDynaCardDataSuccess.bind(this),
				error: this._onGetDynaCardDataError.bind(this)
			});*/
		},

		_surfaceDataSuccess: function(oEvent) {
			this.getView().setBusy(false);
			var surfaceData = oEvent.getSource().getData();
			var oControl, oDynaContainer = this.byId("idDynacardLayout");
			oControl = new DynaCard({
				cardType: this._sCardType
			});
			oControl.setDynaCardData(surfaceData.EX_SURFACE_DATA);
			jQuery.sap.delayedCall(0, this, function() {
				oControl.drawDynaCard();
			});
			oDynaContainer.addContent(oControl);
		},

		_surfaceDataFailure: function() {
			this.getView().setBusy(false);
		},

		_pumpDataSuccess: function(oEvent) {
			this.getView().setBusy(false);
			var pumpData = oEvent.getSource().getData();
			var oControl, oDynaContainer = this.byId("idDynacardLayout");
			oControl = new DynaCard({
				cardType: this._sCardType
			});
			oControl.setDynaCardData(pumpData.EX_PUMP_DATA);
			jQuery.sap.delayedCall(0, this, function() {
				oControl.drawDynaCard();
			});
			oDynaContainer.addContent(oControl);
		},

		_pumpDataFailure: function() {
			this.getView().setBusy(false);
		},

		_onGetDynaCardDataSuccess: function(oData) {
			this.getView().setBusy(false);
			var oControl, oDynaContainer = this.byId("idDynacardLayout");
			oControl = new DynaCard({
				cardType: this._sCardType
			});
			oControl.setDynaCardData(oData.results);
			jQuery.sap.delayedCall(0, this, function() {
				oControl.drawDynaCard();
			});
			oDynaContainer.addContent(oControl);
		},

		_onGetDynaCardDataError: function(oError) {
			this.getView().setBusy(false);
		},
		/**
		 * Opens up an action sheet displaying Log Off button
		 * @param {sap.ui.base.Event} oEvent the press event
		 * @public
		 */
		onUserItemPressed: function(oEvent) {
			var oButton = oEvent.getSource();
			if (!this._userActionSheet) {
				this._userActionSheet = sap.ui.xmlfragment('com.pdms.og.production_overview.fragment.UserPreference', this);
				this.getView().addDependent(this._userActionSheet);
			}
			this._userActionSheet.openBy(oButton);
		},

		/**
		 *Logs off the user form the application and navigates back to login screen (XSUAA)
		 * @public
		 */
		onLogoffPress: function() {
			window.location.replace('/logout');
		},

		_getChartPopover: function() {
			if (!this._oPopover) {
				this._oPopover = sap.ui.xmlfragment("com.pdms.og.production_overview.fragment.MonitoringPopover");
				this.getView().addDependent(this._oPopover);
			}
			return this._oPopover;
		},

		onSceneLoadSuccess: function(oEvent) {
			var oViewer = oEvent.getSource();
			var defaultNodeH = oViewer.getScene().getDefaultNodeHierarchy();
			var sNodeID = this._mVDSComps[this._sVDSSource];
			var CasingNodeID = this._mVDSComps["Casing:1"];
			var nodeProxy = defaultNodeH.createNodeProxy(sNodeID);
			var nodeProxy2 = defaultNodeH.createNodeProxy(CasingNodeID);
			nodeProxy2.setOpacity(0.0);
			nodeProxy.setTintColorABGR(4278190335);
		}
	});
});