import jwt from "jwt-simple";
import moment from "moment";

const secret = 'secret_word';

const CreateToken = (data:any) => {
    const payload = { data:data, iat:moment(), exp:moment().add(30,'days')};
    return jwt.encode(payload, secret);
}

export default CreateToken;