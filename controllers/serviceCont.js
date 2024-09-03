import urlModel from '../models/Url.js';
import zlib from 'zlib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { nanoid } from 'nanoid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_URL = process.env.BACKEND_URL;


class serviceCont {

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