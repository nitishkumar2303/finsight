import { createUser, findUserByEmail } from "../services/userService.js";



export const registerUser = async (req, res) => { // Register a new user
  const { email, password, name } = req.body;

  try {
    if (!email || !password || !name) { // Validate input
      return res
        .status(400)
        .json({ message: "Email, password, and name are required." });
    }

    const existingUser = await findUserByEmail(email); // Check if user already exists
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email." });
    }

    const user = await createUser({ email, password, name }); // C
    const token = user.generateJWT(); // Generate JWT token for the user
    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const loginUser = async (req, res) => { // Log in an existing user
  const { email, password } = req.body; // Validate input

  try {
    const user = await findUserByEmail(email); // Find user by email
    if (!user) {
      return res.status(404).json({ message: "User not found" }); // User not found
    }
    const isValidPassword = await user.isValidPassword(password); // Check if the provided password is valid
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid password" });
    }
    const token = user.generateJWT(); // Generate JWT token for the user and the reason why we use JWT is to securely transmit information between parties as a JSON object. It is compact, readable, and digitally signed, which makes it a good choice for authentication.
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
