import { Router } from 'express';
import * as paperController from '../controllers/paperController';
import multer from 'multer';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

router.get('/papers', paperController.listAllPapers);
router.get('/projects/:projectId/papers', paperController.listPapers);
router.post('/projects/:projectId/papers', paperController.createPaper);
router.patch('/papers/:id', paperController.updatePaper);
router.delete('/papers/:id', paperController.deletePaper);
router.post('/upload-pdf', upload.single('pdf'), paperController.uploadPdf);

export default router;
