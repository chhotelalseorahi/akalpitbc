import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { sendEmail } from "./brevo.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const rootPath = path.resolve(__dirname, "../..");

async function getTemplateHtml(htmlPath) {
    try {
        const mailPath = path.resolve(rootPath, htmlPath);
        console.log("Template path:", mailPath);
        const emailContent = await fs.readFile(mailPath, "utf8");
        return emailContent;
    } catch (err) {
        throw new Error(`Could not load html template: ${err.message}`);
    }
}

export const signupOtpEmail = async (to, subject, otp) => {
    try {
        console.log("📧 Attempting to send OTP email...");
        console.log("OTP:", otp);
        console.log("Recipient:", to);
        
        const emailContent = await getTemplateHtml("emailTemplate/emailOtp.html");
        const html = emailContent.replace("{{OTP}}", otp);
        
        await sendEmail({ toEmail: to, subject, html });
        
        console.log("✅ SUCCESS: Email sent successfully!");
        return { 
            success: true, 
            message: "Email sent successfully", 
            otp: otp 
        };
    } catch (err) {
        console.error("❌ FAILURE: Email sending failed");
        console.error("Error:", err.message);
        return { 
            success: false, 
            message: err.message, 
            otp: otp 
        };
    }
};