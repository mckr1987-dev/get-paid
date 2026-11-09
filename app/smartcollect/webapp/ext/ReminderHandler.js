sap.ui.define([
  "sap/m/Dialog", "sap/m/Button", "sap/m/Label", "sap/m/Input",
  "sap/m/TextArea", "sap/m/Text", "sap/m/VBox",
  "sap/m/MessageToast", "sap/m/MessageBox"
], function (Dialog, Button, Label, Input, TextArea, Text, VBox, MessageToast, MessageBox) {
  "use strict";

  const NS = "SmartCollectService.";

  return {
    onSendReminder: async function (oContext, aSelectedContexts) {
      const ctx = aSelectedContexts && aSelectedContexts[0];
      if (!ctx) { return; }
      if (aSelectedContexts.length > 1) {
        MessageBox.information("Please select one invoice at a time.");
        return;
      }
      if (!(ctx.getProperty("daysToDue") < 0)) {
        MessageBox.information("Reminders can only be sent for overdue invoices.");
        return;
      }

      const model = ctx.getModel();

      // 1. Call the bound function previewReminder on the selected invoice
      let preview;
      try {
        const fn = model.bindContext(NS + "previewReminder(...)", ctx);
        await fn.execute();
        preview = fn.getBoundContext().getObject();
      } catch (e) {
        MessageBox.error(e.message);
        return;
      }

      // 2. Show the filled-in email in an editable dialog
      const subject = new Input({ value: preview.subject, width: "100%" });
      const body = new TextArea({ value: preview.body, width: "100%", rows: 12, growing: true });

      const dialog = new Dialog({
        title: "Reminder for invoice " + ctx.getProperty("InvoiceNo"),
        contentWidth: "40rem",
        content: [
          new VBox({
            items: [
              new Text({ text: "To: " + preview.to + " (" + preview.language + ")" }),
              new Label({ text: "Subject", labelFor: subject }), subject,
              new Label({ text: "Message", labelFor: body }), body
            ]
          }).addStyleClass("sapUiSmallMargin")
        ],

        // 3. Send calls the bound action sendReminder with the edited text
        beginButton: new Button({
          text: "Send",
          type: "Emphasized",
          press: async function () {
            dialog.setBusy(true);
            try {
              const act = model.bindContext(NS + "sendReminder(...)", ctx);
              act.setParameter("subject", subject.getValue());
              act.setParameter("body", body.getValue());
              await act.execute();
              MessageToast.show("Reminder sent to " + preview.to);
              ctx.getBinding().refresh();
              dialog.close();
            } catch (e) {
              MessageBox.error(e.message);
            } finally {
              dialog.setBusy(false);
            }
          }
        }),
        endButton: new Button({ text: "Cancel", press: function () { dialog.close(); } }),
        afterClose: function () { dialog.destroy(); }
      });

      dialog.open();
    }
  };
});