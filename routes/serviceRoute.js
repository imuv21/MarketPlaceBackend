import express from 'express';
import serviceCont from '../controllers/serviceCont.js';

const router = express.Router();

//Url routes
router.post('/generateurl', serviceCont.shortUrlGenerator);
router.get('/redirect/:shortId', serviceCont.redirect);
router.get('/analytics/:shortId', serviceCont.analytics);

//send bulk emails
router.post('/sendbulkemails', serviceCont.sendEmailsInBulk);

//streams
router.get('/streams', serviceCont.streams);



export default router