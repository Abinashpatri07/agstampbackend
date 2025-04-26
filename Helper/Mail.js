import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  service: 'gmail',
  auth: {
    user: "abinashpatri5@gmail.com",
    pass: "hdvheaoucxksgipo",
  },
});

export async function mail(to = [],subject = "",message = "") {
  try {
    const info = await transporter.sendMail({
      from: `"Agstamp" <abinashpatri5@gmail.com>`,
      to: `${to.join(",")}`,
      subject: subject,
      html: message,
    });
    return info;
  } catch (error) {
    return error
  }
}

