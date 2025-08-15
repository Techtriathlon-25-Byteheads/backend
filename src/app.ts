import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fileUpload from 'express-fileupload';
import { authenticateToken } from './middlewares/auth.middleware';
import { decryptFile } from './services/encryption.service';
import prisma from './config/prisma';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import departmentRoutes from './routes/department.routes';
import serviceRoutes from './routes/service.routes';
import appointmentRoutes from './routes/appointment.routes';
import userRoutes from './routes/user.routes';
import uploadRoutes from './routes/upload.routes';
import analyticsRoutes from './routes/analytics.routes';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

// Ensure required directories exist
const uploadsDir = path.join(process.cwd(), 'uploads');
const encryptedDir = path.join(uploadsDir, 'encrypted');
const tempDir = path.join(uploadsDir, 'temp');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(encryptedDir)) fs.mkdirSync(encryptedDir);
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

const app = express();

app.use(cors());
app.use(express.json());

// Configure express-fileupload
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/',
}));

// Set up routes
app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/user', userRoutes);
app.use('/api', uploadRoutes);
app.use('/api/analytics', analyticsRoutes);

// File serving route (remains the same)
app.get('/api/files/:externalDocumentId', async (req, res) => {
    try {
        const { externalDocumentId } = req.params;
        const document = await prisma.submittedDocument.findUnique({
            where: { externalDocumentId },
        });

        if (!document) {
            return res.status(404).send('File not found.');
        }

        res.setHeader('Content-Type', document.mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${document.originalFilename}"`);

        await decryptFile(document.filePath, res);

    } catch (error) {
        console.error('Error serving file:', error);
        res.status(500).send('Error serving file.');
    }
});

export default app;
