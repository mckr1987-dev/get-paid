namespace reminder;
using { cuid, managed } from '@sap/cds/common';

entity EmailTemplates : cuid {
  code     : String(30);
  language : String(2);
  subject  : String(200);
  body     : LargeString;
}

entity ReminderLog : cuid, managed {
  invoiceNo   : String(10);
  companyCode : String(4);
  customer    : String(10);
  sentTo      : String(120);
  language    : String(2);
  subject     : String(200);
  sentOn      : Date;
  status      : String(10);   // SENT or FAILED
  message     : String(500);
}