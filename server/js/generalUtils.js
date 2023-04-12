/**
 * Function to check if time is valid (less than or equal to given age)
 * @param time is the time to check (In Milli)
 * @param age is the maximum age in minutes
 */
function isValidTime(time, age) {
    return ((Date.now() - time) / (1000 * 60)) <= age;
}


// *** Export Functions ***
module.exports = {isValidTime};