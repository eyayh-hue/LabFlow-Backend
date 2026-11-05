const express = require("express");
const Analyse = require("../Models/Analyse");
const { isAuth } = require("../Middlewares/isAuth");

const analyseRouter = express.Router();

analyseRouter.post("/add", isAuth, async (req, res) => {
  try {
    const {
      patient,
      NumeroDossier,
      TypeAnalyse,
      Statut,
      HeurePrelevement,
      Tests,
    } = req.body;

    const newAnalyse = new Analyse({
      patient,
      NumeroDossier,
      TypeAnalyse,
      Statut: Statut || "En cours de traitement",
      HeurePrelevement: HeurePrelevement || "08:00",
      Tests,
      biologiste: req.user._id,
    });

    await newAnalyse.save();
    res
      .status(200)
      .json({ message: "Analyse enregistrée avec succès", newAnalyse });
  } catch (error) {
    console.error("ERREUR ADD:", error);
    res.status(500).json({ error: error.message });
  }
});

analyseRouter.get("/getAllAnalyseBio", isAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    const analyses = await Analyse.find({ biologiste: req.user._id })
      .populate("patient")
      .sort({ createdAt: -1 });

    res.status(200).json({ msg: "Analyses list", analyses });
  } catch (error) {
    console.error("ERREUR GET:", error.message);
    console.error(error.stack);
    res.status(500).json({ error: error.message });
  }
});

analyseRouter.put("/update/:id", isAuth, async (req, res) => {
  try {
    const updatedAnalyse = await Analyse.findOneAndUpdate(
      { _id: req.params.id, biologiste: req.user._id },
      { ...req.body, updatedAt: Date.now() },
      { new: true },
    );

    if (!updatedAnalyse) {
      return res.status(404).json({ error: "Analyse introuvable" });
    }

    res
      .status(200)
      .json({ message: "Analyse modifiée avec succès", updatedAnalyse });
  } catch (error) {
    console.error("ERREUR UPDATE:", error);
    res.status(500).json({ error: error.message });
  }
});

analyseRouter.delete("/delete/:id", isAuth, async (req, res) => {
  try {
    const deleted = await Analyse.findOneAndDelete({
      _id: req.params.id,
      biologiste: req.user._id,
    });

    if (!deleted) {
      return res.status(404).json({ error: "Analyse introuvable" });
    }

    res.status(200).json({ message: "Analyse supprimée avec succès" });
  } catch (error) {
    console.error("ERREUR DELETE:", error);
    res.status(500).json({ error: error.message });
  }
});

analyseRouter.get("/getPatientAnalyses", isAuth, async (req, res) => {
  try {
    const analyses = await Analyse.find({ patient: req.user._id })
      .populate("biologiste", "name email")
      .populate("patient", "name email")
      .sort({ createdAt: -1 });
    res.status(200).send({ msg: "Patient analyses list", analyses });
  } catch (error) {
    console.error("ERREUR PATIENT ANALYSES:", error);
    res.status(500).send("Could not get patient analyses");
  }
});

const Notification = require("../Models/Notification");

analyseRouter.get("/admin/getAllAnalyses", isAuth, async (req, res) => {
  try {
    if (req.user.role !== "Admin" && req.user.role !== "SubAdmin") {
      return res.status(403).json({ error: "Accès refusé" });
    }

    const analyses = await Analyse.find({})
      .populate("patient", "name email phone")
      .populate("biologiste", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ msg: "All analyses for admin", analyses });
  } catch (error) {
    console.error("ERREUR ADMIN ANALYSES:", error);
    res.status(500).json({ error: error.message });
  }
});

analyseRouter.put("/admin/update/:id", isAuth, async (req, res) => {
  try {
    if (req.user.role !== "Admin" && req.user.role !== "SubAdmin") {
      return res.status(403).json({ error: "Accès refusé" });
    }

    const { biologiste, NumeroDossier, TypeAnalyse, Statut } = req.body;

    const updatedAnalyse = await Analyse.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true },
    ).populate("biologiste");

    if (biologiste) {
      await Notification.create({
        biologiste: biologiste,
        message: `L'administration a assigné ou mis à jour l'analyse avec le numéro de dossier : ${NumeroDossier || updatedAnalyse.NumeroDossier} pour vous.`,
      });
    }

    res
      .status(200)
      .json({ message: "Analyse mise à jour avec succès", updatedAnalyse });
  } catch (error) {
    console.error("ERREUR ADMIN UPDATE:", error);
    res.status(500).json({ error: error.message });
  }
});

analyseRouter.get("/biologiste/notifications", isAuth, async (req, res) => {
  try {
    const notifications = await Notification.find({
      biologiste: req.user._id,
    }).sort({ createdAt: -1 });
    res.status(200).json({ notifications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

analyseRouter.delete(
  "/biologiste/notification/:id",
  isAuth,
  async (req, res) => {
    try {
      await Notification.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: "Notification supprimée avec succès" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);
analyseRouter.delete("/admin/delete/:id", isAuth, async (req, res) => {
  try {
    if (req.user.role !== "Admin" && req.user.role !== "SubAdmin") {
      return res.status(403).json({ error: "Accès refusé" });
    }

    const deleted = await Analyse.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: "Analyse introuvable" });
    }

    res
      .status(200)
      .json({ message: "Analyse supprimée par l'admin avec succès" });
  } catch (error) {
    console.error("ERREUR ADMIN DELETE:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = analyseRouter;
