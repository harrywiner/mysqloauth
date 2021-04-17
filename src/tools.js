const mysql = require('mysql')
require('dotenv').config()

const TABLE_NAME = "users"
const DB_NAME = "accounts"

module.exports = {
  DBConnect: function (dbName) {
    var connection = mysql.createConnection({
      host: process.env.DB_URL,
      user: process.env.DB_USR,
      password: process.env.DB_PWD,
      port: 3306,
      database: dbName
    });

    return new Promise(function (resolve, reject) {
      connection.connect((error) => {
        if (error) {
          console.log("Error connecting to the database: " + error.name);
          reject(error);
        } else {
          console.log("Connected!");
          resolve(connection);
        }
      });
    });
  },

  getUser: async (email) => {
    con = await module.exports.DBConnect(DB_NAME)
    query = `SELECT * from ${TABLE_NAME} where email like ?`
    inputs = [email]
    query = con.format(query, inputs)

    return new Promise((resolve, reject) => {
      con.query(query, (err, results, fields) => {
        if (err) {
          throw err
        }
        resolve({ err: err, user: results[0] })
      })
    })
  },
  InsertUser: async ({ email, hash }) => {
    con = await module.exports.DBConnect(DB_NAME)
    query = `insert into ${TABLE_NAME} (email, password) values (?, ?);`
    inputs = [email, hash]
    query = con.format(query, inputs)
    return new Promise((resolve, reject) => {
      con.query(query, function (error, results, fields) {
        if (error) {
          throw error
        }

        if (results.affectedRows === 1) {
          // if the data has been entered successfully
          resolve({ success: true, userID: results.insertId })
        } else {
          reject({ success: false, err: "row mismatch in createUser" })
        }

      })
    })

  },
  getUserByID: async (user_id) => {
    con = await module.exports.DBConnect(DB_NAME)
    query = `SELECT * from ${TABLE_NAME} where id = ?`
    inputs = [user_id]
    query = con.format(query, inputs)

    return new Promise((resolve, reject) => {
      con.query(query, (err, results, fields) => {
        if (err) {
          throw err
        }
        resolve({ err: err, user: results[0] })
      })
    })
  },
};
