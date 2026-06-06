const db = require("../db");
const { sendEmail } = require("../services/emailService");

// 1. Get the unified state from PostgreSQL tables formatted for the frontend
const getState = async (req, res) => {
  try {
    // A. Users
    const usersRes = await db.query(`
      SELECT 
        u.user_id AS id, 
        u.full_name AS name, 
        u.email, 
        r.role_name AS role, 
        u.status 
      FROM tbl_users u 
      LEFT JOIN tbl_roles r ON u.role_id = r.role_id
      ORDER BY u.user_id
    `);

    // B. Vendors
    const vendorsRes = await db.query(`
      SELECT 
        v.vendor_id::text AS id,
        v.vendor_name AS name,
        v.category,
        v.gst_no AS gst,
        v.contact_person || ' | ' || v.email || ' | ' || v.phone AS contact,
        v.status,
        COALESCE(v.rating, 0)::float AS rating,
        v.status = 'Verified' AS verified,
        COALESCE((
          SELECT SUM(po.total_amount) 
          FROM tbl_purchase_orders po 
          JOIN tbl_quotations q ON po.quotation_id = q.quotation_id 
          WHERE q.vendor_id = v.vendor_id
        ), 0)::float AS spend
      FROM tbl_vendors v
      ORDER BY v.vendor_name
    `);

    // C. RFQs & RFQ Items
    const rfqsRes = await db.query(`
      SELECT 
        r.rfq_id,
        r.rfq_no AS id,
        r.title,
        r.description,
        TO_CHAR(r.deadline_date, 'YYYY-MM-DD') AS deadline,
        r.status,
        COALESCE(u.full_name, 'Procurement Officer') AS requester,
        COALESCE((
          SELECT STRING_AGG(rv.vendor_id::text, ', ') 
          FROM tbl_rfq_vendors rv 
          WHERE rv.rfq_id = r.rfq_id
        ), '') AS vendors
      FROM tbl_rfq r
      LEFT JOIN tbl_users u ON r.created_by = u.user_id
      ORDER BY r.created_at DESC
    `);

    const rfqItemsRes = await db.query(`
      SELECT 
        rfq_id,
        item_name AS name,
        quantity AS qty,
        unit AS uom
      FROM tbl_rfq_items
    `);

    const rfqItemsMap = {};
    rfqItemsRes.rows.forEach(item => {
      if (!rfqItemsMap[item.rfq_id]) {
        rfqItemsMap[item.rfq_id] = [];
      }
      rfqItemsMap[item.rfq_id].push({
        name: item.name,
        qty: item.qty,
        uom: item.uom
      });
    });

    const rfqs = rfqsRes.rows.map(rfq => ({
      ...rfq,
      items: rfqItemsMap[rfq.rfq_id] || []
    }));

    // D. Quotations
    const quotationsRes = await db.query(`
      SELECT 
        q.quotation_id,
        q.quotation_no AS id,
        r.rfq_no AS "rfqId",
        q.vendor_id::text AS "vendorId",
        v.vendor_name AS "vendorName",
        q.total_amount::float AS amount,
        q.delivery_days AS "deliveryDays",
        q.remarks AS notes,
        COALESCE(v.rating, 0)::float AS rating,
        q.submission_date AS "submittedAt",
        q.status
      FROM tbl_quotations q
      JOIN tbl_rfq r ON q.rfq_id = r.rfq_id
      JOIN tbl_vendors v ON q.vendor_id = v.vendor_id
      ORDER BY q.submission_date DESC
    `);

    // E. Approvals
    const approvalsRes = await db.query(`
      SELECT 
        a.approval_id::text AS id,
        'PR-2026-' || LPAD(a.approval_id::text, 3, '0') AS "requestId",
        r.rfq_no AS "rfqId",
        q.quotation_no AS "quotationId",
        r.title || ' procurement' AS title,
        COALESCE(u.full_name, 'Procurement Officer') AS requester,
        q.total_amount::float AS amount,
        a.status AS state,
        'Manager' AS level,
        a.remarks,
        TO_CHAR(COALESCE(a.approval_date, q.submission_date), 'YYYY-MM-DD HH24:MI') AS "dateString"
      FROM tbl_approvals a
      JOIN tbl_quotations q ON a.quotation_id = q.quotation_id
      JOIN tbl_rfq r ON q.rfq_id = r.rfq_id
      LEFT JOIN tbl_users u ON r.created_by = u.user_id
      ORDER BY a.approval_id DESC
    `);

    const approvals = approvalsRes.rows.map(app => ({
      id: app.id,
      requestId: app.requestId,
      rfqId: app.rfqId,
      quotationId: app.quotationId,
      title: app.title,
      requester: app.requester,
      amount: app.amount,
      state: app.state,
      level: app.level,
      remarks: app.remarks,
      timeline: [
        { label: "Created", at: app.dateString }
      ]
    }));

    // F. Purchase Orders
    const poRes = await db.query(`
      SELECT 
        po.po_no AS id,
        r.rfq_no AS "rfqId",
        q.quotation_no AS "quotationId",
        v.vendor_name AS "vendorName",
        po.total_amount::float AS amount,
        18 AS "taxPercent",
        po.status,
        TO_CHAR(po.po_date, 'YYYY-MM-DD') AS "issuedAt",
        v.email AS "contactEmail"
      FROM tbl_purchase_orders po
      JOIN tbl_quotations q ON po.quotation_id = q.quotation_id
      JOIN tbl_rfq r ON q.rfq_id = r.rfq_id
      JOIN tbl_vendors v ON q.vendor_id = v.vendor_id
      ORDER BY po.po_id DESC
    `);

    // G. Invoices
    const invoicesRes = await db.query(`
      SELECT 
        inv.invoice_no AS id,
        po.po_no AS "poId",
        v.vendor_name AS "vendorName",
        inv.subtotal::float AS subtotal,
        18 AS "taxPercent",
        inv.total_amount::float AS total,
        inv.status,
        v.email AS recipient,
        inv.email_sent AS emailed
      FROM tbl_invoices inv
      JOIN tbl_purchase_orders po ON inv.po_id = po.po_id
      JOIN tbl_quotations q ON po.quotation_id = q.quotation_id
      JOIN tbl_vendors v ON q.vendor_id = v.vendor_id
      ORDER BY inv.invoice_id DESC
    `);

    // H. Activities
    const activitiesRes = await db.query(`
      SELECT 
        log_id::text AS id,
        TO_CHAR(created_at, 'HH24:MI') AS time,
        action AS title,
        details AS detail,
        CASE 
          WHEN action ILIKE '%approved%' OR action ILIKE '%success%' THEN 'success'
          WHEN action ILIKE '%reject%' OR action ILIKE '%fail%' OR action ILIKE '%error%' THEN 'danger'
          WHEN action ILIKE '%warn%' OR action ILIKE '%pending%' THEN 'warning'
          WHEN action ILIKE '%generate%' OR action ILIKE '%po%' OR action ILIKE '%invoice%' THEN 'primary'
          ELSE 'info'
        END AS tone
      FROM tbl_activity_logs
      ORDER BY created_at DESC
      LIMIT 20
    `);

    // I. Monthly spend trend
    const trendRes = await db.query(`
      SELECT 
        TO_CHAR(po_date, 'Mon') AS month,
        SUM(total_amount)::float AS spend
      FROM tbl_purchase_orders
      GROUP BY TO_CHAR(po_date, 'Mon'), DATE_TRUNC('month', po_date)
      ORDER BY DATE_TRUNC('month', po_date)
    `);

    const defaultTrend = [
      { month: "Jan", spend: 28000 },
      { month: "Feb", spend: 31000 },
      { month: "Mar", spend: 39000 },
      { month: "Apr", spend: 47000 },
      { month: "May", spend: 52000 },
      { month: "Jun", spend: 61800 }
    ];

    const monthlyTrend = defaultTrend.map(item => {
      const dbRow = trendRes.rows.find(r => r.month === item.month);
      return {
        month: item.month,
        spend: dbRow ? dbRow.spend : item.spend
      };
    });

    res.json({
      users: usersRes.rows,
      vendors: vendorsRes.rows,
      rfqs,
      quotations: quotationsRes.rows,
      approvals,
      purchaseOrders: poRes.rows,
      invoices: invoicesRes.rows,
      activities: activitiesRes.rows,
      monthlyTrend
    });
  } catch (error) {
    console.error("Get State Error:", error);
    res.status(500).json({ message: "Failed to query database state." });
  }
};

// 2. Create RFQ, add items, assign vendors, and send invitation emails
const createRfq = async (req, res) => {
  const { title, description, deadline, vendorIds, items } = req.body;
  const userId = req.user.id;

  try {
    await db.query("BEGIN");

    // Insert RFQ header
    const rfqRes = await db.query(`
      INSERT INTO tbl_rfq (title, description, deadline_date, created_by, status)
      VALUES ($1, $2, $3, $4, 'Open')
      RETURNING rfq_id
    `, [title, description, deadline, userId]);

    const rfqId = rfqRes.rows[0].rfq_id;
    const rfqNo = `RFQ-2026-${String(rfqId).padStart(3, '0')}`;

    // Update with generated RFQ number
    await db.query(`
      UPDATE tbl_rfq 
      SET rfq_no = $1 
      WHERE rfq_id = $2
    `, [rfqNo, rfqId]);

    // Insert items
    if (items && Array.isArray(items)) {
      for (const item of items) {
        await db.query(`
          INSERT INTO tbl_rfq_items (rfq_id, item_name, description, quantity, unit)
          VALUES ($1, $2, $3, $4, $5)
        `, [rfqId, item.name, item.description || "", item.qty, item.uom || "unit"]);
      }
    }

    // Assign vendors & send notification email
    const assignedEmails = [];
    if (vendorIds && Array.isArray(vendorIds)) {
      const numericVendorIds = vendorIds.map(Number).filter(Boolean);
      for (const vId of numericVendorIds) {
        await db.query(`
          INSERT INTO tbl_rfq_vendors (rfq_id, vendor_id, status)
          VALUES ($1, $2, 'Assigned')
        `, [rfqId, vId]);

        // Get email of vendor
        const vRes = await db.query("SELECT email, vendor_name FROM tbl_vendors WHERE vendor_id = $1", [vId]);
        if (vRes.rows.length > 0) {
          const vendor = vRes.rows[0];
          assignedEmails.push(vendor);
        }
      }
    }

    // Log in activity logs
    await db.query(`
      INSERT INTO tbl_activity_logs (user_id, action, details)
      VALUES ($1, 'RFQ Created', $2)
    `, [userId, `${rfqNo} was published and invitations sent to ${vendorIds ? vendorIds.length : 0} vendors.`]);

    await db.query("COMMIT");

    // Send emails asynchronously
    for (const v of assignedEmails) {
      try {
        const subject = `New RFQ Assigned: ${title} (${rfqNo})`;
        const html = `
          <h3>Vendor Invitation: Request for Quotation</h3>
          <p>Dear ${v.vendor_name},</p>
          <p>You have been assigned to submit a quotation for the following RFQ:</p>
          <ul>
            <li><strong>RFQ Number:</strong> ${rfqNo}</li>
            <li><strong>Title:</strong> ${title}</li>
            <li><strong>Deadline Date:</strong> ${deadline}</li>
          </ul>
          <p>${description}</p>
          <br/>
          <p>Please log in to your Vendor Workspace to view itemized specifications and submit your bid.</p>
          <p>Regards,<br/>Procurement Team</p>
        `;
        await sendEmail({ to: v.email, subject, html });
      } catch (err) {
        console.warn(`Failed to send RFQ notification email to ${v.email}:`, err.message);
      }
    }

    res.status(201).json({ message: "RFQ created and vendors notified successfully.", rfqNo });
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Create RFQ Error:", error);
    res.status(500).json({ message: "Failed to publish RFQ." });
  }
};

// 3. Submit Vendor Quotation
const submitQuotation = async (req, res) => {
  const { rfqId, vendorId, amount, deliveryDays, notes } = req.body;
  const userId = req.user.id;

  try {
    await db.query("BEGIN");

    // Find internal numeric RFQ ID
    const rfqRes = await db.query("SELECT rfq_id, title FROM tbl_rfq WHERE rfq_no = $1", [rfqId]);
    if (rfqRes.rows.length === 0) {
      throw new Error(`RFQ reference ${rfqId} not found.`);
    }
    const internalRfqId = rfqRes.rows[0].rfq_id;

    // Insert quotation
    const qtnRes = await db.query(`
      INSERT INTO tbl_quotations (rfq_id, vendor_id, submission_date, delivery_days, total_amount, remarks, status)
      VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, 'Submitted')
      RETURNING quotation_id
    `, [internalRfqId, Number(vendorId), Number(deliveryDays), Number(amount), notes]);

    const qtnId = qtnRes.rows[0].quotation_id;
    const qtnNo = `QTN-2026-${String(qtnId).padStart(3, '0')}`;

    await db.query(`
      UPDATE tbl_quotations 
      SET quotation_no = $1 
      WHERE quotation_id = $2
    `, [qtnNo, qtnId]);

    // Update assignment status
    await db.query(`
      UPDATE tbl_rfq_vendors 
      SET status = 'Responded' 
      WHERE rfq_id = $1 AND vendor_id = $2
    `, [internalRfqId, Number(vendorId)]);

    // Insert matching items for simplicity
    const rfqItems = await db.query("SELECT rfq_item_id, quantity FROM tbl_rfq_items WHERE rfq_id = $1", [internalRfqId]);
    for (const item of rfqItems.rows) {
      // Proportional amount based on items
      const itemPrice = Math.round(Number(amount) / rfqItems.rows.length);
      await db.query(`
        INSERT INTO tbl_quotation_items (quotation_id, rfq_item_id, unit_price, quantity, amount)
        VALUES ($1, $2, $3, $4, $5)
      `, [qtnId, item.rfq_item_id, itemPrice / item.quantity, item.quantity, itemPrice]);
    }

    // Automatically create a pending Approval entry for Manager
    await db.query(`
      INSERT INTO tbl_approvals (quotation_id, status, remarks)
      VALUES ($1, 'Pending', 'Awaiting Manager Review')
    `, [qtnId]);

    // Log action
    await db.query(`
      INSERT INTO tbl_activity_logs (user_id, action, details)
      VALUES ($1, 'Quotation Received', $2)
    `, [userId, `Quotation ${qtnNo} submitted for RFQ ${rfqId}.`]);

    await db.query("COMMIT");
    res.json({ message: "Quotation submitted and approval requested.", qtnNo });
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Submit Quotation Error:", error);
    res.status(500).json({ message: error.message || "Failed to submit quotation." });
  }
};

// 4. Decide Approval (Manager workflow)
const decideApproval = async (req, res) => {
  const { id } = req.params; // approval_id
  const { decision, remarks } = req.body;
  const userId = req.user.id;

  try {
    await db.query("BEGIN");

    const status = decision === "approved" ? "Approved" : "Rejected";

    const appUpdate = await db.query(`
      UPDATE tbl_approvals
      SET status = $1, remarks = $2, approved_by = $3, approval_date = CURRENT_DATE
      WHERE approval_id = $4
      RETURNING quotation_id
    `, [status, remarks, userId, Number(id)]);

    if (appUpdate.rows.length === 0) {
      throw new Error(`Approval entry with ID ${id} not found.`);
    }

    const qtnId = appUpdate.rows[0].quotation_id;

    // Get quotation details
    const qRes = await db.query(`
      SELECT q.total_amount, q.rfq_id, q.vendor_id, v.email, v.vendor_name, r.title, r.rfq_no, q.quotation_no
      FROM tbl_quotations q
      JOIN tbl_vendors v ON q.vendor_id = v.vendor_id
      JOIN tbl_rfq r ON q.rfq_id = r.rfq_id
      WHERE q.quotation_id = $1
    `, [qtnId]);

    const qtn = qRes.rows[0];

    if (decision === "approved" && qtn) {
      // 1. Generate Purchase Order
      const poRes = await db.query(`
        INSERT INTO tbl_purchase_orders (quotation_id, po_date, total_amount, status)
        VALUES ($1, CURRENT_DATE, $2, 'Issued')
        RETURNING po_id
      `, [qtnId, qtn.total_amount]);

      const poId = poRes.rows[0].po_id;
      const poNo = `PO-2026-${String(poId).padStart(3, '0')}`;

      await db.query(`
        UPDATE tbl_purchase_orders
        SET po_no = $1
        WHERE po_id = $2
      `, [poNo, poId]);

      // Copy items to tbl_po_items
      await db.query(`
        INSERT INTO tbl_po_items (po_id, rfq_item_id, quantity, unit_price, amount)
        SELECT $1, rfq_item_id, quantity, unit_price, amount
        FROM tbl_quotation_items
        WHERE quotation_id = $2
      `, [poId, qtnId]);

      // 2. Generate Invoice
      const tax = Math.round(qtn.total_amount * 0.18);
      const total = Math.round(qtn.total_amount * 1.18);
      const invRes = await db.query(`
        INSERT INTO tbl_invoices (po_id, invoice_date, subtotal, tax_amount, total_amount, email_sent, status)
        VALUES ($1, CURRENT_DATE, $2, $3, $4, FALSE, 'Ready')
        RETURNING invoice_id
      `, [poId, qtn.total_amount, tax, total]);

      const invId = invRes.rows[0].invoice_id;
      const invNo = `INV-2026-${String(invId).padStart(3, '0')}`;

      await db.query(`
        UPDATE tbl_invoices
        SET invoice_no = $1
        WHERE invoice_id = $2
      `, [invNo, invId]);

      // Update RFQ status to Closed
      await db.query("UPDATE tbl_rfq SET status = 'Closed' WHERE rfq_id = $1", [qtn.rfq_id]);

      // Log PO and Invoice generation
      await db.query(`
        INSERT INTO tbl_activity_logs (user_id, action, details)
        VALUES ($1, 'PO & Invoice Generated', $2)
      `, [userId, `PO ${poNo} and Invoice ${invNo} automatically generated for winning bid ${qtn.quotation_no}.`]);
    }

    await db.query(`
      INSERT INTO tbl_activity_logs (user_id, action, details)
      VALUES ($1, $2, $3)
    `, [userId, `Approval ${status}`, `Approval PR-2026-${id} was ${decision}. Remarks: ${remarks}`]);

    await db.query("COMMIT");
    res.json({ message: `Approval decided: ${status}` });
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Decide Approval Error:", error);
    res.status(500).json({ message: error.message || "Failed to make approval decision." });
  }
};

// 5. Generate Purchase Order
const generatePO = async (req, res) => {
  const { quotationId } = req.body;
  const userId = req.user.id;

  try {
    await db.query("BEGIN");

    // Check if PO already exists
    const qtnRes = await db.query("SELECT quotation_id, total_amount, quotation_no FROM tbl_quotations WHERE quotation_no = $1", [quotationId]);
    if (qtnRes.rows.length === 0) {
      throw new Error(`Quotation ${quotationId} not found.`);
    }
    const qtn = qtnRes.rows[0];

    const exists = await db.query("SELECT po_id FROM tbl_purchase_orders WHERE quotation_id = $1", [qtn.quotation_id]);
    if (exists.rows.length > 0) {
      throw new Error(`Purchase order already exists for quotation ${quotationId}.`);
    }

    const poRes = await db.query(`
      INSERT INTO tbl_purchase_orders (quotation_id, po_date, total_amount, status)
      VALUES ($1, CURRENT_DATE, $2, 'Issued')
      RETURNING po_id
    `, [qtn.quotation_id, qtn.total_amount]);

    const poId = poRes.rows[0].po_id;
    const poNo = `PO-2026-${String(poId).padStart(3, '0')}`;

    await db.query(`
      UPDATE tbl_purchase_orders SET po_no = $1 WHERE po_id = $2
    `, [poNo, poId]);

    // Copy items to PO items
    await db.query(`
      INSERT INTO tbl_po_items (po_id, rfq_item_id, quantity, unit_price, amount)
      SELECT $1, rfq_item_id, quantity, unit_price, amount
      FROM tbl_quotation_items
      WHERE quotation_id = $2
    `, [poId, qtn.quotation_id]);

    await db.query(`
      INSERT INTO tbl_activity_logs (user_id, action, details)
      VALUES ($1, 'Purchase Order Created', $2)
    `, [userId, `PO ${poNo} generated from quotation ${quotationId}.`]);

    await db.query("COMMIT");
    res.json({ message: "PO generated successfully.", poNo });
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Generate PO Error:", error);
    res.status(500).json({ message: error.message || "Failed to generate Purchase Order." });
  }
};

// 6. Generate Invoice
const generateInvoice = async (req, res) => {
  const { poId } = req.body;
  const userId = req.user.id;

  try {
    await db.query("BEGIN");

    const poRes = await db.query("SELECT po_id, total_amount, po_no FROM tbl_purchase_orders WHERE po_no = $1", [poId]);
    if (poRes.rows.length === 0) {
      throw new Error(`PO ${poId} not found.`);
    }
    const po = poRes.rows[0];

    const exists = await db.query("SELECT invoice_id FROM tbl_invoices WHERE po_id = $1", [po.po_id]);
    if (exists.rows.length > 0) {
      throw new Error(`Invoice already exists for PO ${poId}.`);
    }

    const subtotal = po.total_amount;
    const tax = Math.round(subtotal * 0.18);
    const total = Math.round(subtotal * 1.18);

    const invRes = await db.query(`
      INSERT INTO tbl_invoices (po_id, invoice_date, subtotal, tax_amount, total_amount, email_sent, status)
      VALUES ($1, CURRENT_DATE, $2, $3, $4, FALSE, 'Ready')
      RETURNING invoice_id
    `, [po.po_id, subtotal, tax, total]);

    const invId = invRes.rows[0].invoice_id;
    const invNo = `INV-2026-${String(invId).padStart(3, '0')}`;

    await db.query(`
      UPDATE tbl_invoices SET invoice_no = $1 WHERE invoice_id = $2
    `, [invNo, invId]);

    await db.query(`
      INSERT INTO tbl_activity_logs (user_id, action, details)
      VALUES ($1, 'Invoice Generated', $2)
    `, [userId, `Invoice ${invNo} generated for PO ${poId}.`]);

    await db.query("COMMIT");
    res.json({ message: "Invoice generated successfully.", invoiceNo: invNo });
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Generate Invoice Error:", error);
    res.status(500).json({ message: error.message || "Failed to generate Invoice." });
  }
};

// 7. Email Invoice
const emailInvoice = async (req, res) => {
  const { id } = req.params; // invoice_no
  const userId = req.user.id;

  try {
    await db.query("BEGIN");

    await db.query(`
      UPDATE tbl_invoices
      SET email_sent = TRUE, status = 'Emailed'
      WHERE invoice_no = $1
    `, [id]);

    await db.query(`
      INSERT INTO tbl_activity_logs (user_id, action, details)
      VALUES ($1, 'Invoice Emailed', $2)
    `, [userId, `Invoice ${id} marked as dispatched/emailed to vendor.`]);

    await db.query("COMMIT");
    res.json({ message: "Invoice marked as emailed." });
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Email Invoice Error:", error);
    res.status(500).json({ message: "Failed to dispatch email." });
  }
};

// 8. Toggle Vendor Verification
const toggleVendorStatus = async (req, res) => {
  const { id } = req.params; // vendor_id
  const userId = req.user.id;

  try {
    await db.query("BEGIN");

    const vRes = await db.query("SELECT status, vendor_name FROM tbl_vendors WHERE vendor_id = $1", [Number(id)]);
    if (vRes.rows.length === 0) {
      throw new Error("Vendor not found.");
    }
    const v = vRes.rows[0];
    const newStatus = v.status === "Verified" ? "Pending Review" : "Verified";

    await db.query(`
      UPDATE tbl_vendors
      SET status = $1
      WHERE vendor_id = $2
    `, [newStatus, Number(id)]);

    await db.query(`
      INSERT INTO tbl_activity_logs (user_id, action, details)
      VALUES ($1, 'Vendor Verification Toggled', $2)
    `, [userId, `Vendor "${v.vendor_name}" status toggled to "${newStatus}".`]);

    await db.query("COMMIT");
    res.json({ message: `Vendor status toggled to ${newStatus}.` });
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Toggle Vendor Status Error:", error);
    res.status(500).json({ message: "Failed to toggle vendor status." });
  }
};

// 9. Toggle User Status
const toggleUserStatus = async (req, res) => {
  const { id } = req.params; // user_id
  const userId = req.user.id;

  try {
    await db.query("BEGIN");

    const uRes = await db.query("SELECT status, full_name FROM tbl_users WHERE user_id = $1", [Number(id)]);
    if (uRes.rows.length === 0) {
      throw new Error("User not found.");
    }
    const u = uRes.rows[0];
    const newStatus = u.status === "Active" ? "Suspended" : "Active";

    await db.query(`
      UPDATE tbl_users
      SET status = $1
      WHERE user_id = $2
    `, [newStatus, Number(id)]);

    await db.query(`
      INSERT INTO tbl_activity_logs (user_id, action, details)
      VALUES ($1, 'User Access Toggled', $2)
    `, [userId, `User "${u.full_name}" access toggled to "${newStatus}".`]);

    await db.query("COMMIT");
    res.json({ message: `User status toggled to ${newStatus}.` });
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Toggle User Status Error:", error);
    res.status(500).json({ message: "Failed to toggle user access." });
  }
};

module.exports = {
  getState,
  createRfq,
  submitQuotation,
  decideApproval,
  generatePO,
  generateInvoice,
  emailInvoice,
  toggleVendorStatus,
  toggleUserStatus
};
