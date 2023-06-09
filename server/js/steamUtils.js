const fetch = require("node-fetch");

// *** Public Functions ***

/**
 * Function to get app info from Steam Web API including its details and achievement list
 * @param appid is the given appid
 * @returns A Promise of all necessary app info (some of which may be null)
 */
function fetchAppInfo(appid) {
    // Combine API Calls for AppDetails and AppAchievements
    return Promise.all([getAppDetails(appid), getAppAchievements(appid)])
        .then(([appDetails, appAchievements]) => {

            if(!appDetails) {
                return null;
            }

            // Return Compiled Results
            return compileAppInfo(appDetails, appAchievements, appid);
        });
}

/**
 * Function to get user info from the Steam Web API pertaining to a given appid
 * @param appid is the given appid
 * @param steamid is the given steamid
 * @returns A Promise of user info for game on success or null on failure
 */
function fetchUserAchievements(appid, steamid) {
    const url = `https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v2/?appid=${appid}&key=${process.env.STEAM_API_KEY}&steamid=${steamid}`

    return getResponseFromURL(url).then(response => {
        return response;
    });
}

/**
 * Function to fetch steam user ID from given username
 * @param username is the given username
 * @returns A Promise Containing Steam ID on success or null on failure
 */
function fetchSteamID(username) {
    // Make API Call
    const url = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${process.env.STEAM_API_KEY}&vanityurl=${username}`
    return getResponseFromURL(url).then(data => {
        // Extract SteamID
        if(data.response.success === 1) {
            return data.response.steamid;
        }
        return null;
    });
}

// *** Export Functions ***
module.exports = {fetchAppInfo, fetchUserAchievements, fetchSteamID};


// *** Private Functions ***

/**
 * Function to make a fetch request to a given url and return its response as a JSON Object
 * @param url is the given url
 * @returns A Promise containing the JSON Response
 */
function getResponseFromURL(url) {
    //console.log(`>FETCHING DATA FROM STEAM WEB API<`);
    return fetch(url)
        .then(response => {return response.json();})
        .catch(() => {console.log(`Failed To Fetch Response From URL: ${url}`)});
}

/**
 * Function to get the app details for a given appid from the Steam Web API
 * @param appid is the given appid
 * @returns A Promise containing app details response or null on failure
 */
function getAppDetails(appid) {
    const url = `https://store.steampowered.com/api/appdetails?appids=${appid}&l=english`
    return getResponseFromURL(url).then(response => {
        return response;
    }).catch(error => {
        console.error(error);
    });
}

/**
 * Function to get the app achievements for a given appid from the Steam Web API
 * @param appid is the given appid
 * @returns A Promise containing app achievements response or null on failure
 * REQUIRED: Steam Web API Key as environment variable
 */
function getAppAchievements(appid) {
    const url = `https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${process.env.STEAM_API_KEY}&appid=${appid}`
    return getResponseFromURL(url).then(response => {
        return response;
    });
}

/**
 * Function to take appid, app details and app achievements and compile into a single object
 * @param appDetails is the given app details
 * @param appAchievements is the given app achievements
 * @param appid is the given appid
 * @returns The Compiled AppInfo
 */
function compileAppInfo(appDetails, appAchievements, appid) {

    // Return null if no details
    if(!appDetails) {
        return null;
    }
    // Get App Info From Response
    const details = appDetails[appid]?.data;

    if(!details) {
        return null;
    }

    // Extract Achievements If Exist
    const achievements = appAchievements?.game?.availableGameStats?.achievements;

    // Return Compiled Object
    return {
        appid: appid,
        name: details.name ?? null,
        website: details.website ?? null,
        type: details.type ?? null,
        header_image: details.header_image ?? null,
        is_free: details.is_free ?? null,
        legal_notice: details.legal_notice ?? null,
        about_the_game: details.about_the_game ?? null,
        background: details.background ?? null,
        background_raw: details.background_raw ?? null,
        short_description: details.short_description ?? null,
        detailed_description: details.detailed_description ?? null,
        controller_support: details.controller_support ?? null,
        price_overview: details.price_overview ?? null,
        release_date: details.release_date ?? null,
        supported_languages: details.supported_languages ?? null,
        developers: details.developers ?? null,
        publishers: details.publishers ?? null,
        dlc: details.dlc ?? null,
        platforms: details.platforms ?? null,
        support_info: details.support_info ?? null,
        achievements: achievements ?? null
    }
}



