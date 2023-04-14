'use strict';

const e = React.createElement;

class Client extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            inputText: "",
            detailsTable: 0,
            searchData: null, // Search Results
            gameData: null // Game Display
        };

        // SocketIO
        this.socket = io();
        this.socketIOEvents();

        // * Bind React Events *
        this.onSearchInputChange = this.onSearchInputChange.bind(this);
        this.onSearchResultClick = this.onSearchResultClick.bind(this);
        this.onBackClick = this.onBackClick.bind(this);
        this.onTableSwap = this.onTableSwap.bind(this);


    }

    // *** SocketIO Events ***
    /**
     * Function to bind client SocketIO Events
     */
    socketIOEvents() {
        // Check Parameters
        this.checkURLParams();


        // TESTING
        this.socket.on('test', data => {
            console.log(data)
        });
    }

    /**
     * Function to check client for URL parameters upon connection and send parameters to server
     */
    checkURLParams() {
        const params = new URLSearchParams(window.location.search);
        const appid = params.get('appid'); // App ID
        const steamid = params.get('steamid'); // Steam User ID

        if (appid && steamid) {
            console.log(`${appid}, ${steamid}`);
            // emit both params
        } else if (appid) {
            this.getSelectionResponse(appid);
        } else if (steamid) {
            console.log(`${steamid}`);
            // emit steamid
        }
    }

    updateURL(appid) {
        let newURL = window.location.pathname;
        if (appid) {
            newURL += '?appid=' + appid;
        }
        window.history.replaceState(null, null, newURL);
    }

    // *** React Events ***
    onSearchInputChange(event) {
        event.preventDefault();

        const str = event.target.value;

        // Set SearchData to null on empty
        if (str.length < 3) {
            this.setState({
                inputText: "",
                searchData: null
            });
        }

        // Get Search Results from Server
        if (str.length >= 3) {
            this.socket.emit('search', str, response => {
                this.setState({
                    inputText: str,
                    searchData: response
                });
            });
        }
    }

    onSearchResultClick(event) {
        event.preventDefault();
        const appid = parseInt(event.target.id);

        this.getSelectionResponse(appid)
    }

    onBackClick(event) {
        event.preventDefault();

        this.updateURL(null);
        this.setState({
            detailsTable: 0,
            gameData: null
        });
    }

    onTableSwap(event) {
        const id = event.target.id;

        if (id === '0') {
            this.setState({
                detailsTable: 0
            });
        } else {
            this.setState({
                detailsTable: 1
            });
        }
    }

    getSelectionResponse(appid) {
        this.socket.emit('select', appid, response => {
            if (!response) {
                alert(`No Result Retrieved For appid ${appid}. 
                Either that appid does not exist or We have reached the Steam Web API RateLimit and it has not been cached yet.
                Please Try Again in 5 Minutes`);
            }
            this.updateURL(appid);
            console.log(response);

            this.setState({
                gameData: response
            });
        });
    }


    // *** Build Components ***

    // *** Search Page ***
    buildSearchPage() {
        if (this.state.searchData) {
            return <div className='searchDiv'>
                {this.buildSearchInput()}
                {this.buildSearchResults()}
            </div>;
        }
        return <div className='searchDiv'>
            {this.buildSearchInput()}
            <img src="https://cdn.discordapp.com/attachments/889961009966637106/1096243934231015504/steam_logo.png"  alt="header_image"/>
        </div>;
    }

    buildSearchInput() {
        // Create Search Input
        const search = <input type="text" defaultValue={this.state.inputText} id="searchInput"
                              placeholder='Search Name or App ID' onChange={this.onSearchInputChange}/>
        return (<div className='searchInput'>
            {search}
        </div>);
    }

    buildSearchResults() {
        const searchData = this.state.searchData;
        let results = null;

        if (searchData) {
            if (searchData.length > 0) {
                results = []
                for (const data of searchData) {
                    let newButton = <button id={data.appid} key={data.appid} onClick={this.onSearchResultClick}>
                        <h2 style={{pointerEvents: 'none'}}>{data.name}</h2>
                        <h3 style={{pointerEvents: 'none'}}>{data.appid}</h3>
                    </button>;
                    results.push(newButton);
                }
            } else {
                results = [];
            }
        }

        if (results) {
            return <div className='searchResultsContainer'>
                <h2>Search Results: {this.state.searchData.length}</h2>
                <div className='searchResults'>
                    {results}
                </div>
            </div>

        }
        return <div className='searchResults'>
        </div>

    }

    // *** Game Page ***
    buildGamePage() {
        const gameData = this.state.gameData;

        const divStyle = {
            backgroundImage: `url(${gameData.background})`,
        };

        const titleDiv = <div className='titleContainer'>
            <div className='titleText'>
                <h2>{gameData.name}</h2>
                <h4>{gameData.short_description}</h4>
            </div>
            <img src={gameData.header_image} alt="header_image"/>
        </div>

        const switchButtons = <div className='swapButtons'>
            <button id='0' disabled={this.state.detailsTable === 0} onClick={this.onTableSwap}>Details</button>
            <button id='1' disabled={this.state.detailsTable === 1} onClick={this.onTableSwap}>Achievements</button>
        </div>

        const table = this.state.detailsTable === 0 ? this.buildDetailsTable() : this.buildAchievementsTable();

        return <div className='gameDiv' style={divStyle}>
            <button className='backButton' onClick={this.onBackClick}>Back To Search</button>
            {titleDiv}
            {switchButtons}
            {table}
        </div>;
    }

    buildDetailsTable() {
        const gameData = this.state.gameData;

        // Setup Table
        const appid = gameData.appid ?? 'N/A';
        const publishers = gameData.publishers?.join(', ') ?? 'N/A';
        const developers = gameData.developers?.join(', ') ?? 'N/A';
        const release_date = gameData.release_date?.date ?? 'N/A';
        const dlc = gameData.dlc?.join(', ') ?? 'No DLC';
        const f2p = gameData.is_free ? 'Free To Play' : 'Pay To Play';

        const price = gameData.price_overview?.final_formatted ? `${gameData.price_overview?.final_formatted} USD` : 'Free';

        // Legal Notice String - POSSIBLE HTML
        const legal = gameData.legal_notice ? removeHTMLFromString(gameData.legal_notice) : 'N/A';

        // Compile Platform String
        let platformArr = []
        gameData.platforms?.windows ? platformArr.push('Windows') : '';
        gameData.platforms?.mac ? platformArr.push('Mac') : '';
        gameData.platforms?.linux ? platformArr.push('Linux') : '';
        const platforms = platformArr.join(', ') ?? 'N/A';

        const controller_support = gameData.controller_support ? capitalizeString(gameData.controller_support) : 'None';

        let support_url = gameData.support_info?.url;
        if (support_url && support_url.length > 0) {
            support_url = removeHTMLFromString(support_url);
        } else {
            support_url = 'N/A';
        }
        
        

        let support_email = gameData.support_info?.email;
        if (support_email && support_email.length > 0) {
            support_email = removeHTMLFromString(support_email);
        } else {
            support_email = 'N/A';
        }

        const languages = gameData.supported_languages ? removeHTMLFromString(gameData.supported_languages) : 'N/A';


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
                    <td>Pay Requirments</td>
                    <td>{f2p}</td>
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

    buildAchievementsTable() {
        const achievements = this.state?.gameData?.achievements;

        if (!achievements) {
            return <div className='achievementTable'>
                <h2 className='noticeH2'>No Achievements</h2>
            </div>
        }

        let rows = []
        let count = 1;
        for (const achievement of achievements) {
            console.log(achievement);

            rows.push(<tr>
                <td>{count}</td>
                <td><img className='iconImg' src={achievement.icon} alt="Achievement Image"/></td>
                <td>{achievement.displayName}</td>
                <td>{achievement.hidden}</td>
                <td>{achievement.description ?? 'Hidden Achievement'}</td>
            </tr>);
            count++;
        }

        return <div className='achievementTable'>
            <table>
                <thead>
                <th>#</th>
                <th>Icon</th>
                <th>Name</th>
                <th>Hidden</th>
                <th>Description</th>
                </thead>
                {rows}
            </table>
        </div>;
    }


    // *** Page Render Functions ***

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

    render() {
        return (this.buildApp());
    }
}

// *** Render App ***
const domContainer = document.querySelector('#root');
const root = ReactDOM.createRoot(domContainer);
root.render(e(Client));