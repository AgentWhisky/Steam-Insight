
const DEFAULT_CACHE_TIME = 60; // Max Cache Time In Minutes

const {isValidTime} = require("./generalUtils.js");

/**
 * Class - Used for storing and retrieving data with a maximum age
 */
class Cache {
    constructor(cacheTime) {
        if(cacheTime) {
            this.maxCacheTime = cacheTime;
        }
        else {
            this.maxCacheTime = DEFAULT_CACHE_TIME;
        }

        this._cache = {};
    }

    /**
     * Function to get data in cache for given key or null if dne or is old
     * @param key is the given key
     * @param allow_old is the boolean if the function should return old data (default false)
     */
    getData(key, allow_old = false) {
        // If Key is in cache
        if(key in this._cache) {
            // Get Entry From Key
            let entry = this._cache[key];
            if(entry == null) {
                return null;
            }

            // If allow_old is active, return
            if(allow_old) {
                return entry.data;
            }
            // Check Age
            else {
                if(isValidTime(entry.time, this.maxCacheTime)) {
                    return entry.data;
                }
            }
        }
        return null;
    }

    /**
     * Function to add key:data pair to cache if dne or update existing
     * @param key is the given key
     * @param data is the given data
     */
    update(key, data) {
        this._cache[key] = {
            'time': Date.now(), // Set Cache Time
            'data': data // Set Data
        };
    }
}

// *** Export Functions ***
module.exports = {Cache};