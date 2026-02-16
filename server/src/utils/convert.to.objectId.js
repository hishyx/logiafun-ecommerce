import mongoose from "mongoose";

export const ArrayStringsToObjectId = (array) => {
  const ObjectIds = array.map((id) => new mongoose.Types.ObjectId(id));

  return ObjectIds;
};
