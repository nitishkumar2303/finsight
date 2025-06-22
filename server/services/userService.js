import User from "../config/models/user.model.js";

export const createUser = async ({ email, password ,name }) => { // Create a new user
  if (!email || !password || !name) {
    throw new Error("Email , password and Name are required");
  }

  const user = new User({ email, password ,name}); // Create a new user instance
  return await user.save(); // password will be hashed automatically by pre("save")
};

export const findUserByEmail = async (email) => { // Find a user by email
  return await User.findOne({ email });
};