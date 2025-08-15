import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { generateOtp, sendOtp, verifyOtp as verifyOtpService } from '../services/otp.service';
import jwt from 'jsonwebtoken';

export const signup = async (req: Request, res: Response) => {
  const { fullName, nic, dob, address, contactNumber } = req.body;
  console.log("Sign up came in!")
  console.log(req.body);

  if (!fullName || !nic || !dob || !address || !contactNumber) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const existingUser = await prisma.dimUsers.findUnique({
      where: { nationalId: nic },
    });

    if (existingUser) {
      return res.status(409).json({ message: 'User with this NIC already exists. Please login.' });
    }

    const user = await prisma.dimUsers.create({
      data: {
        userId: `USR${Date.now()}`,
        firstName: fullName.split(' ')[0],
        lastName: fullName.split(' ').slice(1).join(' '),
        nationalId: nic,
        dateOfBirth: new Date(dob),
        address: address,
        phone: contactNumber,
        role: 'CITIZEN',
      },
    });

    const otp = await generateOtp(user.userId);
    // await sendOtp(contactNumber, otp); 
    res.status(201).json({ message: 'User created successfully. Please verify OTP.', userId: user.userId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { nic, phone } = req.body;

  if (!nic || !phone) {
    return res.status(400).json({ message: 'NIC and phone number are required' });
  }

  try {
    const user = await prisma.dimUsers.findUnique({
      where: { nationalId: nic },
    });

    if (!user || user.phone !== phone) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.phone) {
        return res.status(400).json({ message: 'User does not have a phone number for OTP delivery.' });
    }

    const otp = await generateOtp(user.userId);
    // await sendOtp(user.phone, otp);

    res.status(200).json({ message: 'OTP sent successfully', userId: user.userId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return res.status(400).json({ message: 'User ID and OTP are required' });
  }

  try {
    const isValid = await verifyOtpService(userId, otp);

    // if (!isValid) {
    //   return res.status(401).json({ message: 'Invalid or expired OTP' });
    // }

    const user = await prisma.dimUsers.findUnique({ where: { userId } });

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const token = jwt.sign({ userId: user.userId, role: user.role }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });

    res.status(200).json({ message: 'OTP verified successfully', token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
