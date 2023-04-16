'use strict';

const e = React.createElement;

class Client extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            searchInputText: "", // Search Input

            detailsTable: 0, // 0 For Details, 1 For Achievements
            searchData: null, // Search Results

            appid: null, // App ID
            gameData: null, // Game Display

            steamid: null, // User Steam ID
            userInfo: null // User Info
        };

        // SocketIO
        this.socket = io();
        this.socketIOEvents();

        // * Bind React Events *
        this.onSearchInputChange = this.onSearchInputChange.bind(this);
        this.onSearchResultClick = this.onSearchResultClick.bind(this);
        this.onBackClick = this.onBackClick.bind(this);
        this.onAppSectionSwap = this.onAppSectionSwap.bind(this);
        this.onUserSync = this.onUserSync.bind(this);
    }

    // *** SocketIO Events ***
    /**
     * Function to bind client SocketIO Events
     * WARNING: Only Call From Constructor
     */
    socketIOEvents() {
        // Check Parameters
        this.checkURLParams();

        // TESTING REMOVE ME
        this.socket.on('test', data => {
            console.log(data);
        });
    }

    /**
     * Function to check client for URL parameters upon connection and handle accordingly
     * steamid: Sets State steamid
     * appid: Calls Selection for appid
     * WARNING: Only Call From Constructor
     */
    checkURLParams() {
        // Check for appid and steamid parameters
        const params = new URLSearchParams(window.location.search);
        const appid = removeNonDigits(params.get('appid') ?? ''); // App ID
        const steamid = removeNonDigits(params.get('steamid') ?? ''); // Steam User ID

        // If steamid In URL, Set State
        if(steamid) {
            this.state.steamid = steamid; // Set steamid
            console.log(`Set steamid On Load: ${steamid}`);
        }

        // If appid In URL, load page
        if(appid) {
            this.getAppData(appid);
            console.log(`Fetched App Data On Load: ${appid}`);
        }
    }

    /**
     * Function to update the current client url with appid and steamid
     * @param def - boolean: On true, sets url to default; On false, sets appid and/or steamid
     */
    updateURL(def = false) {
        let newURL = window.location.pathname; // Get Default url

        const appid = this.state.appid; // Get appid from state
        const steamid = this.state.steamid; // Get steamid from state

        // If Not Set Default
        if(!def) {
            // Add Necessary parameters to url
            if(appid && steamid)  {
                newURL += `?appid=${appid}&steamid=${steamid}`
            }
            else if(appid) {
                newURL += `?appid=${appid}`;
            }
            else if(steamid) {
                newURL += `?steamid=${steamid}`;
            }
        }
        // Set steamid if needed
        else if(steamid) {
            newURL += `?steamid=${steamid}`;
        }

        // Set Current URL to newURL
        window.history.replaceState(null, null, newURL);
    }

    // *** React Events ***
    /**
     * Function to update searchInputText and searchData from state
     * @param event is the React event - Input
     */
    onSearchInputChange(event) {
        event.preventDefault();

        const MIN_LENGTH = 3; // Minimum Search String Size
        const inputStr = event.target.value;

        // If Input < MIN_LENGTH characters
        if (inputStr.length < MIN_LENGTH) {
            this.setState({
                searchInputText: "",
                searchData: null
            });
        }

        // Get Search Results from Server
        else {
            this.socket.emit('search', inputStr, response => {
                this.setState({
                    searchInputText: inputStr,
                    searchData: response
                });
            });
        }
    }

    /**
     * Function to handle clicking of search result on search page
     * @param event is the React event - Button
     */
    onSearchResultClick(event) {
        event.preventDefault();

        // Get appid from button
        const appid = parseInt(event.target.id);

        // Calls getAppData with appid
        this.getAppData(appid);
    }

    /**
     * Function to handle the back button event
     * @param event is the React event - Button
     */
    onBackClick(event) {
        event.preventDefault();

        // Update the URL to default
        this.updateURL(true);

        // Update State, defaulting table selection and clearing gameData
        this.setState({
            detailsTable: 0,
            appid: null,
            gameData: null
        });
    }

    /**
     * Function to swap which section of the app details page to display (Details or Achievements)
     * @param event is the React event - Button
     */
    onAppSectionSwap(event) {
        // Get id from button
        const id = event.target.id;

        // If id is 1 (Details Button) set current section to 1
        // If id is 0 (Achievements Button) set current section to 0
        let setting = (id === '1' ? 1 : 0);

        // Update State
        this.setState({
            detailsTable: setting
        });
    }

    /**
     * Function to handle manual syncing of steamid
     * @param event is the React event - Button
     */
    onUserSync(event) {
        event.preventDefault();

        // Get steamid from input
        let steamid = document.getElementById('userSyncInput').value;
        if(steamid) {
            steamid = removeNonDigits(steamid); // Remove any non-digits

            // Update steamid in state
            this.setState({
                steamid: steamid
            });
        }


        // Get appid from state
        const appid = this.state.appid;

        // If Both Valid, Update User Data in state
        if(steamid && appid) {
            this.getUserData(appid, steamid);
        }
    }

    /**
     * Function to fetch App Data from server with given appid
     * > Will Update userData if currently valid steamid and achievement data fetched
     * @param appid is the given appid
     */
    getAppData(appid) {

        // Send select request to server with appid argument and callback
        this.socket.emit('select', appid, response => {
            // Error Response
            if (!response) {
                alert(`No Result Retrieved For appid ${appid}. 
                Either that appid does not exist or We have reached the Steam Web API RateLimit and it has not been cached yet.
                Please Try Again in 5 Minutes`);

                // Set URL To Default
                this.updateURL(true);
                return;
            }

            // Update URL
            this.state.appid = appid; // Force Appid Update for URL Change
            this.updateURL();
            console.log(response); // LOG RESPONSE

            // If Achievements and steamid are valid, get User Data
            const achievements = response.achievements;
            const steamid = this.state.steamid;
            if(achievements && steamid) {
                this.getUserData(appid, steamid);
            }

            // Scroll Window to Top
            window.scrollTo({
                top: 0,
                behavior: 'instant'
            });

            // Update State appid and gameData
            this.setState({
                gameData: response,
            });
        });
    }

    /**
     * Function to fetch User Data from the server with given appid and steamid
     * @param appid is the given appid
     * @param steamid is the given steamid
     */
    getUserData(appid, steamid) {
        // Compile into object
        const data = {
            appid: appid,
            steamid: steamid
        }

        // Send userData request to server with (appid, steamid) argument and callback
        this.socket.emit('userData', data, response => {
            // Update the URL
            this.updateURL();
            console.log(response);

            this.setState({
                userInfo: response,
            });

        });
    }


    // *** Build App Components ***

    // *** Search Page ***

    /**
     * Function to Build The Search Page of the App
     * @returns The Div Containing the Current Search Page
     */
    buildSearchPage() {

        // Create Search Input
        const searchInput = <div className='searchInput'>
            <input type="text" defaultValue={this.state.searchInputText} id="searchInput"
                   placeholder='Search By Name or App ID' onChange={this.onSearchInputChange}/>
            <img className='logoImg' src="https://cdn.discordapp.com/attachments/1096875004899115038/1096946029917651034/SteamInsight-Logo.png"  alt="header_image"/>
        </div>

        const default_img = 'https://cdn.discordapp.com/attachments/1096875004899115038/1097057623653744680/header-2.png';

        // Create Results Button Array
        const searchData = this.state.searchData;
        if(searchData && searchData.length > 0) {
            let results = [];
            for(const data of searchData) {

                // Prevent Clicking Button Contents
                const noClick = {
                    pointerEvents: 'none'
                }
                
                // Button Contents
                const img = data.header_image ?? default_img;
                const appidStr = `${data.appid ?? 'N/A'}`;

                // Create New Button
                const newButton = <button id={data.appid} key={data.appid} onClick={this.onSearchResultClick}>
                    <img style={noClick} className='searchImg' src={img}  alt="header_image"/>
                    <div style={noClick} className='searchText'>
                        <h3 style={noClick}>{data.name}</h3>
                        <h4 style={noClick}>{appidStr}</h4>
                    </div>
                </button>;
                results.push(newButton);
            }

            // Create Results Div
            const resultsDiv = <div className='searchDiv'>
                <div className='searchResultsContainer'>
                    <div className='searchResults'>
                        {results}
                    </div>
                </div>
            </div>

            // Return Search With Results
            return <div className='searchDiv'>
                {searchInput}
                {resultsDiv}
            </div>;
        }

        // Return Search Without Results
        return <div className='searchDiv'>
            {searchInput}
        </div>;
    }

    // *** Game Page ***

    /**
     * Function to build the App Info Page
     * @returns Div Containing The Current App Info Page
     */
    buildGamePage() {
        // Get Game Data from State
        const gameData = this.state.gameData;

        // Setup Style for gameDiv Game Background
        const divStyle = {
            backgroundImage: `url(${gameData.background})`,
        };

        // Create Title Div
        const titleDiv = <div className='titleContainer'>
            <div className='titleText'>
                <h2>{gameData.name}</h2>
                <h4>{gameData.short_description}</h4>
            </div>
            <img src={gameData.header_image} alt="header_image"/>
        </div>

        // Create Section Switch Buttons
        const switchButtons = <div className='swapButtons'>
            <button id='0' disabled={this.state.detailsTable === 0} onClick={this.onAppSectionSwap}><i
                className="fa-solid fa-circle-info"></i> Details</button>
            <button id='1' disabled={this.state.detailsTable === 1} onClick={this.onAppSectionSwap}><i
                className="fa-solid fa-trophy"></i> Achievements</button>
        </div>

        // Build Table Depending on the current state
        const table = this.state.detailsTable === 0 ? this.buildDetailsTable() : this.buildAchievementsTable();

        // Return App Details Page
        return <div className='gameDiv' style={divStyle}>
            <button className='backButton' onClick={this.onBackClick}><i className="fa-solid fa-angles-left"></i> Back To Search</button>
            {titleDiv}
            {switchButtons}
            {table}
        </div>;
    }

    /**
     * Function To Build The Details Section of the App Info Page
     * @returns Div Containing The Current Details Section
     */
    buildDetailsTable() {
        // Get GameData
        const gameData = this.state.gameData;

        // *** Format All App Details ***

        // Setup Table
        const appid = gameData.appid ?? 'N/A';
        const publishers = gameData.publishers?.join(', ') ?? 'N/A';
        const developers = gameData.developers?.join(', ') ?? 'N/A';
        const release_date = gameData.release_date?.date ?? 'N/A';
        const dlc = gameData.dlc?.join(', ') ?? 'No DLC';
        const price = gameData.price_overview?.final_formatted ? `${gameData.price_overview?.final_formatted} USD` : 'Free To Play';
        const legal = gameData.legal_notice ? removeHTMLFromString(gameData.legal_notice) : 'N/A';

        // Compile Platform String
        const platformArr = [];
        gameData.platforms?.windows && platformArr.push('Windows');
        gameData.platforms?.mac && platformArr.push('Mac');
        gameData.platforms?.linux && platformArr.push('Linux');
        const platforms = platformArr.join(', ') ?? 'N/A';

        const controller_support = gameData.controller_support ? capitalizeString(gameData.controller_support) : 'None';

        let support_url = gameData.support_info?.url;
        support_url = support_url && support_url.length > 0 ? removeHTMLFromString(support_url) : 'N/A';

        let support_email = gameData.support_info?.email;
        support_email = support_email && support_email.length > 0 ? removeHTMLFromString(support_email) : 'N/A';


        const languages = gameData.supported_languages ? removeHTMLFromString(gameData.supported_languages) : 'N/A';

        // Return Built Details Table Div
        return <div className='detailsTable'>
            <table>
                <tbody>
                <tr>
                    <td>App ID</td>
                    <td>{appid}</td>
                </tr>
                <tr>
                    <td>Publishers</td>
                    <td>{publishers}</td>
                </tr>
                <tr>
                    <td>Developers</td>
                    <td>{developers}</td>
                </tr>
                <tr>
                    <td>Release Date</td>
                    <td>{release_date}</td>
                </tr>
                <tr>
                    <td>DLC IDs</td>
                    <td>{dlc}</td>
                </tr>
                <tr>
                    <td>Current Price</td>
                    <td>{price}</td>
                </tr>
                <tr>
                    <td>Legal Notice</td>
                    <td>{legal}</td>
                </tr>
                <tr>
                    <td>Platforms</td>
                    <td>{platforms}</td>
                </tr>
                <tr>
                    <td>Languages</td>
                    <td>{languages}</td>
                </tr>
                <tr>
                    <td>Controller Support</td>
                    <td>{controller_support}</td>
                </tr>
                <tr>
                    <td>Support URL</td>
                    <td>{support_url}</td>
                </tr>
                <tr>
                    <td>Support Email</td>
                    <td>{support_email}</td>
                </tr>
                </tbody>
            </table>
        </div>;
    }

    /**
     * Function to Build Achievement Section Div
     * @returns Current Acheivement Section Div
     */
    buildAchievementsTable() {
        // Get Achievement List from state
        const achievements = this.state?.gameData?.achievements;

        // If No Achievements, Return Empty
        if (!achievements) {
            return <div className='achievementTable'>
                <h2 className='noticeH2'>No Achievements Found</h2>
            </div>
        }

        // Handle User Acievements
        const userAchievements = this.state.userInfo?.playerstats?.achievements;
        const userAchievementSet = new Set();
        if(userAchievements) {
            for(const achievement of userAchievements) {
                userAchievementSet.add(achievement.name);
            }
        }

        // Build Achievement Rows
        let rows = []
        let count = 1;

        if(userAchievements) {
            for (const achievement of achievements) {
                // Completed Achievement
                if(userAchievementSet.has(achievement.name)) {
                    rows.push(<tr key={`${count}`}>
                        <td className='completed'>{count}</td>
                        <td className='completed'><img className='iconImg' src={achievement.icon} alt="Achievement Image"/></td>
                        <td className='completed'>{achievement.displayName}</td>
                        <td className='completed'>{achievement.hidden}</td>
                        <td className='completed'>{achievement.description ?? 'Hidden Achievement'}</td>
                        <td className='completed'>Completed</td>
                    </tr>);
                }
                // Non-Completed Achievement
                else {
                    rows.push(<tr key={`${count}`}>
                        <td>{count}</td>
                        <td><img className='iconImg' src={achievement.icon} alt="Achievement Image"/></td>
                        <td>{achievement.displayName}</td>
                        <td>{achievement.hidden}</td>
                        <td>{achievement.description ?? 'Hidden Achievement'}</td>
                        <td>Not Completed</td>
                    </tr>);
                }
                count++;
            }
        }
        else {
            for (const achievement of achievements) {
                rows.push(<tr key={`${count}`}>
                    <td>{count}</td>
                    <td><img className='iconImg' src={achievement.icon} alt="Achievement Image"/></td>
                    <td>{achievement.displayName}</td>
                    <td>{achievement.hidden}</td>
                    <td>{achievement.description ?? 'Hidden Achievement'}</td>
                </tr>);
                count++;
            }
        }

        // Setup Notice Banner For Issues With Achievement Syncing
        let infoBanner = null;
        // Invalid Steam ID
        if(!this.state.userInfo && this.state.steamid) {
            infoBanner = <div className='settingsWarning'>
                <h2>Invalid Steam ID</h2>
                <h4>The ID You Have Entered Is Invalid, Please Check It And Try Again</h4>
            </div>;
        }

        // Valid Steam ID
        else if(this.state.userInfo) {
            // Failed To Retrieve Data - May Be Private
            if(Object.keys(this.state.userInfo).length === 0) {
                infoBanner = <div className='settingsWarning'>
                    <h2>Error Retrieving User Achievement Data</h2>
                    <h4>If You Own This Game, Please Make Sure Your Steam Profile Setting 'Game Details' Is Set to Public</h4>
                    <a href='https://steamcommunity.com/my/edit/settings' target='_blank'>Click Here To Check Your Privacy Settings</a>
                </div>;
            }
            // Success - No Achievements Recieved
            else if(!userAchievements) {
                infoBanner = infoBanner = <div className='settingsWarning'>
                    <h2>No Achievement Data Found</h2>
                    <h4>You Have Not Completed Any Achievements For This Game</h4>
                </div>;
            }
        }

        // Return Build Achievement Table
        return <div className='achievementTable'>
            <div className='userSyncDiv'>
                <input id='userSyncInput' type='number' min='0' maxLength='16' placeholder='Steam User ID' defaultValue={this.state.steamid ?? ''} onChange={this.onSteamIDChange}/>
                <button onClick={this.onUserSync}>Sync Achievements</button>
            </div>
            {infoBanner}
            <table>
                <thead>
                <tr><th>#</th>
                    <th>Icon</th>
                    <th>Name</th>
                    <th>Hidden</th>
                    <th>Description</th>
                    {userAchievements ? <th>Status</th> : null}
                </tr>

                </thead>
                <tbody>
                {rows}
                </tbody>
            </table>
        </div>;
    }


    // *** Page Render Functions ***

    /**
     * Function To Compile App
     * @returns Compiled App Stored In 'appDiv'
     */
    buildApp() {
        if (this.state.gameData) {
            return (<div className="appDiv">
                {this.buildGamePage()}
            </div>);
        } else {
            return (<div className="appDiv">
                {this.buildSearchPage()}
            </div>);
        }
    }


    // *** Main Render Function ***
    /**
     * Function Called To Render App On Client
     * @returns App To Render on Client
     */
    render() {
        return (this.buildApp());
    }
}

// *** Render App ***
const domContainer = document.querySelector('#root');
const root = ReactDOM.createRoot(domContainer);
root.render(e(Client));