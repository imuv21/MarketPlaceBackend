
import userCont from '../controllers/userCont.js';
import express from 'express';
const router = express();
router.use(express.json());

router.get('/mail-verification', userCont.mailVerification);


export default router;