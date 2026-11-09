using SmartCollectService as srv from '../srv/smartcollect-service';

annotate srv.OpenInvoices with {
  InvoiceNo   @title: 'Invoice';
  CompanyCode @title: 'Company code';
  Customer    @title: 'Customer';
  ContractNo  @title: 'Contract';
  Amount      @title: 'Amount'  @Measures.ISOCurrency: Currency;
  Currency    @title: 'Currency';
  NetDueDate  @title: 'Net due date';
  daysToDue   @title: 'Days to due';
  dueBucket   @title: 'Due status';
  lastReminderOn @title: 'Last reminder';
  reminderCount  @title: 'Reminders';
};

annotate srv.OpenInvoices with @(
  Capabilities.FilterRestrictions.NonFilterableProperties: [
    daysToDue, dueBucket, criticality, isOverdue
  ],
  Capabilities.SortRestrictions.NonSortableProperties: [
    daysToDue, dueBucket, criticality, isOverdue
  ],
    Capabilities.FilterRestrictions.FilterExpressionRestrictions: [
    { Property: NetDueDate, AllowedExpressions: 'SingleRange' }
  ],

    Capabilities.SearchRestrictions.Searchable: false,

  UI.HeaderInfo: {
    TypeName      : 'Invoice',
    TypeNamePlural: 'Open invoices',
    Title         : { Value: InvoiceNo },
    Description   : { Value: Customer }
  },

  UI.SelectionFields: [ CompanyCode, Customer, NetDueDate ],

  UI.LineItem: [
    { Value: InvoiceNo },
    { Value: Customer },
    { Value: ContractNo },
    { Value: Amount },
    { Value: NetDueDate },
    { Value: daysToDue },
    { Value: dueBucket, Criticality: criticality },
    { Value: dueBucket, Criticality: criticality },
    { Value: lastReminderOn },
    { Value: reminderCount }
  ]
);
annotate srv.OpenInvoices actions {
  sendReminder @(Core.OperationAvailable: { $edmJson: { $Path: 'in/isOverdue' } })
    (subject @title: 'Subject', body @title: 'Message' @UI.MultiLineText);
};