import { Router } from 'express';
import { getHelpRequests, createHelpRequest } from '../controllers/helpController';

const router = Router();

router.get('/request', getHelpRequests);
router.post('/request', createHelpRequest);

export default router;
