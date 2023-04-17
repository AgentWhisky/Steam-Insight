// Imports
const mysql = require('mysql2');
const {Cache} = require("./cache.js");
const {getAppInfo, getUserAchievements} = require("./steamUtils");

// Database Info
const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;

/**
 * Class - Used For Handling Searching and Retrieving Game Details, Caches Results
 */
class AppHandler {
    constructor() {
        // Cache for storing AppInfo (From Steam Web API)
        this.appInfoCache = new Cache();

        // Cache for storing App List (From Database)
        this.appListCache = new Cache();

        // Cache for storing User Info (From Steam Web API)
        this.userInfoCache = new Cache(5); // 5 Minute Cache

        // Cache for storing Appid List (From Database)
        this.appCache = new Cache(10);

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
        // *** Game Info ***
        // Check Cache For Game Info
        const appInfo = this.appInfoCache.getData(appid);
        if(appInfo) {
            return Promise.resolve(appInfo);
        }

        // Check Valid Appid
        return this._isValidAppid(appid).then(valid => {
            if(valid) {
                // Get Game Info From API and Update Cache
                return getAppInfo(appid).then(appInfo => {
                    this.appInfoCache.update(appid, appInfo);
                    return appInfo;
                });
            }
            return Promise.resolve(null);
        });

    }

    /**
     * Function to get user info for given appid and steamid pair
     * @param appid is the given appid
     * @param steamid is the given steamid
     * @returns A Promise of user info on success or null on failure
     * REQUIRED: Use then() when calling function
     */
    getUserInfo(appid, steamid) {
        // Cache Key
        const key = `${appid};${steamid}`;

        // Check Cache For User Info
        const userInfo = this.userInfoCache.getData(key);
        if(userInfo) {
            return Promise.resolve(userInfo);
        }

        // Check Valid Appid
        return this._isValidAppid(appid).then(valid => {
            if (valid) {
                // Get User Info For App From API and Update Cache
                return getUserAchievements(appid, steamid).then(userInfo => {
                    this.userInfoCache.update(key, userInfo);
                    return userInfo;
                });
            }
            return Promise.resolve(null);
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
            return Promise.resolve(null);
        }

        // Check Cache For Search Info
        const appList = this.appListCache.getData(str);
        if(appList != null) {
            return Promise.resolve(appList);
        }

        // Get Search Results from Database and Update Cache
        return this._getAppListFromString(str).then(results => {
            this.appListCache.update(str, results);
            return results;
        }).catch((error) => {
            console.error(error);
            return [] // Return Empty List in error
        });
    }

    // *** Private Functions ***

    /**
     * Function to Asynchronously Make A Query to Database For A Search Given a String
     * @param str is the given string
     * @returns A Promise of the result set
     * @private
     */
    _getAppListFromString(str) {

        // Query to Search Database for any entries that have names that contain a given string or match the appid and are of type game
        // Prefer Results That More closely match the given string and sort alphabetically.
        const query = "SELECT appid, name, type, header_image, background\n" +
            "FROM appinfo\n" +
            "WHERE (name LIKE ? OR CAST(appid AS CHAR) = ?) AND type = 'game'\n" +
            "ORDER BY CHAR_LENGTH(name) - CHAR_LENGTH(REPLACE(name, ?, '')) ASC, name ASC\n" +
            "LIMIT 60"
        const likeStr = `%${str}%`;

        const values = [likeStr, str, str]

        // Query Database and Return
        return this._queryDatabase(query, values).then(result => {
            return result;
        });

    }

    /**
     * Function to check if a given appid is valid
     * @param appid is the given appid
     * @returns A Promise of true if appid exists or false if does not
     * @private
     */
    _isValidAppid(appid) {
        // cache appid: boolean (true,false)
        const app = this.appCache.getData(appid);
        if(app != null) {
            return Promise.resolve(app); // Result Stored (True or False)
        }

        // Query To Check Database for appid
        const query = "SELECT COUNT(*) as count FROM AppInfo WHERE appid = ? AND type != 'invalid'";

        return this._queryDatabase(query, [appid]).then(result => {
            // Extract Result
            const valid = result[0].count > 0;

            // Cache Result
            this.appCache.update(appid, valid);

            return valid;
        });


    }

    /**
     * Function to query database with given query and value array
     * @param query is the query
     * @param values is the value array
     * @returns A Promise of query results on success or null on failure
     * @private
     */
    _queryDatabase(query, values) {
        //console.log(`>FETCHING DATA FROM DATABASE<`);
        return new Promise((resolve, reject) => {
            // Send Query to Database
            this.pool.query(query, values ?? [], (error, results, fields) => {
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