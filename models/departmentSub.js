const mongoose = require("mongoose");

const schema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    parent: {
      type: mongoose.Types.ObjectId,
      ref: "Department",
      required: true,
    },
  },
  { timestamps: true }
);

const model = mongoose.model("DepartmentSub", schema);

module.exports = model;
