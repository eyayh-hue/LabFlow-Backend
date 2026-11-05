const Analyse = require("../Models/Analyse");

exports.createAnalyse = async (req, res) => {
  try {
    const { patient, NumeroDossier, TypeAnalyse, HeurePrelevement, Tests } =
      req.body;

    // التصحيح: استمرار استخدام نموذج Analyse واستيفاء الحقول المطلوبة في الـ Schema
    const newAnalyse = new Analyse({
      patient,
      biologiste: req.user._id,
      NumeroDossier,
      TypeAnalyse,
      HeurePrelevement: HeurePrelevement || "08:00", // قيمة افتراضية في حال لم تُرسل
      Tests,
    });

    await newAnalyse.save();

    res.status(200).json({
      message: "Analyse ajoutée avec succès",
      newAnalyse,
    });
  } catch (error) {
    console.error("Erreur createAnalyse:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getAnalyse = async (req, res) => {
  try {
    const analyse = await Analyse.find()
      .populate("patient", "name email phone")
      .populate("biologiste", "name");
    res.status(200).json(analyse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllAnalyseBio = async (req, res) => {
  try {
    const analyses = await Analyse.find()
      .populate("patient", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json(analyses);
  } catch (error) {
    console.error("getAllAnalyseBio error:", error);
    res.status(500).json({ message: error.message });
  }
};
