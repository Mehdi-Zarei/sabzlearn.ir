const courseModel = require("../../models/course");
const commentsModel = require("../../models/comments");
const userCourseModel = require("../../models/userCourse");
const sessionsModel = require("../../models/sessions");
const { isValidObjectId } = require("mongoose");

exports.create = async (req, res) => {
  const {
    name,
    status,
    descriptions,
    categoryID,
    href,
    support,
    price,
    discount,
  } = req.body;

  const courseExist = await courseModel.findOne({
    $or: [{ name: req.body.name }, { href: req.body.href }],
  });

  if (courseExist) {
    return res.status(409).json({ message: "This course already exists!!" });
  }

  const course = await courseModel.create({
    name,
    status,
    descriptions,
    cover: req.file.filename,
    creator: req.user._id,
    categoryID,
    href,
    support,
    price,
    discount,
  });

  const mainCourse = await courseModel
    .findById(course._id)
    .populate("creator", "-password -__v");

  return res.status(201).json(mainCourse);
};

exports.addSessions = async (req, res) => {
  const { title, time, free } = req.body;

  const sessionExist = await sessionsModel.findOne({ title });

  if (sessionExist) {
    return res.status(409).json({ message: "This session already exists!!" });
  }

  const session = await sessionsModel.create({
    title,
    time,
    free,
    video: req.file.filename,
    course: req.params.id,
  });

  return res.status(201).json(session);
};

exports.adminGetRecentSessions = async (req, res) => {
  const sessions = await sessionsModel
    .find({})
    .populate("course", "name")
    .lean();
  return res.json(sessions);
};

exports.getSessionInfo = async (req, res) => {
  const course = await courseModel.findOne({ href: req.params.href }).lean();

  const session = await sessionsModel.findOne({ _id: req.params.sessionID });

  const sessions = await sessionsModel.find({ course: course._id }).lean();

  return res.status(200).json({ session, sessions });
};

exports.removeSession = async (req, res) => {
  const validObjectIdResult = isValidObjectId(req.params.id);

  if (validObjectIdResult != true) {
    return res.status(409).json({ message: "Session ID not valid !!" });
  }

  const remove = await sessionsModel.findOneAndDelete({ _id: req.params.id });

  if (!remove) {
    return res.status(404).json({ message: "Session not found !!" });
  }

  return res.json({ message: "Session deleted successfully !!", remove });
};

exports.register = async (req, res) => {
  const isUserAlreadyRegisteredInCourse = await userCourseModel.findOne({
    course: req.params.id,
    user: req.user._id,
  });

  if (isUserAlreadyRegisteredInCourse) {
    return res
      .status(409)
      .json({ message: "You have already registered for this course !!" });
  }

  const register = await userCourseModel.create({
    course: req.params.id,
    user: req.user._id,
    price: req.body.price,
  });

  return res.status(201).json({
    message:
      "Your registration for this course has been successfully completed.",
  });
};

exports.getOne = async (req, res) => {
  //   //TODO If the user does not have a token, it will not show any details, but the code should be such that if the user does not have a token, it will only show free sessions.

  const { href } = req.params;

  const course = await courseModel
    .findOne({ href }, "-__v")
    .populate("creator");

  const didUserRegisterToThisCourse = !!(await userCourseModel.findOne({
    course: course._id,
    user: req.user._id,
  }));

  let sessions;

  if (didUserRegisterToThisCourse) {
    sessions = await sessionsModel.find({ course: course._id }, "-__v");
  } else {
    sessions = await sessionsModel.find(
      { course: course._id, free: 1 },
      "-__v"
    );
  }

  const comment = await commentsModel
    .find({ course: course._id, isAccept: 1 })
    .populate("creator", "-password -__v");

  const userCourseCount = await userCourseModel
    .find({ course: course._id })
    .count();

  return res.json({
    course,
    sessions,
    comment,
    userCourseCount,
    didUserRegisterToThisCourse,
  });
};

exports.removeCourse = async (req, res) => {
  const isValidIDResult = isValidObjectId(req.params);

  if (!isValidIDResult) {
    return res.status(409).json({ message: "Course ID not valid !!" });
  }

  const remove = await courseModel.findOneAndDelete({ _id: req.params.id });

  if (!remove) {
    return res
      .status(404)
      .json({ message: "Course not found with this ID !!" });
  }

  return res.status(200).json(remove);
};

exports.getRelatedCourse = async (req, res) => {
  const { href } = req.params;

  const course = await courseModel.findOne({ href });

  if (!course) {
    return res.status(404).json({ message: "Course not found !!" });
  }

  let relatedCourses = await courseModel
    .find({ categoryID: course.categoryID })
    .lean();

  relatedCourses = relatedCourses.filter((course) => course.href !== href);

  res.status(200).json(relatedCourses);
};
