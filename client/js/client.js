'use strict';

const e = React.createElement;

class Client extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            searchData: null // Search Results
        };

        // SocketIO
        this.socket = io();
        this.socketIOEvents();

        // * Bind React Events *
        this.onSearchInputChange = this.onSearchInputChange.bind(this);
        this.onSearchResultClick = this.onSearchResultClick.bind(this);


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
            console.log(`${appid}`);
            // emit appid
        }
        else if(steamid) {
            console.log(`${steamid}`);
            // emit steamid
        }
    }

    // *** React Events ***
    onSearchInputChange(event) {
        event.preventDefault();

        const str = event.target.value;

        // Set SearchData to null on empty
        if(str.length === 0) {
            this.setState({
                searchData: null
            });
        }

        // Get Search Results from Server
        if(str.length >= 3) {
            this.socket.emit('search', str, response => {
                this.setState({
                    searchData: response
                });
            });
        }
    }

    onSearchResultClick(event) {
        event.preventDefault();

        const appid = parseInt(event.target.id);

        this.socket.emit('select', appid, response => {
            /*
            this.setState({
                searchData: response
            });*/

            console.log(response);
        });


    }



    // *** Build Components ***

    // *** Search Page ***
    buildSearchPage() {
        return <div className='searchDiv'>
            {this.buildSearchInput()}
            {this.buildSearchResults()}
        </div>;
    }

    buildSearchInput() {
        // Create Search Input
        const search = <input type="text" id="searchInput" placeholder='Enter Game Name or App ID' onChange={this.onSearchInputChange}/>
        return(<div className='searchInput'>
            {search}
        </div>);
    }

    buildSearchResults() {
        const searchData = this.state.searchData;
        let results = null;

        if(searchData) {
            if(searchData.length === 0) {
                results = <label>No Results</label>
            }
            else {
                results = []
                for(const data of searchData) {
                    const text = `[${data.name}] [${data.appid}]`;
                    results.push(<button id={data.appid} key={data.appid} onClick={this.onSearchResultClick}>{text}</button>);
                }
            }
        }

        if(results) {
            return <div className='searchResults'>
                {results}
            </div>
        }
        return <div className='searchResults'>
        </div>

    }




    // *** Page Render Functions ***

    buildApp() {
        return (<div className="appDiv">
            {this.buildSearchPage()}
        </div>);
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