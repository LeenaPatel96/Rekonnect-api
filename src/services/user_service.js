const func = require('../config/function');
const UserDetailSchema = require('../model/user_model');
const { ObjectId } = require('bson');
var jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
var fs = require('fs');
var handlebars = require('handlebars');
let http = require('https');
var qs = require('querystring');
const userRegisterService = async (body) => {
    console.log(body);
    return new Promise(async (resolve, reject) => {
        let model = {};
        model = new UserDetailSchema(body);
        await model.validate(async function (err, data) {
            if (err) {
                const keys = Object.keys(err.errors)
                console.log(keys)
                keys.map(ele => {
                    func.msCons.errorJson['message'] = err.errors[ele].path + ' is ' + err.errors[ele].kind
                    return resolve(func.msCons.errorJson)
                })
            } else {
                await model.save(function (err, docs) {
                    if (err) {
                        console.log('ssssssssssss', err.errors)
                        if (err.code === 11000) {
                            Object.keys(err.keyValue)
                            func.msCons.errorJson['message'] = Object.keys(err.keyValue) + ' already exists'
                            return resolve(func.msCons.errorJson)
                        }
                    }
                    else if (!docs || docs.length === 0) {
                        func.msCons.errorJson['message'] = 'Error in inserting data'
                        func.msCons.errorJson['error'] = err
                        return resolve(func.msCons.errorJson)
                    } else {
                        var transporter = nodemailer.createTransport({
                            host: 'smtp.gmail.com',
                            port: 587,
                            secure: false,
                            auth: {
                                user: "bloombit.co@gmail.com",
                                pass: "bloombit@goa",
                            },
                        });
                        fs.readFile('index.html', { encoding: 'utf-8' }, function (err, html) {
                            if (err) {
                                console.log(err);
                            } else {
                                var template = handlebars.compile(html);
                                var replacements = {
                                    firstName: body.first_name,
                                    lastName: body.last_name
                                };
                                var htmlToSend = template(replacements);
                                console.log(body.email)
                                var mailOptions = {
                                    from: "bloombit.co@gmail.com",
                                    to: body.email,
                                    subject: "Subject",
                                    html: htmlToSend
                                };
                                transporter.sendMail(mailOptions, function (err, info) {
                                    if (err) {
                                        console.log(err)
                                    } else {
                                        console.log(info);
                                    }
                                    func.msCons.successJson['data'] = docs;
                                    return resolve(func.msCons.successJson)
                                })
                            }
                        });
                    }
                });
            }
        });
    })
}

const userLoginService = async (body) => {
    console.log(body);
    let query = {
        $and: [{
            email: body.email
        }, {
            password: body.password
        }]
    }
    return new Promise((resolve, reject) => {
        UserDetailSchema.find(query, function (err, docs) {
            console.log(docs)
            if (!docs || docs.length === 0) {
                func.msCons.notFoundJson['message'] = 'No user found';
                return resolve(func.msCons.notFoundJson)
            } else if (err) {
                func.msCons.errorJson['message'] = err;
                return resolve(func.msCons.errorJson)
            } else {
                var token = jwt.sign({ id: docs._id }, 'intralogicitsolutions', {
                    expiresIn: 86400 // expires in 24 hours
                });
                docs[0]['token'] = token;
                func.msCons.successJson['data'] = docs;
                return resolve(func.msCons.successJson)
            }
        });
    })
}

module.exports = { userRegisterService, userLoginService }