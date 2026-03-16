import cloudinary from "../config/cloudinary.js";

const uploadImageToCloudinary = async (imageFile, options = {}) => {
  if (options.provider && options.provider == "google") {
    const imageURL = imageFile.replace(/=s\d+(-c)?$/, "=s400-c");

    const result = await cloudinary.uploader.upload(imageURL, {
      folder: options.folder,
    });

    return result.secure_url;
  }
  // 2. upload buffer to cloudinary
  const result = await new Promise((resolve, reject) => {
    console.log("Reached upload promise");
    const stream = cloudinary.uploader.upload_stream(
      {
        ...options,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    stream.end(imageFile.buffer);
  });

  return result.secure_url;
};

export default uploadImageToCloudinary;
