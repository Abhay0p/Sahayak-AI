import { Router } from 'express';
import { getDashboard, getPatients, getPatientById, createCareNote, getCareNotes, updateRoutineStatus } from '../controllers/healthcareController';
import { getContacts } from '../controllers/contactsController';

const healthcareRoutes = Router();
healthcareRoutes.get('/',          getDashboard);      // GET /api/healthcare
healthcareRoutes.get('/patients',  getPatients);       // GET /api/healthcare/patients
healthcareRoutes.get('/patients/:patientId', getPatientById); // GET /api/healthcare/patients/:id
healthcareRoutes.post('/patients/:patientId/notes', createCareNote); // POST /api/healthcare/patients/:id/notes
healthcareRoutes.get('/patients/:patientId/notes', getCareNotes); // GET /api/healthcare/patients/:id/notes
healthcareRoutes.patch('/patients/:patientId/routine', updateRoutineStatus); // PATCH /api/healthcare/patients/:id/routine
const contactsRoutes = Router();
contactsRoutes.get('/', getContacts);

export { healthcareRoutes, contactsRoutes };
