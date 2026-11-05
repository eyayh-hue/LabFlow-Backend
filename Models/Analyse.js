const mongoose = require("mongoose");

const analyseSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    biologiste: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    NumeroDossier: { type: String, required: true },
    TypeAnalyse: { type: String, required: true },
    Statut: {
      type: String,
      enum: ["En cours de traitement", "Prêt"],
      default: "En cours de traitement",
    },
    HeurePrelevement: { type: String, required: true },
    Tests: [
      {
        testName: { type: String, required: true },
        ValeurResultat: { type: String, required: true },
        ValeurUsuelle: { type: String, required: true },
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Analyse", analyseSchema);
