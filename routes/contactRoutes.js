import express from "express";
import { createContact,getContacts,getContactById } from "../controllers/contactController.js";

const router = express.Router();

router.post("/", createContact);
router.get("/", getContacts);
router.get("/:id", getContactById);

export default router;
