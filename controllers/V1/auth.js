const usersModel = require("../../models/user");
const registerValidator = require("../../validators/register");
const banModel = require("../../models/banUsers");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  const validatorResult = registerValidator(req.body);
  if (validatorResult != true) {
    return res.status(422).json(validatorResult);
  }
  const { name, userName, email, phone, password } = req.body;

  const isBanPhone = await banModel.findOne({ phone });

  if (isBanPhone) {
    return res.status(409).json({ message: "This phone number is ban!!" });
  }

  const isPhoneExist = await usersModel.findOne({ phone });

  if (isPhoneExist) {
    return res
      .status(409)
      .json({ message: "Phone number is already registered" });
  }

  const isUserExists = await usersModel.findOne({
    $or: [{ userName }, { email }],
  });

  if (isUserExists) {
    if (isUserExists.userName === userName) {
      return res.status(409).json({ message: "User name is already exist" });
    } else if (isUserExists.email === email) {
      return res.status(409).json({ message: "Email is already in use" });
    }
  }

  const countUsers = await usersModel.countDocuments();

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await usersModel.create({
    name,
    userName,
    email,
    phone,
    password: hashedPassword,
    role: countUsers > 0 ? "USER" : "ADMIN",
  });

  const userObject = newUser.toObject();
  Reflect.deleteProperty(userObject, "password");

  const accessToken = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
    expiresIn: "30 day",
  });

  return res.status(201).json({ newUser: userObject, accessToken });
};

exports.login = async (req, res) => {
  const { identifier, password } = req.body;

  const user = await usersModel
    .findOne({
      $or: [{ email: identifier }, { userName: identifier }],
    })
    .lean();

  if (!user) {
    return res.status(409).json({ message: "Email or user name not valid!!" });
  }
  const comparPassword = await bcrypt.compare(password, user.password);

  if (!comparPassword) {
    return res.status(409).json({ message: "Password not valid!!" });
  }
  const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "30 day",
  });
  return res.status(200).json({
    message: "You have successfully logged into your account",
    accessToken,
  });
};

exports.getMe = async (req, res) => {
  if (user.email !== identifier) {
    return res.status(401).json({ message: "Email not found !!" });
  } else if (user.userName !== identifier) {
    return res.status(401).json({ message: "User name not found !!" });
  }
};
