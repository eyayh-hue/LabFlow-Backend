const User = require("../Models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../Utils/sendEmail");

exports.SignUp = async (req, res) => {
  try {
    const { name, email, password, role, phone, secondaryPhone } = req.body;

    const foundUser = await User.findOne({ email });
    if (foundUser) {
      return res.status(400).send({ errors: [{ msg: "User already exists" }] });
    }

    const newUser = new User({
      name,
      email,
      password,
      role,
      phone,
      secondaryPhone,
    });

    const salt = 10;
    const hashedPassword = await bcrypt.hash(password, salt);
    newUser.password = hashedPassword;

    await newUser.save();

    const payload = { _id: newUser._id };
    const token = jwt.sign(payload, process.env.privateKey || "secretKey", {
      expiresIn: "7d",
    });

    res.status(200).send({
      msg: "User created successfully",
      user: newUser,
      token: `Bearer ${token}`,
    });
  } catch (error) {
    res
      .status(500)
      .send({ errors: [{ msg: "Server error", error: error.message }] });
  }
};

exports.SignIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .send({ errors: [{ msg: "Bad credentials (User not found)" }] });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .send({ errors: [{ msg: "Bad credentials (Wrong password)" }] });
    }

    const payload = { _id: user._id };
    const token = jwt.sign(payload, process.env.privateKey || "secretKey", {
      expiresIn: "7d",
    });

    res.status(200).send({
      msg: "Login successfully",
      token: `Bearer ${token}`,
      user,
    });
  } catch (error) {
    res
      .status(500)
      .send({ errors: [{ msg: "Server error", error: error.message }] });
  }
};

exports.current = async (req, res) => {
  try {
    res.status(200).send({ user: req.user });
  } catch (error) {
    res
      .status(500)
      .send({ errors: [{ msg: "Server error", error: error.message }] });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.status(200).send({ msg: "Account deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .send({ errors: [{ msg: "Server error", error: error.message }] });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone, secondaryPhone, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).send({ errors: [{ msg: "User not found" }] });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.secondaryPhone =
      secondaryPhone !== undefined ? secondaryPhone : user.secondaryPhone;

    if (newPassword && newPassword.trim() !== "") {
      const salt = 10;
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();
    res.status(200).send({ msg: "Profile updated successfully", user });
  } catch (error) {
    res
      .status(500)
      .send({ errors: [{ msg: "Server error", error: error.message }] });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).send({ msg: "users fetched successfully", users });
  } catch (error) {
    res
      .status(500)
      .send({ errors: [{ msg: "Server error", error: error.message }] });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, secondaryPhone, role } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (secondaryPhone !== undefined) updates.secondaryPhone = secondaryPhone;
    if (role !== undefined) updates.role = role;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true },
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).send({ errors: [{ msg: "User not found" }] });
    }

    res
      .status(200)
      .send({ msg: "User updated successfully", user: updatedUser });
  } catch (error) {
    res.status(500).send({
      errors: [{ msg: "Failed to update user", error: error.message }],
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
      return res.status(400).send({
        errors: [{ msg: "You can't delete your own admin account here" }],
      });
    }

    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).send({ errors: [{ msg: "User not found" }] });
    }

    res.status(200).send({ msg: "User deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .send({ errors: [{ msg: "Server error", error: error.message }] });
  }
};

exports.createUserByAdmin = async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res
        .status(400)
        .send({ errors: [{ msg: "Not authorized, Admin Access only" }] });
    }
    const { name, email, role, phone, secondaryPhone } = req.body;
    const foundUser = await User.findOne({ email });
    if (foundUser) {
      return res
        .status(400)
        .send({ errors: [{ msg: "User already exists with this mail" }] });
    }
    const generatedPassword = crypto.randomBytes(4).toString("hex");
    const salt = 10;
    const hashedPassword = await bcrypt.hash(generatedPassword, salt);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || "User",
      phone,
      secondaryPhone,
    });

    await newUser.save();
    const message = `Bonjour ${name},\n\nVotre compte a été créé avec succès sur LabFlow \nVotre mot de passe temporaire est : ${generatedPassword}\n\nVeuillez vous connecter et modifier votre mot de passe.\n\nCordialement,\nL'équipe LabFlow`;
    try {
      await sendEmail({
        email: newUser.email,
        subject: "Vos identifiants de connexion - LabFlow",
        message,
      });
    } catch (emailError) {
      console.error("Erreur d'envoi d'email:", emailError);
    }
    res.status(200).send({
      msg: "User created successfully and password sent via email!",
      user: newUser,
    });
  } catch (error) {
    res
      .status(500)
      .send({ errors: [{ msg: "Server error", error: error.message }] });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. البحث عن المستخدم بالبريد الإلكتروني
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .send({
          errors: [{ msg: "Aucun utilisateur trouvé avec cet e-mail" }],
        });
    }

    // 2. توليد كلمة مرور مؤقتة جديدة
    const generatedPassword = crypto.randomBytes(4).toString("hex");
    const salt = 10;
    user.password = await bcrypt.hash(generatedPassword, salt);
    await user.save();

    // 3. إعداد محتوى البريد الإلكتروني
    const message = `Bonjour ${user.name},\n\nVous avez demandé la réinitialisation de votre mot de passe pour LabFlow.\nVotre nouveau mot de passe temporaire est : ${generatedPassword}\n\nVeuillez vous connecter avec ce mot de passe et le modifier dès que possible.\n\nCordialement,\nL'équipe LabFlow`;

    // 4. إرسال البريد باستخدام الدالة المتوفرة لديك
    await sendEmail({
      email: user.email,
      subject: "Réinitialisation de votre mot de passe - LabFlow",
      message,
    });

    res.status(200).send({
      success: true,
      message:
        "Un e-mail contenant votre nouveau mot de passe a été envoyé avec succès !",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).send({
      errors: [
        {
          msg: "Erreur serveur lors de l'envoi de l'e-mail",
          error: error.message,
        },
      ],
    });
  }
};
