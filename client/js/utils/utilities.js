/**
 * Function to remove HTML Tags from given string
 * @param str is the given string
 * @returns String with HTML Tags removed
 */
function removeHTMLFromString(str) {
    return str.replace(/(<([^>]+)>|\*)/gi, '');
}

/**
 * Function to remove any non-digits from a given string
 * @param str is the given string
 * @returns String with non-digit characters removed
 */
function removeNonDigits(str) {
    return str.replace(/\D/g, '');
}

/**
 * Function to capitalize the first letter of given string
 * @param str is the given string
 * @returns Capitalized string
 */
function capitalizeString(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

