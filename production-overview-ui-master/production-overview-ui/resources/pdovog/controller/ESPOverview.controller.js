sap.ui.define([
	"com/pdms/og/production_overview/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"com/pdms/og/production_overview/model/formatter",
	"sap/ui/vk/ContentResource",
	"sap/ui/core/routing/History",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function(BaseController, JSONModel, formatter, ContentResource, History, Filter, FilterOperator) {
	"use strict";

	return BaseController.extend("com.pdms.og.production_overview.controller.ESPOverview", {
		formatter: formatter,
		oVizFrame: null,
		onInit: function() {
			var oViewModel = new JSONModel( {
				"ProductionData": [],
				"ProductionMonitoringData": [],
				"logo": jQuery.sap.getModulePath('sap.ui.core', '/') + 'mimes/logo/sap_50x26.png',
				"ThingId": "",
				"Timestamp": "",
				"PumpManu": "",
				"PumpModel": "",
				"PumpRunningStatus": "",
				"InstallationDate": "",
				"ThingName": ""
			});
			this.setModel(oViewModel, "viewData");
			this.getRouter().getRoute("ESPPump").attachPatternMatched(this._onRouteMatched, this);
			var oVizFrame = this.oVizFrame = this.byId("idVizFrame");
			oVizFrame.setVizProperties({
				title: {
					text: "Water Cut",
					visible: true,
					style: {
						fontWeight: "normal",
						fontSize: "16px",
						color: "#666666"
					}
				},
				plotArea:{
					dataLabel:{
						visible: true,
						distance: "-1px"
					}
				}
			});
		},

		onPressIcon: function(oEvent) {
			this.getView().setBusy(true);
			var oPopover;
			var oIcon = oEvent.getSource();
			if (!this.oPopover) {
				this.oPopover = sap.ui.xmlfragment("popChartId", "com.pdms.og.production_overview.fragment.ProductionPopover");
				this.getView().addDependent(oPopover);
			}
			jQuery.sap.delayedCall(0, this, function() {
				this.oPopover.openBy(oIcon);
			});
			this._getProductionPopoverData();
			var oVizFramefrag = sap.ui.core.Fragment.byId("popChartId", "idVizFramefrag");
			oVizFramefrag.setVizProperties({
				title: {
					text: oEvent.getSource().getParent().getParent().getItems()[0].getText()
				}
			});
		},

		_getProductionPopoverData: function() {
			var endDate = this.getModel("viewData").getProperty("/Timestamp"),
				datechange,
				aFilters = [],
				startDate, dateFilter;
			datechange = new Date(endDate);
			datechange.setDate(datechange.getDate() - 5);
			startDate = datechange.toISOString();
			dateFilter = new Filter("Timestamp", FilterOperator.BT, startDate, endDate);
			aFilters.push(dateFilter);
			this.getView().getModel().read(
				"/ESPOverview", {
					filters: aFilters,
					success: this._onProductionPopoverReadSuccess.bind(this),
					error: this._onProductionPopoverReadError.bind(this)
				});
		},

		_onProductionPopoverReadSuccess: function(oData) {
			this.getView().setBusy(false);
			var oModel = new sap.ui.model.json.JSONModel(oData);
			this.oPopover.setModel(oModel);
		},

		_onProductionPopoverReadError: function() {
			this.getView().setBusy(false);
		},

		onAfterRendering: function() {

		},

		_onRouteMatched: function(oEvent) {
			var oArgs = oEvent.getParameter("arguments"),
				sThingId = oArgs.ThingId,
				sTimestamp = oArgs.Timestamp,
				oViewModel = this.getModel("viewData");
				var contentResource = new ContentResource({
				source: jQuery.sap.getModulePath("com.pdms.og.production_overview", "/model/ESPFINAL.vds"),
				sourceType: "vds",
				id: "cr"
			});
			var oViewer = this.byId("viewer");
			oViewer.addContentResource(contentResource);
			oViewModel.setProperty("/ThingId", sThingId);
			oViewModel.setProperty("/Timestamp", sTimestamp);
			this.getBusyDialog().open();
			var oESPDetailModel = new JSONModel();
			oESPDetailModel.loadData("/api/pdms/og/core/svc/OGCoreServices.xsodata/ESPPumpData?$filter=Thing eq '" + sThingId +
				"' and Timestamp eq '" + sTimestamp + "'");
			oESPDetailModel.attachRequestCompleted(this._onReadProdDataSuccess, this);
			oESPDetailModel.attachRequestFailed(this._onReadProdDataError, this);
		},

		_onReadProdDataSuccess: function(oEvent) {
			this.getBusyDialog().close();
			var oData = oEvent.getSource().getData(),
				aProdData, aResData = oData.d.results,
				oViewModel = this.getModel("viewData");
			oViewModel.setProperty("/ProductionMonitoringData", [aResData[0]]);
			aProdData = [{
				"Store Name": "24-Seven",
				"Revenue": aResData[0].WaterCut
			}, {
				"Store Name": "A&A",
				"Revenue": 100 - Number(aResData[0].WaterCut)
			}];
			oViewModel.setProperty("/ProductionData", aProdData);
			oViewModel.setProperty("/PumpManu", this._isNull(aResData[0].PumpManufacturer));
			oViewModel.setProperty("/PumpModel", this._isNull(aResData[0].PumpModel));
			oViewModel.setProperty("/PumpRunningStatus", aResData[0].MotorStatus);
			var sDateIns = aResData[0].InstallationDate;	
			var oDateIns = Date.parse(sDateIns.replace(/-/g,"/"));
			oDateIns = new Date(oDateIns);
			oViewModel.setProperty("/InstallationDate", this._isNull(oDateIns.toDateString()));
			oViewModel.setProperty("/WellName", this._isNull(aResData[0].WellName));
			oViewModel.setProperty("/ThingName", this._isNull(aResData[0].ThingName));
			oViewModel.setProperty("/AlertStatus", aResData[0].AlertStatus);
			var oDate = aResData[0].AlertStartDate;
			var oAlertStartDate = eval("new " + oDate.replace(/\//g, ""));
			oViewModel.setProperty("/AlertStartDate", this._isNull(oAlertStartDate.toDateString()));
			oViewModel.setProperty("/PumpDescription", this._isNull(aResData[0].PumpDescription));
		},

		_onReadProdDataError: function() {
			this.getBusyDialog().close();
		},
		/**
		 * Opens up an action sheet displaying Log Off button
		 * @param {sap.ui.base.Event} oEvent the press event
		 * @public
		 */

		_isNull: function(val) {
			return val !== null ? val : "";
		},

		onUserItemPressed: function(oEvent) {
			var oButton = oEvent.getSource();
			if (!this._userActionSheet) {
				this._userActionSheet = sap.ui.xmlfragment('com.pdms.og.rodpumpoverview.fragment.UserPreference', this);
				this.getView().addDependent(this._userActionSheet);
			}
			this._userActionSheet.openBy(oButton);
		},
		
		onCreatePMNotification: function() {
			window.location = "/app/ahcc/index.html#/FactSheet/" + this.getModel("viewData").getProperty("/ThingId");
		},
		
		onEmailPress: function() {

			var oViewModel = this.getModel("viewData"),
				sSubject, oBody;
			sSubject = oViewModel.getProperty("/ThingName") + ":" + oViewModel.getProperty("/PumpDescription");
			oBody = "Well Name:" + oViewModel.getProperty("/WellName") + "\n" + "Manufacturer:" + oViewModel.getProperty(
				"/PumpManu") + "\n" + "Model:" + oViewModel.getProperty("/PumpModel") + "\n" + "Installation Date:" + this.getModel(
				"viewData").getProperty("/InstallationDate");
			sap.m.URLHelper.triggerEmail("", sSubject, oBody);
		},

		/**
		 *Logs off the user form the application and navigates back to login screen (XSUAA)
		 * @public
		 */
		onLogoffPress: function() {
			window.location.replace('/logout');
		}
	});
});