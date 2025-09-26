import Contact from "../models/Contact.js";
import nodemailer from "nodemailer";


export const createContact = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ msg: "Please fill all required fields" });
    }

    // 1) Save to DB
    const contact = new Contact({ name, email, phone, subject, message });
    await contact.save();

    // 2) Prepare mail transporter only if credentials present

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {

      // Mail credentials missing — return success for DB save, with mail info

      return res.status(201).json({
        msg: "Message received successfully! (saved to DB)",
        mail: { sent: false, reason: "no-mail-credentials" }
      });
    }

    // 3) Create transporter and mail options

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
  from: `"${escapeHtml(name)}" <${process.env.EMAIL_USER}>`, 
  to: process.env.EMAIL_USER,   // (receiver)
  replyTo: email,               // reply to user
  subject: subject || "New Contact Message",
  html: `
    <h3>New Contact Form Submission</h3>
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(phone || "N/A")}</p>
    <p><strong>Subject:</strong> ${escapeHtml(subject || "N/A")}</p>
    <p><strong>Message:</strong><br/>${nl2br(escapeHtml(message))}</p>
  `
};

    // 4) Send email
    
    try {
      const info = await transporter.sendMail(mailOptions);
      // success
      return res.status(201).json({
        msg: "Message received and email sent successfully!",
        mail: { sent: true, info: info }
      });
    } catch (mailErr) {
      console.error("Error sending mail:", mailErr);
      return res.status(201).json({
        msg: "Message received successfully! (saved to DB, but mail failed)",
        mail: { sent: false, error: mailErr.message }
      });
    }

  } catch (err) {
    console.error("Create contact error:", err);
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};


export const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find();

    if (!contacts || contacts.length === 0) {
      return res.status(404).json({ success: false, msg: "No contacts found" });
    }

    res.status(200).json({ success: true, data: contacts });
  } catch (err) {
    console.error("Get contacts error:", err);
    res.status(500).json({ success: false, msg: "Server error", error: err.message });
  }
};


export const getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ msg: "Message not found" });
    }
    res.json(contact);
  } catch (err) {
    console.error("Get contact by id error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};


//  security purpose ----------

function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function nl2br(str) {
  return String(str).replace(/\n/g, '<br/>');
}
