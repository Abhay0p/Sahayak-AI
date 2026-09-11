import { Router } from 'express';
import { getGames, submitScore, validateNovelty, recordUsage, getChallenge } from '../controllers/gameController';

const router = Router();

router.get('/', getGames);
router.post('/score', submitScore);
router.post('/validate-novelty', validateNovelty);
router.post('/record-usage', recordUsage);
router.post('/challenge', getChallenge);

export default router;
