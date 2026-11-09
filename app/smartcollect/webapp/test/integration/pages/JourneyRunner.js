sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"smartcollect/test/integration/pages/OpenInvoicesList.gen",
	"smartcollect/test/integration/pages/OpenInvoicesObjectPage.gen"
], function (JourneyRunner, OpenInvoicesListGenerated, OpenInvoicesObjectPageGenerated) {
    'use strict';

    const runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('smartcollect') + '/test/flp.html#app-preview',
        pages: {
			onTheOpenInvoicesListGenerated: OpenInvoicesListGenerated,
			onTheOpenInvoicesObjectPageGenerated: OpenInvoicesObjectPageGenerated
        },
        async: true
    });

    return runner;
});

