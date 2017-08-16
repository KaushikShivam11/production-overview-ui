sap.ui.define([
	"com/pdms/og/production_overview/controller/BaseController",
	"com/pdms/og/production_overview/model/formatter",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast",
	"sap/ui/core/routing/History",
	"sap/ui/model/Sorter"
], function(BaseController, formatter, JSONModel, Filter, FilterOperator, MessageToast, History, Sorter) {
	"use strict";

	return BaseController.extend("com.pdms.og.production_overview.controller.Home", {
		// Formatter object
		formatter: formatter,

		_oVizFrame: null,

		_oUpdateInterval: null,

		_bIsSelectionUserInteractive: true,

		_iRefreshInterval: 120000,

		// Map for Icon URI's to be used in formatter for Intervention Icon source
		mIconURI: {
			"success": "sap-icon://status-completed",
			"error": "sap-icon://status-error",
			"warning": "sap-icon://status-in-process"
		},

		// Map for Icon Color's to be used in formatter for Intervention Icon coloring
		mIconColor: {
			"positive": "Positive",
			"critical": "Critical",
			"negative": "Negative"
		},

		mPumpTypes: {
			"RodPump": "com.sap.pdms.og:RodPump",
			"ESP": "com.sap.pdms.og:ElectricSubmersiblePump"
		},

		_aInterventionStatuses: [{
			"Key": "All",
			"Status": "All"
		}, {
			"Key": "Open",
			"Status": "Open"
		}, {
			"Key": "InProgress",
			"Status": "In Progress"
		}, {
			"Key": "Closed",
			"Status": "Closed"
		}],

		_oGeoFilter: null,

		onInit: function() {
			var oViewModel;
			// Model used to manipulate control states
			oViewModel = new JSONModel({
				NoOfInterventions: "0",
				InterventionStatus: "All",
				Geography: [],
				EventTypes: this._aInterventionStatuses,
				ProdCmtmntPeriod: "Month",
				AssetType: this.mPumpTypes.RodPump,
				LastUpdatedTime: "",
				logo: jQuery.sap.getModulePath("sap.ui.core", "/") + "mimes/logo/sap_50x26.png",
				SalesMarketing: [],
				CummulativeProdOil: [],
				YesterdayProdOil: [],
				InstantRateProdOil: [],
				CummulativeProdGas: [],
				YesterdayProdGas: [],
				InstantRateProdGas: [],
				ProductionCommitment: []
			});
			this.setModel(oViewModel, "viewData");
			this._oUpdateInterval = setInterval(this._getProdOverviewData.bind(this), this._iRefreshInterval);
			this.getRouter().getRoute("Home").attachPatternMatched(this._onRouteMatched, this);
		},

		onDestroy: function() {
			clearInterval(this._oUpdateInterval);
		},

		onAfterRendering: function() {
			this._fnRefreshLastUpdated();
		},

		/**
		 * Triggered by the list's 'updateFinished' event: after new list
		 * data is available, this handler method updates the list counter.
		 * This should only happen if the update was successful, which is
		 * why this handler is attached to 'updateFinished' and not to the
		 * list binding's 'dataReceived' method.
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onInterventionsUpdateFinished: function(oEvent) {
			// update the project's object counter after the table update
			var oList = oEvent.getSource(),
				iTotalItems = oEvent.getParameter("total");
			// only update the counter if the length is final
			if (iTotalItems && oList.getBinding("items").isLengthFinal()) {
				this.getModel("viewData").setProperty("/NoOfInterventions", iTotalItems);
			} else {
				this.getModel("viewData").setProperty("/NoOfInterventions", "0");
			}
		},

		/**
		 * Interventions list is filtered based on the value selected in the status combo box
		 * @param {sap.ui.base.Event} oEvent the change event
		 * @public
		 */
		onFilterInteventions: function(oEvent) {
			var sSelectedKey = oEvent.getParameter("selectedItem").getKey();
			this.getModel("viewData").setProperty("/InterventionStatus", sSelectedKey.trim());
			this._getInterventionsData();
		},

		/**
		 * Navigates to AHFS (Asset Health Fact Sheet) after setting thing and timestamp into AHCC "config" model
		 * @param {sap.ui.base.Event} oEvent the press event
		 * @public
		 */
		onInterventionPress: function(oEvent) {
			clearInterval(this._oUpdateInterval);
			var sThingId, oTimestamp, oDtFormat, oNavObj, sTimestamp,
				oBindingCtx = oEvent.getSource().getBindingContext();
			sThingId = oBindingCtx.getProperty("ThingId");
			oTimestamp = oBindingCtx.getProperty("Timestamp");
			oDtFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
				pattern: "yyyy-MM-ddTHH:mm:ss"
			});
			sTimestamp = oDtFormat.format(oTimestamp, true) + "." + oTimestamp.getMilliseconds();
			oNavObj = {
				ThingId : sThingId,
				Timestamp : sTimestamp
			};
			if (oBindingCtx.getProperty("ThingType") === this.mPumpTypes.RodPump) {
				this.getRouter().navTo("RodPump", oNavObj);
			} else{
				this.getRouter().navTo("ESPPump", oNavObj);
			}
		},

		/**
		 * Displays a Dialog with geography tree and provides node selection option
		 * @public
		 */
		onShowGeographyValueHelp: function() {
			if (this._fnGetGeoTreeTable()) {
				this._fnGetGeoTreeTable().getBinding("rows").refresh(true);
			}
			this._getGeographyValueHelpDialog().open();
		},

		/**
		 * Populates the geography input with the selected node from the dialog
		 * @public
		 */
		onConfirmGeographySelect: function() {
			var i, oGeoFilter, aGeoFilter = [],
				aSelectedGeos = [],
				oSelectedGeoCtx, aSelectedIndices, oGeoTreeTable = this.getFragmentControl(this._getGeographyValueHelpDialogId(),
					"poTreeTableGeography");
			aSelectedIndices = oGeoTreeTable.getSelectedIndices();
			for (i = 0; i < aSelectedIndices.length; i++) {
				var oSelectedGeo = {};
				oSelectedGeoCtx = oGeoTreeTable.getContextByIndex(aSelectedIndices[i]);
				oSelectedGeo.OrgUnitName = oSelectedGeoCtx.getProperty("OrgUnitName");
				oSelectedGeo.OrgUnitID = oSelectedGeoCtx.getProperty("OrgUnitID");
				aSelectedGeos.push(oSelectedGeo);
				oGeoFilter = new Filter("OrgUnitID", FilterOperator.EQ, oSelectedGeo.OrgUnitID);
				aGeoFilter.push(oGeoFilter);
			}
			this._oGeoFilter = new Filter(aGeoFilter, false);
			this.getModel("viewData").setProperty("/Geography", aSelectedGeos);
			this._getGeographyValueHelpDialog().close();
			this._getProdOverviewData();
		},

		/**
		 * Filters the OVP content based on the Token update
		 * @param {sap.ui.base.Event} oEvent the update token event
		 * @public
		 */
		onGeoTokenUpdate: function(oEvent) {
			var i, sUpdateType = oEvent.getParameter("type"),
				oViewModel = this.getModel("viewData"),
				aGeography = oViewModel.getProperty("/Geography");
			if (sUpdateType === "removed") {
				var oRemovedToken = oEvent.getParameter("removedTokens")[0];
				for (i = 0; i < aGeography.length; i++) {
					if (aGeography[i].OrgUnitID === oRemovedToken.getKey()) {
						aGeography.splice(i, 1);
						this._oGeoFilter.aFilters.splice(i, 1);
					}
				}
				oViewModel.setProperty("/Geography", aGeography);
				this._getProdOverviewData();
			}
		},

		onGeoSelectionChange: function(oEvent) {
			if (this._bIsSelectionUserInteractive) {
				var oGeoTreeTable = oEvent.getSource(),
					iRowIndex = oEvent.getParameter("rowIndex"),
					bIsRowSelected = oGeoTreeTable.isIndexSelected(iRowIndex);
				if (bIsRowSelected) {
					this._fnHandleGeoTreeSelections(iRowIndex);
				} else {
					this._fnHandleGeoTreeNodeDeSelections(iRowIndex);
					this._fnHandleGeoTreeParentDeSelections(iRowIndex);
				}
			}
		},

		onToggleGeoNodes: function(oEvent) {
			var oGeoTreeTable = oEvent.getSource(),
				iRowIndex = oEvent.getParameter("rowIndex"),
				bIsRowSelected = oGeoTreeTable.isIndexSelected(iRowIndex);
			if (oEvent.getParameter("expanded") && bIsRowSelected) {
				this._iExpandRowIndex = iRowIndex;
				jQuery.sap.delayedCall(50, this, function() {
					this._fnHandleGeoTreeSelections(this._iExpandRowIndex);
				});
				// Attach data received event to update the tree table selections
				this._fnGetGeoTreeTable().getBinding("rows").attachEventOnce("dataReceived", this._fnHandleExpandSelection, this);
			}
		},

		/**
		 * Closes the geography value help dialog
		 * @public
		 */
		OnCancelGeographySelect: function() {
			this._getGeographyValueHelpDialog().close();
		},

		/**
		 * Updates the Production Commitment chart data with respect to selected date range
		 * @public
		 */
		onProductionPeriodChange: function() {
			this._renderChart();
			this._getProductionCommitmentData(true);
		},

		/**
		 * Opens up an action sheet displaying Log Off button
		 * @param {sap.ui.base.Event} oEvent the press event
		 * @public
		 */
		onUserItemPressed: function(oEvent) {
			var oButton = oEvent.getSource();
			if (!this._userActionSheet) {
				this._userActionSheet = sap.ui.xmlfragment("com.pdms.og.production_overview.fragment.UserPreference", this);
				this.getView().addDependent(this._userActionSheet);
			}
			this._userActionSheet.openBy(oButton);
		},

		/**
		 *Logs off the user form the application and navigates back to login screen (XSUAA)
		 * @public
		 */
		onLogoffPress: function() {
			window.location.replace("/logout");
		},

		/**
		 * Navigates back to the PdMS Launchpad
		 * @public
		 */
		onBackNav: function() {
			var sPreviousHash = History.getInstance().getPreviousHash();
			if (sPreviousHash !== undefined) {
				history.go(-1);
			} else {
				window.location = "/app/launchpad/";
			}
		},

		onAssetTypeChange: function() {
			this._getProdOverviewData();
		},

		/**
		 * Filters the entire page based the assettype and geography selected
		 * @public
		 */
		onFilterBarGoPress: function() {
			this._getProdOverviewData();
		},

		onChartRenderComplete: function() {
			var i, j, oAxisLabel, aAxisLabels = $(".v-axis-label-wrapper"),
				oCurrentDate = new Date();
			if (this.getModel("viewData").getProperty("/ProdCmtmntPeriod") === "Month") {
				var oCurrentDateText = this._getPlotDate(oCurrentDate);
				for (i = 0; i < aAxisLabels.length; i++) {
					oAxisLabel = $(aAxisLabels[i]);
					if (oCurrentDateText === oAxisLabel.text()) {
						oAxisLabel.css("font-weight", "bold").css("font-size", "14px");
					}
				}
			} else {
				var oCurrentHour = oCurrentDate.getHours() > 9 ? "" + oCurrentDate.getHours() : "0" + oCurrentDate.getHours();
				for (i = 0; i < aAxisLabels.length; i++) {
					oAxisLabel = $(aAxisLabels[i]);
					if (oCurrentHour === oAxisLabel.text()) {
						oAxisLabel.css("font-weight", "bold").css("font-size", "14px");
					}
				}
			}
			for (j = 0; j < 30; j++) {
				this._oVizFrame.zoom({
					direction: "out"
				});
			}
		},

		//********************* Private Methods *******************************//

		_onRouteMatched: function() {
			this._renderChart();
			this._getProdOverviewData();
		},

		_fnRefreshLastUpdated: function() {
			var sTime, oDate = new Date();
			sTime = oDate.toLocaleTimeString();
			this.getModel("viewData").setProperty("/LastUpdatedTime", sTime);
		},

		_getProdOverviewData: function() {
			var oModel = this.getModel();
			oModel.setDeferredGroups(["poHomeBatchGroupId"]);
			this._getInterventionsData();
			this._getSalesMarketingData();
			this._getProductionData();
			this._getProductionCommitmentData(false);
			this.getBusyDialog().open();

			//submit batch requests
			oModel.submitChanges({
				success: this._onReadHomeSuccess.bind(this),
				error: this._onReadHomeError.bind(this),
				batchGroupId: "poHomeBatchGroupId"
			});
		},

		_getInterventionsData: function() {
			var oGeoTypeFilter, oAssetFilter, oPriorDayProdSorter, aInterventionSorters = [],
				aInterventionFilters = [],
				oViewModel = this.getModel("viewData");
			oAssetFilter = new Filter("ThingType", FilterOperator.EQ, oViewModel.getProperty("/AssetType"));
			aInterventionFilters.push(oAssetFilter);
			if (oViewModel.getProperty("/Geography").length > 0) {
				aInterventionFilters.push(this._oGeoFilter);
			}
			oGeoTypeFilter = new Filter("OrgUnitType", FilterOperator.EQ, "com.sap.pdms.og:Well");
			aInterventionFilters.push(oGeoTypeFilter);
			if (oViewModel.getProperty("/InterventionStatus").length > 0 && oViewModel.getProperty("/InterventionStatus") !== "All") {
				var oStatusFilter = new Filter("Status", FilterOperator.EQ, oViewModel.getProperty("/InterventionStatus"));
				aInterventionFilters.push(oStatusFilter);
			}
			oPriorDayProdSorter = new Sorter("PriorDayProdValue", true);
			aInterventionSorters.push(oPriorDayProdSorter);
			this.byId("poListInterventions").bindItems({
				path: "/Interventions",
				filters: aInterventionFilters,
				sorter: aInterventionSorters,
				template: this._getInterventionListItem()
			});
		},

		_getSalesMarketingData: function() {
			var oDateFilter, oModel = this.getModel(),
				oViewModel = this.getModel("viewData"),
				oCurrentDate = new Date(),
				aSalesFilters = [];
			oDateFilter = new Filter("DATE", FilterOperator.EQ, this._getFormattedDate(oCurrentDate));
			aSalesFilters.push(oDateFilter);
			if (oViewModel.getProperty("/Geography").length > 0) {
				aSalesFilters.push(this._oGeoFilter);
			}
			oModel.read("/Sales", {
				urlParameters: {
					"$select": "CustomerName,OrgUnitType,DATE,AssignmentValueType,ReadingsPlannedValue,ReadingsActualValue,SurplusDeficit"
				},
				filters: aSalesFilters,
				batchGroupId: "poHomeBatchGroupId"
			});
		},

		_getProductionData: function() {
			var oGeoTypeFilter, oAssetFilter, oDateFilter, oYesDateFilter,
			oCurrentDate = new Date(),
			oYesDate = new Date(),
			oModel = this.getModel(),
			aProdCummFilters = [],
			aProdInstantFilters = [],
			aProdYesFilters = [],
			oViewModel = this.getModel("viewData");
			oAssetFilter = new Filter("ThingType", FilterOperator.EQ, oViewModel.getProperty("/AssetType"));
			if (oViewModel.getProperty("/Geography").length > 0) {
				aProdCummFilters.push(this._oGeoFilter);
				aProdInstantFilters.push(this._oGeoFilter);
				aProdYesFilters.push(this._oGeoFilter);
			}
			oGeoTypeFilter = new Filter("OrgUnitType", FilterOperator.EQ, "com.sap.pdms.og:Well");
			aProdCummFilters.push(oGeoTypeFilter);
			aProdInstantFilters.push(oGeoTypeFilter);
			aProdInstantFilters.push(oAssetFilter);
			aProdYesFilters.push(oGeoTypeFilter);
			aProdYesFilters.push(oAssetFilter);
			aProdCummFilters.push(oAssetFilter);
			oDateFilter = new Filter("DATE", FilterOperator.EQ, this._getFormattedDate(oCurrentDate));
			aProdCummFilters.push(oDateFilter);
			aProdInstantFilters.push(oDateFilter);
			oModel.read("/Production", {
				urlParameters: {
					"$select": "OrgUnitType,ThingType,PropertyId,DATE,ActualValue,PlannedValue"
				},
				filters: aProdCummFilters,
				batchGroupId: "poHomeBatchGroupId"
			});
			oYesDate.setDate(oYesDate.getDate() - 1);
			oYesDateFilter = new Filter("DATE", FilterOperator.EQ, this._getFormattedDate(oYesDate));
			aProdYesFilters.push(oYesDateFilter);
			oModel.read("/Production", {
				urlParameters: {
					"$select": "OrgUnitType,ThingType,PropertyId,DATE,ActualValue,PlannedValue"
				},
				filters: aProdYesFilters,
				batchGroupId: "poHomeBatchGroupId"
			});
			
			oModel.read("/InsRate", {
				urlParameters: {
					"$select": "PropertyId,ActualRate,PlannedRate,ActualValue,PlannedValue"
				},
				filters: aProdInstantFilters,
				batchGroupId: "poHomeBatchGroupId"
			});
		},

		_getProductionCommitmentData: function(periodChange) {
			var oGeoTypeFilter, oDateFilter,
				oModel = this.getModel(),
				oCurrentDate = new Date(),
				oMinusDate = new Date(),
				oPlusDate = new Date(),
				sSelectStr = "",
				aProdCommitmentFilters = [],
				oViewModel = this.getModel("viewData");
			if (oViewModel.getProperty("/Geography").length > 0) {
				aProdCommitmentFilters.push(this._oGeoFilter);
			}
			if (oViewModel.getProperty("/ProdCmtmntPeriod") === "Today") {
				oDateFilter = new Filter("DATE", FilterOperator.EQ, this._getFormattedDate(oCurrentDate));
				sSelectStr = "PropertyId,HOUR,ActualValue,PlannedValue";
			} else {
				oMinusDate.setDate(oMinusDate.getDate() - 15);
				oPlusDate.setDate(oPlusDate.getDate() + 15);
				oDateFilter = new Filter("DATE", FilterOperator.BT, this._getFormattedDate(oMinusDate), this._getFormattedDate(oPlusDate));
				sSelectStr = "PropertyId,DATE,ActualValue,PlannedValue";
			}
			aProdCommitmentFilters.push(oDateFilter);
			oGeoTypeFilter = new Filter("OrgUnitType", FilterOperator.EQ, "com.sap.pdms.og:Well");
			aProdCommitmentFilters.push(oGeoTypeFilter);
			if (periodChange) {
				this.getBusyDialog().open();
				oModel.read("/Production", {
					urlParameters: {
						"$select": sSelectStr
					},
					filters: aProdCommitmentFilters,
					success: this._onProdCommitSuccess.bind(this),
					error: this._onProdCommitError.bind(this)
				});
			} else {
				oModel.read("/Production", {
					urlParameters: {
						"$select": sSelectStr
					},
					filters: aProdCommitmentFilters,
					batchGroupId: "poHomeBatchGroupId"
				});
			}
		},

		_onReadHomeSuccess: function(oData) {
			this._fnRefreshLastUpdated();
			this.getBusyDialog().close();
			var oViewModel = this.getModel("viewData");
			oViewModel.setProperty("/SalesMarketing", this._getSalesMarketingValues(oData.__batchResponses[0].data ? oData.__batchResponses[0].data
				.results : []));
			this._getProdDataValues(oData.__batchResponses[1].data ? oData.__batchResponses[1].data.results : [], "Cumulative");
			this._getProdDataValues(oData.__batchResponses[2].data ? oData.__batchResponses[2].data.results : [], "Yesterday");
			this._getProdDataValues(oData.__batchResponses[3].data ? oData.__batchResponses[3].data.results : [], "Instant");
			this._getProdDataValues(oData.__batchResponses[4].data ? oData.__batchResponses[4].data.results : [], "Commitment");
		},

		_onReadHomeError: function() {
			this.getBusyDialog().close();
		},

		_onProdCommitSuccess: function(oData) {
			this.getBusyDialog().close();
			this._getProdDataValues(oData.results, "Commitment");
		},

		_onProdCommitError: function() {
			this.getBusyDialog().close();
		},

		_getSalesMarketingValues: function(aData) {
			var i, j, k, aSalesMarketingData = [],
				aGasData, aOilData,
				aUniqueCustomers = this._getUniqueCustomers(aData);
			aOilData = aData.filter(function(oObj) {
				return oObj.AssignmentValueType === "Oil";
			});
			aGasData = aData.filter(function(oObj) {
				return oObj.AssignmentValueType === "Gas";
			});
			for (i = 0; i < aUniqueCustomers.length; i++) {
				var oSalesMarketingData = {};
				oSalesMarketingData.CustomerName = aUniqueCustomers[i];
				for (j = 0; j < aOilData.length; j++) {
					for (k = 0; k < aGasData.length; k++) {
						if (oSalesMarketingData.CustomerName === aOilData[j].CustomerName && oSalesMarketingData.CustomerName === aGasData[k].CustomerName) {
							oSalesMarketingData.OilPlannedValue = aOilData[j].ReadingsPlannedValue ? Number(aOilData[j].ReadingsPlannedValue) : 0;
							oSalesMarketingData.OilActualValue = aOilData[j].ReadingsActualValue ? Number(aOilData[j].ReadingsActualValue) : 0;
							oSalesMarketingData.OilSurplusDeficit = aOilData[j].SurplusDeficit ? Number(aOilData[j].SurplusDeficit) : 0;
							oSalesMarketingData.GasPlannedValue = aGasData[k].ReadingsPlannedValue ? Number(aGasData[k].ReadingsPlannedValue) : 0;
							oSalesMarketingData.GasActualValue = aGasData[k].ReadingsActualValue ? Number(aGasData[k].ReadingsActualValue) : 0;
							oSalesMarketingData.GasSurplusDeficit = aGasData[k].SurplusDeficit ? Number(aGasData[k].SurplusDeficit) : 0;
						}
					}
				}
				aSalesMarketingData.push(oSalesMarketingData);
			}
			return aSalesMarketingData;
		},
		_getProdDataValues: function(aData, sVariant) {
			var aGasData = [],
				aOilData = [],
				aOilResult = [],
				aGasResult = [],
				aCommitmentResult = [],
				oViewModel = this.getModel("viewData");
			aGasData = aData.filter(function(oObj) {
				return oObj.PropertyId === "Gas";
			});
			aOilData = aData.filter(function(oObj) {
				return oObj.PropertyId === "Oil";
			});
			if (aGasData.length > 0) {
				aGasResult.push(aGasData[0]);
			}
			if (aOilData.length > 0) {
				aOilResult.push(aOilData[0]);
			}

			switch (sVariant) {
				case "Cumulative":
					oViewModel.setProperty("/CummulativeProdOil", aOilResult);
					oViewModel.setProperty("/CummulativeProdGas", aGasResult);
					break;
				case "Yesterday":
					oViewModel.setProperty("/YesterdayProdOil", aOilResult);
					oViewModel.setProperty("/YesterdayProdGas", aGasResult);
					break;
				case "Instant":
					oViewModel.setProperty("/InstantRateProdOil", aOilResult);
					oViewModel.setProperty("/InstantRateProdGas", aGasResult);
					break;
				case "Commitment":
					var i;
					if (this.getModel("viewData").getProperty("/ProdCmtmntPeriod") === "Month") {
						aGasData.sort(function(x, y) {
							return x.DATE - y.DATE;
						});
						aOilData.sort(function(x, y) {
							return x.DATE - y.DATE;
						});
					} else {
						aGasData.sort(function(x, y) {
							return x.HOUR - y.HOUR;
						});
						aOilData.sort(function(x, y) {
							return x.HOUR - y.HOUR;
						});
					}

					for (i = 0; i < aGasData.length; i++) {
						var oOilGasObj = {};
						if (aGasData[i].DATE && aGasData[i].DATE.getTime() === aOilData[i].DATE.getTime()) {
							oOilGasObj.Date = this._getPlotDate(aGasData[i].DATE);
							oOilGasObj.GasActual = aGasData[i].ActualValue;
							oOilGasObj.GasPlanned = aGasData[i].PlannedValue;
							oOilGasObj.OilActual = aOilData[i].ActualValue;
							oOilGasObj.OilPlanned = aOilData[i].PlannedValue;
						} else if (aGasData[i].HOUR) {
							oOilGasObj.Date = aGasData[i].HOUR;
							oOilGasObj.GasActual = aGasData[i].ActualValue;
							oOilGasObj.GasPlanned = aGasData[i].PlannedValue;
							oOilGasObj.OilActual = aOilData[i].ActualValue;
							oOilGasObj.OilPlanned = aOilData[i].PlannedValue;
						}
						aCommitmentResult.push(oOilGasObj);
					}
					oViewModel.setProperty("/ProductionCommitment", aCommitmentResult);
					break;
			}
		},

		_fnHandleExpandSelection: function() {
			jQuery.sap.delayedCall(50, this, function() {
				this._fnHandleGeoTreeSelections(this._iExpandRowIndex);
			});
		},

		_fnHandleGeoTreeSelections: function(iRowIndex) {
			var i, oGeoTreeTable = this._fnGetGeoTreeTable(),
				iNoOfRows = oGeoTreeTable.getBinding().getLength(),
				sSelectedGeoId = oGeoTreeTable.getContextByIndex(iRowIndex).getProperty("OrgUnitID");
			for (i = 0; i < iNoOfRows; i++) {
				var oCtx = oGeoTreeTable.getContextByIndex(i);
				if (!oCtx) {
					continue;
				}
				var sParentGeoId = oCtx.getProperty("ParentOrgUnitID");
				if (sSelectedGeoId === sParentGeoId) {
					this._bIsSelectionUserInteractive = false;
					oGeoTreeTable.addSelectionInterval(i, i);
					this._fnHandleGeoTreeSelections(i);
				}
			}
			this._bIsSelectionUserInteractive = true;
		},

		_fnHandleGeoTreeNodeDeSelections: function(iRowIndex) {
			var i, oGeoTreeTable = this._fnGetGeoTreeTable(),
				iNoOfRows = oGeoTreeTable.getBinding().getLength(),
				sSelectedGeoId = oGeoTreeTable.getContextByIndex(iRowIndex).getProperty("OrgUnitID");
			for (i = 0; i < iNoOfRows; i++) {
				var oCtx = oGeoTreeTable.getContextByIndex(i);
				if (!oCtx) {
					continue;
				}
				var sParentGeoId = oCtx.getProperty("ParentOrgUnitID");
				if (sSelectedGeoId === sParentGeoId) {
					this._bIsSelectionUserInteractive = false;
					oGeoTreeTable.removeSelectionInterval(i, i);
					this._fnHandleGeoTreeNodeDeSelections(i);
				}
			}
			this._bIsSelectionUserInteractive = true;
		},

		_fnHandleGeoTreeParentDeSelections: function(iRowIndex) {
			var i, oGeoTreeTable = this._fnGetGeoTreeTable(),
				iNoOfRows = oGeoTreeTable.getBinding().getLength(),
				sSelectedGeoParentId = oGeoTreeTable.getContextByIndex(iRowIndex).getProperty("ParentOrgUnitID");
			for (i = 0; i < iNoOfRows; i++) {
				var oCtx = oGeoTreeTable.getContextByIndex(i),
					sGeoId = oCtx.getProperty("OrgUnitID");
				if (sSelectedGeoParentId === sGeoId) {
					this._bIsSelectionUserInteractive = false;
					oGeoTreeTable.removeSelectionInterval(i, i);
					this._fnHandleGeoTreeParentDeSelections(i);
				}
			}
			this._bIsSelectionUserInteractive = true;
		},

		_getUniqueCustomers: function(array) {
			var flags = [],
				output = [],
				l = array.length,
				i;
			for (i = 0; i < l; i++) {
				if (flags[array[i].CustomerName]) {
					continue;
				}
				flags[array[i].CustomerName] = true;
				output.push(array[i].CustomerName);
			}
			return output;
		},

		/**
		 * Returns instance of Intervention List Item
		 * @returns {Object} fragment for Intervention List Item
		 * @private
		 */
		_getInterventionListItem: function() {
			if (!this._oInterventionListItem) {
				this._oInterventionListItem = sap.ui.xmlfragment("com.pdms.og.production_overview.fragment.InterventionListItem", this);
			}
			return this._oInterventionListItem;
		},

		_fnGetGeoTreeTable: function() {
			return this.getFragmentControl(this._getGeographyValueHelpDialogId(),
				"poTreeTableGeography");
		},

		/**
		 * Returns fragment id for geography value help dialog
		 * @returns {string} id for fragment id
		 * @private
		 */
		_getGeographyValueHelpDialogId: function() {
			return this.createId("poFragGeoValueHelpDialog");
		},

		/**
		 * Returns instance of geography valuehelp dialog
		 * @returns {Object} fragment for geography valuehelp dialog
		 * @private
		 */
		_getGeographyValueHelpDialog: function() {
			var oView = this.getView();
			if (!this._oGeographyValueHelpDialog) {
				this._oGeographyValueHelpDialog = sap.ui.xmlfragment(this._getGeographyValueHelpDialogId(),
					"com.pdms.og.production_overview.fragment.GeographyValueHelpDialog", this);
			}
			oView.addDependent(this._oGeographyValueHelpDialog);
			jQuery.sap.syncStyleClass(this.getOwnerComponent().getContentDensityClass(), oView, this._oGeographyValueHelpDialog);
			return this._oGeographyValueHelpDialog;
		},

		_getFormattedDate: function(d) {
			var month = "" + (d.getMonth() + 1),
				day = "" + d.getDate(),
				year = d.getFullYear();
			if (month.length < 2) {
				month = "0" + month;
			}
			if (day.length < 2) {
				day = "0" + day;
			}
			return [year, month, day].join("-");
		},

		_getFormattedChartDate: function(d) {
			var month = "" + (d.getMonth() + 1),
				day = "" + d.getDate(),
				year = d.getFullYear();
			if (month.length < 2) {
				month = "0" + month;
			}
			if (day.length < 2) {
				day = "0" + day;
			}
			return [month, day, year].join("/");
		},

		_getPlotDate: function(d) {
			d = new Date(d);
			var aMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
			return d.getDate() + "-" + aMonths[d.getMonth()];
		},

		_handleValueHelpSearch: function(evt) {
			var sValue = evt.getParameter("value");
			var oFilter = new Filter(
				"Name",
				sap.ui.model.FilterOperator.Contains, sValue
			);
			evt.getSource().getBinding("items").filter([oFilter]);
		},

		_handleValueHelpClose: function(evt) {
			var oSelectedItem = evt.getParameter("selectedItem");
			if (oSelectedItem) {
				var productInput = this.getView().byId(this.inputId);
				productInput.setValue(oSelectedItem.getTitle());
			}
			evt.getSource().getBinding("items").filter([]);
		},

		_renderChart: function() {
			if (this.getModel("viewData").getProperty("/ProdCmtmntPeriod") === "Month") {
				this._oVizFrame = this.byId("idVizFrameMonth");
				this._oVizFrame.setVisible(true);
				this.byId("idVizFrameDay").setVisible(false);

			} else {
				this._oVizFrame = this.byId("idVizFrameDay");
				this._oVizFrame.setVisible(true);
				this.byId("idVizFrameMonth").setVisible(false);
			}
			var oVizSettings = this._fnGetProdCommitChartSettings();
			this._oVizFrame.setVizProperties(oVizSettings);
			var oPopOver = this.byId("idPopOver");
			oPopOver.connect(this._oVizFrame.getVizUid());
		},

		_fnGetProdCommitChartSettings: function() {
			var oTitleStyle = {
				title: {
					style: {
						color: "#707070"
					}
				}
			};
			return {
				legend: {
					visible: true
				},
				legendGroup: {
					layout: {
						position: "bottom"
					}
				},
				valueAxis: oTitleStyle,
				valueAxis2: oTitleStyle,
				title: {
					visible: false
				},
				plotArea: {
					dataPointStyle: {
						"rules": [{
							"dataContext": {
								"Oil Planned": '*'
							},
							"properties": {
								"color": "sapUiChartPaletteQualitativeHue7",
								"lineColor": "sapUiChartPaletteQualitativeHue7",
								"lineType": "dotted",
								"size": 1
							},
							"displayName": "Oil Planned",
							"dataName": {
								"OilPlanned (BBL)": ""
							}
						}, {
							"dataContext": {
								"Oil Actual (BBL)": '*'
							},
							"properties": {
								"color": "sapUiChartPaletteQualitativeHue7",
								"lineColor": "sapUiChartPaletteQualitativeHue7",
								"lineType": "line"
							},
							"displayName": "Oil Actual",
							"dataName": {
								"Oil Actual (BBL)": "Oil Actual (BBL)"
							}
						}, {
							"dataContext": {
								"Gas Planned": '*'
							},
							"properties": {
								"color": "sapUiChartPaletteQualitativeHue6",
								"lineColor": "sapUiChartPaletteQualitativeHue6",
								"lineType": "dotted",
								"size": 1
							},
							"displayName": "Gas Planned",
							"dataName": {
								"Gas Planned": "Gas Planned"
							}
						}, {
							"dataContext": {
								"Gas Actual (MCF)": '*'
							},
							"properties": {
								"color": "sapUiChartPaletteQualitativeHue6",
								"lineColor": "sapUiChartPaletteQualitativeHue6",
								"lineType": "line"
							},
							"displayName": "Gas Actual",
							"dataName": {
								"Gas Actual (MCF)": "Gas Actual (MCF)"
							}
						}]
					},
					referenceLine: {
						line: {
							axisLabels: [{
								value: "7-Mar",
								visible: true,
								size: 1,
								type: "dotted",
								label: {
									text: "Current",
									visible: true
								}
							}]
						}
					}
				}
			};
		}
	});
});