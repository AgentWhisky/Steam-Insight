'use strict';

const e = React.createElement;

class Client extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            inputText: "",
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

        if(appid && steamid) {
            console.log(`${appid}, ${steamid}`);
            // emit both params
        }
        else if(appid) {
            this.getSelectionResponse(appid);
        }
        else if(steamid) {
            console.log(`${steamid}`);
            // emit steamid
        }
    }

    updateURL(appid) {
        let newURL = window.location.pathname;
        if(appid) {
            newURL += '?appid=' + appid;
        }
        window.history.pushState({}, '', newURL);
    }

    // *** React Events ***
    onSearchInputChange(event) {
        event.preventDefault();

        const str = event.target.value;

        // Set SearchData to null on empty
        if(str.length < 3) {
            this.setState({
                inputText: "",
                searchData: null
            });
        }

        // Get Search Results from Server
        if(str.length >= 3) {
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
            gameData: null
        });
    }

    getSelectionResponse(appid) {
        this.socket.emit('select', appid, response => {
            if(!response) {
                alert(`No Data For ${appid} Retrieved, We May Have Reached RateLimit, Please Wait`);
            }

            this.updateURL(appid);
            this.setState({
                gameData: response
            });
        });
    }



    // *** Build Components ***

    // *** Search Page ***
    buildSearchPage() {
        if(this.state.searchData) {
            return <div className='searchDiv'>
                {this.buildSearchInput()}
                {this.buildSearchResults()}
            </div>;
        }
        return <div className='searchDiv'>
            {this.buildSearchInput()}
        </div>;
    }

    buildSearchInput() {
        // Create Search Input
        const search = <input type="text" defaultValue={this.state.inputText} id="searchInput" placeholder='Enter Name or App ID' onChange={this.onSearchInputChange}/>
        return(<div className='searchInput'>
            {search}
        </div>);
    }

    buildSearchResults() {
        const searchData = this.state.searchData;
        let results = null;

        if(searchData) {
            if(searchData.length > 0) {
                results = []
                for(const data of searchData) {
                    let newButton = <button id={data.appid} key={data.appid} onClick={this.onSearchResultClick}>
                        <h2 style={{ pointerEvents: 'none' }}>{data.name}</h2>
                        <h3 style={{ pointerEvents: 'none' }}>{data.appid}</h3>
                    </button>;
                    results.push(newButton);
                }
            }
            else {
                results = [];
            }
        }

        if(results) {
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
        const divStyle = {
            backgroundImage: `url(${this.state.gameData.background})`,
        };

        const titleDiv = <div className='titleContainer'>
            <div className='titleText'>
                <h2>{this.state.gameData.name}</h2>
                <h4>{this.state.gameData.short_description}</h4>
            </div>
            <img src={this.state.gameData.header_image} alt="header_image"/>
        </div>


        return <div className='gameDiv' style={divStyle}>
            <button className='backButton' onClick={this.onBackClick}>Back To Search</button>
            {titleDiv}
        </div>;
    }




    // *** Page Render Functions ***

    buildApp() {
        if(this.state.gameData) {
            return (<div className="appDiv">
                {this.buildGamePage()}
            </div>);
        }
        else {
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