const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {

    if (!req.cookies.rftkn) {
        res.status(401).send({msg: "Unauthorized! Missing Token"})
    } else {
        jwt.verify(req.cookies.rftkn, process.env.RFTKN_SECRET, async (err, rftknDec) => {
            let date = new Date();
            let time = date.getTime();            
            if (!err) {
                if (req.cookies.actkn) {
                    jwt.verify(
                      req.cookies.actkn,
                      process.env.ACTKN_SECRET,
                      async (acError, actknDec) => {
                        if (!acError) {
                          next();
                        } else {
                            const payload = {
                                user: {
                                id: rftknDec.user.id,
                                },
                            };
                            jwt.sign(
                              payload,
                              process.env.ACTKN_SECRET,
                              { expiresIn: 60 },
                              async (err, actkn) => {
                                if (!err) {
                                  date.setTime(time + 60000);
                                  console.log({ date: date });
                                  res.cookie("actkn", actkn, {
                                    domain: "*",
                                    secure: false,
                                    httpOnly: true,
                                    expires: date,
                                  });
                                  next();
                                }
                              }
                            );
                          console.log({error: `Gen new token`});
                        }
                      }
                    );

                } else {
                    res.status(409).send({message: "Missing Tokens. Login Required!~"})
                }
            } else {
                res.status(409).send({error: "TOKEN EXPIRED"})
            }
        })
    }
}