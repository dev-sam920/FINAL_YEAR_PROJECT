import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

/**
 * User Schema for SmartMaint
 * Supports three roles: client (tenant), technician, admin
 */
const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Please provide a full name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false, // Don't include password by default in queries
    },
    role: {
      type: String,
      enum: ['client', 'technician', 'admin'],
      default: 'client',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    unitAddress: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    state: {
      type: String,
      trim: true,
      default: '',
    },
    lga: {
      type: String,
      trim: true,
      default: '',
    },
    profilePicture: {
      type: String,
      default: null,
    },
    specialty: {
      type: String,
      trim: true,
      default: 'General',
    },
    profileCompleted: {
      type: Boolean,
      default: false,
    },
    idDocument: {
      type: String,
      default: null,
    },
    yearsOfExperience: {
      type: Number,
      default: null,
    },
    bio: {
      type: String,
      trim: true,
      default: '',
    },
    accountStatus: {
      type: String,
      enum: ['pending', 'approved', 'declined'],
      default: 'approved',
    },
    passwordChanged: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

/**
 * Pre-save hook to hash password before saving
 * Only runs if password field is modified
 */
userSchema.pre('save', async function (next) {
  // Only hash if password is new or has been modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Method to compare entered password with stored hashed password
 * @param {string} enteredPassword - Password entered by user
 * @returns {Promise<boolean>} - True if passwords match
 */
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
