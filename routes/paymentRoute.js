import express from 'express';
import authedUser from '../middlewares/authMdlware.js';
import userCont from '../controllers/userCont.js';
const router = express.Router();


//Razorpay
router.get('/getkey', userCont.getKey);
router.post('/payment-verification/:userId', userCont.paymentVerification);

//Paypal
router.get('/successpaypal', userCont.successPaypal);
router.get('/failedpaypal', userCont.failedPaypal);

//Payment Routes
router.use(authedUser);
router.post('/paypal', userCont.paypal);
router.post('/razorpay', userCont.razorpay);
router.get('/paymentdetails/:paymentId', userCont.getPaymentDetails);

export default router
