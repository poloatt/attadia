import express from 'express';
import * as googleCalendarController from '../controllers/googleCalendarController.js';
import { checkAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/callback', googleCalendarController.handleCallback);

router.use(checkAuth);

router.get('/auth-url', googleCalendarController.getAuthUrl);
router.get('/status', googleCalendarController.getStatus);
router.put('/config', googleCalendarController.updateConfig);
router.delete('/disconnect', googleCalendarController.disconnect);
router.post('/sync', googleCalendarController.manualSync);
router.get('/calendars', googleCalendarController.getCalendars);

export default router;
