import {Router} from 'express';
import { loginUser, googleLogin, logoutUser, registerUser ,refreshAccessToken, changePassword, getCurrentUser, updateUserName, uploadAvatar, updateProfile, forgotPassword, verifyOTP, resetPassword} from '../controllers/user.controller.js';
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }
    ]),
    registerUser
    )

router.route("/login").post(loginUser);
router.route("/google-login").post(googleLogin);

// Forgot Password routes (public)
router.route("/forgot-password").post(forgotPassword);
router.route("/verify-otp").post(verifyOTP);
router.route("/reset-password").post(resetPassword);

//secured routes
router.route("/logout").post(verifyJWT ,logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changePassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-username").post(verifyJWT, updateUserName);
router.route("/upload-avatar").post(verifyJWT, upload.single("avatar"), uploadAvatar);
router.route("/update-profile").put(verifyJWT, updateProfile);


// In user.routes.js, add this test route
router.get("/test", (req, res) => {
    res.status(200).json({ message: "Test route works!" });
});

export { router as userRouter };