sap.ui.define(['com/rg/sd/osc/controller/BaseController',
               'sap/ui/model/Filter',
               'sap/ui/model/FilterOperator',
               'sap/m/MessageBox', 
               'sap/m/MessageToast',
               'sap/m/Text',
               'sap/m/RadioButtonGroup',
               "sap/m/RadioButton",
               "sap/ui/model/json/JSONModel"
               ],
    function(BaseController,Filter,FilterOperator,MessageBox,MessageToast,Text,
             RadioButtonGroup,RadioButton,JSONModel){
       return BaseController.extend("com.rg.sd.osc.controller.Master",{
          onInit: function(){
            this.oRouter = this.getOwnerComponent().getRouter();
            this.oRouter.getRoute("startPage").attachMatched(this.harculus, this);

            var localModel = new JSONModel({
                 "custData" : {
                  "KUNNR": "",
                  "NAME1" : ""
                 }
            });
               

            this.getView().setModel(localModel,"cust");

          },

          harculus:function( ){
             
          },

          onPress: function(){
            
              var oTable = this.getView().byId("idTab");
                if (oTable) {
                  oTable.unbindAggregation("items");
                } 
                var model = this.getView().getModel("ordStatus");
                model.resetChanges();
                model.invalidate(); 
                model.refresh(true); 

            var soNumber = this.getView().byId("idSo").getValue();
             if (!soNumber || soNumber.length === 0) {
              MessageBox.error("oops!please enter correct Sales Document No");
              return;

             } else {
               var soFilter = [];
               soFilter = new Filter("SODOC", FilterOperator.EQ,soNumber );

               var oItemTemplate = new sap.m.ColumnListItem({
               //  type: "Navigation",
               cells:[
                  new Text({ text: "{ordStatus>SODOC}"}),
                  new Text({ text: "{ordStatus>POSNR}"}),
                  new Text({ text: "{ordStatus>MATNR}"}),
                  new Text({ text: "{ordStatus>KWMENG}  {ordStatus>MEINS}"}),
                  new Text({ text: "{ordStatus>RATE}  {ordStatus>CURR}"}),

                  new RadioButtonGroup({
                    // id:this.getView().createId("myRadioButtonGroup"),
                    valueState:"Warning",
                    columns:8,
                    //class:"sapUiMediumMarginBottom",
                    select: this.onRadioChange.bind(this),
                    buttons: [
                       new RadioButton({
                        // id: this.getView().createId("idInit"),
                        text: "INIT",
                        selected: { path: "ordStatus>INTL",
                           formatter: this.myBooleanFormatter } 
                        }),
                       new RadioButton({
                        // id: this.getView().createId("idRel1"),
                        text: "REL1",
                        selected: {path: "ordStatus>RELS1",
                                  formatter:this.myBooleanFormatter }
                       }),
                       new RadioButton({
                        // id: this.getView().createId("idRel2"),
                        text: "REL2",
                        selected:  {path: "ordStatus>RELS2",
                                    formatter: this.myBooleanFormatter }

                      }),
                      new RadioButton({
                        // id: this.getView().createId("idRels"),
                        text: "RELS",
                        selected:  {path: "ordStatus>RELS3", 
                                  formatter: this.myBooleanFormatter }
                      })
                       ],
                      }),
                     ],
                  });
              
               this.getView().byId("idTab").bindAggregation("items",{
                  path: "ordStatus>/SODataSet",
                  template: oItemTemplate,
                  templateShareable: false,
                   filters: soFilter,
                   events: {
                       dataReceived:function(oData){
                      
                        const oError = oData.getParameter("error");
                        if (oError) {
                          MessageBox.error("Failed to load SO data from server.");
                          return;
                        }
                        const oSuccess = oData.getParameter("data");
                        
                        if (oSuccess && oSuccess.results && oSuccess.results.length > 0) {
              
                           this.getView().getModel("cust").setProperty("/custData",{
                            "KUNNR" :"for Customer:-" + oSuccess.results[0].KUNNR,
                            "NAME1" :"(" + oSuccess.results[0].NAME1 + ")"
                           });            
                          MessageToast.show("wow! Search Document Found");

                        }else{
                          MessageBox.error("oops!No record(s) found");
                          return;
                        }
                       }.bind(this)
                   }
                   
                  });
             }

          },

          myBooleanFormatter:function(sValue){
             //return sValue === "true" || sValue === "X" || sValue === "x" || sValue === 1
             return sValue === true || sValue === "true" ;
          },

          onSave: function(){
              
             var sRecords = [];
             var oList = this.getView().byId("idTab");
             var aItems = oList.getItems();
             for (let i = 0; i < aItems.length; i++) {
              var oBindingContext = aItems[i].getBindingContext("ordStatus");
              if (oBindingContext) {
                 var oPayload = oBindingContext.getObject();
               //   this.getView().getModel("ordStatus").create("/SODataSet", oPayload,{});
                 sRecords.push(oPayload);
                 oPayload = {};
              }

              }

              sRecords.forEach( ( record, i ) => {
                this.getView().getModel("ordStatus").create("/SODataSet", record,{
                  groupId: "batchGroup",
                   changeSetId: "set_" + i 
                });
              });
             
              this.getView().getModel("ordStatus").submitChanges({
                 groupId: "batchGroup",
                  success: function() {
                     MessageToast.show("All records created successfully!");
                        },
                  error: function() {
                     MessageBox.error("Batch create failed");
                  }
              });
              
             
          },

          onRadioChange: function(oEvent){
             
           var oRadioGroup = oEvent.getSource();
          //  var oRadioGroup = (oRB instanceof sap.m.RadioButton) ? oRB.getParent() : oRB;
           var oContext = oRadioGroup.getBindingContext("ordStatus");
          //  var oContext = oRadioGroup.getBindingContext();
           if (!oContext) {
             console.error("No binding context found!");
             return;
                }
            //  var oTable = this.getView().byId("idTab");
            //  var oBinding = oTable.getBinding("items");
            //  var aContexts = oBinding.getCurrentContexts();
            //  var iIndex = aContexts.indexOf(oContext);
             //  var sRowPath1 = '/SODataSet/' + iIndex  ;
            //  var oModel1 = this.getView().getModel("ordStatus");
            

           var sRowPath = oContext.getPath(); 
           var oModel = oContext.getModel("ordStatus");
           var iSelectedIndex = oRadioGroup.getSelectedIndex();

             oModel.setProperty(sRowPath + "/INTL",  "false");
             oModel.setProperty(sRowPath + "/RELS1", "false");
             oModel.setProperty(sRowPath + "/RELS2", "false");
             oModel.setProperty(sRowPath + "/RELS3", "false");
                switch (iSelectedIndex) {
              case 0: oModel.setProperty(sRowPath + "/INTL", "true");  break;
              case 1: oModel.setProperty(sRowPath + "/RELS1", "true"); break;
              case 2: oModel.setProperty(sRowPath + "/RELS2", "true"); break;
              case 3: oModel.setProperty(sRowPath + "/RELS3", "true"); break;
                   }
            
                //  oModel.submitChanges();
                // this.byId("idTab").getBinding("items").refresh();
          },



          
       });

});