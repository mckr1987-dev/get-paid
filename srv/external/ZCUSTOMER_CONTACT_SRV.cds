/* checksum : 023bff1a7d27b7b64581750219e8a29f */
@cds.external : true
service ZCUSTOMER_CONTACT_SRV {
  @cds.external : true
  @cds.persistence.skip : true
  @Capabilities.DeleteRestrictions.Deletable : false
  @Capabilities.InsertRestrictions.Insertable : false
  @Capabilities.UpdateRestrictions.Updatable : false
  entity CustomerContacts {
    key Customer : String(10) not null;
    CustomerName : String(80);
    ContactName : String(80);
    Email : String(120);
    Language : String(2);
  };
};

