import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { UploadedFile } from 'express-fileupload';
import { randomUUID } from 'crypto';
import * as path from 'path';
import { encryptFile } from '../services/encryption.service';
import prisma from '../config/prisma';

const ENCRYPTED_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'encrypted');

export const uploadDocument = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).send({ message: 'No file was uploaded.' });
        }

        const { appointmentId } = req.body;
        if (!appointmentId) {
            return res.status(400).send({ message: 'appointmentId is required.' });
        }

        // The name of the input field (e.g. "document") is used to retrieve the file.
        const uploadedFile = req.files.document as UploadedFile;

        const externalDocumentId = randomUUID();
        const encryptedFilePath = path.join(ENCRYPTED_UPLOAD_DIR, externalDocumentId);

        // Encrypt the file from its temporary location
        await encryptFile(uploadedFile.tempFilePath, encryptedFilePath);

        // Create a record in the database
        const newDocument = await prisma.submittedDocument.create({
            data: {
                appointmentId: appointmentId,
                externalDocumentId: externalDocumentId,
                filePath: encryptedFilePath,
                mimeType: uploadedFile.mimetype,
                originalFilename: uploadedFile.name,
                fileSizeBytes: uploadedFile.size,
            },
        });

        res.status(201).json({
            message: 'File uploaded and encrypted successfully.',
            document: newDocument,
        });

    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).send({ message: 'Error uploading file.' });
    }
};
