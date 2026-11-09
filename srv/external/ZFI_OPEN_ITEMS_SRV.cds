/* checksum : 945bbb552824288c528bb47f2d67bdf8 */
@cds.external : true
service ZFI_OPEN_ITEMS_SRV {
  @cds.external : true
  @cds.persistence.skip : true
  @Capabilities.DeleteRestrictions.Deletable : false
  @Capabilities.InsertRestrictions.Insertable : false
  @Capabilities.UpdateRestrictions.Updatable : false
  entity OpenItems {
    key InvoiceNo : String(10) not null;
    key CompanyCode : String(4) not null;
    Customer : String(10);
    ContractNo : String(20);
    Amount : Decimal(15, 2);
    Currency : String(3);
    NetDueDate : Date;
    IsCleared : Boolean;
  };
};

