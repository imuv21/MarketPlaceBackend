
import express from 'express';
import authedUser from '../middlewares/authMdlware.js';
import { sendMailVerificationValidator, signupValidator, loginValidator, forgotPasswordValidator } from '../helpers/validation.js';
import userCont from '../controllers/userCont.js';
import upload from '../middlewares/upload.js';
const router = express.Router();

//Public routes
router.post('/signup', upload.single('image'), signupValidator, userCont.userSignup);
router.post('/send-mail-verification', sendMailVerificationValidator, userCont.sendMailVerification);
router.post('/login', loginValidator, userCont.userLogin);
router.get('/logout', userCont.userLogout);
router.delete('/delete-user', userCont.deleteUser);
router.post('/forgotpassword', forgotPasswordValidator, userCont.forgotPassword);
router.post('/reset-password/:id/:token', userCont.resetPassword);
router.post('/verify-otp', userCont.verifyOtp);

// Private routes
router.use(authedUser);
router.post('/changepassword', userCont.changePassword);
router.get('/loggeduser', userCont.loggedUser);
router.get('/get-movie', userCont.getMovie);
router.post('/add-movie', upload.single('poster'), userCont.addMovie);
router.delete('/delete-movie', userCont.deleteMovie);
router.put('/update-profile', upload.single('image'), userCont.userProfileUpdate);

//social
router.get('/all-users', userCont.seeAllUsers);
router.get('/notifications', userCont.getNotifications);
router.delete('/notifications/:notificationId', userCont.deleteNotification);
router.get('/friend-reqs', userCont.getFriendReqs);
router.get('/friends', userCont.getFriends);
router.post('/send-friend-request', userCont.sendFriendRequest);
router.post('/cancel-friend-request', userCont.cancelFriendRequest);
router.post('/response-friend-request', userCont.responseToFriendRequest);
router.post('/unfriend', userCont.unfriend);
router.post('/send-message', userCont.sendMessages);
router.get('/get-message/:senderId/:receiverId', userCont.getMessages);
router.get('/search', userCont.searchUsers);



export default router;
