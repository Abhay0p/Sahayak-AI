import { Router } from 'express';
import { getHelpRequests, createHelpRequest, updateHelpRequest } from '../controllers/helpController';

const router = Router();

router.get('/request', getHelpRequests);
router.post('/request', createHelpRequest);
router.patch('/request/:id', updateHelpRequest);

export default router;
