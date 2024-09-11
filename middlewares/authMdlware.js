import jwt from 'jsonwebtoken';
import { userModel } from '../models/User.js';

const authedUser = async (req, res, next) => {

    const { authorization } = req.headers;
    if (authorization && authorization.startsWith('Bearer')) {
        const token = authorization.split(' ')[1];
        try {
            const { userID } = jwt.verify(token, process.env.JWT_SECRET_KEY);
            req.user = await userModel.findById(userID).select('-password');
            if (!req.user) {
                return res.status(401).send({ "status": "failed", "message": "Unauthorized user" });
            }
            next();
        } catch (error) {
            res.status(401).send({ "status": "failed", "message": "Unauthorized user" });
        }
    } else {
        res.status(401).send({ "status": "failed", "message": "Unauthorized user, no token" });
    }
}

export default authedUser;
