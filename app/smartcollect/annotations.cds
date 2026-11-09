using SmartCollectService as service from '../../srv/smartcollect-service';
annotate service.OpenInvoices with @(
    UI.FieldGroup #GeneratedGroup : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Value : InvoiceNo,
            },
            {
                $Type : 'UI.DataField',
                Value : CompanyCode,
            },
            {
                $Type : 'UI.DataField',
                Value : Customer,
            },
            {
                $Type : 'UI.DataField',
                Value : ContractNo,
            },
            {
                $Type : 'UI.DataField',
                Value : Amount,
            },
            {
                $Type : 'UI.DataField',
                Value : Currency,
            },
            {
                $Type : 'UI.DataField',
                Value : NetDueDate,
            },
            {
                $Type : 'UI.DataField',
                Label : 'IsCleared',
                Value : IsCleared,
            },
            {
                $Type : 'UI.DataField',
                Value : daysToDue,
            },
            {
                $Type : 'UI.DataField',
                Value : dueBucket,
            },
            {
                $Type : 'UI.DataField',
                Label : 'criticality',
                Value : criticality,
            },
            {
                $Type : 'UI.DataField',
                Label : 'isOverdue',
                Value : isOverdue,
            },
        ],
    },
    UI.Facets : [
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'GeneratedFacet1',
            Label : 'General Information',
            Target : '@UI.FieldGroup#GeneratedGroup',
        },
    ],
);

