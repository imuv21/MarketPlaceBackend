import urlModel from '../models/Url.js';
import { nanoid } from 'nanoid';

const BACKEND_URL = process.env.BACKEND_URL;

class serviceCont {

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
}


export default serviceCont;