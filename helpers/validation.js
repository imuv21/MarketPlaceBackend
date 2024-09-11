import { check, body } from "express-validator";

const signupValidator = [
    check("firstName").not().isEmpty()
        .withMessage("First name is required"),
    check("lastName").not().isEmpty()
        .withMessage("Last name is required"),
    check("email").isEmail()
        .normalizeEmail({
            gmail_remove_dots: true
        })
        .withMessage("Invalid email address"),
    check("phone").isString()
        .not().isEmpty()
        .withMessage("Phone number is required"),
    check("countryCode").not().isEmpty()
        .withMessage("Country code is required"),
    check("password").isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
    })
        .withMessage("Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character"),
    body("confirmPassword").custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error("Passwords do not match");
        }
        return true;
    }),
    check("country").not().isEmpty()
        .withMessage("Country is required"),
    check("role").not().isEmpty()
        .withMessage("Role is required"),
];

const loginValidator = [
    check("email").isEmail()
        .normalizeEmail({
            gmail_remove_dots: true
        })
        .withMessage("Invalid email address"),
    check("password").isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
    })
        .withMessage("Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character"),
    check("role").not().isEmpty()
        .withMessage("Role is required"),
];

const forgotPasswordValidator = [
    check("email").isEmail()
        .normalizeEmail({
            gmail_remove_dots: true
        })
        .withMessage("Invalid email address"),
    check("role").not().isEmpty()
        .withMessage("Role is required"),
];

const sendMailVerificationValidator = [
    check("email").isEmail()
        .normalizeEmail({
            gmail_remove_dots: true
        })
        .withMessage("Invalid email address")
];

export { signupValidator, loginValidator, forgotPasswordValidator, sendMailVerificationValidator };