// Imports
const mysql = require('mysql2');
const {Cache} = require("./cache.js");
const {getAppInfo} = require("./steamUtils");

// Database Info
const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;

class AppHandler {

    constructor() {
        // Cache for storing AppInfo (From Steam Web API)
        this.appInfoCache = new Cache();

        // Cache for storing App List (From Database)
        this.appListCache = new Cache();


        // Create Database Query Pool
        this.pool = mysql.createPool({
            host: DB_HOST,
            port: DB_PORT,
            user: DB_USER,
            password: DB_PASSWORD,
            database: DB_NAME
        });
    }

    /**
     * Function to get app info for a given appid
     * @param appid is the given appid
     * @returns A Promise of app info on success or null on failure
     * REQUIRED: Use then() when calling function
     */
    getAppInfo(appid) {
        // Check Cache For Info
        let info = this.appInfoCache.getData(appid);
        if(info != null) {
            console.log(`Cache Hit For ${appid}`);
            return Promise.resolve(info);
        }

        // Get Info From API and Update Cache
        return getAppInfo(appid).then(appInfo => {
            this.appInfoCache.update(appid, appInfo);
            console.log(`Cache Miss For ${appid}`);
            return appInfo;
        });
    }

    /**
     * Function to search database for entries that closely match given string
     * @param str is the given string
     * @returns A Promise of a result set of entries that closely match a given string (can be empty)
     */
    search(str) {
        // Limit Search String to 1024 Characters
        if(str.length > 1024) {
            console.log(`Search String Too Large`);
            return Promise.resolve(null);
        }

        // Check Cache For Search Info
        const appList = this.appListCache.getData(str);
        if(appList != null) {
            console.log(`Cache Hit For ${str}`);
            return Promise.resolve(appList);
        }

        console.log(`Cache Miss For ${str}`);
        // Get Search Results from Database and Update Cache
        return this._getAppListFromString(str).then(results => {
            this.appListCache.update(str, results);
            return results;
        }).catch((error) => {
            console.error(error);
            return [] // Return Empty List in error
        });
    }

    /**
     * Function to Asynchronously Make A Query to Database For A Search Given a String
     * @param str is the given string
     * @returns A Promise of the result set
     * @private
     */
    _getAppListFromString(str) {
        return new Promise((resolve, reject) => {

            // Query to Search Database for any entries that have names that contain a given string or match the appid and are of type game
            // Prefer Results That More closely match the given string and sort alphabetically.
            const query = "SELECT appid, name, type\n" +
                "FROM appinfo\n" +
                "WHERE (name LIKE ? OR CAST(appid AS CHAR) = ?) AND type = 'game'\n" +
                "ORDER BY CHAR_LENGTH(name) - CHAR_LENGTH(REPLACE(name, ?, '')) ASC, name ASC\n" +
                "LIMIT 25"
            const likeStr = `%${str}%`;

            // Send Query to Database
            this.pool.query(query, [likeStr, str, likeStr], (error, results, fields) => {
                if(error) {
                    reject(error);
                }
                else {
                    resolve(results);
                }
            });
        });
    }
}

// *** Export Functions ***
module.exports = {AppHandler};