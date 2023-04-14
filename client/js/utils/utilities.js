/**
 * Function to remove HTML Tags from given string
 * @param str is the given string
 * @returns String with HTML Tags removed
 */
function removeHTMLFromString(str) {
    return str.replace(/(<([^>]+)>|\*)/gi, '');
}

/**
 * Function to capitalize the first letter of given string
 * @param str is the given string
 * @returns Capitalized string
 */
function capitalizeString(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

