import { createReadStream, createWriteStream, unlinkSync, promises as fs } from 'fs';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { pipeline } from 'stream/promises';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bits
const SALT = 'a-very-secure-and-fixed-salt'; // In a real app, this might be unique per file or user

// Get the encryption key from environment variables.
const masterKey = "fjsdfjsdjfklsdjfkdjsfljsdklfklsdfkljflkdjklfjdsfjsjf";
if (!masterKey) {
    throw new Error('ENCRYPTION_KEY environment variable is not set. Please provide a strong secret key.');
}

// Derive a stable key from the master key using scrypt.
const derivedKey = scryptSync(masterKey, SALT, KEY_LENGTH);

export const encryptFile = async (sourcePath: string, destinationPath: string) => {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, derivedKey, iv);

    const source = createReadStream(sourcePath);
    const destination = createWriteStream(destinationPath);

    // Prepend the IV to the encrypted file.
    destination.write(iv);

    await pipeline(source, cipher, destination);

    const tag = cipher.getAuthTag();
    destination.end(tag);

    // Clean up the original unencrypted file.
    unlinkSync(sourcePath);
};

export const decryptFile = async (sourcePath: string, responseStream: NodeJS.WritableStream) => {
    const { size } = await fs.stat(sourcePath);

    // 1. Read the IV from the beginning of the file.
    const iv = await new Promise<Buffer>((resolve, reject) => {
        const stream = createReadStream(sourcePath, { start: 0, end: IV_LENGTH - 1 });
        stream.on('data', (chunk: string | Buffer) => resolve(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        stream.on('error', reject);
    });

    // 2. Read the GCM authentication tag from the end of the file.
    const tag = await new Promise<Buffer>((resolve, reject) => {
        const stream = createReadStream(sourcePath, { start: size - TAG_LENGTH });
        stream.on('data', (chunk: string | Buffer) => resolve(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        stream.on('error', reject);
    });

    // 3. Create a stream for the actual encrypted data (between IV and tag).
    const encryptedDataStream = createReadStream(sourcePath, {
        start: IV_LENGTH,
        end: size - TAG_LENGTH - 1,
    });

    const decipher = createDecipheriv(ALGORITHM, derivedKey, iv);
    decipher.setAuthTag(tag);

    await pipeline(encryptedDataStream, decipher, responseStream);
};
