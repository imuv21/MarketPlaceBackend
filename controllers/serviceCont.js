import urlModel from '../models/Url.js';
import zlib from 'zlib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { nanoid } from 'nanoid';
import sendMail from '../helpers/mailer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_URL = process.env.BACKEND_URL;


class serviceCont {

    //Send bulk emails

    static sendEmailsInBulk = async (req, res) => {
        const { emailArray, subject, msg } = req.body;
        try {
            // const subject = `Web Development Services for Your Upcoming Projects`;

            //             const msg = `
            //              <!DOCTYPE html>
            // <html lang="en">

            // <head>
            //     <meta charset="UTF-8">
            //     <meta name="viewport" content="width=device-width, initial-scale=1.0">
            //     <title>Website Development Services</title>
            //     <style>
            //         body {
            //             font-family: Arial, sans-serif;
            //             margin: 0;
            //             padding: 0;
            //             background-color: #f4f4f4;
            //         }

            //         .container {
            //             width: 90%;
            //             max-width: 600px;
            //             margin: 20px auto;
            //             background-color: #ffffff;
            //             border-radius: 8px;
            //             box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            //         }

            //         .header {
            //             background-color: #007bff;
            //             color: white;
            //             padding: 20px;
            //             text-align: center;
            //             border-top-left-radius: 8px;
            //             border-top-right-radius: 8px;
            //         }

            //         .content {
            //             padding: 20px;
            //         }

            //         h1 {
            //             font-size: 24px;
            //             margin-bottom: 10px;
            //         }

            //         h2 {
            //             font-size: 20px;
            //             margin: 15px 0;
            //         }

            //         p {
            //             line-height: 1.6;
            //             margin: 10px 0;
            //         }

            //         .pricing-table {
            //             width: 100%;
            //             border-collapse: collapse;
            //             margin: 20px 0;
            //         }

            //         .pricing-table th,
            //         .pricing-table td {
            //             border: 1px solid #dddddd;
            //             text-align: left;
            //             padding: 8px;
            //         }

            //         .pricing-table th {
            //             background-color: #f2f2f2;
            //         }

            //         .cta {
            //             display: block;
            //             text-align: center;
            //             background-color: #28a745;
            //             color: white;
            //             padding: 10px;
            //             text-decoration: none;
            //             border-radius: 5px;
            //             margin: 20px 0;
            //         }

            //         .footer {
            //             background-color: #f4f4f4;
            //             text-align: center;
            //             padding: 10px;
            //             font-size: 12px;
            //             color: #777777;
            //         }
            //     </style>
            // </head>

            // <body>
            //     <div class="container">
            //         <div class="header">
            //             <h1>Your Future Awaits!</h1>
            //         </div>
            //         <div class="content">
            //             <h2>Hello [Client Name],</h2>
            //             <p>Are you ready to take your online presence to the next level? We offer comprehensive web development
            //                 services tailored to your needs, whether you're looking to build a dynamic web application or a simple
            //                 static site.</p>
            //             <h2>Our Services Include:</h2>
            //             <ul>
            //                 <li>MERN Stack Development: Create robust, scalable applications.</li>
            //                 <li>Bootstrap: Design responsive and visually appealing websites.</li>
            //                 <li>Static Sites: Fast, lightweight, and easy-to-maintain solutions.</li>
            //             </ul>
            //             <h2>Pricing</h2>
            //             <table class="pricing-table">
            //                 <tr>
            //                     <th>Service</th>
            //                     <th>Average Price</th>
            //                 </tr>
            //                 <tr>
            //                     <td>MERN Stack Development</td>
            //                     <td>$2000</td>
            //                 </tr>
            //                 <tr>
            //                     <td>Bootspring Backend</td>
            //                     <td>$1500</td>
            //                 </tr>
            //                 <tr>
            //                     <td>Static Site Development</td>
            //                     <td>$800</td>
            //                 </tr>
            //             </table>
            //             <p>Each package includes:</p>
            //             <ul>
            //                 <li>Responsive Design</li>
            //                 <li>SEO Optimization</li>
            //                 <li>Basic Security Features</li>
            //                 <li>Post-Launch Support</li>
            //             </ul>
            //             <p>If you're interested in any of our services or would like to discuss your project in more detail, feel
            //                 free to reply to this email or give us a call!</p>
            //             <a href="mailto:your-email@example.com" class="cta">Get Started Today!</a>
            //         </div>
            //         <div class="footer">
            //             <p>&copy; 2024 Your Company Name | All Rights Reserved</p>
            //             <p>Contact us: your-email@example.com | (123) 456-7890</p>
            //         </div>
            //     </div>
            // </body>

            // </html>
            //              `;

            await Promise.all(emailArray.map(email => sendMail(email, subject, msg)));

            return res.status(200).json({ status: "success", message: "Emails are sent to everyone!" });
        } catch (error) {
            return res.status(500).json({ status: "failed", message: "Server error. Please try again later." });
        }
    };

    //Url shortner

    static shortUrlGenerator = async (req, res) => {
        try {
            const { url } = req.body;

            if (!url) {
                return res.status(400).json({ status: "failed", message: "URL is required!" });
            }
            try {
                new URL(url);
            } catch (error) {
                return res.status(400).json({ status: "failed", message: "Invalid URL format!" });
            }

            const shortId = nanoid(8);
            await urlModel.create({
                shortId: shortId,
                redirectUrl: url,
                visitHistory: [],
            });

            return res.status(200).json({ status: "success", shortUrl: `${BACKEND_URL}/service/redirect/${shortId}`, shortId: shortId, message: "Short url generated" });
        } catch (error) {
            return res.status(500).json({ status: "failed", message: error.message });
        }
    };

    static redirect = async (req, res) => {
        try {
            const { shortId } = req.params;

            if (!shortId) {
                return res.status(400).json({ status: "failed", message: "Short id is required!" });
            }

            const entry = await urlModel.findOneAndUpdate({ shortId },
                { $push: { visitHistory: { timestamp: Date.now() } } }
            );

            res.redirect(entry.redirectUrl);
        } catch (error) {
            return res.status(500).json({ status: "failed", message: error.message });
        }
    };

    static analytics = async (req, res) => {
        try {
            const { shortId } = req.params;

            if (!shortId) {
                return res.status(400).json({ status: "failed", message: "Short id is required!" });
            } else {
                const result = await urlModel.findOne({ shortId });

                if (!result) {
                    return res.status(404).json({ status: "failed", message: "No record found with the provided shortId." });
                } else {
                    const visitHistory = result.visitHistory || [];
                    return res.status(200).json({ status: "success", analytics: visitHistory });
                }
            }
        } catch (error) {
            return res.status(500).json({ status: "failed", message: error.message });
        }
    };

    //Streams and using zlib

    static streams = async (req, res) => {
        const filePath = path.join(__dirname, '../rough/convo.txt');
        const zfilePath = path.join(__dirname, '../rough/convo.zip');
        const gzipStream = fs.createReadStream(filePath).pipe(zlib.createGzip()).pipe(fs.createWriteStream(zfilePath));

        gzipStream.on('finish', () => {
            const stream = fs.createReadStream(filePath, 'utf8');
            stream.on('data', (chunk) => res.write(chunk));
            stream.on('end', () => res.end());
            stream.on('error', (err) => {
                res.status(500).send('Internal Server Error');
            });
        });

        gzipStream.on('error', (err) => {
            res.status(500).send('Internal Server Error');
        });
    };
}


export default serviceCont;