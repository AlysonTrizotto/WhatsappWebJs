import express from "express";
import WhatsAppController  from "../controllers/whatsapp.js";

const whatsapp = express.Router();      

whatsapp.get("/", (req, res) => {
    res.status(200).send("Curso de JS");
});

whatsapp.get('/connect',        WhatsAppController.initialize);
whatsapp.post('/sendMessage',   WhatsAppController.sendMessage);


export default whatsapp;