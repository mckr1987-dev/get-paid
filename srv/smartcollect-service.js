import cds from '@sap/cds';
import { today, addDays, daysBetween, bucketFor } from './lib/due.js';
import { sendMail } from './lib/mailer.js';

const VIRTUAL = ['daysToDue', 'dueBucket', 'criticality', 'isOverdue'];
const LOCALE = { EN: 'en-IN', DE: 'de-DE', HI: 'hi-IN' };
const LOG = cds.log('smartcollect');

// Call S/4, log technical errors, return a safe message to the user
async function fromS4(srv, req) {
  try {
    return await srv.run(req.query);
  } catch (e) {
    LOG.error(`S/4 call failed for ${req.target.name}:`, e.message);
    return req.reject(503, 'The invoice system (S/4) is not reachable right now. Please try again in a few minutes.');
  }
}

export default class SmartCollectService extends cds.ApplicationService {
  async init() {
    const items = await cds.connect.to('ZFI_OPEN_ITEMS_SRV');
    const contacts = await cds.connect.to('ZCUSTOMER_CONTACT_SRV');
    const { EmailTemplates, ReminderLog } = cds.entities('reminder');
    const { OpenInvoices, CustomerContacts } = this.entities;

    // 1. Business rules, added to every query before it goes to S/4
    this.before('READ', OpenInvoices, req => {
      const t = today();
      req.query.where({
        IsCleared: false,
        NetDueDate: { between: addDays(t, -60), and: addDays(t, 15) }
      });

      // Computed fields need NetDueDate, even if the client didn't ask for it
      const cols = req.query.SELECT.columns;
      const wantsVirtual = cols?.some(c => VIRTUAL.includes(c.ref?.[0]));
      const hasDate = cols?.some(c => c.ref?.[0] === 'NetDueDate');
      if (wantsVirtual && !hasDate) cols.push({ ref: ['NetDueDate'] });
    });

    // 2. Forward the reads to S/4, with error handling
    this.on('READ', OpenInvoices, req => fromS4(items, req));
    this.on('READ', CustomerContacts, req => fromS4(contacts, req));

    // 3. Add the computed fields to the rows that came back
    this.after('READ', OpenInvoices, async data => {
      const rows = (Array.isArray(data) ? data : [data]).filter(Boolean);
      const t = today();
      for (const row of rows) {
        if (!row.NetDueDate) continue;
        row.daysToDue = daysBetween(t, row.NetDueDate);
        Object.assign(row, bucketFor(row.daysToDue));
        row.isOverdue = row.daysToDue < 0;
      }

      // Reminder history from our own database, for all rows of this page at once
      const numbers = rows.map(r => r.InvoiceNo).filter(Boolean);
      if (!numbers.length) return;
      const history = await SELECT
        .from(ReminderLog)
        .columns('invoiceNo', 'companyCode', 'max(sentOn) as lastSent', 'count(1) as total')
        .where({ status: 'SENT', invoiceNo: { in: numbers } })
        .groupBy('invoiceNo', 'companyCode');

      for (const row of rows) {
        const h = history.find(x => x.invoiceNo === row.InvoiceNo && x.companyCode === row.CompanyCode);
        row.lastReminderOn = h?.lastSent ?? null;
        row.reminderCount = h?.total ?? 0;
      }
    });

    // Read the invoice and its contact from S/4
    async function loadContext(req) {
      const { InvoiceNo, CompanyCode } = req.params[0];
      let inv, contact;
      try {
        inv = await items.run(
          SELECT.one.from(items.entities.OpenItems).where({ InvoiceNo, CompanyCode })
        );
        if (inv) contact = await contacts.run(
          SELECT.one.from(contacts.entities.CustomerContacts).where({ Customer: inv.Customer })
        );
      } catch (e) {
        LOG.error('S/4 call failed while loading invoice context:', e.message);
        return req.reject(503, 'The invoice system (S/4) is not reachable right now. Please try again in a few minutes.');
      }
      if (!inv) return req.reject(404, `Invoice ${InvoiceNo} was not found in S/4.`);
      if (inv.IsCleared) return req.reject(409, `Invoice ${InvoiceNo} is already cleared.`);
      if (!contact?.Email) return req.reject(422, `No contact email is maintained for customer ${inv.Customer}.`);

      return { inv, contact, daysToDue: daysBetween(today(), inv.NetDueDate) };
    }

    // Pick the template in the contact's language (fallback EN) and fill it in
    async function render({ inv, contact, daysToDue }) {
      const lang = (contact.Language || 'EN').toUpperCase();
      const tpl =
        (await SELECT.one.from(EmailTemplates).where({ code: 'OVERDUE', language: lang })) ??
        (await SELECT.one.from(EmailTemplates).where({ code: 'OVERDUE', language: 'EN' }));

      const locale = LOCALE[tpl.language] ?? 'en-IN';
      const values = {
        contactName: contact.ContactName,
        invoiceNo:   inv.InvoiceNo,
        contractNo:  inv.ContractNo,
        amount:      new Intl.NumberFormat(locale, { style: 'currency', currency: inv.Currency }).format(inv.Amount),
        dueDate:     new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(inv.NetDueDate)),
        daysOverdue: Math.abs(daysToDue)
      };
      const fill = text => text
        .replace(/\\n/g, '\n')
        .replace(/{{(\w+)}}/g, (_, key) => values[key] ?? '');

      return { to: contact.Email, language: tpl.language, subject: fill(tpl.subject), body: fill(tpl.body) };
    }

    // Preview: read-only function
    this.on('previewReminder', OpenInvoices, async req => render(await loadContext(req)));

    // Send: validate everything before anything happens
    this.before('sendReminder', OpenInvoices, async req => {
      const ctx = await loadContext(req);
      if (ctx.daysToDue >= 0) {
        return req.reject(409, 'Reminders can only be sent for overdue invoices.');
      }

      const sentToday = await SELECT.one.from(ReminderLog).where({
        invoiceNo: ctx.inv.InvoiceNo, companyCode: ctx.inv.CompanyCode, status: 'SENT', sentOn: today()
      });
      if (sentToday) {
        return req.reject(409, `A reminder for invoice ${ctx.inv.InvoiceNo} was already sent today.`);
      }

      const { subject, body } = req.data;
      if (!subject?.trim() || !body?.trim()) {
        return req.reject(400, 'Subject and message are required.');
      }

      req._reminder = ctx;   // hand the loaded invoice and contact to the on handler
    });

    // Send: send the email and log the result
    this.on('sendReminder', OpenInvoices, async req => {
      const { inv, contact } = req._reminder;
      const { subject, body } = req.data;
      const entry = {
        invoiceNo: inv.InvoiceNo, companyCode: inv.CompanyCode, customer: inv.Customer,
        sentTo: contact.Email, language: contact.Language, subject, sentOn: today()
      };

      try {
        const ref = await sendMail({ to: contact.Email, subject, body });
        await INSERT.into(ReminderLog).entries({ ...entry, status: 'SENT', message: ref });
        return `Reminder sent to ${contact.Email}`;
      } catch (e) {
        // Separate transaction, so the FAILED entry survives the rollback of this request
        const tx = cds.db.tx({ user: req.user, tenant: req.tenant });
        try {
          await tx.run(INSERT.into(ReminderLog).entries({ ...entry, status: 'FAILED', message: String(e.message).slice(0, 500) }));
          await tx.commit();
        } catch { await tx.rollback(); }
        return req.reject(502, 'The email could not be sent. Please try again later.');
      }
    });

    return super.init();
  }
}