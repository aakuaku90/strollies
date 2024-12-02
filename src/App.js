// import logo from './logo.svg';

// import {useEffect, useState} from "react";
// import './App.css';
// import axios from 'axios';
// import Button from './components/Button';

// function App() {
//     const CLIENT_ID = "52218d0ffbd4446cb2f2710e17da11f3"
//     const REDIRECT_URI = "http://localhost:3000"
//     const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize"
//     const RESPONSE_TYPE = "token"

//     const [token, setToken] = useState("")
//     const [searchKey, setSearchKey] = useState("")
//     const [artists, setArtists] = useState([])

//     // const getToken = () => {
//     //     let urlParams = new URLSearchParams(window.location.hash.replace("#","?"));
//     //     let token = urlParams.get('access_token');
//     // }

//     useEffect(() => {
//         const hash = window.location.hash
//         let token = window.localStorage.getItem("token")

//         // getToken()


//         if (!token && hash) {
//             token = hash.substring(1).split("&").find(elem => elem.startsWith("access_token")).split("=")[1]

//             window.location.hash = ""
//             window.localStorage.setItem("token", token)
//         }

//         setToken(token)

//     }, [])

//     const logout = () => {
//         setToken("")
//         window.localStorage.removeItem("token")
//     }

//     const searchArtists = async (e) => {
//         e.preventDefault()
//         const {data} = await axios.get("https://api.spotify.com/v1/search", {
//             headers: {
//                 Authorization: `Bearer ${token}`
//             },
//             params: {
//                 q: searchKey,
//                 type: "artist"
//             }
//         })

//         setArtists(data.artists.items)
//     }

//     const renderArtists = () => {
//         return artists.map(artist => (
//             <div key={artist.id}>
//                 {artist.images.length ? <img width={"100%"} src={artist.images[0].url} alt=""/> : <div>No Image</div>}
//                 {artist.name}
//             </div>
//         ))
//     }

//     return (
//         <div className="App">
//           <Button text='Hello World'/>
//             <header className="App-header">
//                 <h1>Spotify React</h1>
//                 {!token ?
//                     <a href={`${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}`}>Login
//                         to Spotify</a>
//                     : <button onClick={logout}>Logout</button>}

//                 {token ?
//                     <form onSubmit={searchArtists}>
//                         <input type="text" onChange={e => setSearchKey(e.target.value)}/>
//                         <button type={"submit"}>Search</button>
//                     </form>

//                     : <h2>Please login</h2>
//                 }

//                 {renderArtists()}

//             </header>
//         </div>
//     );
// }

// export default App;


import { useEffect, useState } from "react";
import './App.css';
import axios from 'axios';
import Button from './components/Button';
import Playlist from './components/Playlist';
import TempMusicData from './data/TempMusicData';
import DropDown from './components/DropDown_Jeff';
import Locations from "./components/Locations";
import { LocationsContextProvider } from "./components/LocationsContext";

function App() {
    // const CLIENT_ID = "52218d0ffbd4446cb2f2710e17da11f3";
    const CLIENT_ID = 'b3cf5d98ec9745729c8703d6a22dcd6e';
    // Replace with your Spotify client ID
    const REDIRECT_URI = "http://localhost:3000/";
    const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
    const RESPONSE_TYPE = "token";

    const [token, setToken] = useState("");
    const [searchKey, setSearchKey] = useState("");
    const [tracks, setTracks] = useState([]);

    useEffect(() => {
        const hash = window.location.hash;
        let token = window.localStorage.getItem("token");

        if (!token && hash) {
            token = hash.substring(1).split("&").find(elem => elem.startsWith("access_token")).split("=")[1];
            window.location.hash = "";
            window.localStorage.setItem("token", token);
        }

        setToken(token);
    }, []);

    const logout = () => {
        setToken("");
        window.localStorage.removeItem("token");
    };

    const searchTracks = async (e) => {
        e.preventDefault();
        const { data } = await axios.get("https://api.spotify.com/v1/search", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            params: {
                q: searchKey,
                type: "track",
            },
        });

        setTracks(data.tracks.items);
    };

    const renderTracks = () => {
        return tracks.map(track => (
            <div key={track.id}>
                {track.album.images.length ? (
                    <img width={"100%"} src={track.album.images[0].url} alt="Album Cover" />
                ) : (
                    <div>No Image</div>
                )}
                <p><strong>Track Name:</strong> {track.name}</p>
                <p><strong>Artist(s):</strong> {track.artists.map(artist => artist.name).join(", ")}</p>
                <p><strong>Album:</strong> {track.album.name}</p>
            </div>
        ));
    };

    return (
        <div className="App">
            {/* COMPONENT TESTING START */}

            <LocationsContextProvider>
            <Locations />
            </LocationsContextProvider>
            
            <Button text='Button Component' />
            <Playlist songData={TempMusicData}/>
            <DropDown type='time' selection={[10, 20, 30, 40]} />
            

            {/* COMPONENT TESTING END */}

            <header className="App-header">
                <h1>Spotify Track Search</h1>
                {!token ? (
                    <a
                        href={`${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}`}
                    >
                        Login to Spotify
                    </a>
                ) : (
                    <button onClick={logout}>Logout</button>
                )}

                {token ? (
                    <form onSubmit={searchTracks}>
                        <input
                            type="text"
                            placeholder="Search for a track"
                            onChange={e => setSearchKey(e.target.value)}
                        />
                        <button type="submit">Search</button>
                    </form>
                ) : (
                    <h2>Please login</h2>
                )}

                <div className="track-results">{renderTracks()}</div>
            </header>
        </div>
    );
}

export default App;