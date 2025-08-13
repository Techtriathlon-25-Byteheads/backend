import prisma from '../config/prisma';
import axios from 'axios';

export const generateOtp = async (userId: string): Promise<string> => {
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

  await prisma.factOtp.create({
    data: {
      userId,
      otpCode,
      expiresAt,
      deliveryMethod: 'sms',
      otpType: 'phone_verification',
    },
  });

  return otpCode;
};

export const sendOtp = async (recipient: string, otp: string) => {
  const TEXTLK_API_TOKEN = process.env.TEXTLK_API_TOKEN;
  const TEXTLK_SENDER_ID = process.env.TEXTLK_SENDER_ID;

  if (!TEXTLK_API_TOKEN || !TEXTLK_SENDER_ID) {
    console.error('TEXTLK_API_TOKEN or TEXTLK_SENDER_ID not set in environment variables.');
    return;
  }

  try {
    const response = await axios.post(
      'https://app.text.lk/api/v3/sms/send',
      {
        recipient,
        sender_id: TEXTLK_SENDER_ID,
        type: 'plain',
        message: `Your OTP is: ${otp}. It is valid for 10 minutes.`,
      },
      {
        headers: {
          'Authorization': `Bearer ${TEXTLK_API_TOKEN}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(`OTP ${otp} sent to ${recipient}. Text.lk response:`, response.data);
  } catch (error) {
    //@ts-ignore
    console.error('Error sending OTP via Text.lk:', error.response ? error.response.data : error.message);
  }
};

export const verifyOtp = async (userId: string, otpCode: string): Promise<boolean> => {
  const otp = await prisma.factOtp.findFirst({
    where: {
      userId,
      otpCode,
      isActive: true,
      expiresAt: { gte: new Date() },
      usedAt: null,
    },
  });

  if (!otp) {
    return false;
  }

  await prisma.factOtp.update({
    where: { otpId: otp.otpId },
    data: { usedAt: new Date(), isActive: false },
  });

  await prisma.dimUsers.update({
    where: { userId },
    data: { isVerified: true },
  });

  return true;
};