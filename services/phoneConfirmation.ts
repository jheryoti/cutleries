import { ConfirmationResult } from 'firebase/auth';

// Holds the phone confirmation result between auth screen and OTP screen
let phoneConfirmation: ConfirmationResult | null = null;

export const setPhoneConfirmation = (c: ConfirmationResult) => { phoneConfirmation = c; };
export const getPhoneConfirmation = () => phoneConfirmation;
export const clearPhoneConfirmation = () => { phoneConfirmation = null; };
