using { ZFI_OPEN_ITEMS_SRV as items } from './external/ZFI_OPEN_ITEMS_SRV';
using { ZCUSTOMER_CONTACT_SRV as contacts } from './external/ZCUSTOMER_CONTACT_SRV';
using { reminder as db } from '../db/schema';

@path: 'smartcollect'
service SmartCollectService {

  @readonly
  entity OpenInvoices as projection on items.OpenItems {
    *,
     virtual null as daysToDue      : Integer,
    virtual null as dueBucket      : String(30),
    virtual null as criticality    : Integer,
    virtual null as isOverdue      : Boolean,
    virtual null as lastReminderOn : Date,
    virtual null as reminderCount  : Integer
  } actions {
    function previewReminder() returns ReminderPreview;
    action   sendReminder(subject : String(200), body : LargeString) returns String;
  };

  @readonly
  entity CustomerContacts as projection on contacts.CustomerContacts;

  @readonly entity EmailTemplates as projection on db.EmailTemplates;
  @readonly entity ReminderLog    as projection on db.ReminderLog;

  type ReminderPreview {
    to       : String(120);
    language : String(2);
    subject  : String(200);
    body     : LargeString;
  }
}