import express from "express";
import whatsapp from "./whatsappRoutes.js";

const routes = (app) => {
    app.use(express.json(), whatsapp)
};

export default routes;