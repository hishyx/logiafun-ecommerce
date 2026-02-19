import mongoose from "mongoose";

export const ArrayStringsToObjectId = (array) => {
  const ObjectIds = array.map((id) => new mongoose.Types.ObjectId(id));

  return ObjectIds;
};

export const StringIdToObjectId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid item id");
  }
  return new mongoose.Types.ObjectId(id);
};
