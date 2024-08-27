import express from 'express';
import authedUser from '../middlewares/authMdlware.js';
import userCont from '../controllers/userCont.js';
const router = express.Router();


//payment routes
router.get('/getkey', userCont.getKey);
router.post('/payment-verification/:userId', userCont.paymentVerification);

// app.post('/paymentpaypal', async (req, res) => { });
router.get('/successpaypal', userCont.successPaypal);
router.get('/failedpaypal', userCont.failedPaypal);


router.use(authedUser);
router.post('/checkout', userCont.checkout);
router.get('/paymentdetails/:paymentId', userCont.getPaymentDetails);

export default router
