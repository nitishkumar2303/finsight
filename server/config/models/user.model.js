import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 3,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) { // Hash the password before saving the user
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
userSchema.methods.isValidPassword = async function (password) { // Compare the provided password with the hashed password
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateJWT = function () { // Generate a JWT token for the user
  return jwt.sign(
    {
      email: this.email,
      _id: this._id,
    },
    process.env.JWT_SECRET
  );
};

const User = mongoose.model("User", userSchema); // Create the User model from the schema
export default User;
