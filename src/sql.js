require('dotenv').config()
const { Sequelize, DataTypes, Model, Op } = require('sequelize');

// Sequelize
const sequelize = new Sequelize('accounts', process.env.DB_USR, process.env.DB_PWD, {
    host: process.env.DB_URL,
    dialect: 'mysql'
});


sequelize.authenticate().then(() => {
    console.log('Connection has been established successfully.');
}).catch(error => {
    console.error('Unable to connect to the database:', error);
});

class User extends Model { }

User.init({
    // Model attributes are defined here
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        // allowNull defaults to true
        allowNull: false
    },
}, {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    modelName: 'User', // We need to choose the model name
    logging: false
});

User.sync({ force: true, alter: true })

async function Select() {
    list = await User.findAll()

    console.log("from select" + JSON.stringify(list[0].dataValues))
}

// Select()

function InsertUser({ email, hash }) {
    return new Promise(async (resolve, reject) => {
        ser = await User.create({ email: email, password: hash });
        if (user)
            resolve({ success: true })
        else
            reject({ success: false, err: "err in inserting user" })
    }).catch((err) => {
        throw err
    })

}





async function GetPasswordHash({ email }) {
    return new Promise(async (resolve, reject) => {
        user = await User.findAll({
            attributes: ['password'],
            where: {
                email: {
                    [Op.eq]: email
                }
            }
        })

        resolve(user[0].dataValues.password)
    }).catch((error) => {
        throw error
    })

}

async function UserExists({ email }) {
    return new Promise(async (resolve, reject) => {
        user = await User.findAll({
            where: {
                email: {
                    [Op.eq]: email
                }
            }
        })
        if (user) {
            resolve(true)
        } else {
            resolve(false)
        }
    }).catch(err => {
        reject(err)
    })
}

module.exports = {
    GetPasswordHash: GetPasswordHash,
    InsertUser: InsertUser
}