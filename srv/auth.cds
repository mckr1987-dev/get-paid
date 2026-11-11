using SmartCollectService from './smartcollect-service';

annotate SmartCollectService with @(requires: 'authenticated-user');

annotate SmartCollectService.OpenInvoices with @(restrict: [
  { grant: 'READ',                              to: ['Viewer', 'CollectionsAgent'] },
  { grant: ['previewReminder', 'sendReminder'], to: 'CollectionsAgent' }
]);

annotate SmartCollectService.CustomerContacts with @(restrict: [
  { grant: 'READ', to: ['Viewer', 'CollectionsAgent'] }
]);

annotate SmartCollectService.EmailTemplates with @(restrict: [
  { grant: 'READ', to: 'CollectionsAgent' }
]);

annotate SmartCollectService.ReminderLog with @(restrict: [
  { grant: 'READ', to: ['Viewer', 'CollectionsAgent'] }
]);